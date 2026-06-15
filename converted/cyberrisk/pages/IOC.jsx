import ReportRuntime from "src/components/reports/Report";
import IOCForm from "src/components/forms/reactformutils/FormRuntimeEngine";
import OffCanvasForm from "src/components/pages/OffCanvasNew";

const IOC = () => {
  return (
    <>
      <div className="d-flex justify-content-end gap-2 mb-4 me-0">
        <OffCanvasForm
          component={
            <IOCForm formService="cyberrisk_ioc" objectId={-1} offCanvas />
          }
          title="Add IOC"
        />
        <OffCanvasForm
          component={
            <IOCForm
              formService="cyberrisk_ioc_import"
              objectId={-1}
              offCanvas
            />
          }
          title="Import IOCs"
        />
      </div>

      <ReportRuntime report="CR_RPT_IOC" />
    </>
  );
};

export default IOC;
