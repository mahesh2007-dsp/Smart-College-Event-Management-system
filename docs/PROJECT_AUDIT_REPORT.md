# Smart CEMS – Comprehensive Project Audit Report (Phase 1 & Phase 2)

**Project:** Smart College Event Management System (Smart CEMS) – IIIT RGUKT RK Valley  
**Audit Scope:** Full-stack codebase inspection (`frontend/`, `backend/`, `python-service/`, `database/`, deployment configs)  
**Status:** Pre-remediation baseline audit (no application source code modified yet)

---

## Phase 1: Project Understanding & Architecture Trace

### 1.1 Tech Stack & Directory Structure
| Layer | Technology | Entry / Key Files |
| :--- | :--- | :--- |
| **Frontend SPA** | React 18.3, Vite 5.4, Tailwind CSS 3.4, `lucide-react`, `qrcode`, `canvas-confetti` | [`frontend/src/App.jsx`](../frontend/src/App.jsx), [`frontend/src/services/api.js`](../frontend/src/services/api.js), `frontend/src/pages/*`, `frontend/src/components/*` |
| **Backend API & Static Host** | Node.js, Express 4.19, `cors`, `@supabase/supabase-js` (installed, unused at runtime) | [`backend/server.js`](../backend/server.js), [`backend/db.js`](../backend/db.js), [`backend/supabaseClient.js`](../backend/supabaseClient.js) |
| **AI & Crypto Microservice** | Python 3 standard library `http.server` (`BaseHTTPRequestHandler`), `hashlib`, `re` | [`python-service/app.py`](../python-service/app.py) |
| **Persistence** | Synchronous JSON flat-file store (`backend/data/*.json`); un-wired ANSI/PostgreSQL DDL | `backend/data/{users,events,venues,registrations,announcements}.json`, [`database/schema.sql`](../database/schema.sql) |
| **Deployment** | Multi-stage `Dockerfile`, `docker-compose.yml`, `render.yaml`, `vercel.json`, `start-prod.sh` | [`Dockerfile`](../Dockerfile), [`start-prod.sh`](../start-prod.sh) |

### 1.2 Data Flow & Implemented vs. Partial Features
- **Implemented:** Public event discovery/filtering, user login/registration, student profile editing & avatar upload, free & paid (UTR) event registration, duplicate-registration & capacity guards, QR ticket generation & anti-duplicate gate check-in, Python AI branch/interest recommendation (with Node fallback), SHA-256 certificate digest generation/verification, coordinator event creation/deletion & CSV export, dean announcements & KPI analytics.
- **Partially Implemented / Unwired:**
  - `POST /api/ai/analyze-feedback` exists in `python-service/app.py` and `event_feedback` exists in `database/schema.sql`, but there is no Express proxy route or React UI.
  - `backend/supabaseClient.js` initializes a Supabase client if env vars exist, but `backend/db.js` never queries Supabase—every read/write hits local JSON files.
  - Venue collision detection runs only in `AdminDashboard.jsx` on the client; `POST /api/events` does not prevent overlapping bookings.
- **Clean Build Check:** `cd frontend && npm run build` succeeds (`dist/` built in 4.09s). No automated test suite (`vitest`, `jest`, `playwright`, or `pytest`) is configured in `package.json`.

---

## Phase 2: Technical Faults, Security Vulnerabilities & Limitations

