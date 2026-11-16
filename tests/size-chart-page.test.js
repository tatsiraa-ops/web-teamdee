/* 12 พ.ย. 2026 หน้า /size-chart/ (อาร์ต "แก้ได้เลย ทำให้ดีกว่าเดิม")
   Search Console 19 มิ.ย.–11 พ.ย.: หน้านี้พาคนเข้าเว็บมากที่สุด (564 คลิก · 114k แสดงผล) · คนค้น "ไซส์เสื้อ" 22,409 ครั้ง (docs/seo/gsc-2026-11-12.md)
   เว็บจริงมีตาราง ผู้ใหญ่ SS–7XL + เด็ก No.4–8 · หน้าใหม่เคยไม่มีตารางเลย → ต้องมีตารางจากข้อมูลที่ยืนยันแล้วเท่านั้น
   - เสื้อพิมพ์ลาย: pp-v2.json print.sizes (กราฟิกทางการ LINE OA = ตัวเลขเดียวกับเว็บจริง)
   - โปโลปัก: polo.json sizes (คู่มือสั่งเสื้อโปโลปัก TEAMDEE 9 พ.ย.) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sizeFor, toCm, visibleResults } from '../src/js/size-finder.js'
import { ppV2 } from '../src/build/content.js'

const html = readFileSync('dist-wp/size-chart/index.html', 'utf8')
const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const print = ppV2().print.sizes
const polo = JSON.parse(readFileSync('src/data/polo.json', 'utf8')).sizes
const tables = [...main.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0])
const rowsOf = (t) => [...t.matchAll(/<tr[^>]*>\s*<th scope="row"[^>]*>([^<]+)<\/th>\s*<td[^>]*>(\d+)/g)].map((m) => [m[1].trim(), Number(m[2])])

test('หัวหน้าใช้คำว่า "ไซส์" ตามที่คนค้น (title · H1)', () => {
  assert.match(html.match(/<title>([^<]*)<\/title>/)[1], /ตารางไซส์เสื้อ/)
  assert.match(text(main.match(/<h1[\s\S]*?<\/h1>/)[0]), /ตารางไซส์เสื้อ/)
  const s = (main.match(/ไซส์/g) || []).length, z = (main.match(/ไซซ์/g) || []).length
  assert.ok(s > z, `ไซส์ ${s} ครั้ง · ไซซ์ ${z} ครั้ง`)
})

test('มีตารางไซส์จริง 4 ตาราง: พิมพ์ลายผู้ใหญ่ · พิมพ์ลายเด็ก · โปโลชาย · โปโลหญิง (ตัวเลขตรงข้อมูล)', () => {
  assert.equal(tables.length, 4)
  const got = tables.map(rowsOf)
  assert.deepEqual(got[0], print.adult.map((r) => [r[0], r[1]]))
  assert.deepEqual(got[1], print.kids.map((r) => [r[0], r[1]]))
  assert.deepEqual(got[2], polo.men.map((r) => [r[0], r[1]]))
  assert.deepEqual(got[3], polo.women.map((r) => [r[0], r[1]]))
  assert.doesNotMatch(main, /ขอตารางไซ[สซ]์จากทีมดี →/, 'ไม่ใช่แค่ปุ่มขอตารางแล้ว')
})

test('ตารางบอกเซนติเมตรด้วย (ไม่ต้องสลับหน่วย)', () => {
  assert.match(tables[0], new RegExp(`${toCm(40)} ซม\\.`))
})

test('FAQ ตอบคำที่คนค้น: XL / 5XL อกเท่าไหร่ · ไซส์ใหญ่สุด · ไม่อ้างราคาที่ยังไม่ยืนยัน', () => {
  const t = text(main)
  assert.match(t, /XL อกเท่าไหร่/)
  assert.match(t, /5XL อกเท่าไหร่/)
  assert.match(t, /7XL/)
  assert.match(t, /11XL/)
  /* 12 พ.ย. อาร์ตยืนยัน: ไซส์ 2XL ขึ้นไป "ไม่มีบวกเพิ่ม" (กราฟิกเก่า +20 บาท ไม่ใช้แล้ว) */
  assert.match(t, /ราคาเดียวกันทุกไซส์ ไม่มีบวกเพิ่ม/)
  assert.doesNotMatch(t, /\+20 บาท/)
  assert.match(html, /"@type":"FAQPage"/)
})

test('ตัวช่วยหาไซส์: ช่องกรอกรอบอก + ปุ่มหน่วย', () => {
  assert.match(main, /<input[^>]*id="sizeFinder"/)
  assert.match(main, /data-size-unit="cm"/)
})

test('sizeFor: ไซส์เล็กสุดที่รอบอกไม่น้อยกว่าที่กรอก · ใหญ่เกินตาราง = null', () => {
  const rows = [['S', 38], ['M', 40], ['L', 42]]
  assert.equal(sizeFor(rows, 40), 'M')
  assert.equal(sizeFor(rows, 39), 'M')
  assert.equal(sizeFor(rows, 30), 'S')
  assert.equal(sizeFor(rows, 43), null)
  assert.equal(sizeFor(rows, NaN), null)
  assert.equal(sizeFor(rows, 0), null)
})

test('toCm: นิ้ว → ซม. ปัดจำนวนเต็ม', () => {
  assert.equal(toCm(40), 102)
  assert.equal(toCm(26), 66)
})

test('visibleResults: ตารางที่ไม่มีไซส์ตรง ซ่อนถ้าตารางอื่นในการ์ดเดียวกันมีไซส์ตรงแล้ว (ผู้ใหญ่กรอก 42" ไม่ต้องเห็น "เด็ก: ใหญ่กว่าตาราง")', () => {
  const r = [{ card: 'print', name: 'ผู้ใหญ่', s: 'L' }, { card: 'print', name: 'เด็ก', s: null }, { card: 'polo', name: 'ชาย', s: null }, { card: 'polo', name: 'หญิง', s: null }]
  assert.deepEqual(visibleResults(r).map((x) => x.name), ['ผู้ใหญ่', 'ชาย', 'หญิง'])
})
