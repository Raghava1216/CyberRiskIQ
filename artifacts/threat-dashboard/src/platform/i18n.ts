import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Local equivalent of the enterprise i18next bootstrap. The app calls
// useTranslation("common") exactly as the in-house pages do; with empty
// resources i18next returns the key itself, so labels render as plain English
// while keeping the call-sites identical to the source application.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    resources: { en: { common: {} } },
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });
}

export default i18n;
