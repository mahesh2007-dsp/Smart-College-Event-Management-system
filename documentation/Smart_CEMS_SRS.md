# Software Requirements Specification (SRS)
## Smart CEMS – Smart College Event Management System

**Institution:** Rajiv Gandhi University of Knowledge Technologies (RGUKT) – IIIT RK Valley  
**Department:** Computer Science and Engineering  
**Course:** B.Tech CSE – Software Engineering Laboratory (E3-S1)  
**Document Standard:** IEEE Std 830-1998 (Adapted Academic Specification)  
**Version:** 1.0 (Verified Against Existing Source Code)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the functional, non-functional, external interface, and security requirements for **Smart CEMS (Smart College Event Management System)** as implemented at IIIT RGUKT RK Valley. Every requirement in this document is traced directly to the implemented React frontend, Node.js/Express REST API, JSON data engine (with designed PostgreSQL/Supabase migration schema), and Python HTTP microservice. Features that exist only in design files or partial form are explicitly flagged.

### 1.2 Scope
Smart CEMS is a multi-role campus event management web platform covering:
- Public browsing and filtering of university events (Technical, Cultural, Sports, Workshops, Hackathons), campus venues, and official notice-board circulars.
- Student authentication (`student`), club organizer operations (`coordinator`), and Dean/Faculty oversight (`admin`).
- Multi-campus RGUKT student ID validation (`/^[ROSN]\d{6}$/`) across RK Valley (`R`), Ongole (`O`), Srikakulam (`S`), and Nuzvid (`N`) prefixes.
- Paid and free event registration with UTR/transaction reference validation (no external live bank gateway integration).
- Client-side QR code pass generation (`qrcode`) and coordinator gate ticket verification with anti-duplicate check-in protection.
- Client-side HTML5 Canvas digital certificate generation backed by Python SHA-256 verification digests.
- Branch-and-interest content-based AI event recommendations served by a Python microservice with deterministic JavaScript fallback in Node.js.

### 1.3 Definitions, Acronyms, and Abbreviations
- **CEMS:** College Event Management System.
- **RGUKT:** Rajiv Gandhi University of Knowledge Technologies.
- **SAC:** Student Activity Center.
- **OAT:** Open Air Theatre.
- **UTR:** Unique Transaction Reference (12-digit numeric UPI reference or 10–24 char bank reference).
- **QR:** Quick Response (2D matrix barcode).
- **RLS:** Row Level Security (defined in `database/supabase_setup.sql` for future cloud migration).

### 1.4 References
- `README.md` & `DEPLOYMENT.md` in repository root.
- `backend/server.js`, `backend/db.js`, `backend/supabaseClient.js`.
- `python-service/app.py`.
- `database/schema.sql`, `database/supabase_setup.sql`.
- `frontend/src/App.jsx`, `frontend/src/services/api.js`, and component modules.

---

## 2. Overall Description

### 2.1 Product Perspective
Smart CEMS operates as a decoupled three-runtime web system in development (`Vite` :3000 + `Node/Express` :5000 + `Python http.server` :5001) and a single unified origin in production/container deployment (`Node/Express` :5000 serving `frontend/dist` and proxying AI calls to Python :5001). Runtime data persistence currently executes through `backend/db.js` JSON flat-file storage (`backend/data/*.json`), while relational PostgreSQL DDL scripts (`database/schema.sql`, `database/supabase_setup.sql`) prepare the system for future Supabase migration.

### 2.2 Product Functions
1. **Authentication & Profile Management:** Login via email or RGUKT ID, account registration with campus ID/phone regex validation, base64-compressed profile photo upload, and profile detail updates.
2. **Event Discovery & Search:** Real-time client-side category, department, and text filtering across seeded/created events.
3. **Event Creation & Roster Administration:** Coordinator event publishing with dynamic coordinator metadata, CSV roster export, financial payment ledger search/filtering, and event deletion.
4. **Registration & Payment Recording:** Duplicate-student-per-event blocking, capacity enforcement, UPI ID display (`rguktrkv.events@sbi`), UTR format checking, and unique ticket code issuance (`RKV-<evt>-<last4>-<rand4>`).
5. **QR Ticket Pass & Gate Check-In:** Local QR image rendering, printable view, and coordinator verification toggling `check_in_status` from `registered` to `checked_in`.
6. **AI Recommender & Certificate Signature:** Branch/interest scoring (`matchScore` 52–98) via Python `/api/ai/recommend` and SHA-256 verification digest generation via `/api/ai/verify-certificate`.
7. **Dean Oversight & Notices:** Client-side venue time-overlap collision detection, financial audit CSV export, and campus announcement broadcasting.

