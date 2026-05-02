export default function RequirementsGen() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-2 grid-rows-[auto_1fr_auto] gap-y-[4vh] gap-x-[4vw] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="col-span-2 flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>CAPABILITY 01</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main left */}
      <div className="flex flex-col justify-center">
        <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
          Requirements Generation
        </div>
        <h1 className="text-[3.8vw] font-extrabold m-0 mb-[2vh] leading-[1.1] tracking-tight">
          Drafted, cited, defensible
        </h1>
        <p className="text-[1.5vw] font-normal text-secondary m-0 mb-[3vh] leading-relaxed max-w-[42vw]">
          Generate structured, standards-conformant requirements from briefs, BRDs and PDFs — or recover them from legacy code.
        </p>
        <div className="flex flex-col gap-[1.5vh]">
          <div className="flex items-start gap-[1vw]">
            <div className="text-accent text-[1.5vw] font-bold leading-none mt-[0.3vh]">→</div>
            <div className="text-[1.5vw] text-primary font-medium">Every requirement carries inline citations to its source paragraph.</div>
          </div>
          <div className="flex items-start gap-[1vw]">
            <div className="text-accent text-[1.5vw] font-bold leading-none mt-[0.3vh]">→</div>
            <div className="text-[1.5vw] text-primary font-medium">Hierarchies, attributes and link types align to your chosen standard.</div>
          </div>
          <div className="flex items-start gap-[1vw]">
            <div className="text-accent text-[1.5vw] font-bold leading-none mt-[0.3vh]">→</div>
            <div className="text-[1.5vw] text-primary font-medium">Push directly into DOORS, Polarion, Jama or codeBeamer.</div>
          </div>
        </div>
      </div>

      {/* Main right — mock requirement card */}
      <div className="flex flex-col justify-center">
        <div className="bg-card rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] overflow-hidden">
          <div className="flex justify-between items-center px-[2vw] py-[1.5vh] border-b border-border bg-bg">
            <div className="flex items-center gap-[1vw]">
              <div className="text-[1.5vw] font-bold text-muted uppercase tracking-wide">REQ-IEC62304-014</div>
              <div className="px-[0.8vw] py-[0.3vh] bg-tealsoft text-accent text-[1.5vw] font-semibold rounded-[0.3vw]">Class C</div>
            </div>
            <div className="text-[1.5vw] text-muted font-medium">Generated · cited</div>
          </div>
          <div className="px-[2vw] py-[2.5vh]">
            <div className="text-[1.5vw] font-semibold text-primary leading-snug mb-[2vh]">
              The infusion pump shall halt delivery and raise an audible alarm within 200 ms of detecting an occlusion downstream of the cassette.
            </div>
            <div className="border-l-[3px] border-accent pl-[1vw] py-[0.5vh] bg-tealsoft/40 rounded-r-[0.3vw]">
              <div className="text-[1.5vw] font-bold text-accent uppercase mb-[0.5vh]">Citation</div>
              <div className="text-[1.5vw] text-secondary leading-snug">
                IEC 62304:2006/AMD1:2015 §5.5.2 — &ldquo;Software safety classification shall be documented for each software item.&rdquo;
              </div>
              <div className="text-[1.5vw] text-muted mt-[0.5vh]">Source: Hazard-Analysis-Report-v3.pdf, p. 42</div>
            </div>
          </div>
          <div className="flex items-center gap-[1.5vw] px-[2vw] py-[1.5vh] border-t border-border bg-bg text-[1.5vw] text-muted">
            <div>Linked tests: <span className="text-primary font-semibold">3</span></div>
            <div>•</div>
            <div>Linked code: <span className="text-primary font-semibold">2 files</span></div>
            <div>•</div>
            <div>Owner: <span className="text-primary font-semibold">QA Lead</span></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="col-span-2 flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>10 / 17</span>
        </div>
      </div>
    </div>
  );
}
