import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shownFor } from '../src/js/tag-filter.js'

const g = ['football', 'running', 'football', 'badminton', 'football', 'running', 'tank', 'football']

test('ทั้งหมด = โชว์ตามลำดับเดิมไม่เกินจำนวนที่กำหนด', () => {
  assert.deepEqual(shownFor(g, 'all', 6), [true, true, true, true, true, true, false, false])
})

test('เลือกแท็ก = โชว์เฉพาะทรงนั้น ไม่เกินจำนวนที่กำหนด', () => {
  assert.deepEqual(shownFor(g, 'football', 3), [true, false, true, false, true, false, false, false])
  assert.deepEqual(shownFor(g, 'running', 6), [false, true, false, false, false, true, false, false])
})

test('แท็กที่ไม่มีในรายการ ถือว่าเป็นทั้งหมด ไม่ปล่อยให้ตารางว่าง', () => {
  assert.deepEqual(shownFor(g, 'nope', 2), shownFor(g, 'all', 2))
  assert.deepEqual(shownFor(g, null, 2), shownFor(g, 'all', 2))
})
