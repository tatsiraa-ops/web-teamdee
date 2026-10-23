/* กริด "ผลงานจริง" หน้าแรก: รวมเคสผลงาน + ภาพลูกค้าใส่จริง แทน 2 แถวเลื่อน (อาร์ตเคาะ 23 ต.ค.) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRealGrid, visibleIndexes, CATS } from '../src/js/real-grid.js'

const works = [
  { id: 'w1', title: 'เสื้อประจำปี บริษัทประกันภัย', group: 'corp', groupName: 'เสื้อประจำปีบริษัท', img: '/img/real/r01.jpg' },
  { id: 'w5', title: 'เสื้อทีมฟุตบอล', group: 'team', groupName: 'เสื้อทีมแข่ง', img: '/img/real/r05.jpg' },
  { id: 'w8', title: 'เสื้อกีฬาสี โรงเรียน', group: 'edu', groupName: 'เสื้อสถานศึกษา', img: '/img/real/r08.jpg' },
]
const customers = [
  { img: '/img/customer/co01.webp', imgSmall: '/img/customer/co01-320.webp', cat: 'corporate', catName: 'เสื้อองค์กร' },
  { img: '/img/customer/sp01.webp', imgSmall: '/img/customer/sp01-320.webp', cat: 'sports', catName: 'เสื้อกีฬา' },
  { img: '/img/customer/ev01.webp', imgSmall: '/img/customer/ev01-320.webp', cat: 'event', catName: 'เสื้ออีเวนต์' },
]

test('หมวดตายตัว 4 หมวด + ทั้งหมด · ชื่อสั้นอ่านง่าย', () => {
  assert.deepEqual(CATS.map((c) => c.id), ['', 'corporate', 'school', 'sports', 'event'])
})

test('เคสผลงานมาก่อน (มีชื่องาน) แล้วต่อด้วยภาพลูกค้า · กลุ่มของเคสแปลงเป็นหมวดเดียวกับภาพลูกค้า', () => {
  const g = buildRealGrid(works, customers, { perCat: 2 })
  assert.deepEqual(g.items.slice(0, 3).map((x) => x.cat), ['corporate', 'sports', 'school'])
  assert.equal(g.items[0].title, 'เสื้อประจำปี บริษัทประกันภัย')
  assert.equal(g.items[0].href, 'w1')
  assert.equal(g.items[3].title, undefined)
  assert.equal(g.items[3].meta, 'เสื้อองค์กร')
})

test('แท็บโชว์เฉพาะหมวดที่มีรูปจริง และนับจำนวนถูก', () => {
  const g = buildRealGrid(works, customers, { perCat: 2 })
  assert.deepEqual(g.cats.map((c) => [c.id, c.n]), [['', 6], ['corporate', 2], ['school', 1], ['sports', 2], ['event', 1]])
})

test('ตัวกรอง: ทั้งหมด = ลำดับเดิมตัดตาม limit · เลือกหมวด = เฉพาะหมวดนั้น', () => {
  const cats = ['corporate', 'sports', 'school', 'corporate', 'sports', 'event']
  assert.deepEqual(visibleIndexes(cats, '', 4), [0, 1, 2, 3])
  assert.deepEqual(visibleIndexes(cats, 'sports', 4), [1, 4])
  assert.deepEqual(visibleIndexes(cats, 'corporate', 1), [0])
})
