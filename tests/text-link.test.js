/* 11 พ.ย. 2026 ลิงก์ "ข้อความ + ลูกศร" แบบเดียวทั้งเว็บ
   รอบ 206: อาร์ตส่งภาพ 4 ลิงก์ไม่เท่ากัน → เลือก "แบบเดียวทั้งเว็บ" (เดิม 21 แบบ · ลูกศรติดตัวหนังสือเพราะช่องว่างท้ายข้อความใน inline-flex ถูกตัดทิ้ง)
   รอบ 207: อาร์ต "ไม่สวยเลยทำมาดีๆ" → เทียบ 3 แบบบนหน้าจริง → เลือก B วงกลมลูกศร
   ตัวหนังสือ 16px หนา 700 ไม่มีเส้นใต้ · วงกลมส้มอ่อน #FFF1E4 28px ลูกศรวาด SVG สีดำ (เลิกใช้ตัวอักษร →) เว้น 10px
   โฮเวอร์วงเป็นส้ม #FF6C00 ลูกศรขยับ 2px · ปิดการขยับเมื่อผู้ใช้ลดการเคลื่อนไหว · ลิงก์เปิดแท็บใหม่ใช้ลูกศรเฉียง */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/styles/main.css', 'utf8')
const block = () => {
  const a = css.indexOf('/* ลิงก์ลูกศร แบบเดียวทั้งเว็บ')
  assert.ok(a > 0, 'มีกฎกลางลิงก์ลูกศรใน main.css')
  return css.slice(a, css.indexOf('/* /ลิงก์ลูกศร */', a)).replace(/\s+/g, ' ')
}
const LINKS = ['.pp-more', '.hm-more', '.hm-faq__all', '.hm-show__rhead .hm-show__links a', '.pp2-dz__all', '.pp2-faq__more a', '.pp2-fab__guide', '.spk__more']

test('กฎกลางครอบลิงก์ลูกศรทุกตระกูล', () => {
  const b = block()
  for (const s of LINKS) assert.ok(b.includes(s), `ไม่มี ${s} ในกฎกลาง`)
})

test('ตัวหนังสือ 16px หนา 700 ไม่มีเส้นใต้', () => {
  const b = block()
  for (const d of ['font-size: 16px', 'font-weight: 700', 'text-decoration-line: none']) assert.ok(b.includes(d), `ขาด ${d}`)
})

test('ข้อความยาวตัดบรรทัด วงลูกศรต่อท้ายคำสุดท้าย (inline ไม่ใช่ flex) · พื้นที่กดสูง 44px', () => {
  const b = block()
  for (const d of ['display: inline-block', 'padding-block: 8px', 'min-height: 44px', 'vertical-align: middle']) assert.ok(b.includes(d), `ขาด ${d}`)
})

test('ลูกศรเป็นวงกลมส้มอ่อน 28px ลูกศรวาด SVG ไม่ใช้ตัวอักษร', () => {
  const b = block()
  for (const d of ['width: 28px', 'height: 28px', 'border-radius: 50%', 'background: #FFF1E4', 'font-size: 0', 'margin-inline-start: 10px'])
    assert.ok(b.includes(d), `ขาด ${d}`)
  assert.match(b, /mask: url\("data:image\/svg\+xml/, 'ลูกศรวาดด้วย SVG mask')
  assert.match(b, /target="_blank"/, 'ลิงก์เปิดแท็บใหม่มีลูกศรเฉียงของตัวเอง')
})

test('โฮเวอร์วงเป็นส้ม · ปิดการขยับเมื่อลดการเคลื่อนไหว · มีกรอบโฟกัส', () => {
  const b = block()
  assert.match(b, /:hover[^{]*\{ background: #FF6C00/, 'โฮเวอร์วงเป็นส้ม')
  assert.match(b, /prefers-reduced-motion/)
  assert.match(b, /:focus-visible/)
})

test('ปุ่มเม็ดยาแถว showroom บนมือถือ: วงอยู่กลางเม็ดยา (ขอบขวา 8px เท่าบนล่าง ไม่มี gap ซ้อน)', () => {
  const b = block()
  assert.match(b, /@media \(max-width: 767px\) \{ html body #real-work \.hm-show__rhead \.hm-show__links a \{ column-gap: 0; padding-inline-end: 8px; \}/)
})

test('ปุ่มกาง "ดูภาพลูกค้าเพิ่มเติม" มีวงลูกศรลง และกลับหัวเมื่อกางแล้ว', () => {
  const b = block()
  assert.match(b, /button\.pp-more::after \{[^}]*width: 28px/)
  assert.match(b, /button\.pp-more\[aria-expanded="true"\]::after \{[^}]*rotate: 180deg/)
})

test('ลิงก์ลูกศรในบทความใช้ class กลาง ไม่เขียน utility เอง', () => {
  const art = readFileSync('src/partials/articlePage.hbs', 'utf8')
  assert.doesNotMatch(art, /<a class="[^"]*decoration-orange[^"]*"[^>]*>[^<]*<span class="arw"/)
})
