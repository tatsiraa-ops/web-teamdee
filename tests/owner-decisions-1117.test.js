/* 17 พ.ย. 2026 อาร์ตตัดสินหลังรอบตรวจ:
   5) หน้าเช็กลิสต์ /team-shirt-order-checklist/ "เอาเก็บไว้ก็ดี" → เปิดให้ Google เก็บ (เดิม noindex ทั้งที่ลิงก์เข้าจาก 11 หน้า)
   2) ข้อความใต้รูปวัดไซซ์ "ภาพประกอบตำแหน่งวัด ไม่ใช่มาตราส่วนจริง" เอาออก
   6) "เคลมฟรี" กับ "แจ้งวิธีแก้เป็นรายกรณี" ใช้ทั้งหมด → FAQ หลังการขายพูดทั้งสองอย่าง ไม่ขัดกับหน้าแรก/โปโล */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('หน้าเช็กลิสต์เปิดให้ Google เก็บ + description ยาว 70–160', () => {
  const html = read('site/team-shirt-order-checklist/index.html')
  assert.doesNotMatch(html, /name="robots" content="noindex/)
  const d = html.match(/<meta name="description" content="([^"]+)"/)[1]
  assert.ok([...d].length >= 70 && [...d].length <= 160, `ยาว ${[...d].length}`)
})

test('ใต้รูปวัดไซซ์ไม่มีข้อความ "ภาพประกอบ…ไม่ใช่มาตราส่วนจริง"', () => {
  const hbs = read('src/partials/guideMaterialLab.hbs')
  assert.doesNotMatch(hbs, /ภาพประกอบ/)
  assert.doesNotMatch(hbs, /g-lab__diagram-note/)
})

test('FAQ หลังการขาย: เคลมฟรี + แจ้งวิธีแก้เป็นรายกรณี', () => {
  const faq = read('src/data/faq.json')
  const all = faq.match(/ปัญหาจากการผลิต แจ้งภายใน 7 วัน[^"]*/g)
  assert.ok(all && all.length >= 1)
  for (const a of all) { assert.match(a, /เคลมฟรี/); assert.match(a, /รายกรณี/) }
})
