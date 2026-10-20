import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { estimate } from '../src/js/estimate.js'

/* ข้อมูลทดสอบ ตัวเลขสมมติล้วน ไม่ใช่ราคาจริง */
const data = {
  vatIncluded: true,
  kinds: [{ id: 'round' }, { id: 'collar' }],
  bands: [
    { id: 'a', label: '10–20', min: 10, max: 20 },
    { id: 'b', label: '200 ขึ้นไป', min: 200, max: null },
  ],
  prices: { round: { a: 100, b: 80 }, collar: { a: 150, b: null } },
  options: [
    { id: 'sleeve', name: 'แขนยาว', add: 10 },
    { id: 'pocket', name: 'กระเป๋าอก', add: null },
  ],
}

test('ราคาครบ คิดราคาต่อตัวรวมออปชัน และช่วงยอดรวมตามช่วงจำนวน', () => {
  const r = estimate(data, { kind: 'round', band: 'a', options: ['sleeve'] })
  assert.equal(r.ok, true)
  assert.equal(r.perUnit, 110)
  assert.equal(r.low, 1100)
  assert.equal(r.high, 2200)
  assert.equal(r.vatIncluded, true)
  assert.deepEqual(r.missing, [])
})

test('ช่วงจำนวนปลายเปิด ยอดรวมมีแค่ขั้นต่ำ', () => {
  const r = estimate(data, { kind: 'round', band: 'b', options: [] })
  assert.equal(r.low, 16000)
  assert.equal(r.high, null)
})

test('ราคาที่ยังไม่ยืนยัน (null) ห้ามคิดเป็นศูนย์ ต้องบอกว่าขาดอะไร', () => {
  const r = estimate(data, { kind: 'collar', band: 'b', options: ['pocket'] })
  assert.equal(r.ok, false)
  assert.equal(r.perUnit, null)
  assert.equal(r.low, null)
  assert.deepEqual(r.missing, ['ราคา collar ช่วง 200 ขึ้นไป', 'ออปชัน กระเป๋าอก'])
})

test('ตัวเลือกที่ไม่มีอยู่จริงต้องพัง ไม่เดาให้', () => {
  assert.throws(() => estimate(data, { kind: 'nope', band: 'a', options: [] }), /nope/)
  assert.throws(() => estimate(data, { kind: 'round', band: 'z', options: [] }), /z/)
  assert.throws(() => estimate(data, { kind: 'round', band: 'a', options: ['x'] }), /x/)
})

test('ข้อมูลจริงตอนนี้ยังไม่มีราคายืนยัน ต้องไม่โชว์ตัวเลขใดเลย', () => {
  const real = JSON.parse(readFileSync(new URL('../src/data/pricing.json', import.meta.url), 'utf8'))
  for (const k of real.kinds) for (const b of real.bands) {
    const r = estimate(real, { kind: k.id, band: b.id, options: real.options.map((o) => o.id) })
    assert.equal(r.ok, false)
    assert.equal(r.perUnit, null)
  }
})
