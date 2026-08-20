/**
 * supabaseAdmin.js
 * Server-only Supabase client using the service_role key (bypasses RLS).
 * Never import this from src/ — it must only run in Node API routes.
 */
import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return createClient(url, serviceKey)
}
