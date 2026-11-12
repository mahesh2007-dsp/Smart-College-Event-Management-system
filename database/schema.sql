-- ======================================================================
-- SMART COLLEGE EVENT MANAGEMENT SYSTEM (SMART CEMS) - DATABASE SCHEMA
-- Focus: RGUKT IIIT RK Valley, Andhra Pradesh
-- Standard: ANSI SQL / PostgreSQL / SQLite 3 Compatible
-- ======================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'coordinator', 'admin')),
    rgukt_id VARCHAR(50),
    department VARCHAR(100),
    year VARCHAR(20),
    phone VARCHAR(30),
    hostel VARCHAR(50),
    club_name VARCHAR(150),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. VENUES TABLE
CREATE TABLE IF NOT EXISTS venues (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    facilities TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    tagline TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Technical', 'Cultural', 'Sports', 'Workshops', 'Hackathons')),
    department VARCHAR(100) NOT NULL,
    club_name VARCHAR(150),
    venue_id VARCHAR(50) REFERENCES venues(id) ON DELETE SET NULL,
    venue_name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    registration_deadline TIMESTAMP NOT NULL,
    capacity INT NOT NULL DEFAULT 100,
    registered_count INT DEFAULT 0,
    team_type VARCHAR(50) DEFAULT 'Individual',
    entry_fee VARCHAR(50) DEFAULT 'Free',
    prize_pool VARCHAR(100),
    description TEXT,
    rules TEXT,
    schedule TEXT,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected', 'completed')),
    coordinator_name VARCHAR(255) NOT NULL,
    coordinator_phone VARCHAR(50),
    coordinator_email VARCHAR(255),
    faculty_advisor VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. REGISTRATIONS & TICKETS TABLE (Includes Student & Payment Tracking)
CREATE TABLE IF NOT EXISTS registrations (
    id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    student_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    year VARCHAR(20),
    phone VARCHAR(50),
    team_name VARCHAR(100),
    team_members TEXT,
    ticket_code VARCHAR(100) UNIQUE NOT NULL,
    check_in_status VARCHAR(20) DEFAULT 'not_checked_in' CHECK (check_in_status IN ('not_checked_in', 'checked_in')),
    checked_in_at TIMESTAMP,
    -- Financial & Payment Audit Fields
    payment_status VARCHAR(30) DEFAULT 'free' CHECK (payment_status IN ('free', 'paid', 'pending', 'waived')),
    payment_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_mode VARCHAR(50) DEFAULT 'Free (Institute Sponsored)',
    transaction_id VARCHAR(100) DEFAULT 'N/A',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'info' CHECK (priority IN ('info', 'urgent')),
    issued_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. EVENT FEEDBACK & SENTIMENT TABLE (For Python NLP Analytics)
CREATE TABLE IF NOT EXISTS event_feedback (
    id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    sentiment_score FLOAT,
    sentiment_label VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR HIGH-PERFORMANCE SEARCH
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_dept ON events(department);
CREATE INDEX IF NOT EXISTS idx_registrations_ticket ON registrations(ticket_code);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
