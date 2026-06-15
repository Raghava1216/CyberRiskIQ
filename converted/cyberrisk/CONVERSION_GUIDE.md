# CyberRisk IQ module — structure & conversion guide

This folder is a **staging mirror** of the target path in your real app:

```
/opt/progrecapps/software/Client/src/modules/cyberrisk/
```

Copy the whole `cyberrisk/` folder into `src/modules/` in your app. The structure mirrors
your existing modules (e.g. `grc`): default `pages/` + `forms/` + `reports/` folders, a
module `Service.js` at the root, and module-specific folders for custom logic.

---

## 1. Folder structure (matches your application model)

```
cyberrisk/
  CyberriskService.js          ← module service (mirrors GrcService.js)
  pages/                       ← DEFAULT — one component per tab + parent orchestrator
    CyberRiskDashboard.jsx     ← parent orchestrator (LandingPagesTitle + tabs)
    Dashboard.jsx Risks.jsx Threats.jsx Vulnerabilities.jsx Assets.jsx
    IOC.jsx Incidents.jsx Compliance.jsx Reports.jsx Settings.jsx Wazuh.jsx
  forms/                       ← DEFAULT — FormLayout components + co-located _JS hooks
    CR_ASSET.jsx CR_ASSET_JS.jsx
    CR_RISK_SCENARIO.jsx CR_RISK_SCENARIO_JS.jsx
  reports/                     ← DEFAULT — custom report layout components (add as needed)
  Crq/                         ← MODULE-SPECIFIC — CRQ / FAIR / ALE engine
    ALE_CALCULATION.jsx CrqOverview.jsx
  RegulatoryCompliance/        ← MODULE-SPECIFIC — DORA / NIS2 / EU AI Act
    DORA_NIS2_ROUTING.jsx RegulatoryOverview.jsx
  BlastRadius/                 ← MODULE-SPECIFIC — asset reachability + exposure
    BlastRadiusOverview.jsx
```

## 2. Conventions used (from your reference files)

- **Service** (`CyberriskService.js`): `import axios from "src/utils/AxiosInstance"`, a
  `getService(serviceMap)` lookup, thin exported call wrappers, and `accessDataSource`.
  Mirrors `GrcService.js`.
- **Pages** (Default-style): build `forms[]` / `reports[]` arrays, combine into
  `combinedItems`, render `<FormReportChartLink combinedItems={...} />` + `<ReportRuntime />`
  (+ `Chart` and module-specific sub-views). Pages take `{ year, refreshCharts }` from the
  parent; the parent owns the title, year filter and tabs.
- **Forms** (`forms/<KEY>.jsx`): a `FormLayout({ formMethods, formMetaData, form, formValues })`
  component using `Section` + `FormControl`, with a co-located `_JS` hook
  (`formMetaData.form = JSHook(form, formMetaData, formMethods, formValues)`) and `AuditTrail`
  when `formValues.objectId != null`. Mirrors `PA_GL_CONTROL.jsx` + `PA_GL_CONTROL_JS.jsx`.
- **Form-calc hooks** (e.g. `Crq/ALE_CALCULATION.jsx`): pure functions
  `(form, formMethods, arrayData)` that compute and `setValue` derived fields. Mirrors
  `RA_CALCULATION.jsx`.
- **Action/stage hooks** (e.g. `RegulatoryCompliance/DORA_NIS2_ROUTING.jsx`):
  `(formMethods, formMetaData)` that filter `formMetaData.actions` / toggle field requirements.
  Mirrors `CheckConfigaration.jsx`.
- **Composed sub-views** (`*Overview.jsx`): `{ year, refreshCharts }` components assembling
  `ReportRuntime` + `Chart` + `FormReportChartLink`. Mirrors `RiskOverview.jsx` / `ORMIssues.jsx`.
- **Import paths** are absolute `src/...` except `AuditTrail`, imported relatively from the
  `forms/` folder: `../../../components/forms/reactformutils/elements/AuditTrail`.

## 3. Placeholders to replace with your real backend metadata

All `report="CR_RPT_*"`, `chart="CR_CHT_*"`, `form/formService="cyberrisk_*"`, and
`privilege="CR_*"` strings are **placeholders**. Replace them with the real report / chart /
form / privilege keys defined in your backend metadata. The service endpoint paths in
`CyberriskService.js` are likewise placeholders — align them with your Spring Boot routes.

Field names in the `forms/` layouts (e.g. asset `hostname` / `businessValue` /
`regulatoryScope`, risk `threatEventFrequency` / `aleP50`) are taken from the CyberRisk IQ
architecture data model — confirm each against the backend form metadata for that
`formService` before going live.

## 4. After copying in

1. Drop `cyberrisk/` into `src/modules/`.
2. Route your menu/router to `pages/CyberRiskDashboard.jsx` (it owns the tabs + year filter).
3. Replace the placeholder keys (§3) with your real backend metadata keys.
4. Confirm the `CR_*` privileges exist for your test user.
5. Register the `forms/` layouts and the form-calc / routing hooks against their
   `formService` definitions in backend form metadata.
