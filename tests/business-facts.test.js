/* ข้อเท็จจริงที่อาร์ตเคาะ 26 ต.ค. 2026 (docs/audit/2026-10-26-homepage-deep-audit.md) ต้องตรงกันทุกหน้า
   - สกรีนของทีมดีมีแค่ DFT ไม่มีบล็อกสกรีน
   - เปิดทำการทุกวัน · วันผลิตเริ่มนับวันถัดจากวันยืนยันแบบ (วันที่ 1) · โอนมัดจำทีหลังนับจากวันที่โอน · งานด่วนเร็วสุด 7 วันทำการ ไม่มีค่าเร่ง
   - เงื่อนไขที่ยืนยันแล้ว (scripts/v22/claims.mjs): เคลม 7 วันหลังรับสินค้า · สั่งเพิ่มแบบเดิมราคาเดิม 30 วันหลังรับเสื้อ · มัดจำ 50%
   - คำสัญญาที่ยังไม่ยืนยันห้ามขึ้นเว็บ: สีตรงล็อตเดิม · ส่งเสื้อตัวอย่างให้ลองฟรี
   ตรวจที่ต้นข้อมูลกับแม่แบบ (ไม่ต้อง build) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const walk = (d, ok) => readdirSync(d).flatMap((f) => {
  const p = join(d, f)
  return statSync(p).isDirectory() ? walk(p, ok) : ok(f) ? [p] : []
})
/* ข้อความที่ขึ้นหน้าเว็บ · legacy-posts.json เป็นบทความเดิมบนเว็บจริง (ชื่อเรื่อง/คำโปรย) ไม่ใช่ของเรา */
const sources = () => [
  ...walk(join(root, 'src/data'), (f) => f.endsWith('.json') && f !== 'legacy-posts.json'),
  ...walk(join(root, 'site'), (f) => f.endsWith('.html')),
  ...walk(join(root, 'src/partials'), (f) => f.endsWith('.hbs')),
]
const hits = (re) => sources().flatMap((f) => (readFileSync(f, 'utf8').match(re) || []).map((m) => `${f.slice(root.length + 1)}: ${m}`))
const texts = (o) => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(texts) : [])

test('สกรีนมีแค่ DFT: ไม่มีบล็อกสกรีน ขนาดบล็อก หรือคิดราคาตามจำนวนบล็อก', () => {
  assert.deepEqual(hits(/บล็อกสกรีน|ขนาดบล็อก|บล็อกแยก|ต่อบล็อก/g), [])
  /* DFT วิธีเดียว ไม่คิดตามจำนวนสี · ไม่มีค่าเร่ง */
  assert.deepEqual(hits(/เลือกวิธีสกรีน|วิธีสกรีนที่เหมาะ|จำนวนสีและขนาดลาย|ความเร่งของกำหนดส่ง/g), [])
  const lead = read('src/data/lead-times.json')
  assert.equal(lead.screen.days, '3–14 วัน')
  assert.match(lead.screen.more, /สเกลงาน.*จุดสกรีน.*ความยากง่าย/)
})

test('เวลาผลิต: เปิดทำการทุกวัน · นับวันถัดจากวันยืนยันแบบ · งานด่วนไม่มีค่าเร่ง · ไม่เหลือจุดเริ่มนับแบบเก่า', () => {
  const lead = read('src/data/lead-times.json')
  assert.match(lead.open, /เปิดทำการทุกวัน/)
  assert.match(lead.start, /วันถัดจากวันยืนยันแบบ/)
  assert.match(lead.rush, /ไม่มีค่าเร่ง/)
  assert.match(lead.rush, /เร็วสุด 7 วัน/)
  assert.match(lead.deposit, /วันที่โอน/)
  assert.match(lead.note, /เปิดทำการทุกวัน/)
  assert.ok(lead.note.includes(lead.start) && lead.note.includes(lead.deposit) && lead.note.includes(lead.season) && lead.note.includes(lead.rush), lead.note)
  /* เปิดทำการทุกวัน → ใช้คำว่า "วัน" ไม่ใช้ "วันทำการ" (อาร์ตเคาะ 26 ต.ค.) */
  assert.deepEqual(hits(/วันทำการ/g), [])
  assert.deepEqual(hits(/หลังสรุปแบบและชำระมัดจำ|ชำระมัดจำเรียบร้อยแล้ว|นับหลังสรุปแบบ/g), [])
})

test('คำสัญญาที่ยังไม่ยืนยันไม่ขึ้นเว็บ · เงื่อนไขไม่เขียนหลวมกว่าที่ยืนยันแล้ว', () => {
  assert.deepEqual(hits(/(?:สีและลาย|สีกับลาย)จะตรงกับล็อตเดิม|ระยะเวลาและขอบเขตการแก้ไขระบุในเอกสาร|แจ้งกลับมาให้เร็วที่สุดหลังได้รับของ|เราส่งเสื้อตัวอย่างไปให้ลองก่อนได้|เราส่งไปให้ก่อน|7 วันหลังรับเสื้อ|ตรงครับ เราเก็บรหัสสี|ยืมเสื้อตัวอย่าง|เงื่อนไขการชำระเงิน ?แจ้งให้ทราบก่อนยืนยัน|งวดชำระเงินแจ้งให้ทราบ/g), [])
})

test('/faq/ ตอบเงื่อนไขชุดเดียวกับหน้าแรก', () => {
  const full = read('src/data/faq.json').full.flatMap((c) => c.items)
  const a = (re) => full.find(([q]) => re.test(q))?.[1] || ''
  assert.match(a(/พบปัญหา/), /7 วันหลังรับสินค้า/)
  assert.match(a(/สั่งซ้ำ/), /30 วันหลังรับเสื้อ/)
  assert.match(a(/จ่ายเงิน/), /มัดจำ 50%/)
  assert.match(a(/งานด่วน/), /ไม่มีค่าเร่ง/)
  assert.match(a(/เริ่มนับ/), /วันถัดจากวันยืนยันแบบ/)
})

test('คู่มือจัดส่งและหลังการขาย: บอกเคลม 7 วันกับสั่งเพิ่ม 30 วันตรงกับหน้าแรก', () => {
  const t = texts(read('src/data/guide-pages.json').delivery).join(' ')
  assert.match(t, /7 วันหลังรับสินค้า/)
  assert.match(t, /30 วันหลังรับเสื้อ/)
})

test('แบบที่พิมพ์ลาย (tech print) ไม่ติดป้ายสินค้าโปโลปัก', () => {
  const bad = read('src/data/designs.json').filter((d) => d.tech === 'print' && (d.product || []).includes('polo')).map((d) => d.code)
  assert.deepEqual(bad, [])
})
