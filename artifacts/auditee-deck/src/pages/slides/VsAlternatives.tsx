export default function VsAlternatives() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-y-[3vh] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>COMPETITIVE LANDSCAPE</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col">
        <div className="mb-[3vh]">
          <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
            How we compare
          </div>
          <h1 className="text-[3.5vw] font-extrabold m-0 leading-[1.1] tracking-tight">
            Auditee vs the alternatives
          </h1>
        </div>

        <div className="bg-card rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] overflow-hidden flex-1 flex flex-col">
          <div className="grid grid-cols-5 px-[1.5vw] py-[2vh] bg-bg border-b border-border">
            <div className="text-[1.5vw] font-bold text-muted uppercase tracking-wide">Capability</div>
            <div className="text-[1.5vw] font-bold text-muted uppercase tracking-wide text-center">ALM<div className="text-[1.5vw] font-medium normal-case text-ghost">DOORS · Polarion · Jama</div></div>
            <div className="text-[1.5vw] font-bold text-muted uppercase tracking-wide text-center">Static analysis<div className="text-[1.5vw] font-medium normal-case text-ghost">SonarQube · CodeQL</div></div>
            <div className="text-[1.5vw] font-bold text-muted uppercase tracking-wide text-center">GRC<div className="text-[1.5vw] font-medium normal-case text-ghost">Vanta · Drata</div></div>
            <div className="text-[1.5vw] font-bold text-accent uppercase tracking-wide text-center">Auditee</div>
          </div>

          <div className="grid grid-cols-5 px-[1.5vw] py-[2vh] border-b border-border items-center">
            <div className="text-[1.5vw] font-semibold text-primary">Requirements management</div>
            <div className="text-center text-accent text-[1.5vw] font-bold">●</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-accent text-[1.5vw] font-bold">●</div>
          </div>
          <div className="grid grid-cols-5 px-[1.5vw] py-[2vh] border-b border-border items-center">
            <div className="text-[1.5vw] font-semibold text-primary">Code-to-spec traceability</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-accent/60 text-[1.5vw]">◐</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-accent text-[1.5vw] font-bold">●</div>
          </div>
          <div className="grid grid-cols-5 px-[1.5vw] py-[2vh] border-b border-border items-center">
            <div className="text-[1.5vw] font-semibold text-primary">AI requirement generation</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-accent text-[1.5vw] font-bold">●</div>
          </div>
          <div className="grid grid-cols-5 px-[1.5vw] py-[2vh] border-b border-border items-center">
            <div className="text-[1.5vw] font-semibold text-primary">Compliance mapping (40+)</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-accent/60 text-[1.5vw]">◐</div>
            <div className="text-center text-accent text-[1.5vw] font-bold">●</div>
          </div>
          <div className="grid grid-cols-5 px-[1.5vw] py-[2vh] items-center">
            <div className="text-[1.5vw] font-semibold text-primary">Audit &amp; CAPA workflows</div>
            <div className="text-center text-accent/60 text-[1.5vw]">◐</div>
            <div className="text-center text-ghost text-[1.5vw]">○</div>
            <div className="text-center text-accent/60 text-[1.5vw]">◐</div>
            <div className="text-center text-accent text-[1.5vw] font-bold">●</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>13 / 17</span>
        </div>
      </div>
    </div>
  );
}
