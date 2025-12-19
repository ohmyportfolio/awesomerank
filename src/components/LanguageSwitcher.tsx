import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const languages = [
    { code: 'en', label: 'EN' },
    { code: 'ko', label: 'KO' },
    { code: 'es', label: 'ES' },
    { code: 'pt', label: 'PT' },
    { code: 'zh', label: 'ZH' },
    { code: 'ja', label: 'JA' },
    { code: 'fr', label: 'FR' },
    { code: 'de', label: 'DE' },
    { code: 'it', label: 'IT' },
];

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    return (
        <div className="language-switcher">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    className={`lang-btn ${i18n.language?.startsWith(lang.code) ? 'active' : ''}`}
                    onClick={() => i18n.changeLanguage(lang.code)}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
};
