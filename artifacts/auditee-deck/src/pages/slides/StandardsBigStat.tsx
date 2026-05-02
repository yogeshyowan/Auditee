export default function StandardsBigStat() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-y-[3vh] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>STANDARDS COVERAGE</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col justify-center items-center text-center">
        <div className="text-[1.5vw] font-semibold text-accent mb-[2vh] uppercase tracking-[0.05em]">
          Out of the box
        </div>
        <div className="flex items-baseline gap-[2vw] mb-[3vh]">
          <div className="text-[14vw] font-black text-primary leading-none tracking-tight">40+</div>
          <div className="text-[2.4vw] font-semibold text-secondary leading-tight max-w-[35vw] text-left">
            standards covered<br className="hidden" />
          </div>
        </div>
        <p className="text-[1.5vw] font-normal text-secondary max-w-[55vw] leading-relaxed">
          Auditee ships standards-aware coverage for the regulations enterprise software actually faces — automotive, medical, aerospace, security, AI, privacy and quality.
        </p>

        <div className="flex gap-[1.5vw] mt-[5vh] flex-wrap justify-center">
          <div className="px-[1.5vw] py-[1vh] bg-card border border-border rounded-full text-[1.5vw] font-semibold text-primary">Automotive</div>
          <div className="px-[1.5vw] py-[1vh] bg-card border border-border rounded-full text-[1.5vw] font-semibold text-primary">Medical</div>
          <div className="px-[1.5vw] py-[1vh] bg-card border border-border rounded-full text-[1.5vw] font-semibold text-primary">Aerospace</div>
          <div className="px-[1.5vw] py-[1vh] bg-card border border-border rounded-full text-[1.5vw] font-semibold text-primary">Security</div>
          <div className="px-[1.5vw] py-[1vh] bg-card border border-border rounded-full text-[1.5vw] font-semibold text-primary">AI</div>
          <div className="px-[1.5vw] py-[1vh] bg-card border border-border rounded-full text-[1.5vw] font-semibold text-primary">Privacy</div>
          <div className="px-[1.5vw] py-[1vh] bg-card border border-border rounded-full text-[1.5vw] font-semibold text-primary">Quality</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>6 / 17</span>
        </div>
      </div>
    </div>
  );
}
