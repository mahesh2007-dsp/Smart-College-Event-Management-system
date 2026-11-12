const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

process.env.DISABLE_RATE_LIMIT = 'true';

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP = {};

function backupData() {
  if (!fs.existsSync(DATA_DIR)) return;
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (file.endsWith('.json')) {
      BACKUP[file] = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    }
  }
}

function restoreData() {
  for (const [file, content] of Object.entries(BACKUP)) {
    fs.writeFileSync(path.join(DATA_DIR, file), content, 'utf8');
  }
}

let server;
let baseUrl;

test.before(async () => {
  backupData();
  const app = require('../server');
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  restoreData();
});

async function apiReq(method, urlPath, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, data };
}

test('Integration: Health, Auth, RBAC, Payment Amount Trust, Venue Conflict & QR Verification', async () => {
  // 1. Health check
  const health = await apiReq('GET', '/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.status, 'ok');

  // 2. Role-based Registration and Token Verification
  const regAttempt = await apiReq('POST', '/api/auth/register', {
    full_name: 'Test Escalation Student',
    email: 'escalate@rguktrkv.ac.in',
    rgukt_id: 'R219991',
    password: 'Password123',
    role: 'student'
  });
  assert.equal(regAttempt.status, 201);
  assert.equal(regAttempt.data.user.role, 'student');
  assert.equal(regAttempt.data.token.split('.').length, 3);
  const studentToken = regAttempt.data.token;

  // 3. RBAC blocks unauthenticated & student privilege actions
  const unauthRegs = await apiReq('GET', '/api/registrations');
  assert.equal(unauthRegs.status, 401);

  const studentCreateEvt = await apiReq('POST', '/api/events', {
    title: 'Unauthorized Event',
    category: 'Technical',
    venue_id: 'v1',
    start_date: '2026-12-10T10:00:00'
  }, studentToken);
  assert.equal(studentCreateEvt.status, 403);

  const studentScan = await apiReq('POST', '/api/registrations/verify', { ticketCode: 'RKV-EVT1-0001-8819' }, studentToken);
  assert.equal(studentScan.status, 403);

  const studentEditAdmin = await apiReq('PATCH', '/api/users/USR-ADM-01/profile', { phone: '+91 90000 00000' }, studentToken);
  assert.equal(studentEditAdmin.status, 403);

  // 4. Coordinator Login
  const coordLogin = await apiReq('POST', '/api/auth/login', {
    identifier: 'coordinator@rguktrkv.ac.in',
    password: 'coordinator'
  });
  assert.equal(coordLogin.status, 200);
  assert.equal(coordLogin.data.user.role, 'coordinator');
  const coordToken = coordLogin.data.token;

  // 5. Coordinator creates paid event (₹250)
  const paidEventRes = await apiReq('POST', '/api/events', {
    title: 'Integration Paid Workshop',
    category: 'Workshops',
    venue_id: 'v4',
    start_date: '2026-12-20T09:00:00',
    end_date: '2026-12-20T17:00:00',
    capacity: 50,
    entry_fee: '₹250'
  }, coordToken);
  assert.equal(paidEventRes.status, 201);
  const paidEventId = paidEventRes.data.id;

  // 6. Server-side Venue Conflict Guard rejects overlapping booking on v4
  const clashRes = await apiReq('POST', '/api/events', {
    title: 'Conflicting Workshop',
    category: 'Workshops',
    venue_id: 'v4',
    start_date: '2026-12-20T11:00:00',
    end_date: '2026-12-20T14:00:00',
    capacity: 40
  }, coordToken);
  assert.equal(clashRes.status, 409);

  // 7. Payment Amount Trust: reject tampered amount ₹10 for ₹250 event
  const tamperedPay = await apiReq('POST', '/api/registrations', {
    event_id: paidEventId,
    student_name: 'Test Escalation Student',
    student_id: 'R219991',
    payment_mode: 'UPI / QR Code',
    payment_amount: 10,
    transaction_id: '887766554433'
  }, studentToken);
  assert.equal(tamperedPay.status, 400);
  assert.match(tamperedPay.data.error, /Payment amount verification failed/);

  // 8. Valid Payment Amount ₹250 & Valid 12-digit UTR succeeds
  const validReg = await apiReq('POST', '/api/registrations', {
    event_id: paidEventId,
    student_name: 'Test Escalation Student',
    student_id: 'R219991',
    payment_mode: 'UPI / QR Code',
    payment_amount: 250,
    transaction_id: '887766554433'
  }, studentToken);
  assert.equal(validReg.status, 201);
  assert.equal(validReg.data.payment_amount, 250);
  assert.equal(validReg.data.payment_status, 'paid');
  const ticketCode = validReg.data.ticket_code;

  // 9. QR Ticket Verification & Anti-Duplicate Guard
  const firstScan = await apiReq('POST', '/api/registrations/verify', { ticketCode }, coordToken);
  assert.equal(firstScan.status, 200);
  assert.equal(firstScan.data.valid, true);

  const secondScan = await apiReq('POST', '/api/registrations/verify', { ticketCode }, coordToken);
  assert.equal(secondScan.status, 200);
  assert.equal(secondScan.data.valid, false);
  assert.equal(secondScan.data.alreadyCheckedIn, true);

  // 10. Cleanup created event
  const delRes = await apiReq('DELETE', `/api/events/${paidEventId}`, undefined, coordToken);
  assert.equal(delRes.status, 200);
  assert.equal(delRes.data.success, true);
});
