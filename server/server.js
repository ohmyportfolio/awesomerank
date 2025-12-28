import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend build)
const FRONTEND_DIST = join(__dirname, '..', 'frontend', 'dist');

// Redirect legacy query-based URLs to path-based routes
app.get('*', (req, res, next) => {
  const appParam = typeof req.query.app === 'string' ? req.query.app : null;
  const targetPath = appParam ? mapAppToPath(appParam) : null;
  if (!targetPath) return next();
  const currentPath = normalizePath(req.path.toLowerCase());
  if (currentPath === targetPath) return next();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'app') continue;
    if (typeof value === 'string') params.set(key, value);
  }
  const query = params.toString();
  const location = query ? `${targetPath}?${query}` : targetPath;
  res.redirect(301, location);
});

app.use(express.static(FRONTEND_DIST));

const SITE_URL = process.env.SITE_URL || 'https://awesomerank.com';
const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', ogLocale: 'en_US' },
  { code: 'ko', label: 'Korean', ogLocale: 'ko_KR' },
  { code: 'es', label: 'Spanish', ogLocale: 'es_ES' },
  { code: 'pt', label: 'Portuguese', ogLocale: 'pt_BR' },
];

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function mapAppToPath(appId) {
  if (appId === 'world-rank') return '/world-rank';
  if (appId === 'income-rank') return '/income-rank';
  if (appId === 'country-compare') return '/country-compare';
  if (appId === 'global-stats') return '/global-stats';
  return null;
}

const ROUTE_META = {
  '/': {
    title: 'Awesome Rank — Explore the world through data',
    description: 'Take the World Rank lifestyle quiz, calculate your global income percentile, and explore world statistics.',
    heading: 'Awesome Rank',
    subheading: 'Explore the world through data: lifestyle quiz, income ranking, and global statistics.',
    keywords: 'awesome rank, world rank, global ranking, lifestyle quiz, income ranking, income percentile, standard of living, world statistics, country size compare, global data',
    highlights: [
      'World Rank lifestyle quiz',
      'Living Standard income ranking (PPP and MER)',
      'Country Size Compare map',
      'Global Statistics profile',
    ],
    searchPhrases: [
      'global ranking quiz',
      'income percentile calculator',
      'standard of living comparison',
      'world statistics dashboard',
      'country size comparison map',
    ],
    schemaType: 'WebApplication',
  },
  '/world-rank': {
    title: 'World Rank — Global Lifestyle Quiz',
    description: 'Answer a short lifestyle quiz to see where you stand among 8 billion people worldwide.',
    heading: 'World Rank',
    subheading: 'A lifestyle quiz that estimates your global standing across everyday living standards.',
    keywords: 'world rank, lifestyle quiz, global ranking, living standards, world percentile, global lifestyle index',
    highlights: [
      '20+ lifestyle questions',
      'Instant global ranking estimate',
      'Private, on-device calculation',
    ],
    searchPhrases: [
      'world rank quiz',
      'global lifestyle ranking',
      'living standards questionnaire',
      'global percentile test',
    ],
    schemaType: 'WebApplication',
  },
  '/income-rank': {
    title: 'Living Standard Rank — Global Income Percentile',
    description: 'Calculate your global income percentile with PPP or market exchange rates.',
    heading: 'Living Standard Rank',
    subheading: 'Compare household income worldwide using PPP and market exchange rates.',
    keywords: 'income rank, income percentile, PPP calculator, MER calculator, global income comparison, salary percentile, living standard',
    highlights: [
      'Income percentile with PPP and MER',
      'Household size adjustments',
      'Global median and milestones',
    ],
    searchPhrases: [
      'income percentile calculator',
      'PPP income comparison',
      'global salary percentile',
      'standard of living income rank',
    ],
    schemaType: 'WebApplication',
  },
  '/country-compare': {
    title: 'Country Size Compare — True Size Atlas',
    description: 'Compare true country sizes with an interactive map and global rankings.',
    heading: 'Country Size Compare',
    subheading: 'See how countries stack up in real size with a true-size map.',
    keywords: 'country size compare, true size map, world map comparison, area comparison, country size ranking',
    highlights: [
      'True-size map view',
      'Country area rankings',
      'Side-by-side comparisons',
    ],
    searchPhrases: [
      'true size world map',
      'country area comparison',
      'map size distortion',
      'compare countries by size',
    ],
    schemaType: 'WebApplication',
  },
  '/global-stats': {
    title: 'Global Statistics — Your Global Profile',
    description: 'Explore global statistics and build a profile across income, education, and access.',
    heading: 'Global Statistics',
    subheading: 'Build a global profile across key indicators and world data.',
    keywords: 'global statistics, global profile, world data, demographics, global indicators, world comparison',
    highlights: [
      'Global profile summary',
      'Demographics and access indicators',
      'Shareable insights',
    ],
    searchPhrases: [
      'global statistics profile',
      'world data dashboard',
      'global demographics overview',
      'international comparisons',
    ],
    schemaType: 'WebApplication',
  },
  '/privacy': {
    title: 'Privacy Policy — Awesome Rank',
    description: 'Learn how Awesome Rank collects, uses, and protects your data.',
    heading: 'Privacy Policy',
    subheading: 'Our commitment to transparency, privacy, and data protection.',
    keywords: 'privacy policy, data protection, awesome rank, data usage, consent',
    highlights: [
      'What data is collected',
      'How data is used',
      'How to opt out',
    ],
    schemaType: 'WebPage',
  },
  '/admin': {
    title: 'Admin Dashboard — Awesome Rank',
    description: 'Internal dashboard for Awesome Rank.',
    heading: 'Admin Dashboard',
    subheading: 'Authorized access only.',
    keywords: 'admin dashboard, awesome rank, internal analytics',
    highlights: [
      'Restricted access',
      'Internal analytics',
      'Operational dashboard',
    ],
    schemaType: 'WebPage',
    robots: 'noindex, nofollow',
  },
};

