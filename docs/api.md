# API Reference

Base URL (development): `http://localhost:5001/api`
(In the frontend, this is reached via the `/api` path, proxied by Vite.)

## Locations

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/locations` | List all current locations (vehicles/warehouses) |
| GET | `/locations/:id` | Get a single location by ID |

## Routes

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/routes` | List all routes |
| POST | `/routes` | Create a new route. Body: `{ origin, destination }` |
| POST | `/routes/optimize` | Return an optimized route suggestion (stubbed for now) |

## Alerts

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/alerts` | List all alerts |
| PATCH | `/alerts/:id/resolve` | Mark an alert as resolved |

## Analytics

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/analytics` | Returns `{ deliveryTrend, routeStatusBreakdown, alertsBySeverity }` for charts |

## Weather

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/weather?lat=..&lon=..` | Current weather for a coordinate (via OpenWeatherMap) |

## Districts (NER district-wise connectivity)

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/districts` | List districts. Filter with `?state=` or `?connectivityStatus=` |
| GET | `/districts/summary` | Connectivity breakdown (`normal`/`partial`/`disrupted`) for the dashboard |
| GET | `/districts/:id` | Single district |

## Roads & bridges (accessibility monitoring + disruption prediction)

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/roads` | List road/bridge segments. Filter with `?district=`, `?status=`, `?type=`, `?highRiskOnly=true` |
| GET | `/roads/:id` | Single segment |
| POST | `/roads` | Create a segment. Body: `{ name, type, district, path, status, notes }` |
| POST | `/roads/:id/predict-risk` | Runs the AI disruption-risk model. Body: `{ weatherCondition, rainfallMm, recentRouteCount }` → updates `riskScore`/`riskLevel`/`riskFactors`, may auto-block the segment and raise an alert |
| POST | `/roads/:id/alternate` | AI alternate-route suggestion. Body: `{ alternateSegmentId?, primaryEtaMinutes, alternateEtaMinutes }` → `{ useAlternate, reason, estimatedDelayMinutes }` |

## Field reports (geo-tagged incident reporting, offline-sync aware)

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/field-reports` | List reports. Filter with `?district=`, `?incidentType=`, `?status=` |
| POST | `/field-reports` | Create a report (`multipart/form-data`, optional `photo` file). Body fields: `reporterName, reporterRole, district, roadSegment, incidentType, description, lat, lon, language, clientCreatedAt, synced` |
| PATCH | `/field-reports/:id/status` | Update triage status (`new`/`acknowledged`/`resolved`) |

## Real-time events (Socket.IO)

| Event | Direction | Payload |
|-------|-----------|---------|
| `location:update` | server → client | Updated location object `{ id, name, lat, lon, status, cargoType, isEssentialCargo }` |
| `alert:new` | server → client | New alert object `{ id, title, message, severity, type, createdAt }` |
| `alert:resolved` | server → client | Resolved alert object |
| `road:risk-updated` | server → client | Road segment with refreshed `riskScore`/`riskLevel`/`status` |
| `fieldreport:new` | server → client | Newly submitted field report |

## Error format

All error responses follow:
```json
{ "error": "Human-readable message" }
```