import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './Landing.css';

interface LandingProps {
    onStart: () => void;
}

export const Landing = ({ onStart }: LandingProps) => {
    const { t } = useTranslation();
    return (
        <>
            <Helmet>
                <title>{t('World Rank - Where Do You Stand?')} | Awesome Rank</title>
                <meta name="description" content={t('Take the quiz for a modeled estimate of your global ranking among 8 billion people.')} />
                <meta property="og:title" content={`${t('World Rank')} | Awesome Rank`} />
                <meta property="og:description" content={t('A modeled estimate of where you stand among 8 billion people.')} />
            </Helmet>
            <motion.div
            className="landing-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <motion.div
                className="title-wrapper"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
            >
                <h1 className="main-title">{t('WORLD\nRANK')}</h1>
                <div className="year-badge">2025</div>
            </motion.div>

            <motion.p
                className="subtitle"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
            >
                {t('Where do you stand among\n8 billion people?')}
            </motion.p>

            <motion.button
                className="btn-primary"
                onClick={onStart}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px var(--primary-glow-strong)" }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
            >
                {t('Begin Analysis')}
            </motion.button>

            <div className="decor-circle"></div>
        </motion.div>
        </>
    );
};
