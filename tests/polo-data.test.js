/* 11 พ.ย. 2026 หน้างานปักโฉมใหม่ · ข้อมูลโปโลจากไดรฟ์ "Info ปัก" (TD_Raw Materials/ADD/Info ปัก) ลง src/data/polo.json ที่เดียว
   ค่าในเทสถอดจากภาพในไดรฟ์ตรง ๆ (ผ้า 6 แผ่น · ตารางราคา · ตารางไซซ์ TD_02–04) — ถ้าไดรฟ์เปลี่ยน ต้องแก้ทั้งข้อมูลและเทส */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const P = 'src/data/polo.json'
const polo = () => JSON.parse(readFileSync(P, 'utf8'))
const prices = JSON.parse(readFileSync('src/data/prices.json', 'utf8')).products.polo

test('มีไฟล์ข้อมูลโปโล', () => assert.ok(existsSync(P)))

test('ผ้า 6 ชนิด id ตรงกับตารางราคา prices.json', () => {
  assert.deepEqual(polo().fabrics.map((f) => f.id), prices.cols.map((c) => c.id))
})

test('สเปกผ้าตามแผ่นในไดรฟ์ · ช่องที่ไดรฟ์เป็น "-" = null', () => {
  const f = Object.fromEntries(polo().fabrics.map((x) => [x.id, x]))
  assert.deepEqual(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.gsm])), { juti: 145, tc: 220, tricot: 160, pique: 160, endurance: 210, drytech: 180 })
  assert.equal(f.juti.comp, 'Polyester 100%')
  /* 12 พ.ย. กราฟิกทางการ TEAMDEE-ผ้า Endurance.png (ไดรฟ์): "เส้นใยโพลีเอสเตอร์คุณภาพสูง ความหนา 210 GMS" */
  assert.equal(f.endurance.comp, 'เส้นใยโพลีเอสเตอร์คุณภาพสูง')
  assert.equal(f.drytech.comp, 'ผ้าผสมคอตตอน') // 12 พ.ย. คู่มือ TEAMDEE 9 พ.ย. ระบุ
  for (const x of Object.values(f)) for (const k of ['name', 'en', 'feel', 'plus', 'use', 'note', 'tagline']) assert.ok(x[k] && x[k].length > 3, `${x.id}.${k}`)
  assert.equal(f.juti.tagline, 'เน้นเบา + ประหยัด')
})

test('ชาร์ตสีครบตามไดรฟ์ · รหัสเป็นข้อความ · สีเป็น hex', () => {
  const n = Object.fromEntries(polo().fabrics.map((x) => [x.id, x.colors.length]))
  /* 12 พ.ย. อาร์ต "อันไหนซ้ำลบอันที่ซ้ำ": TC ลบ 11MF (เหลือง) · IW (= 1W) · 31TD · 12DF ตัวที่สอง → 35 → 31 */
  assert.deepEqual(n, { juti: 20, tc: 31, tricot: 29, pique: 29, endurance: 26, drytech: 32 })
  for (const f of polo().fabrics) assert.equal(new Set(f.colors.map((c) => c.code)).size, f.colors.length, `${f.id} มีรหัสสีซ้ำ`)
  for (const f of polo().fabrics) for (const c of f.colors) {
    assert.match(c.hex, /^#[0-9a-f]{6}$/, `${f.id} ${c.code}`)
    assert.ok(c.code && c.code.length <= 9, `${f.id} รหัส ${c.code}`)
  }
  const j = polo().fabrics[0].colors
  assert.equal(j[0].code, 'J-830'); assert.equal(j.at(-1).code, 'J-7945')
})

test('ตารางไซซ์โปโล ชาย/หญิง ตามไดรฟ์ (นิ้ว)', () => {
  const { men, women, tol } = polo().sizes
  /* 12 พ.ย. คู่มือสั่งเสื้อโปโลปัก TEAMDEE (โพสต์ 9 พ.ย.): ทรงชาย XS–11XL · ทรงหญิง XS–7XL */
  assert.equal(men.length, 15); assert.equal(women.length, 11)
  assert.deepEqual(men.find((r) => r[0] === 'M'), ['M', 40, 28])
  assert.deepEqual(men.find((r) => r[0] === '7XL'), ['7XL', 56, 34])
  assert.deepEqual(men.slice(-4), [['8XL', 58, 35], ['9XL', 60, 35], ['10XL', 62, 36], ['11XL', 64, 37]])
  assert.deepEqual(women.find((r) => r[0] === 'M'), ['M', 36, 26])
  assert.deepEqual(women.at(-1), ['7XL', 52, 30])
  assert.match(tol, /0\.5.*1 นิ้ว/)
  assert.match(JSON.stringify(polo().sizes.measure), /คูณ 2/, 'วิธีวัดรอบอก: วัดกว้างใต้รักแร้แล้วคูณ 2')
})

test('แบบเสื้อมาตรฐาน 6 ข้อ + เริ่ม 10 ตัว', () => {
  const p = polo()
  assert.equal(p.spec.length, 6)
  const s = JSON.stringify(p.spec)
  /* 12 พ.ย. ขนาดปักอก: แผ่นราคา ต.ค. เขียน "นิ้ว" · คู่มือ TEAMDEE 9 พ.ย. เขียน "ซม." (ใหม่กว่า ละเอียดกว่า) → ยึด ซม. */
  for (const w of ['6–6.5 ซม.', '3 เม็ด', '2 นิ้ว', '0.5 นิ้ว', 'ปกทอ', 'แขนปล่อย']) assert.ok(s.includes(w), w)
  assert.equal(p.minQty, 10)
})

test('ราคาโปโลใน prices.json ตรงตารางในไดรฟ์ (Artboard 2 copy@2x)', () => {
  assert.deepEqual(prices.bands[0].price, { juti: 220, tc: 260, tricot: 260, pique: 260, endurance: 350, drytech: 390 })
  assert.deepEqual(prices.bands.at(-1).price, { juti: 170, tc: 190, tricot: 190, pique: 190, endurance: 250, drytech: 300 })
})

test('คู่มือสั่งเสื้อโปโลปัก TEAMDEE: ตำแหน่งปัก 6 · ปก 6 · สาบ 6 · ปลายแขน 6 · กระเป๋า 4 · ตัดต่อ 6 · ตัวอย่าง · จัดส่ง', () => {
  const g = polo().guide
  assert.deepEqual(g.positions.map((x) => x.s.match(/\d+(–\d+(\.\d+)?)? ซม\./)?.[0] || null), ['6–6.5 ซม.', '6–6.5 ซม.', '7 ซม.', '10 ซม.', '15 ซม.', null])
  assert.deepEqual(Object.fromEntries(g.groups.map((x) => [x.k, x.items.length])), { col: 6, plk: 6, slv: 6, pkt: 4, cut: 6 })
  for (const grp of g.groups) for (const it of grp.items) assert.ok(existsSync(`public/img/emb-guide/${it.img}.webp`), it.img)
  assert.match(JSON.stringify(g.groups.find((x) => x.k === 'pkt')), /4\.5 × 5 นิ้ว.*4 × 4\.5 นิ้ว/)
  assert.match(JSON.stringify(g.sample), /100 ตัว/)
  assert.match(JSON.stringify(g.sample), /มัดจำ 50%/)
  assert.equal(g.delivery.ways.length, 3)
  assert.doesNotMatch(JSON.stringify(g), /โรงงาน/, 'ห้ามคำว่าโรงงาน')
})
