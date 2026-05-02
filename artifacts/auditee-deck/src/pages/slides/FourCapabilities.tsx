export default function FourCapabilities() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-y-[3vh] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>CAPABILITIES</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col">
        <div className="mb-[3vh]">
          <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
            What Auditee does
          </div>
          <h1 className="text-[3.8vw] font-extrabold m-0 leading-[1.1] tracking-tight">
            Four capabilities. One platform.
          </h1>
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-[2vw] flex-1">
          <div className="bg-card px-[2vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-tealsoft text-accent flex items-center justify-center text-[1.5vw] font-bold">01</div>
              <div className="text-[1.5vw] font-bold text-primary">Requirements Generation</div>
            </div>
            <div className="text-[1.5vw] text-muted leading-relaxed">Standards-conformant requirements drafted from briefs, BRDs and PDFs — every line carries a citation back to its source.</div>
          </div>
          <div className="bg-card px-[2vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-tealsoft text-accent flex items-center justify-center text-[1.5vw] font-bold">02</div>
              <div className="text-[1.5vw] font-bold text-primary">Code-to-Spec Traceability</div>
            </div>
            <div className="text-[1.5vw] text-muted leading-relaxed">Every requirement linked to the file, class or route that implements it. Twelve-plus languages crawled out of the box.</div>
          </div>
          <div className="bg-card px-[2vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-tealsoft text-accent flex items-center justify-center text-[1.5vw] font-bold">03</div>
              <div className="text-[1.5vw] font-bold text-primary">Compliance Mapping</div>
            </div>
            <div className="text-[1.5vw] text-muted leading-relaxed">Forty-plus frameworks, control by control. Pick your standards and the platform aligns the artefacts that satisfy them.</div>
          </div>
          <div className="bg-card px-[2vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-tealsoft text-accent flex items-center justify-center text-[1.5vw] font-bold">04</div>
              <div className="text-[1.5vw] font-bold text-primary">Audit &amp; CAPA Workflows</div>
            </div>
            <div className="text-[1.5vw] text-muted leading-relaxed">Continuous gap detection with full evidence chain, ownership and corrective-action tracking from finding to closure.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>5 / 17</span>
        </div>
      </div>
    </div>
  );
}
