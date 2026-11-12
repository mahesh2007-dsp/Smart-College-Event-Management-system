# Software Testing Documentation
## Test Cases for Smart College Event Management System (Smart CEMS)

| Test ID | Module | Test Scenario | Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-01** | React UI | Component Rendering | Access `http://localhost:3000` | Clean navbar, hero, event cards and footer render without error | Rendered successfully with official RGUKT emblem | **PASS** |
| **TC-02** | Auth | Dynamic Role Registration | Role: `Coordinator`, Name: `S. Rajesh` | Account created as coordinator, access granted to Organizer Hub | Account registered, redirected to Organizer Hub | **PASS** |
| **TC-03** | Events | Dynamic Coordinator per Event | Enter Coordinator: `K. Harika (ECE)` | Event created with Harika as coordinator, displayed on card | Stored and displayed accurately | **PASS** |
| **TC-04** | Tickets | QR Pass Generation | Register for Abhiyaan 2026 | Unique ticket code `RKV-EVT1-...` and scannable 2D QR generated | Dynamic QR rendered, print preview ready | **PASS** |
| **TC-05** | Security | Duplicate Check-in Prevention | Verify same ticket twice | First scan: Entry Granted. Second scan: Warning ALREADY CHECKED IN | Re-entry blocked with previous timestamp | **PASS** |
| **TC-06** | Python AI | AI Event Matching | Dept: `CSE`, Skills: `coding, ai` | Python AI service returns semantic match score (>80%) | Ranked recommendations returned from port 5001 | **PASS** |
| **TC-07** | Admin | Venue Collision Detection | Compare schedules across venues | Flags collisions if time slots overlap at same venue | Collision detected or Zero Conflicts shown | **PASS** |
