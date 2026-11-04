import { describe, it, expect } from 'vitest'
import { savedGrams, streakOf, progressOf, divisionOf, dayKey } from './carbon'

describe('carbon maths', () => {
  it('applies CO2 saved = d × (EFcar − EFmode)', () => {
    expect(savedGrams('walk', 5)).toBe(960)
    expect(savedGrams('metro', 10)).toBe(1510)
    expect(savedGrams('bus', 10)).toBe(1030)
  })
  it('never credits car trips', () => expect(savedGrams('car', 20)).toBe(0))
  it('picks divisions by grams', () => {
    expect(divisionOf(0)[0]).toBe('Seed')
    expect(divisionOf(5000)[0]).toBe('Tree')
  })
})
describe('streak + challenges', () => {
  const now = Date.now()
  it('counts consecutive green days', () => {
    const trips = [0, 1, 2].map(i => ({ ts: now - i * 864e5, saved: 100, mode: 'walk', km: 1 }))
    expect(streakOf(trips)).toBe(3)
  })
  it('ignores trips before joining', () => {
    const trips = [{ ts: now - 5000, saved: 960, mode: 'metro', km: 10 }]
    expect(progressOf('metro-miles', trips, now).pct).toBe(0)
    expect(progressOf('metro-miles', trips, now - 10000).pct).toBe(40)
  })
  it('uses IST day keys', () => expect(dayKey(Date.UTC(2026, 0, 1, 19, 0))).toBe('2026-01-02'))
})
