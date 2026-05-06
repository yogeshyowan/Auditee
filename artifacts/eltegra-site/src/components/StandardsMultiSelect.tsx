import { useMemo, useState } from "react";
import { useListComplianceFrameworks } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, ChevronDown, Search, ShieldCheck, X } from "lucide-react";

type Framework = { id: string; code: string; name: string };

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  helper?: string;
  max?: number;
  disabled?: boolean;
  required?: boolean;
};

// Industry → framework codes that apply to that industry. A framework may
// belong to multiple industries (e.g. IEC 62443 is both Industrial/OT and
// Cybersecurity; CMMI 3.0 is both Software Engineering and General Quality).
// "all" is a sentinel for the default "all industries" option.
const INDUSTRY_FRAMEWORKS: Record<string, readonly string[]> = {
  all: [],
  automotive: [
    "ISO 26262",
    "ISO/SAE 21434",
    "ASPICE 4.0",
    "ASPICE Cybersecurity 2.0",
    "IATF 16949",
    "ISO 21448",
    "ISO 20077",
    "ISO 20078",
    "ISO 24089",
    "UNECE R155",
    "UNECE R156",
    "ISO 9001",
    "ISO 14001",
    "ISO 45001",
  ],
  aerospace: [
    "DO-178C",
    "AS9100",
    "AS9110",
    "AS9120",
    "DO-254",
    "ARP 4754A",
    "ARP 4761",
    "NADCAP",
    "EASA Part 21",
    "EASA Part 145",
  ],
  railway: [
    "EN 50128",
    "EN 50126",
    "EN 50129",
    "EN 50657",
    "EN 45545",
    "EN 50155",
    "EN 50159",
    "TS 22163",
    "UIC Standards",
  ],
  medical: [
    "IEC 62304",
    "ISO 13485",
    "21 CFR 820",
    "21 CFR 807",
    "21 CFR 814",
    "IEC 60601",
    "MDR 2017/745",
    "IVDR 2017/746",
    "IEC 62366",
    "ISO 14155",
    "ISO 14971",
    "21 CFR Part 11",
    "ISO 10993",
    "ISO 11607",
    "ISO 11135",
    "ISO 11137",
    "ISO 15223-1",
    "ISO 20417",
    "IEC 61010",
    "CLIA",
    "CAP",
    "EudraLex Vol 4",
  ],
  industrial: [
    "IEC 61508",
    "IEC 61511",
    "IEC 62443",
    "IEC 61131-3",
    "IEC 60204-1",
    "ISO 10218-1",
    "ISO 13849-1",
    "ISA-95",
    "NERC CIP",
    "API 1164",
    "ISO 9001",
    "ISO 14001",
    "ISO 45001",
    "ISO 50001",
    "IEC 62061",
    "ISO 13850",
    "ISO 14119",
    "API 570",
    "API 580",
    "API 581",
  ],
  cybersecurity: [
    "ISO/IEC 27001",
    "ISO/IEC 27002",
    "NIST CSF 2.0",
    "PCI DSS 4.0",
    "HIPAA",
    "SOC 2",
    "DORA",
    "NIS2",
    "NERC CIP",
    "API 1164",
    "IEC 62443",
    "ISO/SAE 21434",
    "ASPICE Cybersecurity 2.0",
    "21 CFR Part 11",
    "ISO 27017",
    "ISO 27018",
    "ISO 27701",
    "ISO 27035",
    "NIST 800-53",
    "NIST 800-171",
    "FedRAMP",
    "CMMC 2.0",
    "CSA STAR",
    "ISO/IEC 27034",
    "UNECE R155",
    "EN 50159",
    "FFIEC IT Handbook",
  ],
  privacy: [
    "GDPR",
    "HIPAA",
    "ISO 27701",
    "ISO 27018",
    "CCPA/CPRA",
    "PIPEDA",
    "LGPD",
    "ePrivacy Directive",
  ],
  ai: [
    "EU AI Act",
    "ISO/IEC 42001",
    "NIST AI RMF",
    "ISO/IEC 23894",
    "OECD AI Principles",
  ],
  finance: [
    "DORA",
    "PCI DSS 4.0",
    "SOC 2",
    "ISO 20022",
    "Basel III",
    "FFIEC IT Handbook",
    "AML/KYC (FATF)",
    "SOX",
  ],
  quality: [
    "ISO 9001",
    "CMMI 3.0",
    "ISO 31000",
    "ASPICE 4.0",
    "ISO 9000",
    "ISO 9004",
    "ISO 19011",
    "Lean Six Sigma",
    "AS9100",
    "IATF 16949",
    "ISO 14001",
    "ISO 45001",
    "ISO 50001",
    "ISO 10002",
    "ISO 10004",
    "ISO 26000",
    "ISO 28000",
    "ISO 22301",
    "ISO 41001",
    "TS 22163",
  ],
  software: [
    "IEEE 730",
    "IEEE 828",
    "IEEE 1012",
    "IEEE 1016",
    "IEEE 1063",
    "ISO/IEC/IEEE 42010",
    "ISO/IEC/IEEE 29119",
    "CMMI 3.0",
    "ISO 9001",
    "DO-178C",
    "IEC 62304",
    "ISO/IEC 12207",
    "ISO/IEC 15504",
    "ISO/IEC 25010",
    "ISO/IEC 27034",
    "SAFe",
    "ITIL 4",
    "COBIT 2019",
  ],
};

