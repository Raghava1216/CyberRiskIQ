import React from "react";
import { Button } from "react-bootstrap";

// Temporary mock replacement for the <FormReportChartLink/> action/link bar.
// Renders inert buttons so the page layout matches the final design without
// opening metadata-driven forms (which need backend form metadata). Swap back to
// <FormReportChartLink combinedItems={...} /> once form/report metadata exists.
const MockActionBar = ({ actions = [] }) => {
  if (!actions.length) return null;
  return (
    <div className="d-flex flex-wrap gap-2 p-2">
      {actions.map((action, i) => (
        <Button
          key={i}
          size="sm"
          variant={action.variant || "outline-primary"}
          disabled
          title="Mock action — wire to the real form/report when metadata exists"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default MockActionBar;
