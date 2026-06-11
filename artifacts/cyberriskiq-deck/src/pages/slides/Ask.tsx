export default function Ask() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary font-body text-white">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.6vw] font-bold leading-[1.18]">
          We request approval to proceed to MVP and engage design partners
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[5vh] flex flex-col gap-[3vh]">
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Approve Phase 1: build the production backend behind the validated
              prototype
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Authorise engagement of 2–4 mid-market design-partner customers as
              reference accounts
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Resource the Phase 1 team across engineering, compliance SME input
              and go-to-market
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] font-semibold leading-[1.4]">
              The regulatory window is open and the mid-market is unserved —
              delay cedes timing to incumbents
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] left-[7vw] right-[7vw] flex items-center justify-between border-t border-white/20 pt-[2.2vh]">
        <p className="text-[1.5vw] font-bold tracking-tight">CyberRisk IQ</p>
        <p className="text-[1.5vw] font-semibold uppercase tracking-[0.24em] text-white/70">
          Confidential
        </p>
      </div>
    </div>
  );
}
