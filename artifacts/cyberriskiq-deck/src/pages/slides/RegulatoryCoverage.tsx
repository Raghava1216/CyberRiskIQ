export default function RegulatoryCoverage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          One assessment drives DORA, NIS2, EU AI Act and SEC reporting
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[4vh] grid grid-cols-[16vw_1fr]">
          <div className="border-b border-hairline bg-accent-soft px-[1.6vw] py-[1.6vh] text-[1.5vw] font-bold">
            Framework
          </div>
          <div className="border-b border-hairline bg-accent-soft px-[1.6vw] py-[1.6vh] text-[1.5vw] font-bold">
            What CyberRisk IQ produces
          </div>

          <div className="border-b border-hairline px-[1.6vw] py-[1.9vh] text-[1.55vw] font-semibold">
            DORA
          </div>
          <div className="border-b border-hairline px-[1.6vw] py-[1.9vh] text-[1.55vw] leading-[1.3]">
            Live ICT risk register, incident classification, 72-hour report
            templates
          </div>

          <div className="border-b border-hairline px-[1.6vw] py-[1.9vh] text-[1.55vw] font-semibold">
            NIS2
          </div>
          <div className="border-b border-hairline px-[1.6vw] py-[1.9vh] text-[1.55vw] leading-[1.3]">
            Entity classification, 10-domain obligation tracker, 24/72-hour
            notifications
          </div>

          <div className="border-b border-hairline px-[1.6vw] py-[1.9vh] text-[1.55vw] font-semibold">
            EU AI Act
          </div>
          <div className="border-b border-hairline px-[1.6vw] py-[1.9vh] text-[1.55vw] leading-[1.3]">
            Shadow-AI inventory, risk-tier classification, SHAP explainability
            (Article 13)
          </div>

          <div className="px-[1.6vw] py-[1.9vh] text-[1.55vw] font-semibold">
            SEC
          </div>
          <div className="px-[1.6vw] py-[1.9vh] text-[1.55vw] leading-[1.3]">
            Materiality determination and disclosure drafting
          </div>
        </div>

        <div className="mt-[3.2vh] border-l-[0.5vw] border-accent bg-accent-soft px-[2.2vw] py-[2.2vh]">
          <p className="text-[2vw] font-semibold leading-[1.35]">
            Unified Control Library — “fix once, satisfy all”: test a control
            once, satisfy every framework and insurers
          </p>
        </div>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">
          SHAP = Shapley-value model explainability, per EU AI Act Article 13.
        </p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 08 / 12</p>
      </div>
    </div>
  );
}