const baseHtmlPath = join(FRONTEND_DIST, 'index.html');
const baseHtml = existsSync(baseHtmlPath) ? readFileSync(baseHtmlPath, 'utf-8') : null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replaceMetaName(html, name, content) {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+name="${name}"[^>]*>`, 'i');
  const replacement = `<meta name="${name}" content="${escaped}" />`;
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  return html.replace('</head>', `  ${replacement}\n  </head>`);
}

function replaceMetaProperty(html, property, content) {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+property="${property}"[^>]*>`, 'i');
  const replacement = `<meta property="${property}" content="${escaped}" />`;
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  return html.replace('</head>', `  ${replacement}\n  </head>`);
}

function replaceLinkCanonical(html, href) {
  const escaped = escapeHtml(href);
  const pattern = /<link\s+rel="canonical"[^>]*>/i;
  const replacement = `<link rel="canonical" href="${escaped}" />`;
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  return html.replace('</head>', `  ${replacement}\n  </head>`);
}

function replaceTitleTag(html, title) {
  const escaped = escapeHtml(title);
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${escaped}</title>`);
}

function resolveLanguage(req) {
  const langParam = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : null;
  const supportedCodes = new Set(SUPPORTED_LANGUAGES.map((lang) => lang.code));
  if (langParam && supportedCodes.has(langParam)) return langParam;
  const header = req.headers['accept-language'];
  if (typeof header === 'string') {
    const parts = header.split(',').map((part) => part.trim().split(';')[0]);
    for (const part of parts) {
      const primary = part.toLowerCase().split('-')[0];
      if (supportedCodes.has(primary)) return primary;
    }
  }
  return 'en';
}

function detectVolatileParams(req) {
  const volatileKeys = new Set([
    'score',
    'income',
    'householdIncome',
    'adults',
    'children',
    'country',
    'currency',
    'year',
    'basis',
  ]);
  return Object.keys(req.query || {}).some((key) => volatileKeys.has(key));
}

function resolveRoute(req) {
  const pathname = normalizePath(req.path.toLowerCase());
  if (ROUTE_META[pathname]) return pathname;
  const appParam = typeof req.query.app === 'string' ? req.query.app : null;
  if (appParam === 'income-rank') return '/income-rank';
  if (appParam === 'country-compare') return '/country-compare';
  if (appParam === 'global-stats') return '/global-stats';
  if (appParam === 'world-rank') return '/world-rank';
  return '/';
}

function buildHreflangLinks(pathname) {
  if (pathname === '/admin') return '';
  const basePath = pathname === '/' ? '' : pathname;
  const lines = SUPPORTED_LANGUAGES.map((lang) => {
    const href = `${SITE_URL}${basePath}?lang=${lang.code}`;
    return `    <link rel="alternate" hreflang="${lang.code}" href="${href}" />`;
  });
  lines.push(`    <link rel="alternate" hreflang="x-default" href="${SITE_URL}${basePath}" />`);
  return lines.join('\n');
}

function buildSeoContent(meta) {
  const items = Array.isArray(meta.highlights) && meta.highlights.length > 0
    ? meta.highlights
    : [
      'World Rank lifestyle quiz',
      'Living Standard income ranking (PPP and MER)',
      'Country Size Compare map',
      'Global Statistics profile',
    ];
  const phrases = Array.isArray(meta.searchPhrases) && meta.searchPhrases.length > 0
    ? meta.searchPhrases
    : [];
  return `
    <main class="seo-shell">
      <header class="seo-hero">
        <h1>${escapeHtml(meta.heading)}</h1>
        <p>${escapeHtml(meta.subheading)}</p>
      </header>
      <section class="seo-summary">
        <p>${escapeHtml(meta.description)}</p>
      </section>
      <section class="seo-features">
        <h2>Highlights</h2>
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </section>
      ${phrases.length > 0 ? `
      <section class="seo-related">
        <h2>Related searches</h2>
        <ul>
          ${phrases.map((phrase) => `<li>${escapeHtml(phrase)}</li>`).join('')}
        </ul>
      </section>` : ''}
      <noscript>JavaScript is required for the interactive experience. The overview above is available without scripts.</noscript>
    </main>
  `.trim();
}

function buildJsonLd(meta, canonicalUrl) {
  if (meta.schemaType === 'WebPage') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: meta.title,
      description: meta.description,
      url: canonicalUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Awesome Rank',
        url: SITE_URL,
      },
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: meta.title,
    description: meta.description,
    url: canonicalUrl,
    applicationCategory: ['LifestyleApplication', 'FinanceApplication'],
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Global lifestyle ranking quiz with 20+ questions',
      'Income percentile calculator (PPP and MER basis)',
      '4 language support',
      'On-device calculation for privacy',
      'Based on WID.world 2024 data',
    ],
    author: {
      '@type': 'Organization',
      name: 'Awesome Rank',
    },
  };
}

function renderSeoHtml(req) {
  if (!baseHtml) return null;
  const routeKey = resolveRoute(req);
  const meta = ROUTE_META[routeKey] || ROUTE_META['/'];
  const lang = resolveLanguage(req);
  const langMeta = SUPPORTED_LANGUAGES.find((item) => item.code === lang) || SUPPORTED_LANGUAGES[0];
  const pathForCanonical = routeKey === '/' ? '' : routeKey;
  const langParam = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : null;
  const canonicalBase = langParam && langParam === lang
    ? `${SITE_URL}${pathForCanonical}?lang=${lang}`
    : `${SITE_URL}${pathForCanonical}`;
  const canonicalUrl = canonicalBase;
  const ogLocale = langMeta.ogLocale;
  const robots = detectVolatileParams(req)
    ? 'noindex, follow'
    : (meta.robots || 'index, follow');
  const hreflangLinks = buildHreflangLinks(routeKey);
  let dynamicMeta = { ...meta };

  if (routeKey === '/world-rank' && typeof req.query.score === 'string') {
    const parsedScore = Number.parseFloat(req.query.score);
    if (Number.isFinite(parsedScore) && parsedScore > 0) {
      const formatted = new Intl.NumberFormat(lang, { maximumSignificantDigits: 4 }).format(parsedScore);
      dynamicMeta = {
        ...dynamicMeta,
        title: `Top ${formatted}% — World Rank Result`,
        description: `This World Rank result places you in the top ${formatted}% globally. Compare your lifestyle against the world.`,
      };
    }
  }

  if (routeKey === '/income-rank' && (typeof req.query.householdIncome === 'string' || typeof req.query.income === 'string')) {
    const incomeValue = typeof req.query.householdIncome === 'string' ? req.query.householdIncome : req.query.income;
    const parsedIncome = incomeValue ? Number.parseFloat(incomeValue) : null;
    if (Number.isFinite(parsedIncome) && parsedIncome > 0) {
      const formattedIncome = new Intl.NumberFormat(lang, { maximumSignificantDigits: 4 }).format(parsedIncome);
      const basis = typeof req.query.basis === 'string' ? req.query.basis : null;
      dynamicMeta = {
        ...dynamicMeta,
        title: `Income Rank Result — ${formattedIncome}${basis ? ` (${basis})` : ''}`,
        description: `See how an income of ${formattedIncome} compares globally${basis ? ` using ${basis}` : ''}.`,
      };
    }
  }

  const seoContent = buildSeoContent(dynamicMeta);
  const jsonLd = buildJsonLd(dynamicMeta, canonicalUrl);

  let html = baseHtml;
  html = html.replace(/<html lang="[^"]*"/i, `<html lang="${lang}"`);
  html = replaceTitleTag(html, dynamicMeta.title);
  html = replaceMetaName(html, 'title', dynamicMeta.title);
  html = replaceMetaName(html, 'description', dynamicMeta.description);
  html = replaceMetaName(html, 'keywords', dynamicMeta.keywords);
  html = replaceMetaName(html, 'robots', robots);
  html = replaceMetaName(html, 'language', langMeta.label);
  html = replaceLinkCanonical(html, canonicalUrl);
  html = replaceMetaProperty(html, 'og:url', canonicalUrl);
  html = replaceMetaProperty(html, 'og:title', dynamicMeta.title);
  html = replaceMetaProperty(html, 'og:description', dynamicMeta.description);
  html = replaceMetaProperty(html, 'og:locale', ogLocale);
  html = replaceMetaName(html, 'twitter:url', canonicalUrl);
  html = replaceMetaName(html, 'twitter:title', dynamicMeta.title);
  html = replaceMetaName(html, 'twitter:description', dynamicMeta.description);

  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${seoContent}</div>`);
  if (hreflangLinks) {
    html = html.replace('</head>', `${hreflangLinks}\n  </head>`);
  }
  return html;
}

