export default function FairMonteCarlo() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          Every euro traces to the open FAIR standard run through Monte Carlo
          simulation
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[4vh] flex flex-col gap-[1.9vh]">
          <div className="flex items-baseline gap-[1.4vw]">
            <span className="w-[3.2vw] shrink-0 font-display text-[2vw] font-bold text-accent">
              01
            </span>
            <p className="text-[2vw] leading-[1.35]">
              <span className="font-semibold">Threat Event Frequency</span> — how
              often attackers would try
            </p>
          </div>
          <div className="flex items-baseline gap-[1.4vw]">
            <span className="w-[3.2vw] shrink-0 font-display text-[2vw] font-bold text-accent">
              02
            </span>
            <p className="text-[2vw] leading-[1.35]">
              <span className="font-semibold">Vulnerability</span> — likelihood
              of success given current controls
            </p>
          </div>
          <div className="flex items-baseline gap-[1.4vw]">
            <span className="w-[3.2vw] shrink-0 font-display text-[2vw] font-bold text-accent">
              03
            </span>
            <p className="text-[2vw] leading-[1.35]">
              <span className="font-semibold">Loss Event Frequency</span> = Step 1
              × Step 2
            </p>
          </div>
          <div className="flex items-baseline gap-[1.4vw]">
            <span className="w-[3.2vw] shrink-0 font-display text-[2vw] font-bold text-accent">
              04
            </span>
            <p className="text-[2vw] leading-[1.35]">
              <span className="font-semibold">Loss Magnitude</span> — full cost of
              one loss (direct + indirect)
            </p>
          </div>
          <div className="flex items-baseline gap-[1.4vw]">
            <span className="w-[3.2vw] shrink-0 font-display text-[2vw] font-bold text-accent">
              05
            </span>
            <p className="text-[2vw] leading-[1.35]">
              <span className="font-semibold">ALE</span> = Loss Event Frequency ×
              Loss Magnitude
            </p>
          </div>
        </div>

        <div className="mt-[3.4vh] border-l-[0.5vw] border-accent bg-accent-soft px-[2.2vw] py-[2.2vh]">
          <p className="text-[2vw] font-semibold leading-[1.35]">
            A 10,000-iteration Monte Carlo run produces the P10/P50/P90 range —
            auditor-reproducible, no black box
          </p>
        </div>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">
          Source: FAIR (Factor Analysis of Information Risk) standard.
        </p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 07 / 12</p>
      </div>
    </div>
  );
}
