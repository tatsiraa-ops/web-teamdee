import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { estimate, readCalcQuery, calcSearch, lineText, fromText, barText, tiers } from '../src/js/estimate.js'
import { calcKinds } from '../src/js/prices.js'

/* เครื่องคำนวณ /calculations/ (audit 3.4 calc-01 calc-02 calc-04) · ราคาจริงจาก prices.json ไฟล์เดียว */
const P = JSON.parse(readFileSync(new URL('../src/data/prices.json', import.meta.url), 'utf8'))
const K = calcKinds(P)
const at = (kind, qty, more = {}) => estimate(K, { kind, qty, ...more })

test('ขั้น 1 แยกสกรีน Premium/Oversize พร้อมราคาที่ขั้นต่ำของแต่ละสินค้า', () => {
  assert.deepEqual(K.kinds.map((k) => k.id), ['polo', 'round', 'collar', 'baseball', 'jersey', 'screen', 'screen-oversize'])
  assert.deepEqual(K.kinds.map((k) => k.name), ['โปโลปัก', 'พิมพ์ลายคอกลม/คอวี', 'พิมพ์ลายคอปก', 'เบสบอล', 'Jersey Oversize', 'สกรีน Premium', 'สกรีน Oversize'])
  assert.deepEqual(K.kinds.map((k) => k.from ?? null), [220, 279, 329, 359, 359, 290, 320])
  const screen = K.kinds.at(-1)
  assert.equal(screen.byDesign, undefined)
  assert.equal(screen.minQty, 1)
  assert.equal(K.minQty, 10)
})

test('โปโลมีแถวเลือกผ้า: จูติเป็นค่าเริ่ม · ผ้าที่ราคาเท่ากันทุกช่วงรวมเป็นชิปเดียว · บอกว่ารวมปัก 1 จุด', () => {
  const polo = K.kinds[0]
  assert.equal(polo.fabric, 'juti')
  assert.deepEqual(polo.fabrics.map((f) => [f.id, f.name, f.from]), [
    ['juti', 'จูติ', 220],
    ['tc', 'TC · ทรีคอต · ปีเก้', 260],
    ['endurance', 'Endurance', 350],
    ['drytech', 'ดรายเทค', 390],
  ])
  assert.equal(polo.include, 'รวมปักโลโก้ 1 จุดที่หน้าอก')
  assert.equal(K.kinds.find((k) => k.id === 'round').fabrics, undefined)
})

test('ออปชันใช้กับพิมพ์ลายและโปโล · เบสบอล/Jersey/สกรีนไม่มี (prices.json ไม่ได้ตั้ง options)', () => {
  assert.deepEqual(K.kinds.map((k) => k.options), [true, true, true, false, false, false, false])
})

test('บรรทัดราคาหัวหน้าสร้างจากข้อมูล (calc-06)', () => {
  assert.equal(K.lead, 'สั่ง 10 ตัว: โปโลปัก (ผ้าจูติ) 220 · พิมพ์ลาย 279 บาท/ตัว · สั่งมากยิ่งถูก รวม VAT ส่งฟรี')
})

test('ยอดรวมเป็นตัวเลขเดียว = (ราคาต่อตัว + ออปชัน) × จำนวน · บอกช่วงราคาที่ใช้', () => {
  const r = at('round', 30, { options: ['sleeve'] })
  assert.equal(r.ok, true)
  assert.equal(r.base, 230)
  assert.equal(r.add, 30)
  assert.equal(r.unit, 260)
  assert.equal(r.total, 260 * 30)
  assert.equal(r.band.qty, '21–50 ตัว')
  assert.equal(r.vatIncluded, true)
})

test('ขอบช่วง: 200 ตัวพอดีใช้ราคา "200 ขึ้นไป" (คอกลม 160 · คอปก 210) · 199 ตัวอยู่ช่วง 101–199 (อาร์ตเคาะ 24 ต.ค. ข้อ 7)', () => {
  assert.equal(at('round', 200).unit, 160)
  assert.equal(at('collar', 200).unit, 210)
  assert.equal(at('round', 199).unit, 180)
  assert.equal(at('round', 199).band.qty, '101–199 ตัว')
  assert.equal(at('round', 200).band.qty, '200 ตัวขึ้นไป')
})

