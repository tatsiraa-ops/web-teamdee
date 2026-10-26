import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { bandLabel, bandId, qtyText, bandFor, calcPricing, productPrice, priceFact, heroPrice, priceLine, useQuote, calcHref } from '../src/js/prices.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const P = JSON.parse(read('src/data/prices.json'))
const lead = JSON.parse(read('src/data/lead-times.json'))
const priced = Object.entries(P.products).filter(([, p]) => p.bands)

test('ป้ายช่วงจำนวนสร้างจากตัวเลข · ใส่จุลภาค · ช่วงปลายเปิดเป็น "ขึ้นไป"', () => {
  assert.equal(bandLabel({ min: 10, max: 20 }), '10–20')
  assert.equal(bandLabel({ min: 1001, max: 2000 }), '1,001–2,000')
  assert.equal(bandLabel({ min: 200, max: null }), '200 ขึ้นไป')
  assert.equal(qtyText({ min: 10, max: 20 }), '10–20 ตัว')
  assert.equal(qtyText({ min: 2001, max: null }), '2,001 ตัวขึ้นไป')
  assert.equal(bandId({ min: 101, max: 199 }), '101-199')
  assert.equal(bandId({ min: 200, max: null }), '200+')
})

test('ทุกสินค้า: ช่วงจำนวนเรียงต่อกัน ไม่ชนกัน ไม่เว้นช่อง เริ่มที่ขั้นต่ำ และช่วงสุดท้ายเท่านั้นที่ปลายเปิด', () => {
  for (const [id, p] of priced) {
    assert.equal(p.bands[0].min, P.minQty, `${id} เริ่มที่ขั้นต่ำ`)
    p.bands.forEach((b, i) => {
      assert.ok(Number.isInteger(b.min), `${id} ${i} min เป็นตัวเลข`)
      if (i < p.bands.length - 1) {
        assert.ok(Number.isInteger(b.max) && b.max >= b.min, `${id} ${bandLabel(b)} max เป็นตัวเลข`)
        assert.equal(p.bands[i + 1].min, b.max + 1, `${id}: ${bandLabel(b)} กับ ${bandLabel(p.bands[i + 1])} ต้องต่อกันพอดี`)
      } else assert.equal(b.max, null, `${id} ช่วงสุดท้ายปลายเปิด`)
      for (const c of p.cols) assert.ok(c.id in b.price, `${id} ${bandLabel(b)} มีราคาคอลัมน์ ${c.id}`)
    })
  }
})

test('จำนวนใดก็ตกช่วงเดียว · ขอบ 200 (พิมพ์ลาย) และ 1,000 (เบสบอล/Jersey) ใช้ช่วง "ขึ้นไป" (อาร์ตเคาะ 24 ต.ค. ข้อ 7)', () => {
  for (const [id, p] of priced) {
    for (let q = P.minQty; q <= 3000; q++) {
      const hits = p.bands.filter((b) => q >= b.min && (b.max === null || q <= b.max))
      assert.equal(hits.length, 1, `${id} ${q} ตัว ตก ${hits.length} ช่วง`)
    }
  }
  assert.equal(bandFor(P.products.print, 200).price.round, 160)
  assert.equal(bandFor(P.products.print, 200).price.collar, 210)
  assert.equal(bandLabel(bandFor(P.products.print, 199)), '101–199')
  assert.equal(bandLabel(bandFor(P.products.baseball, 1000)), '1,000 ขึ้นไป')
  assert.equal(bandLabel(bandFor(P.products.jersey, 999)), '501–999')
  assert.equal(bandFor(P.products.print, 9), null)
})

