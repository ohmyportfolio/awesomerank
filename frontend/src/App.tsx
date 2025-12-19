import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from './components/Layout';
import { AppSelector } from './components/AppSelector';
import { Landing } from './components/Landing';
import { Demographics } from './components/Demographics';
import type { DemographicsData } from './components/Demographics';
import { Quiz } from './components/Quiz';
import { Result } from './components/Result';
import { AnimatePresence } from 'framer-motion';
import { calculateScore } from './utils/scoreCalculator';

// Collect client-side data
function getClientData() {
  return {
    // Browser info
    browserLanguage: navigator.language,
    languages: navigator.languages?.join(',') || navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Device info
    deviceType: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio,

    // Platform
    platform: navigator.platform,

    // Connection (if available)
    connectionType: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown',
  };
}

// Submit data to server
async function submitQuizData(data: Record<string, unknown>) {
  try {
    const apiUrl = import.meta.env.PROD ? '/api/submit' : 'http://localhost:3000/api/submit';
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to submit data:', error);
  }
}

function App() {
  const { i18n } = useTranslation();
  const [view, setView] = useState<'home' | 'landing' | 'demographics' | 'quiz' | 'result'>('home');
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [_questionTimes, setQuestionTimes] = useState<number[]>([]);

  // Track session start
  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const handleSelectApp = (appId: string) => {
    if (appId === 'world-rank') {
      setView('landing');
    }
  };

  const goHome = () => setView('home');
  const goBack = () => {
    if (view === 'landing') setView('home');
    else if (view === 'demographics') setView('landing');
    else if (view === 'quiz') setView('demographics');
    else if (view === 'result') setView('home');
  };

  const startQuiz = () => setView('demographics');

  const handleDemographics = (data: DemographicsData) => {
    setDemographics(data);
    setView('quiz');
  };

  const finishQuiz = (finalAnswers: boolean[], times: number[]) => {
    setAnswers(finalAnswers);
    setQuestionTimes(times);
    setView('result');

    // Calculate score
    const scoreResult = calculateScore(finalAnswers);

    // Submit all collected data
    const sessionDuration = Date.now() - startTime;
    submitQuizData({
      // Demographics
      ...demographics,

      // Quiz results
      answers: finalAnswers,
      questionTimes: times,
      totalQuizTime: times.reduce((a, b) => a + b, 0),

      // Score results
      score: scoreResult.score,
      tier: scoreResult.tier,
      yesCount: scoreResult.yesCount,

      // Session info
      sessionDuration,
      selectedLanguage: i18n.language,

      // Client data
      ...getClientData(),
    });
  };

  const restart = () => {
    setAnswers([]);
    setQuestionTimes([]);
    setDemographics(null);
    setStartTime(Date.now());
    setView('home');
  };

  const showBack = view !== 'home';
  const showHome = view !== 'home' && view !== 'landing';

  return (
    <Layout
      showBack={showBack}
      showHome={showHome}
      onBack={goBack}
      onHome={goHome}
    >
      <AnimatePresence mode="wait">
        {view === 'home' && <AppSelector onSelectApp={handleSelectApp} key="home" />}
        {view === 'landing' && <Landing onStart={startQuiz} key="landing" />}
        {view === 'demographics' && <Demographics onComplete={handleDemographics} key="demographics" />}
        {view === 'quiz' && <Quiz onFinish={finishQuiz} key="quiz" />}
        {view === 'result' && <Result answers={answers} onRestart={restart} key="result" />}
      </AnimatePresence>
    </Layout>
  );
}

export default App;
