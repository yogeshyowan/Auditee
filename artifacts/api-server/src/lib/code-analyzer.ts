/**
 * Static code analyzer pre-processor.
 *
 * Closes architectural gap 3 vs eltegra.ai: instead of pasting raw legacy
 * code into an LLM prompt and hoping it can trace control flow across
 * thousands of lines, we deterministically extract the structural skeleton
 * first (functions/methods/classes/imports/business-rule heuristics) and
 * pass that compact, language-aware summary to the model alongside selected
 * source excerpts.
 *
 * This is a regex / line-based parser, not a full AST builder — but it is
 * intentionally multi-language (TypeScript, JavaScript, Java, C#, C/C++,
 * Python, Go, Rust, Ruby, PHP, SQL, COBOL, JCL, ABAP) which is what legacy
 * modernization actually requires. A real Tree-sitter integration is the
 * obvious next iteration; the regex layer keeps the pipeline working today
 * with zero native deps.
 */

export type CodeSymbol = {
  kind: "function" | "method" | "class" | "module" | "import" | "constant" | "rule" | "paragraph" | "table";
  name: string;
  line: number;
  detail?: string;
};

export type CodeAnalysis = {
  language: string;
  loc: number; // lines of code (excluding blanks/comments where heuristically detectable)
  symbols: CodeSymbol[];
  imports: string[];
  businessRules: { line: number; pattern: string; snippet: string }[];
  callGraph: { from: string; to: string }[];
  complexityHints: { fn: string; line: number; cyclomaticEstimate: number }[];
  summary: string;
};

const COMMENT_PATTERNS: Record<string, RegExp[]> = {
  default: [/^\s*\/\//, /^\s*#/, /^\s*\*/],
  cobol: [/^\s{0,5}\*/],
  sql: [/^\s*--/],
  jcl: [/^\/\/\*/, /^\s*\/\*/],
};

function detectLanguage(language: string | undefined | null): string {
  const l = (language ?? "").toLowerCase();
  if (l === "cob" || l === "cbl" || l === "cobol" || l === "cpy") return "cobol";
  if (l === "jcl" || l === "prc") return "jcl";
  if (l === "abap") return "abap";
  if (l === "sql" || l === "ddl" || l === "psql") return "sql";
  if (l === "ts" || l === "tsx") return "typescript";
  if (l === "js" || l === "jsx" || l === "mjs" || l === "cjs") return "javascript";
  if (l === "py") return "python";
  if (l === "java") return "java";
  if (l === "kt") return "kotlin";
  if (l === "cs") return "csharp";
  if (l === "go") return "go";
  if (l === "rs") return "rust";
  if (l === "rb") return "ruby";
  if (l === "php") return "php";
  if (l === "c" || l === "h") return "c";
  if (l === "cpp" || l === "cc" || l === "cxx" || l === "hpp") return "cpp";
  return l || "unknown";
}

const RULE_PATTERNS = [
  /\b(if|when|case)\b[^\n]{0,200}\b(>|<|>=|<=|=|!=|==)\b/gi,
  /\b(must|shall|should|cannot|forbidden|require[ds]?)\b/gi,
  /\b(threshold|limit|max|min|cap|floor|ceiling|tolerance)\b/gi,
  /\b(percent|percentage|%)\b/gi,
  /\b(approve|reject|deny|grant|revoke|escalate)\b/gi,
];

function isComment(line: string, lang: string): boolean {
  const patterns = COMMENT_PATTERNS[lang] ?? COMMENT_PATTERNS.default;
  return patterns.some((p) => p.test(line));
}

// ---- Per-language extractors -----------------------------------------------

function analyzeJsTs(lines: string[], lang: string): { symbols: CodeSymbol[]; imports: string[]; calls: { from: string; to: string }[] } {
  const symbols: CodeSymbol[] = [];
  const imports: string[] = [];
  const calls: { from: string; to: string }[] = [];
  let currentFn = "<top>";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^\s*import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/))) imports.push(m[1]);
    else if ((m = line.match(/^\s*const\s+\w+\s*=\s*require\(['"]([^'"]+)['"]\)/))) imports.push(m[1]);
    if ((m = line.match(/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/))) {
      symbols.push({ kind: "function", name: m[1], line: i + 1 });
      currentFn = m[1];
    } else if ((m = line.match(/^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/))) {
      symbols.push({ kind: "class", name: m[1], line: i + 1 });
      currentFn = m[1];
    } else if ((m = line.match(/^\s*(?:public|private|protected|static)?\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/)) && lang !== "typescript") {
      // method-like (avoid false positives by being conservative)
      // Only count if line doesn't look like a control flow keyword
      const nm = m[1];
      if (!/^(if|for|while|switch|catch|return|throw)$/.test(nm)) {
        symbols.push({ kind: "method", name: nm, line: i + 1 });
      }
    } else if ((m = line.match(/^\s*(?:export\s+)?const\s+([A-Z_][A-Z0-9_]+)\s*=/))) {
      symbols.push({ kind: "constant", name: m[1], line: i + 1 });
    }
    // call extraction (very conservative)
    const callMatches = [...line.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)];
    for (const cm of callMatches) {
      const target = cm[1];
      if (/^(if|for|while|switch|return|catch|throw|new|typeof|console|require|import|function|class)$/.test(target)) continue;
      calls.push({ from: currentFn, to: target });
    }
  }
  return { symbols, imports, calls };
}

