import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prunePending } from '../src/js/prune.js'

test('รายการ / ข้อ FAQ / แถวตาราง ที่มี [วงเล็บ] ถูกตัดทั้งรายการ', () => {
  const faq = [['ขั้นต่ำกี่ตัว', 'ขึ้นกับสินค้า [รอยืนยัน]'], ['เริ่มได้ไหม', 'ได้']]
  assert.deepEqual(prunePending(faq), [['เริ่มได้ไหม', 'ได้']])
  const items = [{ t: 'ขั้นตอน', d: 'ขึ้น Mockup [ยืนยันขั้นตอน]' }, { t: 'ส่ง', d: 'ส่งถึงที่' }]
  assert.deepEqual(prunePending(items), [{ t: 'ส่ง', d: 'ส่งถึงที่' }])
  assert.deepEqual(prunePending(['ก', '[ข]', 'ค']), ['ก', 'ค'])
})

test('เข้าไปตัดในโครงซ้อน · ฟิลด์ข้อความเดี่ยวที่รอยืนยันกลายเป็นว่าง', () => {
  const guide = { title: 'คู่มือ', lead: 'สรุป [รอยืนยัน]', sections: [{ h: 'ราคา', rows: [['สี', 'ได้'], ['ผ้า', '[ยืนยัน]']] }] }
  assert.deepEqual(prunePending(guide), { title: 'คู่มือ', lead: '', sections: [{ h: 'ราคา', rows: [['สี', 'ได้']] }] })
})

test('ค่าที่ไม่ใช่ข้อความไม่ถูกแตะ', () => {
  assert.deepEqual(prunePending({ n: 3, ok: true, list: [1, 2], none: null }), { n: 3, ok: true, list: [1, 2], none: null })
})
