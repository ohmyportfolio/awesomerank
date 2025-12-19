import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend build)
const FRONTEND_DIST = join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(FRONTEND_DIST));

// SQLite Database
const db = new Database(join(__dirname, 'data', 'responses.db'));

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,

    -- Geo data (from IP)
    country TEXT,
    city TEXT,
    timezone_from_ip TEXT,

    -- Demographics
    age_group TEXT,
    gender TEXT,

    -- Quiz results
    answers TEXT,
    question_times TEXT,
    total_quiz_time INTEGER,

    -- Score results
    score REAL,
    tier TEXT,
    yes_count INTEGER,

    -- Session info
    session_duration INTEGER,
    selected_language TEXT,

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
    referer TEXT
  )
`);

// Create indexes for common queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_timestamp ON responses(timestamp);
  CREATE INDEX IF NOT EXISTS idx_country ON responses(country);
  CREATE INDEX IF NOT EXISTS idx_age_group ON responses(age_group);
  CREATE INDEX IF NOT EXISTS idx_gender ON responses(gender);
`);

// Prepared statement for insert
const insertStmt = db.prepare(`
  INSERT INTO responses (
    timestamp, country, city, timezone_from_ip,
    age_group, gender,
    answers, question_times, total_quiz_time,
    score, tier, yes_count,
    session_duration, selected_language,
    browser_language, languages, timezone, device_type,
    screen_width, screen_height, viewport_width, viewport_height,
    pixel_ratio, platform, connection_type,
    user_agent, referer
  ) VALUES (
    ?, ?, ?, ?,
    ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?
  )
`);

// Helper: Get country from IP using free API
async function getGeoFromIP(ip) {
  try {
    // Skip for localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return { country: 'Local', city: 'Localhost', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,timezone`);
    const data = await response.json();
    return {
      country: data.country || 'Unknown',
      city: data.city || 'Unknown',
      timezone: data.timezone || 'Unknown'
    };
  } catch {
    return { country: 'Unknown', city: 'Unknown', timezone: 'Unknown' };
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

    insertStmt.run(
      new Date().toISOString(),
      geo.country,
      geo.city,
      geo.timezone,
      body.ageGroup || null,
      body.gender || null,
      JSON.stringify(body.answers || []),
      JSON.stringify(body.questionTimes || []),
      body.totalQuizTime || null,
      body.score || null,
      body.tier || null,
      body.yesCount || null,
      body.sessionDuration || null,
      body.selectedLanguage || null,
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
      req.headers['referer'] || 'Direct'
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: 'Failed to save data' });
  }
});

// API: Get stats
app.get('/api/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM responses').get();
    const recent = db.prepare('SELECT * FROM responses ORDER BY id DESC LIMIT 100').all();

    res.json({
      totalResponses: total.count,
      responses: recent
    });
  } catch (error) {
    console.error('Error reading stats:', error);
    res.status(500).json({ error: 'Failed to read stats' });
  }
});

// API: Get aggregated stats
app.get('/api/stats/summary', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM responses').get();

    const byCountry = db.prepare(`
      SELECT country, COUNT(*) as count
      FROM responses
      GROUP BY country
      ORDER BY count DESC
      LIMIT 20
    `).all();

    const byAgeGroup = db.prepare(`
      SELECT age_group, COUNT(*) as count
      FROM responses
      WHERE age_group IS NOT NULL
      GROUP BY age_group
      ORDER BY age_group
    `).all();

    const byGender = db.prepare(`
      SELECT gender, COUNT(*) as count
      FROM responses
      WHERE gender IS NOT NULL
      GROUP BY gender
    `).all();

    const byDevice = db.prepare(`
      SELECT device_type, COUNT(*) as count
      FROM responses
      GROUP BY device_type
    `).all();

    const byLanguage = db.prepare(`
      SELECT selected_language, COUNT(*) as count
      FROM responses
      WHERE selected_language IS NOT NULL
      GROUP BY selected_language
      ORDER BY count DESC
    `).all();

    res.json({
      totalResponses: total.count,
      byCountry,
      byAgeGroup,
      byGender,
      byDevice,
      byLanguage
    });
  } catch (error) {
    console.error('Error reading summary:', error);
    res.status(500).json({ error: 'Failed to read summary' });
  }
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(FRONTEND_DIST, 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