// Ensure data directory exists for local SQLite database
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory:', dataDir);
}

// Turso Database (libSQL) - supports both local file and remote Turso
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/responses.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database
async function initDatabase() {
  // Create table if not exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,

      -- Geo data (from IP)
      country TEXT,
      country_code TEXT,
      city TEXT,
      timezone_from_ip TEXT,

      -- App / experiment metadata
      app_id TEXT,
      quiz_version TEXT,
      question_set_id TEXT,
      score_algo_version TEXT,

      -- Demographics
      age_group TEXT,
      gender TEXT,

      -- Quiz results
      question_ids TEXT,
      answers TEXT,
      question_times TEXT,
      answers_by_question_id TEXT,
      times_by_question_id TEXT,
      total_quiz_time INTEGER,

      -- Score results
      score REAL,
      tier TEXT,
      yes_count INTEGER,

      -- Session info
      session_duration INTEGER,
      selected_language TEXT,
      client_id TEXT,
      session_id TEXT,
      session_started_at TEXT,
      session_finished_at TEXT,
      completed INTEGER,

      -- Attribution
      landing_url TEXT,
      landing_path TEXT,
      document_referrer TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,

      -- Client data
      browser_language TEXT,
      languages TEXT,
      timezone TEXT,
      device_type TEXT,
      screen_width INTEGER,
      screen_height INTEGER,
      viewport_width INTEGER,
      viewport_height INTEGER,
      pixel_ratio REAL,
      platform TEXT,
      connection_type TEXT,

      -- Request metadata
      user_agent TEXT,
      referer TEXT,

      -- App-specific blob for non-quiz tools (JSON string)
      app_payload TEXT
    )
  `);

  // Lightweight, additive migrations for existing DBs
  const columnsToAdd = {
    country_code: 'TEXT',
    app_id: 'TEXT',
    app_payload: 'TEXT',
    quiz_version: 'TEXT',
    question_set_id: 'TEXT',
    score_algo_version: 'TEXT',
    question_ids: 'TEXT',
    answers_by_question_id: 'TEXT',
    times_by_question_id: 'TEXT',
    client_id: 'TEXT',
    session_id: 'TEXT',
    session_started_at: 'TEXT',
    session_finished_at: 'TEXT',
    completed: 'INTEGER',
    landing_url: 'TEXT',
    landing_path: 'TEXT',
    document_referrer: 'TEXT',
    utm_source: 'TEXT',
    utm_medium: 'TEXT',
    utm_campaign: 'TEXT',
    utm_content: 'TEXT',
    utm_term: 'TEXT'
  };

  const tableInfo = await db.execute('PRAGMA table_info(responses)');
  const existingColumns = new Set(tableInfo.rows.map(row => row.name));

  for (const [name, type] of Object.entries(columnsToAdd)) {
    if (!existingColumns.has(name)) {
      try {
        await db.execute(`ALTER TABLE responses ADD COLUMN ${name} ${type}`);
      } catch {
        // Column might already exist
      }
    }
  }

  // Create indexes for common queries
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_timestamp ON responses(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_country ON responses(country)',
    'CREATE INDEX IF NOT EXISTS idx_country_code ON responses(country_code)',
    'CREATE INDEX IF NOT EXISTS idx_age_group ON responses(age_group)',
    'CREATE INDEX IF NOT EXISTS idx_gender ON responses(gender)',
    'CREATE INDEX IF NOT EXISTS idx_app_id ON responses(app_id)',
    'CREATE INDEX IF NOT EXISTS idx_question_set_id ON responses(question_set_id)',
    'CREATE INDEX IF NOT EXISTS idx_client_id ON responses(client_id)',
    'CREATE INDEX IF NOT EXISTS idx_session_id ON responses(session_id)',
  ];

  for (const sql of indexes) {
    await db.execute(sql);
  }

  console.log('Database initialized');
}

// Helper: Get country from IP using free API
async function getGeoFromIP(ip) {
  try {
    // Skip for localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return {
        country: 'Local',
        countryCode: 'Local',
        city: 'Localhost',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city,timezone`);
    const data = await response.json();
    return {
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'Unknown',
      city: data.city || 'Unknown',
      timezone: data.timezone || 'Unknown'
    };
  } catch {
    return { country: 'Unknown', countryCode: 'Unknown', city: 'Unknown', timezone: 'Unknown' };
  }
}

