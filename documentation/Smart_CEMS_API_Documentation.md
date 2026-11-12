# Smart CEMS – REST & AI Microservice API Documentation

This reference documents every endpoint implemented in `backend/server.js` (Node.js/Express on port `5000`) and `python-service/app.py` (Python `http.server` on port `5001`).

> **Authentication Header Note:** Authenticated requests include `Authorization: Bearer <token>`, where `<token>` is currently the user ID string returned on login/register (`e.g. USR-STU-01`). Only `GET /api/auth/me` enforces HTTP `401` on missing/invalid tokens; other protected-by-role actions currently rely on UI gating (documented security enhancement item).

---

## 1. Node.js Express Backend API (`http://localhost:5000`)

### 1.1 Authentication & User Profile

| Method | Endpoint | Summary | Request Body | Responses |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user by RGUKT ID or Email | `{ "identifier": "R210001", "password": "<password>" }` | `200`: `{ success, token, user }`<br>`400`: Missing fields<br>`401`: Invalid credentials |
| `POST` | `/api/auth/register` | Create new student/coordinator/admin account | `{ full_name, email, rgukt_id, department, year, phone, hostel, password, role, club_name, avatar_url }` | `200`: `{ success, token, user }`<br>`400`: Validation error / duplicate email or ID |
| `GET` | `/api/auth/me` | Fetch active user from Bearer token | Header `Authorization: Bearer <token>` | `200`: `{ user }`<br>`401`: `{ error: "Not authenticated" }` |
| `PATCH` | `/api/users/:id/profile` | Update user profile details or base64 avatar | Partial fields `{ full_name, avatar_url, phone, hostel, club_name, department, year }` | `200`: `{ success, user }`<br>`404`: User not found |

**Validation Rules (`POST /api/auth/register`):**
- `full_name`: trimmed length `>= 2`.
- `email`: `/^\S+@\S+\.\S+$/`, unique case-insensitive.
- `password`: trimmed length `>= 4`.
- `rgukt_id`: trimmed uppercase; non-admin roles must match `/^[ROSN]\d{6}$/`, unique.
- `phone`: if supplied after stripping spaces/hyphens, must match `/^[6-9]\d{9}$/`.

---

### 1.2 Events & Venues Management

| Method | Endpoint | Summary | Query / Body | Responses |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | List events with optional filtering | Query: `?category=...&department=...&search=...&venueId=...` | `200`: Array of event objects |
| `GET` | `/api/events/:id` | Fetch single event details | URL param `:id` | `200`: Event object<br>`404`: `{ error: "Event not found" }` |
| `POST` | `/api/events` | Create new campus event | `{ title*, category*, venue_id*, start_date*, tagline, department, club_name, end_date, registration_deadline, capacity, team_type, entry_fee, prize_pool, description, rules, schedule, image_url, coordinator_name, coordinator_phone, coordinator_email, faculty_advisor }` | `201`: Created event object<br>`400`: Missing mandatory fields |
| `PATCH` | `/api/events/:id/status` | Update event approval status | `{ "status": "approved" \| "pending" \| "rejected" }` | `200`: Updated event object<br>`404`: Event not found |
| `DELETE` | `/api/events/:id` | Delete an event by ID | URL param `:id` | `200`: `{ "success": true \| false }` |
| `GET` | `/api/venues` | List all university venues | None | `200`: Array of venue objects |

---

### 1.3 Event Registrations & Gate Ticket Verification

