// Matomo Analytics utility for SPA tracking

declare global {
  interface Window {
    _paq: unknown[][];
  }
}

// Track page view (call on every route change)
export function trackPageView(path?: string, title?: string) {
  if (typeof window === 'undefined' || !window._paq) return;

  window._paq.push(['setCustomUrl', path || window.location.pathname]);
  if (title) {
    window._paq.push(['setDocumentTitle', title]);
  }
  window._paq.push(['trackPageView']);
}

// Track custom event
export function trackEvent(category: string, action: string, name?: string, value?: number) {
  if (typeof window === 'undefined' || !window._paq) return;

  window._paq.push(['trackEvent', category, action, name, value]);
}

// Track app events
export const MatomoEvents = {
  // Quiz flow
  quizStarted: () => trackEvent('Quiz', 'Started'),
  quizCompleted: (score: number) => trackEvent('Quiz', 'Completed', 'Score', Math.round(score)),
  demographicsCompleted: () => trackEvent('Quiz', 'Demographics Completed'),

  // App selection
  appSelected: (appId: string) => trackEvent('Navigation', 'App Selected', appId),

  // Income calculator
  incomeCalculated: (basis: 'PPP' | 'MER') => trackEvent('Income', 'Calculated', basis),

  // Country compare
  countryCompared: (primary: string, secondary: string) =>
    trackEvent('CountryCompare', 'Compared', `${primary} vs ${secondary}`),
  countryCompareFullscreen: () => trackEvent('CountryCompare', 'Fullscreen Opened'),

  // Global stats
  globalStatsViewed: (section: string) => trackEvent('GlobalStats', 'Section Viewed', section),

  // Sharing
  resultShared: (method: string) => trackEvent('Share', 'Result Shared', method),

  // Language
  languageChanged: (lang: string) => trackEvent('Settings', 'Language Changed', lang),
};

// Page titles for tracking
export const PageTitles: Record<string, string> = {
  home: 'Home - Awesome Rank',
  landing: 'World Rank Quiz - Awesome Rank',
  demographics: 'Demographics - Awesome Rank',
  quiz: 'Quiz - Awesome Rank',
  result: 'Result - Awesome Rank',
  income: 'Income Rank - Awesome Rank',
  'country-compare': 'Country Compare - Awesome Rank',
  'global-stats': 'Global Stats - Awesome Rank',
  privacy: 'Privacy Policy - Awesome Rank',
};
