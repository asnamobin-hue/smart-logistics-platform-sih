# NER Smart Logistics & Accessibility Intelligence Platform

AI-based smart logistics and accessibility intelligence platform for the **North Eastern Region (NER)** — built for **SIH Problem Statement 26002** (Ministry of Development of North Eastern Region / MDoNER).

Monitors real-time road & bridge accessibility, predicts disruptions (landslides, floods, heavy rainfall, road damage, congestion), tracks essential-commodity vehicles by GPS, raises automated alerts, accepts geo-tagged field reports (with photos, working offline), and gives district-wise connectivity dashboards — with multilingual UI (English / Hindi / Assamese).

## Problem statement coverage

| SIH 26002 requirement | Where it's implemented |
|---|---|
| a. Real-time road/bridge/transport accessibility monitoring across districts | `RoadSegment` model + `/api/roads`, `Accessibility.jsx` |
| b. Predicting disruptions (landslide, flood, rainfall, road damage, congestion) | `ai/prediction/disruptionPrediction.js`, `POST /api/roads/:id/predict-risk` |
| c. AI-based alternate route suggestions + delay estimates | `POST /api/roads/:id/alternate`, alternate-route panel in `RoutePlanning.jsx` |
| d. GPS tracking of vehicles carrying essential commodities | `Location.cargoType` / `isEssentialCargo`, live map + dashboard widget |
| e. Automated alerts for blocked roads, delays, high-risk corridors | `Alert.type`, auto-generated on risk prediction & field reports, Socket.IO push |
| f. Field officials uploading geo-tagged updates, photos, incident reports | `FieldReport` model, `POST /api/field-reports` (multer upload), `FieldReport.jsx` |
| g. Centralized dashboards (district connectivity, bottlenecks, disaster routes, supply movement) | `Accessibility.jsx`, `Dashboard.jsx`, `/api/districts/summary` |
| h. Multilingual notifications + offline sync for low-network areas | `react-i18next` (en/hi/as), localStorage offline queue + auto-sync in `FieldReport.jsx` |

## Stack

- **Frontend:** React 18, Vite, React Router, Leaflet (maps + road/bridge polylines), Recharts, Socket.IO client, react-i18next
- **Backend:** Node.js, Express, Mongoose, Socket.IO, Helmet, express-validator, Multer (photo uploads)
- **Database:** MongoDB Atlas
- **Maps:** OpenStreetMap (no API key needed)
- **Weather:** OpenWeatherMap API
- **AI:** Rule-based disruption/risk-prediction engine (`ai/prediction/`), swappable for a trained ML model later — see `ai/README.md`

See `docs/architecture.md` for a full breakdown and `docs/api.md` for the API reference.

## New dependencies added

If you already had `node_modules` installed before this update, run:

```bash
cd backend && npm install     # adds multer
cd ../frontend && npm install # adds i18next, react-i18next
```

## Local development setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # set MONGO_URI, WEATHER_API_KEY, CLIENT_URL
npm run dev             # starts on http://localhost:5001
```

### 2. Seed sample NER data (districts, roads/bridges, essential-cargo vehicles, field reports)

```bash
cd database/seed
node seed.js
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev              # starts on http://localhost:5173, proxies /api to :5001
```

### 4. Try it out

- **Dashboard** — live essential-cargo tracking + district connectivity summary
- **Accessibility** — district-wise connectivity map with color-coded road/bridge risk
- **Field Report** — submit a geo-tagged incident (works offline; syncs automatically when back online)
- **Route Planning** — pick a road/bridge segment and get an AI alternate-route suggestion
- **Alerts** — auto-generated alerts for blocked roads, high-risk corridors, and delayed deliveries
- Switch language (English / हिंदी / অসমীয়া) from the navbar

## Uploaded field-report photos

Stored under `backend/uploads/field-reports/` and served at `/uploads/field-reports/<file>`. This folder is git-ignored — configure persistent/object storage (e.g. S3) before production deployment.
