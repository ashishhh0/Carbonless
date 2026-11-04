export const EF_CAR = 192 // g CO2 / km (illustrative passenger-car baseline)
export const FACTOR_VERSION = '2026.1-illustrative'
export const MODES = {
  walk: { label: 'Walk', ef: 0, icon: '🚶' },
  cycle: { label: 'Cycle', ef: 0, icon: '🚲' },
  metro: { label: 'Metro', ef: 41, icon: '🚇' },
  bus: { label: 'Bus', ef: 89, icon: '🚌' },
  car: { label: 'Car', ef: EF_CAR, icon: '🚗' }
}
export const LOCALITIES = [['Wave City', 28.6358, 77.4548], ['Raj Nagar', 28.6928, 77.4472], ['Indirapuram', 28.6415, 77.371], ['Vaishali', 28.649, 77.3397], ['Vasundhara', 28.6592, 77.3731], ['Crossings Republik', 28.6274, 77.4358], ['Kaushambi', 28.6455, 77.3238], ['Sahibabad', 28.6773, 77.344], ['Muradnagar', 28.78, 77.498]]
export const MIN_GROUP = 3 // locality stats are hidden until at least this many trips (privacy)
export const slug = s => s.toLowerCase().replace(/\s+/g, '-')
// CO2 saved (g) = max(0, d × (EF_car − EF_mode))
export const savedGrams = (mode, km) => Math.max(0, Math.round(km * (EF_CAR - MODES[mode].ef)))
export const DIVISIONS = [['Seed', 0, '🌱'], ['Sprout', 1000, '🌿'], ['Tree', 5000, '🌳'], ['Forest', 20000, '🌲'], ['Guardian', 50000, '🌍']]
export const divisionOf = g => [...DIVISIONS].reverse().find(d => g >= d[1])
export const nextDivision = g => DIVISIONS.find(d => d[1] > g)
export const dayKey = ts => new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
const sum = (a, k) => a.reduce((s, t) => s + (t[k] || 0), 0)
export function streakOf(trips) {
  const days = new Set(trips.filter(t => t.saved > 0).map(t => dayKey(t.ts)))
  let n = 0, d = Date.now()
  if (!days.has(dayKey(d))) d -= 864e5
  while (days.has(dayKey(d))) { n++; d -= 864e5 }
  return n
}
export const fmt = g => (g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : Math.round(g) + ' g')

export const MISSIONS = [
  { id: 'walk', label: 'Walk 2 km', xp: 50, check: td => { const v = sum(td.filter(t => t.mode === 'walk'), 'km'); return [v >= 2, `${v.toFixed(1)} / 2 km`] } },
  { id: 'green', label: 'Take a green trip', xp: 75, check: td => { const ok = td.some(t => t.saved > 0); return [ok, ok ? 'done' : 'not yet'] } },
  { id: 'save', label: 'Save 500 g CO₂', xp: 25, check: td => { const v = sum(td, 'saved'); return [v >= 500, `${v} / 500 g`] } }
]

export const CHALLENGES = [
  { id: 'zero-car', type: 'Weekly', name: 'Zero-Car Friday', desc: 'Skip private car trips for a day and move sustainably.', days: '1 day', points: 250, badge: 'Carbon Breaker', icon: '⚡' },
  { id: 'green-streak', type: 'Personal', name: '7-Day Green Streak', desc: 'Log a sustainable trip every day for 7 days.', days: '7 days', points: 300, badge: 'Streak Keeper', icon: '🔥' },
  { id: 'ghaziabad-100', type: 'Local', name: 'Ghaziabad 100 kg Club', desc: 'Your share toward avoiding 100 kg of CO₂.', days: '30 days', points: 500, badge: 'City Saver', icon: '🏙️' },
  { id: 'walk-together', type: 'Friends', name: 'Walk Together', desc: 'Walk or cycle 20 km and unlock social XP.', days: '14 days', points: 350, badge: 'Green Crew', icon: '👟' },
  { id: 'metro-miles', type: 'Weekly', name: 'Metro Miles', desc: 'Complete 25 km by metro instead of car.', days: '7 days', points: 275, badge: 'Rail Runner', icon: '🚇' },
  { id: 'cycle-century', type: 'Personal', name: 'Cycle Century', desc: 'Reach 100 km cycling.', days: '30 days', points: 450, badge: 'Pedal Pro', icon: '🚲' },
  { id: 'bus-buddy', type: 'Friends', name: 'Bus Buddy', desc: 'Take 5 bus trips and keep the circle moving.', days: '14 days', points: 325, badge: 'Transit Team', icon: '🚌' }
]
// Personal progress, counted only from trips logged after the challenge was joined.
export function progressOf(id, trips, joinedAt = Infinity) {
  const t = trips.filter(x => x.ts >= joinedAt)
  const km = m => sum(t.filter(x => x.mode === m), 'km')
  const td = t.filter(x => dayKey(x.ts) === dayKey(Date.now()))
  const map = {
    'zero-car': [td.some(x => x.saved > 0) && !td.some(x => x.mode === 'car') ? 1 : 0, 1, 'day'],
    'green-streak': [Math.min(streakOf(t), 7), 7, 'days'],
    'ghaziabad-100': [sum(t, 'saved') / 1000, 100, 'kg'],
    'walk-together': [km('walk') + km('cycle'), 20, 'km'],
    'metro-miles': [km('metro'), 25, 'km'],
    'cycle-century': [km('cycle'), 100, 'km'],
    'bus-buddy': [t.filter(x => x.mode === 'bus').length, 5, 'trips']
  }
  const [v, goal, u] = map[id]
  return { pct: Math.min(100, Math.round((v / goal) * 100)), label: `${+v.toFixed(1)} / ${goal} ${u}` }
}
