export default function KnowledgeGraph() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-2 grid-rows-[auto_1fr_auto] gap-y-[4vh] gap-x-[4vw] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="col-span-2 flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>THE PLATFORM</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main left */}
      <div className="flex flex-col justify-center">
        <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
          Auditee
        </div>
        <h1 className="text-[4vw] font-extrabold m-0 mb-[2vh] leading-[1.05] tracking-tight">
          One living knowledge graph
        </h1>
        <p className="text-[1.5vw] font-normal text-secondary m-0 mb-[3vh] leading-relaxed max-w-[42vw]">
          Requirements, code, tests, evidence and findings — modeled as one graph. Query any node, traverse any edge.
        </p>
        <div className="flex flex-col gap-[1.5vh]">
          <div className="text-[1.5vw] text-primary font-medium leading-snug">Every requirement carries a citation.</div>
          <div className="text-[1.5vw] text-primary font-medium leading-snug">Every line of code carries a requirement.</div>
          <div className="text-[1.5vw] text-primary font-medium leading-snug">Every finding carries an owner.</div>
        </div>
      </div>

      {/* Main right — graph visualization */}
      <div className="flex flex-col justify-center items-center">
        <div className="bg-card px-[3vw] py-[4vh] rounded-[1vw] border border-border w-full h-full flex flex-col justify-center items-center box-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] relative">
          <svg viewBox="0 0 400 280" className="w-full h-[40vh]" preserveAspectRatio="xMidYMid meet">
            <line x1="200" y1="140" x2="80" y2="60" stroke="#E2E8F0" strokeWidth="2" />
            <line x1="200" y1="140" x2="320" y2="60" stroke="#E2E8F0" strokeWidth="2" />
            <line x1="200" y1="140" x2="80" y2="220" stroke="#E2E8F0" strokeWidth="2" />
            <line x1="200" y1="140" x2="320" y2="220" stroke="#E2E8F0" strokeWidth="2" />
            <line x1="200" y1="140" x2="200" y2="40" stroke="#E2E8F0" strokeWidth="2" />
            <circle cx="200" cy="140" r="42" fill="#0D9488" />
            <text x="200" y="146" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="700" fontFamily="Inter">Auditee</text>
            <circle cx="80" cy="60" r="30" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2" />
            <text x="80" y="64" textAnchor="middle" fill="#1E3A5F" fontSize="11" fontWeight="600" fontFamily="Inter">Reqs</text>
            <circle cx="320" cy="60" r="30" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2" />
            <text x="320" y="64" textAnchor="middle" fill="#1E3A5F" fontSize="11" fontWeight="600" fontFamily="Inter">Code</text>
            <circle cx="80" cy="220" r="30" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2" />
            <text x="80" y="224" textAnchor="middle" fill="#1E3A5F" fontSize="11" fontWeight="600" fontFamily="Inter">Tests</text>
            <circle cx="320" cy="220" r="30" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2" />
            <text x="320" y="224" textAnchor="middle" fill="#1E3A5F" fontSize="11" fontWeight="600" fontFamily="Inter">CAPA</text>
            <circle cx="200" cy="40" r="30" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2" />
            <text x="200" y="44" textAnchor="middle" fill="#1E3A5F" fontSize="11" fontWeight="600" fontFamily="Inter">Standards</text>
          </svg>
          <div className="text-[1.5vw] text-muted mt-[2vh]">Five node types · one queryable graph</div>
        </div>
      </div>

      {/* Footer */}
      <div className="col-span-2 flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>4 / 17</span>
        </div>
      </div>
    </div>
  );
}