function analyzePython(lines: string[]): { symbols: CodeSymbol[]; imports: string[]; calls: { from: string; to: string }[] } {
  const symbols: CodeSymbol[] = [];
  const imports: string[] = [];
  const calls: { from: string; to: string }[] = [];
  let currentFn = "<module>";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^\s*(?:from\s+([\w.]+)\s+)?import\s+([\w., ]+)/))) {
      imports.push(m[1] ?? m[2].split(",")[0].trim());
    }
    if ((m = line.match(/^\s*def\s+([A-Za-z_]\w*)/))) {
      symbols.push({ kind: "function", name: m[1], line: i + 1 });
      currentFn = m[1];
    } else if ((m = line.match(/^\s*class\s+([A-Za-z_]\w*)/))) {
      symbols.push({ kind: "class", name: m[1], line: i + 1 });
      currentFn = m[1];
    }
    const callMatches = [...line.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)];
    for (const cm of callMatches) {
      const target = cm[1];
      if (/^(if|for|while|return|raise|print|len|range|str|int|list|dict|set|tuple|isinstance|self|super)$/.test(target)) continue;
      calls.push({ from: currentFn, to: target });
    }
  }
  return { symbols, imports, calls };
}

function analyzeJavaLike(lines: string[]): { symbols: CodeSymbol[]; imports: string[]; calls: { from: string; to: string }[] } {
  const symbols: CodeSymbol[] = [];
  const imports: string[] = [];
  const calls: { from: string; to: string }[] = [];
  let currentFn = "<top>";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^\s*import\s+([\w.*]+);/))) imports.push(m[1]);
    if ((m = line.match(/^\s*(?:public|private|protected|internal|static|final|abstract|\s)+\s*class\s+([A-Za-z_]\w*)/))) {
      symbols.push({ kind: "class", name: m[1], line: i + 1 });
      currentFn = m[1];
    } else if ((m = line.match(/^\s*(?:public|private|protected|internal|static|final|virtual|override|async|\s)+\s+\w[\w<>\[\],\s]*\s+([A-Za-z_]\w*)\s*\(/))) {
      const nm = m[1];
      if (!/^(if|for|while|switch|return|catch|throw)$/.test(nm)) {
        symbols.push({ kind: "method", name: nm, line: i + 1 });
        currentFn = nm;
      }
    }
  }
  return { symbols, imports, calls };
}

function analyzeCobol(lines: string[]): { symbols: CodeSymbol[]; imports: string[]; calls: { from: string; to: string }[] } {
  // COBOL programs are organised into DIVISIONs, SECTIONs and PARAGRAPHs.
  // PROGRAM-ID, COPY (imports), CALL (call graph) are the structurally useful tokens.
  const symbols: CodeSymbol[] = [];
  const imports: string[] = [];
  const calls: { from: string; to: string }[] = [];
  let currentPara = "<initial>";
  let inProcedure = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s{0,5}\*/.test(line)) continue; // comment
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^\s*PROGRAM-ID\.\s*([A-Z0-9-]+)/i))) {
      symbols.push({ kind: "module", name: m[1], line: i + 1 });
    }
    if ((m = line.match(/^\s*COPY\s+([A-Z0-9-]+)/i))) imports.push(m[1]);
    if (/PROCEDURE\s+DIVISION/i.test(line)) inProcedure = true;
    if (inProcedure && (m = line.match(/^\s{0,11}([A-Z0-9][A-Z0-9-]{2,})\.\s*$/i))) {
      symbols.push({ kind: "paragraph", name: m[1], line: i + 1 });
      currentPara = m[1];
    }
    if ((m = line.match(/\bCALL\s+['"]([A-Z0-9-]+)['"]/i))) {
      calls.push({ from: currentPara, to: m[1] });
    }
    if ((m = line.match(/\bPERFORM\s+([A-Z0-9-]+)/i))) {
      calls.push({ from: currentPara, to: m[1] });
    }
  }
  return { symbols, imports, calls };
}

function analyzeSql(lines: string[]): { symbols: CodeSymbol[]; imports: string[]; calls: { from: string; to: string }[] } {
  const symbols: CodeSymbol[] = [];
  const calls: { from: string; to: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;
    if ((m = line.match(/CREATE\s+TABLE\s+(\w+)/i))) symbols.push({ kind: "table", name: m[1], line: i + 1 });
    if ((m = line.match(/CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|PROCEDURE)\s+(\w+)/i)))
      symbols.push({ kind: "function", name: m[1], line: i + 1 });
    if ((m = line.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)/i))) symbols.push({ kind: "constant", name: m[1], line: i + 1 });
  }
  return { symbols, imports: [], calls };
}

