import { test } from 'node:test'
import assert from 'node:assert/strict'
import { productView, pending } from '../src/js/product-view.js'

const pp = {
  hero: { h1: 'รับทำเสื้อโปโลปัก', lead: 'ช่วยตรวจ', cta: 'ขอราคา', kicker: 'k', imgNote: 'x',
    facts: [{ k: 'ขั้นต่ำ', v: '[รอยืนยัน]' }, { k: 'ราคา', v: 'ตามผ้า จำนวน และงานปัก' }] },
  toc: [{ t: 'แบบ', key: 'options' }, { t: 'ราคา', key: 'price' }, { t: 'รีวิว', key: 'reviews' }],
  options: { h: 'เลือกแนว', intro: [], cards: [{ h: 'สีพื้น', p: ['ใช้สีองค์กร'] }], links: [{ t: 'ดูเสื้อบริษัท', to: 'uses.corp' }, { t: 'ร้านค้า', to: 'uses.shop' }] },
  fabric: { h: 'ผ้า', intro: ['ดูสัมผัส'], notes: ['[รอยืนยัน: ตัวอย่างผ้าฟรี] · ชิ้นปักมีเงื่อนไขแยก'], links: [] },
  detail: { h: 'รายละเอียด', cards: [{ h: 'ตำแหน่ง', p: ['เทียบโลโก้'] }], links: [] },
  price: { h: 'ราคา', factorsTitle: 'ปัจจัย', factors: ['ผ้า'], need: null,
    box: { strong: 'ราคาเริ่มต้น [รอยืนยัน] บาท', p: '[x]', small: '[y]' },
    table: { head: ['จำนวน', 'ราคา'], rows: [['[1]', '[ราคา]']] }, notes: ['พื้นที่ตารางราคา รอข้อมูลจริง'] },
  quote: { h: 'มีโลโก้แล้ว?', p: 'แจ้งสี', cta: 'ประเมินราคา' },
  production: { h: 'เบื้องหลัง', cards: [{ h: 'ตรวจโลโก้', p: ['ช่วยให้เห็น'] }], notes: ['[รอภาพ]'] },
  work: { h: 'ผลงาน', cards: [{ h: 'โปโล', facts: ['โจทย์: [ข้อมูล]'] }], links: [] },
  reviews: { h: 'รีวิว' },
  size: { h: 'ไซซ์', title: 'เทียบ', p: ['ใช้ตาราง', '[ภาพทรง]'], notes: ['รอตารางขนาดจริง'], links: [{ t: 'ดูตาราง', to: 'guides.size' }] },
  order: { h: 'ขั้นตอน', steps: [{ h: 'เลือก', p: 'ผ้า' }], payment: { h: 'ชำระ', p: ['[รอยืนยัน: มัดจำ 50%] ตรวจเงื่อนไข', 'ออกใบเสร็จได้'] }, links: [] },
  faq: { h: 'คำถาม', items: [['ขั้นต่ำกี่ตัว?', 'ต้องตรวจตามผ้า'], ['ตัวอย่างฟรีไหม?', '[รอยืนยัน: ฟรี] ส่วนชิ้นปัก...']], links: [] },
  uses: { h: 'ตามงาน', links: [{ t: 'บริษัท', to: 'uses.corp' }, { t: 'ร้านค้า', to: 'uses.shop' }], compare: [{ t: 'พิมพ์ลาย', to: 'products.print' }] },
  contact: { h: 'เริ่มสั่ง', p: 'ส่งโลโก้', cta: 'ปรึกษา' },
}
const has = (k) => k !== 'uses.shop'
const real = { works: [], designs: [], fabrics: [{ name: 'ผ้าข้าวโพด', use: 'เสื้อทีม' }], sizes: [{ size: 'M' }] }

test('pending จับข้อความใน [วงเล็บ]', () => {
  assert.equal(pending('ราคา [รอยืนยัน] บาท'), true)
  assert.equal(pending('ตามผ้า จำนวน'), false)
  assert.equal(pending(''), false)
})

