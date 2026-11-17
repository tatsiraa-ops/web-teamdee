/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A11 (อาร์ต "a7-13 มาได้"): คู่แข่งที่ชนะใส่ตัวเลขจริงใน title (ขั้นต่ำ · ราคา) · ของเราไม่มีสักหน้า
   → หน้าขายหลักบอกขั้นต่ำ/รวม VAT จากข้อมูลจริง · title ทุกหน้าที่ index ได้ ≤ 60 ตัวอักษร (Google ตัดท้าย)
   ไม่ใส่ราคาพิมพ์ลาย (อาร์ต 17 พ.ย.) · /size-chart/ คงช่วงไซซ์ใน title (หน้านี้ได้คลิก 34% · คำค้น "5XL อกเท่าไหร่") */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pages = JSON.parse(readFileSync(new URL('../wp-theme/teamdee/build/pages.json', import.meta.url), 'utf8')).pages

test('title ทุกหน้าที่ index ได้ ≤ 60 ตัวอักษร', () => {
  const long = Object.entries(pages).filter(([r, p]) => r.startsWith('/') && !/noindex/.test(p.robots || '') && [...p.title].length > 60).map(([r, p]) => `${r} ${[...p.title].length}`)
  assert.deepEqual(long, [])
})
test('หน้าขายหลักบอกขั้นต่ำใน title · /size-chart/ มีช่วงไซซ์ · /sublimation/ ไม่มีราคา', () => {
  assert.match(pages['/embroidery/'].title, /เริ่ม 10 ตัว/)
  assert.match(pages['/sublimation/'].title, /เริ่ม 10 ตัว/)
  assert.match(pages['/screen-printing/'].title, /เริ่ม 1 ตัว/)
  assert.match(pages['/size-chart/'].title, /SS–7XL/)
  assert.doesNotMatch(pages['/sublimation/'].title + pages['/sublimation/'].description, /\d{3} บาท|฿/)
  assert.match(pages['/'].description, /เริ่ม 10 ตัว/)
})
