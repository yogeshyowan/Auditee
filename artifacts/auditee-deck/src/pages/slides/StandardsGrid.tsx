export default function StandardsGrid() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-y-[3vh] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>STANDARDS GRID</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col">
        <div className="mb-[3vh]">
          <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
            By category
          </div>
          <h1 className="text-[3.5vw] font-extrabold m-0 leading-[1.1] tracking-tight">
            The standards grid
          </h1>
        </div>

        <div className="grid grid-cols-5 gap-[1.5vw] flex-1">
          <div className="bg-card px-[1.2vw] py-[2.5vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-accent mb-[2vh] uppercase tracking-wide">Safety</div>
            <div className="flex flex-col gap-[1vh]">
              <div className="text-[1.5vw] text-primary font-medium">ISO 26262</div>
              <div className="text-[1.5vw] text-primary font-medium">IEC 61508</div>
              <div className="text-[1.5vw] text-primary font-medium">IEC 62304</div>
              <div className="text-[1.5vw] text-primary font-medium">DO-178C</div>
              <div className="text-[1.5vw] text-primary font-medium">EN 50128</div>
            </div>
          </div>

          <div className="bg-card px-[1.2vw] py-[2.5vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-accent mb-[2vh] uppercase tracking-wide">Quality</div>
            <div className="flex flex-col gap-[1vh]">
              <div className="text-[1.5vw] text-primary font-medium">ASPICE 4.0</div>
              <div className="text-[1.5vw] text-primary font-medium">CMMI</div>
              <div className="text-[1.5vw] text-primary font-medium">ISO 9001</div>
              <div className="text-[1.5vw] text-primary font-medium">ISO 13485</div>
              <div className="text-[1.5vw] text-primary font-medium">21 CFR 820</div>
              <div className="text-[1.5vw] text-primary font-medium">FDA QMSR</div>
            </div>
          </div>

          <div className="bg-card px-[1.2vw] py-[2.5vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-accent mb-[2vh] uppercase tracking-wide">Security</div>
            <div className="flex flex-col gap-[1vh]">
              <div className="text-[1.5vw] text-primary font-medium">SOC 2</div>
              <div className="text-[1.5vw] text-primary font-medium">ISO 27001</div>
              <div className="text-[1.5vw] text-primary font-medium">NIST CSF</div>
              <div className="text-[1.5vw] text-primary font-medium">IEC 62443</div>
              <div className="text-[1.5vw] text-primary font-medium">ISO/SAE 21434</div>
            </div>
          </div>

          <div className="bg-card px-[1.2vw] py-[2.5vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-accent mb-[2vh] uppercase tracking-wide">Privacy</div>
            <div className="flex flex-col gap-[1vh]">
              <div className="text-[1.5vw] text-primary font-medium">HIPAA</div>
              <div className="text-[1.5vw] text-primary font-medium">GDPR</div>
              <div className="text-[1.5vw] text-primary font-medium">21 CFR Part 11</div>
            </div>
          </div>

          <div className="bg-card px-[1.2vw] py-[2.5vh] rounded-[1vw] border border-accent shadow-[0_0.5vw_1.5vw_rgba(13,148,136,0.15)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-accent mb-[2vh] uppercase tracking-wide">New &amp; emerging</div>
            <div className="flex flex-col gap-[1vh]">
              <div className="text-[1.5vw] text-primary font-medium">EU AI Act</div>
              <div className="text-[1.5vw] text-primary font-medium">NIS2</div>
              <div className="text-[1.5vw] text-primary font-medium">DORA</div>
              <div className="text-[1.5vw] text-primary font-medium">PCI DSS 4.0</div>
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
          <span>7 / 17</span>
        </div>
      </div>
    </div>
  );
}
