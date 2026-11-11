/* ตรวจความถูกต้องของเนื้อหา (agent ลูกค้า 22 ต.ค. 2026 เจอคำตอบสลับข้อ และขั้นตอนที่เอารายการเตรียมข้อมูลมาวาง) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))

test('หน้ากลุ่มลูกค้า: คำอธิบายขั้นตอน 01–03 ไม่ใช่รายการ "เตรียมข้อมูล" ที่ยกมาวาง', () => {
  const bad = []
  for (const [id, up] of Object.entries(read('../src/data/use-pages.json'))) {
    if (id[0] === '_') continue
    const need = up.plan.need?.items || []
    for (const s of up.plan.steps) if (need.some((n) => n && s.p.includes(n))) bad.push(`${id}: ${s.h} → ${s.p}`)
  }
  assert.deepEqual(bad, [])
})

test('FAQ: คำตอบตรงเรื่องกับคำถามที่เคยสลับกัน', () => {
  const all = []
  const walk = (o) => (Array.isArray(o) && o.length === 2 && o.every((x) => typeof x === 'string') ? all.push(o) : o && typeof o === 'object' && Object.values(o).forEach(walk))
  walk(read('../src/data/faq.json'))
  const answer = (q) => all.filter(([x]) => x.startsWith(q)).map(([, a]) => a)
  for (const a of answer('ส่งไฟล์แบบไหนได้บ้าง')) assert.match(a, /ไฟล์/)
  for (const a of answer('เพิ่มจำนวนหลังยืนยัน')) assert.match(a, /เพิ่ม/)
  assert.ok(answer('ส่งไฟล์แบบไหนได้บ้าง').length > 0)
})

test('หน้ากลุ่มลูกค้า: FAQ ไม่ตอบแบบปฏิเสธลอย ๆ · หน่วยงานไม่ถามเรื่องเครดิตซ้ำ · อีเวนต์/วิ่งบอกว่ารู้ตั้งแต่แรกถ้าไม่ทัน', () => {
  const up = read('../src/data/use-pages.json')
  const neg = []
  for (const [id, v] of Object.entries(up)) if (id[0] !== '_') for (const [q, a] of v.faq.items) if (/ไม่ยืนยัน|ไม่ถือว่า|ไม่รับรอง|อัตโนมัติ/.test(a)) neg.push(`${id}: ${q}`)
  assert.deepEqual(neg, [])
  assert.equal(up.gov.faq.items.filter(([q]) => /เครดิต|เบิกจ่าย|จัดซื้อ/.test(q)).length, 1)
  for (const id of ['event', 'running']) assert.ok(up[id].faq.items.some(([q]) => q.startsWith('ถ้าผลิตไม่ทันวันงาน')), id)
})

test('หน้ากลุ่มลูกค้า: เอกสารและการชำระเงินแยกบรรทัด ให้ข้อที่ยืนยันแล้วยังอยู่บนเว็บจริง', () => {
  for (const [id, v] of Object.entries(read('../src/data/use-pages.json'))) {
    if (id[0] === '_' || !v.plan.payment) continue
    assert.ok(v.plan.payment.p.includes('ออกใบเสร็จ / ใบกำกับภาษีได้'), id)
    /* เอกสารจัดซื้อเฉพาะกลุ่มที่ต้องใช้ (2 พ.ย.) */
    assert.equal(v.plan.payment.p.some((x) => x.startsWith('ขอเอกสารจัดซื้อได้')), ['corp', 'shop', 'gov', 'edu', 'faculty'].includes(id), id)
  }
})

test('หน้ากลุ่มลูกค้า: hero บอกจุดขายที่ยืนยันแล้ว · กลุ่มงานพิมพ์บอกชื่อ-เบอร์รายคน', () => {
  for (const [id, v] of Object.entries(read('../src/data/use-pages.json'))) {
    if (id[0] === '_') continue
    const f = v.hero.facts.join(' | ')
    assert.match(f, /ออกแบบฟรี/, id)
    assert.match(f, /ขั้นต่ำ 10 ตัว/, id)
    if (['sport', 'badminton', 'running', 'event', 'class'].includes(id)) assert.match(f, /ชื่อ-เบอร์รายคน/, id)
  }
})

test('หน้ากลุ่มลูกค้า: ชื่อยาวแบบ "ก / ข / ค" อยู่แค่หัวข้อแบบเสื้อกับ FAQ ไม่ซ้ำทุก H2', () => {
  const up = read('../src/data/use-pages.json')
  for (const u of read('../src/data/uses.json')) {
    if (!u.name.includes(' / ')) continue
    const v = up[u.id]
    const hs = Object.entries(v).filter(([k, x]) => x && typeof x.h === 'string' && !['designs', 'faq'].includes(k) && x.h.includes(u.name)).map(([k]) => k)
    assert.deepEqual(hs, [], u.id)
  }
})

test('หน้ากลุ่มลูกค้า: ทุกหน้ามีกล่องงบ/ราคาในส่วนวางแผน และลิงก์เช็คลิสต์ตาม v22 (ยกเว้นบริษัทที่ v22 ไม่มี)', () => {
  for (const [id, v] of Object.entries(read('../src/data/use-pages.json'))) {
    if (id[0] === '_') continue
    assert.ok(v.plan.price && v.plan.price.p.length, `${id}: ไม่มีกล่องงบ`)
    if (id !== 'corp') assert.ok(v.plan.links.some((l) => l.to === 'posts.checklist'), `${id}: ไม่มีลิงก์เช็คลิสต์`)
  }
})
