export default function Architecture() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          A five-layer, event-driven architecture scales from prototype to
          production
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[5vh] flex flex-col gap-[3vh]">
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              React + TypeScript front end (built today) behind a Spring Cloud
              Gateway
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Four Spring Boot services — asset ingestion, CRQ engine, GRC
              workflow — plus a Python ML sidecar
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              Apache Kafka decouples services: a new CVE triggers automatic ALE
              recalculation
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              PostgreSQL with schema-per-tenant isolation; OAuth2/SAML2 and
              role-based access control
            </p>
          </div>
          <div className="flex gap-[1.4vw]">
            <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
            <p className="text-[2vw] leading-[1.4]">
              ML layer: risk propagation, anomaly detection, and SHAP
              explainability for the EU AI Act
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">
          Layers: presentation · gateway · services · data · ML.
        </p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 10 / 12</p>
      </div>
    </div>
  );
}
