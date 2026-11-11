/* คลังรีวิว (10 พ.ย. 2026) · ผนังรูปเรียงเต็มแถว: ซ่อนแถวท้ายที่ไม่เต็ม และไม่เกิน 10 แถว (มือถือ 7) — อาร์ต "เยอะๆ 10 แถวได้"
   rowsToHide รับตำแหน่งบน (top) และความกว้างของแต่ละรูป + ความกว้างผนัง → คืน index ที่ต้องซ่อน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/js/review-wall.js', import.meta.url), 'utf8')
/* ไฟล์ import lightbox.js (ใช้ DOM) → ทดสอบฟังก์ชันคำนวณโดยดึงโค้ดออกมาตรงๆ */
const rowsToHide = new Function(`${src.slice(src.indexOf('export function rowsToHide')).replace('export function', 'function').split('\nexport function initReviewWall')[0]}; return rowsToHide`)()

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
