import { test } from 'node:test'
import assert from 'node:assert/strict'
import { useView } from '../src/js/use-view.js'

const up = {
  hero: { h1: 'รับทำเสื้อบริษัท', lead: 'เลือก', cta: 'ขอราคา', cta2: 'ดูแบบ', facts: ['ช่วยเลือกแบบ', '[รอยืนยัน: รับบัตรเครดิต] / วางบิล'], imgNote: '' },
  toc: [{ t: 'แบบเสื้อ', key: 'designs' }, { t: 'รีวิว', key: 'reviews' }, { t: 'ภาพลูกค้า', key: 'photos' }, { t: 'FAQ', key: 'faq' }],
  trust: { h: 'ไว้วางใจ', stats: [{ n: '[รอยืนยัน: 8 ปี]', t: 'ดูแล' }], note: 'สถิติรวม' },
  pain: { h: 'คนสั่ง', intro: [], cards: [{ h: 'คุมงบ', p: ['ช่วยเทียบ'] }] },
  contexts: { h: 'ธุรกิจ', cards: [{ h: 'โรงแรม', p: ['วางสี'], img: '[ภาพลูกค้าจริง]' }], links: [{ t: 'รีวิว', to: 'projects' }] },
  designs: { h: 'แบบเสื้อบริษัท', intro: ['เลือกแนว'] },
  products: { h: 'ประเภท', cards: [{ h: 'โปโลปัก', p: ['งานประจำ'], to: 'products.polo' }, { h: 'อื่น', p: [], to: 'products.nope' }] },
  help: { h: 'ไม่แน่ใจ?', p: 'บอกงาน', cta: 'ช่วยเลือก' },
  work: { h: 'ผลงาน' }, reviews: { h: 'รีวิว' },
  benefits: { h: 'ทำไม', cards: [{ h: 'ตรวจร่วมกัน', p: ['ยืนยันแบบ'] }, { h: 'ดูตัวอย่าง', p: ['[รอยืนยัน: ตัวอย่างผ้าฟรี]'] }] },
  plan: { h: 'วางงบ', need: { h: 'ข้อมูล', items: ['ลักษณะงาน'] }, price: { h: 'ราคา', p: ['ประเภทเสื้อ'] }, steps: [{ h: 'สรุป', p: 'เลือก' }], payment: { h: 'เอกสาร', p: ['ออกใบเสร็จได้ · [รอยืนยัน: รับบัตรเครดิต]'] }, links: [], cta: 'สอบถาม' },
  photos: { h: 'ภาพลูกค้า', intro: 'ภาพจากทีม' },
  schedule: { h: 'มีวันใช้แล้ว?', p: 'แจ้งวัน', cta: 'ตรวจแผน' },
  faq: { h: 'คำถาม', items: [['เริ่มได้ไหม?', 'ได้'], ['บัตรเครดิต?', '[รอยืนยัน: รับบัตรเครดิต]']] },
  team: { h: 'ทีมดี', title: 'TEAMDEE', p: ['เริ่มจาก[รอยืนยัน: ในปี 2018]', 'ทุกวัน 08:30–21:00'], links: [{ t: 'รู้จักทีมดี', to: 'about' }] },
  related: { h: 'ใกล้เคียง', links: [{ t: 'กีฬา', to: 'uses.sport' }, { t: 'ร้านค้า', to: 'uses.shop' }] },
}
const has = (k) => !['uses.shop', 'products.nope'].includes(k)
const none = { designs: [], works: [], photos: [] }

test('เว็บจริง: ตัดข้อความรอยืนยัน · ส่วนที่ไม่มีของจริงซ่อน', () => {
  const v = useView(up, none, { forWp: true, has })
  assert.deepEqual(v.hero.facts, ['ช่วยเลือกแบบ'])
  assert.equal(v.trust.show, false)
  assert.equal(v.reviews.show, false)
  assert.equal(v.work.show, false)
  assert.equal(v.photos.show, false)
  assert.equal(v.designs.show, false)
  assert.deepEqual(v.benefits.cards.map((c) => c.h), ['ตรวจร่วมกัน'])
  assert.deepEqual(v.plan.payment, null)
  assert.deepEqual(v.faq.items.map(([q]) => q), ['เริ่มได้ไหม?'])
  assert.deepEqual(v.team.p, ['ทุกวัน 08:30–21:00'])
  assert.equal(v.contexts.show, false, 'ไม่มีภาพลูกค้าเลย = ซ่อนทั้งส่วน (2 พ.ย.)')
})

test('ต้นแบบ: เก็บทุกส่วนไว้พร้อมป้ายรอข้อมูล', () => {
  const v = useView(up, none, { forWp: false, has })
  assert.equal(v.trust.show, true)
  assert.equal(v.benefits.cards.length, 2)
  assert.equal(v.faq.items.length, 2)
})

