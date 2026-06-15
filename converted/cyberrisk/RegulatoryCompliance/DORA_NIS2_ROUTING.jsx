// Regulatory routing hook (mirrors the CheckConfigaration pattern). Given the
// form's regulatory scope and incident attributes, it filters the available
// workflow actions and toggles obligation-specific fields so that DORA / NIS2 /
// EU AI Act requirements are enforced at the right stage.
//
// The hook is idempotent and fully reversible: it computes every requirement and
// the action list from an immutable baseline on each run, so removing a scope
// (e.g. un-selecting NIS2) restores the prior state instead of leaving sticky flags.
const DORA_NIS2_ROUTING = (formMethods, formMetaData) => {
  if (formMetaData.configurationFormMetaData == null) {
    return;
  }

  // Capture the original action list once so filtering stays reversible.
  if (formMetaData._baseActions == null && formMetaData.actions != null) {
    formMetaData._baseActions = [...formMetaData.actions];
  }

  const scope = formMethods.getValues("regulatoryScope") || [];
  const inScope = (name) =>
    Array.isArray(scope) ? scope.includes(name) : scope === name;

  const nis2 = inScope("NIS2");
  const dora = inScope("DORA");

  const setRequired = (name, required) => {
    if (formMetaData.fields && formMetaData.fields[name]) {
      formMetaData.fields[name].required = required;
    }
  };

  // NIS2: significant incidents must be reportable within 24 hours — these are
  // required when NIS2 is in scope, and explicitly cleared when it is not.
  setRequired("earlyWarningAt", nis2);
  setRequired("crossBorderImpact", nis2);

  // DORA: ICT risk entries require a financial (ALE) value before approval.
  setRequired("aleP50", dora);

  // Rebuild the action list from the baseline each run; drop regulator-submission
  // actions only while nothing in scope is reportable.
  if (formMetaData._baseActions != null) {
    const reportable = nis2 || dora;
    formMetaData.actions = reportable
      ? [...formMetaData._baseActions]
      : formMetaData._baseActions.filter(
          (item) => item.action !== "Submit Regulatory Report",
        );
  }
};

export default DORA_NIS2_ROUTING;