test('โปโลคิดตามผ้า · ไม่ระบุผ้าใช้จูติ · ออปชันโปโลราคาเดียวกับพิมพ์ลาย', () => {
  assert.equal(at('polo', 10).unit, 220)
  assert.equal(at('polo', 51, { fabric: 'drytech' }).unit, 370)
  assert.equal(at('polo', 30, { fabric: 'tc', options: ['sleeve', 'oversize', 'pocket'] }).unit, 260 + 30 + 40 + 20)
  assert.equal(at('polo', 30).fabric.name, 'จูติ')
})

test('สินค้าที่ไม่มีออปชัน ไม่นับออปชันที่ส่งมา', () => {
  const r = at('baseball', 30, { options: ['sleeve'] })
  assert.equal(r.unit, 310)
  assert.deepEqual(r.opts, [])
})

test('ช่วงที่ยังไม่มีราคา (เบสบอล/Jersey 1,000 ขึ้นไป) ไม่คิดเป็นศูนย์ ไม่โชว์ยอด', () => {
  const r = at('jersey', 1000)
  assert.equal(r.ok, false)
  assert.equal(r.unit, null)
  assert.equal(r.total, null)
  assert.equal(r.ask, 'ทักถามราคาได้เลย')
  assert.equal(r.band.qty, '1,000 ตัวขึ้นไป')
  assert.equal(at('jersey', 999).unit, 230)
})

test('สกรีนใช้ราคาปกติ รวมจุดแรก เริ่ม 1 ตัว และเกินตารางต้องขอราคา', () => {
  assert.equal(at('screen', 1).total, 290)
  assert.equal(at('screen', 30).total, 8400)
  assert.equal(at('screen-oversize', 30).total, 9300)
  assert.equal(at('screen', 500).unit, 220)
  assert.equal(at('screen', 501).ok, false)
  assert.equal(at('screen', 0).belowMin, true)
  assert.equal(readCalcQuery(K, '?kind=screen&qty=1').qty, 1)
})

test('ต่ำกว่าขั้นต่ำหรือไม่ใช่จำนวนเต็ม ไม่คิดราคา', () => {
  for (const q of [9, 0, -5, 10.5, NaN]) {
    const r = at('round', q)
    assert.equal(r.ok, false, String(q))
    assert.equal(r.belowMin, true, String(q))
    assert.equal(r.total, null)
  }
})

test('ตัวเลือกที่ไม่มีอยู่จริงต้องพัง ไม่เดาให้', () => {
  assert.throws(() => at('nope', 30), /nope/)
  assert.throws(() => at('round', 30, { options: ['x'] }), /x/)
  assert.throws(() => at('polo', 30, { fabric: 'silk' }), /silk/)
})

test('"สั่งเพิ่มอีก N ตัวจะถูกลง" ขึ้นเฉพาะเมื่อยอดรวมลดลงจริง', () => {
  /* 50 × 230 = 11,500 · 51 × 210 = 10,710 → ถูกลง */
  assert.deepEqual(at('round', 50).next, { more: 1, qty: 51, unit: 210, total: 10710 })
  /* 30 × 230 = 6,900 · 51 × 210 = 10,710 → แพงขึ้น ไม่ชวน */
  assert.equal(at('round', 30).next, null)
  /* 199 × 180 = 35,820 · 200 × 160 = 32,000 */
  assert.deepEqual(at('round', 199).next, { more: 1, qty: 200, unit: 160, total: 32000 })
  /* ช่วงสุดท้าย ไม่มีช่วงถัดไป · ช่วงถัดไปไม่มีราคา ไม่ชวน */
  assert.equal(at('round', 300).next, null)
  assert.equal(at('jersey', 999).next, null)
  /* ออปชันบวกทุกตัว ยังเทียบถูก: 50 × 260 = 13,000 · 51 × 240 = 12,240 */
  assert.equal(at('round', 50, { options: ['sleeve'] }).next.total, 12240)
})

