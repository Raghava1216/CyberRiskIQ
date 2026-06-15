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
