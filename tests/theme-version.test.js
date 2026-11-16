/* 16 พ.ย. 2026 ตอนลงธีมบน staging หน้า "Replace installed with uploaded" ขึ้น Version 0.1.0 ทั้งสองฝั่ง (ไม่เคยเปลี่ยนตั้งแต่ทำธีมแรก)
   → เลขในธีม (style.css) ต้องตรงกับเลข Release (package.json) จะได้เทียบได้ว่าลงตัวใหม่จริง · ขั้นตอน /release แก้ทั้งสองที่พร้อมกัน */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('เลขเวอร์ชันของธีม (style.css) ตรงกับ package.json', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version
  const css = readFileSync(new URL('../wp-theme/teamdee/style.css', import.meta.url), 'utf8')
  assert.equal(css.match(/^Version:\s*(\S+)/m)?.[1], pkg)
})
