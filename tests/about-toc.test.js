/* สารบัญหน้ารู้จักทีมดี (26 ต.ค.): ไฮไลต์ส่วนที่อ่านอยู่ + แถบอ่านไปแล้วกี่ % */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activeIndex, readProgress } from '../src/js/about-toc.js'

test('ส่วนที่อ่านอยู่ = ส่วนสุดท้ายที่ขอบบนเลยเส้นใต้หัวเว็บมาแล้ว · ยังไม่ถึงส่วนแรก = -1', () => {
  const tops = [800, 2000, 3500]
  assert.equal(activeIndex(tops, 100), -1)
  assert.equal(activeIndex(tops, 800), 0)
  assert.equal(activeIndex(tops, 2500), 1)
  assert.equal(activeIndex(tops, 9000), 2)
  assert.equal(activeIndex([], 500), -1)
})

test('แถบความคืบหน้า 0–1 · หน้าสั้นกว่าจอ = 1 · ไม่เกินช่วง', () => {
  assert.equal(readProgress({ y: 0, total: 5000, view: 1000 }), 0)
  assert.equal(readProgress({ y: 2000, total: 5000, view: 1000 }), 0.5)
  assert.equal(readProgress({ y: 9000, total: 5000, view: 1000 }), 1)
  assert.equal(readProgress({ y: -50, total: 5000, view: 1000 }), 0)
  assert.equal(readProgress({ y: 0, total: 800, view: 1000 }), 1)
})
