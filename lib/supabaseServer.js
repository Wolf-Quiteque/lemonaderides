// lib/supabaseServer.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseFromRequest(req) {
  // Expect Authorization: Bearer <access_token> (we send this from the client)
  const authHeader = req.headers.get('Authorization') || '';
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  });
}

export async function requireRole(req, allowed = []) {
  const supabase = supabaseFromRequest(req);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    const e = new Error('unauthenticated'); e.status = 401; throw e;
  }
  const meta = data.user.app_metadata || data.user.user_metadata || {};
  const role = meta.role || 'employee';
  if (allowed.length && !allowed.includes(role)) {
    const e = new Error('forbidden'); e.status = 403; throw e;
  }
  return { supabase, user: { ...data.user, role } };
}
