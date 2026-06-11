import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// The user's components call useTranslation("common") and t("Some Label").
// Their backend supplies translations; here we run with empty resources so
// t(key) simply returns the key itself (identity translation). This keeps
// every `t(...)` call working without wiring a translation backend.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    resources: { en: { common: {} } },
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    parseMissingKeyHandler: (key) => key,
    react: { useSuspense: false },
  });
}

export default i18n;
