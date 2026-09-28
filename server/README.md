# AgriSaarthi backend

Express + Firestore API for the AgriSaarthi dashboard (`../agrisaarthi-web`).
Ingests readings from the ESP32 field station, serves the dashboard, relays
pump on/off commands back to the station, stores disease/pest diagnosis
photos, and serves mandi (market) prices.

## What's real vs. still mocked

This backend covers exactly what has a real data source available:

| Real (this backend) | Still local mock (`agrisaarthi-web/src/data`) |
|---|---|
| Sensor readings ingestion + derived KPIs/history | Weather forecast |
| Alerts (threshold-triggered) + SMS/call log | Wildlife camera AI detections |
| Pump on/off commands (dashboard → station) | Zigbee mesh telemetry |
| NPK entries | Fertilizer/crop advisory content |
| Disease/pest photo upload + storage | Pest-watch village heatmap |
| Mandi prices (seeded, see below) | Landing-page hero/station snapshot |
| Farms / farmer / station health | |
| Demo-request form submissions | |

Two things to be upfront about, so nobody mistakes this for more than it is:

- **Disease/pest diagnosis is not a real ML model.** `POST /api/diagnose/leaf`
  and `/api/diagnose/pest` really do save the uploaded photo and really do
  return an HTTP response, but the "diagnosis" itself is picked from a small
  seeded reference table (`diseaseReference`/`pestReference` in Firestore),
  deterministically by file name+size — same as the old frontend mock did.
  The swap point is `pickByFile(...)` in `src/routes/diagnosis.ts`: replace
  that call with a real inference request and nothing else in the route
  needs to change.
- **Mandi prices are seeded, not fetched live.** `npm run seed` populates
  `mandiPrices`/`marketTrend`/`grainLots` with today's demo numbers. To go
  live, replace the seed step with a scheduled job that writes to those same
  collections from a real feed (e.g. the government Agmarknet/eNAM API).

## Prerequisites

- Node.js 20+
- A Firebase project with **Firestore** enabled (Native mode)

## Setup

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)
   (or reuse an existing one) and enable **Firestore Database**.
2. **Generate a service account key**: Project settings → Service accounts →
   "Generate new private key". This downloads a JSON file.
3. **Configure env vars**:
   ```
   cp .env.example .env
   ```
   Open the downloaded JSON and copy three fields into `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` escapes exactly as
     they appear in the JSON file — don't turn them into real line breaks)
4. **Install & seed**:
   ```
   npm install
   npm run seed
   ```
   This creates the demo farmer, two farms (`farm-main`, `farm-river`),
   default alert routing, the disease/pest reference tables, and mandi
   prices — and prints **two device keys**, one per seeded station
   (`AS-01`, `AS-02`). Save these; they're shown only once. Each is the
   `X-Device-Key` the matching ESP32 must send.
5. **Run it**:
   ```
   npm run dev
   ```
   Listens on `http://localhost:4000` by default (`PORT` in `.env`).

## Connecting the frontend

In `agrisaarthi-web/`:
```
cp .env.example .env
```
which sets `VITE_API_URL=http://localhost:4000/api`. Run the frontend's own
`npm run dev` as usual. Leaving `VITE_API_URL` unset (or deleting `.env`)
makes the dashboard fall back to local mock data exactly like before this
backend existed — useful for frontend-only work with no server running.

## ESP32 integration

Every ~15 minutes, POST a reading with the device key from step 4 above:

```bash
curl -X POST http://localhost:4000/api/stations/AS-01/readings \
  -H "X-Device-Key: <the printed key for AS-01>" \
  -H "Content-Type: application/json" \
  -d '{
    "moisture": 22.4,
    "temperature": 31.2,
    "humidity": 58,
    "ph": 7.1,
    "ec": 0.52,
    "batteryPct": 78,
    "solarCharging": true,
    "signalBars": 3
  }'
```

The response carries any pending pump command:
```json
{ "ok": true, "command": { "action": "on" } }
```
`command` is `null` when there's nothing queued. A station that wants lower
latency than the 15-minute cadence can also poll
`GET /api/stations/:stationId/commands/pending` (same `X-Device-Key` header)
at any time.

## Endpoint reference

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/stations/:stationId/readings` | device key | ingestion, returns pending pump command |
| `GET` | `/api/stations/:stationId/commands/pending` | device key | low-latency command poll |
| `GET` | `/api/farmer` | — | single seeded demo farmer |
| `GET` | `/api/farms` | — | |
| `GET` | `/api/farms/:id/station-health` | — | |
| `GET` | `/api/farms/:id/overview` | — | kpis, series24h, alerts, pump |
| `GET` | `/api/farms/:id/soil` | — | live + history15/30 + npk |
| `POST` | `/api/farms/:id/npk` | — | Soil Health Card entry |
| `POST` | `/api/farms/:id/pump` | — | `{ on: boolean }`, queues a station command |
| `POST` | `/api/farms/:id/pump/auto` | — | `{ autoMode: boolean }` |
| `GET` | `/api/farms/:id/irrigation` | — | pump, powerAvailable, history |
| `POST` | `/api/diagnose/leaf` | — | multipart `photo` field |
| `POST` | `/api/diagnose/pest` | — | multipart `photo` field |
| `GET` | `/api/farms/:id/market` | — | mandi prices for the farm's crop |
| `GET` | `/api/farms/:id/notifications` | — | latest alerts, bell menu |
| `GET` | `/api/alerts` | — | full message log + routing |
| `PUT` | `/api/alerts/routing` | — | update which alert types send sms/call |
| `POST` | `/api/alerts/:id/retry` | — | re-send a failed message |
| `POST` | `/api/demo-request` | — | landing page "Book a demo" form |

This is a single-tenant demo API: there's no end-user login (matching the
current frontend, which has none), so dashboard-facing routes aren't
authenticated. The device key is the one thing that is, because it's the
one endpoint a physical device posts to over the open internet.

## A known dependency advisory

`firebase-admin`'s own dependency chain (`google-gax` → `gaxios` → `uuid`)
currently carries a moderate-severity advisory
([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq))
that isn't yet fixable without breaking `firebase-admin` itself. Run
`npm audit` after `npm install` and re-check periodically — it will clear on
its own once Google publishes an update.
