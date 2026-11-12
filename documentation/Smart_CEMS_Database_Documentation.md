# Smart CEMS – Database & Data Persistence Documentation

## 1. Storage Architecture Overview

Smart CEMS maintains a **dual-layer persistence model** in the current repository:

1. **Active Runtime Persistence (`backend/db.js`):** Synchronous JSON table persistence stored under `backend/data/*.json` across five entities (`venues.json`, `users.json`, `events.json`, `registrations.json`, `announcements.json`). On first startup (`initializeDatabase()`), if `venues.json` does not exist, all five files are automatically seeded with initial RGUKT IIIT RK Valley campus records.
2. **Designed Cloud Relational Schema (`database/schema.sql`, `database/supabase_setup.sql`):** Normalized PostgreSQL DDL schema with 6 relational tables (`users`, `venues`, `events`, `registrations`, `announcements`, `event_feedback`), foreign-key constraints, check constraints, and Supabase Row Level Security (RLS) policies. Although `backend/supabaseClient.js` is imported on line 4 of `backend/db.js`, its client instance is not yet wired into active query execution.

---

## 2. Active Runtime Entities (`backend/data/*.json`)

| Entity / File | Primary Identifier | Purpose | Foreign / Logical References |
| :--- | :--- | :--- | :--- |
| `users.json` | `id` (e.g., `USR-STU-01`) | Stores students, coordinators, and faculty admins | Unique `email`, `rgukt_id` |
| `venues.json` | `id` (`v1`–`v6`) | Campus event halls, auditoriums, labs, sports grounds | Referenced by `events.venue_id` |
| `events.json` | `id` (e.g., `EVT-2026-001`) | Hosted academic/cultural/sports events & coordinator contacts | Links to `venues.id` via `venue_id` |
| `registrations.json` | `id` (`REG-...`) | Event registrations, UTR payment trails, QR tickets, check-ins | Links to `events.id` (`event_id`) and `users.id` (`user_id`) |
| `announcements.json` | `id` (`ANN-...`) | Campus circulars with priority (`urgent` / `info`) | Issued by Dean Admin |

---

## 3. Designed PostgreSQL / Supabase Relational Schema (`database/schema.sql`)

### 3.1 `users` Table
| Column | SQL Type | Constraints | Notes / Runtime Parity |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Runtime JSON uses string IDs (`USR-...`) |
| `email` | `VARCHAR(255)` | `UNIQUE NOT NULL` | Indexed for login lookup |
| `password_hash` | `TEXT` | `NOT NULL` | Runtime JSON stores `password` |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | Required (`>= 2` chars) |
| `role` | `VARCHAR(20)` | `NOT NULL CHECK (role IN ('student','coordinator','admin'))` | Default `'student'` |
| `rgukt_id` | `VARCHAR(20)` | `UNIQUE` | Validated against `/^[ROSN]\d{6}$/` for non-admins |
| `department` | `VARCHAR(100)` | Nullable | Academic branch |
| `year` | `VARCHAR(20)` | Nullable | e.g., `E1`–`E4`, `PUC-1`, `Faculty` |
| `phone` | `VARCHAR(20)` | Nullable | Validated `/^[6-9]\d{9}$/` |
| `hostel` | `VARCHAR(100)` | Nullable | Campus residence |
| `club_name` | `VARCHAR(100)` | Nullable | Organizing body for coordinators |
| `avatar_url` | `TEXT` | Nullable | Supports uploaded Base64 image or DiceBear URL |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Audit creation timestamp |

### 3.2 `venues` Table
| Column | SQL Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Runtime uses `'v1'`..`'v6'` |
| `name` | `VARCHAR(150)` | `NOT NULL` | e.g., `SAC Main Auditorium` |
| `short_code` | `VARCHAR(50)` | `UNIQUE NOT NULL` | e.g., `SAC-AUD`, `OAT-CAMPUS` |
| `capacity` | `INT` | `NOT NULL` | Max seating/occupancy |
| `location` | `VARCHAR(255)` | `NOT NULL` | Campus block/area |
| `facilities` | `TEXT` | Nullable | Acoustic, projector, LAN facilities |
| `image_url` | `TEXT` | Nullable | Venue photo URL |

### 3.3 `events` Table
| Column | SQL Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Runtime uses `EVT-2026-001` / `EVT-<ts>` |
| `title` | `VARCHAR(200)` | `NOT NULL` | Mandatory on create |
| `tagline` | `VARCHAR(300)` | Nullable | Short subtitle |
| `category` | `VARCHAR(50)` | `NOT NULL` | `Technical`, `Cultural`, `Sports`, `Workshops`, `Hackathons` |
| `department` | `VARCHAR(100)` | Nullable | Owning branch or `All Branches` |
| `club_name` | `VARCHAR(100)` | Nullable | Hosting student club |
| `venue_id` | `UUID` | `REFERENCES venues(id)` | Foreign key to `venues` |
| `start_date`, `end_date`, `registration_deadline` | `TIMESTAMP` | `start_date`, `end_date` `NOT NULL` | ISO date-time strings |
| `capacity` | `INT` | `NOT NULL DEFAULT 100` | Enforced in `POST /api/registrations` |
| `registered_count` | `INT` | `DEFAULT 0` | Atomically incremented on registration |
| `team_type` | `VARCHAR(50)` | `DEFAULT 'Individual'` | Format string |
| `entry_fee`, `prize_pool` | `VARCHAR(50)` / `VARCHAR(100)` | Defaults `'Free'`, `'Certificates'` | Fee parsed numerically when paid |
| `description` | `TEXT` | Nullable | Overview text |
| `rules`, `schedule` | `JSONB` | Default `'[]'` | Stored as arrays in JSON |
| `status` | `VARCHAR(20)` | `CHECK (status IN ('approved','pending','rejected'))` | Default `'approved'` in runtime |
| `coordinator_id` | `UUID` | `REFERENCES users(id)` | Coordinator foreign key (SQL) |
| `coordinator_name`, `coordinator_phone`, `coordinator_email`, `faculty_advisor` | `VARCHAR` | Nullable | Dynamic event-level coordinator metadata |

