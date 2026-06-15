import ReportRuntime from "src/components/reports/Report";
import ThreatForm from "src/components/forms/reactformutils/FormRuntimeEngine";
import OffCanvasForm from "src/components/pages/OffCanvasNew";

const Threats = () => {
  return (
    <>
      <div className="ms-auto text-end mb-4 me-0">
        <OffCanvasForm
          component={
            <ThreatForm formService="cyberrisk_threat" objectId={-1} offCanvas />
          }
          title="Add Threat"
        />
      </div>

      <ReportRuntime report="CR_RPT_THREATS" />
    </>
  );
};

export default Threats;
