/* 18 พ.ย. 2026 เครื่องคิดราคาสกรีน DTF (src/js/screen-price.js) · ตัวอย่างจากสไลด์ "ขายงานสกรีน DTF" ต้องได้ตรงทุกตัว
   สเปก docs/superpowers/specs/2026-11-18-screen-dtf-pricing-design.md หัวข้อ "ตัวอย่างจากสไลด์" */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bandIndex, screenQuote, screenLead, screenPay, screenFrom } from '../src/js/screen-price.js'

const S = JSON.parse(readFileSync(new URL('../src/data/prices.json', import.meta.url), 'utf8')).products.screen
const q = (o) => screenQuote(S, { service: 'own', shirt: 'premium', big: 0, ...o })

test('ตัวอย่างจากสไลด์: เสื้อ + สกรีน', () => {
  assert.equal(q({ qty: 35, spots: ['A4'], big: 3 }).total, 7410)
  const a = q({ qty: 80, spots: ['A4', 'A4'] }); assert.equal(a.unit, 225); assert.equal(a.total, 18000)
  const b = q({ qty: 120, spots: ['A7', 'A3', 'A7'] }); assert.equal(b.unit, 240); assert.equal(b.total, 28800); assert.deepEqual(b.spots, ['A3', 'A7', 'A7'])
  const c = q({ qty: 60, spots: ['A3', 'A7'] }); assert.equal(c.unit, 235); assert.equal(c.total, 14100)
  assert.equal(q({ qty: 30, spots: ['A3', 'A7'] }).unit, 260)
  assert.equal(q({ qty: 30, shirt: 'oversize', spots: ['A7'] }).unit, 220)
  assert.equal(q({ qty: 20, spots: ['A4'] }).total, 4450)
  const d = q({ qty: 21, spots: ['A4'] }); assert.equal(d.total, 4410); assert.equal(d.shipping, 0)
})

test('ตัวอย่างจากสไลด์: สกรีนบนเสื้อของคุณ', () => {
  const r = screenQuote(S, { service: 'customer', qty: 40, spots: ['A4', 'A7'], big: 0 })
  assert.equal(r.unit, 85); assert.equal(r.total, 3400); assert.equal(r.shipping, 0)
  const low = screenQuote(S, { service: 'customer', qty: 15, spots: ['A4'] })
  assert.equal(low.ok, false); assert.equal(low.reason, 'belowMin'); assert.equal(low.min, 20)
})

test('แผนชำระ: มัดจำ 300 → 50% → ก่อนส่ง · ต่ำกว่า 3,000 จ่ายเต็ม', () => {
  assert.deepEqual(screenPay(S, 7410), { deposit: 300, atProduction: 3405, beforeShip: 3705, full: false })
  assert.deepEqual(screenPay(S, 2500), { deposit: 300, atProduction: 2200, beforeShip: 0, full: true })
})

test('ขอบช่วงจำนวน (Review Focus)', () => {
  const B = S.own.bands
  for (const [qty, i] of [[5, 0], [20, 0], [21, 1], [50, 1], [51, 2], [100, 2], [101, 3], [300, 3], [301, 4], [500, 4], [501, 5], [1000, 5], [1001, -1], [4, -1]]) assert.equal(bandIndex(B, qty), i, `qty ${qty}`)
  assert.equal(q({ qty: 4, spots: ['A4'] }).reason, 'belowMin')
  assert.equal(q({ qty: 1001, spots: ['A4'] }).reason, 'aboveMax')
})

test('5–20 ตัว จุดเพิ่มใช้ช่อง 20–50 · ลายเล็กกรอกก่อน ลายใหญ่ยังเป็นจุดแรก', () => {
  const r = q({ qty: 10, spots: ['A7', 'A4'] })
  assert.deepEqual(r.spots, ['A4', 'A7']); assert.equal(r.unit, 220 + 25)
})

test('ไซซ์ใหญ่: นับไม่เกินจำนวนเสื้อ · Oversize ไม่บวก +20', () => {
  assert.equal(q({ qty: 30, spots: ['A7'], big: 99 }).total, 190 * 30 + 20 * 30)
  assert.equal(q({ qty: 30, shirt: 'oversize', spots: ['A7'], big: 5 }).total, 220 * 30)
  assert.equal(screenQuote(S, { service: 'customer', qty: 30, spots: ['A7'], big: 5 }).total, 35 * 30)
})

test('จุดเกิน 3 / ไม่มีจุด → ไม่คำนวณ', () => {
  assert.equal(q({ qty: 30, spots: ['A7', 'A7', 'A7', 'A7'] }).reason, 'tooManySpots')
  assert.equal(q({ qty: 30, spots: [] }).reason, 'noSpot')
})

test('แตกรายการ + วันผลิต', () => {
  const r = q({ qty: 20, shirt: 'premium', spots: ['A3', 'A7'], big: 2 })
  assert.deepEqual(r.lines.map((l) => [l.label, l.per, l.amount]), [
    ['เสื้อ Premium C32 + สกรีนจุดที่ 1 · A3 (30 × 40 ซม.)', 245, 4900],
    ['สกรีนจุดที่ 2 · A7 (7 × 10 ซม.)', 25, 500],
    ['ไซซ์ 2XL ขึ้นไป 2 ตัว', 20, 40],
    ['ค่าส่ง (5–20 ตัว)', null, 50],
  ])
  assert.equal(r.total, 5490); assert.equal(r.lead, '1–2 วัน')
  assert.equal(screenLead(S, 50), '1–2 วัน'); assert.equal(screenLead(S, 51), '3–5 วัน'); assert.equal(screenLead(S, 300), '7 วัน'); assert.equal(screenLead(S, 301), '300 ตัวขึ้นไป แจ้งวันตามงาน')
})

test('screenFrom: ราคาจุดแรกต่ำสุดของแต่ละช่วง (ใช้กับป้าย "เริ่ม")', () => {
  assert.deepEqual(screenFrom(S, 'premium'), [220, 190, 170, 155, 150, 145])
  assert.deepEqual(screenFrom(S, 'oversize'), [250, 220, 200, 185, 180, 175])
})