| ID | Severity | File & Location | Issue Description | Root Cause | Recommended Solution | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUD-01** | **Critical** | `backend/server.js:70` | **Public Admin/Coordinator Privilege Escalation** | `POST /api/auth/register` trusts `req.body.role` (`['student','coordinator','admin']`), letting any anonymous visitor register as `admin`. | Restrict public self-registration to `student` (or require authenticated `admin` to create/promote `coordinator`/`admin` accounts). | Open |
| **AUD-02** | **Critical** | `backend/server.js:14-24, 46, 109` | **Trivial Bearer Token Spoofing** | `token` is literally `user.id` (e.g., `USR-ADM-01`), and `authMiddleware` resolves `db.getUserById(token)` with no cryptographic signature or expiry. | Replace raw ID tokens with HMAC-SHA256 signed JWTs (using `crypto` + env secret + `exp` claim). | Open |
| **AUD-03** | **Critical** | `backend/server.js:39, 102`; `backend/db.js:44-46` | **Plaintext Password Storage & Comparison** | Passwords are stored and compared in plaintext in `users.json`. | Hash passwords using Node `crypto.scryptSync` with per-user random salt and `timingSafeEqual`; migrate/upgrade seeded accounts seamlessly. | Open |
| **AUD-04** | **Critical** | `backend/server.js:114-310` | **Missing Backend RBAC & Ownership Checks** | `PATCH /api/users/:id/profile`, `POST/PATCH/DELETE /api/events`, `POST /api/registrations/verify`, `POST /api/announcements`, and `GET /api/registrations` lack `requireAuth` / `requireRole` / ownership checks. | Add `requireAuth` and `requireRole(...)` middleware, restrict profile edits to self/admin, and scope `GET /api/registrations` to owner/coordinator/admin. | Open |
| **AUD-05** | **High** | `frontend/src/services/api.js`, `App.jsx:67,117`, `StudentPortal.jsx`, `OrganizerHub.jsx`, `AdminDashboard.jsx` | **Frontend Token Omission / Wrong Token Passed** | Components either omit `token` or pass `currentUser.id` instead of `localStorage.getItem('rkv_cems_token')`. | Centralize `authHeaders()` in `api.js` reading `rkv_cems_token` automatically and handling `401`/`403` cleanly. | Open |
| **AUD-06** | **High** | `backend/server.js:271-275` | **Client-Controlled Payment Amount & Status** | `POST /api/registrations` trusts `req.body.payment_amount` and `payment_status`, and hardcodes `150` fallback instead of parsing `evt.entry_fee`. | Compute `payment_amount` server-side from `evt.entry_fee`; force `pending`/`paid` status rules server-side; validate UTR format (`^[A-Za-z0-9]{10,24}$` or `^\d{12}$` for UPI). | Open |
| **AUD-07** | **High** | `backend/db.js:314, 359, 396, 458` | **ID Collision & Non-Atomic Writes** | `createEvent`, `createUser`, and `createAnnouncement` derive IDs from `list.length + 1` (collides after deletes); `createRegistration` uses 4-digit random numbers; `writeTable` writes directly without atomic temp+rename. | Use monotonic/unique ID generation (max suffix + 1 or `crypto.randomUUID()`), check uniqueness, and write atomically via temp file + `renameSync`. | Open |
| **AUD-08** | **High** | `backend/server.js:150-191`; `backend/db.js:336-341` | **Missing Server-Side Venue Clash & Event Integrity Checks** | `POST /api/events` accepts invalid dates (`end < start`), non-positive capacity, and overlapping venue bookings; `deleteEvent` ignores missing IDs and leaves orphaned registrations. | Validate dates, capacity, and venue overlap on server; return `404` on unknown delete and guard/clean related state. | Open |
| **AUD-09** | **High** | `backend/server.js:433`; `python-service/app.py:182, 186` | **Hardcoded Certificate Salt & Empty-Hash `valid: true`** | Secret salt is hardcoded in source; `verify-certificate` returns `valid: true` when `certificateHash` is omitted (used for generation). | Read `CERT_SECRET_SALT` from environment variables (with safe dev-only fallback warning) and separate `/generate` vs `/verify` behavior cleanly while preserving UI compatibility. | Open |
| **AUD-10** | **Medium** | `backend/server.js:9, 452` | **Permissive CORS, Missing Security Headers & Rate Limiting** | `cors({ origin: '*' })`, no `X-Content-Type-Options`/`X-Frame-Options` headers, no auth rate limiting, and `POST /api/registrations` allows `req.user === null` guest fallback. | Add security headers middleware, login/register rate limiting, configurable `CORS_ORIGIN`, and require authenticated student/user session for registrations. | Open |
| **AUD-11** | **Medium** | `frontend/src/App.jsx`, `OrganizerHub.jsx`, `AdminDashboard.jsx`, `StudentPortal.jsx` | **Missing Loading/Error Banners, Role Route Guards & Accessibility** | Initial `loadData()` has no loading spinner or error retry banner; `api.js` ignores `!res.ok` on `getEvents`, `verifyTicket`, `broadcastAnnouncement`, `deleteEvent`; modals lack `Escape` key / `role="dialog"` / `aria-modal`. | Add error handling in `api.js`, global loading & error states in `App.jsx`, role-gated page rendering, and modal keyboard/ARIA accessibility. | Open |
| **AUD-12** | **Medium** | `backend/db.js` vs `database/schema.sql` | **No Automated Tests & Unwired SQL/Feedback Module** | Zero unit/integration/E2E tests exist; `POST /api/ai/analyze-feedback` has no Express/React wiring; Supabase integration is stubbed only. | Add Node native `node:test` + Python `unittest` automated test suites and frontend build/API verification; document Supabase/camera QR as environment-dependent where applicable. | Open |
