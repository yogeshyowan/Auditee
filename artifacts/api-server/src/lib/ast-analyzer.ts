/**
 * Tree-sitter AST analyzer (gap 5: legacy code analysis with real AST parsers).
 *
 * Uses web-tree-sitter (WASM, no native compile) to load language grammars
 * from `tree-sitter-wasms` on demand. For each supported language we walk
 * the AST to extract:
 *   - structural symbols (functions / methods / classes / type defs)
 *   - import / dependency edges
 *   - call graph edges (call expressions + new expressions)
 *   - cyclomatic-complexity estimates (per function, by counting branch nodes)
 *   - candidate business rules (conditional expressions whose source text
 *     contains domain-policy keywords)
 *
 * Grammars currently bundled by `tree-sitter-wasms@0.1.13` (36 languages):
 *   bash, c, cpp, c_sharp, css, dart, elixir, elm, embedded_template, go,
 *   html, java, javascript, json, kotlin, lua, objc, ocaml, php, python, ql,
 *   rescript, ruby, rust, scala, solidity, swift, systemrdl, tlaplus, toml,
 *   tsx, typescript, vue, yaml, zig, elisp.
 *
 * For mainframe / legacy languages NOT covered by tree-sitter-wasms (COBOL,
 * JCL, RPG, ABAP, PL/I, Fortran), the caller falls back to the deterministic
 * regex analyzer in `code-analyzer.ts` — which is the industry-standard
 * approach for column-oriented mainframe syntax anyway.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { promises as fs } from "node:fs";
import { logger } from "./logger.js";
import type { CodeAnalysis, CodeSymbol } from "./code-analyzer.js";

// Resolve tree-sitter-wasms grammar bundle path from node_modules at runtime.
// Using createRequire so this works in both ESM build output and Node ESM dev.
const requireFromHere = createRequire(import.meta.url);

let grammarsRoot: string | null = null;
function getGrammarsRoot(): string | null {
  if (grammarsRoot) return grammarsRoot;
  try {
    const pkg = requireFromHere.resolve("tree-sitter-wasms/package.json");
    grammarsRoot = path.join(path.dirname(pkg), "out");
    return grammarsRoot;
  } catch {
    return null;
  }
}

// Map our internal language id (file-extension or human name) → grammar wasm
// filename in tree-sitter-wasms/out. Entries omitted from this map fall back
// to regex.
const GRAMMAR_MAP: Record<string, string> = {
  // C family
  c: "c", h: "c",
  cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hxx: "cpp",
  csharp: "c_sharp", cs: "c_sharp", "c#": "c_sharp",
  objc: "objc", m: "objc", mm: "objc",
  // JVM
  java: "java", kotlin: "kotlin", kt: "kotlin", scala: "scala",
  // .NET / others
  // JS / TS
  javascript: "javascript", js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript",
  typescript: "typescript", ts: "typescript",
  tsx: "tsx",
  // Systems
  go: "go",
  rust: "rust", rs: "rust",
  zig: "zig",
  // Scripting
  python: "python", py: "python",
  ruby: "ruby", rb: "ruby",
  php: "php",
  lua: "lua",
  bash: "bash", sh: "bash",
  // Functional
  elixir: "elixir", ex: "elixir", exs: "elixir",
  ocaml: "ocaml",
  elm: "elm",
  rescript: "rescript",
  // Mobile / contracts
  swift: "swift",
  dart: "dart",
  solidity: "solidity", sol: "solidity",
  // Web
  html: "html",
  css: "css",
  vue: "vue",
  // Data / config
  yaml: "yaml", yml: "yaml",
  toml: "toml",
  json: "json",
  // Hardware / formal / templates
  systemrdl: "systemrdl",
  tlaplus: "tlaplus", tla: "tlaplus",
  ql: "ql",
  embedded_template: "embedded_template", erb: "embedded_template", ejs: "embedded_template",
  elisp: "elisp",
};

function normaliseLang(input: string | null | undefined): string {
  return (input ?? "").toLowerCase().trim();
}

export function isAstSupported(language: string | null | undefined): boolean {
  return GRAMMAR_MAP[normaliseLang(language)] !== undefined && getGrammarsRoot() !== null;
}

// ---- Parser singleton + grammar cache --------------------------------------

// Lazy import + init to keep cold-start fast and avoid loading the WASM
// runtime when no AI/legacy route is hit.
let parserInitPromise: Promise<typeof import("web-tree-sitter").Parser | null> | null = null;
const grammarCache = new Map<string, import("web-tree-sitter").Language>();

async function getParserClass(): Promise<typeof import("web-tree-sitter").Parser | null> {
  if (parserInitPromise) return parserInitPromise;
  parserInitPromise = (async () => {
    try {
      const mod = await import("web-tree-sitter");
      const ParserClass = mod.Parser ?? (mod as unknown as { default: { Parser: typeof mod.Parser } }).default?.Parser;
      if (!ParserClass) {
        logger.warn("web-tree-sitter Parser not found in module exports");
        return null;
      }
      // The runtime needs to locate web-tree-sitter.wasm next to the .cjs.
      // Web-tree-sitter handles this via its own file-resolution; just init.
      await ParserClass.init();
      return ParserClass;
    } catch (err) {
      logger.warn({ err }, "AST: web-tree-sitter init failed; AST analysis disabled");
      return null;
    }
  })();
  return parserInitPromise;
}

async function loadGrammar(grammarName: string): Promise<import("web-tree-sitter").Language | null> {
  const cached = grammarCache.get(grammarName);
  if (cached) return cached;
  const ParserClass = await getParserClass();
  if (!ParserClass) return null;
  const root = getGrammarsRoot();
  if (!root) return null;
  const file = path.join(root, `tree-sitter-${grammarName}.wasm`);
  try {
    const buf = await fs.readFile(file);
    const mod = await import("web-tree-sitter");
    const Lang = mod.Language ?? (mod as unknown as { default: { Language: typeof mod.Language } }).default?.Language;
    const lang = await Lang.load(new Uint8Array(buf));
    grammarCache.set(grammarName, lang);
    return lang;
  } catch (err) {
    logger.warn({ err, grammarName, file }, "AST: failed to load grammar");
    return null;
  }
}

// ---- Per-language node-type extractors -------------------------------------
//
// Tree-sitter node-type names are stable across grammar versions. We list the
// ones we care about per family. If a grammar uses a slightly different name
// it just gets ignored — analysis degrades gracefully rather than crashing.

type NodeKindMap = {
  function: string[];
  method: string[];
  class: string[];
  import: string[];
  call: string[];
  branch: string[]; // for cyclomatic complexity
  conditional: string[]; // for business-rule heuristic
};

const KINDS_C_LIKE: NodeKindMap = {
  function: ["function_definition", "function_declarator"],
  method: [],
  class: ["struct_specifier", "union_specifier", "enum_specifier"],
  import: ["preproc_include"],
  call: ["call_expression"],
  branch: ["if_statement", "for_statement", "while_statement", "do_statement", "case_statement", "switch_statement", "conditional_expression"],
  conditional: ["if_statement", "switch_statement", "conditional_expression"],
};

const KINDS_JS_TS: NodeKindMap = {
  function: ["function_declaration", "function_expression", "arrow_function", "generator_function_declaration"],
  method: ["method_definition"],
  class: ["class_declaration", "class_body"],
  import: ["import_statement", "import_clause"],
  call: ["call_expression", "new_expression"],
  branch: ["if_statement", "for_statement", "for_in_statement", "while_statement", "do_statement", "switch_statement", "ternary_expression", "catch_clause"],
  conditional: ["if_statement", "switch_statement", "ternary_expression"],
};

const KINDS_PYTHON: NodeKindMap = {
  function: ["function_definition"],
  method: [],
  class: ["class_definition"],
  import: ["import_statement", "import_from_statement"],
  call: ["call"],
  branch: ["if_statement", "for_statement", "while_statement", "try_statement", "conditional_expression"],
  conditional: ["if_statement", "conditional_expression"],
};

const KINDS_JAVA: NodeKindMap = {
  function: ["constructor_declaration"],
  method: ["method_declaration"],
  class: ["class_declaration", "interface_declaration", "enum_declaration", "record_declaration"],
  import: ["import_declaration"],
  call: ["method_invocation", "object_creation_expression"],
  branch: ["if_statement", "for_statement", "enhanced_for_statement", "while_statement", "do_statement", "switch_expression", "switch_statement", "ternary_expression", "catch_clause"],
  conditional: ["if_statement", "switch_statement", "switch_expression", "ternary_expression"],
};

const KINDS_CSHARP: NodeKindMap = {
  function: ["constructor_declaration", "local_function_statement"],
  method: ["method_declaration"],
  class: ["class_declaration", "interface_declaration", "struct_declaration", "record_declaration", "enum_declaration"],
  import: ["using_directive"],
  call: ["invocation_expression", "object_creation_expression"],
  branch: ["if_statement", "for_statement", "foreach_statement", "while_statement", "do_statement", "switch_statement", "switch_expression", "conditional_expression", "catch_clause"],
  conditional: ["if_statement", "switch_statement", "switch_expression", "conditional_expression"],
};

const KINDS_GO: NodeKindMap = {
  function: ["function_declaration"],
  method: ["method_declaration"],
  class: ["type_declaration"],
  import: ["import_declaration", "import_spec"],
  call: ["call_expression"],
  branch: ["if_statement", "for_statement", "type_switch_statement", "expression_switch_statement", "select_statement"],
  conditional: ["if_statement", "expression_switch_statement", "type_switch_statement"],
};

const KINDS_RUST: NodeKindMap = {
  function: ["function_item"],
  method: ["function_item"],
  class: ["struct_item", "enum_item", "trait_item", "impl_item"],
  import: ["use_declaration"],
  call: ["call_expression", "macro_invocation"],
  branch: ["if_expression", "match_expression", "for_expression", "while_expression", "loop_expression"],
  conditional: ["if_expression", "match_expression"],
};

const KINDS_RUBY: NodeKindMap = {
  function: ["method"],
  method: ["singleton_method"],
  class: ["class", "module"],
  import: ["call"], // require/require_relative — not perfect, regex augments
  call: ["call", "method_call"],
  branch: ["if", "unless", "case", "while", "until", "for", "ternary"],
  conditional: ["if", "unless", "case", "ternary"],
};

const KINDS_PHP: NodeKindMap = {
  function: ["function_definition"],
  method: ["method_declaration"],
  class: ["class_declaration", "interface_declaration", "trait_declaration"],
  import: ["namespace_use_declaration", "include_expression", "require_expression"],
  call: ["function_call_expression", "member_call_expression", "object_creation_expression"],
  branch: ["if_statement", "for_statement", "foreach_statement", "while_statement", "do_statement", "switch_statement", "match_expression", "conditional_expression", "catch_clause"],
  conditional: ["if_statement", "switch_statement", "match_expression", "conditional_expression"],
};

const KINDS_KOTLIN: NodeKindMap = {
  function: ["function_declaration"],
  method: ["function_declaration"],
  class: ["class_declaration", "object_declaration"],
  import: ["import_header"],
  call: ["call_expression"],
  branch: ["if_expression", "when_expression", "for_statement", "while_statement", "do_while_statement"],
  conditional: ["if_expression", "when_expression"],
};

function kindsForGrammar(g: string): NodeKindMap {
  switch (g) {
    case "javascript": case "typescript": case "tsx": return KINDS_JS_TS;
    case "python": return KINDS_PYTHON;
    case "java": return KINDS_JAVA;
    case "kotlin": return KINDS_KOTLIN;
    case "c_sharp": return KINDS_CSHARP;
    case "go": return KINDS_GO;
    case "rust": return KINDS_RUST;
    case "ruby": return KINDS_RUBY;
    case "php": return KINDS_PHP;
    case "scala": return KINDS_JAVA; // close enough
    case "swift": return KINDS_JAVA; // close enough
    case "dart": return KINDS_JS_TS; // close enough
    case "objc": return KINDS_C_LIKE;
    default: return KINDS_C_LIKE;
  }
}

// Domain-policy keywords used to flag conditional nodes as candidate business
// rules. Same vocabulary as the regex analyzer.
const RULE_KEYWORDS = /\b(must|shall|should|cannot|forbidden|require[ds]?|threshold|limit|max|min|cap|floor|ceiling|tolerance|percent|percentage|approve|reject|deny|grant|revoke|escalate|premium|discount|fee|tax|interest|balance|credit|debit|amount|quantity)\b/i;

// ---- Tree walker ------------------------------------------------------------

type TSNode = import("web-tree-sitter").Node;

function nameOf(node: TSNode, source: string): string {
  // Try common field names used by tree-sitter grammars.
  for (const f of ["name", "identifier", "declarator"]) {
    try {
      const child = node.childForFieldName(f);
      if (child) {
        const t = child.text ?? source.slice(child.startIndex, child.endIndex);
        if (t && t.length < 200) return t.trim();
      }
    } catch {
      /* some node types don't support childForFieldName */
    }
  }
  // Fallback: first identifier-like child.
  for (const c of node.namedChildren) {
    if (!c) continue;
    if (c.type.includes("identifier") || c.type === "name") {
      const t = source.slice(c.startIndex, c.endIndex);
      if (t && t.length < 200) return t.trim();
    }
  }
  return "<anon>";
}

