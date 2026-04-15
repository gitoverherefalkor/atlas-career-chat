import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Custom detector: check if we're on a .nl domain → force Dutch
const domainDetector = {
  name: 'domainDetector',
  lookup(): string | undefined {
    const hostname = window.location.hostname;
    if (hostname.endsWith('.nl')) return 'nl';
    if (hostname.endsWith('.de')) return 'de'; // future-proofing
    return undefined;
  },
};

const languageDetector = new LanguageDetector();
languageDetector.addDetector(domainDetector);

i18n
  .use(HttpBackend)
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    // Dutch is disabled in the UI until all strings are translated.
    // Keeping only 'en' here forces any detected/stored 'nl' back to English.
    // To re-enable Dutch: add 'nl' here and flip `disabled: false` in LanguageSwitcher.
    supportedLngs: ['en'],
    ns: ['common', 'auth', 'landing', 'survey', 'chat', 'report', 'dashboard'],
    defaultNS: 'common',

    detection: {
      // Priority: .nl domain → localStorage → browser language
      order: ['domainDetector', 'localStorage', 'navigator'],
      lookupLocalStorage: 'atlas_language',
      caches: ['localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
