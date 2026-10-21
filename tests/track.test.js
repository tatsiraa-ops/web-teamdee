import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyLink, eventFor, KINDS } from '../src/js/track.js'

test('ลิงก์ไลน์นับเป็น line · ทั้ง line.me, lin.ee และที่ติด data-track="line" (ตอนยังไม่มีลิงก์จริง)', () => {
  assert.equal(classifyLink({ href: 'https://line.me/R/ti/p/@teamdee' }), 'line')
  assert.equal(classifyLink({ href: 'https://lin.ee/abc123' }), 'line')
  assert.equal(classifyLink({ href: 'https://page.line.me/teamdee' }), 'line')
  assert.equal(classifyLink({ href: '#', track: 'line' }), 'line')
})

test('ลิงก์ tel: นับเป็น phone', () => {
  assert.equal(classifyLink({ href: 'tel:0975495941' }), 'phone')
  assert.equal(classifyLink({ href: 'TEL:+66975495941' }), 'phone')
})

test('ลิงก์ทั่วไปไม่นับ · โดเมนที่แค่มีคำว่า line ไม่นับ', () => {
  assert.equal(classifyLink({ href: '/contact/' }), null)
  assert.equal(classifyLink({ href: 'https://example.com/line.me/x' }), null)
  assert.equal(classifyLink({ href: 'https://deadline.me/' }), null)
  assert.equal(classifyLink({}), null)
})

test('data-track ที่ไม่รู้จักไม่นับ กันพิมพ์ผิดแล้วส่งข้อมูลขยะเข้า GTM', () => {
  assert.equal(classifyLink({ href: '/x/', track: 'lien' }), null)
})

test('ชื่อ event ที่ส่งเข้า dataLayer ตายตัว 4 ตัว (ตกลงกับอาร์ต 20 ต.ค. 2026)', () => {
  assert.deepEqual(KINDS, ['line', 'phone', 'form', 'calc'])
  assert.equal(eventFor('line'), 'td_line_click')
  assert.equal(eventFor('phone'), 'td_phone_click')
  assert.equal(eventFor('form'), 'td_form_submit')
  assert.equal(eventFor('calc'), 'td_calc_result')
  assert.equal(eventFor('xx'), null)
})