// Helper: Get real IP from request
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket.remoteAddress
    || '';
}

// API: Submit quiz response
app.post('/api/submit', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const geo = await getGeoFromIP(clientIP);
    const body = req.body;
    const appPayload = body.payload === undefined
      ? null
      : (typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload));

    await db.execute({
      sql: `
        INSERT INTO responses (
          timestamp, country, country_code, city, timezone_from_ip,
          app_id, quiz_version, question_set_id, score_algo_version,
          age_group, gender,
          question_ids, answers, question_times, answers_by_question_id, times_by_question_id, total_quiz_time,
          score, tier, yes_count,
          session_duration, selected_language, client_id, session_id,
          session_started_at, session_finished_at, completed,
          landing_url, landing_path, document_referrer,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          browser_language, languages, timezone, device_type,
          screen_width, screen_height, viewport_width, viewport_height,
          pixel_ratio, platform, connection_type,
          user_agent, referer,
          app_payload
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?
        )
      `,
      args: [
        new Date().toISOString(),
        geo.country,
        geo.countryCode,
        geo.city,
        geo.timezone,
        body.appId || null,
        body.quizVersion || null,
        body.questionSetId || null,
        body.scoreAlgoVersion || null,
        body.ageGroup || null,
        body.gender || null,
        JSON.stringify(body.questionIds || []),
        JSON.stringify(body.answers || []),
        JSON.stringify(body.questionTimes || []),
        JSON.stringify(body.answersByQuestionId || {}),
        JSON.stringify(body.timesByQuestionId || {}),
        body.totalQuizTime || null,
        body.score || null,
        body.tier || null,
        body.yesCount || null,
        body.sessionDuration || null,
        body.selectedLanguage || null,
        body.clientId || null,
        body.sessionId || null,
        body.sessionStartedAt || null,
        body.sessionFinishedAt || null,
        typeof body.completed === 'boolean' ? (body.completed ? 1 : 0) : null,
        body.landingUrl || null,
        body.landingPath || null,
        body.documentReferrer || null,
        body.utmSource || null,
        body.utmMedium || null,
        body.utmCampaign || null,
        body.utmContent || null,
        body.utmTerm || null,
        body.browserLanguage || null,
        body.languages || null,
        body.timezone || null,
        body.deviceType || null,
        body.screenWidth || null,
        body.screenHeight || null,
        body.viewportWidth || null,
        body.viewportHeight || null,
        body.pixelRatio || null,
        body.platform || null,
        body.connectionType || null,
        req.headers['user-agent'] || 'Unknown',
        req.headers['referer'] || 'Direct',
        appPayload
      ]
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: 'Failed to save data' });
  }
});

