import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './AppSelector.css';

interface AppInfo {
    id: string;
    title: string;
    description: string;
    icon: string;
    available: boolean;
}

interface AppSelectorProps {
    onSelectApp: (appId: string) => void;
}

export const AppSelector = ({ onSelectApp }: AppSelectorProps) => {
    const { t } = useTranslation();

    const apps: AppInfo[] = [
        {
            id: 'world-rank',
            title: t('World Rank'),
            description: t('app_world_rank_desc'),
            icon: '🌍',
            available: true,
        },
        {
            id: 'income-rank',
            title: t('Income Rank'),
            description: t('See your income rank worldwide'),
            icon: '🧾',
            available: true,
        },
        {
            id: 'coming-soon-1',
            title: t('Coming Soon'),
            description: t('app_coming_soon_desc'),
            icon: '🔮',
            available: false,
        },
        {
            id: 'coming-soon-2',
            title: t('Coming Soon'),
            description: t('app_coming_soon_desc'),
            icon: '✨',
            available: false,
        },
        {
            id: 'coming-soon-3',
            title: t('Coming Soon'),
            description: t('app_coming_soon_desc'),
            icon: '🎯',
            available: false,
        },
    ];

    const handleAppClick = (app: AppInfo) => {
        if (app.available) {
            onSelectApp(app.id);
        }
    };

    return (
        <motion.div
            className="app-selector-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="app-selector-header"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                <h1 className="app-selector-title">Awesome Rank</h1>
                <p className="app-selector-subtitle">{t('app_selector_subtitle')}</p>
            </motion.div>

            <motion.div
                className="app-grid"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
            >
                {apps.map((app, index) => (
                    <motion.button
                        key={app.id}
                        className={`app-card ${!app.available ? 'app-card-disabled' : ''}`}
                        onClick={() => handleAppClick(app)}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                        whileHover={app.available ? { scale: 1.03, y: -4 } : {}}
                        whileTap={app.available ? { scale: 0.97 } : {}}
                        disabled={!app.available}
                    >
                        <span className="app-card-icon">{app.icon}</span>
                        <span className="app-card-title">{app.title}</span>
                        <span className="app-card-description">{app.description}</span>
                        {!app.available && (
                            <span className="app-card-badge">{t('Coming Soon')}</span>
                        )}
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    );
};
