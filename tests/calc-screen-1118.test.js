/* 18 พ.ย. 2026 เครื่องคำนวณ /calculations/: แผงสกรีน DTF (บริการ · เสื้อ · ลาย 1–3 จุด · ไซซ์ 2XL+) · ตรวจ HTML ที่ export แล้ว
   รัน npm run build && npm run export:wp ก่อน · ตรรกะราคาเทสใน screen-price-1118 / estimate */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../wp-theme/teamdee/build/pages/calculations.body.html', import.meta.url), 'utf8')
const js = readFileSync(new URL('../src/js/calc-page.js', import.meta.url), 'utf8')
/* แผง = ตั้งแต่ fieldset data-screen ถึงหมายเหตุท้ายแผง (data-screen-end) */
const panel = html.slice(html.indexOf('data-screen hidden'), html.indexOf('data-screen-end'))

test('แผงสกรีนอยู่ในขั้น 1 · ซ่อนจนเลือกการ์ดสกรีน', () => {
  assert.match(html, /<fieldset class="calc__sub calc-screen" data-screen hidden disabled>/)
  assert.match(html, /name="kind" value="screen"/)
  assert.doesNotMatch(html, /value="screen-oversize"/)
})

test('บริการ 2 ทาง · เสื้อ 2 รุ่น · ลาย 3 ช่อง (ช่อง 2–3 มี "ไม่มี") · ช่องไซซ์ใหญ่ · ทุกช่องมีชื่อ', () => {
  assert.match(panel, /name="svc" value="own" checked/)
  assert.match(panel, /name="svc" value="customer"/)
  assert.match(panel, /name="shirt" value="premium" checked/)
  assert.match(panel, /name="shirt" value="oversize"/)
  const selects = panel.match(/<select[^>]*name="spot"[^>]*>/g) || []
  assert.equal(selects.length, 3)
  for (const n of [1, 2, 3]) assert.match(panel, new RegExp(`<label[^>]*for="spot${n}"[^>]*>ลายจุดที่ ${n}`))
  assert.match(panel, /<select id="spot1" name="spot"[^>]*>(?:(?!<\/select>)[\s\S])*<option value="A4" selected>/)
  for (const n of [2, 3]) assert.match(panel, new RegExp(`<select id="spot${n}" name="spot"[^>]*>\\s*<option value="">ไม่มี</option>`))
  assert.match(panel, /<option value="A3"[^>]*>A3 · 30 × 40 ซม\. · เต็มหลัง · เต็มหน้า<\/option>/)
  /* ข้อความในป้ายโดนตัวตัดบรรทัดไทยห่อ (<t-g>) → เทียบหลังตัดแท็ก */
  assert.match((panel.match(/<label for="big">[\s\S]*?<\/label>/) || [''])[0].replace(/<[^>]+>/g, ''), /ไซซ์ 2XL ขึ้นไป/)
  assert.match(panel, /<input id="big" name="big" type="number"[^>]*min="0"/)
})

test('ใบประเมินมีแตกรายการ + วันผลิต/แผนชำระ (ซ่อนเมื่อไม่ใช่สกรีน)', () => {
  assert.match(html, /<ul class="slip__lines tabular-nums" id="sLines" hidden><\/ul>/)
  assert.match(html, /<p class="slip__meta" id="sMeta" hidden><\/p>/)
  assert.match(html, /id="sPayLine"/)
})

test('calc-page.js ส่งค่าแผงสกรีนเข้า estimate และเติมค่าจากลิงก์', () => {
  assert.match(js, /service: form\.querySelector\('input\[name="svc"\]:checked'\)\?\.value/)
  assert.match(js, /spots: \[\.\.\.form\.querySelectorAll\('select\[name="spot"\]'\)\]\.map\(\(x\) => x\.value\)\.filter\(Boolean\)/)
  assert.match(js, /tick\('svc', pre\.service\)/)
  assert.match(js, /tick\('shirt', pre\.shirt\)/)
})

test('ไม่มีการ์ดสกรีนแบบเก่า (สกรีน Premium / สกรีน Oversize) · คำว่า DFT ทั้งหน้าตรวจใน screen-copy-1118', () => {
  assert.doesNotMatch(html, /สกรีน Premium|สกรีน Oversize/)
  assert.doesNotMatch(panel, /DFT/)
})
