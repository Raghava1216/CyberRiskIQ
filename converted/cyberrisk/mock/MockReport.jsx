import React from "react";
import { Card, Table, Badge } from "react-bootstrap";
import { eur, SEVERITY_COLORS } from "./mockData";

// Temporary mock replacement for <ReportRuntime/>. Renders a static, styled table
// from { columns, rows } sample data. No network calls. Swap back to the real
// metadata-driven <ReportRuntime report="..." /> once the report metadata exists.
const badgeVariant = (value) => {
  const v = String(value).toLowerCase();
  if (["critical", "overdue", "investigating"].includes(v)) return "danger";
  if (["high", "at risk", "yes"].includes(v)) return "warning";
  if (["medium", "contained", "flat"].includes(v)) return "secondary";
  if (["low", "on track", "resolved", "no", "down", "up", "active"].includes(v)) return "success";
  return "light";
};

const renderCell = (col, row) => {
  const value = row[col.key];
  if (col.money) return eur(value);
  if (col.badge) {
    const color = SEVERITY_COLORS[value];
    return (
      <Badge
        bg={color ? undefined : badgeVariant(value)}
        style={color ? { backgroundColor: color } : undefined}
      >
        {value}
      </Badge>
    );
  }
  return value;
};

const MockReport = ({ title, columns = [], rows = [], dataCard }) => {
  return (
    <Card className="m-2 flex-fill shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span className="fw-semibold">{title}</span>
        <Badge bg="light" text="dark">
          mock
        </Badge>
      </Card.Header>
      <Card.Body className={dataCard ? "p-0" : "p-2"}>
        <Table responsive hover size="sm" className="mb-0 align-middle">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.align === "end" ? "text-end" : ""}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className={col.align === "end" ? "text-end" : ""}>
                    {renderCell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default MockReport;
