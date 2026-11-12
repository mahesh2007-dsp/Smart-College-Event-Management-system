const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const { hashPassword } = require('./security');

function parseJsonField(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapEventRow(row) {
  if (!row) return null;
  return {
    ...row,
    rules: parseJsonField(row.rules, []),
    schedule: parseJsonField(row.schedule, [])
  };
}

function mapRegRow(row) {
  if (!row) return null;
  return {
    ...row,
    payment_amount: Number(row.payment_amount || 0),
    registered_at: row.registered_at || row.created_at
  };
}

function mapUserRow(row) {
  if (!row) return null;
  return {
    ...row,
    password: row.password_hash
  };
}

function createPostgresAdapter(seedData) {
  const useSsl =
    process.env.PGSSL === 'true' ||
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')) ||
    process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.PGHOST || undefined,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER || undefined,
    password: process.env.PGPASSWORD || undefined,
    database: process.env.PGDATABASE || undefined,
    ssl: useSsl ? { rejectUnauthorized: false } : false
  });

  let initialized = false;
  let initPromise = null;

  async function ensureInitialized() {
    if (initialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);

      // Ensure payment_verified_at / updated_at columns exist cleanly if needed
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`);

      const { rows: venueCount } = await pool.query('SELECT COUNT(*)::int AS cnt FROM venues');
      if (venueCount[0].cnt === 0) {
        for (const v of seedData.venues) {
          await pool.query(
            `INSERT INTO venues (id, name, short_code, capacity, location, facilities, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
            [v.id, v.name, v.short_code, v.capacity, v.location, v.facilities, v.image_url]
          );
        }
      }

      const { rows: userCount } = await pool.query('SELECT COUNT(*)::int AS cnt FROM users');
      if (userCount[0].cnt === 0) {
        for (const u of seedData.users) {
          const pwHash = u.password.startsWith('scrypt$') ? u.password : hashPassword(u.password);
          await pool.query(
            `INSERT INTO users (id, email, password_hash, full_name, role, rgukt_id, department, year, phone, hostel, club_name, avatar_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO NOTHING`,
            [u.id, u.email, pwHash, u.full_name, u.role, u.rgukt_id, u.department, u.year, u.phone, u.hostel, u.club_name, u.avatar_url]
          );
        }
      }

      const { rows: eventCount } = await pool.query('SELECT COUNT(*)::int AS cnt FROM events');
      if (eventCount[0].cnt === 0) {
        for (const e of seedData.events) {
          await pool.query(
            `INSERT INTO events (
              id, title, tagline, category, department, club_name, venue_id, venue_name,
              start_date, end_date, registration_deadline, capacity, registered_count,
              team_type, entry_fee, prize_pool, description, rules, schedule, image_url,
              status, coordinator_name, coordinator_phone, coordinator_email, faculty_advisor
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
            ) ON CONFLICT (id) DO NOTHING`,
            [
              e.id, e.title, e.tagline, e.category, e.department, e.club_name, e.venue_id, e.venue_name,
              e.start_date, e.end_date, e.registration_deadline, e.capacity, e.registered_count || 0,
              e.team_type, e.entry_fee, e.prize_pool, e.description,
              JSON.stringify(e.rules || []), JSON.stringify(e.schedule || []),
              e.image_url, e.status || 'approved', e.coordinator_name, e.coordinator_phone,
              e.coordinator_email, e.faculty_advisor
            ]
          );
        }
      }

      const { rows: regCount } = await pool.query('SELECT COUNT(*)::int AS cnt FROM registrations');
      if (regCount[0].cnt === 0) {
        for (const r of seedData.registrations) {
          await pool.query(
            `INSERT INTO registrations (
              id, event_id, user_id, student_name, student_id, email, department, year, phone,
              team_name, team_members, ticket_code, check_in_status, checked_in_at,
              payment_status, payment_amount, payment_mode, transaction_id, payment_date, created_at
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
            ) ON CONFLICT (id) DO NOTHING`,
            [
              r.id, r.event_id, r.user_id, r.student_name, r.student_id, r.email, r.department, r.year, r.phone,
              r.team_name, r.team_members, r.ticket_code, r.check_in_status || 'not_checked_in',
              r.checked_in_at || null, r.payment_status || 'free', r.payment_amount || 0,
              r.payment_mode || 'Free (Institute Sponsored)', r.transaction_id || 'N/A',
              r.payment_date || new Date().toISOString(), r.registered_at || new Date().toISOString()
            ]
          );
        }
      }

      const { rows: annCount } = await pool.query('SELECT COUNT(*)::int AS cnt FROM announcements');
      if (annCount[0].cnt === 0) {
        for (const a of seedData.announcements) {
          await pool.query(
            `INSERT INTO announcements (id, title, content, priority, issued_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
            [a.id, a.title, a.content, a.priority || 'info', a.issued_by, a.created_at || new Date().toISOString()]
          );
        }
      }

      initialized = true;
    })();

    return initPromise;
  }

  return {
    getStorageMode: () => 'postgresql',
    init: ensureInitialized,

    async getEvents(filters = {}) {
      await ensureInitialized();
      const conditions = [];
      const values = [];

      if (filters.category && filters.category !== 'All') {
        values.push(filters.category.toLowerCase());
        conditions.push(`LOWER(category) = $${values.length}`);
      }
      if (filters.department && filters.department !== 'All') {
        values.push(`%${filters.department.toLowerCase()}%`);
        conditions.push(`(LOWER(department) LIKE $${values.length} OR department = 'All Branches')`);
      }
      if (filters.venueId && filters.venueId !== 'All') {
        values.push(filters.venueId);
        conditions.push(`venue_id = $${values.length}`);
      }
      if (filters.search) {
        values.push(`%${filters.search.toLowerCase()}%`);
        const idx = values.length;
        conditions.push(
          `(LOWER(title) LIKE $${idx} OR LOWER(COALESCE(tagline,'')) LIKE $${idx} OR LOWER(category) LIKE $${idx} OR LOWER(department) LIKE $${idx} OR LOWER(coordinator_name) LIKE $${idx} OR LOWER(venue_name) LIKE $${idx})`
        );
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows } = await pool.query(`SELECT * FROM events ${where} ORDER BY created_at DESC`, values);
      return rows.map(mapEventRow);
    },

    async getEventById(id) {
      await ensureInitialized();
      const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
      return mapEventRow(rows[0]);
    },

    async createEvent(data) {
      await ensureInitialized();
      const id = `EVT-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const { rows } = await pool.query(
        `INSERT INTO events (
          id, title, tagline, category, department, club_name, venue_id, venue_name,
          start_date, end_date, registration_deadline, capacity, registered_count,
          team_type, entry_fee, prize_pool, description, rules, schedule, image_url,
          status, coordinator_name, coordinator_phone, coordinator_email, faculty_advisor
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
        ) RETURNING *`,
        [
          id, data.title, data.tagline || '', data.category, data.department || 'Multidisciplinary',
          data.club_name || 'Student Activity Committee', data.venue_id, data.venue_name,
          data.start_date, data.end_date || data.start_date, data.registration_deadline || data.start_date,
          data.capacity || 100, data.team_type || 'Individual', data.entry_fee || 'Free',
          data.prize_pool || 'Certificate of Merit', data.description || '',
          JSON.stringify(data.rules || []), JSON.stringify(data.schedule || []),
          data.image_url, data.status || 'approved', data.coordinator_name,
          data.coordinator_phone || '', data.coordinator_email || '', data.faculty_advisor || ''
        ]
      );
      return mapEventRow(rows[0]);
    },

    async updateEvent(id, updates) {
      await ensureInitialized();
      const fields = [];
      const values = [];
      for (const [k, v] of Object.entries(updates)) {
        if (['status', 'title', 'capacity', 'venue_id', 'venue_name'].includes(k) && v !== undefined) {
          values.push(v);
          fields.push(`${k} = $${values.length}`);
        }
      }
      if (!fields.length) return this.getEventById(id);
      values.push(id);
      const { rows } = await pool.query(
        `UPDATE events SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );
      return mapEventRow(rows[0]);
    },

    async deleteEvent(id) {
      await ensureInitialized();
      const res = await pool.query('DELETE FROM events WHERE id = $1', [id]);
      return res.rowCount > 0;
    },

    async getVenues() {
      await ensureInitialized();
      const { rows } = await pool.query('SELECT * FROM venues ORDER BY id ASC');
      return rows;
    },

    async getUsers() {
      await ensureInitialized();
      const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
      return rows.map(mapUserRow);
    },

    async getUserById(id) {
      await ensureInitialized();
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return mapUserRow(rows[0]);
    },

    async getUserByEmailOrRguktId(identifier) {
      await ensureInitialized();
      const idf = (identifier || '').trim().toLowerCase();
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(COALESCE(rgukt_id, \'\')) = $1 LIMIT 1',
        [idf]
      );
      return mapUserRow(rows[0]);
    },

    async createUser(userData) {
      await ensureInitialized();
      const rolePrefix = (userData.role || 'STU').slice(0, 3).toUpperCase();
      const newId = `USR-${rolePrefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const pwHash = hashPassword(userData.password);
      const avatar = userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.full_name || 'User')}`;
      const { rows } = await pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, rgukt_id, department, year, phone, hostel, club_name, avatar_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          newId, userData.email, pwHash, userData.full_name, userData.role || 'student',
          userData.rgukt_id || null, userData.department || 'Engineering', userData.year || 'E3',
          userData.phone || '', userData.hostel || '', userData.club_name || '', avatar
        ]
      );
      return mapUserRow(rows[0]);
    },

    async updateUser(id, updates) {
      await ensureInitialized();
      const allowed = ['avatar_url', 'phone', 'hostel', 'club_name', 'department', 'year', 'full_name', 'password_hash'];
      const mapped = { ...updates };
      if (mapped.password !== undefined) {
        mapped.password_hash = mapped.password.startsWith('scrypt$') ? mapped.password : hashPassword(mapped.password);
        delete mapped.password;
      }
      const fields = [];
      const values = [];
      for (const [k, v] of Object.entries(mapped)) {
        if (allowed.includes(k) && v !== undefined) {
          values.push(v);
          fields.push(`${k} = $${values.length}`);
        }
      }
      if (!fields.length) return this.getUserById(id);
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      const { rows } = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );
      return mapUserRow(rows[0]);
    },

    async getRegistrations(filters = {}) {
      await ensureInitialized();
      const conditions = [];
      const values = [];
      if (filters.userId) {
        values.push(filters.userId);
        conditions.push(`user_id = $${values.length}`);
      }
      if (filters.eventId) {
        values.push(filters.eventId);
        conditions.push(`event_id = $${values.length}`);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows } = await pool.query(`SELECT * FROM registrations ${where} ORDER BY created_at DESC`, values);
      return rows.map(mapRegRow);
    },

    async createRegistration(data) {
      await ensureInitialized();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const evtRes = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [data.event_id]);
        const evt = evtRes.rows[0];
        if (!evt) throw new Error('Event not found');
        if (evt.registered_count >= evt.capacity) {
          throw new Error('Event capacity reached. Registrations closed.');
        }

        const dupRes = await client.query(
          `SELECT id FROM registrations WHERE event_id = $1 AND (user_id = $2 OR student_id = $3) LIMIT 1`,
          [data.event_id, data.user_id, data.student_id]
        );
        if (dupRes.rows.length > 0) {
          throw new Error('Student is already registered for this event');
        }

        const regId = `REG-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const ticketCode = `RKV-${data.event_id.replace('EVT-2026-', '')}-${(data.student_id || 'USR').slice(-4)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        const insRes = await client.query(
          `INSERT INTO registrations (
            id, event_id, user_id, student_name, student_id, email, department, year, phone,
            team_name, team_members, ticket_code, check_in_status,
            payment_status, payment_amount, payment_mode, transaction_id
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'not_checked_in',$13,$14,$15,$16
          ) RETURNING *`,
          [
            regId, data.event_id, data.user_id, data.student_name, data.student_id,
            data.email, data.department, data.year, data.phone,
            data.team_name, data.team_members, ticketCode,
            data.payment_status, data.payment_amount, data.payment_mode, data.transaction_id
          ]
        );

        await client.query('UPDATE events SET registered_count = registered_count + 1 WHERE id = $1', [data.event_id]);
        await client.query('COMMIT');
        return mapRegRow(insRes.rows[0]);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async updateRegistrationPayment(regId, paymentStatus) {
      await ensureInitialized();
      const { rows } = await pool.query(
        'UPDATE registrations SET payment_status = $1, payment_date = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [paymentStatus, regId]
      );
      return mapRegRow(rows[0]);
    },

    async verifyTicket(ticketCode) {
      await ensureInitialized();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(
          'SELECT * FROM registrations WHERE ticket_code = $1 OR id = $1 FOR UPDATE',
          [ticketCode]
        );
        const reg = rows[0];
        if (!reg) {
          await client.query('ROLLBACK');
          return { valid: false, message: 'Invalid or unrecognized Ticket Code' };
        }
        if (reg.check_in_status === 'checked_in') {
          await client.query('ROLLBACK');
          return {
            valid: false,
            alreadyCheckedIn: true,
            registration: mapRegRow(reg),
            message: `Ticket was ALREADY checked in on ${reg.checked_in_at || 'earlier session'}`
          };
        }
        const upd = await client.query(
          `UPDATE registrations SET check_in_status = 'checked_in', checked_in_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
          [reg.id]
        );
        const evtRes = await client.query('SELECT * FROM events WHERE id = $1', [reg.event_id]);
        await client.query('COMMIT');
        return {
          valid: true,
          registration: mapRegRow(upd.rows[0]),
          event: mapEventRow(evtRes.rows[0]),
          message: 'Ticket successfully verified! Gate access granted.'
        };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async getAnnouncements() {
      await ensureInitialized();
      const { rows } = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
      return rows;
    },

    async createAnnouncement(data) {
      await ensureInitialized();
      const id = `ANN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const { rows } = await pool.query(
        `INSERT INTO announcements (id, title, content, priority, issued_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id, data.title, data.content, data.priority || 'info', data.issued_by || 'University Dean']
      );
      return rows[0];
    }
  };
}

module.exports = { createPostgresAdapter };
