import { useEffect, useState } from 'react'
import { MODES, EF_CAR, LOCALITIES, MISSIONS, dayKey, fmt, savedGrams } from './carbon'

export function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return <span className="mono clock">{t.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
}

export function TripLogger({ onLog }) {
  const [mode, setMode] = useState('metro')
  const [km, setKm] = useState('5')
  const [loc, setLoc] = useState('')
  const [state, setState] = useState('')
  const d = parseFloat(km) || 0
  const valid = d > 0 && d <= 500
  async function submit(e) {
    e.preventDefault()
    if (!valid || state === 'saving') return
    setState('saving')
    try { setState(await onLog(mode, d, loc)); setTimeout(() => setState(''), 2500) }
    catch { setState('error') }
  }
  return (
    <form className="card" onSubmit={submit}>
      <h3>Log a trip</h3>
      <div className="modes" role="radiogroup" aria-label="Transport mode">
        {Object.entries(MODES).map(([k, m]) => (
          <button type="button" key={k} role="radio" aria-checked={mode === k} className={'chip' + (mode === k ? ' on' : '')} onClick={() => setMode(k)}>{m.icon} {m.label}</button>
        ))}
      </div>
      <label className="muted small" htmlFor="km">Distance (km)</label>
      <input id="km" className="field" type="number" min="0.1" max="500" step="0.1" value={km} onChange={e => setKm(e.target.value)} />
      <label className="muted small" htmlFor="loc">Locality (optional · adds to anonymous city totals)</label>
      <select id="loc" className="field" value={loc} onChange={e => setLoc(e.target.value)}>
        <option value="">Don’t share</option>
        {LOCALITIES.map(l => <option key={l[0]}>{l[0]}</option>)}
      </select>
      <p className="formula mono">CO₂ saved = d × (EF<sub>car</sub> − EF<sub>mode</sub>) = {d || 0} × ({EF_CAR} − {MODES[mode].ef})</p>
      <div className="preview">{fmt(valid ? savedGrams(mode, d) : 0)} <small>kept out of the air</small></div>
      <button className="btn primary" disabled={!valid || state === 'saving'}>
        {state === 'saving' ? 'Saving…' : state === 'saved' ? '✓ Logged' : state === 'queued' ? 'Queued · syncs when online' : 'Log trip'}
      </button>
      {state === 'error' && <p className="error" role="alert">Could not save. Check Firestore rules and your connection.</p>}
    </form>
  )
}

export function WeekChart({ trips }) {
  const days = Array.from({ length: 7 }, (_, i) => dayKey(Date.now() - (6 - i) * 864e5))
  const vals = days.map(k => trips.filter(t => dayKey(t.ts) === k).reduce((s, t) => s + t.saved, 0))
  const max = Math.max(...vals, 1)
  return (
    <div className="card">
      <h3>Last 7 days (g CO₂)</h3>
      <svg viewBox="0 0 280 120" className="chart" role="img" aria-label="CO2 saved per day">
        {vals.map((v, i) => {
          const h = Math.round((v / max) * 80)
          return <g key={i}>
            <rect x={i * 40 + 8} y={90 - h} width="24" height={Math.max(h, 2)} rx="5" fill="var(--mint)" opacity={v ? 1 : .25} />
            <text x={i * 40 + 20} y="108" textAnchor="middle" fontSize="9" fill="var(--muted)">{days[i].slice(8)}</text>
            {v > 0 && <text x={i * 40 + 20} y={84 - h} textAnchor="middle" fontSize="8" fill="var(--muted)">{v}</text>}
          </g>
        })}
      </svg>
    </div>
  )
}

export function ModeSplit({ trips }) {
  const tot = trips.length || 1
  return (
    <div className="card">
      <h3>Mode split</h3>
      {trips.length === 0 && <p className="muted">Log trips to see your mix.</p>}
      {Object.entries(MODES).map(([k, m]) => {
        const n = trips.filter(t => t.mode === k).length
        return n > 0 && <div key={k} className="split"><span>{m.icon} {m.label}</span><div className="bar"><i style={{ width: (n / tot) * 100 + '%' }} /></div><b className="mono">{n}</b></div>
      })}
    </div>
  )
}

export function Missions({ trips, claims, onClaim }) {
  const today = dayKey(Date.now())
  const td = trips.filter(t => dayKey(t.ts) === today)
  const claimed = new Set(claims.filter(c => c.day === today).map(c => c.missionId))
  const xpToday = MISSIONS.filter(m => claimed.has(m.id)).reduce((s, m) => s + m.xp, 0)
  return (
    <div className="card">
      <h3>Today’s missions <span className="pill">{xpToday} XP today</span></h3>
      {MISSIONS.map(m => {
        const [ok, prog] = m.check(td)
        const got = claimed.has(m.id)
        return (
          <div key={m.id} className={'row' + (got ? ' done' : '')}>
            <span className="tick">{got ? '✓' : ''}</span>
            <span className="grow">{m.label}<small className="muted"> · {prog}</small></span>
            <button className="tiny" disabled={!ok || got} onClick={() => onClaim(m)}>{got ? 'Claimed' : `Claim +${m.xp}`}</button>
          </div>
        )
      })}
      <p className="muted small">One claim per mission per day; the claim record can’t be edited or repeated.</p>
    </div>
  )
}

export function Leaderboard({ rows, me }) {
  return (
    <div className="card">
      <h3>Leaderboard</h3>
      {rows.length === 0 && <p className="muted">No one yet — log the first trip.</p>}
      {rows.map((r, i) => (
        <div key={r.id} className={'row' + (r.id === me ? ' me' : '')}>
          <b className="rank mono">#{i + 1}</b><span className="grow">{r.name}{r.id === me && ' (you)'}</span><b className="mono">{fmt(r.totalSaved || 0)}</b>
        </div>
      ))}
    </div>
  )
}

export function Recent({ trips }) {
  return (
    <div className="card">
      <h3>Recent trips</h3>
      {trips.length === 0 && <p className="muted">Nothing logged yet.</p>}
      {trips.slice(0, 6).map(t => (
        <div className="row" key={t.id}><span>{MODES[t.mode]?.icon} {MODES[t.mode]?.label} · {t.km} km{t.locality ? ' · ' + t.locality : ''}</span><span className="grow" /><b className="mono">+{t.saved} g</b></div>
      ))}
    </div>
  )
}
