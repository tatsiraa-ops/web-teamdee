/* มือถือ: หัวเว็บหลบตอนเลื่อนลง โผล่ตอนเลื่อนขึ้น (ตรวจมือถือ 30 ต.ค. ข้อ 14 · แถบลอยบังจอ 33–48%)
   แถบที่ติดใต้หัวเว็บ (--hdr-b) ขยับขึ้นตาม · การ์ดแนะนำไม่ขึ้นบนจอที่มีแถบล่างแล้ว */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { nextHidden, uncoverDelta } from '../src/js/header-hide.js'

const base = { hidden: false, header: 64, menuOpen: false }

test('เลื่อนลงเกินหัวเว็บ + ขยับจริง (>8px) = หลบ · เลื่อนขึ้น (>8px) = โผล่ · สั่นนิดหน่อยไม่เปลี่ยน', () => {
  assert.equal(nextHidden({ ...base, y: 400, lastY: 380 }), true)
  assert.equal(nextHidden({ ...base, y: 384, lastY: 380 }), false)
  assert.equal(nextHidden({ ...base, hidden: true, y: 370, lastY: 380 }), false)
  assert.equal(nextHidden({ ...base, hidden: true, y: 377, lastY: 380 }), true)
})

test('ใกล้บนสุด = โผล่เสมอ · เมนูเปิดอยู่ = ไม่หลบ', () => {
  assert.equal(nextHidden({ ...base, hidden: true, y: 40, lastY: 30 }), false)
  assert.equal(nextHidden({ ...base, y: 60, lastY: 20 }), false)
  assert.equal(nextHidden({ ...base, menuOpen: true, y: 900, lastY: 600 }), false)
})

test('CSS: หลบเฉพาะจอเล็กกว่า 768 · ลดการเคลื่อนไหวไม่มีแอนิเมชัน · การ์ดแนะนำไม่ขึ้นบนจอที่มีแถบล่าง', () => {
  const css = readFileSync(new URL('../src/styles/main.css', import.meta.url), 'utf8')
  assert.match(css, /@media \(max-width: 767px\) \{\n  \[data-header\] \{ transition: transform \.25s cubic-bezier\(\.2, \.7, \.2, 1\); \}\n  html\.hdr-hidden \[data-header\] \{ transform: translateY\(-100%\); \}/)
  assert.match(css, /@media \(max-width: 1023px\) \{ \.nudge \{ display: none !important; \} \}/)
  assert.match(readFileSync(new URL('../src/js/site-extras.js', import.meta.url), 'utf8'), /safe\(initHeaderHide\)/)
})

/* 17 พ.ย. 2026 audit (WCAG 2.4.11): กด Shift+Tab ย้อนขึ้น ตัวที่โฟกัสยังอยู่ "ในจอ" แต่อยู่ใต้หัวเว็บที่ติดบน → เบราว์เซอร์ไม่เลื่อน มองไม่เห็น
   uncoverDelta = ระยะที่ต้องเลื่อนขึ้น (ค่าติดลบ) ให้พ้นขอบล่างหัวเว็บ + เผื่อ 16px · ไม่ถูกบัง = 0 */
test('uncoverDelta: ตัวที่โฟกัสอยู่ใต้หัวเว็บ → เลื่อนให้พ้น · ไม่ถูกบัง = 0', () => {
  assert.equal(uncoverDelta({ top: 45, bottom: 63 }, 77), 45 - 77 - 16)
  assert.equal(uncoverDelta({ top: 70, bottom: 120 }, 77), 70 - 77 - 16, 'บังบางส่วนก็เลื่อน')
  assert.equal(uncoverDelta({ top: 100, bottom: 140 }, 77), 0)
  assert.equal(uncoverDelta({ top: -300, bottom: -200 }, 77), 0, 'อยู่นอกจอด้านบน เบราว์เซอร์เลื่อนเองแล้ว')
  assert.equal(uncoverDelta({ top: 45, bottom: 63 }, 0), 0, 'หัวเว็บหลบอยู่ (มือถือ)')
})
