import { useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PlayCircle } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  sources: "Project Sources",
  interview: "Smart Interview",
  requirements: "Requirements",
  gaps: "Gap Detection",
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

interface TutorialDrawerProps {
  open: boolean;
  onClose: () => void;
  module: string | null;
}

export function TutorialDrawer({ open, onClose, module }: TutorialDrawerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const label = module ? (MODULE_LABELS[module] ?? module) : "";
  const src = module
    ? `/auditee-tutorial/?module=${encodeURIComponent(module)}&embed=1`
    : `/auditee-tutorial/?embed=1`;

  // Reset iframe on module change so the video restarts cleanly
  useEffect(() => {
    if (!open) return;
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.src = src;
    }
  }, [src, open]);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col w-full sm:max-w-[55vw] bg-[#0a0a14] border-l border-white/10"
      >
        <SheetHeader className="px-5 py-3.5 border-b border-white/10 flex-row items-center gap-3 space-y-0 shrink-0">
          <PlayCircle className="h-5 w-5 text-violet-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-white text-sm font-semibold leading-tight">
              Module Tutorial
            </SheetTitle>
            {label && (
              <p className="text-xs text-violet-300 font-medium mt-0.5 truncate">{label}</p>
            )}
          </div>
        </SheetHeader>

        {/* 16:9 responsive iframe wrapper */}
        <div className="flex-1 flex flex-col min-h-0 bg-black">
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              ref={iframeRef}
              key={`${module}-${open}`}
              src={open ? src : undefined}
              title={label ? `${label} Tutorial` : "Module Tutorial"}
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="autoplay"
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
          <div className="flex-1 bg-[#0a0a14] px-5 py-4">
            <p className="text-xs text-white/40 leading-relaxed">
              The video loops automatically. Use the scene controls at the bottom of the video to
              jump between steps or lock a step for closer study.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
