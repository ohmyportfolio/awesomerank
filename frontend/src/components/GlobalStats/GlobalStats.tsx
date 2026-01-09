import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalStatsInput, type GlobalStatsInputData } from './GlobalStatsInput';
import { GlobalStatsResult, type GlobalStatsResults } from './GlobalStatsResult';
import { calculateHeightPercentile, type Gender } from '../../data/heightDistribution';
import { calculateAgePercentile, calculateAge, WORLD_POPULATION } from '../../data/ageDistribution';
import { calculateBirthdayPercentile } from '../../data/birthDateStats';
import { MatomoEvents } from '../../utils/matomo';
import './GlobalStats.css';

export const GlobalStats = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'input' | 'result'>('input');
  const [results, setResults] = useState<GlobalStatsResults | null>(null);
  const [inputData, setInputData] = useState<GlobalStatsInputData | null>(null);

  const handleSubmit = (data: GlobalStatsInputData) => {
    setInputData(data);
    MatomoEvents.globalStatsViewed('calculated');

    // Calculate height percentile
    const heightResult = calculateHeightPercentile(
      data.height,
      data.gender as Gender,
      data.country
    );

    // Calculate age percentile
    const age = calculateAge(data.birthDate);
    const ageResult = calculateAgePercentile(age);

    // Calculate birthday percentile
    const month = data.birthDate.getMonth() + 1;
    const day = data.birthDate.getDate();
    const birthdayResult = calculateBirthdayPercentile(month, day);

    setResults({
      height: {
        value: data.height,
        globalPercentile: heightResult.globalPercentile,
        countryPercentile: heightResult.countryPercentile,
        countryName: heightResult.countryName,
      },
      age: {
        value: Math.floor(age),
        percentile: ageResult.percentile,
        youngerThan: ageResult.youngerThan,
        olderThan: ageResult.olderThan,
        totalPopulation: WORLD_POPULATION,
      },
      birthday: {
        month,
        day,
        rank: birthdayResult.rank,
        percentile: birthdayResult.percentile,
        isRare: birthdayResult.isRare,
        isCommon: birthdayResult.isCommon,
      },
      gender: data.gender,
      country: data.country,
    });

    setView('result');
  };

  const handleReset = () => {
    setView('input');
    setResults(null);
    setInputData(null);
  };

  return (
    <>
      <Helmet>
        <title>{t('Global Profile - Height, Age & Birthday Stats')} | Awesome Rank</title>
        <meta name="description" content={t('Discover where you stand among 8 billion people. Compare your height, age, and birthday with global statistics.')} />
        <meta property="og:title" content={`${t('Global Profile')} | Awesome Rank`} />
        <meta property="og:description" content={t('Compare your height, age, and birthday with global statistics.')} />
      </Helmet>
      <motion.section
        className="global-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
      <div className="global-stats-container">
        <AnimatePresence mode="wait">
          {view === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="global-stats-header">
                <h1 className="global-stats-title">{t('Global Profile')}</h1>
                <p className="global-stats-subtitle">
                  {t('Discover where you stand among 8 billion people')}
                </p>
              </div>
              <GlobalStatsInput onSubmit={handleSubmit} initialData={inputData} />
            </motion.div>
          )}
          {view === 'result' && results && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlobalStatsResult results={results} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
    </>
  );
};