### 3.4 `registrations` Table
| Column | SQL Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Runtime uses `REG-<ts>` |
| `event_id` | `UUID` | `REFERENCES events(id) ON DELETE CASCADE` | Foreign key to `events` |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` | Foreign key to `users` (runtime uses `GUEST-...` if unauthenticated) |
| `student_name`, `student_id` | `VARCHAR` | `NOT NULL` | Enforced `[ROSN]\d{6}` |
| `email`, `department`, `year`, `phone` | `VARCHAR` | Nullable / validated | Contact & academic metadata |
| `team_name`, `team_members` | `VARCHAR` / `TEXT` | Nullable | Defaults `'Individual'` |
| `ticket_code` | `VARCHAR(50)` | `UNIQUE NOT NULL` | Format `RKV-<EVT>-<LAST4>-<RAND4>` |
| `check_in_status` | `VARCHAR(20)` | `CHECK IN ('registered','checked_in')` | Updated by gate verification |
| `checked_in_at` | `TIMESTAMP` | Nullable | Timestamp of valid gate scan |
| `registered_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Registration timestamp |
| *(Runtime extras)* | — | — | `payment_status`, `payment_amount`, `payment_mode`, `transaction_id` stored in `registrations.json` (not yet columns in `schema.sql`) |

**Uniqueness Constraint (`schema.sql`):** `UNIQUE(event_id, student_id)` — actively enforced in runtime via `db.createRegistration()`.

### 3.5 `announcements` Table
| Column | SQL Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Runtime uses `ANN-<ts>` |
| `title` | `VARCHAR(200)` | `NOT NULL` | Circular heading |
| `content` | `TEXT` | `NOT NULL` | Circular body |
| `priority` | `VARCHAR(20)` | `CHECK IN ('urgent','info')` | Default `'info'` |
| `issued_by` | `VARCHAR(100)` | `DEFAULT 'Dean Student Affairs'` | Author name |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Order descending newest-first |

### 3.6 `event_feedback` Table *(Designed in `schema.sql`, Not Wired to Runtime)*
Columns: `id (PK)`, `event_id (FK -> events.id)`, `user_id (FK -> users.id)`, `rating (INT CHECK 1..5)`, `comment (TEXT)`, `sentiment_label (VARCHAR(20))`, `created_at (TIMESTAMP)`. Prepared for future integration with Python `POST /api/ai/analyze-feedback`.

---

## 4. Relationships & Cardinalities

- `venues (1) ────< (N) events` (`events.venue_id` → `venues.id`): Each campus venue hosts zero or more events; each event takes place at one primary venue.
- `users (1) ────< (N) events` (`events.coordinator_id` → `users.id` in `schema.sql`): A coordinator/faculty user can coordinate multiple events.
- `events (1) ────< (N) registrations` (`registrations.event_id` → `events.id`): Each event receives many registrations, with cascading delete in SQL.
- `users (1) ────< (N) registrations` (`registrations.user_id` → `users.id`): A registered student user may register for multiple events (`(event_id, student_id)` composite unique prevents duplicate registration per event).
- `events (1) ────< (N) event_feedback` & `users (1) ────< (N) event_feedback` *(SQL schema only)*.

---

## 5. Normalization Analysis

- **First Normal Form (1NF):** Atomic scalar values are used across `users`, `venues`, `registrations`, and `announcements`. In `events`, `rules` and `schedule` use structured `JSONB` arrays in SQL (or arrays in JSON); in strict classical 1NF they could be decomposed into child `event_rules` / `event_schedule` tables if individual schedule items needed SQL joins.
- **Second Normal Form (2NF):** Every table has a single-column surrogate primary key (`id`). There are no partial dependencies on composite keys.
- **Third Normal Form (3NF):** Non-key attributes depend strictly on the primary key in SQL (`venues` separated from `events`). **Practical Denormalizations in Runtime JSON:**
  1. `events` caches `venue_name` alongside `venue_id` to minimize read joins during card rendering.
  2. `registrations` snapshots `student_name`, `email`, `department`, `year`, and `phone` at registration time alongside `user_id`, preserving historical pass accuracy even if the user later changes profile details or registers as a guest.

---

## 6. Sample Fictional Records

### `users.json` (Redacted Credential Representation)
| id | email | rgukt_id | full_name | role | department | password |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `USR-STU-101` | `ananya.e3@rguktrkv.ac.in` | `R210142` | `K. Ananya` | `student` | `Computer Science & Engineering` | `[CONFIGURED_CREDENTIAL]` |
| `USR-COO-102` | `lead.ece@rguktrkv.ac.in` | `O210319` | `T. Charan` | `coordinator` | `Electronics & Comm Engineering` | `[CONFIGURED_CREDENTIAL]` |

### `registrations.json` (Fictional Registration Sample)
| id | event_id | student_id | ticket_code | payment_status | payment_amount | transaction_id | check_in_status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `REG-173131001` | `EVT-2026-004` | `R210142` | `RKV-004-0142-4812` | `paid` | `200` | `431209876543` | `checked_in` |
