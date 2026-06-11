export default function PerRiskModel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          Every risk carries a euro value, a recovery profile, and a mitigation
          ROI
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[4.5vh] flex flex-col gap-[2.6vh]">
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              ALE is expressed as a range: P10 best case, P50 most likely, P90
              worst case
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Recovery profile reflects controls, segmentation, backups and
              insurance — compressing the worst-case tail
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Mitigation ROI = (current ALE − projected ALE after the fix) ÷
              remediation cost
            </p>
          </div>
        </div>

        <div className="mt-[3.5vh] bg-accent-soft px-[2.4vw] py-[2.6vh]">
          <p className="text-[1.5vw] font-semibold uppercase tracking-[0.18em] text-accent">
            Worked example
          </p>
          <p className="mt-[1vh] text-[2vw] font-semibold leading-[1.35]">
            A €30K fix that removes €2M of exposure ranks far above an €80K fix
            that removes €50K
          </p>
        </div>

        <p className="mt-[3.2vh] text-[2vw] leading-[1.35] text-muted">
          Output: a prioritised, board-justifiable security budget in euros
        </p>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">
          ALE = Annualised Loss Expectancy; P10/P50/P90 = simulation percentiles.
        </p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 06 / 12</p>
      </div>
    </div>
  );
}
