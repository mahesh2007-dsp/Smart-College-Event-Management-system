// Unified Persistence Layer for Smart CEMS
// Supports PostgreSQL (via DATABASE_URL / PGHOST) and hardened Atomic JSON fallback.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashPassword } = require('./security');
const { createPostgresAdapter } = require('./dbPostgres');

const DATA_DIR = path.join(__dirname, 'data');

function getSeedData() {
  return {
    venues: [
      { id: 'v1', name: 'SAC Main Auditorium', short_code: 'SAC-AUD', capacity: 1200, location: 'Student Activity Center, Ground Floor', facilities: 'Dolby Acoustic System, Dual 4K Projectors, AC, Stage Green Rooms', image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' },
      { id: 'v2', name: 'Open Air Theatre (OAT)', short_code: 'OAT-CAMPUS', capacity: 4500, location: 'Central Campus Quadrangle', facilities: 'Grand Outdoor Stage, Concert Lighting Array, Stepped Amphitheatre Seating', image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800' },
      { id: 'v3', name: 'SAC Computer Labs (Lab 1 & 2)', short_code: 'SAC-LAB', capacity: 250, location: 'Student Activity Center, 1st Floor', facilities: '1Gbps LAN, Dual Monitors, High Specs Workstations, Central UPS', image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800' },
      { id: 'v4', name: 'CSE Department Seminar Hall', short_code: 'CSE-SEM', capacity: 180, location: 'Academic Block-II, 2nd Floor', facilities: 'Smart Podium, High-Definition Video Rig, Surround Conference Mic', image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800' },
      { id: 'v5', name: 'Indoor Sports Complex', short_code: 'INDOOR-SPT', capacity: 600, location: 'South Campus Sports Arena', facilities: '4 Wooden Badminton Courts, Table Tennis Tables, Viewing Galleries', image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800' },
      { id: 'v6', name: 'Main University Sports Ground', short_code: 'MAIN-GRND', capacity: 5000, location: 'Near Main Gate Entrance', facilities: 'Turf Cricket Pitch, High-mast Floodlights, Athletic Tracks', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' }
    ],
    users: [
      { id: 'USR-ADM-01', email: 'admin@rguktrkv.ac.in', password: hashPassword('admin'), full_name: 'Dr. Faculty Admin', role: 'admin', rgukt_id: 'FACULTY-01', department: 'Dean Student Affairs', year: 'Faculty', phone: '+91 94401 00001', hostel: 'Faculty Quarters', club_name: 'Administration', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin' },
      { id: 'USR-COO-01', email: 'coordinator@rguktrkv.ac.in', password: hashPassword('coordinator'), full_name: 'Campus Event Coordinator', role: 'coordinator', rgukt_id: 'COORD-01', department: 'Computer Science & Engineering', year: 'E4', phone: '+91 98480 00001', hostel: 'BH-1', club_name: 'Coding & Innovation Club', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Coordinator' },
      { id: 'USR-STU-01', email: 'student@rguktrkv.ac.in', password: hashPassword('student'), full_name: 'Campus Student', role: 'student', rgukt_id: 'R210001', department: 'Computer Science & Engineering', year: 'E3', phone: '+91 81234 00001', hostel: 'BH-2, Room 314', club_name: null, avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student' }
    ],
    events: [
      {
        id: 'EVT-2026-001',
        title: 'Abhiyaan 2026: 24-Hour National Hackathon',
        tagline: 'Build the Next Generation of AI & Web Innovations',
        category: 'Technical',
        department: 'Computer Science & Engineering',
        club_name: 'Coding & Innovation Club',
        venue_id: 'v1',
        venue_name: 'SAC Main Auditorium & Labs',
        start_date: '2026-11-18T09:00:00',
        end_date: '2026-11-19T10:00:00',
        registration_deadline: '2026-11-16T23:59:00',
        capacity: 300,
        registered_count: 184,
        team_type: 'Team (2-4 Members)',
        entry_fee: 'Free',
        prize_pool: '₹50,000 Cash + Cloud Credits',
        description: 'The flagship hackathon of RGUKT IIIT RK Valley. Build web, mobile and AI applications solving regional agricultural, educational, and healthcare problems.',
        rules: ['Valid RGUKT ID mandatory', 'Build during 24h hackathon period', 'Open-source code submission on GitHub'],
        schedule: [{ time: 'Day 1 - 09:00 AM', activity: 'Opening Keynote' }, { time: 'Day 1 - 10:00 AM', activity: 'Problem Statements Released' }, { time: 'Day 2 - 09:00 AM', activity: 'Final Project Demos' }],
        image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        status: 'approved',
        coordinator_name: 'B. Tejaswi (CSE E4)',
        coordinator_phone: '+91 98480 12345',
        coordinator_email: 'tejaswi.coord@rguktrkv.ac.in',
        faculty_advisor: 'Dr. Suresh Kumar (HOD CSE)'
      },
      {
        id: 'EVT-2026-002',
        title: 'Sanskriti 2026: Cultural Fiesta & Battle of Bands',
        tagline: 'Rhythm, Drama & Soulful Harmonies under the Stars',
        category: 'Cultural',
        department: 'All Branches',
        club_name: 'Cultural Arts Society',
        venue_id: 'v2',
        venue_name: 'Open Air Theatre (OAT)',
        start_date: '2026-11-21T17:30:00',
        end_date: '2026-11-21T23:00:00',
        registration_deadline: '2026-11-19T18:00:00',
        capacity: 4000,
        registered_count: 1420,
        team_type: 'Solo & Group',
        entry_fee: 'Free',
        prize_pool: 'Trophies + ₹25,000',
        description: 'Experience electrifying musical concerts, Indian folk & western dance showdowns, and theatrical drama in the Open Air Theatre.',
        rules: ['Audio tracks submitted 24h prior', 'Group dance limit 6 mins', 'Band limit 15 mins'],
        schedule: [{ time: '05:30 PM', activity: 'Invocation & Classical Series' }, { time: '07:30 PM', activity: 'Battle of the Bands' }, { time: '10:00 PM', activity: 'Star Night' }],
        image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
        status: 'approved',
        coordinator_name: 'M. Sai Krishna (ECE E4)',
        coordinator_phone: '+91 97000 54321',
        coordinator_email: 'cultural.lead@rguktrkv.ac.in',
        faculty_advisor: 'Dr. Padmaja (Faculty Incharge)'
      },
      {
        id: 'EVT-2026-003',
        title: 'RGUKT Premier League (RPL) 2026',
        tagline: 'Inter-Departmental T20 Cricket Tournament',
        category: 'Sports',
        department: 'Physical Education Dept',
        club_name: 'Sports Council',
        venue_id: 'v6',
        venue_name: 'Main University Sports Ground',
        start_date: '2026-11-25T08:00:00',
        end_date: '2026-11-28T18:00:00',
        registration_deadline: '2026-11-22T20:00:00',
        capacity: 3000,
        registered_count: 420,
        team_type: 'Department Team',
        entry_fee: 'Free',
        prize_pool: 'RPL Trophy + Gold Medals',
        description: '8 engineering departments compete in 10-over league matches under floodlights.',
        rules: ['Department official team only', 'Uniform jerseys required', 'ICC T20 rules applied'],
        schedule: [{ time: 'Day 1 - 08:00 AM', activity: 'CSE vs ECE' }, { time: 'Day 2 - 02:00 PM', activity: 'Quarter Finals' }, { time: 'Day 4 - 05:00 PM', activity: 'Grand Finale' }],
        image_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
        status: 'approved',
        coordinator_name: 'P. Divya Reddy (Mech E4)',
        coordinator_phone: '+91 99887 76655',
        coordinator_email: 'sports.sec@rguktrkv.ac.in',
        faculty_advisor: 'Mr. Ramesh (Physical Director)'
      },
      {
        id: 'EVT-2026-004',
        title: 'Cybersurge: Capture The Flag (CTF) Arena',
        tagline: 'Reverse Engineering & Ethical Hacking Challenge',
        category: 'Technical',
        department: 'Computer Science & Engineering',
        club_name: 'Cybersecurity Student Club',
        venue_id: 'v3',
        venue_name: 'SAC Computer Labs (Lab 1)',
        start_date: '2026-11-20T14:00:00',
        end_date: '2026-11-20T20:00:00',
        registration_deadline: '2026-11-19T23:59:00',
        capacity: 120,
        registered_count: 92,
        team_type: 'Solo or Duo (1-2)',
        entry_fee: 'Free',
        prize_pool: '₹15,000 Cash + Certificates',
        description: 'Competitive jeopardy-style cybersecurity challenges covering web exploitation, forensics, cryptography, and binary analysis.',
        rules: ['No attacks on contest infrastructure', 'Individual VPN access required', 'No sharing flags between teams'],
        schedule: [{ time: '02:00 PM', activity: 'VPN Access Briefing' }, { time: '02:30 PM', activity: 'Flags Open' }, { time: '07:30 PM', activity: 'Scoring Closes' }],
        image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
        status: 'approved',
        coordinator_name: 'K. Vamsi (CSE E3)',
        coordinator_phone: '+91 98490 22334',
        coordinator_email: 'vamsi.ctf@rguktrkv.ac.in',
        faculty_advisor: 'Dr. K. Srinivas Rao'
      },
      {
        id: 'EVT-2026-005',
        title: 'Generative AI & LLM Systems Masterclass',
        tagline: 'Building Autonomous AI Workflows with Gemini & Python',
        category: 'Workshops',
        department: 'Computer Science & Engineering',
        club_name: 'AI/ML Developers Club',
        venue_id: 'v4',
        venue_name: 'CSE Department Seminar Hall',
        start_date: '2026-11-22T10:00:00',
        end_date: '2026-11-22T16:30:00',
        registration_deadline: '2026-11-21T18:00:00',
        capacity: 150,
        registered_count: 145,
        team_type: 'Individual',
        entry_fee: 'Free',
        prize_pool: 'Verified E-Certificate',
        description: 'Hands-on architectural deep dive into RAG pipelines, autonomous agents, and embedding models with code labs.',
        rules: ['Bring personal laptops with Python installed', 'Attendance required for certification'],
        schedule: [{ time: '10:00 AM', activity: 'Session 1: LLM Foundations' }, { time: '02:00 PM', activity: 'Session 2: Agent Tools & RAG' }],
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        status: 'approved',
        coordinator_name: 'A. Harshavardhan (CSE E3)',
        coordinator_phone: '+91 91234 55667',
        coordinator_email: 'harsha.ai@rguktrkv.ac.in',
        faculty_advisor: 'Dr. B. Prasad Rao'
      }
    ],
    registrations: [
      {
        id: 'REG-2026-8819',
        event_id: 'EVT-2026-001',
        user_id: 'USR-STU-01',
        student_name: 'Campus Student',
        student_id: 'R210001',
        email: 'student@rguktrkv.ac.in',
        department: 'Computer Science & Engineering',
        year: 'E3',
        phone: '+91 81234 00001',
        team_name: 'ByteWizards',
        team_members: 'R210001 (Lead), R210005 (K. Mohan)',
        ticket_code: 'RKV-EVT1-0001-8819',
        check_in_status: 'not_checked_in',
        payment_status: 'paid',
        payment_amount: 150.00,
        payment_mode: 'UPI / QR Code',
        transaction_id: 'UPI/2026/894321908',
        payment_date: '2026-11-03T14:32:00',
        registered_at: '2026-11-03T14:32:00'
      },
      {
        id: 'REG-2026-7720',
        event_id: 'EVT-2026-002',
        user_id: 'USR-STU-02',
        student_name: 'K. Ananya',
        student_id: 'R210101',
        email: 'ananya.k@rguktrkv.ac.in',
        department: 'Electronics & Comm Engineering',
        year: 'E3',
        phone: '+91 94405 12345',
        team_name: 'Solo Vocalist',
        team_members: 'K. Ananya',
        ticket_code: 'RKV-EVT2-0101-7720',
        check_in_status: 'checked_in',
        checked_in_at: '2026-11-04T09:15:00',
        payment_status: 'free',
        payment_amount: 0.00,
        payment_mode: 'Free (Institute Sponsored)',
        transaction_id: 'INST-WAIVER-2026',
        payment_date: '2026-11-03T16:10:00',
        registered_at: '2026-11-03T16:10:00'
      },
      {
        id: 'REG-2026-6631',
        event_id: 'EVT-2026-004',
        user_id: 'USR-STU-03',
        student_name: 'V. Sravan Kumar',
        student_id: 'R210342',
        email: 'sravan.v@rguktrkv.ac.in',
        department: 'Computer Science & Engineering',
        year: 'E3',
        phone: '+91 98480 33445',
        team_name: 'NullPointers Duo',
        team_members: 'R210342 (Sravan), R210344 (Naveen)',
        ticket_code: 'RKV-EVT4-0342-6631',
        check_in_status: 'not_checked_in',
        payment_status: 'paid',
        payment_amount: 100.00,
        payment_mode: 'SBI Collect Portal',
        transaction_id: 'DUK9832104928',
        payment_date: '2026-11-04T10:20:00',
        registered_at: '2026-11-04T10:20:00'
      }
    ],
    announcements: [
      {
        id: 'ANN-001',
        title: 'ABHIYAAN 2026 Registrations Live!',
        content: 'Undergraduate batches and PUC students can now register for the National Hackathon. High-speed LAN, refreshments and mentor assistance will be provided at SAC.',
        priority: 'urgent',
        issued_by: 'Dean of Student Affairs',
        created_at: '2026-11-03T10:00:00'
      },
      {
        id: 'ANN-002',
        title: 'Robotics Bot Weight Check Notice',
        content: 'All combat bots for ElectroBlitz must undergo physical screening at Mechanical Workshop Bay on Nov 19 at 9:30 AM.',
        priority: 'info',
        issued_by: 'Robotics Club Coordinator',
        created_at: '2026-11-04T08:30:00'
      }
    ]
  };
}

function createJsonAdapter() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  function readTable(tableName) {
    const file = path.join(DATA_DIR, `${tableName}.json`);
    if (!fs.existsSync(file)) return [];
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
    } catch {
      return [];
    }
  }

  function writeTable(tableName, data) {
    const file = path.join(DATA_DIR, `${tableName}.json`);
    const tmpFile = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, file);
  }

  function initializeDatabase() {
    const venuesFile = path.join(DATA_DIR, 'venues.json');
    if (!fs.existsSync(venuesFile)) {
      const seed = getSeedData();
      writeTable('venues', seed.venues);
      writeTable('users', seed.users);
      writeTable('events', seed.events);
      writeTable('registrations', seed.registrations);
      writeTable('announcements', seed.announcements);
    }
  }

  initializeDatabase();

  return {
    getStorageMode: () => 'json-atomic',
    init: async () => {},

    async getEvents(filters = {}) {
      let list = readTable('events');
      if (filters.category && filters.category !== 'All') {
        list = list.filter(e => (e.category || '').toLowerCase() === filters.category.toLowerCase());
      }
      if (filters.department && filters.department !== 'All') {
        list = list.filter(e => (e.department || '').toLowerCase().includes(filters.department.toLowerCase()) || e.department === 'All Branches');
      }
      if (filters.venueId && filters.venueId !== 'All') {
        list = list.filter(e => e.venue_id === filters.venueId);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(e =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.tagline || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q) ||
          (e.department || '').toLowerCase().includes(q) ||
          (e.coordinator_name || '').toLowerCase().includes(q) ||
          (e.venue_name || '').toLowerCase().includes(q)
        );
      }
      return list;
    },

    async getEventById(id) {
      return readTable('events').find(e => e.id === id) || null;
    },

    async createEvent(data) {
      const list = readTable('events');
      const newId = `EVT-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const newEvent = {
        id: newId,
        registered_count: 0,
        status: 'approved',
        created_at: new Date().toISOString(),
        ...data
      };
      list.unshift(newEvent);
      writeTable('events', list);
      return newEvent;
    },

    async updateEvent(id, updates) {
      const list = readTable('events');
      const idx = list.findIndex(e => e.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...updates };
      writeTable('events', list);
      return list[idx];
    },

    async deleteEvent(id) {
      const list = readTable('events');
      const filtered = list.filter(e => e.id !== id);
      if (filtered.length === list.length) return false;
      writeTable('events', filtered);
      return true;
    },

    async getVenues() {
      return readTable('venues');
    },

    async getUsers() {
      return readTable('users');
    },

    async getUserById(id) {
      return readTable('users').find(u => u.id === id) || null;
    },

    async getUserByEmailOrRguktId(identifier) {
      const idf = (identifier || '').trim().toLowerCase();
      return readTable('users').find(u =>
        (u.email && u.email.toLowerCase() === idf) ||
        (u.rgukt_id && u.rgukt_id.toLowerCase() === idf)
      ) || null;
    },

    async createUser(userData) {
      const list = readTable('users');
      const rolePrefix = (userData.role || 'STU').slice(0, 3).toUpperCase();
      const newId = `USR-${rolePrefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const newUser = {
        id: newId,
        created_at: new Date().toISOString(),
        avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.full_name || 'User')}`,
        ...userData,
        password: hashPassword(userData.password)
      };
      list.push(newUser);
      writeTable('users', list);
      return newUser;
    },

    async updateUser(id, updates) {
      const list = readTable('users');
      const idx = list.findIndex(u => u.id === id);
      if (idx === -1) return null;
      const safeUpdates = { ...updates };
      if (safeUpdates.password !== undefined && !String(safeUpdates.password).startsWith('scrypt$')) {
        safeUpdates.password = hashPassword(safeUpdates.password);
      }
      list[idx] = { ...list[idx], ...safeUpdates, updated_at: new Date().toISOString() };
      writeTable('users', list);
      return list[idx];
    },

    async getRegistrations(filters = {}) {
      let list = readTable('registrations');
      if (filters.userId) list = list.filter(r => r.user_id === filters.userId);
      if (filters.eventId) list = list.filter(r => r.event_id === filters.eventId);
      return list;
    },

    async createRegistration(data) {
      const list = readTable('registrations');
      const existing = list.find(
        r => r.event_id === data.event_id && (r.user_id === data.user_id || (data.student_id && r.student_id === data.student_id))
      );
      if (existing) {
        throw new Error('Student is already registered for this event');
      }

      const events = readTable('events');
      const evt = events.find(e => e.id === data.event_id);
      if (!evt) throw new Error('Event not found');
      if (evt.registered_count >= evt.capacity) {
        throw new Error('Event capacity reached. Registrations closed.');
      }

      const regId = `REG-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const ticketCode = `RKV-${data.event_id.replace('EVT-2026-', '')}-${(data.student_id || 'USR').slice(-4)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      const newReg = {
        id: regId,
        ticket_code: ticketCode,
        check_in_status: 'not_checked_in',
        payment_date: new Date().toISOString(),
        registered_at: new Date().toISOString(),
        ...data
      };

      list.unshift(newReg);
      writeTable('registrations', list);

      evt.registered_count = (evt.registered_count || 0) + 1;
      writeTable('events', events);

      return newReg;
    },

    async updateRegistrationPayment(regId, paymentStatus) {
      const list = readTable('registrations');
      const idx = list.findIndex(r => r.id === regId);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], payment_status: paymentStatus, payment_date: new Date().toISOString() };
      writeTable('registrations', list);
      return list[idx];
    },

    async verifyTicket(ticketCode) {
      const list = readTable('registrations');
      const reg = list.find(r => r.ticket_code === ticketCode || r.id === ticketCode);
      if (!reg) return { valid: false, message: 'Invalid or unrecognized Ticket Code' };

      if (reg.check_in_status === 'checked_in') {
        return {
          valid: false,
          alreadyCheckedIn: true,
          registration: reg,
          message: `Ticket was ALREADY checked in on ${reg.checked_in_at || 'earlier session'}`
        };
      }

      reg.check_in_status = 'checked_in';
      reg.checked_in_at = new Date().toISOString();
      writeTable('registrations', list);

      const event = readTable('events').find(e => e.id === reg.event_id) || null;
      return {
        valid: true,
        registration: reg,
        event,
        message: 'Ticket successfully verified! Gate access granted.'
      };
    },

    async getAnnouncements() {
      return readTable('announcements');
    },

    async createAnnouncement(data) {
      const list = readTable('announcements');
      const newId = `ANN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const newAnn = {
        id: newId,
        created_at: new Date().toISOString(),
        ...data
      };
      list.unshift(newAnn);
      writeTable('announcements', list);
      return newAnn;
    }
  };
}

const usePostgres = Boolean(process.env.DATABASE_URL || process.env.PGHOST);
const db = usePostgres ? createPostgresAdapter(getSeedData()) : createJsonAdapter();

console.log(`[STORAGE] Active persistence adapter: ${db.getStorageMode()}`);

module.exports = db;
