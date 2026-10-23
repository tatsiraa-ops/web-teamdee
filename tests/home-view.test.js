import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { homeView } from '../src/js/home-view.js'

const h = JSON.parse(readFileSync(new URL('../src/data/home.json', import.meta.url), 'utf8'))
/* ข้อความทุกช่องที่ยังมี [วงเล็บ] (ไล่ทุกชั้น) */
const has = (o) => (typeof o === 'string' ? (/\[[^\]]*\]/.test(o) ? [o] : []) : o && typeof o === 'object' ? Object.values(o).flatMap(has) : [])

test('เว็บจริง: ไม่มีข้อความ [วงเล็บ] เหลือในข้อมูลหน้าแรก', () => {
  const v = homeView(h, { forWp: true })
  assert.deepEqual(has(v), [])
})

test('เว็บจริง (หลังยืนยัน 22 ต.ค.): จุดเด่นครบ 8 (รวมชำระเงิน/รับประกันแล้ว) · สถิติ 3 ตัว (อาร์ตยืนยัน 10,000+ งาน) · ชำระเงินเหลือใบกำกับภาษี · รับประกันโชว์', () => {
  const v = homeView(h, { forWp: true, years: 8 })
  assert.equal(v.benefits.items.length, 8)
  assert.deepEqual(v.stats.items.map((x) => x.n), ['8 ปี', '2,800+ องค์กร', '10,000+ งาน'])
  assert.equal(v.show.stats, true)
  /* 23 ต.ค. พี่ทัชตอบ: วางบิลได้ · ไม่รับบัตรเครดิต (การ์ดบัตรเครดิตถูกลบ) */
  assert.deepEqual(v.payment.items.map((x) => x.h), ['รองรับการวางบิล', 'ออกใบเสร็จ / ใบกำกับภาษีได้'])
  assert.equal(v.show.care, true)
  assert.equal(v.show.benefits, true)
})

test('เว็บจริง: FAQ ชำระเงิน/บัตรเครดิตขึ้นได้หลังยืนยัน 23 ต.ค. · ไม่เหลือข้อรอยืนยัน · เรื่องราวเก็บย่อหน้าที่ไม่มีวงเล็บ', () => {
  const v = homeView(h, { forWp: true })
  const qs = v.faq.items.map(([q]) => q)
  assert.ok(qs.includes('ไม่มีแบบเริ่มคุยได้ไหม?'))
  assert.ok(qs.includes('ขอดูตัวอย่างผ้าหรือเสื้อตัวอย่างได้ไหม?'))
  assert.ok(qs.includes('ต้องชำระเงินอย่างไร?'))
  assert.ok(qs.includes('รับบัตรเครดิตและวางบิลได้ไหม?'))
  assert.equal(qs.length, h.faq.items.length)
  assert.equal(v.location.story.year, 'เริ่มปี 2018')
  assert.equal(v.location.story.p.length, 2)
  assert.deepEqual(v.location.company.p, ['จดทะเบียนบริษัท 19 มกราคม 2021', 'ขอเอกสารประกอบการจัดซื้อได้'])
})

test('ต้นแบบ: เก็บทุกส่วนพร้อมป้ายรอข้อมูล', () => {
  const v = homeView(h, { forWp: false })
  assert.equal(v.benefits.items.length, 8)
  assert.equal(v.show.stats, true)
  assert.equal(v.show.payment, true)
  assert.equal(v.show.care, true)
  assert.equal(v.faq.items.length, h.faq.items.length)
})

test('สถิติ: ยืนยันแล้วอย่างน้อย 2 ตัว → เว็บจริงโชว์ · ตัวเดียวไม่โชว์', () => {
  const two = { ...h, stats: { ...h.stats, items: [{ n: '8 ปี', t: 'ก' }, { n: '2,800+ องค์กร', t: 'ข' }, { n: '[รอยืนยัน: 10,000+ งาน]', t: 'ค' }] } }
  const v = homeView(two, { forWp: true })
  assert.equal(v.show.stats, true)
  assert.equal(v.stats.items.length, 2)
  const one = { ...h, stats: { ...h.stats, items: [{ n: '8 ปี', t: 'ก' }, { n: '[รอยืนยัน: 2,800+ องค์กร]', t: 'ข' }] } }
  assert.equal(homeView(one, { forWp: true }).show.stats, false)
})

test('สถิติ "ปี" คำนวณจากปีก่อตั้ง ไม่เขียนตายตัว (ปีหน้าไม่ต้องมาแก้มือ)', () => {
  assert.equal(homeView(h, { forWp: true, years: 8 }).stats.items[0].n, '8 ปี')
  assert.equal(homeView(h, { forWp: true, years: 9 }).stats.items[0].n, '9 ปี')
})
