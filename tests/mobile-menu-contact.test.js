/* แผงติดต่อท้ายเมนูมือถือ · 11 พ.ย. 2026 อาร์ต "อันนี้ต่อ ทำมาดีๆหน่อย"
   เดิม: ลิงก์ลูกค้าเดิมตัวเล็ก + ปุ่ม 3 ทรงไม่เข้าชุด (LINE จัดกลาง · ส้มชิดซ้าย · ขอบเทาจัดกลาง)
   ใหม่: LINE ปุ่มหลัก + สถานะเวลาทำการจริง → โทร | ติดต่อทีมดี (การ์ดคู่ ทรงเดียวกัน) → ลูกค้าเดิม สั่งซ้ำ | ติดตามงาน (ปุ่มจริง) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const menu = (f) => { const h = readFileSync(`dist-wp/${f}index.html`, 'utf8'); const a = h.indexOf('id="mobileMenu"'); return h.slice(a, h.indexOf('</nav>', a)) }
const strip = (h) => h.replace(/<\/?t-[a-z]+>/g, '')

test('เมนูมือถือ: แผงติดต่อเรียง LINE → โทร → ติดต่อทีมดี → ลูกค้าเดิม (สั่งซ้ำ · ติดตามงาน)', () => {
  const m = strip(menu(''))
  const box = m.slice(m.indexOf('<div class="mct"'))
  assert.ok(m.includes('<div class="mct"'), 'มีแผงติดต่อ')
  const order = ['data-where="mobile-menu"', 'href="tel:', 'class="mct__tile" href="/contact-us/"', 'data-where="menu-reorder"', 'data-where="menu-track"'].map((s) => box.indexOf(s))
  assert.ok(order.every((i) => i > 0), JSON.stringify(order))
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'ลำดับ LINE → โทร → ติดต่อ → ลูกค้าเดิม')
  const line = box.slice(0, box.indexOf('</a>'))
  assert.match(line, /class="mct__line"/); assert.match(line, /data-float-status/, 'LINE มีบรรทัดสถานะเวลาทำการ (nudge.js)')
  assert.match(box, /<p class="mct__k">ลูกค้าเดิม<\/p>/)
  assert.doesNotMatch(m, /mnav-old|class="hcta/, 'ไม่มีลิงก์ตัวเล็กเดิม · ไม่มีปุ่มส้มคนละทรง')
})

test('เมนูมือถือหน้าติดต่อ: การ์ดติดต่อทีมดีพาไปฟอร์มในหน้า', () => {
  assert.match(strip(menu('contact-us/')), /class="mct__tile" href="#form" aria-current="page"/)
})

test('แผงติดต่อ: ปุ่มชิดซ้ายทุกอัน · จุดกด ≥56px (LINE ≥64px) · โฟกัสเห็นชัด', () => {
  const css = readFileSync('src/styles/main.css', 'utf8')
  const rule = (sel) => (css.match(new RegExp(`${sel.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`)) || [])[1] || ''
  assert.match(rule('.mct__line'), /min-height: 64px/)
  for (const s of ['.mct__tile', '.mct__old']) { assert.match(rule(s), /min-height: 56px/, s); assert.doesNotMatch(rule(s), /justify-content: center/, s) }
  assert.match(css, /\.mct a:focus-visible \{[^}]*outline:/)
})
