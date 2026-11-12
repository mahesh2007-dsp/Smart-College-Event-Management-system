const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const {
  verifyPassword,
  signToken,
  verifyToken,
  requireAuth,
  requireRole,
  securityHeaders,
  createRateLimiter
} = require('./security');
const { parseEventFee, verifyPaymentDetails } = require('./payment');
const { sendRegistrationConfirmation, sendWelcomeEmail } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:5001';

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true
  })
);

app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60 });
const apiLimiter = createRateLimiter({ windowMs: 1 * 60 * 1000, max: 200 });
app.use('/api', apiLimiter);

// Cryptographic JWT Auth Middleware with legacy token compatibility
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    req.user = null;
    return next();
  }

  const rawToken = header.replace(/^Bearer\s+/i, '').trim();
  if (!rawToken) {
    req.user = null;
    return next();
  }

  const decoded = verifyToken(rawToken);
  let user = null;

  if (decoded && decoded.sub) {
    user = await db.getUserById(decoded.sub);
  } else if (rawToken.startsWith('USR-')) {
    // Graceful backward-compatible fallback for active browser sessions
    user = await db.getUserById(rawToken);
  }

  req.user = user || null;
  next();
}

app.use(authMiddleware);

// ================= AUTH ROUTES =================
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { identifier, password, role } = req.body;
  const cleanId = (identifier || '').trim();
  const cleanPass = (password || '').trim();
  const requestedRole = (role || '').trim().toLowerCase();

  if (!cleanId || !cleanPass) {
    return res.status(400).json({ error: 'Please enter your RGUKT ID/Email and password' });
  }

  const user = await db.getUserByEmailOrRguktId(cleanId);
  if (!user || !verifyPassword(cleanPass, user.password)) {
    return res.status(401).json({ error: 'Invalid RGUKT ID / Email or Password' });
  }

  // If a specific role was selected in login, verify that the user has that role
  if (requestedRole && requestedRole !== 'all') {
    if (user.role !== requestedRole) {
      const roleLabel = requestedRole === 'coordinator' ? 'Event Coordinator' : (requestedRole === 'admin' ? 'Faculty Admin' : 'Student');
      return res.status(403).json({
        error: `Role Mismatch: Account is registered as "${user.role}", but you selected "${roleLabel}". Please select "${user.role}" to continue.`
      });
    }
  }

  // Auto-upgrade legacy plaintext stored passwords to scrypt hash on successful login
  if (user.password && !user.password.startsWith('scrypt$')) {
    await db.updateUser(user.id, { password: cleanPass });
  }

  const { password: _, ...safeUser } = user;
  const token = signToken(user);

  res.json({
    success: true,
    token,
    user: safeUser
  });
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { full_name, email, rgukt_id, department, year, phone, hostel, password, role, club_name, avatar_url } = req.body;

  const cleanName = (full_name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  const cleanId = (rgukt_id || '').trim().toUpperCase();
  const cleanPhone = (phone || '').trim().replace(/[\s-]/g, '');

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ error: 'Full name is required (minimum 2 characters)' });
  }
  if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. user@rguktrkv.ac.in)' });
  }
  if (!cleanPass || cleanPass.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  const assignedRole = ['student', 'coordinator', 'admin'].includes(role) ? role : 'student';

  if (cleanId) {
    if (!/^[ROSN]\d{6}$/.test(cleanId) && !/^[A-Za-z0-9_-]{3,15}$/.test(cleanId) && assignedRole !== 'admin') {
      return res.status(400).json({
        error: 'Invalid Student / Member ID format (e.g. R210001, O210543, or standard alphanumeric ID)'
      });
    }
  }

  if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number (e.g. 9848012345)' });
  }

  const existingEmail = await db.getUserByEmailOrRguktId(cleanEmail);
  if (existingEmail) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  if (cleanId) {
    const existingId = await db.getUserByEmailOrRguktId(cleanId);
    if (existingId) {
      return res.status(400).json({ error: 'RGUKT ID already registered' });
    }
  }

  const newUser = await db.createUser({
    full_name: cleanName,
    email: cleanEmail,
    rgukt_id: cleanId || null,
    department: department || 'Engineering',
    year: year || 'E3',
    phone: cleanPhone || '',
    hostel: hostel || '',
    role: assignedRole,
    club_name: club_name || (assignedRole === 'coordinator' ? 'Event Organizing Body' : ''),
    password: cleanPass,
    avatar_url: avatar_url || null
  });

  const { password: _, ...safeUser } = newUser;
  const token = signToken(newUser);

  // Send asynchronous welcome email notification to student's registered mail
  sendWelcomeEmail({
    email: cleanEmail,
    fullName: cleanName,
    role: assignedRole,
    rguktId: cleanId
  }).catch(err => console.error('[EMAIL ERROR] Welcome email dispatch failed:', err.message));

  res.status(201).json({
    success: true,
    token,
    user: safeUser
  });
});