test('ตารางราคาหน้าเครื่องคำนวณอ่านจาก prices.json ไฟล์เดียว · ช่วงเดียวกับตารางพิมพ์ลาย · สกรีนไม่มีตัวเลข', () => {
  const C = calcPricing(P)
  assert.deepEqual(C.bands.map((b) => b.id), ['10-20', '21-50', '51-100', '101-199', '200+'])
  assert.deepEqual(C.bands.map((b) => b.label), ['10–20', '21–50', '51–100', '101–199', '200 ขึ้นไป'])
  assert.deepEqual(C.bands.map((b) => b.qty), ['10–20 ตัว', '21–50 ตัว', '51–100 ตัว', '101–199 ตัว', '200 ตัวขึ้นไป'])
  assert.deepEqual(C.kinds.map((k) => k.id), ['round', 'collar', 'screen'])
  assert.equal(C.kinds.find((k) => k.id === 'screen').byDesign, true)
  assert.equal(C.prices.round['10-20'], 279)
  assert.equal(C.prices.round['200+'], 160)
  assert.equal(C.prices.collar['101-199'], 230)
  for (const b of C.bands) assert.equal(C.prices.screen[b.id], null)
  assert.equal(C.vatIncluded, true)
})

test('ไม่มีไฟล์ราคาที่สอง · vite.config ไม่ดึงเลขราคาด้วย regex', () => {
  assert.ok(!readdirSync(new URL('../src/data/', import.meta.url)).includes('pricing.json'))
  const vite = read('vite.config.js')
  assert.doesNotMatch(vite, /pricing\.json/)
  assert.doesNotMatch(vite, /\.exec\(box\.strong\)/)
})

test('กล่องราคาหน้าสินค้าเป็นขั้นบันได บอกจำนวนทั้งสองปลาย (P3)', () => {
  const print = productPrice(P, 'print')
  assert.equal(print.box.amount, '279 → 160')
  assert.equal(print.box.unit, 'บาท/ตัว')
  assert.match(print.box.p, /^คอกลม \/ คอวี 10–20 ตัว → 200 ตัวขึ้นไป · คอปก \+50 ทุกช่วง/)
  const polo = productPrice(P, 'polo')
  assert.equal(polo.box.amount, '220')
  assert.equal(polo.box.p, 'ผ้าจูติ 10–50 ตัว · ผ้าอื่น 260–390 · รวมปักโลโก้ 1 จุดที่หน้าอก')
  const bb = productPrice(P, 'baseball')
  assert.equal(bb.box.amount, '359 → 230')
  assert.match(bb.box.p, /^10–20 ตัว → 501–999 ตัว/)
  assert.match(bb.box.p, /1,000 ตัวขึ้นไป ทักถามราคาได้เลย/)
  assert.equal(productPrice(P, 'screen'), null)
  assert.equal(productPrice(P, 'warmup'), null)
})

test('ตารางราคาหน้าสินค้าสร้างจาก bands · ป้ายช่วงใหม่ 101–199 · ช่องไม่มีราคาเป็นข้อความถาม', () => {
  const t = productPrice(P, 'print').table
  assert.deepEqual(t.head, ['จำนวน (ตัว)', 'คอกลม / คอวี', 'คอปก / คอวีปก / คอปกคางหมู'])
  assert.deepEqual(t.rows.map((r) => r[0]), ['10–20', '21–50', '51–100', '101–199', '200 ขึ้นไป'])
  assert.deepEqual(t.rows[4], ['200 ขึ้นไป', '160', '210'])
  const bb = productPrice(P, 'baseball').table
  assert.deepEqual(bb.rows.at(-2), ['501–999', '230'])
  assert.deepEqual(bb.rows.at(-1), ['1,000 ขึ้นไป', 'ทักถามราคาได้เลย'])
  assert.equal(productPrice(P, 'polo').table.rows.at(-1)[0], '2,001 ขึ้นไป')
})

test('ค่าเพิ่ม แขนยาว / Oversize / กระเป๋า ใช้กับโปโลราคาเดียวกับพิมพ์ลาย (ข้อ 7) · เบสบอลไม่มี', () => {
  const line = 'เพิ่มต่อตัว: แขนยาว +30 บาท · ทรง Oversize +40 บาท · กระเป๋าอก +20 บาท'
  assert.ok(productPrice(P, 'print').notes.includes(line))
  assert.ok(productPrice(P, 'polo').notes.includes(line))
  assert.ok(!productPrice(P, 'baseball').notes.includes(line))
})

