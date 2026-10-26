/* กริด "ผลงานจริง" หน้าแรก: รวมเคสผลงาน + ภาพลูกค้าใส่จริง แทน 2 แถวเลื่อน (อาร์ตเคาะ 23 ต.ค.) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRealGrid, visibleIndexes, CATS } from '../src/js/real-grid.js'

/* works.json หลังล้างเรื่องเล่า (24 ต.ค.): มีแค่รูป หมวดที่เห็นในรูป และคำบรรยายตามที่เห็น */
const works = [
  { id: 'w1', img: '/img/real/r01.jpg', cat: 'sports', catName: 'เสื้อกีฬา', alt: 'ทีมฟุตบอลใส่เสื้อที่ทีมดีผลิต' },
  { id: 'w4', img: '/img/real/r04.jpg', cat: 'corporate', catName: 'เสื้อองค์กร', alt: 'กลุ่มลูกค้าใส่เสื้อโปโลสีส้มอ่อนที่ทีมดีผลิต' },
  { id: 'w6', img: '/img/real/r06.jpg', cat: 'event', catName: 'เสื้ออีเวนต์', alt: 'กลุ่มลูกค้าใส่เสื้อสีเหลืองที่ทีมดีผลิต' },
]
const customers = [
  { img: '/img/customer/co01.webp', imgSmall: '/img/customer/co01-320.webp', cat: 'corporate', catName: 'เสื้อองค์กร' },
  { img: '/img/customer/sp01.webp', imgSmall: '/img/customer/sp01-320.webp', cat: 'sports', catName: 'เสื้อกีฬา' },
  { img: '/img/customer/ev01.webp', imgSmall: '/img/customer/ev01-320.webp', cat: 'event', catName: 'เสื้ออีเวนต์' },
]

test('หมวดตายตัว 4 หมวด + ทั้งหมด · ชื่อสั้นอ่านง่าย', () => {
  assert.deepEqual(CATS.map((c) => c.id), ['', 'corporate', 'school', 'sports', 'event'])
})

test('รูปผลงานมาก่อน แล้วต่อด้วยภาพลูกค้า · ไม่มีชื่องานหรือลิงก์ไปเรื่องเล่า · หมวดและคำบรรยายมาจากสิ่งที่เห็นในรูป', () => {
  const g = buildRealGrid(works, customers, { perCat: 2 })
  assert.deepEqual(g.items.slice(0, 3).map((x) => x.cat), ['sports', 'corporate', 'event'])
  assert.equal(g.items[0].title, undefined)
  assert.equal(g.items[0].href, undefined)
  assert.equal(g.items[0].alt, 'ทีมฟุตบอลใส่เสื้อที่ทีมดีผลิต')
  assert.equal(g.items[0].meta, 'เสื้อกีฬา')
  assert.equal(g.items[3].alt, undefined)
  assert.equal(g.items[3].meta, 'เสื้อองค์กร')
})

test('รูปผลงานที่ยังไม่รู้หมวด ขึ้นแค่แท็บทั้งหมด', () => {
  const g = buildRealGrid([{ id: 'wx', img: '/img/real/r09.jpg', alt: 'กลุ่มลูกค้าใส่เสื้อที่ทีมดีผลิต' }], [], { perCat: 1 })
  assert.equal(g.items[0].cat, '')
  assert.deepEqual(g.cats.map((c) => [c.id, c.n]), [['', 1]])
})

test('แท็บโชว์เฉพาะหมวดที่มีรูปจริง และนับจำนวนถูก', () => {
  const g = buildRealGrid(works, customers, { perCat: 2 })
  assert.deepEqual(g.cats.map((c) => [c.id, c.n]), [['', 6], ['corporate', 2], ['sports', 2], ['event', 2]])
})

test('ตัวกรอง: ทั้งหมด = ลำดับเดิมตัดตาม limit · เลือกหมวด = เฉพาะหมวดนั้น', () => {
  const cats = ['corporate', 'sports', 'school', 'corporate', 'sports', 'event']
  assert.deepEqual(visibleIndexes(cats, '', 4), [0, 1, 2, 3])
  assert.deepEqual(visibleIndexes(cats, 'sports', 4), [1, 4])
  assert.deepEqual(visibleIndexes(cats, 'corporate', 1), [0])
})
