import axios from "src/utils/AxiosInstance";

// CyberRisk IQ module service.
// Mirrors the GrcService.js pattern: a serviceMap of logical keys -> backend
// endpoints, plus thin exported wrappers that build params and call axios.
// Endpoint paths below are CyberRisk IQ placeholders — align them with the real
// Spring Boot routes (asset-ingestion-service / crq-engine-service /
// grc-workflow-service) before wiring to a live backend.

function getService(service) {
  const serviceMap = {
    // shared / framework
    getUserInfo: "/util/getUserInfo",
    getModuleInfo: "/util/getModuleInfo",
    getPrivilegeInfo: "/util/getPrivilegeInfo",
    getForms: "/util/getForms",
    viewdata: "/viewdata",
    objectinfo: "/util/getFormData",
    objectdetails: "/form",
    configurationsetup: "/configurationsetup",

    // Layer 1 — assets & vulnerabilities
    assetSummary: "/cyberrisk/asset/summary",
    assetBlastRadius: "/cyberrisk/asset/blastradius",
    vulnerabilitySummary: "/cyberrisk/vulnerability/summary",
    vulnerabilityImport: "/cyberrisk/vulnerability/import",
    iocSummary: "/cyberrisk/ioc/summary",

    // Layer 2 — CRQ engine (FAIR / ALE)
    aleCalculate: "/cyberrisk/crq/ale",
    aleByAsset: "/cyberrisk/crq/ale/asset",
    aleByBusinessUnit: "/cyberrisk/crq/ale/businessunit",
    monteCarlo: "/cyberrisk/crq/montecarlo",
    topRisks: "/cyberrisk/crq/toprisks",

    // Layer 4 — GRC + regulatory (DORA / NIS2 / EU AI Act)
    riskRegister: "/cyberrisk/risk/register",
    regulatoryObligations: "/cyberrisk/regulatory/obligations",
    regulatoryEvidence: "/cyberrisk/regulatory/evidence",
    incidentSummary: "/cyberrisk/incident/summary",
    complianceStatus: "/cyberrisk/compliance/status",

    // dashboards
    dashboardCounts: "/cyberrisk/dashboard/counts",
    exposureTrend: "/cyberrisk/dashboard/exposuretrend",
  };

  return serviceMap[service] || undefined;
}

export function getServiceData(service, id) {
  let API_BASE_URL = getService(service);
  if (id) {
    API_BASE_URL = API_BASE_URL + "/" + id;
  }
  return axios.get(API_BASE_URL);
}

export function getQueryData(service) {
  const API_BASE_URL = getService(service);
  return axios.get(API_BASE_URL);
}

export function getDashboardCounts(service, orgId, year) {
  const API_BASE_URL = getService(service);
  const param = "?orgId=" + orgId + "&year=" + year;
  return axios.get(API_BASE_URL + param);
}

export function getAleByAsset(service, assetId, startFY, endFY) {
  const API_BASE_URL = getService(service);
  const param = "/" + assetId + "/" + startFY + "/" + endFY;
  return axios.get(API_BASE_URL + param);
}

export function getAleByBusinessUnit(service, orgId, startFY, endFY) {
  const API_BASE_URL = getService(service);
  const param = "?orgId=" + orgId + "&startFY=" + startFY + "&endFY=" + endFY;
  return axios.get(API_BASE_URL + param);
}

export function calculateAle(service, payload) {
  const API_BASE_URL = getService(service);
  return axios.post(API_BASE_URL, payload);
}

export function runMonteCarlo(service, payload) {
  const API_BASE_URL = getService(service);
  return axios.post(API_BASE_URL, payload);
}

export function getBlastRadius(service, assetId, hops = 3) {
  const API_BASE_URL = getService(service);
  const param = "/" + assetId + "?hops=" + hops;
  return axios.get(API_BASE_URL + param);
}

export function getRegulatoryObligations(service, framework, year) {
  const API_BASE_URL = getService(service);
  const param = "?framework=" + framework + "&year=" + year;
  return axios.get(API_BASE_URL + param);
}

export function importVulnerabilities(service, payload) {
  const API_BASE_URL = getService(service);
  return axios.post(API_BASE_URL, payload);
}

export function getviewData(
  entity,
  pageNumber = 0,
  pageSize = 0,
  sortField = "",
  sortOrder = "",
  orderExpression = "",
  filterExpression = "",
) {
  const API_BASE_URL = getService("viewdata");

  return axios.get(
    `${API_BASE_URL}?entity=${entity.viewName}` +
      `&pageNumber=${entity.pageNumber ?? pageNumber}` +
      `&pageSize=${entity.pageSize ?? pageSize}` +
      `&sortField=${entity.sortField ?? sortField}` +
      `&sortOrder=${entity.sortOrder ?? sortOrder}` +
      `&OrderExpression=${entity.orderExpression ?? orderExpression}` +
      `&filterExpression=${entity.filterExpression ?? filterExpression}`,
  );
}

export function accessDataSource(dataSource) {
  const reportName = dataSource.reportName;
  const pageNumber =
    dataSource.pageNumber !== undefined ? dataSource.pageNumber : 0;
  const pageSize = dataSource.pageSize !== undefined ? dataSource.pageSize : 0;
  const responseType =
    dataSource.responseType !== undefined ? dataSource.responseType : "data";

  const API_BASE_URL = "/report/" + encodeURIComponent(reportName);
  const query = `?pageNumber=${pageNumber}&pageSize=${pageSize}&responseType=${responseType}`;

  const body = {
    filterExpression: dataSource.filterExpression || "",
    defaultFilterParams: dataSource.defaultFilterParams || "",
    selectedReportColumns: dataSource.selectedReportColumns || [],
    selectedYears: dataSource.selectedYears || [],
    conditionsList: dataSource.conditionsList || [],
    sortCondition: dataSource.sortCondition || {},
  };

  return axios.post(API_BASE_URL + query, body);
}