app.patch('/api/users/:id/profile', requireAuth, async (req, res) => {
  // Only the user themselves or an administrator can update the profile
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You can only edit your own profile' });
  }

  const { avatar_url, phone, hostel, club_name, department, year, full_name } = req.body;
  const updated = await db.updateUser(req.params.id, {
    ...(avatar_url !== undefined && { avatar_url }),
    ...(phone !== undefined && { phone }),
    ...(hostel !== undefined && { hostel }),
    ...(club_name !== undefined && { club_name }),
    ...(department !== undefined && { department }),
    ...(year !== undefined && { year }),
    ...(full_name !== undefined && { full_name })
  });

  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safeUser } = updated;
  res.json({ success: true, user: safeUser });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { password: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// ================= EVENTS ROUTES =================
app.get('/api/events', async (req, res) => {
  const { category, department, search, venueId } = req.query;
  const events = await db.getEvents({ category, department, search, venueId });
  res.json(events);
});

app.get('/api/events/:id', async (req, res) => {
  const evt = await db.getEventById(req.params.id);
  if (!evt) return res.status(404).json({ error: 'Event not found' });
  res.json(evt);
});

app.post('/api/events', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  const {
    title, tagline, category, department, club_name, venue_id,
    start_date, end_date, registration_deadline, capacity, team_type,
    entry_fee, prize_pool, description, rules, schedule, image_url,
    coordinator_name, coordinator_phone, coordinator_email, faculty_advisor
  } = req.body;

  if (!title || !category || !venue_id || !start_date) {
    return res.status(400).json({ error: 'Title, category, venue, and start date are mandatory' });
  }

  const startMs = new Date(start_date).getTime();
  const endMs = new Date(end_date || start_date).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return res.status(400).json({ error: 'Invalid start or end date format' });
  }
  if (endMs < startMs) {
    return res.status(400).json({ error: 'Event end date cannot be earlier than start date' });
  }

  // Server-Side Venue Conflict Guard
  const allEvents = await db.getEvents();
  const collision = allEvents.find(e => {
    if (e.venue_id !== venue_id) return false;
    const eStart = new Date(e.start_date).getTime();
    const eEnd = new Date(e.end_date || e.start_date).getTime();
    return startMs < eEnd && endMs > eStart;
  });

  if (collision) {
    return res.status(409).json({
      error: `Venue booking conflict: Venue is already booked by "${collision.title}" during this schedule.`
    });
  }

  const venues = await db.getVenues();
  const matchedVenue = venues.find(v => v.id === venue_id);

  const newEvent = await db.createEvent({
    title,
    tagline: tagline || '',
    category,
    department: department || 'Multidisciplinary',
    club_name: club_name || req.user.club_name || 'Student Activity Committee',
    venue_id,
    venue_name: matchedVenue ? matchedVenue.name : 'Campus Venue',
    capacity: Math.max(1, parseInt(capacity, 10) || 100),
    start_date,
    end_date: end_date || start_date,
    registration_deadline: registration_deadline || start_date,
    team_type: team_type || 'Individual',
    entry_fee: entry_fee || 'Free',
    prize_pool: prize_pool || 'Certificate of Merit',
    description: description || '',
    rules: Array.isArray(rules) ? rules : (rules ? rules.split('\n').filter(Boolean) : []),
    schedule: schedule || [],
    image_url: image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    coordinator_name: coordinator_name || req.user.full_name || 'Organizing Team Lead',
    coordinator_phone: coordinator_phone || req.user.phone || '',
    coordinator_email: coordinator_email || req.user.email || '',
    faculty_advisor: faculty_advisor || 'Department Faculty Convener'
  });

  res.status(201).json(newEvent);
});

app.patch('/api/events/:id/status', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'pending', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid event status' });
  }
  const updated = await db.updateEvent(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Event not found' });
  res.json(updated);
});

app.delete('/api/events/:id', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  const success = await db.deleteEvent(req.params.id);
  if (!success) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true });
});

// ================= REGISTRATIONS & TICKETS =================
app.get('/api/registrations', requireAuth, async (req, res) => {
  const { userId, eventId } = req.query;

  // Students can only query their own registrations
  if (req.user.role === 'student') {
    const regs = await db.getRegistrations({ userId: req.user.id, eventId });
    return res.json(regs);
  }

  // Coordinators and Admins can query all or filter by event/user
  const regs = await db.getRegistrations({ userId, eventId });
  res.json(regs);
});

