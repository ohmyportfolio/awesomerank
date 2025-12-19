import express from 'express';
import cors from 'cors';
import { readFileSync, appendFileSync, existsSync } from 'fs';
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

// Data file path
const DATA_FILE = join(__dirname, 'data', 'responses.jsonl');

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

    const data = {
      // Timestamp
      timestamp: new Date().toISOString(),

      // Geo data (from IP, but IP itself is NOT stored)
      country: geo.country,
      city: geo.city,
      timezoneFromIP: geo.timezone,

      // Data from client
      ...req.body,

      // Request metadata
      userAgent: req.headers['user-agent'] || 'Unknown',
      referer: req.headers['referer'] || 'Direct',
    };

    // Append to JSONL file (one JSON per line)
    appendFileSync(DATA_FILE, JSON.stringify(data) + '\n');

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: 'Failed to save data' });
  }
});

// API: Get stats (optional, for admin)
app.get('/api/stats', (req, res) => {
  try {
    if (!existsSync(DATA_FILE)) {
      return res.json({ totalResponses: 0, responses: [] });
    }

    const content = readFileSync(DATA_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const responses = lines.map(line => JSON.parse(line));

    res.json({
      totalResponses: responses.length,
      responses: responses.slice(-100) // Last 100 responses
    });
  } catch (error) {
    console.error('Error reading stats:', error);
    res.status(500).json({ error: 'Failed to read stats' });
  }
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(FRONTEND_DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
