# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Biodental** is a medical/dental clinic management system (citas, pacientes, recibos, corte de caja, formularios clínicos, inventario, recetas, presupuestos). It started as a fork of the "Dr. Desk" codebase, duplicated into this repo and rebranded/dockerized for the Biodental client — same architecture, independent deployment (own database, own secrets, own git history). Everything — UI text, identifiers, commit messages, docs — is in Spanish; keep it that way.

Three parts in one repo:
- **Frontend** (repo root): Create React App (React 19, react-scripts 5), styled-components, react-router-dom v7, Recharts, lucide-react. PDF generation via jspdf/pdf-lib/html2canvas.
- **Backend** (`backend/`): Express + MySQL (mysql2 pool), JWT auth. Separate package.json.
- **`registro-consultorio/`**: standalone vanilla HTML/JS/PHP mini-app, independent of the React app.

## Running it — Docker (recommended)

The whole stack (MySQL + backend + nginx-served frontend) is dockerized:

```bash
cp .env.docker.example .env      # fill in real secrets — never reuse drdesk's or the .example values
docker compose build
docker compose up -d
```

Frontend at `http://localhost:${HTTP_PORT:-8080}`, proxying `/api/*` to the backend container (see `nginx.conf`) — no CORS issues, no hardcoded domain baked into the build. MySQL data persists in the `mysql_data` named volume; `backend/database/schema.sql` is mounted read-only into `docker-entrypoint-initdb.d` and only runs on first container start (empty volume). To re-seed from scratch: `docker compose down -v` (destroys the DB volume) then `docker compose up -d`.

- `Dockerfile` (root) — multi-stage: CRA build → static files served by nginx (`nginx.conf`).
- `backend/Dockerfile` — plain Node 20-alpine running `server.js`.
- `docker-compose.yml` — orchestrates `mysql` / `backend` / `frontend` services on one bridge network.
- `.env.docker.example` — template for the compose-level `.env` (DB credentials, `JWT_SECRET`, CORS origin, optional WhatsApp/Google Calendar fallback vars). Generate `JWT_SECRET` with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

## Running it — without Docker (local dev)

Frontend (repo root):
```bash
npm start                  # dev server on :3000
npm run build              # production build to build/
npm test                   # Jest in watch mode (CRA)
npm test -- --watchAll=false --testPathPattern=App   # single test file
```

Backend (`cd backend`):
```bash
npm run dev                # nodemon, needs backend/.env (copy from .env.example) + a local MySQL with schema.sql imported
npm start                  # node server.js
```

Backend runs on **port 5001 in dev** (set in `backend/.env`; falls back to 5000 if unset, and to 3000 under Docker via `PORT` env var — see `docker-compose.yml`). Frontend's default dev API URL is `http://localhost:5001/api`; production build uses `.env.production` (`REACT_APP_API_URL=/api`, meant to be served behind the nginx proxy from the Docker setup above).

Database: **`backend/database/schema.sql` is the single, complete, already-consolidated schema** (structure only, no seed/test data) — import it directly (`mysql -u root -p biodental < backend/database/schema.sql`) or let Docker's `docker-entrypoint-initdb.d` do it. There are no incremental `add_*.sql` migration files in this repo (unlike the original Dr. Desk repo this was forked from, which still tracks migrations that way) — going forward, schema changes should be edited directly into `schema.sql` and applied by hand to any already-running database, since there's no migration runner.

Deployment (non-Docker path, if ever used): `push.bat` commits and pushes to GitHub, then a server-side update script would need to be set up for this repo (the original `/root/actualizar-drdesk.sh` belongs to the Dr. Desk deployment, not this one).

## Architecture

### Multi-tenancy (still present, mostly unused here)

The system is multi-tenant by `consultorios`. Nearly every table has `consultorio_id`, and `authMiddleware` (`backend/middleware/auth.js`) sets `req.user` and `req.consultorioId` from the JWT. **Every backend query must filter by `req.consultorioId`** — omitting it leaks data across clinics. Roles are `admin | doctor | recepcionista | asistente`, enforced with `requireRole(...roles)`. Biodental itself is a single clinic, but the multi-tenant plumbing is left intact (harmless — just one `consultorios` row) rather than ripped out, to keep this fork close to upstream and mergeable.

API resources expose `uuid` in URLs (e.g. `PUT /api/movimientos-externos/:uuid`) while joins use internal numeric `id`.

### Backend flow

`server.js` → `routes/index.js` (mounts all routers under `/api`) → `routes/<recurso>.js` → `controllers/<recurso>Controller.js` (raw SQL via `pool` from `config/database.js`). No ORM. New endpoints require: schema change (edit `schema.sql` + apply by hand), controller, route file, mount in `routes/index.js`, and a matching service in `src/services/api.js`.

### Frontend flow

- **All HTTP goes through `src/services/api.js`**: a single axios instance with interceptors (attaches Bearer token from `biodental_token` in local/sessionStorage; on 401 clears storage and redirects to `/login`), plus one exported `<recurso>Service` object per backend resource. Add methods there, never call axios/fetch directly in pages.
- **Routing**: every page lives in `src/pages/` and is registered in `src/App.js` wrapped in `<ProtectedRoute>` (except `/login`). `AppLayout` renders `MainHeader` + `BottomNavigation` on all pages except login.
- **Contexts** (`src/context/`): `AuthContext` (login state, user), `ThemeContext` (light/dark theme object fed to styled-components `ThemeProvider`), `NotificacionesContext`.
- **Styling**: styled-components with theme values from the ThemeProvider (support both light and dark), mobile-first layout.

### Integrations

- **WhatsApp (YCloud)** and **Google Calendar** (per-doctor, bidirectional sync) are configured from inside the app itself: `/integraciones` (admin-only page) for both the global WhatsApp/Google credentials, and each doctor's own Perfil page to connect/disconnect their personal calendar. The `.env` variables for these are only a fallback, not the primary configuration path.

## Notes

- `README.md` is the stock CRA readme. `README_DRDESK.md` and `INSTRUCCIONES.md` predate the backend (they describe a mock-data-only app, from before this was even the Dr. Desk codebase) — don't trust them for current architecture; `src/data/mockData.js` is legacy.
- `CAMBIOS_CORTE_CAJA.md` documents the movimientos-externos feature and is a good example of the full-stack change pattern (schema → controller → route → api.js service → page), even though it predates this fork.
- This repo has its own git history (initialized fresh when duplicated from Dr. Desk) and its own secrets — never copy `backend/.env`, the compose `.env`, or `JWT_SECRET` from the original Dr. Desk deployment into this one, or vice versa.
