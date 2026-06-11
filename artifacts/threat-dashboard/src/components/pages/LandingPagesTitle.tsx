import { useEffect, useState } from 'react';
import { Button, Card, Row, Nav, Container, Col, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { getPrivileges } from '../../lib/platform/currentUser';

export interface LandingTab {
  title: string;
  key: string;
  privilege?: string;
}

interface LandingPagesTitleProps {
  title: string;
  tabs?: LandingTab[];
  updateValue?: (key: string) => void;
  onYearChange?: (year: string) => void;
  showYearFilter?: boolean;
  fontawsomeIcon?: IconProp;
  hideSticky?: boolean;
}

export const ScrollToTop = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!show) return null;
  return (
    <FontAwesomeIcon
      icon={faArrowUp}
      className="btn btn-danger z-3 top-btn-style"
      style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', cursor: 'pointer' }}
      onClick={scrollTop}
    />
  );
};

const YearFilter = ({ onYearChange }: { onYearChange?: (year: string) => void }) => {
  const generateStandardYears = () => {
    const year = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (year - i).toString());
  };

  const yearOptions = generateStandardYears();
  const [selectedYear, setSelectedYear] = useState(yearOptions[0]);

  useEffect(() => {
    onYearChange?.(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (year: string) => {
    setSelectedYear(year);
    onYearChange?.(year);
  };

  const currentIndex = yearOptions.indexOf(selectedYear);

  return (
    <div className="float-end d-inline-flex align-items-center mb-1">
      <Button
        onClick={() => currentIndex < yearOptions.length - 1 && select(yearOptions[currentIndex + 1])}
        disabled={currentIndex === yearOptions.length - 1}
        size="sm"
      >
        <FontAwesomeIcon icon={faAngleLeft} />
      </Button>
      <Dropdown className="ms-1 me-1">
        <Dropdown.Toggle className="bg-primary btn-sm">{selectedYear}</Dropdown.Toggle>
        <Dropdown.Menu>
          {yearOptions.map((year) => (
            <Dropdown.Item key={year} onClick={() => select(year)}>
              {year}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      <Button
        className="ms-0"
        onClick={() => currentIndex > 0 && select(yearOptions[currentIndex - 1])}
        disabled={currentIndex <= 0}
        size="sm"
      >
        <FontAwesomeIcon icon={faAngleRight} />
      </Button>
    </div>
  );
};

const PageNavigation = ({
  tabs,
  updateValue,
}: {
  tabs: LandingTab[];
  updateValue?: (key: string) => void;
}) => (
  <Nav
    variant="underline"
    className="justify-content-start mb-1"
    onSelect={(eventKey) => eventKey && updateValue?.(eventKey)}
  >
    {tabs.map((item) => (
      <Nav.Item key={item.key}>
        <Nav.Link eventKey={item.key} className="py-0">
          {item.title}
        </Nav.Link>
      </Nav.Item>
    ))}
  </Nav>
);

const LandingPagesTitle = ({
  title,
  tabs,
  updateValue,
  onYearChange,
  showYearFilter,
  fontawsomeIcon,
  hideSticky,
}: LandingPagesTitleProps) => {
  const privs = getPrivileges();
  const filteredTabs = tabs?.filter((item) =>
    item.privilege ? privs.includes(item.privilege) : true,
  );

  return (
    <>
      <div className={`z-3 ${hideSticky ? '' : 'sticky-top'}`} style={{ top: '62px' }}>
        <Row className="p-0 m-0">
          <Card className="reportChart-cards mb-2">
            <div className="d-flex justify-content-between align-items-center mt-1">
              <h4 className="mb-0">
                {fontawsomeIcon && <FontAwesomeIcon className="px-1" icon={fontawsomeIcon} />}
                {title}
              </h4>
              <div className="d-flex align-items-center ms-auto">
                {showYearFilter && <YearFilter onYearChange={onYearChange} />}
              </div>
            </div>

            {filteredTabs && filteredTabs.length > 0 && (
              <>
                <hr className="my-1 py-0" />
                <Container fluid>
                  <Row className="align-items-center">
                    <Col>
                      <PageNavigation tabs={filteredTabs} updateValue={updateValue} />
                    </Col>
                  </Row>
                </Container>
              </>
            )}
          </Card>
        </Row>
      </div>
      <ScrollToTop />
    </>
  );
};

export default LandingPagesTitle;
