# How to run this project

This folder = your GitHub repo's backend (unchanged) + the integrated frontend
(your zip #2 frontend, with Emergency Mode / Safety Locator added). Nothing
else was changed.

## 1. Requirements you need before it will actually start
- Node.js installed
- A MongoDB database the backend can connect to. The backend **will not start**
  without one (`backend/src/config/db.js` exits the process on connection
  failure — this is existing behavior in your repo, not something I added).
  Options:
  - Install MongoDB locally and use `mongodb://localhost:27017/logistics`, or
  - Create a free MongoDB Atlas cluster and paste its connection string.

## 2. Fill in backend/.env
A `backend/.env` file is already created (copied from `.env.example`).
Open it and set at minimum:
```
MONGO_URI=<your mongo connection string>
```
`WEATHER_API_KEY` and `ANTHROPIC_API_KEY` are optional — those features
degrade gracefully without them (see comments in the file).

## 3. Install dependencies
```
cd backend && npm install
cd ../frontend && npm install
```

## 4. Run both (two terminals)
```
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```
Frontend: http://localhost:5173 (already configured to proxy /api to the
backend on port 5001 — see frontend/vite.config.js).

## 5. What's new vs. your repo
Only inside `frontend/`:
- `pages/EmergencyMode.jsx` — the geolocation Safety Locator overlay
- `services/api.js` — added `getEmergencyData()`
- `demo-data/emergencyData.json` — new demo data file
- `services/mapService.js` — added `createDisruptionIcon`
- `components/Map.jsx` — added optional `disruptionMarkers` prop
- `components/Navbar.jsx` — added a "Safety Locator" button
- `App.jsx` — renders the overlay when that button is clicked

Fix included: the locator no longer shows a shelter 1000+ km away when your
real device GPS is outside the North Eastern Region — it now falls back to
the NER reference point in that case, with a message explaining why.

Nothing in `backend/`, `ai/`, `database/`, or `docs/` was touched.