// ---- Entry point ------------------------------------------------------------

export function analyzeCode(source: string, language?: string | null): CodeAnalysis {
  const lang = detectLanguage(language);
  const lines = source.split(/\r?\n/);
  const loc = lines.filter((l) => l.trim().length > 0 && !isComment(l, lang)).length;

  let parsed: { symbols: CodeSymbol[]; imports: string[]; calls: { from: string; to: string }[] };
  if (lang === "javascript" || lang === "typescript") parsed = analyzeJsTs(lines, lang);
  else if (lang === "python") parsed = analyzePython(lines);
  else if (lang === "java" || lang === "csharp" || lang === "kotlin") parsed = analyzeJavaLike(lines);
  else if (lang === "cobol") parsed = analyzeCobol(lines);
  else if (lang === "sql") parsed = analyzeSql(lines);
  else {
    // Generic fallback — extract anything that looks like a function-y name on
    // its own line. Better than nothing for unknown languages.
    parsed = analyzeJsTs(lines, lang);
  }

  // De-duplicate imports and call-graph edges.
  const imports = Array.from(new Set(parsed.imports));
  const callKey = new Set<string>();
  const callGraph = parsed.calls.filter((c) => {
    const k = `${c.from}->${c.to}`;
    if (callKey.has(k)) return false;
    callKey.add(k);
    return true;
  });

  // Cyclomatic-complexity estimate per function = 1 + count of branching keywords
  // within its line range.
  const complexityHints: CodeAnalysis["complexityHints"] = [];
  const fnSymbols = parsed.symbols.filter((s) => s.kind === "function" || s.kind === "method" || s.kind === "paragraph");
  for (let i = 0; i < fnSymbols.length; i++) {
    const start = fnSymbols[i].line - 1;
    const end = (fnSymbols[i + 1]?.line ?? lines.length) - 1;
    let branches = 0;
    for (let j = start; j < end; j++) {
      const l = lines[j] ?? "";
      branches += (l.match(/\b(if|else|elif|case|when|for|while|catch|&&|\|\||\?)\b/g) ?? []).length;
    }
    complexityHints.push({ fn: fnSymbols[i].name, line: fnSymbols[i].line, cyclomaticEstimate: 1 + branches });
  }

  // Business-rule heuristics — flag lines that look like they encode policy.
  const businessRules: CodeAnalysis["businessRules"] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isComment(line, lang)) continue;
    for (const pat of RULE_PATTERNS) {
      if (pat.test(line)) {
        businessRules.push({ line: i + 1, pattern: pat.source.slice(0, 60), snippet: line.trim().slice(0, 200) });
        break;
      }
    }
    if (businessRules.length >= 60) break; // cap
  }

  const summary = [
    `Language: ${lang}`,
    `Lines of code: ${loc}`,
    `Functions/methods/paragraphs: ${fnSymbols.length}`,
    `Classes: ${parsed.symbols.filter((s) => s.kind === "class").length}`,
    `Imports/copybooks: ${imports.length}`,
    `Call-graph edges: ${callGraph.length}`,
    `Likely business rules: ${businessRules.length}`,
  ].join("\n");

  return {
    language: lang,
    loc,
    symbols: parsed.symbols,
    imports,
    businessRules,
    callGraph,
    complexityHints,
    summary,
  };
}

/**
 * Render an analysis as a compact text block suitable for an LLM system prompt.
 * Caps each section so it stays under typical context budgets.
 */
export function formatAnalysisForPrompt(a: CodeAnalysis, opts?: { maxSymbols?: number; maxRules?: number; maxEdges?: number }): string {
  const maxSymbols = opts?.maxSymbols ?? 80;
  const maxRules = opts?.maxRules ?? 40;
  const maxEdges = opts?.maxEdges ?? 80;

  const top = a.complexityHints.slice().sort((x, y) => y.cyclomaticEstimate - x.cyclomaticEstimate).slice(0, 10);

  return [
    `# Static analysis summary`,
    a.summary,
    ``,
    `## Top symbols (first ${maxSymbols})`,
    a.symbols.slice(0, maxSymbols).map((s) => `- L${s.line} ${s.kind} ${s.name}`).join("\n"),
    ``,
    `## High-complexity functions`,
    top.map((c) => `- L${c.line} ${c.fn} (cyclomatic ~${c.cyclomaticEstimate})`).join("\n") || "- (none detected)",
    ``,
    `## Imports / dependencies`,
    a.imports.slice(0, 40).map((i) => `- ${i}`).join("\n") || "- (none)",
    ``,
    `## Call graph (sample, ${maxEdges} edges)`,
    a.callGraph.slice(0, maxEdges).map((e) => `- ${e.from} -> ${e.to}`).join("\n") || "- (none)",
    ``,
    `## Likely encoded business rules (first ${maxRules})`,
    a.businessRules.slice(0, maxRules).map((r) => `- L${r.line}: ${r.snippet}`).join("\n") || "- (none detected)",
  ].join("\n");
}
