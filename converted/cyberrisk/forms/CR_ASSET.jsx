import { Container, Row, Col } from "react-bootstrap";
import FormControl from "src/components/forms/reactformutils/FormControl";
import Section from "src/components/forms/reactformutils/fields/Section";
import AuditTrail from "../../../components/forms/reactformutils/elements/AuditTrail";
import JSHook from "./CR_ASSET_JS";

// Asset form layout. Field names mirror the assets table in the CyberRisk IQ
// architecture (hostname, ipAddress, assetType, businessValue, dataClass,
// isInternetFacing, isSegmented, regulatoryScope, sector). Confirm each name
// against the backend form metadata for this formService (cyberrisk_asset).
const FormLayout = (props) => {
  const { formMethods, formMetaData, form, formValues } = props;
  const { control } = formMethods;

  formMetaData.form = JSHook(form, formMetaData, formMethods, formValues);

  return (
    <>
      <Container className="justify-content-center">
        <Section title="General">
          <Row>
            <div className="col-md-6">
              <FormControl
                control={control}
                name="hostname"
                formMetaData={formMetaData}
                formMethods={formMethods}
                others
              />
            </div>
            <div className="col-md-3">
              <FormControl
                control={control}
                name="ipAddress"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </div>
            <div className="col-md-3">
              <FormControl
                control={control}
                name="assetType"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </div>
          </Row>
          <Row>
            <Col md={3}>
              <FormControl
                control={control}
                name="businessValue"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
            <Col md={3}>
              <FormControl
                control={control}
                name="dataClass"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
            <Col md={3}>
              <FormControl
                control={control}
                name="sector"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
          </Row>
        </Section>

        <Section title="Exposure">
          <Row>
            <Col md={3}>
              <FormControl
                control={control}
                name="isInternetFacing"
                formMetaData={formMetaData}
                formMethods={formMethods}
                hideTitle
              />
            </Col>
            <Col md={3}>
              <FormControl
                control={control}
                name="isSegmented"
                formMetaData={formMetaData}
                formMethods={formMethods}
                hideTitle
              />
            </Col>
            <Col md={6}>
              <FormControl
                control={control}
                name="regulatoryScope"
                isMulti={true}
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
          </Row>
        </Section>

        <Section title="Ownership">
          <Row>
            <div className="col-md-6">
              <FormControl
                control={control}
                name="businessUnits"
                isMulti={true}
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </div>
            <div className="col-md-6">
              <FormControl
                control={control}
                name="owners"
                isMulti={true}
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </div>
          </Row>
        </Section>

        <Section title="Additional Details">
          <Row>
            <div>
              <FormControl
                control={control}
                name="attachFiles"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </div>
          </Row>
        </Section>
      </Container>

      {formValues.objectId != null && (
        <Container className="justify-content-center">
          <AuditTrail
            formMetaData={formMetaData}
            formMethods={formMethods}
            formId={formMetaData.formmeta.form_id}
            objectId={formValues.objectId}
            enableAddComment={formValues.status !== "Closed"}
          />
        </Container>
      )}
    </>
  );
};

export default FormLayout;
