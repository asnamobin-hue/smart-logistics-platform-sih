# Architecture Overview

## Stack

- **Frontend:** React 18 + Vite, React Router, Leaflet/React-Leaflet (maps), Recharts (analytics), Socket.IO client
- **Backend:** Node.js + Express, Mongoose (MongoDB), Socket.IO (real-time), Helmet + rate-limiting (security)
- **Database:** MongoDB Atlas (free M0 tier)
- **Maps:** OpenStreetMap tiles via Leaflet (no API key required)
- **Weather:** OpenWeatherMap API (API key required, see `.env`)

## Ports (development)

| Service   | Port |
|-----------|------|
| Frontend (Vite dev server) | 5173 |
| Backend (Express API + Socket.IO) | 5001 |

> Note: 5001 is used instead of the default 5000 because macOS reserves port 5000 for AirPlay Receiver.

## High-level flow
Browser (React)
│
├── REST calls ──────────► /api/* (Express, proxied via Vite in dev)
│ │
│ ├── Controllers ── Services ── Mongoose Models ── MongoDB Atlas
│ └── External APIs (OpenWeatherMap)
│
└── WebSocket ───────────► Socket.IO server
│
└── emits location:update, alert:new events

## Folder structure
frontend/
src/
components/ Reusable UI pieces (Map, Navbar, Sidebar, cards, loader)
pages/ Route-level views (Home, Dashboard, RoutePlanning, Alerts, Analytics)
services/ API client (axios), socket client, map helpers
hooks/ Reusable logic (useFetch, useSocket)
utils/ Formatters, constants
backend/
src/
config/ DB connection, socket setup
models/ Mongoose schemas (Location, Route, Alert)
controllers/ Request handlers, one per resource
routes/ Express routers, one per resource
services/ Business logic (map calculations, weather, AI stub)
data/ Seed/sample data

## Real-time design

Socket.IO is used for two event types:
- `location:update` — pushed when a vehicle/location's position or status changes
- `alert:new` — pushed the moment a new alert is created, so the Alerts page updates instantly without polling

## Environment variables

See `backend/.env` and `frontend/.env` for the full list. Never commit these files — both are excluded via `.gitignore`.