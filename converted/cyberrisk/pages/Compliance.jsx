import ReportRuntime from "src/components/reports/Report";
import AssessmentForm from "src/components/forms/reactformutils/FormRuntimeEngine";
import OffCanvasForm from "src/components/pages/OffCanvasNew";

const Compliance = () => {
  return (
    <>
      <div className="ms-auto text-end mb-4 me-0">
        <OffCanvasForm
          component={
            <AssessmentForm
              formService="cyberrisk_assessment"
              objectId={-1}
              offCanvas
            />
          }
          title="Run Assessment"
        />
      </div>

      <ReportRuntime report="CR_RPT_COMPLIANCE" />
    </>
  );
};

export default Compliance;