test('ไม่มีจำนวนไหนตกสองช่วงหรือไม่มีช่วง ทุกสินค้าที่มีราคา (calc-11)', () => {
  for (const k of K.kinds.filter((x) => !x.byDesign)) {
    for (let q = 10; q <= 2500; q++) assert.ok(at(k.id, q).band, `${k.id} ${q}`)
  }
})

test('อ่านค่าจาก URL: kind qty fabric opt · ค่าแปลกทิ้ง · ?band= เดิมใช้ต้นช่วง', () => {
  assert.deepEqual(readCalcQuery(K, '?kind=polo&qty=73&fabric=drytech&opt=sleeve,pocket'), { kind: 'polo', qty: 73, fabric: 'drytech', options: ['sleeve', 'pocket'] })
  /* ผ้าที่รวมชิปกัน (ปีเก้ → ชิป TC) */
  assert.equal(readCalcQuery(K, '?kind=polo&fabric=pique').fabric, 'tc')
  assert.deepEqual(readCalcQuery(K, '?kind=xx&qty=5&fabric=silk&opt=x'), { kind: null, qty: null, fabric: null, options: [] })
  assert.deepEqual(readCalcQuery(K, ''), { kind: null, qty: null, fabric: null, options: [] })
  assert.equal(readCalcQuery(K, '?kind=collar&band=200%2B').qty, 200)
  assert.equal(readCalcQuery(K, '?band=21-50').qty, 21)
  assert.equal(readCalcQuery(K, '?qty=12abc').qty, null)
  /* ออปชันของสินค้าที่ไม่มีออปชันถูกทิ้ง */
  assert.deepEqual(readCalcQuery(K, '?kind=baseball&opt=sleeve').options, [])
})

test('เขียนค่าลง URL แล้วอ่านกลับได้เท่าเดิม', () => {
  const s = { kind: 'polo', fabric: 'endurance', qty: 120, options: ['oversize'] }
  assert.equal(calcSearch(K, s), '?kind=polo&qty=120&fabric=endurance&opt=oversize')
  assert.deepEqual(readCalcQuery(K, calcSearch(K, s)), s)
  assert.equal(calcSearch(K, { kind: 'baseball', qty: 30, fabric: 'juti', options: ['sleeve'] }), '?kind=baseball&qty=30')
})

test('ข้อความ LINE: สินค้า ผ้า จำนวน ออปชัน ราคาต่อตัว ยอดรวม · ไม่มีข้อมูลส่วนตัว', () => {
  const t = lineText(at('polo', 30, { options: ['sleeve'] }))
  assert.equal(t, [
    'ขอราคาเสื้อจากเครื่องคำนวณบนเว็บ',
    'สินค้า: โปโลปัก (รวมปักโลโก้ 1 จุดที่หน้าอก)',
    'ผ้า: จูติ',
    'จำนวน: 30 ตัว',
    'ออปชัน: แขนยาว +30',
    'ราคาต่อตัว: 250 บาท',
    'ยอดรวม: 7,500 บาท (รวม VAT 7%)',
  ].join('\n'))
  assert.doesNotMatch(t, /ชื่อ|เบอร์|อีเมล|โทร/)
  const sc = lineText(at('screen', 40))
  assert.match(sc, /สินค้า: สกรีน/)
  assert.match(sc, /จำนวน: 40 ตัว/)
  assert.match(sc, /รวมสกรีน 1 จุด/)
  assert.match(sc, /ยอดรวม: 11,200 บาท/)
  assert.match(lineText(at('baseball', 1200)), /ราคาต่อตัว: ขอให้ทีมดีประเมิน/)
})

