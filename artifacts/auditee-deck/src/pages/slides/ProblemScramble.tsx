export default function ProblemScramble() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-2 grid-rows-[auto_1fr_auto] gap-y-[4vh] gap-x-[4vw] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="col-span-2 flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>THE PROBLEM</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main left */}
      <div className="flex flex-col justify-center">
        <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
          Today
        </div>
        <h1 className="text-[4.5vw] font-extrabold m-0 mb-[2vh] leading-[1.05] tracking-tight">
          The audit-week scramble
        </h1>
        <p className="text-[1.5vw] font-normal text-secondary m-0 leading-relaxed max-w-[42vw]">
          Enterprise teams reconcile spec, code and evidence by hand. At audit time, none of it is connected.
        </p>
      </div>

      {/* Main right — disconnected systems */}
      <div className="flex flex-col justify-center gap-[2vh]">
        <div className="flex gap-[1.5vw] items-start bg-card px-[2vw] py-[2vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
          <div className="text-[1.5vw] font-bold text-accent bg-tealsoft w-[3vw] h-[3vw] flex items-center justify-center rounded-full uppercase">RM</div>
          <div>
            <div className="text-[1.5vw] font-semibold text-primary mb-[0.5vh]">Requirements</div>
            <div className="text-[1.5vw] text-muted leading-snug">DOORS · Polarion · Jama · codeBeamer</div>
          </div>
        </div>
        <div className="flex gap-[1.5vw] items-start bg-card px-[2vw] py-[2vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
          <div className="text-[1.5vw] font-bold text-accent bg-tealsoft w-[3vw] h-[3vw] flex items-center justify-center rounded-full uppercase">SCM</div>
          <div>
            <div className="text-[1.5vw] font-semibold text-primary mb-[0.5vh]">Code</div>
            <div className="text-[1.5vw] text-muted leading-snug">GitHub · Azure DevOps · Bitbucket</div>
          </div>
        </div>
        <div className="flex gap-[1.5vw] items-start bg-card px-[2vw] py-[2vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
          <div className="text-[1.5vw] font-bold text-accent bg-tealsoft w-[3vw] h-[3vw] flex items-center justify-center rounded-full uppercase">DOC</div>
          <div>
            <div className="text-[1.5vw] font-semibold text-primary mb-[0.5vh]">Evidence</div>
            <div className="text-[1.5vw] text-muted leading-snug">Confluence · SharePoint · spreadsheets</div>
          </div>
        </div>
        <div className="flex gap-[1.5vw] items-start bg-card px-[2vw] py-[2vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
          <div className="text-[1.5vw] font-bold text-accent bg-tealsoft w-[3vw] h-[3vw] flex items-center justify-center rounded-full uppercase">GRC</div>
          <div>
            <div className="text-[1.5vw] font-semibold text-primary mb-[0.5vh]">Controls</div>
            <div className="text-[1.5vw] text-muted leading-snug">Vanta · Drata · ServiceNow</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="col-span-2 flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>2 / 17</span>
        </div>
      </div>
    </div>
  );
}
