export default function WhatThisCosts() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-y-[4vh] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>THE COST</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col">
        <div className="mb-[3vh]">
          <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
            What disconnection costs
          </div>
          <h1 className="text-[3.8vw] font-extrabold m-0 leading-[1.1] tracking-tight max-w-[60vw]">
            Audit findings nobody saw coming
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-[2vw] flex-1">
          <div className="bg-card px-[2.5vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col justify-center">
            <div className="text-[1.5vw] font-semibold text-muted mb-[1vh] uppercase tracking-wide">Late-stage gaps</div>
            <div className="text-[1.5vw] font-semibold text-primary leading-snug">Requirement gaps surfaced the week before assessment, with no time to remediate.</div>
          </div>
          <div className="bg-card px-[2.5vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col justify-center">
            <div className="text-[1.5vw] font-semibold text-muted mb-[1vh] uppercase tracking-wide">Untraced code paths</div>
            <div className="text-[1.5vw] font-semibold text-primary leading-snug">Code with no link back to a requirement — fails ASPICE, ISO 26262 and IEC 62304 review.</div>
          </div>
          <div className="bg-card px-[2.5vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col justify-center">
            <div className="text-[1.5vw] font-semibold text-muted mb-[1vh] uppercase tracking-wide">Manual evidence</div>
            <div className="text-[1.5vw] font-semibold text-primary leading-snug">Weeks of senior engineering time spent chasing artefacts and exporting screenshots.</div>
          </div>
          <div className="bg-card px-[2.5vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col justify-center">
            <div className="text-[1.5vw] font-semibold text-muted mb-[1vh] uppercase tracking-wide">Repeat findings</div>
            <div className="text-[1.5vw] font-semibold text-primary leading-snug">The same finding reopens cycle after cycle because root cause was never linked back.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>3 / 17</span>
        </div>
      </div>
    </div>
  );
}
