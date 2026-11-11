/* การ์ดข้างที่ติดตามเวลาเลื่อน (หน้าติดต่อ · ใบประเมินหน้าคำนวณ) · อาร์ต 26 ต.ค. "บนๆการ์ดเวลาเลื่อนไม่หาย"
   เดิมตั้ง top 104px ตายตัว แต่หัวเว็บจริงสูง 109px (มีแถบ WordPress) → ขอบบนการ์ดมุดใต้หัวเว็บ */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stickyTop } from '../src/js/sticky-side.js'

test('การ์ดพอดีจอ: ติดใต้หัวเว็บจริงห่าง 16px ไม่มุดใต้หัวเว็บ', () => {
  assert.equal(stickyTop({ header: 109, viewport: 900, height: 600 }), 125)
  assert.equal(stickyTop({ header: 77, viewport: 900, height: 600 }), 93)
})

test('การ์ดสูงกว่าที่เหลือในจอ: ติดด้วยขอบล่างแทน (เลื่อนจนเห็นท้ายการ์ดก่อนค่อยติด) ไม่โดนตัดท้าย', () => {
  assert.equal(stickyTop({ header: 109, viewport: 768, height: 786 }), 768 - 786 - 16)
})

test('ค่าแปลก (ไม่มีหัวเว็บ / ค่าไม่ใช่ตัวเลข) ไม่พัง', () => {
  assert.equal(stickyTop({ header: 0, viewport: 900, height: 300 }), 16)
  assert.equal(stickyTop({ header: NaN, viewport: 900, height: 300 }), 16)
})
