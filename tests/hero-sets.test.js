import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextSet, canAutoplay, tabKey, holdsOnPointer } from '../src/js/hero-sets.js'
import { pastHero } from '../src/js/nudge.js'

test('hero สลับชุดวนรอบ 01 → 02 → 01', () => {
  assert.equal(nextSet(2, 0), 1)
  assert.equal(nextSet(2, 1), 0)
  assert.equal(nextSet(1, 0), 0)
})

test('เล่นเองได้เฉพาะเมื่อมีมากกว่า 1 ชุด และไม่มีอะไรสั่งหยุด', () => {
  const ok = { count: 2, reduce: false, paused: false, held: false, offscreen: false, docHidden: false }
  assert.equal(canAutoplay(ok), true)
  assert.equal(canAutoplay({ ...ok, count: 1 }), false)
  assert.equal(canAutoplay({ ...ok, reduce: true }), false, 'ตั้งค่าลดการเคลื่อนไหว')
  assert.equal(canAutoplay({ ...ok, paused: true }), false, 'กดเลือกชุดเอง (ไม่มีปุ่มหยุด)')
  assert.equal(canAutoplay({ ...ok, held: true }), false, 'เมาส์ชี้ หรือโฟกัสอยู่ใน hero')
  assert.equal(canAutoplay({ ...ok, docHidden: true }), false, 'แท็บไม่ได้เปิดอยู่')
})

test('ปุ่มเลือกชุด: ลูกศรซ้ายขวาวนรอบ · Home/End ไปหัวท้าย · ปุ่มอื่นไม่ทำอะไร', () => {
  assert.equal(tabKey('ArrowRight', 0, 2), 1)
  assert.equal(tabKey('ArrowRight', 1, 2), 0)
  assert.equal(tabKey('ArrowLeft', 0, 2), 1)
  assert.equal(tabKey('Home', 1, 2), 0)
  assert.equal(tabKey('End', 0, 2), 1)
  assert.equal(tabKey('Enter', 0, 2), null)
})

test('การ์ดชวนมุมจอขึ้นเมื่อเลื่อนพ้น hero แล้วเท่านั้น ไม่ขึ้นทับปุ่มใน hero', () => {
  assert.equal(pastHero({ bottom: 120 }), false)
  assert.equal(pastHero({ bottom: 0 }), true)
  assert.equal(pastHero({ bottom: -40 }), true)
})

test('hero พ้นจอ กับแท็บซ่อน แยกกัน · กลับมาที่แท็บแต่ hero ยังพ้นจอ ต้องไม่เล่น (agent ตรวจโค้ด 23 ต.ค.)', () => {
  const ok = { count: 2, reduce: false, paused: false, held: false, offscreen: false, docHidden: false }
  assert.equal(canAutoplay(ok), true)
  assert.equal(canAutoplay({ ...ok, offscreen: true }), false)
  assert.equal(canAutoplay({ ...ok, docHidden: true }), false)
})

test('ชี้ค้างหยุดสลับเฉพาะเมาส์ · นิ้วแตะบนมือถือไม่ทำให้หยุดถาวร', () => {
  assert.equal(holdsOnPointer('mouse'), true)
  assert.equal(holdsOnPointer('touch'), false)
  assert.equal(holdsOnPointer('pen'), false)
})
