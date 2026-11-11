/* ตัวกรองแบบเสื้อหน้า /designs/ (อาร์ตสั่ง 26 ต.ค. 2026: ใช้ง่ายขึ้น + แยกงานพิมพ์ลาย งานปัก งานสกรีน) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { workOf, WORK, matches, countFor, activeFilters, textHit } from '../src/js/design-filter.js'

const designs = JSON.parse(readFileSync(new URL('../src/data/designs.json', import.meta.url), 'utf8'))
const AXES = ['work', 'garment', 'use', 'style', 'color']
const item = (d) => ({ tags: { work: [workOf(d)], garment: [d.garment], use: d.use || [], style: d.style || [], color: [d.color] }, text: `${d.code} ${d.garmentName}`.toLowerCase() })
const items = designs.map(item)
const all = Object.fromEntries(AXES.map((a) => [a, 'all']))

test('งานแยกตามเทคนิคที่ทีมดีรับ: พิมพ์ลาย · งานปัก · งานสกรีน (อาร์ต 26 ต.ค.) · โปโลกับเบสบอลไปอยู่แกนทรงเสื้อ', () => {
  assert.deepEqual(Object.keys(WORK), ['print', 'embroidery', 'screen'])
  assert.deepEqual(Object.values(WORK).map((w) => w.name), ['พิมพ์ลาย', 'งานปัก', 'งานสกรีน'])
  assert.equal(workOf({ tech: 'print', garment: 'polo', product: ['print'] }), 'print')
  assert.equal(workOf({ tech: 'print', garment: 'baseball', product: ['baseball', 'print'] }), 'print')
  assert.equal(workOf({ tech: 'embroidery', garment: 'polo' }), 'embroidery')
  assert.equal(workOf({ tech: 'screen', garment: 'tshirt' }), 'screen')
  for (const d of designs) assert.ok(WORK[workOf(d)], d.code)
})

test('ตัวเลขบนตัวเลือกคิดจากตัวกรองอื่นที่เลือกอยู่ (ไม่ใช่ตัวเลขตายตัว)', () => {
  const total = countFor(items, all, '', AXES, 'garment', 'polo')
  assert.equal(total, designs.filter((d) => d.garment === 'polo').length)
  const withEdu = countFor(items, { ...all, use: 'edu' }, '', AXES, 'garment', 'polo')
  assert.equal(withEdu, designs.filter((d) => d.garment === 'polo' && d.use.includes('edu')).length)
  assert.ok(withEdu < total)
  /* แกนเดียวกันไม่นับตัวเอง: เลือกโปโลอยู่ ตัวเลือกพิมพ์ลายยังบอกจำนวนตามแกนอื่น */
  assert.equal(countFor(items, { ...all, garment: 'polo' }, '', AXES, 'work', 'print'), designs.filter((d) => d.garment === 'polo' && d.tech === 'print').length)
  /* งานที่ยังไม่มีแบบในคลัง = 0 → เลือกไม่ได้ */
  assert.equal(countFor(items, all, '', AXES, 'work', 'embroidery'), designs.filter((d) => d.tech === 'embroidery').length)
})

test('ค้นหาร่วมกับตัวกรอง', () => {
  assert.equal(items.filter((it) => matches(it, all, 'td-0001', AXES)).length, 1)
  assert.equal(items.filter((it) => matches(it, { ...all, garment: 'polo' }, 'td-0001', AXES)).length, 0)
})

test('แถบ "กำลังกรอง" บอกทุกแกนที่เลือก พร้อมชื่อที่คนอ่าน · ค้นหาก็ขึ้นด้วย', () => {
  const names = { work: { print: 'พิมพ์ลาย' }, use: { edu: 'เสื้อโรงเรียน' } }
  assert.deepEqual(activeFilters({ ...all, work: 'print', use: 'edu' }, 'td', AXES, names), [
    { axis: 'work', label: 'พิมพ์ลาย' },
    { axis: 'use', label: 'เสื้อโรงเรียน' },
    { axis: 'q', label: '“td”' },
  ])
  assert.deepEqual(activeFilters(all, '', AXES, names), [])
})

test('ค้นหา (26 ต.ค. "ค้นหาทำดีๆ"): พิมพ์รหัสแบบย่อก็เจอ 12 / td12 / TD-12 / td 0012 → TD-0012 · คำอื่นค้นในข้อความตามเดิม', () => {
  const text = 'td-0012 เสื้อโปโล พิมพ์ลาย navy'
  for (const q of ['12', 'td12', 'td-12', 'td 0012', 'TD-0012'.toLowerCase(), '0012']) assert.equal(textHit(text, q), true, q)
  assert.equal(textHit(text, '13'), false)
  assert.equal(textHit(text, 'โปโล'), true)
  assert.equal(textHit(text, 'เบสบอล'), false)
  assert.equal(textHit(text, ''), true)
  assert.equal(textHit('td-0112 x', '12'), false, 'เลขต้องตรงทั้งรหัส ไม่ใช่แค่ลงท้าย')
})
