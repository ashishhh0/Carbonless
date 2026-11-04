import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { collection, doc, increment, limit, onSnapshot, orderBy, query, setDoc, where, writeBatch } from 'firebase/firestore'
import { auth, db } from './firebase'
import { FACTOR_VERSION, divisionOf, nextDivision, fmt, savedGrams, slug, streakOf, dayKey } from './carbon'
import { Clock, TripLogger, WeekChart, ModeSplit, Missions, Leaderboard, Recent } from './widgets'
import Challenges from './Challenges'
import Community from './Community'
import Friends from './Friends'
import Settings from './Settings'

const TABS = [['overview', 'Overview'], ['challenges', 'Challenges'], ['community', 'Community'], ['friends', 'Friends'], ['settings', 'Settings']]
const list = s => s.docs.map(d => ({ id: d.id, ...d.data() }))

export default function Dashboard({ user }) {
  const name = user.displayName || (user.isAnonymous ? 'Guest' : 'Commuter')
  const [tab, setTab] = useState('overview')
  const [d, setD] = useState({ me: {}, trips: [], claims: [], joined: [], board: [], aggs: {}, friends: [], requests: [] })
  const [err, setErr] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const [theme, setTheme] = useState(document.documentElement.dataset.theme)
  const put = k => v => setD(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    addEventListener('online', on); addEventListener('offline', off)
    return () => { removeEventListener('online', on); removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    const onErr = e => setErr(e.code === 'permission-denied' ? 'Firestore rules are blocking access. Publish firestore.rules from this project in Firebase Console.' : e.message)
    setDoc(doc(db, 'users', user.uid), { name, photo: user.photoURL || '' }, { merge: true }).catch(onErr)
    const u = doc(db, 'users', user.uid)
    const subs = [
      onSnapshot(doc(db, 'users', user.uid), s => put('me')(s.data() || {}), onErr),
      onSnapshot(query(collection(u, "trips"), orderBy('ts', 'desc'), limit(300)), s => put('trips')(list(s)), onErr),
      onSnapshot(collection(u, 'missionClaims'), s => put('claims')(list(s)), onErr),
      onSnapshot(collection(u, 'joined'), s => put('joined')(list(s)), onErr),
      onSnapshot(query(collection(db, 'users'), orderBy('totalSaved', 'desc'), limit(10)), s => put('board')(list(s)), onErr),
      onSnapshot(collection(db, 'localityAggregates'), s => put('aggs')(Object.fromEntries(s.docs.map(x => [x.id, x.data()]))), onErr),
      onSnapshot(query(collection(db, 'friendships'), where('members', 'array-contains', user.uid)), s =>
        put('friends')(list(s).map(f => { const o = f.members.find(m => m !== user.uid); return { id: f.id, uid: o, name: f.names?.[o] || 'Friend' } })), onErr),
      onSnapshot(query(collection(db, 'friendRequests'), where('recipientId', '==', user.uid), where('status', '==', 'pending')), s => put('requests')(list(s)), onErr)
    ]
    return () => subs.forEach(x => x())
  }, [user.uid])

  async function logTrip(mode, km, locality) {
    const saved = savedGrams(mode, km)
    const b = writeBatch(db)
    b.set(doc(collection(db, 'users', user.uid, 'trips')), { mode, km, saved, ts: Date.now(), locality, factorVersion: FACTOR_VERSION })
    b.set(doc(db, 'users', user.uid), { name, photo: user.photoURL || '', totalSaved: increment(saved), tripCount: increment(1) }, { merge: true })
    if (locality) b.set(doc(db, 'localityAggregates', slug(locality)), { name: locality, trips: increment(1), saved: increment(saved) }, { merge: true })
    return Promise.race([b.commit().then(() => 'saved'), new Promise(r => setTimeout(() => r('queued'), 8000))])
  }
  const claim = m => { const day = dayKey(Date.now()); return setDoc(doc(db, 'users', user.uid, 'missionClaims', `${day}_${m.id}`), { missionId: m.id, day, xp: m.xp, ts: Date.now() }).catch(e => setErr(e.message)) }
  function flip() {
    const t = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = t; localStorage.setItem('cl-theme', t); setTheme(t)
  }

  const total = d.me.totalSaved || 0
  const div = divisionOf(total), next = nextDivision(total)
  const week = d.trips.filter(t => Date.now() - t.ts < 7 * 864e5).reduce((s, t) => s + t.saved, 0)
  const xp = d.claims.reduce((s, c) => s + (c.xp || 0), 0)
  const pct = next ? Math.round(((total - div[1]) / (next[1] - div[1])) * 100) : 100

  return (
    <div className="app">
      <header className="top">
        <h1 className="brand">Carbonless<span>.</span></h1>
        <div className="grow" />
        <Clock />
        <button className="icon" onClick={flip} aria-label="Toggle light and dark theme">{theme === 'dark' ? '☀' : '☾'}</button>
        <span className="who">{name}</span>
        <button className="icon" onClick={() => signOut(auth)} aria-label="Sign out">⏻</button>
      </header>
      <nav className="tabs" aria-label="Sections">
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k} onClick={() => setTab(k)}>{l}{k === 'friends' && d.requests.length > 0 ? ` (${d.requests.length})` : ''}</button>)}
      </nav>
      {!online && <p className="banner warn" role="status">You’re offline — trips are saved on this device and will sync automatically.</p>}
      {err && <p className="error banner" role="alert">{err} <button className="link" onClick={() => setErr('')}>dismiss</button></p>}
      <main className="wrap">
        {tab === 'overview' && <>
          <section className="stats">
            <div className="card stat"><small className="muted">Total saved</small><b>{fmt(total)}</b></div>
            <div className="card stat"><small className="muted">This week</small><b>{fmt(week)}</b></div>
            <div className="card stat"><small className="muted">Streak</small><b>{streakOf(d.trips)} <em>days</em></b></div>
            <div className="card stat"><small className="muted">XP</small><b>{xp}</b></div>
            <div className="card stat"><small className="muted">Division</small><b>{div[2]} {div[0]}</b>
              <div className="bar"><i style={{ width: pct + '%' }} /></div>
              <small className="muted">{next ? `${fmt(next[1] - total)} to ${next[0]}` : 'Top division'}</small></div>
          </section>
          <section className="grid">
            <TripLogger onLog={logTrip} />
            <WeekChart trips={d.trips} />
            <Missions trips={d.trips} claims={d.claims} onClaim={claim} />
            <ModeSplit trips={d.trips} />
            <Recent trips={d.trips} />
          </section>
        </>}
        {tab === 'challenges' && <Challenges uid={user.uid} trips={d.trips} joined={d.joined} friends={d.friends} />}
        {tab === 'community' && <Community board={d.board} me={user.uid} aggs={d.aggs} />}
        {tab === 'friends' && <Friends user={user} name={name} friends={d.friends} requests={d.requests} />}
        {tab === 'settings' && <Settings user={user} name={name} trips={d.trips} total={total} />}
      </main>
    </div>
  )
}