test('ลิงก์ไปเครื่องคำนวณมี ?kind= ตรงสินค้า · สินค้าที่เครื่องคิดเป็นตัวเลขไม่ได้ไม่มีลิงก์', () => {
  assert.equal(calcHref(P, 'print', '/calculations/'), '/calculations/?kind=round')
  assert.equal(productPrice(P, 'print', { calcUrl: '/calculations/' }).calcHref, '/calculations/?kind=round')
  assert.equal(calcHref(P, 'polo', '/calculations/'), '/calculations/?kind=polo')
  assert.equal(calcHref(P, 'baseball', '/calculations/'), '/calculations/?kind=baseball')
  assert.equal(calcHref(P, 'jersey', '/calculations/'), '/calculations/?kind=jersey')
  for (const id of ['screen', 'warmup']) assert.equal(calcHref(P, id, '/calculations/'), null, id)
})

test('การ์ดบริการหน้าแรกบอกจำนวนที่ราคาใช้ได้ (home-02)', () => {
  assert.deepEqual(priceFact(P, 'print'), { v: '279 บาท/ตัว (10–20 ตัว)', sub: 'ลดถึง 160 เมื่อสั่ง 200 ตัวขึ้นไป' })
  assert.deepEqual(priceFact(P, 'polo'), { v: '220 บาท/ตัว', sub: 'ผ้าจูติ 10–50 ตัว รวมปัก 1 จุด' })
  assert.deepEqual(priceFact(P, 'screen'), { v: 'ประเมินตามแบบ' })
  assert.deepEqual(priceFact(P, 'warmup'), { v: 'ทัก LINE ขอราคา' })
})

/* จอแรกหน้าสินค้า (audit P2): แถวราคาแถวเดียวพร้อมจำนวน · ตัวเลขเดียวกับการ์ดหน้าแรก
   สินค้าที่มีราคา 2 คอลัมน์ (พิมพ์ลาย) บอกว่าเป็นราคาคอไหน และส่วนต่างของอีกคอลัมน์ */
test('แถวราคาใน hero หน้าสินค้า บอกจำนวน · พิมพ์ลายบอกคอที่ใช้ราคานี้ + คอปก +50', () => {
  assert.deepEqual(heroPrice(P, 'print'), { v: '279 บาท/ตัว (10–20 ตัว)', sub: 'คอกลม / คอวี · ลดถึง 160 เมื่อสั่ง 200 ตัวขึ้นไป · คอปก +50' })
  assert.deepEqual(heroPrice(P, 'polo'), priceFact(P, 'polo'))
  assert.deepEqual(heroPrice(P, 'baseball'), { v: '359 บาท/ตัว (10–20 ตัว)', sub: 'ลดถึง 230 เมื่อสั่ง 501–999 ตัว' })
  assert.deepEqual(heroPrice(P, 'screen'), { v: 'ประเมินตามแบบ' })
  assert.equal(heroPrice(P, 'nope'), null)
  for (const [id] of priced) { const f = heroPrice(P, id); assert.match(`${f.v} ${f.sub}`, QTY, id) }
})

/* จอแรกหน้ากลุ่มลูกค้า (audit use-03): ราคาบรรทัดเดียว ราคาที่จำนวนน้อยสุดพร้อมจำนวนในวงเล็บ · หลายคอลัมน์บอกผ้า/คอที่ใช้ราคานี้ */
test('ราคาบรรทัดเดียวของ hero หน้ากลุ่ม บอกจำนวน · สินค้าที่ไม่มีตารางราคา = null', () => {
  assert.equal(priceLine(P, 'polo'), '220 บาท/ตัว (ผ้าจูติ 10–50 ตัว)')
  assert.equal(priceLine(P, 'print'), '279 บาท/ตัว (คอกลม / คอวี 10–20 ตัว)')
  assert.equal(priceLine(P, 'baseball'), '359 บาท/ตัว (10–20 ตัว)')
  assert.equal(priceLine(P, 'screen'), null)
  assert.equal(priceLine(P, 'warmup'), null)
  for (const [id] of priced) assert.match(priceLine(P, id), QTY, id)
})

