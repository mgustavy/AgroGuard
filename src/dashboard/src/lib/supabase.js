import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced in the console during development so a missing .env is obvious.
  console.warn('Supabase env vars are not set. Copy .env.example to .env and fill them in.')
}

// Placeholders keep createClient from throwing when env vars are missing, so the
// app still renders; any real auth call then fails and is handled by the UI.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)

