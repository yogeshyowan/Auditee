import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Maximize2, PlayCircle, X } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  sources: "Project Sources",
  interview: "Smart Interview",
  requirements: "Requirements",
  gaps: "Requirements Gap Detection",
  traceability: "Traceability Graph",
  compliance: "Compliance",
  capa: "CAPA Actions",
  defects: "Defects",
  tests: "Test Cases",
  reports: "AI Reports",
  workflows: "Workflows",
  analytics: "Analytics",
  "recurring-audits": "Recurring Audits",
  dashboard: "Dashboard",
  legacy: "Legacy Modernisation",
  pdlc: "PDLC Pipeline",
  ask: "Ask Auditee",
};

const MODULE_SUBTITLES: Record<string, string> = {
  sources: "Connect IBM DOORS, GitHub, Jira & more",
  interview: "AI-driven stakeholder elicitation",
  requirements: "Manage, trace, and baseline",
  gaps: "Surface uncovered behaviours instantly",
  traceability: "End-to-end requirement → code → test links",
  compliance: "ISO 26262, IEC 62304, SOC 2 & more",
  capa: "Track findings from open to verified-closed",
  defects: "Defects linked to requirements and tests",
  tests: "AI-generated test plans per standard",
  reports: "Safety Plan, HARA, TSC, audit packets",
  workflows: "Review gates, approvals, and sign-offs",
  analytics: "Readiness scores, coverage trends",
  "recurring-audits": "Continuous compliance scanning",
  dashboard: "At-a-glance project health",
  legacy: "Decode COBOL/JCL/CICS into modern reqs",
  pdlc: "Six gated lifecycle stages, signed end-to-end",
  ask: "Conversational AI grounded in your project graph",
};

interface InlineTutorialPanelProps {
  module: string | null;
  onOpenFullscreen: () => void;
}

function getInitialExpanded(module: string): boolean {
  try {
    const stored = sessionStorage.getItem(`tutorial_panel_${module}`);
    if (stored !== null) return stored === '1';
    // Default: expanded on first visit for each module
    return false;
  } catch {
    return false;
  }
}

export function InlineTutorialPanel({ module, onOpenFullscreen }: InlineTutorialPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const prevModuleRef = useRef<string | null>(null);

  // Restore per-module expand state and reset on module change
  useEffect(() => {
    if (!module) return;
    if (module !== prevModuleRef.current) {
      prevModuleRef.current = module;
      setDismissed(false);
      setExpanded(getInitialExpanded(module));
    }
  }, [module]);

  // Listen for tour-driven expand events
  useEffect(() => {
    const handler = () => {
      setDismissed(false);
      setExpanded(true);
    };
    window.addEventListener('auditee:tutorial-expand', handler);
    return () => window.removeEventListener('auditee:tutorial-expand', handler);
  }, []);

  // Reset iframe src on module change
  useEffect(() => {
    if (!module || !iframeRef.current) return;
    iframeRef.current.src = `/auditee-tutorial/?module=${encodeURIComponent(module)}&embed=1`;
  }, [module]);

  const toggle = () => {
    setExpanded(e => {
      const next = !e;
      try { sessionStorage.setItem(`tutorial_panel_${module}`, next ? '1' : '0'); } catch {}
      return next;
    });
  };

  if (!module || dismissed) return null;

  const label = MODULE_LABELS[module] ?? module;
  const subtitle = MODULE_SUBTITLES[module] ?? '';
  const iframeSrc = `/auditee-tutorial/?module=${encodeURIComponent(module)}&embed=1`;

  return (
    <div
      className="mx-0 border-b border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out overflow-hidden"
      style={{ zIndex: 5 }}
    >
      {/* Header bar — always visible */}
      <div
        className="flex items-center gap-3 px-5 py-2.5 cursor-pointer select-none"
        style={{
          background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 60%, #6d28d9 100%)',
        }}
        onClick={toggle}
        role="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label} tutorial`}
      >
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          <PlayCircle className="h-4 w-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-white">{label}</span>
            <span
              className="text-xs font-medium hidden sm:inline"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              — {subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Step-by-step label */}
          <span
            className="hidden md:inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
          >
            Step-by-step video
          </span>

          {/* Open fullscreen */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenFullscreen(); }}
            aria-label="Open tutorial fullscreen"
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-white/20"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            aria-label="Dismiss tutorial"
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-white/20"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Expand / collapse chevron */}
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-white/20"
            style={{ color: 'rgba(255,255,255,0.9)' }}
            aria-hidden
          >
            {expanded
              ? <ChevronUp className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />
            }
          </div>
        </div>
      </div>

      {/* Collapsible iframe body */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '420px' : '0px' }}
      >
        <div className="relative bg-black" style={{ paddingTop: 'min(56.25%, 420px)' }}>
          <iframe
            ref={iframeRef}
            src={expanded ? iframeSrc : undefined}
            title={`${label} Tutorial`}
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="autoplay; speaker-selection"
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
          />
        </div>

        {/* Bottom hint bar */}
        <div
          className="flex items-center justify-between px-4 py-2 text-xs"
          style={{ background: '#0a0a14', color: 'rgba(255,255,255,0.35)' }}
        >
          <span>Loops automatically · voice narration included · click anywhere in the video to enable audio</span>
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="flex items-center gap-1 transition-colors hover:text-violet-400"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
