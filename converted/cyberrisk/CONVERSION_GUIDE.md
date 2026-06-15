# CyberRisk module — conversion guide

This folder is a **staging mirror** of the target path in your real app:

```
/opt/progrecapps/software/Client/src/modules/cyberrisk/
  pages/      ← page components (one per dashboard tab) + the parent orchestrator
  forms/      ← modals / data-entry forms (converted from the dashboard's *Modal components)
  reports/    ← tabular / list report components
  charts/     ← bespoke chart/visualization components (matrix, gauges, donuts, etc.)
```

Copy the whole `cyberrisk/` folder into `src/modules/` in your app. Everything uses your
application-model conventions so it drops in and renders during validation.

---

## 1. Data strategy — HYBRID (mock fallback + axios)

Every page follows the same pattern so it **renders immediately during validation** but is
already wired for your backend:

```jsx
// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Copied verbatim from the original threat-dashboard mock data so the page renders
// before the real endpoints exist. Delete this block and the fallback assignments
// once `/cyberrisk/...` endpoints return data.
const MOCK_RISKS = [ /* ... */ ];
// ======================================================================================

const CyberRiskRisks = ({ year, currentUserInfo, refreshCharts }) => {
  const { t } = useTranslation("common");
  const [risks, setRisks] = useState(MOCK_RISKS); // mock fallback as initial state

  useEffect(() => {
    const logInId = currentUserInfo?.logInId;
    // HYBRID: real backend call — on success it replaces the mock fallback above.
    axios
      .get(`/cyberrisk/risks/${logInId}?year=${Number(year)}`)
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length) setRisks(res.data);
      })
      .catch((err) => {
        // Falls back to MOCK_RISKS so the page still renders during validation.
        console.warn("[cyberrisk] risks: using mock fallback", err);
      });
  }, [year, currentUserInfo, refreshCharts]);
  // ...
};
```

Rules:
- Mock data is the **initial state** + the catch fallback. Clearly fenced with the banner above.
- Real data comes from `axios.get("/cyberrisk/<resource>/<logInId>?year=<year>")` (adjust the
  endpoint names to your API when wiring — they are placeholders).
- For things your generic engines already produce, use `<Chart chart="ID" />` /
  `<ReportRuntime report="ID" />` instead of bespoke widgets (see §5). Chart/report IDs use the
  `CR_CHT_*` / `CR_RPT_*` / `CR_FORM_*` prefixes.

---

## 2. File / export conventions

- **JSX only** (no TypeScript). Strip all type annotations, `interface`, `type`, generics, `as`.
- **Default export**, function component, **PascalCase** name (e.g. `const CyberRiskRisks = (...) => {}; export default CyberRiskRisks;`).
- Page props signature: `({ year, currentUserInfo, refreshCharts, onNavigate })`.
  - `year` — current filter year (string), supplied by the parent via `LandingPagesTitle` onYearChange.
  - `currentUserInfo` — `{ ...getCurrentUser(), logInId }`. Use `currentUserInfo?.logInId` in axios URLs.
  - `refreshCharts` — counter; pass as `key={refreshCharts}` to `<Chart>` to force refresh.
  - `onNavigate` — `(tabKey) => void` to switch the active tab (parent passes `setActiveTab`).

## 3. Import conventions (absolute `src/...` paths)

```jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, Row, Col, Badge, Nav, Tab, Container, Modal, Button, ProgressBar, Table, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation /* ... */ } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "src/utils/AxiosInstance";
import * as util from "src/components/forms/reactformutils/elements/formutilfunctions";

// shared shell components (the user's real ones):
import LandingPagesTitle from "src/components/pages/LandingPagesTitle";
import DashboardCards from "src/components/pages/DashboardCards";
import FormReportChartLink from "src/components/pages/FormReportChartLink";
import Chart from "src/components/charts/Chart";
import ReportRuntime from "src/components/reports/Report";

// module-local imports use the absolute module path:
import AddRiskForm from "src/modules/cyberrisk/forms/AddRiskForm";
import RiskMatrix from "src/modules/cyberrisk/charts/RiskMatrix";
```

## 4. Mandatory transforms when converting each dashboard page

1. **Remove** `react-feather` — replace every icon with `<FontAwesomeIcon icon={faX} />`.
   Mapping used across the dashboard:
   | react-feather       | FontAwesome (free-solid)        |
   |---------------------|---------------------------------|
   | AlertTriangle       | faTriangleExclamation           |
   | Shield              | faShieldHalved                  |
   | DollarSign          | faDollarSign                    |
   | BarChart2           | faChartColumn                   |
   | TrendingUp          | faArrowTrendUp                  |
   | TrendingDown        | faArrowTrendDown                |
   | CheckCircle         | faCircleCheck                   |
   | XCircle             | faCircleXmark                   |
   | ArrowUpRight        | faArrowUpRightFromSquare        |
   | ArrowDownRight      | faArrowTrendDown                |
   | Search              | faMagnifyingGlass               |
   | Plus                | faPlus                          |
   | Upload              | faUpload                        |
   | Download            | faDownload                      |
   | Filter              | faFilter                        |
   | Eye                 | faEye                           |
   | Edit/Edit2          | faPenToSquare                   |
   | Trash/Trash2        | faTrashCan                      |
   | Clock               | faClock                         |
   | Server              | faServer                        |
   For inline sizing use `style={{ fontSize: 14, color }}` instead of feather's `size`/`color` props.