### 2.3 User Characteristics
| Role | Identifier / Profile | Technical Proficiency | Key Access Pages |
| :--- | :--- | :--- | :--- |
| Guest / Unauthenticated | None | Basic web browsing | Explore Events, Campus Venues, Notice Board, AI Recommender |
| Student (`student`) | RGUKT ID `[ROSN]\d{6}` | Familiarity with web forms & UPI | + My Portal, Event Registration, QR E-Ticket, E-Certificate |
| Event Coordinator (`coordinator`) | Club lead / E3-E4 or Staff | Intermediate digital literacy | + Organizer Hub (Host Event, Gate Verifier, Payment Ledger, CSV) |
| Dean / Faculty Admin (`admin`) | Faculty ID / Admin account | Administrative oversight | + Dean Admin Dashboard (Conflicts, Financial Audit, Announcements) |

### 2.4 Operating Environment
- **Client Browser:** Modern evergreen desktop/mobile browser supporting ES2020, Canvas 2D API, Web Storage (`localStorage`), and Blob downloads.
- **Backend Runtime:** Node.js v18+ (tested on Node v22.23.4) with Express 4.19.2 and CORS 2.8.5.
- **AI Runtime:** Python 3.x standard library (`http.server`, `hashlib`, `json`, `re`) — zero mandatory third-party pip packages required for default execution.
- **OS & Container Support:** Linux (tested), macOS, Windows, or Docker (`node:20-slim` + `python3`).

### 2.5 System Constraints
1. **Runtime Storage Constraint:** `backend/db.js` performs synchronous file I/O (`fs.readFileSync`/`writeFileSync`) on JSON files rather than querying the configured Supabase client.
2. **Hardware/Scanner Constraint:** `OrganizerHub.jsx` accepts ticket codes via text input or keyboard-wedge barcode scanners; live browser webcam QR decoding (`jsQR`) is not yet integrated.
3. **Ephemeral Hosting Constraint:** Single-instance JSON files reset on container redeploys unless backed by persistent volumes or live Supabase activation.
4. **Network Constraint:** Production single-command deployment binds Node on port `5000` (or `process.env.PORT` such as `10000` on Render) and expects Python on `PYTHON_AI_URL` (`http://localhost:5001`).

### 2.6 Assumptions and Dependencies
- Node.js Express proxies `/api/ai/*` requests to `PYTHON_AI_URL`; if Python is offline, Express gracefully executes local JS fallbacks for recommendations and certificate hashing.
- Unsplash URLs and DiceBear SVG avatars assume external internet access for rich visual assets (fallback/HTML styling degrades gracefully offline).

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### Authentication & Profile Module
- **FR-01:** System shall authenticate users by case-insensitive email or `rgukt_id` against stored credentials and return user metadata (stripping the `password` field) plus a bearer token (`user.id`).
- **FR-02:** System shall allow new account registration across roles `student`, `coordinator`, and `admin`, validating unique `email` and `rgukt_id`.
- **FR-03:** System shall enforce RGUKT ID pattern `/^[ROSN]\d{6}$/` for non-admin accounts and optional 10-digit Indian phone validation `/^[6-9]\d{9}$/`.
- **FR-04:** System shall allow authenticated users to update profile attributes (`full_name`, `phone`, `hostel`, `club_name`, `department`, `year`, `avatar_url`) via `PATCH /api/users/:id/profile`.
- **FR-05:** System shall reset authentication modal fields whenever opened or toggled between Sign In and New Account tabs to prevent stale input persistence.

#### Event Discovery & Venue Management Module
- **FR-06:** System shall list all campus events (`GET /api/events`) with optional server-side filters (`category`, `department`, `search`, `venueId`) and real-time client filtering in `EventsDiscovery.jsx`.
- **FR-07:** System shall display all 6 campus venues (`GET /api/venues`) with capacity, short code, campus location, and facility summary.
- **FR-08:** System shall allow event coordinators/admins to create events (`POST /api/events`) with category, venue reference, start/end timestamps, capacity, entry fee, prize pool, rules, and dynamic coordinator details.
- **FR-09:** System shall support event deletion (`DELETE /api/events/:id`) and backend status patching (`PATCH /api/events/:id/status`).
- **FR-10:** System shall detect time-overlapping events assigned to the same `venue_id` on the Dean Admin dashboard (`AdminDashboard.jsx`).

#### Event Registration, Payment & Ticket Pass Module
- **FR-11:** System shall enforce mandatory student details (`event_id`, `student_name`, `student_id`) and strict `/^[ROSN]\d{6}$/` format verification on `POST /api/registrations`.
- **FR-12:** System shall block registrations when `event.registered_count >= event.capacity` or when `(event_id, student_id)` already exists in `registrations.json`.
- **FR-13:** For paid events where `payment_mode !== 'Cash at SAC Desk'`, client UI shall require either 12 numeric digits (`/^\d{12}$/`) or 10–24 alphanumeric/slash chars (`/^[A-Za-z0-9/]{10,24}$/`), and backend shall require at least 8 cleaned UTR characters.
- **FR-14:** Upon registration creation, system shall increment `event.registered_count`, generate a unique ticket code (`RKV-<EVT_SUFFIX>-<LAST4_ID>-<RAND4>`), and immediately present `TicketPassModal` containing a 140px QR matrix generated client-side.