// API: Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const total = await db.execute('SELECT COUNT(*) as count FROM responses');
    const recent = await db.execute('SELECT * FROM responses ORDER BY id DESC LIMIT 100');

    res.json({
      totalResponses: total.rows[0].count,
      responses: recent.rows
    });
  } catch (error) {
    console.error('Error reading stats:', error);
    res.status(500).json({ error: 'Failed to read stats' });
  }
});

// API: Get aggregated stats
app.get('/api/stats/summary', async (req, res) => {
  try {
    const total = await db.execute('SELECT COUNT(*) as count FROM responses');

    const byCountry = await db.execute(`
      SELECT country, COUNT(*) as count
      FROM responses
      GROUP BY country
      ORDER BY count DESC
      LIMIT 20
    `);

    const byAgeGroup = await db.execute(`
      SELECT age_group, COUNT(*) as count
      FROM responses
      WHERE age_group IS NOT NULL
      GROUP BY age_group
      ORDER BY age_group
    `);

    const byGender = await db.execute(`
      SELECT gender, COUNT(*) as count
      FROM responses
      WHERE gender IS NOT NULL
      GROUP BY gender
    `);

    const byDevice = await db.execute(`
      SELECT device_type, COUNT(*) as count
      FROM responses
      GROUP BY device_type
    `);

    const byLanguage = await db.execute(`
      SELECT selected_language, COUNT(*) as count
      FROM responses
      WHERE selected_language IS NOT NULL
      GROUP BY selected_language
      ORDER BY count DESC
    `);

    res.json({
      totalResponses: total.rows[0].count,
      byCountry: byCountry.rows,
      byAgeGroup: byAgeGroup.rows,
      byGender: byGender.rows,
      byDevice: byDevice.rows,
      byLanguage: byLanguage.rows
    });
  } catch (error) {
    console.error('Error reading summary:', error);
    res.status(500).json({ error: 'Failed to read summary' });
  }
});

// SPA fallback with SEO-friendly HTML
app.get('*', (req, res) => {
  const html = renderSeoHtml(req);
  if (html) {
    res.set('Content-Type', 'text/html');
    res.send(html);
  } else {
    res.sendFile(join(FRONTEND_DIST, 'index.html'));
  }
});

// Start server after database initialization
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
