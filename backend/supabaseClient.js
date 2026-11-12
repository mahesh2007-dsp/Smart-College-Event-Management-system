// Supabase Client Integration for Smart CEMS
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

let supabase = null;
const isConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_URL !== 'https://your-project.supabase.co');

if (isConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[SUPABASE] Connected to cloud Supabase instance successfully.');
  } catch (err) {
    console.warn('[SUPABASE] Initialization failed, using local SQL store:', err.message);
  }
} else {
  console.log('[STORAGE] Supabase credentials not set in ENV. Running with robust Local SQL Storage Engine.');
}

module.exports = {
  supabase,
  isConfigured
};