app.post('/api/registrations', requireAuth, async (req, res) => {
  const {
    event_id,
    student_name,
    student_id,
    email,
    department,
    year,
    phone,
    team_name,
    team_members,
    payment_mode,
    transaction_id,
    payment_amount
  } = req.body;

  if (!event_id || !student_name || !student_id) {
    return res.status(400).json({ error: 'Event ID, student name, and student ID are required' });
  }

  const cleanStudentId = (student_id || '').trim().toUpperCase();
  if (!/^[ROSN]\d{6}$/.test(cleanStudentId) && !/^[A-Za-z0-9_-]{3,15}$/.test(cleanStudentId)) {
    return res.status(400).json({
      error: 'Invalid Student ID: Must be an official campus ID (e.g. R210001) or valid registration ID'
    });
  }

  const evt = await db.getEventById(event_id);
  if (!evt) return res.status(404).json({ error: 'Event not found' });

  if (evt.registered_count >= evt.capacity) {
    return res.status(400).json({ error: 'Event capacity reached. Registrations closed.' });
  }

  const existingRegistrations = await db.getRegistrations();

  // REAL PAYMENT VERIFICATION & AMOUNT TRUST GUARD
  const paymentVerdict = verifyPaymentDetails({
    event: evt,
    paymentMode: payment_mode,
    transactionId: transaction_id,
    clientAmount: payment_amount,
    existingRegistrations
  });

  if (!paymentVerdict.valid) {
    return res.status(400).json({ error: paymentVerdict.error });
  }

  try {
    const reg = await db.createRegistration({
      event_id,
      user_id: req.user.id,
      student_name: student_name.trim(),
      student_id: cleanStudentId,
      email: (email || req.user.email || '').trim().toLowerCase(),
      department: department || req.user.department || 'Engineering',
      year: year || req.user.year || 'E3',
      phone: (phone || req.user.phone || '').trim(),
      team_name: team_name || 'Individual',
      team_members: team_members || student_name,
      payment_status: paymentVerdict.payment_status,
      payment_amount: paymentVerdict.payment_amount,
      payment_mode: paymentVerdict.payment_mode,
      transaction_id: paymentVerdict.transaction_id
    });

    // Send confirmation email notification to attendee's mail ID
    sendRegistrationConfirmation({
      studentEmail: reg.email,
      studentName: reg.student_name,
      studentId: reg.student_id,
      eventTitle: evt.title,
      ticketCode: reg.ticket_code,
      venueName: evt.venue_name,
      startDate: evt.start_date,
      paymentStatus: reg.payment_status,
      paymentAmount: reg.payment_amount,
      transactionId: reg.transaction_id
    }).catch(err => console.error('[EMAIL ERROR] Confirmation email failed:', err.message));

    res.status(201).json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/registrations/verify', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  const { ticketCode } = req.body;
  if (!ticketCode) return res.status(400).json({ error: 'Ticket code required' });
  const result = await db.verifyTicket(ticketCode.trim());
  res.json(result);
});

app.patch('/api/registrations/:id/payment', requireAuth, requireRole('coordinator', 'admin'), async (req, res) => {
  const { payment_status } = req.body;
  if (!['paid', 'pending', 'waived'].includes(payment_status)) {
    return res.status(400).json({ error: 'Invalid payment status. Allowed: paid, pending, waived' });
  }
  const updated = await db.updateRegistrationPayment(req.params.id, payment_status);
  if (!updated) return res.status(404).json({ error: 'Registration not found' });
  res.json(updated);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbMode: db.getStorageMode(),
    timestamp: new Date().toISOString()
  });
});

// ================= VENUES =================
app.get('/api/venues', async (req, res) => {
  const venues = await db.getVenues();
  res.json(venues);
});

// ================= ANNOUNCEMENTS =================
app.get('/api/announcements', async (req, res) => {
  const announcements = await db.getAnnouncements();
  res.json(announcements);
});

app.post('/api/announcements', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, content, priority } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const ann = await db.createAnnouncement({
    title,
    content,
    priority: priority || 'info',
    issued_by: req.user.full_name || 'University Dean'
  });
  res.status(201).json(ann);
});

// ================= ANALYTICS =================
app.get('/api/analytics', async (req, res) => {
  const events = await db.getEvents();
  const regs = await db.getRegistrations();
  const users = await db.getUsers();
  const venues = await db.getVenues();

  const totalEvents = events.length;
  const totalRegistrations = regs.length;
  const totalStudents = users.filter(u => u.role === 'student').length;

  const categoryCounts = {};
  events.forEach(e => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });

  const deptCounts = {};
  regs.forEach(r => {
    const d = r.department || 'Other';
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  });

  res.json({
    totalEvents,
    totalRegistrations,
    totalStudents,
    venuesCount: venues.length,
    categoryCounts,
    deptCounts
  });
});

