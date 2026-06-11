export default function Roadmap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          A working prototype is built; phased delivery makes it
          production-ready
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[4vh] grid grid-cols-[18vw_1fr]">
          <div className="border-b border-hairline bg-accent-soft px-[1.6vw] py-[1.5vh] text-[1.5vw] font-bold">
            Stage
          </div>
          <div className="border-b border-hairline bg-accent-soft px-[1.6vw] py-[1.5vh] text-[1.5vw] font-bold">
            Scope
          </div>

          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] font-semibold">
            Now
          </div>
          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] leading-[1.3]">
            The prototype proves the full experience and risk-engine logic across
            both pillars
          </div>

          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] font-semibold">
            Phase 1 — MVP
          </div>
          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] leading-[1.3]">
            Production backend, live scanner connectors, RBAC, corrected
            risk-reduction ROI
          </div>

          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] font-semibold">
            Phase 2 — Depth
          </div>
          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] leading-[1.3]">
            Full Monte Carlo, ML layer, Unified Control Library, deeper
            regulatory workflows
          </div>

          <div className="px-[1.6vw] py-[1.8vh] text-[1.5vw] font-semibold">
            Phase 3 — Scale
          </div>
          <div className="px-[1.6vw] py-[1.8vh] text-[1.5vw] leading-[1.3]">
            Multi-tenant SaaS, public API, GRC-suite sync, forecasting
            intelligence
          </div>
        </div>

        <p className="mt-[3.4vh] text-[2vw] font-semibold leading-[1.35]">
          Remaining gaps are scoped engineering, not open questions
        </p>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">
          RBAC = role-based access control.
        </p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 11 / 12</p>
      </div>
    </div>
  );
}
