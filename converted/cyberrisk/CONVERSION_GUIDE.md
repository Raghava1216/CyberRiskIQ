# CyberRisk module — conversion guide

This folder is a **staging mirror** of the target path in your real app:

```
/opt/progrecapps/software/Client/src/modules/cyberrisk/
  pages/   ← one thin page component per dashboard tab + the parent orchestrator
```

Copy the whole `cyberrisk/` folder into `src/modules/` in your app. Every page follows your
application-model convention: a thin shell driven by runtime engines, not hand-coded UI.

---

## 1. Page pattern — thin, runtime-driven

Each page is a thin declarative shell. The data table/list is rendered by `ReportRuntime`
(driven by a `report` key) and data-entry actions are rendered by `FormRuntimeEngine`
(driven by a `formService` key) wrapped in `OffCanvasForm`. There is **no** hand-coded
table, mock data, or axios call — the runtime engines resolve everything from backend
metadata.

Reference format (your JobScheduler page):

```jsx
import ReportRuntime from "src/components/reports/Report";
import RiskForm from "src/components/forms/reactformutils/FormRuntimeEngine";
import OffCanvasForm from "src/components/pages/OffCanvasNew";

const Risks = () => {
  return (
    <>
      <div className="ms-auto text-end mb-4 me-0">
        <OffCanvasForm
          component={
            <RiskForm formService="cyberrisk_risk" objectId={-1} offCanvas />
          }
          title="Add Risk"
        />
      </div>

      <ReportRuntime report="CR_RPT_RISKS" />
    </>
  );
};

export default Risks;
```

Notes:
- `FormRuntimeEngine` is imported and aliased to a domain-specific name per page
  (e.g. `RiskForm`, `AssetForm`). `objectId={-1}` = new record; `offCanvas` renders it in
  the slide-over panel.
- Pages with **multiple actions** import the engine once and reuse the alias with different
  `formService` values, laid out with `<div className="d-flex justify-content-end gap-2 mb-4 me-0">`.
- Pages with **no data-entry action** (Dashboard, Reports, Wazuh) render only `ReportRuntime`.
- Settings renders `FormRuntimeEngine` **inline** (no `offCanvas`, no report) as a config form.
- Pages take **no props** — the parent orchestrator owns the title, year filter, and tabs.

## 2. File / export conventions

- **JSX only** (no TypeScript).
- **Default export**, function component, **PascalCase** name.
- Import paths are absolute `src/...`:
  - `src/components/reports/Report` (default → `ReportRuntime`)
  - `src/components/forms/reactformutils/FormRuntimeEngine` (default → aliased per page)
  - `src/components/pages/OffCanvasNew` (default → `OffCanvasForm`)

## 3. Placeholder keys (rename to your real keys)

All `report="..."` and `formService="..."` strings are **placeholders** — rename them to the
real report/form keys defined in your backend metadata.

| Page                | report key             | formService key(s)                                   |
|---------------------|------------------------|------------------------------------------------------|
| Dashboard.jsx       | `CR_RPT_DASHBOARD`     | —                                                    |
| Risks.jsx           | `CR_RPT_RISKS`         | `cyberrisk_risk`                                     |
| Threats.jsx         | `CR_RPT_THREATS`       | `cyberrisk_threat`                                   |
| Vulnerabilities.jsx | `CR_RPT_VULNERABILITIES` | `cyberrisk_vuln_scan_import`, `cyberrisk_cve_browse` |
| Assets.jsx          | `CR_RPT_ASSETS`        | `cyberrisk_asset`, `cyberrisk_asset_import`          |
| IOC.jsx             | `CR_RPT_IOC`           | `cyberrisk_ioc`, `cyberrisk_ioc_import`              |
| Incidents.jsx       | `CR_RPT_INCIDENTS`     | `cyberrisk_incident`                                 |
| Compliance.jsx      | `CR_RPT_COMPLIANCE`    | `cyberrisk_assessment`                               |
| Reports.jsx         | `CR_RPT_REPORTS`       | —                                                    |
| Settings.jsx        | —                      | `cyberrisk_settings` (inline)                        |
| Wazuh.jsx           | `CR_RPT_WAZUH`         | —                                                    |

## 4. Parent orchestrator — `CyberRiskDashboard.jsx`

The parent owns the tabbed layout, the `LandingPagesTitle` (title + year filter), the
Dashboard-tab `DashboardCards` / `Chart` / `ReportRuntime` / `FormReportChartLink` strip, and
renders each thin page inside its `Tab.Pane`. Shell component usage:

```jsx
<LandingPagesTitle title={activeTitle} fontawsomeIcon={faGauge} tabs={TABS}
  showYearFilter updateValue={setActiveTab} onYearChange={setYear} />
<DashboardCards cardDataArray={moduleCards} year={year} currentUserInfo={currentUserInfo} />
<FormReportChartLink combinedItems={combinedItems} />
<Chart chart="CR_CHT_RISK_SEVERITY" yearFlag yearProp={year} key={refreshCharts} />
<ReportRuntime report="CR_RPT_TOP_RISKS" yearProp={year} />
```

`TABS` items: `{ key, title, privilege }`. `DashboardCards` items:
`{ title, count, icon, createAccess, viewAccess, api, report }`. `FormReportChartLink` items:
`{ type: "form"|"report"|"chart", title, form|report|chart: "ID", privilege }`.
Chart/report/form IDs use the `CR_CHT_*` / `CR_RPT_*` / `CR_FORM_*` placeholder prefixes.

## 5. Privileges (CR_* — match the TABS list)

`CR_DASHBOARD, CR_RISK, CR_THREAT, CR_VULN, CR_ASSET, CR_IOC, CR_INCIDENT, CR_COMPLIANCE, CR_REPORTS, CR_SETTINGS, CR_WAZUH`.

## 6. What you (the app owner) do after copying in

1. Drop `cyberrisk/` into `src/modules/`.
2. Route to `pages/CyberRiskDashboard.jsx` from your menu/router (it owns the tabs + year filter).
3. Replace the placeholder `report` / `formService` / chart keys (§3, §4) with your real
   backend metadata keys.
4. Confirm the `CR_*` privileges exist for your test user.
