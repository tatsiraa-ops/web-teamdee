/* คำบนหน้าแบบเสื้อที่อาร์ตเคาะแล้ว (26 ต.ค. 2026) ต้องไม่ถูก scripts/v22/use-pages.mjs เขียนทับกลับเป็นของ v22
   (เคยเกิดจริง: รันตัวสร้างใหม่แล้ว H1 กลับเป็น "แบบเสื้อพิมพ์ลาย แบ่งตาม…" โดยเทสอื่นไม่จับ) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const d = JSON.parse(readFileSync(new URL('../src/data/design-pages.json', import.meta.url), 'utf8'))
const ug = JSON.parse(readFileSync(new URL('../src/data/use-pages.json', import.meta.url), 'utf8'))

test('/designs/: ชื่อหน้า "แบบเสื้อที่ใช่ สำหรับทีมคุณ" · หัวข้อตัวกรอง "ค้นหาและกรองแบบเสื้อ" · ย่อหน้าแรกมีคำค้น', () => {
  assert.equal(d.index.h1, 'แบบเสื้อที่ใช่ สำหรับทีมคุณ', 'รอบ 150 บอร์ด "หน้าแบบเสื้อ"')
  assert.equal(d.index.pillsH, 'ค้นหาและกรองแบบเสื้อ')
  assert.match(d.index.lead, /^แบบเสื้อทีม/)
})

test('แกลเลอรี 10 กลุ่ม: ย่อหน้าแรกและคำอธิบายหน้าไม่ซ้ำกัน', () => {
  const g = Object.values(d.groups)
  assert.equal(g.length, 10)
  for (const k of ['lead', 'desc']) {
    assert.ok(g.every((x) => x[k]), k)
    assert.equal(new Set(g.map((x) => x[k])).size, 10, k)
  }
})

test('หน้ากลุ่มลูกค้า 10 หน้า: ย่อหน้าทีมและย่อหน้าราคาไม่ซ้ำกัน', () => {
  const ids = Object.keys(ug).filter((k) => k[0] !== '_')
  assert.equal(new Set(ids.map((i) => ug[i].team.p[0])).size, ids.length)
  assert.equal(new Set(ids.map((i) => ug[i].plan.price?.p[0]).filter(Boolean)).size, ids.filter((i) => ug[i].plan.price).length)
})
