# Awesome Rank Project Guide

## Project Structure

```
world-rank/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── locales/   # Translation files (14 languages)
│   │   └── i18n.ts
│   └── package.json
├── server/            # Express + SQLite backend
│   ├── server.js
│   └── data/          # SQLite database
└── package.json       # Root scripts
```

## i18n (Internationalization) Usage

### Adding New Translation Keys

1. **Use `t()` function in components:**
   ```tsx
   import { useTranslation } from 'react-i18next';

   const { t } = useTranslation();
   return <p>{t('your_translation_key')}</p>;
   ```

2. **Run the parser to extract keys:**
   ```bash
   cd frontend && npm run i18n:parse
   ```
   This automatically:
   - Scans all source files for `t('key')` calls
   - Adds new keys to all 14 locale files
   - Removes unused keys

3. **Translate the new keys:**
   - Edit files in `frontend/src/locales/`
   - Supported languages: en, ko, es, pt, zh, ja, fr, de, it, ru, hi, ar, id, tr

### Important Notes

- **DO NOT manually add keys to locale files** - use `npm run i18n:parse`
- Parser warns about dynamic keys like `t(variable)` - these must be added manually if needed
- Default fallback language is English (`en`)

### Example Workflow

```tsx
// 1. Add translation in component
<button>{t('new_button_label')}</button>

// 2. Run parser
// cd frontend && npm run i18n:parse

// 3. Edit locale files to add translations
// frontend/src/locales/ko.json: "new_button_label": "새 버튼"
```

## Development Commands

```bash
# Root commands
npm run dev           # Start frontend dev server
npm run build         # Build frontend
npm run start         # Start production server
npm run server:dev    # Start server in dev mode
npm run install:all   # Install all dependencies

# Frontend commands (from /frontend)
npm run i18n:parse    # Extract translation keys
npm run lint          # Run ESLint
```

## Data Collection

The app collects:
- Demographics (age group, gender) - user provided
- Device info (screen size, device type, etc.) - auto collected
- Geo data (country, city from IP) - auto collected
- Quiz responses and timing

Data is stored in SQLite at `server/data/responses.db`
