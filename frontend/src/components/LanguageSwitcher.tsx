import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import './LanguageSwitcher.css';

const languages = [
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'ru', label: 'Русский' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ar', label: 'العربية' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'tr', label: 'Türkçe' },
];

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentLang = languages.find(l => i18n.language?.startsWith(l.code)) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLanguageChange = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="language-switcher" ref={containerRef}>
            <button
                className={`current-lang-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="lang-text">{currentLang.label}</span>
                <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="lang-dropdown"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                className={`dropdown-item ${i18n.language?.startsWith(lang.code) ? 'active' : ''}`}
                                onClick={() => handleLanguageChange(lang.code)}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