2. **Wrap user-facing strings** in `t("...")` (`const { t } = useTranslation("common");`).
3. **Remove** `../lib/types` and other TS-only imports. Inline a tiny severity-variant helper
   instead of importing a shared `SeverityBadge` (folders are limited to pages/forms/reports/charts):
   ```jsx
   const sevVariant = (s) => ({ Critical: "danger", High: "warning", Medium: "info", Low: "secondary", Informational: "light" }[s] || "secondary");
   // usage: <Badge bg={sevVariant(row.severity)}>{t(row.severity)}</Badge>
   ```
4. **Modals → forms/**: extract each `*Modal` into `forms/<Name>Form.jsx` as a default-export
   component taking `{ show, onHide, onSaved }` (preserve the form fields/validation; swap the
   mock "add" for an `axios.post("/cyberrisk/...")` with a try/catch, mock fallback ok). The page
   imports and renders it.
5. **Keep the existing visual design** (inline styles, bootstrap classes). Only the data layer,
   icons, i18n and imports change. Do **not** redesign.
6. Drop `ThemeProvider`/`ThemeContext`, `TopBar`, and the local `platform/*` wrappers — the host
   app already provides chrome. Use `<Chart>`/`<ReportRuntime>` directly where those wrappers were.

## 5. Shell component usage (exact props)

`LandingPagesTitle` — rendered by the **parent** only:
```jsx
<LandingPagesTitle title={activeTitle} fontawsomeIcon={faGauge} tabs={TABS}
  showYearFilter updateValue={setActiveTab} onYearChange={setYear} />
```
`tabs` items: `{ key, title, privilege }`. It filters by `getCurrentUser().privileges`.

`DashboardCards`:
```jsx
<DashboardCards cardDataArray={moduleCards} year={year} currentUserInfo={currentUserInfo} />
```
card items: `{ title, count, icon: faX, createAccess, viewAccess, upload, api, report }` (api = form service id, report = report id).

`FormReportChartLink`:
```jsx
<FormReportChartLink combinedItems={combinedItems} />
```
items: `{ type: "form"|"report"|"chart", title, form|report|chart: "ID", privilege, upload? }`.

`Chart` / `ReportRuntime`:
```jsx
<Chart chart="CR_CHT_RISK_SEVERITY" yearFlag yearProp={year} key={refreshCharts} />
<ReportRuntime report="CR_RPT_TOP_RISKS" yearProp={year} />
```

## 6. Privileges (CR_* — match the TABS list)

`CR_DASHBOARD, CR_RISK, CR_THREAT, CR_VULN, CR_ASSET, CR_IOC, CR_INCIDENT, CR_COMPLIANCE, CR_REPORTS, CR_SETTINGS, CR_WAZUH`.
Gate page-level create/edit actions with:
```jsx
const privs = util.getCurrentUser().privileges?.split(",") || [];
const canEdit = privs.includes("CR_RISK");
```

## 7. Page ↔ file map

| Dashboard source (src/pages)         | Output (pages/)                | Forms (forms/)                                  | Charts (charts/) |
|--------------------------------------|--------------------------------|-------------------------------------------------|------------------|
| App.tsx (orchestrator)               | CyberRiskDashboard.jsx ✅       | —                                               | —                |
| Dashboard.tsx                        | Dashboard.jsx ✅                | —                                               | (inline gauges)  |
| Risks.tsx                            | Risks.jsx                      | AddRiskForm.jsx                                 | RiskMatrix.jsx   |
| Threats.tsx                          | Threats.jsx                    | —                                               | —                |
| Vulnerabilities.tsx                  | Vulnerabilities.jsx            | BrowseCVEForm.jsx, ImportScanForm.jsx           | —                |
| Assets.tsx                           | Assets.jsx                     | AddAssetForm.jsx, ImportAssetCSVForm.jsx        | —                |
| IOC.tsx                              | IOC.jsx                        | AddIOCForm.jsx, ImportIOCCSVForm.jsx            | —                |
| Incidents.tsx                        | Incidents.jsx                  | DeclareIncidentForm.jsx                         | —                |
| Compliance.tsx                       | Compliance.jsx                 | RunAssessmentForm.jsx, AssessmentReviewPanel.jsx| —                |
| Reports.tsx                          | Reports.jsx                    | —                                               | —                |
| Settings.tsx                         | Settings.jsx                   | —                                               | —                |
| WazuhPage.tsx                        | Wazuh.jsx                      | —                                               | —                |

✅ = already authored as the canonical exemplars. Match their structure exactly.

## 8. What you (the app owner) do after copying in

1. Drop `cyberrisk/` into `src/modules/`.
2. Route to `pages/CyberRiskDashboard.jsx` from your menu/router (it owns the tabs + year filter).
3. Confirm the `CR_*` privileges exist for your test user (or temporarily relax the tab filter).
4. Pages render on mock fallback. Wire the real `/cyberrisk/...` endpoints + the `CR_CHT_*` /
   `CR_RPT_*` chart/report definitions, then delete the `MOCK_*` fallback blocks.