test('เว็บจริง: ตัดข้อความที่ยังรอยืนยันทิ้ง แต่ต้นแบบเก็บไว้พร้อมป้าย', () => {
  const wp = productView(pp, real, { forWp: true, has })
  assert.deepEqual(wp.hero.facts.map((f) => f.k), ['ราคา'])
  assert.deepEqual(wp.order.payment.p, ['ออกใบเสร็จได้'])
  assert.deepEqual(wp.faq.items.map(([q]) => q), ['ขั้นต่ำกี่ตัว?'])
  assert.deepEqual(wp.fabric.notes, [])
  const proto = productView(pp, real, { forWp: false, has })
  assert.equal(proto.hero.facts.length, 2)
  assert.equal(proto.faq.items.length, 2)
})

test('ส่วนที่มีแต่ข้อมูลรอยืนยัน ซ่อนบนเว็บจริง · ต้นแบบโชว์และติด pending', () => {
  const wp = productView(pp, real, { forWp: true, has })
  assert.equal(wp.reviews.show, false)
  assert.equal(wp.work.show, false) // ไม่มีงานจริงของสินค้านี้
  assert.equal(wp.price.box, null)
  assert.equal(wp.price.table, null)
  assert.equal(wp.price.show, true) // ยังมีรายการปัจจัยราคา
  const proto = productView(pp, real, { forWp: false, has })
  assert.equal(proto.reviews.show, true)
  assert.equal(proto.reviews.pending, true)
  assert.ok(proto.price.box)
})

test('ลิงก์ไปหน้าที่ยังไม่มีถูกตัดทิ้ง', () => {
  const v = productView(pp, real, { forWp: false, has })
  assert.deepEqual(v.uses.links.map((l) => l.to), ['uses.corp'])
  assert.deepEqual(v.options.links.map((l) => l.to), ['uses.corp'])
})

test('สารบัญในหน้ามีเฉพาะส่วนที่แสดงจริง', () => {
  const wp = productView(pp, real, { forWp: true, has })
  assert.deepEqual(wp.toc.map((t) => t.key), ['options', 'price'])
})

test('งานจริงของสินค้านี้มาแทนช่องตัวอย่างผลงาน', () => {
  const works = [{ id: 'w1', title: 'เสื้อบริษัท', img: '/img/real/r01.jpg' }]
  const v = productView(pp, { ...real, works }, { forWp: true, has })
  assert.equal(v.work.show, true)
  assert.equal(v.work.real.length, 1)
  assert.deepEqual(v.work.cards, [])
})

test('สเปกทรง/คอ/ออปชั่น และรายการผ้าที่ยังรอยืนยัน ถูกตัดบนเว็บจริง', () => {
  const spec = { shape: [['โปโล แขนสั้น', 'หลัก']], collar: [['ปกถัก', 'คลาสสิก'], ['คอจีน', '[ยืนยันว่ามีให้เลือก]']], option: [] }
  const fabrics = [{ name: 'ผ้าข้าวโพด', use: 'ทีม' }, { name: '[ผ้าอื่น]', use: 'รอยืนยัน' }]
  const wp = productView(pp, { ...real, spec, fabrics }, { forWp: true, has })
  assert.deepEqual(wp.options.spec.collar.map((r) => r[0]), ['ปกถัก'])
  assert.deepEqual(wp.options.specTabs.map((t) => t.id), ['shape', 'collar'])
  assert.deepEqual(wp.fabric.fabrics.map((f) => f.name), ['ผ้าข้าวโพด'])
  const proto = productView(pp, { ...real, spec, fabrics }, { forWp: false, has })
  assert.equal(proto.options.spec.collar.length, 2)
  assert.equal(proto.fabric.fabrics.length, 2)
})

test('มีราคาจริง (prices.json) → ใช้แทนช่องรอราคา ทั้งเว็บจริงและต้นแบบ · หมายเหตุรอราคาถูกตัด', () => {
  const price = { box: { strong: '220 บาท / ตัว', p: 'ผ้าจูติ 10–50 ตัว', small: 'ราคารวม VAT 7%' }, table: { head: ['จำนวน', 'ราคา'], rows: [['10–50', '220']] }, notes: ['ราคาจากตารางทีมดี 1 ต.ค. 2026'] }
  for (const forWp of [true, false]) {
    const v = productView(pp, { ...real, price }, { forWp, has })
    assert.equal(v.price.show, true)
    assert.equal(v.price.box.strong, '220 บาท / ตัว')
    assert.deepEqual(v.price.table.rows, [['10–50', '220']])
    assert.deepEqual(v.price.notes, ['ราคาจากตารางทีมดี 1 ต.ค. 2026'])
    assert.equal(v.price.pending, false)
  }
})

