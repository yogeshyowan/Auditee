export default function BuiltForEnterprise() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-2 grid-rows-[auto_1fr_auto] gap-y-[4vh] gap-x-[4vw] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="col-span-2 flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>WHO IT IS FOR</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main left */}
      <div className="flex flex-col justify-center">
        <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
          Built for
        </div>
        <h1 className="text-[3.8vw] font-extrabold m-0 mb-[2vh] leading-[1.1] tracking-tight">
          Enterprise quality and engineering teams
        </h1>
        <p className="text-[1.5vw] font-normal text-secondary m-0 leading-relaxed max-w-[42vw]">
          Designed for organizations shipping safety-critical, regulated or high-assurance software at scale.
        </p>
      </div>

      {/* Main right — industry list */}
      <div className="flex flex-col justify-center gap-[1.5vh]">
        <div className="bg-card px-[2vw] py-[1.8vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex items-center gap-[1.5vw]">
          <div className="text-[1.5vw] font-extrabold text-accent w-[3vw]">01</div>
          <div>
            <div className="text-[1.5vw] font-bold text-primary">Automotive</div>
            <div className="text-[1.5vw] text-muted leading-snug">Tier-1 and OEM software groups · ASPICE · ISO 26262 · ISO/SAE 21434</div>
          </div>
        </div>
        <div className="bg-card px-[2vw] py-[1.8vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex items-center gap-[1.5vw]">
          <div className="text-[1.5vw] font-extrabold text-accent w-[3vw]">02</div>
          <div>
            <div className="text-[1.5vw] font-bold text-primary">Medical devices</div>
            <div className="text-[1.5vw] text-muted leading-snug">Manufacturers facing IEC 62304 · ISO 13485 · 21 CFR 820 · FDA QMSR</div>
          </div>
        </div>
        <div className="bg-card px-[2vw] py-[1.8vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex items-center gap-[1.5vw]">
          <div className="text-[1.5vw] font-extrabold text-accent w-[3vw]">03</div>
          <div>
            <div className="text-[1.5vw] font-bold text-primary">Aerospace &amp; rail</div>
            <div className="text-[1.5vw] text-muted leading-snug">Systems integrators on DO-178C · EN 50128 · ARP4754A</div>
          </div>
        </div>
        <div className="bg-card px-[2vw] py-[1.8vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex items-center gap-[1.5vw]">
          <div className="text-[1.5vw] font-extrabold text-accent w-[3vw]">04</div>
          <div>
            <div className="text-[1.5vw] font-bold text-primary">Industrial control</div>
            <div className="text-[1.5vw] text-muted leading-snug">PLC and SCADA vendors on IEC 61508 · IEC 62443</div>
          </div>
        </div>
        <div className="bg-card px-[2vw] py-[1.8vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex items-center gap-[1.5vw]">
          <div className="text-[1.5vw] font-extrabold text-accent w-[3vw]">05</div>
          <div>
            <div className="text-[1.5vw] font-bold text-primary">Enterprise SaaS</div>
            <div className="text-[1.5vw] text-muted leading-snug">Teams facing SOC 2 · HIPAA · GDPR · EU AI Act</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="col-span-2 flex justify-between items-center border-t border-border pt-[2vh] text-[1.5vw] text-ghost font-medium">
        <div>Auditee</div>
        <div className="flex gap-[1vw]">
          <span>auditee.site</span>
          <span>•</span>
          <span>14 / 17</span>
        </div>
      </div>
    </div>
  );
}
