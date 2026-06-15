import ReportRuntime from "src/components/reports/Report";
import AssetForm from "src/components/forms/reactformutils/FormRuntimeEngine";
import OffCanvasForm from "src/components/pages/OffCanvasNew";

const Assets = () => {
  return (
    <>
      <div className="d-flex justify-content-end gap-2 mb-4 me-0">
        <OffCanvasForm
          component={
            <AssetForm formService="cyberrisk_asset" objectId={-1} offCanvas />
          }
          title="Add Asset"
        />
        <OffCanvasForm
          component={
            <AssetForm
              formService="cyberrisk_asset_import"
              objectId={-1}
              offCanvas
            />
          }
          title="Import Assets"
        />
      </div>

      <ReportRuntime report="CR_RPT_ASSETS" />
    </>
  );
};

export default Assets;