function walkAst(root: TSNode, source: string, kinds: NodeKindMap): {
  symbols: CodeSymbol[];
  imports: string[];
  calls: { from: string; to: string }[];
  complexity: { fn: string; line: number; cyclomaticEstimate: number }[];
  rules: { line: number; pattern: string; snippet: string }[];
} {
  const symbols: CodeSymbol[] = [];
  const imports: string[] = [];
  const calls: { from: string; to: string }[] = [];
  const complexity: { fn: string; line: number; cyclomaticEstimate: number }[] = [];
  const rules: { line: number; pattern: string; snippet: string }[] = [];

  // Compute per-function cyclomatic complexity by walking the function's
  // subtree and counting branch nodes.
  function complexityFor(fnNode: TSNode): number {
    let count = 1;
    const stack: TSNode[] = [fnNode];
    while (stack.length) {
      const n = stack.pop()!;
      if (kinds.branch.includes(n.type)) count++;
      for (const c of n.namedChildren) {
        if (c) stack.push(c);
      }
    }
    return count;
  }

  // DFS, tracking the enclosing function so we can attribute call edges.
  function visit(node: TSNode, fnStack: string[]) {
    const enclosingFn = fnStack[fnStack.length - 1] ?? "<top>";
    let pushedFn = false;

    if (kinds.function.includes(node.type) || kinds.method.includes(node.type)) {
      const nm = nameOf(node, source);
      symbols.push({ kind: kinds.method.includes(node.type) ? "method" : "function", name: nm, line: node.startPosition.row + 1 });
      complexity.push({ fn: nm, line: node.startPosition.row + 1, cyclomaticEstimate: complexityFor(node) });
      fnStack.push(nm);
      pushedFn = true;
    } else if (kinds.class.includes(node.type)) {
      symbols.push({ kind: "class", name: nameOf(node, source), line: node.startPosition.row + 1 });
    } else if (kinds.import.includes(node.type)) {
      const text = source.slice(node.startIndex, node.endIndex).trim();
      // Strip leading keyword + trailing semicolon for a tidy display.
      const cleaned = text.replace(/^(import|use|using|require|include)\s+/i, "").replace(/;\s*$/, "").slice(0, 200);
      if (cleaned) imports.push(cleaned);
    } else if (kinds.call.includes(node.type)) {
      // Use the source slice of the function expression as the callee.
      let callee = "";
      try {
        const fn = node.childForFieldName("function") ?? node.namedChildren[0];
        if (fn) callee = source.slice(fn.startIndex, fn.endIndex);
      } catch {
        callee = source.slice(node.startIndex, Math.min(node.startIndex + 60, node.endIndex));
      }
      callee = callee.split(/[\s(]/)[0]?.slice(0, 80) ?? "";
      if (callee && !/^(if|for|while|switch|return|new|typeof)$/.test(callee)) {
        calls.push({ from: enclosingFn, to: callee });
      }
    }

    if (kinds.conditional.includes(node.type)) {
      const text = source.slice(node.startIndex, Math.min(node.startIndex + 240, node.endIndex));
      if (RULE_KEYWORDS.test(text)) {
        rules.push({ line: node.startPosition.row + 1, pattern: "ast-conditional+keyword", snippet: text.replace(/\s+/g, " ").trim().slice(0, 200) });
      }
    }

    for (const c of node.namedChildren) {
      if (c) visit(c, fnStack);
    }

    if (pushedFn) fnStack.pop();
  }

  visit(root, []);
  return { symbols, imports, calls, complexity, rules };
}

// ---- Entry point ------------------------------------------------------------

/**
 * Run AST analysis on the source. Returns null if the language is not in the
 * grammar map, the WASM runtime failed to init, or parsing crashed —
 * callers should then fall back to the regex `analyzeCode` analyzer.
 */
export async function analyzeCodeAst(source: string, language: string | null | undefined): Promise<CodeAnalysis | null> {
  const grammarName = GRAMMAR_MAP[normaliseLang(language)];
  if (!grammarName) return null;

  const ParserClass = await getParserClass();
  if (!ParserClass) return null;
  const grammar = await loadGrammar(grammarName);
  if (!grammar) return null;

  let parser: import("web-tree-sitter").Parser;
  try {
    parser = new ParserClass();
    parser.setLanguage(grammar);
  } catch (err) {
    logger.warn({ err, grammarName }, "AST: parser construction failed");
    return null;
  }

  let tree;
  try {
    tree = parser.parse(source);
  } catch (err) {
    logger.warn({ err, grammarName }, "AST: parse failed");
    return null;
  }
  if (!tree) return null;

  const kinds = kindsForGrammar(grammarName);
  const walked = walkAst(tree.rootNode, source, kinds);

  // De-duplicate.
  const callKey = new Set<string>();
  const callGraph = walked.calls.filter((c) => {
    const k = `${c.from}->${c.to}`;
    if (callKey.has(k)) return false;
    callKey.add(k);
    return true;
  });

  const lines = source.split(/\r?\n/);
  const loc = lines.filter((l) => l.trim().length > 0).length;

  const summary = [
    `Language: ${grammarName} (tree-sitter AST)`,
    `Lines of code: ${loc}`,
    `Functions/methods: ${walked.symbols.filter((s) => s.kind === "function" || s.kind === "method").length}`,
    `Classes / type defs: ${walked.symbols.filter((s) => s.kind === "class").length}`,
    `Imports / dependencies: ${walked.imports.length}`,
    `Call-graph edges: ${callGraph.length}`,
    `Likely business-rule conditionals: ${walked.rules.length}`,
  ].join("\n");

  // Free the WASM tree once we've copied data out.
  try { tree.delete(); } catch { /* noop */ }

  return {
    language: grammarName,
    loc,
    symbols: walked.symbols,
    imports: Array.from(new Set(walked.imports)),
    businessRules: walked.rules.slice(0, 60),
    callGraph,
    complexityHints: walked.complexity,
    summary,
  };
}