test('สรุปที่ส่งไปฟอร์ม (?from=) และแถบล่างมือถือ', () => {
  assert.equal(fromText(at('round', 30)), '/calculations/ · พิมพ์ลายคอกลม/คอวี · 30 ตัว · 230 บาท/ตัว · รวม 6,900 บาท')
  assert.equal(fromText(at('polo', 30, { fabric: 'drytech', options: ['pocket'] })), '/calculations/ · โปโลปัก · ผ้าดรายเทค · 30 ตัว · กระเป๋าอก · 410 บาท/ตัว · รวม 12,300 บาท')
  assert.equal(fromText(at('screen', 30)), '/calculations/ · สกรีน Premium · 30 ตัว · 280 บาท/ตัว · รวม 8,400 บาท')
  assert.deepEqual(barText(at('round', 30)), { main: '6,900 บาท', sub: '230/ตัว · 30 ตัว' })
  assert.deepEqual(barText(at('screen', 30)), { main: '8,400 บาท', sub: '280/ตัว · 30 ตัว' })
  assert.deepEqual(barText(at('round', 5)), { main: 'ขั้นต่ำ 10 ตัว', sub: '' })
})

test('แถบช่วงราคา (รื้อหน้า 26 ต.ค.): ทุกช่วงของแบบ+ผ้าที่เลือก · ราคารวมออปชันแล้ว · ช่วงปัจจุบัน on · ไม่มีราคา = null · สกรีนไม่มีแถบ', () => {
  const t = tiers(at('round', 30))
  assert.deepEqual(t.map((x) => x.qty), ['10–20 ตัว', '21–50 ตัว', '51–100 ตัว', '101–199 ตัว', '200 ตัวขึ้นไป'])
  assert.deepEqual(t.map((x) => x.unit), [279, 230, 210, 180, 160])
  assert.deepEqual(t.map((x) => x.on), [false, true, false, false, false])
  assert.deepEqual(t.map((x) => x.min), [10, 21, 51, 101, 200])
  const polo = tiers(at('polo', 60, { fabric: 'drytech', options: ['pocket'] }))
  assert.equal(polo[0].unit, 390 + 20)
  assert.equal(polo[1].on, true)
  assert.equal(tiers(at('baseball', 30)).at(-1).unit, null)
  assert.deepEqual(tiers(at('screen', 30)).map(x => x.unit), [290, 280, 260, 240, 220, null])
  assert.ok(tiers(at('round', 5)).every((x) => !x.on))
})

/* ตรวจมือถือ 30 ต.ค. ข้อ 5: คนจัดซื้อส่งใบประเมินให้หัวหน้าดูได้ (แชร์ LINE / Web Share) · ลิงก์เปิดแล้วเห็นตัวเลขชุดเดียวกัน */
import { shareText, lineShareUrl } from '../src/js/estimate.js'
test('ข้อความส่งให้หัวหน้า: หัวเรื่อง · ตัวเลขเดียวกับใบประเมิน · ลิงก์ใบประเมิน · ไม่ใช่ข้อความขอราคาถึงทีมดี', () => {
  const r = { kind: { name: 'เสื้อพิมพ์ลาย' }, fabric: null, qty: 80, opts: [], ok: true, unit: 210, total: 16800, vatIncluded: true }
  const t = shareText(r, 'https://team-dee.com/calculations/?kind=print&qty=80')
  assert.match(t, /^ใบประเมินราคาเบื้องต้น จาก TEAMDEE\n/)
  assert.match(t, /จำนวน: 80 ตัว/)
  assert.match(t, /ยอดรวม: 16,800 บาท \(รวม VAT 7%\)/)
  assert.match(t, /\nดูใบประเมิน: https:\/\/team-dee\.com\/calculations\/\?kind=print&qty=80$/)
  assert.doesNotMatch(t, /ขอราคาเสื้อจากเครื่องคำนวณ/)
  assert.equal(lineShareUrl('ก ข'), `https://line.me/R/share?text=${encodeURIComponent('ก ข')}`)
})
