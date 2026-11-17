/* 16 พ.ย. 2026 audit (WCAG 2.4.3 ลำดับโฟกัส): popup โปรเด้งขึ้นตอนคนกำลังกด Tab ไล่หน้า แล้วดึงโฟกัสไปที่ปุ่มปิด (หน้า /contact-us/ Tab ครั้งที่ 13–16)
   → ถ้ากำลังใช้คีย์บอร์ด (กด Tab ใน 15 วินาที หรือโฟกัสอยู่ที่จุดใดแบบ focus-visible) ถือว่ายุ่ง ยังไม่เด้ง */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/js/promo-popup.js', import.meta.url), 'utf8')
test('popup โปรไม่เด้งแย่งโฟกัสขณะใช้คีย์บอร์ด', () => {
  assert.match(src, /addEventListener\('keydown', \(e\) => \{ if \(e\.key === 'Tab'\) lastTab = Date\.now\(\) \}\)/)
  const busy = src.slice(src.indexOf('const busy = () =>'), src.indexOf('const open = () =>'))
  assert.match(busy, /Date\.now\(\) - lastTab < KEYBOARD_MS/)
  assert.match(busy, /a\?\.matches\?\.\(':focus-visible'\)/)
})

/* 17 พ.ย. 2026 audit E2E: กดส่งฟอร์มติดต่อไม่ครบ → โฟกัสไปกล่องแจ้งผิด (#formErrs role=alert) แล้ว popup เด้งมาดึงโฟกัสไปภายใน ~4 วิ */
test('popup โปรไม่เด้งตอนโฟกัสอยู่ในฟอร์ม หรือในกล่องแจ้งเตือน role=alert', () => {
  const busy = src.slice(src.indexOf('const busy = () =>'), src.indexOf('const open = () =>'))
  assert.match(busy, /a\?\.closest\?\.\('form, \[role=alert\]'\)/)
})
