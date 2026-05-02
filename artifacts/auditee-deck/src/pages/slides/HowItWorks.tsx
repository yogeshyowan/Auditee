export default function HowItWorks() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-y-[3vh] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>HOW IT WORKS</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col">
        <div className="mb-[4vh]">
          <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
            From source to sign-off
          </div>
          <h1 className="text-[3.5vw] font-extrabold m-0 leading-[1.1] tracking-tight">
            How it works
          </h1>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full grid grid-cols-5 gap-[1.5vw] relative">
            <div className="absolute left-[5%] right-[5%] top-[1.4vw] h-[2px] bg-border z-0" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-accent text-card font-bold text-[1.5vw] flex items-center justify-center border-[4px] border-card shadow-[0_0_0_1px_#E2E8F0]">1</div>
              <div className="mt-[2vh] text-[1.5vw] font-bold text-primary">Connect</div>
              <div className="mt-[1vh] text-[1.5vw] text-muted leading-snug max-w-[12vw]">Link your RM, code and ALM sources via OSLC, OAuth or upload.</div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-accent text-card font-bold text-[1.5vw] flex items-center justify-center border-[4px] border-card shadow-[0_0_0_1px_#E2E8F0]">2</div>
              <div className="mt-[2vh] text-[1.5vw] font-bold text-primary">Select standards</div>
              <div className="mt-[1vh] text-[1.5vw] text-muted leading-snug max-w-[12vw]">Pick from 40+ frameworks and the controls that apply to your project.</div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-accent text-card font-bold text-[1.5vw] flex items-center justify-center border-[4px] border-card shadow-[0_0_0_1px_#E2E8F0]">3</div>
              <div className="mt-[2vh] text-[1.5vw] font-bold text-primary">Generate or import</div>
              <div className="mt-[1vh] text-[1.5vw] text-muted leading-snug max-w-[12vw]">Draft requirements from briefs and PDFs, or recover them from legacy code.</div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-accent text-card font-bold text-[1.5vw] flex items-center justify-center border-[4px] border-card shadow-[0_0_0_1px_#E2E8F0]">4</div>
              <div className="mt-[2vh] text-[1.5vw] font-bold text-primary">Run the audit</div>
              <div className="mt-[1vh] text-[1.5vw] text-muted leading-snug max-w-[12vw]">Gap analysis, missing-requirement detection and test-case drafting.</div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-accent text-card font-bold text-[1.5vw] flex items-center justify-center border-[4px] border-card shadow-[0_0_0_1px_#E2E8F0]">5</div>
              <div className="mt-[2vh] text-[1.5vw] font-bold text-primary">Export</div>
              <div className="mt-[1vh] text-[1.5vw] text-muted leading-snug max-w-[12vw]">PDF, DOCX or CSV evidence bundle ready for your assessor.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>9 / 17</span>
        </div>
      </div>
    </div>
  );
}
