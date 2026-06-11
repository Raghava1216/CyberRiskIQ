export default function ExecutiveSummary() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          CyberRisk IQ prices cyber risk in euros and automates multi-framework
          compliance for the mid-market
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[4.5vh] flex flex-col gap-[2.6vh]">
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Converts every security weakness into an annual financial loss
              estimate (ALE) in euros
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Routes those numbers automatically into DORA, NIS2, EU AI Act and
              SEC reporting
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              The only CRQ + GRC platform built and priced for
              500–5,000-employee companies
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              The regulatory window is open now, and a working prototype already
              proves both pillars
            </p>
          </div>
        </div>

        <div className="mt-[4vh] border-l-[0.5vw] border-accent bg-accent-soft px-[2.2vw] py-[2.4vh]">
          <p className="text-[2vw] font-semibold leading-[1.35]">
            Decision requested: approve the MVP build and engage 2–4 design
            partners
          </p>
        </div>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">Executive summary</p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 02 / 12</p>
      </div>
    </div>
  );
}
