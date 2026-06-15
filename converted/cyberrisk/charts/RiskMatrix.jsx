import React from "react";
import { useTranslation } from "react-i18next";

// Faithful conversion of the dashboard's 5×5 likelihood/impact heat-map.
// Tailwind color classes are replaced with inline rgba() values; bespoke
// visualization lives in charts/ per the module convention.
const E = { bg: "rgba(16,185,129,0.20)", border: "rgba(16,185,129,0.30)" }; // emerald / Low
const A = { bg: "rgba(245,158,11,0.20)", border: "rgba(245,158,11,0.30)" }; // amber / Medium
const O = { bg: "rgba(249,115,22,0.20)", border: "rgba(249,115,22,0.30)" }; // orange / High
const R = { bg: "rgba(239,68,68,0.20)", border: "rgba(239,68,68,0.30)" }; // red / Critical

// Indexed as COLORS[5 - likelihood][impact - 1], matching the original grid.
const COLORS = [
  [A, A, O, O, R],
  [E, A, A, O, R],
  [E, E, A, O, R],
  [E, E, E, A, O],
  [E, E, E, E, A],
];

const RiskMatrix = ({ risks = [] }) => {
  const { t } = useTranslation("common");

  const getCellRisks = (likelihood, impact) =>
    risks.filter((r) => r.likelihood === likelihood && r.impact === impact);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 320 }}>
        <div className="d-flex align-items-start gap-2">
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ width: 24, marginTop: 32, marginBottom: 16 }}>
            <span style={{ color: "#98a2b3", fontSize: "0.72rem", whiteSpace: "nowrap", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
              {t("LIKELIHOOD")} →
            </span>
          </div>
          <div className="flex-fill">
            <div className="d-flex gap-1 mb-1" style={{ paddingLeft: 24 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-fill text-center" style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{i}</div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 4, gridTemplateColumns: "24px repeat(5, 1fr)" }}>
              {[5, 4, 3, 2, 1].map((likelihood) => (
                <React.Fragment key={`row-${likelihood}`}>
                  <div className="d-flex align-items-center justify-content-center fw-medium" style={{ fontSize: "0.72rem", color: "#98a2b3" }}>
                    {likelihood}
                  </div>
                  {[1, 2, 3, 4, 5].map((impact) => {
                    const cellRisks = getCellRisks(likelihood, impact);
                    const c = COLORS[5 - likelihood][impact - 1];
                    return (
                      <div
                        key={`${likelihood}-${impact}`}
                        className="d-flex align-items-center justify-content-center rounded"
                        style={{ aspectRatio: "1 / 1", background: c.bg, border: `1px solid ${c.border}` }}
                        title={cellRisks.map((r) => r.title).join(", ")}
                      >
                        {cellRisks.length > 0 && (
                          <span className="fw-bold" style={{ color: "#344054", fontSize: "0.72rem" }}>{cellRisks.length}</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-2 text-center" style={{ fontSize: "0.72rem", color: "#98a2b3", paddingLeft: 24 }}>{t("IMPACT")} →</div>
          </div>
        </div>
        <div className="d-flex gap-4 mt-3 flex-wrap">
          {[
            { label: t("Low"), c: E.bg },
            { label: t("Medium"), c: A.bg },
            { label: t("High"), c: O.bg },
            { label: t("Critical"), c: R.bg },
          ].map((l) => (
            <div key={l.label} className="d-flex align-items-center gap-2" style={{ fontSize: "0.72rem", color: "#667085" }}>
              <span className="rounded d-inline-block" style={{ width: 12, height: 12, background: l.c }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix;
