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
import th from './locales/th.json';
import vi from './locales/vi.json';
import ms from './locales/ms.json';
import fil from './locales/fil.json';
import pl from './locales/pl.json';
import nl from './locales/nl.json';
import cs from './locales/cs.json';
import sk from './locales/sk.json';
import hu from './locales/hu.json';
import el from './locales/el.json';
import da from './locales/da.json';
import no from './locales/no.json';
import sv from './locales/sv.json';
import fi from './locales/fi.json';
import is from './locales/is.json';
import et from './locales/et.json';
import lv from './locales/lv.json';
import lt from './locales/lt.json';
import sl from './locales/sl.json';
import he from './locales/he.json';

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
            th: { translation: th },
            vi: { translation: vi },
            ms: { translation: ms },
            fil: { translation: fil },
            pl: { translation: pl },
            nl: { translation: nl },
            cs: { translation: cs },
            sk: { translation: sk },
            hu: { translation: hu },
            el: { translation: el },
            da: { translation: da },
            no: { translation: no },
            sv: { translation: sv },
            fi: { translation: fi },
            is: { translation: is },
            et: { translation: et },
            lv: { translation: lv },
            lt: { translation: lt },
            sl: { translation: sl },
            he: { translation: he },
        },
        fallbackLng: 'en',
        keySeparator: false,
        nsSeparator: false,
        returnEmptyString: false,
        returnNull: false,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['navigator', 'htmlTag', 'path', 'subdomain'],
        },
    });

export default i18n;
