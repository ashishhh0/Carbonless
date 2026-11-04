import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { CHALLENGES, progressOf } from './carbon'

export default function Challenges({ uid, trips, joined, friends }) {
  const [pick, setPick] = useState(null)
  const [err, setErr] = useState('')
  const jmap = Object.fromEntries(joined.map(j => [j.id, j]))
  async function join(c, mode, f) {
    setErr('')
    const data = { mode, joinedAt: Date.now(), ...(f ? { friendUid: f.uid, friendName: f.name } : {}) }
    try { await setDoc(doc(db, 'users', uid, 'joined', c.id), data); setPick(null) }
    catch { setErr('Could not join. Friends must be accepted friends first.') }
  }
  return (
    <div className="grid">
      {err && <p className="error banner" role="alert">{err}</p>}
      {CHALLENGES.map(c => {
        const j = jmap[c.id]
        const p = progressOf(c.id, trips, j ? j.joinedAt : Infinity)
        return (
          <div className="card" key={c.id}>
            <h3>{c.type} <span className="pill">+{c.points} XP</span></h3>
            <h2 className="ch">{c.icon} {c.name}</h2>
            <p className="muted">{c.desc}</p>
            <p className="small muted">Duration: {c.days} · Badge: {c.badge}</p>
            <div className="bar"><i style={{ width: p.pct + '%' }} /></div>
            <p className="small muted">{j ? `${p.label} (${p.pct}%)` : 'Join to start tracking'}</p>
            {j
              ? <p className="mint">✓ Joined {j.mode === 'friend' ? `with ${j.friendName}` : 'solo'}</p>
              : <div className="two">
                  <button className="btn primary" onClick={() => join(c, 'solo')}>Join solo</button>
                  <button className="btn" onClick={() => setPick(pick === c.id ? null : c.id)}>Join with friend</button>
                </div>}
            {pick === c.id && !j && (
              <div className="pickbox">
                {friends.length === 0 && <p className="muted small">Add and accept a friend first (Friends tab).</p>}
                {friends.map(f => <button key={f.uid} className="chip" onClick={() => join(c, 'friend', f)}>👥 {f.name}</button>)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
