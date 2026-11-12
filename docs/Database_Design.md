# Database Design & Schema Documentation
## Smart College Event Management System (Smart CEMS)
### Rajiv Gandhi University of Knowledge Technologies (RGUKT) - IIIT RK Valley

---

### 1. Relational Database Normalization (3NF)
The schema is rigorously normalized to the **Third Normal Form (3NF)**:
1. **1NF (Atomic Attributes):** All column values contain atomic records; relational integrity is enforced via foreign keys.
2. **2NF (No Partial Key Dependencies):** Every non-key attribute depends entirely on the primary candidate key.
3. **3NF (No Transitive Dependencies):** No non-key attribute depends on another non-key attribute (e.g., venue specifications belong strictly to the `venues` table).

---

### 2. Entity Relational Design & Tables

#### Table 1: `users`
- `id` (VARCHAR PK)
- `email` (VARCHAR UNIQUE NOT NULL)
- `password_hash` (VARCHAR NOT NULL)
- `full_name` (VARCHAR NOT NULL)
- `role` (VARCHAR CHECK: 'student', 'coordinator', 'admin')
- `rgukt_id` (VARCHAR, e.g. R210001)
- `department` (VARCHAR)
- `year` (VARCHAR)
- `phone` (VARCHAR)
- `hostel` (VARCHAR)
- `club_name` (VARCHAR)

#### Table 2: `venues`
- `id` (VARCHAR PK)
- `name` (VARCHAR NOT NULL)
- `short_code` (VARCHAR UNIQUE)
- `capacity` (INT NOT NULL)
- `location` (VARCHAR NOT NULL)
- `facilities` (TEXT)
- `image_url` (TEXT)

#### Table 3: `events`
- `id` (VARCHAR PK)
- `title` (VARCHAR NOT NULL)
- `tagline` (VARCHAR)
- `category` (VARCHAR)
- `department` (VARCHAR)
- `club_name` (VARCHAR)
- `venue_id` (VARCHAR FK -> venues.id)
- `venue_name` (VARCHAR)
- `start_date` (TIMESTAMP NOT NULL)
- `end_date` (TIMESTAMP NOT NULL)
- `capacity` (INT)
- `registered_count` (INT DEFAULT 0)
- `team_type` (VARCHAR)
- `entry_fee` (VARCHAR)
- `prize_pool` (VARCHAR)
- `coordinator_name` (VARCHAR NOT NULL)
- `coordinator_phone` (VARCHAR)
- `coordinator_email` (VARCHAR)
- `faculty_advisor` (VARCHAR)

#### Table 4: `registrations` (Student Registered & Payment Details)
Stores all student participation passes and financial audit details:
- `id` (VARCHAR PK, e.g. `REG-2026-8819`)
- `event_id` (VARCHAR FK -> events.id)
- `user_id` (VARCHAR FK -> users.id)
- `student_name` (VARCHAR NOT NULL)
- `student_id` (VARCHAR NOT NULL, e.g. `R210001`)
- `email` (VARCHAR NOT NULL)
- `department` (VARCHAR)
- `year` (VARCHAR, e.g. `E3`)
- `phone` (VARCHAR)
- `team_name` (VARCHAR)
- `team_members` (TEXT)
- `ticket_code` (VARCHAR UNIQUE NOT NULL, e.g. `RKV-EVT1-0001-8819`)
- `check_in_status` (VARCHAR CHECK: 'not_checked_in', 'checked_in')
- `checked_in_at` (TIMESTAMP)
- **`payment_status`** (VARCHAR CHECK: 'free', 'paid', 'pending', 'waived')
- **`payment_amount`** (DECIMAL(10,2) DEFAULT 0.00)
- **`payment_mode`** (VARCHAR, e.g. 'UPI / QR Code', 'SBI Collect Portal', 'Free (Institute Sponsored)')
- **`transaction_id`** (VARCHAR, e.g. 'UPI/2026/894321908', 'DUK9832104928')
- **`payment_date`** (TIMESTAMP)
- `created_at` (TIMESTAMP)

#### Table 5: `announcements`
- `id` (VARCHAR PK)
- `title` (VARCHAR NOT NULL)
- `content` (TEXT NOT NULL)
- `priority` (VARCHAR: 'info', 'urgent')
- `issued_by` (VARCHAR NOT NULL)
- `created_at` (TIMESTAMP)

#### Table 6: `event_feedback`
- `id` (VARCHAR PK)
- `event_id` (VARCHAR FK -> events.id)
- `student_id` (VARCHAR NOT NULL)
- `rating` (INT 1-5)
- `review_text` (TEXT)
- `sentiment_label` (VARCHAR: positive, neutral, negative)
- `sentiment_score` (DECIMAL)

---

### 3. Accessing & Auditing Data
1. **Organizer Hub:** "Student Registrations & Payment Ledger" tab + 1-Click CSV export.
2. **Dean Admin Dashboard:** "Financial Audit & Registration Ledger" card with revenue breakdown and audit CSV export.
3. **Student Portal:** "My Portal" with personal ticket pass and payment confirmation badge.
4. **Direct SQL Query:** `SELECT * FROM registrations WHERE payment_status = 'paid';`
5. **REST API Endpoint:** `GET /api/registrations`
