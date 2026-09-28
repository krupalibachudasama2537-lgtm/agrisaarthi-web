# AgriSaarthi — Project Context (read this first)

SIH 2026 project: solar-powered AI + IoT smart farming station with web dashboard.
Current phase: SOFTWARE ONLY. No hardware. All sensor, wildlife, mesh and pump data is simulated.

## Structure
- Repo root = frontend: React + Vite + TypeScript + Tailwind + shadcn/ui + Framer Motion + Recharts
- "/" = landing page, "/dashboard/*" = farmer dashboard (10 pages)
- i18n: English / Hindi / Gujarati (react-i18next, src/i18n/locales/)
- src/lib/api.ts = single data layer. Falls back to mock data in src/data/.
  DO NOT change its function signatures/return types — UI depends on them.
- server/ = Express + Firestore backend (not used in current phase, don't touch)
- Deployed on Vercel. vercel.json has SPA rewrite — do not delete.

## Status
- REAL: landing page, dashboard UI, i18n
- PLACEHOLDER: disease/pest detection (lookup table)
- MOCK: sensors, weather, wildlife, mesh, fertilizer, mandi prices, pest heatmap

## Rules
- Keep the existing design. Don't redesign.
- Keep mock data as fallback for every feature so the demo never breaks.
- Only modify files needed for the task. Don't refactor unrelated code.
- Add new UI text to all 3 language files (en, hi, gu).
- After changes run `npm run build` and fix all errors.
- Never commit .env files or API keys.