| Method | Endpoint | Summary | Query / Body | Responses |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/registrations` | Query registrations ledger | Query: `?userId=...&eventId=...` (optional; returns all if omitted) | `200`: Array of registration objects |
| `POST` | `/api/registrations` | Register student & generate ticket code | `{ event_id*, student_name*, student_id*, email, department, year, phone, team_name, team_members, payment_status, payment_amount, payment_mode, transaction_id }` | `201`: Created registration (`ticket_code`, `check_in_status: "registered"`)<br>`400`: Invalid ID / duplicate registration / capacity full / invalid UTR<br>`404`: Event not found |
| `POST` | `/api/registrations/verify` | Verify gate ticket & check-in attendee | `{ "ticketCode": "RKV-..." }` | `200`: `{ valid, alreadyCheckedIn?, message, registration?, event? }`<br>`400`: `{ error: "Ticket code required" }` |

**Registration & UTR Payment Rules (`POST /api/registrations`):**
- `student_id` must match `/^[ROSN]\d{6}$/`.
- Rejects when `evt.registered_count >= evt.capacity` or duplicate `(event_id, student_id)` exists (`db.createRegistration`).
- When event fee is not free (`entry_fee !== 'Free'` and does not contain `₹0`) and `payment_mode !== 'Cash at SAC Desk'`, `transaction_id` stripped of spaces/hyphens must have length `>= 8` on the server (frontend further enforces 12 digits `/^\d{12}$/` or 10–24 char alphanumeric ref `/^[A-Za-z0-9/]{10,24}$/`).

---

### 1.4 Announcements & Analytics

| Method | Endpoint | Summary | Body / Query | Responses |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/announcements` | List campus circulars & notices | None | `200`: Array of announcements |
| `POST` | `/api/announcements` | Publish official notice | `{ "title": "...", "content": "...", "priority": "info" \| "urgent" }` | `201`: Created announcement object<br>`400`: Missing title/content |
| `GET` | `/api/analytics` | Compute aggregated event & student metrics | None | `200`: `{ totalEvents, totalRegistrations, totalStudents, venuesCount, categoryCounts, deptCounts }` |

---

### 1.5 AI Proxy Routes (Node.js → Python `:5001` with JS Fallback)

| Method | Endpoint | Summary | Request Body | Response Fields |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/recommend` | Fetch branch & skill ranked event recommendations | `{ "department": "...", "interests": ["coding", "ai"] }` (Express injects `events`) | `{ success, studentDepartment, detectedBranch, recommendedEvents: [...] }` (`fallback: true` if Python offline) |
| `POST` | `/api/ai/verify-certificate` | Compute/verify salted SHA-256 certificate digest | `{ studentId, eventId, ticketCode, certificateHash? }` | `{ valid, studentId, eventId, generatedHash, fullVerificationDigest, issuer, message }` (`fallback: true` if Python offline) |

### 1.6 Error & Fallback Routing
- `app.all('/api/*', ...)`: Any unmatched `/api/*` request returns `HTTP 404` `{ "error": "API route not found: <METHOD> <URL>" }`.
- Unmatched non-API `GET` routes serve `frontend/dist/index.html` when built.

---

## 2. Python AI & Verification Microservice (`http://localhost:5001`)

Implemented using Python 3 standard library `http.server` in `python-service/app.py`.

| Method | Endpoint | Summary | Input Payload | Response Payload |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/ai/health` (or `/`) | Service health & endpoint discovery | None | `{ service, institution, status: "healthy", version: "1.0.0", endpoints }` |
| `POST` | `/api/ai/recommend` | Content-based scoring engine | `{ department, interests: [...], events: [...] }` | `{ success: true, studentDepartment, detectedBranch, recommendedEvents }` (top 10 sorted desc by `matchScore`) |
| `POST` | `/api/ai/verify-certificate` | Cryptographic digest generator & verifier | `{ studentId, eventId, ticketCode, certificateHash? }` | `{ valid, studentId, eventId, generatedHash: "RKV-CERT-...", fullVerificationDigest, issuer, message }` |
| `POST` | `/api/ai/analyze-feedback` | Rule-based NLP feedback polarity scorer *(backend ready, no frontend UI)* | `{ "reviews": ["text 1", "text 2"] }` | `{ totalReviews, averageScore, overallSentiment, details: [{ review, sentimentScore, label }] }` |

### Example Recommendation Request & Response
```json
// POST /api/ai/recommend (via Node :5000)
{
  "department": "Electronics & Comm Engineering",
  "interests": ["robotics", "iot"]
}
```
```json
// Response (HTTP 200)
{
  "success": true,
  "studentDepartment": "Electronics & Comm Engineering",
  "detectedBranch": "ECE",
  "recommendedEvents": [
    {
      "eventId": "EVT-2026-004",
      "title": "Robowars & IoT Innovation Expo",
      "category": "Technical",
      "department": "Electronics & Comm Engineering",
      "matchScore": 94,
      "reasons": [
        "Aligned with Electronics And Comm Engineering focus areas",
        "2 domain factor(s) matched"
      ]
    }
  ]
}
```
