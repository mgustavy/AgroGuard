import { supabase } from './supabase'
import { PRIVACY_POLICY_VERSION } from './privacy'

// Register a field officer. Profile fields are passed as user metadata; a Postgres
// trigger copies them into the profiles table (see supabase/migrations). The trigger
// rejects the sign-up when privacy_policy_version is missing.
export async function signUp({ email, password, fullName, cooperative, district }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        cooperative,
        districts: [district],
        privacy_policy_version: PRIVACY_POLICY_VERSION,
      },
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
    .select('full_name, cooperative, districts, consented_at, privacy_policy_version')
    .eq('id', userId)
    .maybeSingle()
  return data
}

// Permanently erase the signed-in officer's account and profile through the
// delete_own_account database function (see 0002 migration), then clear the session.
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_own_account')
  if (error) throw error
  await supabase.auth.signOut()
}
