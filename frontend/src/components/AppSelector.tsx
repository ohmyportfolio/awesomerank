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
            id: 'country-compare',
            title: t('True Size Atlas'),
            description: t('Compare country sizes at real scale'),
            icon: '🗺️',
            available: true,
        },
        {
            id: 'global-stats',
            title: t('Global Profile'),
            description: t('Your height, age, and birthday vs. the world'),
            icon: '📊',
            available: true,
        },
        {
            id: 'world-rank',
            title: t('Awesome Rank'),
            description: t('Where do you rank among 8 billion people?'),
            icon: '🌍',
            available: true,
        },
        {
            id: 'income-rank',
            title: t('What percent of the world is your living standard?'),
            description: t('See your global living-standard position'),
            icon: '💰',
            available: true,
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
                <h1 className="app-selector-title">{t('Awesome Rank')}</h1>
                <p className="app-selector-subtitle">{t('Explore the world through data')}</p>
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
                        whileHover={app.available ? { scale: 1.02, x: 4 } : {}}
                        whileTap={app.available ? { scale: 0.98 } : {}}
                        disabled={!app.available}
                    >
                        <span className="app-card-icon">{app.icon}</span>
                        <span className="app-card-content">
                            <span className="app-card-title">{app.title}</span>
                            <span className="app-card-description">{app.description}</span>
                        </span>
                        {!app.available && (
                            <span className="app-card-badge">{t('Coming Soon')}</span>
                        )}
                    </motion.button>
                ))}
            </motion.div>

            <motion.a
                href="https://www.producthunt.com/products/awesome-rank?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-awesome-rank"
                target="_blank"
                rel="noopener noreferrer"
                className="product-hunt-badge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
            >
                <img
                    src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1058946&theme=dark&t=1767938588539"
                    alt="Awesome Rank - Discover where you stand among 8 billion people | Product Hunt"
                    width="250"
                    height="54"
                />
            </motion.a>
        </motion.div>
    );
};
