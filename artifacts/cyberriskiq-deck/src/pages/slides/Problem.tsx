export default function Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          Mid-market firms cannot price cyber risk or keep pace with new EU
          regulation
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[5vh] flex flex-col gap-[3vh]">
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Boards receive severity scores (CVSS 0–10) and red-amber-green heat
              maps — not euros
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Two systems with the same score can carry vastly different
              financial exposure
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              DORA, NIS2 and the EU AI Act demand live, quantified risk registers
              — most run on spreadsheets
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Enterprise tools start at €150,000+/year with ~6-month rollouts —
              unaffordable below enterprise scale
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Under NIS2, board members now hold personal liability for
              inadequate oversight
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">
          DORA in force Jan 2025 · NIS2 transposition deadline Oct 2024
        </p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 03 / 12</p>
      </div>
    </div>
  );
}
