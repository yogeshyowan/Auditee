export default function Pricing() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body text-text grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-y-[3vh] px-[4vw] py-[4vh] box-border">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-[2vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2vw] h-[2vw] bg-accent rounded-[0.4vw]" />
          <div className="text-[1.5vw] font-bold tracking-wide">auditee.site</div>
        </div>
        <div className="flex gap-[2vw] text-[1.5vw] font-medium text-muted">
          <div>PRICING</div>
          <div>2026</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col">
        <div className="mb-[3vh]">
          <div className="text-[1.5vw] font-semibold text-accent mb-[1vh] uppercase tracking-[0.05em]">
            INR · annual or monthly
          </div>
          <h1 className="text-[3.5vw] font-extrabold m-0 leading-[1.1] tracking-tight">
            Pricing
          </h1>
        </div>

        <div className="grid grid-cols-4 gap-[1.5vw] flex-1">
          <div className="bg-card px-[1.5vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-muted uppercase tracking-wide mb-[1vh]">Free</div>
            <div className="text-[3vw] font-extrabold text-primary leading-none mb-[0.5vh]">₹0</div>
            <div className="text-[1.5vw] text-ghost mb-[2.5vh]">Evaluate the platform at no cost</div>
            <div className="border-t border-border pt-[2vh] flex flex-col gap-[1vh]">
              <div className="text-[1.5vw] text-secondary leading-snug">Single workspace</div>
              <div className="text-[1.5vw] text-secondary leading-snug">Connect one source</div>
              <div className="text-[1.5vw] text-secondary leading-snug">Sample standards</div>
            </div>
          </div>

          <div className="bg-card px-[1.5vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-muted uppercase tracking-wide mb-[1vh]">Standard</div>
            <div className="text-[3vw] font-extrabold text-primary leading-none mb-[0.5vh]">₹1,999</div>
            <div className="text-[1.5vw] text-ghost mb-[0.5vh]">per month</div>
            <div className="text-[1.5vw] font-semibold text-accent mb-[2.5vh]">or ₹19,990 / year</div>
            <div className="border-t border-border pt-[2vh] flex flex-col gap-[1vh]">
              <div className="text-[1.5vw] text-secondary leading-snug">All connectors</div>
              <div className="text-[1.5vw] text-secondary leading-snug">Up to 25 standards</div>
              <div className="text-[1.5vw] text-secondary leading-snug">Audit exports</div>
            </div>
          </div>

          <div className="bg-card px-[1.5vw] py-[3vh] rounded-[1vw] border-[2px] border-accent shadow-[0_0.5vw_1.5vw_rgba(13,148,136,0.15)] flex flex-col relative">
            <div className="absolute top-[-1.4vh] left-[1.5vw] px-[1vw] py-[0.4vh] bg-accent text-card text-[1.5vw] font-bold uppercase tracking-wide rounded-full">Most popular</div>
            <div className="text-[1.5vw] font-bold text-accent uppercase tracking-wide mb-[1vh]">Professional</div>
            <div className="text-[3vw] font-extrabold text-primary leading-none mb-[0.5vh]">₹7,999</div>
            <div className="text-[1.5vw] text-ghost mb-[0.5vh]">per month</div>
            <div className="text-[1.5vw] font-semibold text-accent mb-[2.5vh]">or ₹79,990 / year</div>
            <div className="border-t border-border pt-[2vh] flex flex-col gap-[1vh]">
              <div className="text-[1.5vw] text-secondary leading-snug">Full feature access</div>
              <div className="text-[1.5vw] text-secondary leading-snug">All 40+ standards</div>
              <div className="text-[1.5vw] text-secondary leading-snug">Continuous compliance</div>
              <div className="text-[1.5vw] text-secondary leading-snug">Priority email support</div>
            </div>
          </div>

          <div className="bg-card px-[1.5vw] py-[3vh] rounded-[1vw] border border-border shadow-[0_0.5vw_1.5vw_rgba(30,58,95,0.05)] flex flex-col">
            <div className="text-[1.5vw] font-bold text-muted uppercase tracking-wide mb-[1vh]">Enterprise</div>
            <div className="text-[3vw] font-extrabold text-primary leading-none mb-[0.5vh]">Custom</div>
            <div className="text-[1.5vw] text-ghost mb-[2.5vh]">Contact sales for pricing</div>
            <div className="border-t border-border pt-[2vh] flex flex-col gap-[1vh]">
              <div className="text-[1.5vw] text-secondary leading-snug">SSO &amp; SCIM</div>
              <div className="text-[1.5vw] text-secondary leading-snug">Self-hosted option</div>
              <div className="text-[1.5vw] text-secondary leading-snug">Dedicated success manager</div>
              <div className="text-[1.5vw] text-secondary leading-snug">Priority support &amp; SLA</div>
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
          <span>15 / 17</span>
        </div>
      </div>
    </div>
  );
}
