/* 18 พ.ย. 2026 อาร์ต: ราคาสกรีนตามสไลด์ "ขายงานสกรีน DTF" (17 พ.ย. 2026) ใช้จริงแล้ว เปิดบนเว็บได้
   สเปก docs/superpowers/specs/2026-11-18-screen-dtf-pricing-design.md · ตัวเลขในเทสนี้คัดจากตารางในสเปกตรงๆ */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
const P = read('prices.json')
const S = P.products.screen
const lead = read('lead-times.json')

test('ขั้นต่ำ · ขนาดลาย 5 ขนาด · ช่วงจำนวน', () => {
  assert.equal(S.tech, 'DTF')
  assert.equal(S.minQty, 5); assert.equal(S.maxQty, 1000)
  assert.deepEqual(S.sizes.map((s) => [s.id, s.cm]), [['A7', '7 × 10'], ['A6', '10 × 15'], ['A5', '15 × 20'], ['A4', '20 × 30'], ['A3', '30 × 40']])
  assert.deepEqual(S.own.bands, [[5, 20], [21, 50], [51, 100], [101, 300], [301, 500], [501, 1000]])
  assert.deepEqual(S.extra.bands, [[20, 50], [51, 100], [101, 300], [301, 500], [501, 1000]])
  assert.deepEqual(S.customer.bands, S.extra.bands)
  assert.equal(S.customer.minQty, 20); assert.equal(S.extra.maxSpots, 3)
})

test('เสื้อ + สกรีน 1 จุด (C32)', () => {
  assert.deepEqual(S.own.first, {
    A7: [220, 190, 170, 155, 150, 145], A6: [220, 195, 175, 160, 150, 145], A5: [220, 200, 180, 165, 155, 150],
    A4: [220, 210, 190, 175, 160, 150], A3: [245, 235, 215, 200, 190, 185],
  })
})

test('จุดที่ 2–3', () => {
  assert.deepEqual(S.extra.price, {
    A7: [25, 20, 20, 15, 15], A6: [30, 25, 20, 20, 15], A5: [30, 30, 25, 20, 20], A4: [40, 35, 30, 30, 25], A3: [60, 50, 50, 45, 40],
  })
})

test('สกรีนบนเสื้อของคุณ 1 จุด', () => {
  assert.deepEqual(S.customer.first, {
    A7: [35, 30, 25, 20, 18], A6: [40, 35, 30, 25, 22], A5: [45, 40, 35, 30, 27], A4: [60, 50, 45, 40, 35], A3: [80, 75, 70, 65, 60],
  })
})

test('เสื้อ 2 รุ่น · สี · ไซซ์ · บวกเพิ่ม', () => {
  const [c32, c20] = S.shirts
  assert.equal(c32.id, 'premium'); assert.equal(c20.id, 'oversize')
  assert.deepEqual(c32.colors.map((c) => c[0]), ['ดำ', 'ขาว', 'กรม', 'ครีม', 'เบจ', 'ควันบุหรี่', 'ช็อกโกแลต', 'ฟ้า'])
  assert.equal(c32.colors.at(-1)[2], 'สอบถามสต็อก')
  assert.deepEqual(c32.sizes, [['S', 38, 26], ['M', 40, 27], ['L', 42, 28], ['XL', 44, 29], ['2XL', 46, 30], ['3XL', 48, 31], ['4XL', 50, 32], ['5XL', 52, 33]])
  assert.equal(c32.add, 0); assert.equal(c32.bigAdd, 20); assert.equal(c32.bigFrom, '2XL')
  assert.deepEqual(c20.colors.map((c) => c[0]), ['ดำ', 'ขาว'])
  assert.deepEqual(c20.sizes, [['S', 42, 28], ['L', 46, 30.5], ['2XL', 52, 32]])
  assert.equal(c20.add, 30); assert.equal(c20.bigAdd, 0)
  assert.deepEqual(S.cols.map((c) => c.id), ['premium', 'oversize'])
})

test('เงื่อนไข: ค่าส่ง · มัดจำ · วันผลิต', () => {
  assert.deepEqual(S.shipping, { upTo: 20, fee: 50 })
  assert.equal(S.freeDesignFrom, 21); assert.equal(S.deposit, 300); assert.equal(S.payFullBelow, 3000)
  assert.equal(S.sampleFreeFrom, 100); assert.equal(S.fileFix, 100); assert.equal(S.nameAdd, 10); assert.equal(S.quoteDays, 15)
  assert.deepEqual(S.lead, [[1, 50, '1–2 วัน'], [51, 100, '3–5 วัน'], [101, 300, '7 วัน']])
  assert.equal(lead.screen.tech, 'งานสกรีน DTF'); assert.equal(lead.screen.days, '1–7 วัน')
})

test('เมทริกซ์ยาวเท่าจำนวนช่วง · ช่วงต่อกันไม่เว้นไม่ซ้อน', () => {
  for (const [m, bands] of [[S.own.first, S.own.bands], [S.extra.price, S.extra.bands], [S.customer.first, S.customer.bands]]) {
    for (const row of Object.values(m)) assert.equal(row.length, bands.length)
    bands.forEach(([, max], i) => i && assert.equal(bands[i][0], bands[i - 1][1] + 1, `${max}`))
  }
})

test('ไม่มีข้อมูลภายในของเซลล์ / ชื่อเก่า DFT ในข้อมูลสกรีน', () => {
  assert.doesNotMatch(JSON.stringify(S) + JSON.stringify(lead.screen), /HUB|มั่ง|หัวหน้าทีม|เซลห้าม|DFT|โรงงาน/)
})
