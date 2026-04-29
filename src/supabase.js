import { createClient } from '@supabase/supabase-js';

// Clés Supabase publiques — la clé "publishable" est conçue pour être
// embarquée dans le bundle front. La protection des données passe par
// la RLS côté Postgres (cf. migrations).
const SUPABASE_URL = 'https://csaequazndafhgotnlif.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F4etOm9rlpGsP9Zkvq7QeQ_xg7lTZfN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
