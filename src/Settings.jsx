import { useState } from 'react'
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore'
import { deleteUser, signOut } from 'firebase/auth'
import { auth, db } from './firebase'
import { EF_CAR, FACTOR_VERSION, MODES } from './carbon'
import { makeReport } from './report'

async function wipe(uid, sub) {
  const s = await getDocs(collection(db, 'users', uid, sub))
  for (let i = 0; i < s.docs.length; i += 400) {
    const b = writeBatch(db)
    s.docs.slice(i, i + 400).forEach(d => b.delete(d.ref))
    await b.commit()
  }
}

export default function Settings({ user, name, trips, total }) {
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  async function pdf() { setBusy(true); try { await makeReport({ name, trips, total }) } catch { setMsg('Could not create the PDF.') } setBusy(false) }
  function exportJson() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ name, exportedAt: new Date().toISOString(), factorVersion: FACTOR_VERSION, trips }, null, 2)], { type: 'application/json' }))
    Object.assign(document.createElement('a'), { href: url, download: 'carbonless-data.json' }).click()
    URL.revokeObjectURL(url)
  }
  async function del() {
    if (!confirm('Permanently delete your account, trips and progress? This cannot be undone.')) return
    setBusy(true)
    try {
      for (const s of ['trips', 'missionClaims', 'joined']) await wipe(user.uid, s)
      await deleteDoc(doc(db, 'users', user.uid))
      await deleteUser(auth.currentUser)
    } catch (e) {
      setMsg(e.code === 'auth/requires-recent-login' ? 'Your data was removed. For security, sign out, sign in again, then delete the account once more.' : e.message)
      setBusy(false)
    }
  }
  return (
    <div className="grid">
      <div className="card">
        <h3>Report & data</h3>
        <button className="btn primary" onClick={pdf} disabled={busy || !trips.length}>Download PDF report</button>
        <button className="btn ghost" onClick={exportJson} disabled={!trips.length}>Export my data (JSON)</button>
        {!trips.length && <p className="muted small">Log a trip to enable reports and export.</p>}
        {msg && <p className="error" role="alert">{msg}</p>}
      </div>
      <div className="card">
        <h3>How we calculate</h3>
        <p className="small muted">CO₂ avoided = max(0, d × (EF<sub>car</sub> − EF<sub>mode</sub>)). Factor version <b>{FACTOR_VERSION}</b> (g CO₂/km): car {EF_CAR}, {Object.entries(MODES).filter(([k]) => k !== 'car').map(([k, m]) => `${k} ${m.ef}`).join(', ')}. These are illustrative distance-based defaults, not a certified greenhouse-gas inventory — replace with sourced regional factors before publishing impact claims.</p>
        <h3>Privacy</h3>
        <p className="small muted">Your name and total are visible to other signed-in users. Trip details are private to you. Locality is optional and only adds to anonymous city totals.</p>
      </div>
      <div className="card">
        <h3>Extra Carbonless experience</h3>
        <p className="small muted">Open the original extended interface, which includes additional visualizations, map/community views and legacy dashboard sections. It runs as a separate page and may use its own older data flow.</p>
        <a className="btn ghost" href="/carbonless.html" target="_blank" rel="noreferrer">Open extended UI ↗</a>
      </div>
      <div className="card">
        <h3>Account</h3>
        <button className="btn" onClick={() => signOut(auth)}>Sign out</button>
        <button className="btn danger" onClick={del} disabled={busy}>Delete account & data</button>
      </div>
    </div>
  )
}
