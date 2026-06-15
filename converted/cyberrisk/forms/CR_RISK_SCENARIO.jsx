import { Container, Row, Col } from "react-bootstrap";
import FormControl from "src/components/forms/reactformutils/FormControl";
import Section from "src/components/forms/reactformutils/fields/Section";
import AuditTrail from "../../../components/forms/reactformutils/elements/AuditTrail";
import JSHook from "./CR_RISK_SCENARIO_JS";
import ALE_CALCULATION from "../Crq/ALE_CALCULATION";

// Risk scenario form. FAIR inputs (threatEventFrequency, vulnerability,
// lossMagnitude*) drive the ALE_CALCULATION engine which fills the computed
// loss-expectancy fields (lossEventFrequency, sleEur, aleP10/P50/P90).
const FormLayout = (props) => {
  const { formMethods, formMetaData, form, formValues } = props;
  const { control } = formMethods;

  formMetaData.form = JSHook(form, formMetaData, formMethods, formValues);

  // Recompute ALE whenever the loss-equivalent line items change.
  const lossLines = formMethods.getValues("lossLines") || [];
  ALE_CALCULATION(form, formMethods, lossLines);

  return (
    <>
      <Container className="justify-content-center">
        <Section title="General">
          <Row>
            <div className="col-md-8">
              <FormControl
                control={control}
                name="name"
                formMetaData={formMetaData}
                formMethods={formMethods}
                others
              />
            </div>
            <div className="col-md-2">
              <FormControl
                control={control}
                name="status"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </div>
            <div className="col-md-2">
              <FormControl
                control={control}
                name="active"
                formMetaData={formMetaData}
                formMethods={formMethods}
                hideTitle
              />
            </div>
          </Row>
          <Row>
            <Col md={8}>
              <FormControl
                control={control}
                name="description"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
            <Col md={4}>
              <FormControl
                control={control}
                name="asset"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
          </Row>
        </Section>

        <Section title="FAIR Inputs">
          <Row>
            <Col md={4}>
              <FormControl
                control={control}
                name="threatEventFrequency"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
            <Col md={4}>
              <FormControl
                control={control}
                name="vulnerability"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
            <Col md={4}>
              <FormControl
                control={control}
                name="lossMagnitudePrimary"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
          </Row>
        </Section>

        <Section title="Annualised Loss Expectancy (computed)">
          <Row>
            <Col md={3}>
              <FormControl
                control={control}
                name="lossEventFrequency"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
            <Col md={3}>
              <FormControl
                control={control}
                name="aleP10"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
            <Col md={3}>
              <FormControl
                control={control}
                name="aleP50"
                formMetaData={formMetaData}
                formMethods={formMethods}
              />
            </Col>
            <Col md={3}>
              <FormControl
                control={control}
                name="aleP90"
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
