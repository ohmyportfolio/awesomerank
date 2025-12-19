# Awesome Rank

Discover where you stand among 8 billion people. Take our lifestyle quiz or calculate your global income ranking.

## Features

### Awesome Rank (Lifestyle Quiz)
- 20+ questions to measure your global lifestyle ranking
- Categories: Infrastructure, Connectivity, Assets, Living Standards
- Sophisticated Bayesian scoring algorithm
- Results: Top X%, Tier badge, Estimated population

### Income Rank (Income Calculator)
- Calculate your global income ranking by entering annual income
- Dual basis support: PPP (Purchasing Power Parity) / MER (Market Exchange Rate)
- Based on WID.world 2024 data
- On-device calculation (no income data uploaded)

### Multilingual Support
14 languages supported: English, Korean, Spanish, Portuguese, Chinese, Japanese, French, German, Italian, Russian, Hindi, Arabic, Indonesian, Turkish

## Tech Stack

| Area | Technology |
|------|------------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Express, SQLite (libSQL/Turso) |
| Animation | Framer Motion |
| i18n | i18next, react-i18next |

## Project Structure

```
world-rank/
├── frontend/                # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # Context (consent management, etc.)
│   │   ├── data/            # Questions, income thresholds
│   │   ├── locales/         # Translation files (14 languages)
│   │   └── utils/           # Utility functions
│   └── package.json
├── server/                  # Express backend
│   ├── server.js            # API endpoints
│   └── data/                # SQLite database
└── package.json             # Root scripts
```

## Installation & Setup

### Requirements
- Node.js 18+
- npm

### Install

```bash
# Clone repository
git clone https://github.com/hurxxxx/worldrank.git
cd worldrank

# Install all dependencies (frontend + server)
npm run install:all
```

### Development

```bash
# Frontend dev server (Vite)
npm run dev

# Backend server (dev mode)
npm run server:dev
```

### Production

```bash
# Build frontend
npm run build

# Start production server
npm run start
```

## Adding Translation Keys

1. Use `t()` function in components:
```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <p>{t('your_translation_key')}</p>;
```

2. Run parser to extract keys:
```bash
cd frontend && npm run i18n:parse
```

3. Add translations in each language file under `frontend/src/locales/`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/submit` | POST | Submit quiz responses |
| `/api/stats` | GET | Get recent responses (100) |
| `/api/stats/summary` | GET | Aggregated statistics |

## License

MIT
