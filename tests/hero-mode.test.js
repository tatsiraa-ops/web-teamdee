import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveMode, MODES } from '../src/js/hero-mode.js'

test('มีสองแบบ: เลื่อน กับ แบบเดิม', () => {
  assert.deepEqual(MODES, ['scroll', 'classic'])
})

test('ลิงก์ ?hero= ชนะค่าที่จำไว้ (ส่งลิงก์ให้คนอื่นเปิดตรงแบบ)', () => {
  assert.equal(resolveMode({ param: 'classic', stored: 'scroll' }), 'classic')
  assert.equal(resolveMode({ param: 'scroll', stored: 'classic' }), 'scroll')
})

test('ไม่มีลิงก์ ใช้ค่าที่จำไว้ ไม่มีอะไรเลยใช้แบบเลื่อน', () => {
  assert.equal(resolveMode({ param: null, stored: 'classic' }), 'classic')
  assert.equal(resolveMode({ param: null, stored: null }), 'scroll')
})

test('ค่ามั่วไม่ทำให้หน้าพัง ข้ามไปค่าถัดไป', () => {
  assert.equal(resolveMode({ param: 'xx', stored: 'classic' }), 'classic')
  assert.equal(resolveMode({ param: 'xx', stored: 'yy' }), 'scroll')
})

test('ผู้ใช้ขอลดการเคลื่อนไหว ใช้แบบเลื่อนได้ (จะเป็นบทนิ่ง) ไม่บังคับเปลี่ยน', () => {
  assert.equal(resolveMode({ param: null, stored: null, reduced: true }), 'scroll')
})
