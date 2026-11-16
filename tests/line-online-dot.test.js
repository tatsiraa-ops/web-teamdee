/* 16 พ.ย. 2026 อาร์ต (ภาพปุ่ม LINE ลอยขวาล่าง จุดเขียวขอบขาวทับฟองแชท) "แก้ให้ไม่ทับไอคอนไลน์จนเกินไป"
   ต้นเหตุ: จุดออนไลน์ออกแบบให้ลูกกลม 68px (top/right 2px) · คอมย่อไอคอนเหลือ 40px และสั่ง content: none
   แต่ตัวเลือก :has(.fcta__sub.is-open) หนักกว่า → ในเวลาทำการจุดกลับมาที่มุมใน 2px ของไอคอน 40px = ทับฟองแชท
   แก้: คอม (≥1024) จุดเล็กลงและเกาะมุมนอกไอคอน (ค่าติดลบ) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/styles/main.css', import.meta.url), 'utf8')

test('คอม: จุดออนไลน์บนปุ่ม LINE ลอยอยู่มุมนอกไอคอน ไม่ทับฟองแชท', () => {
  const blocks = [...css.matchAll(/@media \(min-width: 1024px\) \{([\s\S]*?)\n\}/g)].map((m) => m[1])
  const rule = blocks.join('\n').match(/\.fcta__btn--line:has\(\.fcta__sub\.is-open\) \.fcta__orb::after \{([^}]*)\}/)
  assert.ok(rule, 'มีกฎจุดออนไลน์สำหรับคอม (น้ำหนักเท่ากฎเดิม จึงทับได้)')
  const px = (k) => Number((rule[1].match(new RegExp(`${k}: (-?\\d+(?:\\.\\d+)?)px`)) || [])[1])
  assert.ok(px('top') < 0 && px('right') < 0, 'อยู่นอกกรอบไอคอน')
  assert.ok(px('width') <= 14 && px('height') <= 14, 'จุดเล็กลงตามไอคอน 40px')
  /* กฎคอมต้องอยู่หลังกฎเดิม (น้ำหนักเท่ากัน ตัวหลังชนะ) */
  assert.ok(css.lastIndexOf('.fcta__btn--line:has(.fcta__sub.is-open) .fcta__orb::after {') > css.indexOf('.fcta__btn--line:has(.fcta__sub.is-open) .fcta__orb::after {'))
})
