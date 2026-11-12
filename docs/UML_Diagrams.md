# Software Engineering UML Diagrams
## Smart College Event Management System (Smart CEMS)

### 1. Use Case Diagram
```mermaid
flowchart LR
  Student((Student))
  Coordinator((Event Coordinator))
  Admin((Dean / Admin))

  subgraph System_Boundary["Smart College Event Management System"]
    UC1(["Browse & Search Events"])
    UC2(["Register with Student ID"])
    UC3(["Download QR E-Ticket"])
    UC4(["Generate Canvas Certificate"])
    UC5(["Get AI Event Recommendations"])
    UC6(["Host New Event with Coordinators"])
    UC7(["Export Attendee Roster to CSV"])
    UC8(["Scan & Verify Gate Pass QR"])
    UC9(["Venue Collision Detector"])
    UC10(["Broadcast Campus Notice"])
  end

  Student --> UC1
  Student --> UC2
  Student --> UC3
  Student --> UC4
  Student --> UC5

  Coordinator --> UC1
  Coordinator --> UC6
  Coordinator --> UC7
  Coordinator --> UC8

  Admin --> UC9
  Admin --> UC10
  Admin --> UC7
```

### 2. Entity-Relationship (ER) Diagram
```mermaid
erDiagram
  USERS {
    string id PK
    string email
    string password_hash
    string full_name
    string role
    string rgukt_id
    string department
    string phone
  }

  VENUES {
    string id PK
    string name
    string short_code
    int capacity
    string location
  }

  EVENTS {
    string id PK
    string title
    string category
    string department
    string venue_id FK
    datetime start_date
    datetime end_date
    int capacity
    int registered_count
    string coordinator_name
    string coordinator_phone
    string coordinator_email
  }

  REGISTRATIONS {
    string id PK
    string event_id FK
    string user_id FK
    string student_name
    string student_id
    string ticket_code UK
    string check_in_status
    datetime registered_at
  }

  ANNOUNCEMENTS {
    string id PK
    string title
    string content
    string priority
    string issued_by
  }

  VENUES ||--o{ EVENTS : hosts
  USERS ||--o{ REGISTRATIONS : registers
  EVENTS ||--o{ REGISTRATIONS : receives
```

### 3. Sequence Diagram: Event Gate Check-in
```mermaid
sequenceDiagram
  autonumber
  actor GateStaff as Coordinator / Gate Incharge
  participant Scanner as React Scanner UI
  participant API as Node.js API (:5000)
  participant DB as SQL Database

  GateStaff ->> Scanner: Enters or Scans Ticket Code
  Scanner ->> API: POST /api/registrations/verify {ticketCode}
  API ->> DB: Query registrations WHERE ticket_code = code
  alt Ticket Not Found
    API -->> Scanner: {valid: false, message: "Invalid Ticket"}
    Scanner -->> GateStaff: RED: Invalid Ticket Pass
  else Ticket Already Checked In
    API -->> Scanner: {valid: false, alreadyCheckedIn: true}
    Scanner -->> GateStaff: AMBER: Already Checked In Earlier
  else Ticket Valid First Time
    API ->> DB: UPDATE registrations SET check_in_status = 'checked_in'
    API -->> Scanner: {valid: true, student_name: "Student Name"}
    Scanner -->> GateStaff: GREEN: Entry Granted!
  end
```
