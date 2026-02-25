# Awesome Rank

**Where do you stand among 8 billion people?**

Awesome Rank is a collection of interactive data tools that let you discover your place in the world through income, lifestyle, geography, and demographics. All calculations run entirely in your browser. Your data never leaves your device.

🌐 **[awesomerank.com](https://awesomerank.com)**

---

## True Size Atlas

The centerpiece of Awesome Rank. An interactive equal-area map that reveals how big countries *actually* are when you strip away the distortion of traditional maps.

**Compare anything to anything.** Select up to 10 entities simultaneously: countries, continents, subregions, or individual states/provinces, and see them overlaid at true scale on a single map.

- **Unified search** with tag filters: toggle between countries, continents, subregions, and states/provinces. Type in any language (English, Korean, ISO codes) and get instant autocomplete results grouped by category.
- **Drag to reposition.** Click a legend label to select an entity, then drag it across the map to visually compare it against others. Each entity gets a distinct color from a 10-color palette.
- **Zoom deep.** Scroll wheel, pinch, or use the slider to zoom from 0.6x to 40x. Pan the entire map or move individual entities.
- **Two resolution modes.** Quick overview at 110m, or switch to high-detail 10m for coastline-accurate comparisons.
- **Fullscreen mode** with forced landscape on mobile devices for maximum map real estate.
- **Area blocks**: proportional squares that make area differences immediately obvious at a glance.
- **Live ranking table** that highlights your selected entities among the full area ranking, with official CIA World Factbook totals.
- **Stats strip** showing each entity's area and global rank in a horizontally scrollable card row.

Powered by D3-geo's Equal Earth projection, which preserves area accuracy across the entire map, unlike Mercator, which makes Greenland look the size of Africa.

---

## Living Standard Calculator

Enter your annual income, select your country, and see exactly where you fall in the global income distribution.

- Based on the **World Inequality Database (WID.world) 2024**
- **Two comparison modes**: PPP (adjusted for local purchasing power) and MER (raw market exchange rates)
- Household-aware: adjusts for the number of adults and children
- Shows your global percentile, top-X% status, income class, and how many people share your bracket
- Supports every currency with automatic conversion
- Interactive income distribution chart

---

## World Rank Quiz

A 15-question lifestyle quiz that estimates your global standard of living using Bayesian probability scoring.

- Questions span three dimensions: **Infrastructure** (electricity, sanitation, clean water), **Connectivity** (internet, smartphone, broadband), and **Assets** (refrigerator, washing machine, housing)
- Each question is weighted by real-world global probability data (e.g. 89% of humans have electricity, but only 40% have a washing machine)
- Results include a **global percentile** and a **tier badge** from "Baseline" to "Visionary Elite"
- Shareable via URL

---

## Global Profile

Compare your physical and demographic stats against the world population.

- **Height percentile** by gender and country, using statistical distribution data
- **Age percentile**: how many of the 8 billion are younger or older than you
- **Birthday rarity**: how common or rare your birth date is globally

---

## Privacy First

Every calculation (income ranking, quiz scoring, demographic comparison) happens entirely in your browser. No income data, no personal information, and no answers are transmitted to any server. The app ships with all data embedded; no external API calls are needed.

Optional analytics (Matomo) are only collected with explicit user consent.

---

## Languages

English · 한국어 · Español · Português

---

## Data Sources

| Data | Source |
|------|--------|
| Global income distribution | [World Inequality Database](https://wid.world) (2024) |
| Country areas | CIA World Factbook |
| Country boundaries | Natural Earth (110m & 10m) |
| Height/age/birthday stats | UN Population Division, NCD-RisC |

---

## Operations (PM2)

Run production via PM2 ecosystem config:

```bash
pm2 start ecosystem.config.cjs --only worldrank
pm2 save
```

Reload after deploy:

```bash
pm2 reload ecosystem.config.cjs --only worldrank --update-env
```

---

## Environment Variables

The backend uses PostgreSQL.

- `POSTGRES_HOST` (default: `127.0.0.1`)
- `POSTGRES_PORT` (default: `5432`)
- `POSTGRES_DB` (default: `worldrank_prod`)
- `POSTGRES_USER` (default: `worldrank_app`)
- `POSTGRES_PASSWORD` (required)
- `SITE_URL` (optional, default: `https://awesomerank.com`)

Example:

```bash
export POSTGRES_HOST="127.0.0.1"
export POSTGRES_PORT="5432"
export POSTGRES_DB="worldrank_prod"
export POSTGRES_USER="worldrank_app"
export POSTGRES_PASSWORD="your-strong-password"
export SITE_URL="https://awesomerank.com"
```

---

## Tech Stack

React · TypeScript · Vite · D3-geo · Framer Motion · i18next · Express · PostgreSQL

---

## License

MIT
