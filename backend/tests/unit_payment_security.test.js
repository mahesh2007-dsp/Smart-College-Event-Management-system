const test = require('node:test');
const assert = require('node:assert/strict');
const { parseEventFee, verifyPaymentDetails } = require('../payment');
const { hashPassword, verifyPassword, signToken, verifyToken } = require('../security');

test('Payment: parseEventFee correctly handles Free and numeric formats', () => {
  assert.equal(parseEventFee('Free'), 0);
  assert.equal(parseEventFee('₹0'), 0);
  assert.equal(parseEventFee('0'), 0);
  assert.equal(parseEventFee('₹150'), 150);
  assert.equal(parseEventFee('150.00'), 150);
  assert.equal(parseEventFee('₹250 Per Team'), 250);
});

test('Payment: reject mismatched client payment amount on paid event', () => {
  const event = { id: 'EVT-001', entry_fee: '₹150' };
  const verdict = verifyPaymentDetails({
    event,
    paymentMode: 'UPI / QR Code',
    transactionId: '123456789012',
    clientAmount: 50 // Malicious discount attempt
  });
  assert.equal(verdict.valid, false);
  assert.match(verdict.error, /Payment amount verification failed/);
});

test('Payment: accept valid 12-digit UPI UTR number and correct amount', () => {
  const event = { id: 'EVT-001', entry_fee: '₹150' };
  const verdict = verifyPaymentDetails({
    event,
    paymentMode: 'UPI / QR Code',
    transactionId: '431209876543',
    clientAmount: 150
  });
  assert.equal(verdict.valid, true);
  assert.equal(verdict.payment_status, 'paid');
  assert.equal(verdict.payment_amount, 150);
  assert.equal(verdict.transaction_id, '431209876543');
});

test('Payment: reject short/invalid UTR for paid event', () => {
  const event = { id: 'EVT-001', entry_fee: '₹150' };
  const verdict = verifyPaymentDetails({
    event,
    paymentMode: 'UPI / QR Code',
    transactionId: '123'
  });
  assert.equal(verdict.valid, false);
  assert.match(verdict.error, /Valid payment details required/);
});

test('Payment: reject duplicate UTR numbers across registrations', () => {
  const event = { id: 'EVT-001', entry_fee: '₹150' };
  const existingRegistrations = [
    { transaction_id: '431209876543' }
  ];
  const verdict = verifyPaymentDetails({
    event,
    paymentMode: 'UPI / QR Code',
    transactionId: '431209876543',
    existingRegistrations
  });
  assert.equal(verdict.valid, false);
  assert.match(verdict.error, /Duplicate payment reference/);
});

test('Security: scrypt hash and verification', () => {
  const raw = 'securePass123';
  const hashed = hashPassword(raw);
  assert.ok(hashed.startsWith('scrypt$'));
  assert.equal(verifyPassword(raw, hashed), true);
  assert.equal(verifyPassword('wrongPass', hashed), false);
});

test('Security: cryptographic JWT signature and expiry', () => {
  const user = { id: 'USR-STU-01', role: 'student', rgukt_id: 'R210001' };
  const token = signToken(user);
  assert.ok(token.includes('.'));
  const decoded = verifyToken(token);
  assert.equal(decoded.sub, 'USR-STU-01');
  assert.equal(decoded.role, 'student');

  // Tampered signature must fail
  const tampered = token.slice(0, -4) + 'AAAA';
  assert.equal(verifyToken(tampered), null);
});
