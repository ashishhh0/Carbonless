import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, getRedirectResult, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, updateProfile } from 'firebase/auth'
import { auth, googleProvider } from './firebase'

const HINTS = {
  'auth/unauthorized-domain': 'This domain is not authorized. Firebase Console → Authentication → Settings → Authorized domains → add this site.',
  'auth/operation-not-allowed': 'This sign-in method is disabled. For guest login, open Firebase Console → Authentication → Sign-in method → Anonymous → Enable → Save.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/internal-error': 'Firebase could not complete sign-in. Check that Anonymous sign-in is enabled in Firebase Console.',
  'auth/popup-closed-by-user': 'Sign-in window was closed before finishing.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/email-already-in-use': 'This email already has an account — switch to Sign in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
}

export default function AuthScreen() {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState('in')
  const [f, setF] = useState({ name: '', email: '', pw: '' })
  const fail = e => { setErr(HINTS[e.code] || e.message || 'Sign-in failed. Please try again.'); setBusy(false) }
  useEffect(() => { getRedirectResult(auth).catch(fail) }, [])

  async function google() {
    setErr(''); setBusy(true)
    try { await signInWithPopup(auth, googleProvider) }
    catch (e) {
      if (['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/operation-not-supported-in-this-environment'].includes(e.code))
        return signInWithRedirect(auth, googleProvider).catch(fail)
      fail(e)
    }
  }
  async function email(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (mode === 'up') { const c = await createUserWithEmailAndPassword(auth, f.email, f.pw); await updateProfile(c.user, { displayName: f.name || 'Commuter' }) }
      else await signInWithEmailAndPassword(auth, f.email, f.pw)
    } catch (x) { fail(x) }
  }
  async function guest() {
    if (busy) return
    setErr('')
    setBusy(true)
    try {
      // Firebase Anonymous Auth creates a real UID so Firestore rules can safely
      // scope the guest's trips and profile to users/{uid}.
      await signInAnonymously(auth)
      // App switches to Dashboard through onAuthStateChanged.
    } catch (e) {
      if (e.code === 'auth/operation-not-allowed') {
        setErr('Guest login is disabled in Firebase. Enable Authentication → Sign-in method → Anonymous, then Save and reload this page.')
      } else {
        setErr(HINTS[e.code] || e.message || 'Guest sign-in failed. Check your internet connection and try again.')
      }
      setBusy(false)
    }
  }
  const set = k => e => setF({ ...f, [k]: e.target.value })

  return (
    <main className="auth">
      <section className="card auth-card">
        <h1 className="brand">Carbonless<span>.</span></h1>
        <p className="muted">Track the CO₂ your commute keeps out of the air.</p>
        <button className="btn google" onClick={google} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
          Continue with Google
        </button>
        <p className="muted small">or with email</p>
        <form onSubmit={email}>
          {mode === 'up' && <input className="field" placeholder="Your name" value={f.name} onChange={set('name')} aria-label="Name" />}
          <input className="field" type="email" required placeholder="Email" value={f.email} onChange={set('email')} aria-label="Email" />
          <input className="field" type="password" required minLength={6} placeholder="Password" value={f.pw} onChange={set('pw')} aria-label="Password" />
          <button className="btn primary" disabled={busy}>{mode === 'up' ? 'Create account' : 'Sign in'}</button>
        </form>
        <button className="link" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}</button>
        <button type="button" className="btn ghost" onClick={guest} disabled={busy}>{busy ? 'Connecting…' : 'Continue as guest'}</button>
        {err && <p className="error" role="alert">{err}</p>}
      </section>
    </main>
  )
}
