import { FACTOR_VERSION, EF_CAR, MODES, fmt } from './carbon'

export async function makeReport({ name, trips, total }) {
  const { jsPDF } = await import('jspdf')
  const d = new jsPDF()
  let y = 20
  const line = (txt, size = 10, gap = 6) => { if (y > 280) { d.addPage(); y = 20 } d.setFontSize(size); d.text(String(txt), 14, y); y += gap }
  line('Carbonless - Carbon Impact Report', 20, 11)
  line(`User: ${name}`)
  line(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`)
  const t0 = trips.length ? new Date(Math.min(...trips.map(t => t.ts))).toLocaleDateString('en-IN') : '-'
  const t1 = trips.length ? new Date(Math.max(...trips.map(t => t.ts))).toLocaleDateString('en-IN') : '-'
  line(`Date range: ${t0} to ${t1}  |  Trips: ${trips.length}`, 10, 9)
  line(`Estimated CO2 avoided: ${fmt(total).replace('₂', '2')}`, 14, 9)
  line('Methodology', 12)
  line(`CO2 avoided = max(0, distance x (EF_car - EF_mode)), factor version ${FACTOR_VERSION}.`)
  line(`Factors (g CO2/km): car ${EF_CAR}, ${Object.entries(MODES).filter(([k]) => k !== 'car').map(([k, m]) => `${k} ${m.ef}`).join(', ')}.`)
  line('Estimates use illustrative distance-based defaults. They are not a certified GHG inventory.', 9, 9)
  line('Trips (most recent 60)', 12)
  trips.slice(0, 60).forEach(t => line(`${new Date(t.ts).toLocaleDateString('en-IN')}  ${MODES[t.mode]?.label}  ${t.km} km  +${t.saved} g${t.locality ? '  ' + t.locality : ''}`, 9, 5))
  d.save('carbonless-report.pdf')
}
