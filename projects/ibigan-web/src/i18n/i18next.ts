import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enLocale from '@/i18n/locales/en.json';
import ptLocale from '@/i18n/locales/pt.json';

void i18n.use(initReactI18next).init({
  lng: 'pt',
  fallbackLng: 'pt',
  supportedLngs: ['pt', 'en'],
  defaultNS: 'translation',
  ns: ['translation'],
  resources: {
    pt: { translation: ptLocale },
    en: { translation: enLocale },
  },
  interpolation: {
    escapeValue: false,
  },
  keySeparator: '.',
});

export default i18n;
