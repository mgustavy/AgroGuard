const KEY = 'agroguard_authed'

export function signIn() {
  localStorage.setItem(KEY, 'true')
}

export function signOut() {
  localStorage.removeItem(KEY)
}

export function isAuthed() {
  return localStorage.getItem(KEY) === 'true'
}
