export default function Connectors() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-y-[3vh] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>CONNECTORS</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col">
        <div className="mb-[3vh]">
          <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
            Integrations
          </div>
          <h1 className="text-[3.5vw] font-extrabold m-0 leading-[1.1] tracking-tight max-w-[60vw]">
            Connect everything you already use
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-[2vw] flex-1">
          <div className="bg-card px-[2vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-accent mb-[2vh] uppercase tracking-wide">Requirements management</div>
            <div className="flex flex-wrap gap-[0.8vw]">
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">IBM DOORS</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">DOORS Next (OSLC)</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">Jama</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">Polarion</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">codeBeamer</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">Helix RM</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">Visure</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">ReqIF</div>
            </div>
          </div>

          <div className="bg-card px-[2vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-accent mb-[2vh] uppercase tracking-wide">ALM &amp; tickets</div>
            <div className="flex flex-wrap gap-[0.8vw]">
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">Azure DevOps</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">Jira</div>
            </div>
            <div className="text-[1.5vw] font-bold text-accent mb-[2vh] mt-[3vh] uppercase tracking-wide">Defect tracking</div>
            <div className="flex flex-wrap gap-[0.8vw]">
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">Bugzilla</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">ServiceNow</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">Jira</div>
            </div>
          </div>

          <div className="bg-card px-[2vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-accent mb-[2vh] uppercase tracking-wide">Code sources</div>
            <div className="flex flex-wrap gap-[0.8vw]">
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">GitHub</div>
              <div className="px-[1vw] py-[0.6vh] bg-tealsoft text-primary rounded-[0.4vw] text-[1.5vw] font-semibold">ZIP / folder upload</div>
            </div>
            <div className="mt-[3vh] text-[1.5vw] text-muted leading-relaxed">
              Native OSLC for DOORS Next. Bidirectional sync where the source supports it. Read-only crawlers everywhere else.
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
          <span>8 / 17</span>
        </div>
      </div>
    </div>
  );
}
