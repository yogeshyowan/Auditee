export default function TitleSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-[3fr_2fr] grid-rows-[auto_1fr_auto] gap-y-[4vh] gap-x-[4vw] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="col-span-2 flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>SALES &amp; INVESTOR DECK</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main left */}
      <div className="flex flex-col justify-center">
        <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
          The PDLC Platform
        </div>
        <h1 className="text-[6vw] font-extrabold m-0 mb-[2vh] leading-[1.05] tracking-tight">
          Auditee
        </h1>
        <p className="text-[1.5vw] font-normal text-secondary m-0 mb-[4vh] leading-relaxed max-w-[40vw]">
          The AI-native platform for the Product Development Lifecycle. Unify requirements, code, audits and compliance into one living knowledge graph.
        </p>

        <div className="flex gap-[2vw]">
          <div className="bg-card px-[2vw] py-[2.5vh] rounded-[1vw] border border-border flex-1 shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
            <div className="text-[1.5vw] font-semibold text-muted mb-[1vh] uppercase">Frameworks supported</div>
            <div className="flex items-baseline gap-[1vw]">
              <div className="text-[3.5vw] font-bold text-primary">40+</div>
              <div className="text-[1.5vw] font-semibold text-accent bg-tealsoft px-[0.8vw] py-[0.5vh] rounded-full">ASPICE → AI Act</div>
            </div>
          </div>
          <div className="bg-card px-[2vw] py-[2.5vh] rounded-[1vw] border border-border flex-1 shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
            <div className="text-[1.5vw] font-semibold text-muted mb-[1vh] uppercase">Languages crawled</div>
            <div className="flex items-baseline gap-[1vw]">
              <div className="text-[3.5vw] font-bold text-primary">12+</div>
              <div className="text-[1.5vw] font-semibold text-accent bg-tealsoft px-[0.8vw] py-[0.5vh] rounded-full">TS · Python · C/C++</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main right — chart */}
      <div className="flex flex-col justify-center items-center">
        <div className="bg-card px-[3vw] py-[4vh] rounded-[1vw] border border-border w-full h-full flex flex-col justify-between box-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)]">
          <div>
            <div className="text-[1.5vw] font-semibold text-primary">Audit-Readiness Score</div>
            <div className="text-[1.5vw] text-muted mt-[0.5vh]">Sample project · last 4 quarters</div>
          </div>

          <div className="flex items-end gap-[1.5vw] h-[20vh] mt-[4vh] border-b-2 border-border pb-[1vh]">
            <div className="flex-1 flex flex-col items-center gap-[1vh]">
              <div className="w-full h-[6vh] bg-accent/20 rounded-t-[0.4vw]" />
              <div className="text-[1.5vw] text-muted font-medium">Q1</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-[1vh]">
              <div className="w-full h-[10vh] bg-accent/40 rounded-t-[0.4vw]" />
              <div className="text-[1.5vw] text-muted font-medium">Q2</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-[1vh]">
              <div className="w-full h-[14vh] bg-accent/70 rounded-t-[0.4vw]" />
              <div className="text-[1.5vw] text-muted font-medium">Q3</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-[1vh]">
              <div className="w-full h-[18vh] bg-accent rounded-t-[0.4vw]" />
              <div className="text-[1.5vw] text-muted font-medium">Q4</div>
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
          <span>1 / 17</span>
        </div>
      </div>
    </div>
  );
}
