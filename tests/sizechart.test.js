import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fmtSize } from '../src/js/sizechart.js'

test('ตารางไซซ์: นิ้ว = ตัวเลขเดิม · ซม. = ×2.54 ปัดเป็นจำนวนเต็ม', () => {
  assert.equal(fmtSize(40, 'in'), '40')
  assert.equal(fmtSize(40, 'cm'), '102')
  assert.equal(fmtSize(26, 'cm'), '66')
  assert.equal(fmtSize(56, 'cm'), '142')
})
