// CRQ engine — Annualised Loss Expectancy (ALE) using the FAIR model.
// Mirrors the RA_CALCULATION form-calc pattern: a pure function that reads line
// items + FAIR inputs from the form and writes the computed loss-expectancy
// fields back via formMethods.setValue.
//
// FAIR relationships:
//   LEF (Loss Event Frequency) = TEF (Threat Event Frequency) x Vulnerability
//   SLE (Single Loss Expectancy) = primary loss + sum(secondary loss line items)
//   ALE = LEF x SLE
// The P10/P50/P90 spread approximates a Monte Carlo distribution; the backend
// crq-engine-service produces the authoritative percentiles.
const ALE_CALCULATION = (form, formMethods, arrayData) => {
  const resetFields = [
    "lossEventFrequency",
    "sleEur",
    "aleP10",
    "aleP50",
    "aleP90",
  ];
  resetFields.forEach((field) => formMethods.setValue(field, null));

  const tef = Number(formMethods.getValues("threatEventFrequency") || 0);
  const vuln = Number(formMethods.getValues("vulnerability") || 0);
  const primaryLoss = Number(formMethods.getValues("lossMagnitudePrimary") || 0);

  const lossEventFrequency = tef * vuln;
  formMethods.setValue(
    "lossEventFrequency",
    lossEventFrequency === 0 ? null : lossEventFrequency,
  );

  const secondaryLoss =
    Array.isArray(arrayData) && arrayData.length > 0
      ? arrayData
          .map((a) => Number(a.lossAmount || 0))
          .reduce((acc, val) => acc + val, 0)
      : 0;

  const sle = primaryLoss + secondaryLoss;
  formMethods.setValue("sleEur", sle === 0 ? null : sle);

  const ale = lossEventFrequency * sle;
  if (ale === 0) {
    return form;
  }

  // Approximate distribution around the expected ALE (P50). Replace with the
  // crq-engine-service Monte Carlo percentiles when wired to the backend.
  const aleP50 = Math.round(ale);
  const aleP10 = Math.round(ale * 0.4);
  const aleP90 = Math.round(ale * 1.8);

  formMethods.setValue("aleP10", aleP10);
  formMethods.setValue("aleP50", aleP50);
  formMethods.setValue("aleP90", aleP90);

  return form;
};

export default ALE_CALCULATION;
