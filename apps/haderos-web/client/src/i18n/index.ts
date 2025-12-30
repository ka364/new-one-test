/**
 * Internationalization (i18n) Configuration
 * Supports: Arabic, English, Chinese, Indonesian, Malay
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';
import idTranslations from './locales/id.json';
import msTranslations from './locales/ms.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: arTranslations },
      en: { translation: enTranslations },
      zh: { translation: zhTranslations },
      id: { translation: idTranslations },
      ms: { translation: msTranslations },
    },
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en', 'zh', 'id', 'ms'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
