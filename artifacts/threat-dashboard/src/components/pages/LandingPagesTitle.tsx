import { Nav, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { hasPrivilege } from '../../platform/currentUser';

export interface LandingTab {
  title: string;
  key: string;
  privilege?: string;
}

interface Props {
  title: string;
  tabs: LandingTab[];
  showYearFilter?: boolean;
  onYearChange?: (year: number) => void;
}

// Local equivalent of the enterprise LandingPagesTitle: the module title, an
// optional year filter, and a privilege-filtered tab strip. Rendered inside a
// <Tab.Container> so each Nav.Link drives the active pane.
export default function LandingPagesTitle({ title, tabs, showYearFilter, onYearChange }: Props) {
  const { t } = useTranslation('common');
  const visibleTabs = tabs.filter((tab) => hasPrivilege(tab.privilege));
  const thisYear = new Date().getFullYear();
  const years = [thisYear, thisYear - 1, thisYear - 2, thisYear - 3];

  return (
    <div className="cr-landing-title">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 pt-3">
        <h5 className="cr-landing-heading mb-0">{title}</h5>
        {showYearFilter && (
          <Form.Select
            size="sm"
            style={{ width: 120 }}
            defaultValue={thisYear}
            onChange={(e) => onYearChange?.(Number(e.target.value))}
            aria-label={t('Year')}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Form.Select>
        )}
      </div>
      <Nav variant="tabs" className="cr-landing-tabs px-2 mt-2 flex-nowrap">
        {visibleTabs.map((tab) => (
          <Nav.Item key={tab.key}>
            <Nav.Link eventKey={tab.key}>{tab.title}</Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
    </div>
  );
}
