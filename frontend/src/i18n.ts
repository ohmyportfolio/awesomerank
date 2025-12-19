import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ko from './locales/ko.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import hi from './locales/hi.json';
import ar from './locales/ar.json';
import id from './locales/id.json';
import tr from './locales/tr.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ko: { translation: ko },
            es: { translation: es },
            pt: { translation: pt },
            zh: { translation: zh },
            ja: { translation: ja },
            fr: { translation: fr },
            de: { translation: de },
            it: { translation: it },
            ru: { translation: ru },
            hi: { translation: hi },
            ar: { translation: ar },
            id: { translation: id },
            tr: { translation: tr },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['navigator', 'htmlTag', 'path', 'subdomain'],
        },
    });

export default i18n;
