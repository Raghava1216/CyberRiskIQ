export default function TwoPillars() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          Two pillars share one risk engine: quantification and compliance
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[5vh] grid grid-cols-2 gap-[4vw]">
          <div className="border-t-[0.5vh] border-accent bg-accent-soft px-[2.4vw] py-[3vh]">
            <p className="text-[1.5vw] font-semibold uppercase tracking-[0.2em] text-accent">
              Pillar 1
            </p>
            <p className="mt-[0.8vh] text-[2vw] font-bold">
              Cyber Risk Quantification
            </p>
            <div className="mt-[3vh] flex flex-col gap-[2.4vh]">
              <p className="text-[2vw] leading-[1.35]">
                <span className="font-semibold">Asset Intelligence</span> —
                assets, cloud, Shadow AI, dormant identities
              </p>
              <p className="text-[2vw] leading-[1.35]">
                <span className="font-semibold">Financial Risk Scoring</span> —
                ALE in euros via FAIR + Monte Carlo
              </p>
              <p className="text-[2vw] leading-[1.35]">
                <span className="font-semibold">Remediation ROI</span> — fixes
                ranked by risk reduced per euro spent
              </p>
            </div>
          </div>

          <div className="border-t-[0.5vh] border-primary bg-white px-[2.4vw] py-[3vh]">
            <p className="text-[1.5vw] font-semibold uppercase tracking-[0.2em] text-primary">
              Pillar 2
            </p>
            <p className="mt-[0.8vh] text-[2vw] font-bold">
              GRC-Native Regulatory
            </p>
            <div className="mt-[3vh] flex flex-col gap-[2.4vh]">
              <p className="text-[2vw] leading-[1.35]">
                <span className="font-semibold">GRC Register Sync</span> —
                self-updating risk register with euro values
              </p>
              <p className="text-[2vw] leading-[1.35]">
                <span className="font-semibold">Regulatory Engine</span> — DORA,
                NIS2, EU AI Act, SEC
              </p>
              <p className="text-[2vw] leading-[1.35]">
                <span className="font-semibold">
                  Board &amp; Executive Reporting
                </span>{" "}
                — board, CISO and CFO outputs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">
          One assessment feeds both pillars from a shared risk engine.
        </p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 05 / 12</p>
      </div>
    </div>
  );
}
