import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { LOCALITIES, MIN_GROUP, fmt, slug } from './carbon'
import { Leaderboard } from './widgets'

function CityMap({ aggs }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null)
  const [L, setL] = useState(null)
  useEffect(() => {
    let dead = false
    import('leaflet').then(m => {
      if (dead) return
      const lib = m.default || m
      map.current = lib.map(el.current, { scrollWheelZoom: false }).setView([28.66, 77.41], 11)
      lib.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 18 }).addTo(map.current)
      layer.current = lib.layerGroup().addTo(map.current)
      setL(lib)
    })
    return () => { dead = true; map.current?.remove() }
  }, [])
  useEffect(() => {
    if (!L || !layer.current) return
    layer.current.clearLayers()
    LOCALITIES.forEach(([name, lat, lng]) => {
      const a = aggs[slug(name)]
      if (!a || a.trips < MIN_GROUP) return
      L.circleMarker([lat, lng], { radius: Math.min(30, 8 + Math.sqrt(a.saved / 200)), color: '#45f0a3', fillColor: '#45f0a3', fillOpacity: .45, weight: 2 })
        .bindPopup(`<b>${name}</b><br>${a.trips} trips · ${fmt(a.saved)} CO₂ avoided`).addTo(layer.current)
    })
  }, [L, aggs])
  return <div className="map" ref={el} role="region" aria-label="Ghaziabad community map" />
}

export default function Community({ board, me, aggs }) {
  return (
    <div className="grid">
      <div className="card wide">
        <h3>Ghaziabad community <span className="pill">live · aggregated</span></h3>
        <CityMap aggs={aggs} />
        <p className="muted small">Only anonymous locality totals are shown, and a locality appears once it has {MIN_GROUP}+ logged trips. No individual locations are stored or displayed.</p>
      </div>
      <div className="card">
        <h3>Localities</h3>
        {LOCALITIES.map(([n]) => {
          const a = aggs[slug(n)]
          return <div className="row" key={n}><span className="grow">{n}</span>{a && a.trips >= MIN_GROUP ? <b className="mono">{a.trips} trips · {fmt(a.saved)}</b> : <span className="muted small">not enough data yet</span>}</div>
        })}
      </div>
      <Leaderboard rows={board} me={me} />
    </div>
  )
}
