import React from "react";
import { Row, Col, Card } from "react-bootstrap";

// Temporary mock replacement for <DashboardCards/>. Renders KPI cards from static
// sample data. No network calls. Swap back to <DashboardCards .../> wired to a real
// counts endpoint once it exists.
const MockCards = ({ cards = [] }) => {
  return (
    <Row className="p-2 m-0 g-2">
      {cards.map((card, i) => (
        <Col key={i} md={3} sm={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small text-uppercase">{card.title}</div>
              <div className="fs-4 fw-bold">{card.value}</div>
              {card.sub && <div className="text-muted small">{card.sub}</div>}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default MockCards;