#### Gate Verification & Attendance Module
- **FR-15:** System shall verify submitted ticket codes (`POST /api/registrations/verify`) against `registrations.json`, marking first-time valid tickets as `check_in_status = 'checked_in'` with an ISO `checked_in_at` timestamp.
- **FR-16:** System shall reject duplicate verification attempts on already checked-in tickets, returning `{ valid: false, alreadyCheckedIn: true }`.
- **FR-17:** Coordinators and Deans shall be able to search, filter (All/Paid/Free), and export registration & payment ledgers to CSV files.

#### Python AI & Certificate Module
- **FR-18:** Python microservice (`POST /api/ai/recommend`) shall map department names via `BRANCH_ALIASES`, merge branch affinities with student interest tags, compute match scores bounded `[52, 98]`, and return the top 10 sorted recommendations.
- **FR-19:** Node backend shall automatically fall back to equivalent in-process JavaScript recommendation/certificate logic if Python `:5001` is unreachable.
- **FR-20:** Python microservice (`POST /api/ai/verify-certificate`) shall compute a SHA-256 digest over `STUDENT_ID|EVENT_ID|TICKET_CODE|[SECRET_SALT]` and validate client-submitted hashes for tamper detection.
- **FR-21:** `CertificateModal.jsx` shall render a 1200×800 downloadable PNG certificate stamping the verification hash (`RKV-CERT-...`).
- **FR-22:** *(Backend-only / Partial UI)* Python microservice exposes `POST /api/ai/analyze-feedback` for rule-based review sentiment polarity; no frontend feedback submission UI exists yet.

#### Announcements & Analytics Module
- **FR-23:** System shall display announcements ordered newest-first in an urgent top banner and dedicated `NoticesPage.jsx`, allowing Dean Admins to publish new notices (`POST /api/announcements`).
- **FR-24:** Backend provides `GET /api/analytics` returning `totalEvents`, `totalRegistrations`, `totalStudents`, `venuesCount`, `categoryCounts`, and `deptCounts`.

### 3.2 Non-Functional Requirements
- **NFR-01 (Performance):** Local REST endpoints shall respond in under 150 ms under normal single-campus lab load; AI recommendation calls shall complete within 1.5 s including proxy overhead.
- **NFR-02 (Responsiveness):** UI layouts shall adapt cleanly across desktop (1440px), tablet, and mobile viewports using Tailwind CSS grid/flex breakpoints.
- **NFR-03 (Maintainability):** Modular React components/pages, separated Node DB helper (`db.js`), and isolated Python HTTP microservice allow storage or algorithm upgrades with minimal cross-layer breakage.
- **NFR-04 (Reliability / Fault Tolerance):** Express `/api/ai/*` handlers must degrade gracefully via fallback execution when Python :5001 is unavailable; unhandled `/api/*` paths must return structured JSON 404 errors rather than HTML.
- **NFR-05 (Usability):** Form modals (`AuthModal`, `EventRegisterModal`) shall clear stale state upon close/switch and display explicit field-level validation guidance (`R/O/S/Nxxxxxx`, UTR digit counter `n/12`).

### 3.3 External Interface Requirements
- **User Interfaces:** Dark slate glassmorphism React SPA with Lucide iconography, Outfit/Inter typography, printable ticket container, and HTML5 Canvas certificate downloader.
- **Software Interfaces:**
  - Frontend ↔ Node Backend: JSON over HTTP REST (`http://localhost:5000/api/*` or Vite dev proxy `/api` → `:5000`).
  - Node Backend ↔ Python AI: HTTP POST JSON via `fetch` to `${PYTHON_AI_URL}/api/ai/*`.
  - Node Backend ↔ Storage: Local JSON files in `backend/data/*.json` (future: `@supabase/supabase-js` client).
- **Hardware / Communication Interfaces:** Standard TCP/IP HTTP loopback/LAN; optional USB HID barcode/QR scanner acting as keyboard input in the gate verifier modal.

### 3.4 Security Requirements (Implemented vs Gaps)
- **SEC-01 (Implemented):** Backend strips `password` from all login, registration, profile-update, and `/api/auth/me` JSON payloads.
- **SEC-02 (Implemented):** Certificates include a salted SHA-256 verification digest allowing detection of altered ticket/student claims.
- **SEC-03 (Implemented):** Strict regex sanitization prevents malformed RGUKT IDs (`[ROSN]\d{6}`), emails, phone numbers, and short UTR references during account signup and event registration.
- **SEC-04 (Known Current Gap — Documented):** Passwords are stored and compared in plaintext in `users.json`, and `token` equals `user.id` rather than a signed expiring JWT (`HS256`/`RS256`).
- **SEC-05 (Known Current Gap — Documented):** `authMiddleware` extracts `req.user` without enforcing role-based HTTP 401/403 authorization guards on `/api/events` creation/deletion, `/api/registrations`, `/api/registrations/verify`, `/api/announcements` POST, or `/api/analytics`; role enforcement currently relies on frontend view routing. Production deployment requires adding server-side RBAC guards, `bcrypt` password hashing, and JWT verification.
