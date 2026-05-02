export default function CodeToSpec() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-2 grid-rows-[auto_1fr_auto] gap-y-[4vh] gap-x-[4vw] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="col-span-2 flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>CAPABILITY 02</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main left */}
      <div className="flex flex-col justify-center">
        <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
          Code-to-Spec Traceability
        </div>
        <h1 className="text-[3.8vw] font-extrabold m-0 mb-[2vh] leading-[1.1] tracking-tight">
          Every line traces back
        </h1>
        <p className="text-[1.5vw] font-normal text-secondary m-0 mb-[3vh] leading-relaxed max-w-[42vw]">
          Auditee crawls your repositories and links every requirement to the file, class or route that implements it.
        </p>
        <div className="flex flex-col gap-[1.5vh]">
          <div className="text-[1.5vw] text-muted leading-relaxed">
            <span className="font-semibold text-primary">Twelve languages crawled:</span> TypeScript, Python, Java, C/C++, Go, Rust, COBOL, SQL, Kotlin, Swift, Ruby, PHP.
          </div>
          <div className="text-[1.5vw] text-muted leading-relaxed">
            <span className="font-semibold text-primary">Missing-Requirements Analysis</span> flags every uncovered code path so untraced behaviour shows up before the assessor finds it.
          </div>
        </div>
      </div>

      {/* Main right — mock trace map */}
      <div className="flex flex-col justify-center">
        <div className="bg-card rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] overflow-hidden">
          <div className="flex justify-between items-center px-[2vw] py-[1.5vh] border-b border-border bg-bg">
            <div className="text-[1.5vw] font-bold text-muted uppercase tracking-wide">Trace Map · pump-control/</div>
            <div className="px-[0.8vw] py-[0.3vh] bg-tealsoft text-accent text-[1.5vw] font-semibold rounded-[0.3vw]">94% covered</div>
          </div>

          <div className="px-[2vw] py-[2.5vh] flex flex-col gap-[1.5vh]">
            <div className="flex items-center gap-[1vw]">
              <div className="text-[1.5vw] text-muted font-mono w-[14vw] truncate">src/control/occlusion.ts</div>
              <div className="flex-1 h-[1vh] bg-bg rounded-full overflow-hidden">
                <div className="h-full w-[100%] bg-accent" />
              </div>
              <div className="text-[1.5vw] font-semibold text-accent w-[6vw] text-right">REQ-014, REQ-019</div>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="text-[1.5vw] text-muted font-mono w-[14vw] truncate">src/control/pressure.ts</div>
              <div className="flex-1 h-[1vh] bg-bg rounded-full overflow-hidden">
                <div className="h-full w-[88%] bg-accent" />
              </div>
              <div className="text-[1.5vw] font-semibold text-accent w-[6vw] text-right">REQ-021</div>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="text-[1.5vw] text-muted font-mono w-[14vw] truncate">src/alarm/audible.ts</div>
              <div className="flex-1 h-[1vh] bg-bg rounded-full overflow-hidden">
                <div className="h-full w-[100%] bg-accent" />
              </div>
              <div className="text-[1.5vw] font-semibold text-accent w-[6vw] text-right">REQ-014</div>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="text-[1.5vw] text-muted font-mono w-[14vw] truncate">src/telemetry/log.ts</div>
              <div className="flex-1 h-[1vh] bg-bg rounded-full overflow-hidden">
                <div className="h-full w-[42%] bg-ghost" />
              </div>
              <div className="text-[1.5vw] font-semibold text-ghost w-[6vw] text-right">untraced</div>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="text-[1.5vw] text-muted font-mono w-[14vw] truncate">src/legacy/cobol/pump.cbl</div>
              <div className="flex-1 h-[1vh] bg-bg rounded-full overflow-hidden">
                <div className="h-full w-[71%] bg-accent" />
              </div>
              <div className="text-[1.5vw] font-semibold text-accent w-[6vw] text-right">REQ-007</div>
            </div>
          </div>

          <div className="flex items-center justify-between px-[2vw] py-[1.5vh] border-t border-border bg-bg text-[1.5vw] text-muted">
            <div>1 file flagged for missing-requirements analysis</div>
            <div className="text-accent font-semibold">View finding →</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="col-span-2 flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>11 / 17</span>
        </div>
      </div>
    </div>
  );
}
