import ReportRuntime from "src/components/reports/Report";
import IncidentForm from "src/components/forms/reactformutils/FormRuntimeEngine";
import OffCanvasForm from "src/components/pages/OffCanvasNew";

const Incidents = () => {
  return (
    <>
      <div className="ms-auto text-end mb-4 me-0">
        <OffCanvasForm
          component={
            <IncidentForm
              formService="cyberrisk_incident"
              objectId={-1}
              offCanvas
            />
          }
          title="Declare Incident"
        />
      </div>

      <ReportRuntime report="CR_RPT_INCIDENTS" />
    </>
  );
};

export default Incidents;
