// Form-side JS hook for the Risk Scenario form (mirrors PA_GL_CONTROL_JS).
// The computed ALE fields are read-only — they are populated by ALE_CALCULATION.
const CR_RISK_SCENARIO_JS = (form, formMetaData, formMethods, formValues) => {
  const computedFields = [
    "lossEventFrequency",
    "aleP10",
    "aleP50",
    "aleP90",
  ];

  computedFields.forEach((name) => {
    if (formMetaData.fields && formMetaData.fields[name]) {
      formMetaData.fields[name].readOnly = true;
    }
  });

  return form;
};

export default CR_RISK_SCENARIO_JS;