test('ใบราคาย่อหน้ากลุ่มลูกค้า (use-02): ราคา 2 ปลายพร้อมจำนวน + เวลาผลิต · สกรีนประเมินตามแบบ · วอร์มทัก LINE', () => {
  const cards = ['polo', 'print', 'baseball', 'screen', 'warmup'].map((id) => ({ h: id, p: ['x'], to: `products.${id}` }))
  const q = useQuote(P, cards, lead, { askHref: (id) => `line:${id}` })
  const row = (id) => q.rows.find((r) => r.id === id)
  assert.equal(row('polo').amount, '220 → 170')
  assert.equal(row('polo').qty, '10–50 ตัว → 2,001 ตัวขึ้นไป · ผ้าจูติ รวมปัก 1 จุด')
  assert.equal(row('polo').lead, '10–15 วันทำการ')
  assert.equal(row('print').amount, '279 → 160')
  assert.equal(row('print').qty, '10–20 ตัว → 200 ตัวขึ้นไป · คอปก 329 → 210')
  assert.equal(row('print').lead, '15–20 วันทำการ')
  assert.equal(q.leadNote, lead.note)
  assert.equal(row('baseball').amount, '359 → 230')
  assert.equal(row('baseball').qty, '10–20 ตัว → 501–999 ตัว')
  assert.equal(row('screen').text, 'ประเมินตามแบบ')
  assert.equal(row('screen').amount, undefined)
  assert.equal(row('warmup').text, 'ทัก LINE ขอราคา')
  assert.equal(row('warmup').askHref, 'line:warmup')
  assert.equal(q.foot, 'ขั้นต่ำ 10 ตัวทุกสินค้า · ราคานี้รวม VAT 7% + ใบกำกับเต็มรูป · ส่งฟรีตั้งแต่ 10 ตัว · ทุกไซซ์ราคาเดียว')
})

/* ทุกตัวเลขราคาที่ขึ้นหน้าเว็บต้องบอกจำนวนกำกับ · ห้าม "เริ่มต้น 160" ลอย ๆ (audit 2.2) */
const QTY = /[\d,]+\s*(–\s*[\d,]+\s*)?ตัว/
test('ทุกราคาที่หน้าเว็บโชว์ (กล่อง การ์ด ใบราคาย่อ) บอกจำนวนที่ราคานั้นใช้ได้', () => {
  for (const [id] of priced) {
    const { box } = productPrice(P, id)
    assert.match(box.p, QTY, `${id} กล่องราคา`)
    const f = priceFact(P, id)
    assert.match(`${f.v} ${f.sub}`, QTY, `${id} การ์ดหน้าแรก`)
  }
  const cards = priced.map(([id]) => ({ h: id, p: [], to: `products.${id}` }))
  for (const r of useQuote(P, cards, lead, {}).rows) assert.match(r.qty, QTY, `${r.id} ใบราคาย่อ`)
})

test('ไม่มีคำว่า "เริ่มต้น" ตามด้วยราคาโดยไม่บอกจำนวน ทั้งข้อมูล เทมเพลต และหน้าเว็บ', () => {
  const files = [
    ...readdirSync(new URL('../src/data/', import.meta.url)).filter((f) => f.endsWith('.json')).map((f) => `src/data/${f}`),
    ...readdirSync(new URL('../src/partials/', import.meta.url)).filter((f) => f.endsWith('.hbs')).map((f) => `src/partials/${f}`),
    'site/index.html', 'site/calculations/index.html', 'site/contact-us/index.html',
  ]
  const bad = []
  for (const f of files) {
    for (const m of read(f).matchAll(/เริ่ม(?:ต้น)?\s*(?:ที่\s*)?[\d,]{3,}[^"<\n]{0,60}/g)) if (!QTY.test(m[0])) bad.push(`${f}: ${m[0]}`)
  }
  assert.deepEqual(bad, [])
})