test('ยังไม่มีราคาจริง → confirmed false (หน้าโชว์ปุ่มขอราคาทาง LINE แทน) · มีราคาจริง → true', () => {
  for (const forWp of [true, false]) {
    assert.equal(productView(pp, real, { forWp, has }).price.confirmed, false)
    const price = { box: { strong: '220 บาท / ตัว', p: 'ก', small: 'ข' }, table: null, notes: [] }
    assert.equal(productView(pp, { ...real, price }, { forWp, has }).price.confirmed, true)
  }
})

/* แถบตัวเลขทีมดีใต้ hero (audit P6) · กติกาเดียวกับหน้ากลุ่มลูกค้า: เว็บจริงต้องเหลือตัวเลขที่ยืนยันแล้วอย่างน้อย 2 ตัว */
test('ตัวเลขทีมดีใต้ hero: ตัดตัวที่รอยืนยัน · เหลือน้อยกว่า 2 ตัวซ่อนบนเว็บจริง', () => {
  const two = { ...pp, trust: { stats: [{ n: '8 ปี', t: 'a' }, { n: '2,800+ องค์กร', t: 'b' }, { n: '[รอยืนยัน: 1 ล้าน]', t: 'c' }] } }
  const wp = productView(two, real, { forWp: true, has })
  assert.equal(wp.trust.show, true)
  assert.deepEqual(wp.trust.stats.map((s) => s.n), ['8 ปี', '2,800+ องค์กร'])
  const one = { ...pp, trust: { stats: [{ n: '8 ปี', t: 'a' }, { n: '[รอยืนยัน]', t: 'b' }] } }
  assert.equal(productView(one, real, { forWp: true, has }).trust.show, false)
  assert.equal(productView(pp, real, { forWp: false, has }).trust.show, false) // ไม่มีข้อมูลตัวเลข
})

/* อาร์ตเคาะ 2 พ.ย.: หน้าสินค้าตามลำดับ v22 · ส่วนที่มีข้อมูลจริงต้องขึ้นเว็บจริง */
test('รายละเอียด: การ์ดรูปโชว์เมื่อมีไฟล์จริง · การ์ดข้อความจริง (text) โชว์ได้โดยไม่มีรูป · การ์ดบรรยายรูปที่ไม่มีไฟล์ซ่อน', () => {
  const page = { ...pp, detail: { h: 'd', cards: [{ h: 'มีรูป', p: ['x'], img: '/img/a.webp' }, { h: 'ข้อความ', p: ['จริง'], img: 'ภาพแนวทาง', text: true }, { h: 'บรรยายรูป', p: ['ภาพ…'], img: 'ภาพแนวทาง' }], links: [] } }
  const wp = productView(page, real, { forWp: true, has })
  assert.deepEqual(wp.detail.cards.map((c) => c.h), ['มีรูป', 'ข้อความ'])
  assert.deepEqual(wp.detail.cards.map((c) => c.hasImg), [true, false])
  assert.equal(wp.detail.show, true)
})

test('ผ้ายังไม่ยืนยัน (fabricsPending): เว็บจริงซ่อนรายการแต่ส่วนยังอยู่ · ต้นแบบเห็นรายการพร้อมป้าย', () => {
  const wp = productView(pp, { ...real, fabricsPending: true }, { forWp: true, has })
  assert.deepEqual(wp.fabric.fabrics, [])
  assert.equal(wp.fabric.show, true)
  const proto = productView(pp, { ...real, fabricsPending: true }, { forWp: false, has })
  assert.equal(proto.fabric.fabrics.length, 1)
  assert.equal(proto.fabric.fabricsPending, true)
})

test('รูปลูกค้าจริงในส่วนงานจริง (photos): เว็บจริงโชว์ส่วน · หัวข้อใช้ photoH ไม่ใช้หัวข้อ v22 ที่เคลมเทคนิค', () => {
  const page = { ...pp, work: { ...pp.work, photoH: 'เสื้อที่ลูกค้าใส่จริง' } }
  const wp = productView(page, { ...real, photos: [{ img: '/a.webp', d: 'ทีม' }] }, { forWp: true, has })
  assert.equal(wp.work.show, true)
  assert.equal(wp.work.h, 'เสื้อที่ลูกค้าใส่จริง')
  assert.equal(wp.work.photos.length, 1)
  assert.equal(productView(page, real, { forWp: false, has }).work.h, 'ผลงาน')
})
