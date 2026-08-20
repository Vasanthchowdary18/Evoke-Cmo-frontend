/**
 * supabaseClient.js
 * Initialises the Supabase client. Config loaded from environment variables —
 * never hardcoded. This is a test/evaluation integration, separate from the
 * app's real database (Firebase Firestore, see src/firebase.js).
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
