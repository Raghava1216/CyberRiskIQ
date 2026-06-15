// Form-side JS hook for the Asset form (mirrors the PA_GL_CONTROL_JS pattern).
// Toggles field requirements / metadata based on configuration and current
// values, then returns the (possibly mutated) form object.
const CR_ASSET_JS = (form, formMetaData, formMethods, formValues) => {
  const config = formMetaData.configurationFormMetaData || {};

  // Internet-facing assets must declare whether they are network-segmented.
  const internetFacing = formMethods.getValues("isInternetFacing");
  if (formMetaData.fields && formMetaData.fields.isSegmented) {
    formMetaData.fields.isSegmented.required = internetFacing === true;
  }

  // When regulatory tracking is enabled, regulatoryScope becomes mandatory.
  if (config.regulatory_scope_required === true && formMetaData.fields?.regulatoryScope) {
    formMetaData.fields.regulatoryScope.required = true;
  }

  return form;
};

export default CR_ASSET_JS;
