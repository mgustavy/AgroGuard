import { supabase } from './supabase'

// Register a field officer. Profile fields are passed as user metadata; a Postgres
// trigger copies them into the profiles table (see supabase/migrations).
export async function signUp({ email, password, fullName, cooperative, district }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, cooperative, districts: [district] },
    },
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, cooperative, districts')
    .eq('id', userId)
    .maybeSingle()
  return data
}
