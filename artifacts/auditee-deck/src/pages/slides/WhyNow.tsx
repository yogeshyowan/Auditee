export default function WhyNow() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-2 grid-rows-[auto_1fr_auto] gap-y-[4vh] gap-x-[4vw] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="col-span-2 flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>MARKET TIMING</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main left */}
      <div className="flex flex-col justify-center">
        <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
          Why now
        </div>
        <h1 className="text-[4vw] font-extrabold m-0 mb-[2vh] leading-[1.05] tracking-tight">
          Compliance gates revenue
        </h1>
        <p className="text-[1.5vw] font-normal text-secondary m-0 mb-[2vh] leading-relaxed max-w-[42vw]">
          The regulatory surface has expanded faster than the tooling around it. Every quarter, more deals are blocked by a compliance gate.
        </p>
        <p className="text-[1.5vw] font-normal text-primary leading-relaxed max-w-[42vw] font-semibold">
          Compliance is no longer a back-office cost. It gates revenue.
        </p>
      </div>

      {/* Main right — timeline */}
      <div className="flex flex-col justify-center">
        <div className="bg-card px-[2.5vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] h-full flex flex-col">
          <div className="text-[1.5vw] font-bold text-primary border-b border-border pb-[1.5vh] mb-[2vh]">
            Regulatory milestones
          </div>

          <div className="flex flex-col gap-[2.5vh] relative flex-1 justify-center">
            <div className="absolute left-[0.45vw] top-[1vh] bottom-[1vh] w-[2px] bg-border" />

            <div className="flex gap-[1.5vw] items-start relative z-10">
              <div className="w-[1vw] h-[1vw] bg-accent rounded-full border-[3px] border-card shadow-[0_0_0_1px_#E2E8F0] mt-[0.5vh]" />
              <div>
                <div className="text-[1.5vw] font-bold text-accent uppercase tracking-wide">Through 2026</div>
                <div className="text-[1.5vw] text-primary font-semibold">EU AI Act enforcement is staged through 2026</div>
              </div>
            </div>

            <div className="flex gap-[1.5vw] items-start relative z-10">
              <div className="w-[1vw] h-[1vw] bg-accent rounded-full border-[3px] border-card shadow-[0_0_0_1px_#E2E8F0] mt-[0.5vh]" />
              <div>
                <div className="text-[1.5vw] font-bold text-accent uppercase tracking-wide">Live now</div>
                <div className="text-[1.5vw] text-primary font-semibold">NIS2 and DORA enforced across the EU</div>
              </div>
            </div>

            <div className="flex gap-[1.5vw] items-start relative z-10">
              <div className="w-[1vw] h-[1vw] bg-accent rounded-full border-[3px] border-card shadow-[0_0_0_1px_#E2E8F0] mt-[0.5vh]" />
              <div>
                <div className="text-[1.5vw] font-bold text-accent uppercase tracking-wide">Feb 2026</div>
                <div className="text-[1.5vw] text-primary font-semibold">FDA QMSR replaces 21 CFR 820</div>
              </div>
            </div>

            <div className="flex gap-[1.5vw] items-start relative z-10">
              <div className="w-[1vw] h-[1vw] bg-accent rounded-full border-[3px] border-card shadow-[0_0_0_1px_#E2E8F0] mt-[0.5vh]" />
              <div>
                <div className="text-[1.5vw] font-bold text-accent uppercase tracking-wide">Year on year</div>
                <div className="text-[1.5vw] text-primary font-semibold">ISO 26262 and IEC 62304 audit volumes growing</div>
              </div>
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
          <span>16 / 17</span>
        </div>
      </div>
    </div>
  );
}
