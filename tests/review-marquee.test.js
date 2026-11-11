import { test } from 'node:test'
import assert from 'node:assert/strict'
import { wrapX, stepX } from '../src/js/review-marquee.js'

test('wrapX: อยู่ในช่วง 0 ถึงรอบเดียวเสมอ (ชุดซ้ำต่อกันจึงวนไม่สะดุด)', () => {
  assert.equal(wrapX(0, 1000), 0)
  assert.equal(wrapX(250, 1000), 250)
  assert.equal(wrapX(1000, 1000), 0)
  assert.equal(wrapX(1250, 1000), 250)
  assert.equal(wrapX(-10, 1000), 990)
  assert.equal(wrapX(-2010, 1000), 990)
})

test('wrapX: ยังวัดความยาวรอบไม่ได้ (0) = อยู่กับที่ ไม่หารศูนย์', () => {
  assert.equal(wrapX(300, 0), 0)
})

test('stepX: แถวบนไปทางขวา แถวล่างย้อนทาง และวนครบรอบ', () => {
  assert.equal(stepX(0, 1, 1000, 50, 1000), 50)
  assert.equal(stepX(0, -1, 1000, 50, 1000), 950)
  assert.equal(stepX(990, 1, 1000, 10, 1000), 0)
})

test('stepX: เฟรมกระตุกนาน (สลับแท็บกลับมา) ไม่กระโดดไกล · เดินได้ไม่เกิน 50ms ต่อเฟรม', () => {
  assert.equal(stepX(0, 1, 50, 5000, 1000), 2.5)
})
