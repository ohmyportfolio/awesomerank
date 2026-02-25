You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight.
Focus on:
Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with shar p accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for insp iration.
Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motio n library for React when available. Focus on high-impact moments: one well-orchestrated page load with stagger ed reveals (animation-delay) creates more delight than scattered micro-interactions.
Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.
Avoid generic AI-generated aesthetics:
Overused font families (Inter, Roboto, Arial, system fonts)
Clichéd color schemes (particularly purple gradients on white backgrounds)
Predictable layouts and component patterns
Cookie-cutter design that lacks context-specific character
Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!

# Awesome Rank Project Guide

## Project Structure

```
world-rank/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── locales/   # Translation files (see i18n.ts for supported languages)
│   │   └── i18n.ts
│   └── package.json
├── server/            # Express + PostgreSQL backend
│   ├── server.js
│   └── db/            # SQL migrations
└── package.json       # Root scripts
```

## i18n (Internationalization) Usage

### Translation Key Convention (IMPORTANT)

**Use English original text as the translation key:**
```tsx
// CORRECT - English sentence as key
t('Where do you rank among 8 billion people?')

// WRONG - Do NOT use abbreviated keys
t('app_world_rank_desc')  // ❌ Don't do this
```

This pattern:
- Key = English original sentence
- Value = Translated text (for English, key equals value)

Example in locale files:
```json
// en.json
"Where do you rank among 8 billion people?": "Where do you rank among 8 billion people?"

// ko.json
"Where do you rank among 8 billion people?": "80억 인구 중 당신의 위치는?"
```

### Adding New Translation Keys

1. **Use `t()` function with English text in components:**
   ```tsx
   import { useTranslation } from 'react-i18next';

   const { t } = useTranslation();
   return <p>{t('Enter your annual income to see your global rank')}</p>;
   ```

2. **Run the parser to extract keys:**
   ```bash
   cd frontend && npm run i18n:parse
   ```
   This automatically:
   - Scans all source files for `t('key')` calls
   - Adds new keys to all locale files (with empty values)
   - Removes unused keys

3. **Fill in the translations:**
   - For `en.json`: Set value = key (English text)
   - For other locales: Add translated text as value
   - Supported languages: en, ko, es, pt, zh, ja, fr, de, it, ru, hi, ar, id, tr, plus Baltic/Nordic languages

### Important Notes

- **DO NOT manually add keys to locale files** - use `npm run i18n:parse`
- **DO NOT use abbreviated keys** like `btn_submit`, `msg_error` - use full English sentences
- Parser warns about dynamic keys like `t(variable)` - these must be added manually if needed
- Default fallback language is English (`en`)
- After running parser, `en.json` will have empty values - fill them with the same English text as the key

### Example Workflow

```tsx
// 1. Add translation in component with English text as key
<button>{t('Submit your response')}</button>

// 2. Run parser
// cd frontend && npm run i18n:parse

// 3. Fill en.json (key = value for English)
// "Submit your response": "Submit your response"

// 4. Add translations to other locale files
// ko.json: "Submit your response": "응답 제출"
// ja.json: "Submit your response": "回答を送信"
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

Data is stored in PostgreSQL (`responses` table)
