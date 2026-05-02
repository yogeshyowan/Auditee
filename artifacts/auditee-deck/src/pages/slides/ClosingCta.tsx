export default function ClosingCta() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-y-[3vh] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>GET STARTED</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col justify-center items-center text-center">
        <div className="w-[6vw] h-[6vw] bg-tealsoft rounded-full flex items-center justify-center mb-[4vh]">
          <div className="w-[3vw] h-[3vw] bg-accent rounded-full" />
        </div>

        <h1 className="text-[6vw] font-extrabold m-0 mb-[2vh] leading-[1.05] tracking-tight">
          auditee.site
        </h1>
        <p className="text-[1.5vw] font-normal text-secondary m-0 mb-[5vh] leading-relaxed max-w-[55vw]">
          Connect your first source and run a complete PDLC audit in under an hour. Free workspace · no credit card · live in production today.
        </p>

        <div className="flex gap-[8vw] px-[5vw] py-[3vh] bg-card rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
          <div className="text-left">
            <div className="text-[1.5vw] font-semibold text-muted mb-[0.5vh] uppercase">Start free</div>
            <div className="text-[1.5vw] font-bold text-primary">auditee.site</div>
          </div>
          <div className="w-[1px] bg-border" />
          <div className="text-left">
            <div className="text-[1.5vw] font-semibold text-muted mb-[0.5vh] uppercase">Talk to sales</div>
            <div className="text-[1.5vw] font-bold text-primary">sales@auditee.site</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>17 / 17</span>
        </div>
      </div>
    </div>
  );
}
