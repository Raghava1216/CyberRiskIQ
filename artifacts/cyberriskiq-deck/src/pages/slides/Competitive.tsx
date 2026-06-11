export default function Competitive() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          We are the only CRQ and GRC platform priced for the mid-market
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[4vh] grid grid-cols-[18vw_1fr]">
          <div className="border-b border-hairline bg-accent-soft px-[1.6vw] py-[1.5vh] text-[1.5vw] font-bold">
            Vendor
          </div>
          <div className="border-b border-hairline bg-accent-soft px-[1.6vw] py-[1.5vh] text-[1.5vw] font-bold">
            Where it falls short for the mid-market
          </div>

          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] font-semibold">
            Safe Security
          </div>
          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] leading-[1.3]">
            Strong financial CRQ, but no regulatory/GRC workflow; enterprise
            pricing
          </div>

          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] font-semibold">
            Qualys
          </div>
          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] leading-[1.3]">
            Vulnerability scanning at scale, but no financial ALE and no
            compliance layer
          </div>

          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] font-semibold">
            ServiceNow GRC
          </div>
          <div className="border-b border-hairline px-[1.6vw] py-[1.8vh] text-[1.5vw] leading-[1.3]">
            Deep compliance workflow, but heat maps only — no live euro values
          </div>

          <div className="bg-accent px-[1.6vw] py-[1.8vh] text-[1.5vw] font-bold text-white">
            CyberRisk IQ
          </div>
          <div className="bg-accent px-[1.6vw] py-[1.8vh] text-[1.5vw] font-semibold leading-[1.3] text-white">
            Financial CRQ + GRC + multi-framework regulatory at mid-market
            pricing
          </div>
        </div>

        <p className="mt-[3.4vh] text-[2vw] leading-[1.35] text-muted">
          We integrate with the scanners customers already own — ~30-minute
          setup, not rip-and-replace
        </p>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">
          Positioning assessment based on publicly described product scope.
        </p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 09 / 12</p>
      </div>
    </div>
  );
}