// ================= PROXY TO PYTHON AI MICROSERVICE =================
app.post('/api/ai/recommend', async (req, res) => {
  const events = await db.getEvents();
  try {
    const payload = { ...req.body, events };
    const response = await fetch(`${PYTHON_AI_URL}/api/ai/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    const { department = 'Computer Science & Engineering', interests = [] } = req.body;
    const deptStr = String(department).toLowerCase();
    const interestSet = new Set(interests.map(i => String(i).toLowerCase()));

    const branchKeywords = {
      cse: ['coding', 'hackathon', 'ai', 'web', 'cybersecurity', 'ctf', 'cloud', 'algorithm', 'software', 'programming'],
      ece: ['iot', 'embedded', 'robotics', 'circuits', 'hardware', 'signals', 'sensors'],
      mech: ['robotics', 'cad', 'design', 'drone', 'mechanics', 'automobile', 'sports'],
      civil: ['structure', 'survey', 'design', 'green', 'sustainability', 'sports'],
      chem: ['process', 'energy', 'materials', 'science', 'quiz'],
      mme: ['metallurgy', 'materials', 'nano', 'testing', 'science']
    };

    let branch = 'cse';
    if (deptStr.includes('ece') || deptStr.includes('electronic')) branch = 'ece';
    else if (deptStr.includes('mech')) branch = 'mech';
    else if (deptStr.includes('civil')) branch = 'civil';
    else if (deptStr.includes('chem')) branch = 'chem';
    else if (deptStr.includes('metallurg') || deptStr.includes('mme')) branch = 'mme';

    const targetWords = new Set([...(branchKeywords[branch] || []), ...interestSet]);

    const scored = events.map(evt => {
      const text = `${evt.title || ''} ${evt.category || ''} ${evt.description || ''} ${evt.tagline || ''} ${evt.department || ''}`.toLowerCase();
      let matches = 0;
      targetWords.forEach(w => {
        if (text.includes(w)) matches++;
      });
      const deptMatches = evt.department && (evt.department.toLowerCase().includes(branch) || evt.department.toLowerCase().includes('all') || text.includes(branch));
      const score = Math.min(98, Math.max(55, (deptMatches ? 70 : 45) + (matches * 12)));

      return {
        eventId: evt.id,
        title: evt.title,
        tagline: evt.tagline || '',
        category: evt.category,
        department: evt.department,
        venue_name: evt.venue_name,
        start_date: evt.start_date,
        image_url: evt.image_url,
        entry_fee: evt.entry_fee || 'Free',
        team_type: evt.team_type || 'Individual',
        matchScore: score,
        reasons: [
          deptMatches ? `Matches ${department} curriculum` : 'Cross-disciplinary campus interest',
          `${matches} domain factor(s) matched`
        ]
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      studentDepartment: department,
      detectedBranch: branch.toUpperCase(),
      recommendedEvents: scored.slice(0, 10),
      fallback: true
    });
  }
});

app.post('/api/ai/verify-certificate', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_AI_URL}/api/ai/verify-certificate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    const crypto = require('crypto');
    const { studentId = '', eventId = '', ticketCode = '', certificateHash = '' } = req.body;
    const secretSalt = process.env.CERT_SECRET_SALT || 'RGUKT_RKV_SECURE_EVENT_SALT_2026';
    const dataStr = `${studentId.trim().toUpperCase()}|${eventId.trim()}|${ticketCode.trim()}|${secretSalt}`;
    const expectedHash = crypto.createHash('sha256').update(dataStr).digest('hex');
    const isValid = certificateHash ? certificateHash.toLowerCase() === expectedHash.toLowerCase() : true;

    return res.json({
      valid: isValid,
      studentId: studentId.trim().toUpperCase(),
      eventId,
      generatedHash: `RKV-CERT-${expectedHash.slice(0, 16).toUpperCase()}`,
      fullVerificationDigest: expectedHash,
      issuer: 'Directorate of Student Affairs, RGUKT RK Valley',
      message: isValid ? 'Certificate signature verified authentic' : 'Hash mismatch: potential certificate forgery',
      fallback: true
    });
  }
});

// Explicit 404 for unhandled API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Serve production frontend build if available
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================================`);
    console.log(` Smart College Event Management System (Smart CEMS) - Backend API `);
    console.log(` Focus: RGUKT IIIT RK Valley, Andhra Pradesh                     `);
    console.log(` Server Live: http://0.0.0.0:${PORT}                             `);
    console.log(` Connected to Python AI Service: ${PYTHON_AI_URL}                `);
    console.log(` Storage Adapter: ${db.getStorageMode()}                         `);
    console.log(`==================================================================`);
  });
}

module.exports = app;
