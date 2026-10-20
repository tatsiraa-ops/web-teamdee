import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveMode, MODES } from '../src/js/hero-mode.js'

test('มีสามแบบ: ทีม (ใหม่ ตามแบบ Figma) เลื่อน และแบบเดิม', () => {
  assert.deepEqual(MODES, ['team', 'scroll', 'classic'])
})

test('ลิงก์ ?hero= ชนะค่าที่จำไว้ (ส่งลิงก์ให้คนอื่นเปิดตรงแบบ)', () => {
  assert.equal(resolveMode({ param: 'classic', stored: 'scroll' }), 'classic')
  assert.equal(resolveMode({ param: 'scroll', stored: 'classic' }), 'scroll')
})

test('ไม่มีลิงก์ ใช้ค่าที่จำไว้ ไม่มีอะไรเลยใช้แบบทีม', () => {
  assert.equal(resolveMode({ param: null, stored: 'classic' }), 'classic')
  assert.equal(resolveMode({ param: null, stored: null }), 'team')
})

test('เปิดแบบเลื่อนตรงได้ด้วย ?hero=scroll', () => {
  assert.equal(resolveMode({ param: 'scroll', stored: 'team' }), 'scroll')
})

test('ค่ามั่วไม่ทำให้หน้าพัง ข้ามไปค่าถัดไป', () => {
  assert.equal(resolveMode({ param: 'xx', stored: 'classic' }), 'classic')
  assert.equal(resolveMode({ param: 'xx', stored: 'yy' }), 'team')
})

test('ผู้ใช้ขอลดการเคลื่อนไหว ไม่บังคับเปลี่ยนแบบ', () => {
  assert.equal(resolveMode({ param: null, stored: null, reduced: true }), 'team')
})
