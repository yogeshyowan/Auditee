export default function ComplianceWorkflows() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-[3fr_2fr] grid-rows-[auto_1fr_auto] gap-y-[4vh] gap-x-[4vw] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="col-span-2 flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>CAPABILITY 03 / 04</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main left */}
      <div className="flex flex-col justify-center">
        <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
          Compliance &amp; audit workflows
        </div>
        <h1 className="text-[3.6vw] font-extrabold m-0 mb-[2vh] leading-[1.1] tracking-tight">
          Continuous, not annual
        </h1>
        <div className="flex flex-col gap-[2vh]">
          <div className="bg-card px-[2vw] py-[2vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
            <div className="text-[1.5vw] font-bold text-primary mb-[0.5vh]">Continuous gap detection</div>
            <div className="text-[1.5vw] text-muted leading-snug">Compliance scans run on every commit across selected standards.</div>
          </div>
          <div className="bg-card px-[2vw] py-[2vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
            <div className="text-[1.5vw] font-bold text-primary mb-[0.5vh]">CAPA tracking with provenance</div>
            <div className="text-[1.5vw] text-muted leading-snug">Every finding has an owner, a due date, and a full record of what changed, who changed it and when.</div>
          </div>
          <div className="bg-card px-[2vw] py-[2vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
            <div className="text-[1.5vw] font-bold text-primary mb-[0.5vh]">Single Audit-Readiness Score</div>
            <div className="text-[1.5vw] text-muted leading-snug">Roll-up score per project so leadership knows where you stand without opening a single ticket.</div>
          </div>
        </div>
      </div>

      {/* Main right — readiness gauge */}
      <div className="flex flex-col justify-center">
        <div className="bg-card px-[2vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col h-full">
          <div className="text-[1.5vw] font-semibold text-primary mb-[2vh]">Audit-Readiness Score</div>

          <div className="flex flex-col items-center justify-center flex-1">
            <svg viewBox="0 0 200 120" className="w-[18vw]" preserveAspectRatio="xMidYMid meet">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E2E8F0" strokeWidth="14" strokeLinecap="round" />
              <path d="M 20 100 A 80 80 0 0 1 168 56" fill="none" stroke="#0D9488" strokeWidth="14" strokeLinecap="round" />
            </svg>
            <div className="text-[5vw] font-extrabold text-primary leading-none mt-[1vh]">86</div>
            <div className="text-[1.5vw] text-muted font-medium mt-[1vh]">Project: pump-control · IEC 62304</div>
          </div>

          <div className="grid grid-cols-3 gap-[1vw] mt-[3vh] pt-[2vh] border-t border-border">
            <div className="text-center">
              <div className="text-[1.5vw] text-muted uppercase font-semibold mb-[0.5vh]">Open</div>
              <div className="text-[1.6vw] font-bold text-primary">12</div>
            </div>
            <div className="text-center">
              <div className="text-[1.5vw] text-muted uppercase font-semibold mb-[0.5vh]">In CAPA</div>
              <div className="text-[1.6vw] font-bold text-accent">4</div>
            </div>
            <div className="text-center">
              <div className="text-[1.5vw] text-muted uppercase font-semibold mb-[0.5vh]">Closed 30d</div>
              <div className="text-[1.6vw] font-bold text-primary">38</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="col-span-2 flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>12 / 17</span>
        </div>
      </div>
    </div>
  );
}