const INDUSTRY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All industries" },
  { value: "automotive", label: "Automotive" },
  { value: "aerospace", label: "Aerospace" },
  { value: "railway", label: "Railway" },
  { value: "medical", label: "Medical Devices & Life Sciences" },
  { value: "industrial", label: "Industrial / OT / Machinery" },
  { value: "cybersecurity", label: "Cybersecurity & IT" },
  { value: "privacy", label: "Privacy & Data Protection" },
  { value: "ai", label: "AI / ML" },
  { value: "finance", label: "Financial Services" },
  { value: "quality", label: "Quality Management (cross-industry)" },
  { value: "software", label: "Software Engineering (cross-industry)" },
];

export function StandardsMultiSelect({
  value,
  onChange,
  label = "Applicable standards",
  helper = "Generated documents will follow each standard's required structure and citation rules.",
  max = 8,
  disabled = false,
  required = false,
}: Props) {
  const { data } = useListComplianceFrameworks();
  const frameworks = (data ?? []) as Framework[];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string>("all");

  const selected = frameworks.filter((f) => value.includes(f.id));

  // Filter pipeline:
  //   1. Narrow by selected industry (if not "all").
  //   2. Narrow by free-text search across code + name.
  //   3. Pin currently-selected items to the top so they don't disappear
  //      while the user changes industry/search.
  const filtered = useMemo(() => {
    const industryAllow = industry === "all"
      ? null
      : new Set(INDUSTRY_FRAMEWORKS[industry] ?? []);

    let pool = frameworks;
    if (industryAllow) {
      // Always keep already-selected items visible even if they fall
      // outside the chosen industry — otherwise the chip in the trigger
      // would refer to a row the user can no longer uncheck from inside
      // the popover.
      pool = frameworks.filter(
        (f) => industryAllow.has(f.code) || value.includes(f.id),
      );
    }

    const q = query.trim().toLowerCase();
    const matches = q
      ? pool.filter(
          (f) =>
            f.code.toLowerCase().includes(q) ||
            f.name.toLowerCase().includes(q),
        )
      : pool;

    const sel = matches.filter((f) => value.includes(f.id));
    const rest = matches.filter((f) => !value.includes(f.id));
    return [...sel, ...rest];
  }, [frameworks, industry, query, value]);

  // Industry-only count (ignoring search) for the header badge so the user
  // sees how many standards live under each industry.
  const industryPoolCount = useMemo(() => {
    if (industry === "all") return frameworks.length;
    const allow = new Set(INDUSTRY_FRAMEWORKS[industry] ?? []);
    return frameworks.filter((f) => allow.has(f.code)).length;
  }, [frameworks, industry]);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (value.length >= max) return;
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
          {label}{" "}
          {required ? (
            <span className="text-rose-600 font-normal">(required)</span>
          ) : (
            <span className="text-slate-400 font-normal">(optional)</span>
          )}
        </label>
        {value.length > 0 && (
          <button
            type="button"
            className="text-[11px] text-slate-500 hover:text-slate-700"
            onClick={() => onChange([])}
            disabled={disabled}
          >
            Clear
          </button>
        )}
      </div>

      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between font-normal h-auto min-h-9 py-2"
            data-testid="standards-multiselect-trigger"
          >
            <span className="text-left flex flex-wrap gap-1 flex-1">
              {selected.length === 0 ? (
                <span className="text-slate-500 text-sm">Select standards…</span>
              ) : (
                selected.map((f) => (
                  <Badge
                    key={f.id}
                    variant="secondary"
                    className="text-[10px] gap-1 pl-2 pr-1.5 py-0.5"
                  >
                    {f.code}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(f.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle(f.id);
                        }
                      }}
                      className="hover:bg-slate-300 rounded-sm cursor-pointer p-0.5 inline-flex"
                      aria-label={`Remove ${f.code}`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="border-b border-slate-200 p-2 space-y-2">
            {/* Industry selector — narrows the standards list to the
                domains the user actually cares about. */}
            <div>
              <label className="text-[10px] font-medium text-slate-600 flex items-center gap-1 mb-1">
                <Building2 className="h-3 w-3 text-slate-400" />
                Industry
              </label>
              <Select
                value={industry}
                onValueChange={(v) => {
                  setIndustry(v);
                  setQuery("");
                }}
              >
                <SelectTrigger
                  className="h-8 text-xs"
                  data-testid="standards-industry-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search within the (industry-narrowed) standards. */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  industry === "all"
                    ? "Search standards (e.g. ISO 26262, HIPAA…)"
                    : `Search within ${industryPoolCount} ${industryPoolCount === 1 ? "standard" : "standards"}…`
                }
                className="h-8 pl-7 text-sm"
                data-testid="standards-search-input"
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-500">
                {query
                  ? `${filtered.length} match${filtered.length === 1 ? "" : "es"}`
                  : industry === "all"
                    ? `${frameworks.length} standards`
                    : `${industryPoolCount} in this industry`}
              </span>
              <span className="text-[10px] text-slate-400">
                {value.length}/{max} selected
              </span>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {frameworks.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No frameworks available.</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                {query
                  ? `No standards match "${query}" in this industry.`
                  : "No standards in this industry yet."}
              </div>
            ) : (
              filtered.map((f) => {
                const checked = value.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className="flex items-start gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                    data-testid={`standards-option-${f.code.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(f.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{f.code}</div>
                      <div className="text-xs text-slate-500 truncate">{f.name}</div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {helper && <p className="text-[11px] text-slate-500">{helper}</p>}
    </div>
  );
}
