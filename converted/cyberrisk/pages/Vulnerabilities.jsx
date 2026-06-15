import ReportRuntime from "src/components/reports/Report";
import VulnerabilityForm from "src/components/forms/reactformutils/FormRuntimeEngine";
import OffCanvasForm from "src/components/pages/OffCanvasNew";

const Vulnerabilities = () => {
  return (
    <>
      <div className="d-flex justify-content-end gap-2 mb-4 me-0">
        <OffCanvasForm
          component={
            <VulnerabilityForm
              formService="cyberrisk_vuln_scan_import"
              objectId={-1}
              offCanvas
            />
          }
          title="Import Scan"
        />
        <OffCanvasForm
          component={
            <VulnerabilityForm
              formService="cyberrisk_cve_browse"
              objectId={-1}
              offCanvas
            />
          }
          title="Browse CVE"
        />
      </div>

      <ReportRuntime report="CR_RPT_VULNERABILITIES" />
    </>
  );
};

export default Vulnerabilities;
