import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './Demographics.css';

export interface DemographicsData {
    ageGroup: string;
    gender: string;
}

interface DemographicsProps {
    onComplete: (data: DemographicsData) => void;
}

export const Demographics = ({ onComplete }: DemographicsProps) => {
    const { t } = useTranslation();
    const [ageGroup, setAgeGroup] = useState<string>('');
    const [gender, setGender] = useState<string>('');

    const ageGroups = [
        { value: '10s', label: t('10s') },
        { value: '20s', label: t('20s') },
        { value: '30s', label: t('30s') },
        { value: '40s', label: t('40s') },
        { value: '50s+', label: t('50s+') },
    ];

    const genders = [
        { value: 'male', label: t('Male') },
        { value: 'female', label: t('Female') },
        { value: 'other', label: t('Other') },
        { value: 'prefer_not_to_say', label: t('Prefer not to say') },
    ];

    const canProceed = ageGroup && gender;

    const handleSubmit = () => {
        if (canProceed) {
            onComplete({ ageGroup, gender });
        }
    };

    return (
        <motion.div
            className="demographics-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
        >
            <motion.h2
                className="demographics-title"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {t('Tell us about yourself')}
            </motion.h2>

            <motion.p
                className="demographics-subtitle"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {t('For more accurate comparison')}
            </motion.p>

            <motion.div
                className="demographics-section"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <h3 className="section-label">{t('Age Group')}</h3>
                <div className="options-row">
                    {ageGroups.map((option) => (
                        <motion.button
                            key={option.value}
                            className={`option-btn ${ageGroup === option.value ? 'selected' : ''}`}
                            onClick={() => setAgeGroup(option.value)}
                            whileTap={{ scale: 0.95 }}
                        >
                            {option.label}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            <motion.div
                className="demographics-section"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <h3 className="section-label">{t('Gender')}</h3>
                <div className="options-row">
                    {genders.map((option) => (
                        <motion.button
                            key={option.value}
                            className={`option-btn ${gender === option.value ? 'selected' : ''}`}
                            onClick={() => setGender(option.value)}
                            whileTap={{ scale: 0.95 }}
                        >
                            {option.label}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            <motion.button
                className={`btn-continue ${canProceed ? '' : 'disabled'}`}
                onClick={handleSubmit}
                disabled={!canProceed}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={canProceed ? { scale: 1.05 } : {}}
                whileTap={canProceed ? { scale: 0.95 } : {}}
            >
                {t('Continue')}
            </motion.button>
        </motion.div>
    );
};
