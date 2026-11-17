/* คลังรีวิว (10 พ.ย. 2026) · ผนังรูปเรียงเต็มแถว: ซ่อนแถวท้ายที่ไม่เต็ม และไม่เกิน 10 แถว (มือถือ 7) — อาร์ต "เยอะๆ 10 แถวได้"
   rowsToHide รับตำแหน่งบน (top) และความกว้างของแต่ละรูป + ความกว้างผนัง → คืน index ที่ต้องซ่อน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/js/review-wall.js', import.meta.url), 'utf8')
/* ไฟล์ import lightbox.js (ใช้ DOM) → ทดสอบฟังก์ชันคำนวณโดยดึงโค้ดออกมาตรงๆ */
const rowsToHide = new Function(`${src.slice(src.indexOf('export function rowsToHide')).replace('export function', 'function').split('\nexport function initReviewWall')[0]}; return rowsToHide`)()

const coveredByCta = new Function(`${src.match(/export const coveredByCta = [^\n]+/)[0].replace('export const', 'const')}; return coveredByCta`)()

const row = (top, n, w) => Array.from({ length: n }, () => ({ top, w }))

test('ซ่อนแถวท้ายที่ไม่เต็ม (เหลือรูปเดี่ยว)', () => {
  const items = [...row(0, 5, 196), ...row(210, 5, 196), ...row(420, 1, 300)]
  assert.deepEqual(rowsToHide(items, 1000, 10), [10])
})

test('แถวท้ายเต็ม (≥ 85% ของผนัง) ไม่ซ่อน', () => {
  const items = [...row(0, 5, 196), ...row(210, 4, 220)]
  assert.deepEqual(rowsToHide(items, 1000, 10), [])
})

test('ไม่เกินจำนวนแถวที่กำหนด', () => {
  const items = [...row(0, 2, 490), ...row(100, 2, 490), ...row(200, 2, 490)]
  assert.deepEqual(rowsToHide(items, 1000, 2), [4, 5])
})

test('อาร์ต "เอาเป็น 6 แถวพอ" · import lightbox แบบปกติ (dynamic import ทำ CSS ใน WP โหลดไม่ขึ้น)', () => {
  assert.match(src, /export const MAX_ROWS = 6/)
  assert.match(src, /^import \{ initLightbox \} from '\.\/lightbox\.js'/)
  assert.doesNotMatch(src, /import\('\.\/lightbox\.js'\)/)
})

/* 17 พ.ย. 2026 รอบตรวจ a11y (WCAG 2.5.8 + 2.4.11): ปุ่ม "ดูรีวิวลูกค้าทั้งหมด" / LINE วางทับแถวท้ายที่จาง (margin-top ติดลบ)
   รูปใต้ปุ่มเหลือพื้นที่กดแค่ ~13px และกด Tab แล้วโฟกัสไปอยู่ใต้ปุ่ม → รูปที่ขอบล่างเลยขอบบนของปุ่ม = inert (ยังเห็นจางๆ แต่กด/Tab ไม่ได้) */
test('coveredByCta: รูปที่ขอบล่างเลยขอบบนกล่องปุ่ม = ถูกบัง', () => {
  const items = [{ top: 0, bottom: 200 }, { top: 210, bottom: 410 }, { top: 420, bottom: 620 }]
  assert.deepEqual(coveredByCta(items, { top: 500 }), [2])
  assert.deepEqual(coveredByCta(items, { top: 400 }), [1, 2])
  assert.deepEqual(coveredByCta(items, { top: 700 }), [])
})
