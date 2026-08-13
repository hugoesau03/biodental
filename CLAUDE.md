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
- `.env.docker.example` — template for the compose-level `.env` (DB credentials, `JWT_SECRET`, CORS origin, optional WhatsApp/Google Calendar fallback vars, SMTP for password-reset emails, optional `SENTRY_DSN`). Generate `JWT_SECRET` with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

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
npm test                   # jest --runInBand (mocks the DB pool — never touches a real database)
```

Backend runs on **port 5001 in dev** (set in `backend/.env`; falls back to 5000 if unset, and to 3000 under Docker via `PORT` env var — see `docker-compose.yml`). Frontend's default dev API URL is `http://localhost:5001/api`; production build uses `.env.production` (`REACT_APP_API_URL=/api`, meant to be served behind the nginx proxy from the Docker setup above).

Database: **`backend/database/schema.sql` is the single, complete, already-consolidated schema** (structure only, no seed/test data) — import it directly (`mysql -u root -p biodental < backend/database/schema.sql`) or let Docker's `docker-entrypoint-initdb.d` do it. There are no incremental `add_*.sql` migration files in this repo (unlike the original Dr. Desk repo this was forked from, which still tracks migrations that way) — going forward, schema changes should be edited directly into `schema.sql` and applied by hand to any already-running database, since there's no migration runner.

