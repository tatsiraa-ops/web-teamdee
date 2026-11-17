/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A1 (อาร์ต "a 1-6"): /llms.txt ให้ AI อ่านข้อมูลบริษัท ขั้นต่ำ ราคา วันผลิต ในไฟล์เดียว
   สร้างตอน export จากข้อมูลจริง (site.json · prices.json · lead-times.json · pages.json) · ธีมส่งที่ /llms.txt
   ไม่มีราคาพิมพ์ลาย (อาร์ต 17 พ.ย. ไม่ใส่ราคาบน /sublimation/) · ไม่มีคำว่าโรงงาน · ตัวเลขผลงานชุดเว็บใหม่ */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { llmsText } from '../src/build/llms.js'

const json = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
const pages = { '/': { title: 'รับทำเสื้อทีม | TEAMDEE', description: 'd' }, '/embroidery/': { title: 'โปโลปัก | TEAMDEE', description: 'ปัก' }, '/sublimation/': { title: 'พิมพ์ลาย | TEAMDEE', description: 'พิมพ์' }, '/search/': { title: 's', description: 's', robots: 'noindex, follow' }, '404': { title: 'x' } }
const t = llmsText({ site: json('site.json'), prices: json('prices.json'), lead: json('lead-times.json'), pages })

test('llms.txt: หัว + ข้อมูลบริษัทจาก site.json', () => {
  assert.match(t, /^# TEAMDEE \(ทีมดี\)\n/)
  assert.match(t, /บริษัท ดีดี ฟินิกซ์ จำกัด/)
  assert.ok(t.includes(json('site.json').address))
  assert.match(t, /097-549-5941/); assert.match(t, /@teamdee/); assert.match(t, /2018/)
  assert.match(t, /2,800\+ องค์กร/); assert.match(t, /10,000\+ งาน/)
})

test('llms.txt: เงื่อนไข + ราคาเริ่มต้นจาก prices.json · ไม่มีราคาพิมพ์ลาย', () => {
  assert.match(t, /ขั้นต่ำ 10 ตัว/); assert.match(t, /รวม VAT/); assert.match(t, /มัดจำ 50%/)
  assert.match(t, /โปโลปัก[^\n]*จูติ 220[^\n]*ดรายเทค 390/)
  assert.match(t, /สกรีน DFT[^\n]*เริ่ม 1 ตัว[^\n]*290/)
  assert.match(t, /เบสบอล[^\n]*359/)
  assert.doesNotMatch(t, /279|329/, 'ไม่มีราคาพิมพ์ลาย')
  assert.match(t, /งานปัก 10–15 วัน/); assert.match(t, /งานด่วนเร็วสุด 7 วัน/)
})

test('llms.txt: หน้าหลักจาก pages.json (ไม่เอา noindex / 404) · ไม่มีคำว่าโรงงาน', () => {
  assert.match(t, /- \[โปโลปัก\]\(https:\/\/team-dee\.com\/embroidery\/\): ปัก/)
  assert.doesNotMatch(t, /\/search\/|404/)
  assert.doesNotMatch(t, /โรงงาน/)
})

test('export เขียน build/llms.txt · ธีมส่งที่ /llms.txt เป็น text/plain', () => {
  const exp = readFileSync(new URL('../scripts/export-wp.mjs', import.meta.url), 'utf8')
  assert.match(exp, /writeFileSync\(join\(out, 'llms\.txt'\), llmsText\(/)
  const php = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
  const f = php.slice(php.indexOf('function td_serve_llms('), php.indexOf("add_action('parse_request', 'td_serve_llms'"))
  assert.match(f, /td_request_route\(\) !== '\/llms\.txt\/'\) return/)
  assert.match(f, /Content-Type: text\/plain; charset=utf-8/)
  assert.match(php, /add_action\('parse_request', 'td_serve_llms', 0\)/)
})
