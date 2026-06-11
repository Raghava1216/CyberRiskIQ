import { Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faEye, faUpload } from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useTranslation } from 'react-i18next';

export interface DashCard {
  id?: number | string;
  title: string;
  count?: number | string;
  icon: IconProp;
  api?: string;
  report?: string;
  createAccess?: boolean;
  viewAccess?: boolean;
  upload?: boolean;
}

export type DashCardAction = 'create' | 'view' | 'upload';

interface DashboardCardsProps {
  cardDataArray: DashCard[];
  onAction?: (action: DashCardAction, card: DashCard) => void;
}

const DashboardCards = ({ cardDataArray, onAction }: DashboardCardsProps) => {
  const { t } = useTranslation('common');

  return (
    <Row className="p-2 pb-0 m-0">
      {cardDataArray
        .filter((card) => card.createAccess || card.viewAccess || card.upload)
        .map((card, index) => {
          const actions = [card.createAccess, card.viewAccess, card.upload].filter(Boolean);
          const justifyClass =
            actions.length === 1 ? 'justify-content-center' : 'justify-content-between';

          return (
            <Col key={card.id ?? index} className="d-flex p-0 mx-1 text-white">
              <Card
                className="reportChart-cards d-flex flex-column w-100 m-0 p-0 px-0"
                style={{
                  background: '#293042',
                  borderRadius: '2px',
                  minHeight: '120px',
                  display: 'flex',
                  flexGrow: 1,
                }}
              >
                <Card.Body className="d-flex flex-column justify-content-between border">
                  <Row className="mt-1 d-flex justify-content-between">
                    <Col xs={9} className="p-0 m-0">
                      <div className="ps-1">
                        <h4 style={{ color: '#dddfe2' }} className="p-0 m-0">
                          {card.title}
                        </h4>
                        <h5 style={{ color: '#dddfe2' }} className="p-0 mt-1">
                          {card.count}
                        </h5>
                      </div>
                    </Col>
                    <Col xs={3} className="d-flex align-items-center justify-content-end">
                      <FontAwesomeIcon
                        icon={card.icon}
                        size="2x"
                        style={{ color: '#dddfe2', marginLeft: '0.5rem' }}
                      />
                    </Col>
                  </Row>
                </Card.Body>

                <Card.Footer
                  className="text-white border px-1 py-1 m-0"
                  style={{ background: '#293042', minHeight: '30px' }}
                >
                  <div className={`d-flex ${justifyClass} align-items-center w-100`}>
                    {card.createAccess && (
                      <div
                        className="d-flex align-items-center"
                        style={{ cursor: 'pointer' }}
                        title="Create"
                        role="button"
                        onClick={() => onAction?.('create', card)}
                      >
                        <FontAwesomeIcon icon={faPlusCircle} size="sm" style={{ color: '#dddfe2' }} />
                        <span className="ms-1" style={{ color: '#dddfe2', fontSize: '10px' }}>
                          {t('Create')}
                        </span>
                      </div>
                    )}

                    {card.createAccess && (card.viewAccess || card.upload) && (
                      <div className="border-start" style={{ height: '20px' }} />
                    )}

                    {card.viewAccess && (
                      <div
                        className="d-flex align-items-center"
                        style={{ cursor: 'pointer' }}
                        title="View"
                        role="button"
                        onClick={() => onAction?.('view', card)}
                      >
                        <FontAwesomeIcon icon={faEye} size="sm" style={{ color: '#dddfe2' }} />
                        <span className="ms-1" style={{ color: '#dddfe2', fontSize: '10px' }}>
                          {t('View')}
                        </span>
                      </div>
                    )}

                    {card.viewAccess && card.upload && (
                      <div className="border-start" style={{ height: '20px' }} />
                    )}

                    {card.upload && (
                      <div
                        className="d-flex align-items-center"
                        style={{ cursor: 'pointer' }}
                        title="Upload"
                        role="button"
                        onClick={() => onAction?.('upload', card)}
                      >
                        <FontAwesomeIcon icon={faUpload} size="sm" style={{ color: '#dddfe2' }} />
                        <span className="ms-1" style={{ color: '#dddfe2', fontSize: '10px' }}>
                          {t('Upload')}
                        </span>
                      </div>
                    )}
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
    </Row>
  );
};

export default DashboardCards;
