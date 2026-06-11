export default function Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="absolute inset-0 flex flex-col justify-center px-[8vw]">
        <p className="text-[1.5vw] font-semibold uppercase tracking-[0.34em] text-accent">
          Cyber Risk Quantification &amp; GRC
        </p>

        <h1 className="mt-[3vh] font-display text-[8vw] font-bold leading-[0.95] tracking-tight">
          CyberRisk IQ
        </h1>

        <p
          className="mt-[5vh] max-w-[66vw] text-[2.6vw] font-semibold leading-[1.15]"
          style={{ textWrap: "balance" }}
        >
          Cyber risk in euros. Compliance on autopilot.
        </p>

        <p className="mt-[2.4vh] text-[2vw] text-muted">
          Built for the mid-market (500–5,000 employees).
        </p>
      </div>

      <div className="absolute bottom-[5vh] left-[8vw] right-[8vw] flex items-center justify-between border-t border-hairline pt-[2.2vh]">
        <p className="text-[1.5vw] text-muted">
          Board &amp; Industry Review — June 2026
        </p>
        <p className="text-[1.5vw] font-semibold uppercase tracking-[0.24em] text-accent">
          Confidential
        </p>
      </div>
    </div>
  );
}
