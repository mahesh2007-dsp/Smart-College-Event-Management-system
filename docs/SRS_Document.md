# Software Requirements Specification (SRS)
## Smart College Event Management System (Smart CEMS)
### Rajiv Gandhi University of Knowledge Technologies (RGUKT) - IIIT RK Valley
**Course:** Software Engineering Laboratory (CSE - E3 S1)  
**Standard:** IEEE Std 830-1998  
**Architecture:** React Frontend + Node.js REST API + SQL / Supabase + Python AI Microservice  

---

## 1. Introduction

### 1.1 Purpose
This document provides the definitive Software Requirements Specification for the **Smart College Event Management System (Smart CEMS)** custom-engineered for **RGUKT IIIT RK Valley, Idupulapaya, Andhra Pradesh**. The platform modernizes university event operations by coordinating event discovery, multi-role registrations, digital QR passes, canvas certificate issuance, venue collision avoidance, and artificial intelligence-based recommendation.

### 1.2 Scope
- **Student Portal:** Discovery, filtering, multi-interest keyword search, 1-click registration, printable QR pass, and automated verified participation certificates.
- **Organizer Hub:** Event creation with designated per-event coordinators, real-time capacity fill tracking, attendee roster export to CSV, and gate ticket QR scanning with duplicate-entry prevention.
- **Dean / Faculty Admin:** University-wide analytics, campus venue collision detection (SAC, OAT, Labs), announcement broadcasting, and approvals.
- **Python AI Microservice:** Content-based event recommendation using natural language domain affinity, and cryptographic SHA-256 certificate authenticity verification.

### 1.3 Technology Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, QRCode, Canvas Confetti.
- **Backend:** Node.js, Express.js.
- **Database:** ANSI SQL relational schema, SQLite3 / PostgreSQL, Supabase client integration.
- **AI Microservice:** Python 3 HTTP / REST service with NLP keyword affinity and cryptographic verification digest.

---

## 2. Functional Requirements

### Module 1: Dynamic User Authentication (FR-AUTH)
- **FR-AUTH-01:** System shall authenticate users using RGUKT ID (`R21xxxx`) or university email and password.
- **FR-AUTH-02:** System shall allow users to register with distinct dynamic roles: Student, Coordinator, or Dean Admin without hardcoded credentials.

### Module 2: Event Lifecycle & Dynamic Coordination (FR-EVT)
- **FR-EVT-01:** System shall record and display campus events across categories: Technical, Cultural, Sports, Workshops, Hackathons.
- **FR-EVT-02:** When hosting an event, the organizing team shall dynamically specify the Coordinator Name, Phone, Email, and Faculty Advisor specifically for that event.

### Module 3: Digital E-Ticket & Gate Check-in (FR-TKT)
- **FR-TKT-01:** System shall dynamically generate a unique Ticket Code (`RKV-EVTx-xxxx`) and render a high-density 2D QR Code.
- **FR-TKT-02:** Ticket check-in shall verify validity and flag any ticket already checked in to prevent duplicate gate entry.

### Module 4: Python AI Recommender & Integrity Service (FR-AI)
- **FR-AI-01:** The Python microservice shall calculate semantic match scores between student department/interests and event scopes.
- **FR-AI-02:** The system shall cryptographically generate and verify SHA-256 hashes for all participation certificates.

### Module 5: Campus Venue Collision Guard (FR-GOV)
- **FR-GOV-01:** System shall detect and alert administrators if two events request the same university venue during overlapping time intervals.