test('ของจริงมาแทนช่องรอข้อมูล · แบบเสื้อ ผลงาน และภาพลูกค้า', () => {
  const real = { designs: [{ code: 'TD-0001' }], works: [{ id: 'w1' }], photos: [{ img: '/a.webp' }] }
  const v = useView(up, real, { forWp: true, has })
  assert.equal(v.designs.show, true)
  assert.equal(v.work.show, true)
  assert.equal(v.photos.show, true)
})

test('ลิงก์และการ์ดสินค้าที่ชี้ไปหน้าที่ยังไม่มีถูกตัด · สารบัญมีเฉพาะส่วนที่แสดง', () => {
  const v = useView(up, none, { forWp: true, has })
  assert.deepEqual(v.products.cards.map((c) => c.h), ['โปโลปัก'])
  assert.deepEqual(v.related.links.map((l) => l.to), ['uses.sport'])
  assert.deepEqual(v.toc.map((t) => t.key), ['faq'])
})

test('รีวิว: ส่วนขึ้นเมื่อมีรีวิวจริงเท่านั้น ทั้งเว็บจริงและต้นแบบ · สารบัญมีรีวิวตามนั้น (เดิมเว็บจริงขาด "รีวิว" ทุกหน้า)', () => {
  const reviews = [{ id: 'r1' }]
  for (const forWp of [true, false]) {
    const on = useView(up, { ...none, reviews }, { forWp, has })
    assert.equal(on.reviews.show, true)
    assert.deepEqual(on.reviews.items, reviews)
    assert.ok(on.toc.some((t) => t.key === 'reviews'))
    const off = useView(up, none, { forWp, has })
    assert.equal(off.reviews.show, false)
    assert.ok(!off.toc.some((t) => t.key === 'reviews'))
  }
})

test('สถิติที่ยืนยันแล้วอย่างน้อย 2 ตัว → เว็บจริงโชว์ · ตัวที่ยังรอยืนยันถูกตัด', () => {
  const ok = { ...up, trust: { ...up.trust, stats: [{ n: '8 ปี', t: 'ดูแล' }, { n: '2,800+ องค์กร', t: 'ลูกค้า' }, { n: '[รอยืนยัน: 10,000+ งาน]', t: 'งาน' }] } }
  const v = useView(ok, none, { forWp: true, has })
  assert.equal(v.trust.show, true)
  assert.deepEqual(v.trust.stats.map((s) => s.n), ['8 ปี', '2,800+ องค์กร'])
})

test('ส่วนที่มี list แต่ไม่มี [วงเล็บ] ไม่นับว่ารอข้อมูล (เดิม JSON.stringify จับวงเล็บของ array)', () => {
  const v = useView(up, none, { forWp: false, has })
  assert.equal(v.pain.pending, false)
  assert.equal(v.trust.pending, true)
})

test('แบบเสื้อ: ยังไม่มีแบบของกลุ่มนี้ → ต้นแบบโชว์ช่องรอแบบ (หัวข้อ v22 อยู่ครบ) · เว็บจริงซ่อน', () => {
  assert.equal(useView(up, none, { forWp: false, has }).designs.show, true)
  assert.equal(useView(up, none, { forWp: true, has }).designs.show, false)
})

test('การ์ดบริบทงาน: มีภาพลูกค้าจริงของบริบทนั้น → ใช้ภาพจริงแทนช่องรอภาพ ทั้งเว็บจริงและต้นแบบ', () => {
  const photo = { img: '/img/customer/co16.webp', alt: 'ภาพลูกค้า' }
  for (const forWp of [true, false]) {
    const v = useView(up, { ...none, contextPhotos: [photo] }, { forWp, has })
    assert.deepEqual(v.contexts.cards[0].photo, photo)
    assert.equal(v.contexts.cards[0].img, null)
  }
})

/* อาร์ต 4 พ.ย. "ลบตามภาพ" (/corporate/): use-v2.json drop ปิดส่วนเดิมทั้งส่วน · สารบัญตัดลิงก์ไปส่วนที่ปิด · ไม่มี drop = ส่วนปิดหน้ายังขึ้น */
test('drop: ปิดส่วนวางงบ ภาพลูกค้า มีวันใช้ และส่วนปิดหน้า · สารบัญไม่มีลิงก์ไปส่วนที่ปิด', () => {
  const real = { designs: [{}], works: [{}], photos: [{}], reviews: [{}] }
  const v = useView(up, real, { forWp: true, has, drop: ['plan', 'photos', 'schedule', 'end'] })
  for (const k of ['plan', 'photos', 'schedule', 'end']) assert.equal(v[k].show, false, k)
  assert.equal(v.faq.show, true)
  assert.deepEqual(v.toc.map((t) => t.key), ['designs', 'reviews', 'faq'])
  const keep = useView(up, real, { forWp: true, has })
  for (const k of ['plan', 'photos', 'schedule', 'end']) assert.equal(keep[k].show, true, k)
})