Deployment (non-Docker path, if ever used): `push.bat` commits and pushes to GitHub, then a server-side update script would need to be set up for this repo (the original `/root/actualizar-drdesk.sh` belongs to the Dr. Desk deployment, not this one). `.github/workflows/ci.yml` runs backend tests + frontend tests/build on every push/PR to `main` — it does **not** deploy anything, it only gates on things compiling and tests passing (the frontend build step runs with `CI=false` on purpose, since the repo still carries pre-existing ESLint warnings that `CI=true` would turn into hard errors — see the workflow file's comment before "fixing" that by flipping it back).

### Database backups

`scripts/backup-db.sh` (`scripts/restore-db.sh` to restore) dumps the Docker `mysql` service via `mysqldump` into `./backups/*.sql.gz` (gitignored — contains real patient data) and prunes anything older than `RETENTION_DAYS` (default 14). Not scheduled by anything in this repo — wire it up with cron (example command in the script's header comment) on whatever host runs `docker compose`.

### Testing

- **Backend** (`backend/tests/`): Jest + Supertest against the Express app exported by `backend/app.js` (not `server.js` — that file only adds `app.listen()` + the Google Calendar sync interval on top of `app.js`, so requiring `app.js` in tests never opens a port or starts background timers). The DB is always mocked (`jest.mock('../config/database', ...)`) — tests never touch a real MySQL instance, dev or prod. `backend/tests/setup.js` sets `NODE_ENV=test`, which also makes `loginLimiter` a no-op (otherwise the shared in-memory rate limiter trips across unrelated tests hitting it from the same "IP").
- **Frontend**: CRA's bundled Jest (react-scripts 5, Jest 27) **cannot resolve `react-router-dom` v7 at all out of the box** — its `package.json` `"main"` field points at a file that doesn't exist in the published package, and Jest 27 doesn't understand its `"exports"` map either, so any test importing anything that pulls in `react-router-dom` fails with `Cannot find module 'react-router-dom'`. Fixed via `moduleNameMapper` in the root `package.json`'s `"jest"` block, pointing `react-router-dom` / `react-router` / `react-router/dom` straight at their real CJS files under `node_modules/.../dist/`. That unblocks the import, but then rendering fails with `TextEncoder is not defined` (old jsdom bundled with Jest 27 doesn't expose it globally, and react-router-dom v7 needs it) — fixed with a small polyfill in `src/setupTests.js`. **Don't remove either fix** — without them, no component test that imports `react-router-dom` (directly or via a hook like `useNavigate`/`useSearchParams`) can even load, which is most pages in this app.

With both fixes in place, component tests work normally: `Login.test.js`, `OlvidePassword.test.js`, `RestablecerPassword.test.js` under `src/pages/` are the reference examples (mock `../services/api` and/or `../context/AuthContext`, wrap in `MemoryRouter` + a couple of stub `<Route>`s to assert on navigation instead of mocking `useNavigate`).

## Architecture

### Multi-tenancy (still present, mostly unused here)

The system is multi-tenant by `consultorios`. Nearly every table has `consultorio_id`, and `authMiddleware` (`backend/middleware/auth.js`) sets `req.user` and `req.consultorioId` from the JWT. **Every backend query must filter by `req.consultorioId`** — omitting it leaks data across clinics. Roles are `admin | doctor | recepcionista | asistente`, enforced with `requireRole(...roles)`. Biodental itself is a single clinic, but the multi-tenant plumbing is left intact (harmless — just one `consultorios` row) rather than ripped out, to keep this fork close to upstream and mergeable.

API resources expose `uuid` in URLs (e.g. `PUT /api/movimientos-externos/:uuid`) while joins use internal numeric `id`.

### Backend flow

`app.js` (the Express app itself — no `listen()`, so it's what tests import) → `routes/index.js` (mounts all routers under `/api`) → `routes/<recurso>.js` → `controllers/<recurso>Controller.js` (raw SQL via `pool` from `config/database.js`). No ORM. `server.js` requires `app.js`, calls `app.listen()`, and starts the periodic Google Calendar sync — it's the actual process entrypoint (`npm start` / `node server.js`), `app.js` is not. New endpoints require: schema change (edit `schema.sql` + apply by hand), controller, route file, mount in `routes/index.js`, and a matching service in `src/services/api.js`.

Structured logging goes through `backend/services/logger.js` (winston — JSON in production, colored text in dev); the centralized `errorHandler` middleware (`backend/middleware/errorHandler.js`) logs every error through it and also reports to Sentry via `backend/services/monitoring.js` if `SENTRY_DSN` is set (a no-op otherwise — Sentry is entirely optional). Transactional email (currently just the password-reset link) goes through `backend/services/emailService.js` (nodemailer over generic SMTP env vars); with no `SMTP_HOST` configured it logs the email contents instead of sending, which is the expected/normal state for local dev.

### Frontend flow

- **All HTTP goes through `src/services/api.js`**: a single axios instance with interceptors (attaches Bearer token from `biodental_token` in local/sessionStorage; on 401 clears storage and redirects to `/login`), plus one exported `<recurso>Service` object per backend resource. Add methods there, never call axios/fetch directly in pages.
- **Routing**: every page lives in `src/pages/` and is registered in `src/App.js` wrapped in `<ProtectedRoute>` (except `/login`). `AppLayout` renders `MainHeader` + `BottomNavigation` on all pages except login.
- **Contexts** (`src/context/`): `AuthContext` (login state, user), `ThemeContext` (light/dark theme object fed to styled-components `ThemeProvider`), `NotificacionesContext`.
- **Styling**: styled-components with theme values from the ThemeProvider (support both light and dark), mobile-first layout.

### Integrations

- **WhatsApp (YCloud)** and **Google Calendar** (per-doctor, bidirectional sync) are configured from inside the app itself: `/integraciones` (admin-only page) for both the global WhatsApp/Google credentials, and each doctor's own Perfil page to connect/disconnect their personal calendar. The `.env` variables for these are only a fallback, not the primary configuration path.
- **SMTP** (`SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM`) is the one integration that's `.env`-only, no in-app config screen — it's only used for the "olvidé mi contraseña" email (`backend/services/emailService.js`). Without it set, the reset link is logged to the backend console instead of emailed (fine for dev, not for production).

### Password reset (`usuarios`/staff only — the patient portal has no forgot-password flow)

Two-step, token-based, not the old single-step "type your email + new password" shortcut: `POST /api/auth/solicitar-reset-password` (email → generates a one-time token, stores its SHA-256 hash in `password_reset_tokens` with a 1h expiry, emails the link) then `POST /api/auth/confirmar-reset-password` (token + new password → validates hash/expiry/unused, updates the password, marks the token used). The request step always responds with the same generic message regardless of whether the email exists, to avoid account enumeration. Frontend: `OlvidePassword.js` (step 1) → `RestablecerPassword.js` (step 2, reads `?token=` from the URL).

## Security

- **JWT revocation.** JWTs are otherwise stateless — `usuarios.tokens_invalidos_antes` / `pacientes.tokens_invalidos_antes` (nullable timestamp) is the revocation mechanism: `authMiddleware`/`authPaciente` reject any token whose `iat` (issued-at, seconds) predates that column. Bumped to `NOW()` on `POST /api/auth/logout` / `POST /api/portal/auth/logout` (real "log out everywhere," not just clearing the browser's copy), and automatically on password change (`PUT /api/auth/password`, `PUT /api/portal/password`) and on a completed password reset (`confirmar-reset-password`) — changing your password kills every other session, including, on its next request, the one that made the change (the frontend's axios 401 interceptor already redirects to `/login` when that happens, so this needs no special frontend handling beyond calling `authService.logout()` / `portalService.logout()` before clearing local storage, which `AuthContext`/`PortalAuthContext` now do).
- **Rate limiting** (`backend/middleware/rateLimiter.js`): `apiLimiter` wraps the entire `/api` mount in `app.js` (default 1500 req/5min per IP, override via `RATE_LIMIT_MAX`/`RATE_LIMIT_WINDOW_MS`) — before this, only the auth endpoints were limited and everything else (pacientes, citas, recibos, …) had no throttling at all. `loginLimiter` (10/15min) still layers on top of it for login/register/reset/portal-auth specifically. Both no-op when `NODE_ENV=test` (see Testing above).
- **Input validation**: `express-validator` (was an installed-but-unused dependency) is wired into every `routes/auth.js` and the auth portion of `routes/portal.js` endpoint via a shared `validate` middleware (`backend/middleware/validate.js`) that 400s with `{errors: [{campo, mensaje}]}` on failure. Deliberately **not** using `.normalizeEmail()` — it rewrites Gmail addresses (strips dots/`+`-aliases) and could stop matching accounts that registered before validation existed. Not yet extended past auth to the other ~20 controllers — those still validate manually/ad hoc.
- **Uploaded file validation** (`backend/utils/archivoValidator.js`): there's no multipart upload anywhere in this backend — avatars (`usuarios.avatar_blob`) and patient documents (`documentos_paciente.contenido`) travel as base64 data URLs inside ordinary JSON bodies. `validarArchivoBase64()` checks the MIME against an allowlist and computes the **real** decoded byte size — before this, `tipo_archivo`/`tamanio` were whatever the client claimed, unverified. Wired into `usuariosController.updateUsuario` (images, 2MB) and `documentosController.createDocumento` (images + PDF, 10MB); the stored `tipo_archivo`/`tamanio` now come from the validator's result, not the request body.
- **CSP/HSTS**: `nginx.conf` sets the real security headers for the SPA (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) — before this, only the backend's JSON API responses carried any security headers, and CSP on a JSON API has near-zero practical effect since nothing renders it as HTML. The CSP allows Google Fonts (`fonts.googleapis.com`/`fonts.gstatic.com`, loaded in `public/index.html`) and `'unsafe-inline'` on `style-src` (styled-components injects `<style>` tags without a nonce — removing this breaks all theming). `Permissions-Policy` allows `camera=(self)` because `EscanearCheckin.js` uses `getUserMedia` for QR check-in scanning; everything else is denied. `backend/app.js` sets the same CSP/HSTS too, as defense-in-depth on the API responses themselves.
- **bcrypt cost factor is 12** (was 10) everywhere a password gets hashed (`authController.js`, `portalController.js`, `usuariosController.js`) — only affects passwords hashed from here on; existing hashes aren't rehashed retroactively.
- **`npm audit`**: both `package.json`s are audit-clean modulo two known, deliberate exceptions — don't "fix" either without re-reading why:
  - Backend: `uuid` is pinned at `^11.1.1`, not the `npm audit fix --force`-suggested `^14.0.1`. uuid v14 is ESM-only and breaks every `require('uuid')` call site in this codebase (dozens of controllers) — v11 is the last CJS-compatible major and already carries the fix for the one flagged CVE (a `buf`-argument bounds check in `v3`/`v5`/`v6`, which this codebase never calls — only `v4()` with no arguments is used anywhere).
  - Frontend: `npm audit` still reports ~28 findings, all transitive dependencies of `react-scripts`' own build tooling (svgo, postcss, workbox, terser, etc.) — CRA is unmaintained upstream and its locked dependency tree has accumulated these; **none of them ship in the production bundle** (`npm run build` output), they only run on a developer's machine during `npm start`/`npm run build`. Full resolution means migrating off CRA (e.g. to Vite) — out of scope for a security patch pass. `jspdf` (the one *direct*, runtime-shipped dependency that had a critical CVE) is bumped to `^4.2.1` and confirmed working against its only call site (`src/pages/PerfilPaciente.js`).

## Notes

- `README.md` is the stock CRA readme. `README_DRDESK.md` and `INSTRUCCIONES.md` predate the backend (they describe a mock-data-only app, from before this was even the Dr. Desk codebase) — don't trust them for current architecture; `src/data/mockData.js` is legacy.
- `CAMBIOS_CORTE_CAJA.md` documents the movimientos-externos feature and is a good example of the full-stack change pattern (schema → controller → route → api.js service → page), even though it predates this fork.
- This repo has its own git history (initialized fresh when duplicated from Dr. Desk) and its own secrets — never copy `backend/.env`, the compose `.env`, or `JWT_SECRET` from the original Dr. Desk deployment into this one, or vice versa.
