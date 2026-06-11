import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { name: "2025", value: 4.84, label: "$4.84B" },
  { name: "2031", value: 9.66, label: "$9.66B" },
];

export default function MarketWindow() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute top-0 left-0 h-[1.2vh] w-full bg-accent" />

      <div className="flex h-full flex-col px-[7vw] pt-[7.5vh]">
        <h2 className="max-w-[84vw] font-display text-[2.5vw] font-bold leading-[1.18]">
          Regulation and market growth have opened a mid-market window now
        </h2>
        <div className="mt-[1.8vh] h-[0.4vh] w-[7vw] bg-accent" />

        <div className="mt-[5vh] grid grid-cols-[1fr_36vw] gap-[4vw]">
          <div className="flex flex-col gap-[3vh]">
            <div className="flex gap-[1.4vw]">
              <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
              <p className="text-[2vw] leading-[1.4]">
                CRQ market: $4.84B in 2025, growing to $9.66B by 2031
              </p>
            </div>
            <div className="flex gap-[1.4vw]">
              <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
              <p className="text-[2vw] leading-[1.4]">
                Mid-market is the fastest-growing buyer segment at ~14.62% per
                year
              </p>
            </div>
            <div className="flex gap-[1.4vw]">
              <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
              <p className="text-[2vw] leading-[1.4]">
                DORA (Jan 2025), NIS2 (Oct 2024) and the EU AI Act are in force;
                fines reach 2% of global revenue
              </p>
            </div>
            <div className="flex gap-[1.4vw]">
              <span className="mt-[1.1vh] h-[0.85vh] w-[0.85vh] shrink-0 bg-accent" />
              <p className="text-[2vw] leading-[1.4]">
                Safe Security's acquisition of Balbix (Nov 2025) validates the
                model — but only for large enterprise
              </p>
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-[1.5vw] font-semibold text-muted">
              CRQ market size (USD)
            </p>
            <div className="mt-[1vh] h-[46vh] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 44, right: 8, left: 8, bottom: 8 }}
                >
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={{ stroke: "#e4e4e7" }}
                    tick={{ fontSize: 30, fill: "#6b7280", fontWeight: 600 }}
                  />
                  <YAxis hide domain={[0, 11]} />
                  <Bar dataKey="value" barSize={120} radius={[4, 4, 0, 0]}>
                    <Cell fill="#9ca3af" />
                    <Cell fill="#0e6e63" />
                    <LabelList
                      dataKey="label"
                      position="top"
                      style={{ fontSize: 40, fontWeight: 700, fill: "#18181b" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[4.2vh] left-[7vw] right-[7vw] flex items-end justify-between border-t border-hairline pt-[1.8vh]">
        <p className="text-[1.5vw] text-muted">
          Source: market figures per CyberRisk IQ market research.
        </p>
        <p className="text-[1.5vw] text-muted">CyberRisk IQ · 04 / 12</p>
      </div>
    </div>
  );
}
