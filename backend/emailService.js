// Email Notification Service for Smart CEMS
// Supports real SMTP (Gmail, SendGrid, Outlook, University Mail)
// and gracefully falls back to console logger/Ethereal if unconfigured.
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'RGUKT Smart CEMS <no-reply@rguktrkv.ac.in>';

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  console.log(`[EMAIL] SMTP Transporter configured (${SMTP_HOST}:${SMTP_PORT})`);
} else {
  console.log('[EMAIL] Live SMTP credentials not found in env. Initialized in dev logger mode.');
}

async function sendEmail({ to, subject, html, text }) {
  if (!to) return { success: false, reason: 'Recipient email missing' };

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        text,
        html
      });
      console.log(`[EMAIL] Email sent successfully to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL] SMTP delivery failed to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // Development Fallback: Log email details cleanly without crashing
  console.log('----------------------------------------------------');
  console.log(`[EMAIL DISPATCH - DEV SIMULATION]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Summary: ${text || (html ? html.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...' : '')}`);
  console.log('----------------------------------------------------');
  return { success: true, simulated: true };
}

async function sendRegistrationConfirmation({ studentEmail, studentName, studentId, eventTitle, ticketCode, venueName, startDate, paymentStatus, paymentAmount, transactionId }) {
  const subject = `Registration Confirmed: ${eventTitle} (Pass: ${ticketCode})`;
  const dateStr = startDate ? new Date(startDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled Soon';

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="color: #60a5fa; margin: 0;">RGUKT IIIT RK VALLEY</h2>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Smart College Event Management System (Smart CEMS)</p>
      </div>

      <p style="font-size: 15px;">Dear <b>${studentName}</b> (${studentId}),</p>
      <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1;">Your registration for <b>"${eventTitle}"</b> has been successfully recorded in the campus event registry.</p>

      <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin: 20px 0;">
        <h3 style="color: #38bdf8; margin-top: 0; font-size: 16px;">Your E-Pass Ticket Details</h3>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Ticket Code:</strong> <span style="font-family: monospace; color: #facc15; font-size: 15px; font-weight: bold;">${ticketCode}</span></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Venue:</strong> ${venueName}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Date & Time:</strong> ${dateStr}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Payment Status:</strong> <span style="color: ${paymentStatus === 'paid' ? '#4ade80' : '#38bdf8'}; font-weight: bold; text-transform: uppercase;">${paymentStatus === 'paid' ? `Paid (₹${paymentAmount})` : 'Free Pass'}</span></p>
        ${transactionId && transactionId !== 'N/A' && transactionId !== 'INST-WAIVER-FREE' ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Transaction / UTR:</strong> ${transactionId}</p>` : ''}
      </div>

      <p style="font-size: 13px; color: #94a3b8;">Please present your digital QR ticket or Ticket Code at the SAC gate counter on event day for instant entry verification.</p>

      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center;">
        Directorate of Student Affairs • RGUKT RK Valley Campus, Andhra Pradesh - 516330
      </div>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    text: `Dear ${studentName}, your registration for ${eventTitle} is confirmed! Ticket Code: ${ticketCode}. Venue: ${venueName}. Payment: ${paymentStatus}.`,
    html
  });
}

async function sendWelcomeEmail({ email, fullName, role, rguktId }) {
  const subject = `Welcome to RGUKT Smart CEMS, ${fullName}!`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
      <h2 style="color: #60a5fa; margin: 0;">Welcome to Smart CEMS</h2>
      <p style="color: #94a3b8; font-size: 13px;">RGUKT IIIT RK Valley Event Portal</p>
      <p style="font-size: 14px; color: #cbd5e1;">Hello <b>${fullName}</b>,</p>
      <p style="font-size: 14px; color: #cbd5e1;">Your student account (${rguktId || email}) has been registered. You can now explore campus technical, cultural, and sports festivals, register with instant UPI UTR validation, access your QR entry passes, and earn verified participation certificates.</p>
      <div style="margin-top: 24px; font-size: 11px; color: #64748b; text-align: center;">
        Dean Student Affairs • RGUKT RK Valley
      </div>
    </div>
  `;
  return sendEmail({
    to: email,
    subject,
    text: `Hello ${fullName}, welcome to Smart CEMS! Your student account is active.`,
    html
  });
}

module.exports = {
  sendEmail,
  sendRegistrationConfirmation,
  sendWelcomeEmail
};
