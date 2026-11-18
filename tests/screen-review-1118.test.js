/* 18 พ.ย. 2026 แก้ตามรีวิวรวม (สกรีน DTF): หน้าสกรีน/llms ไม่ขัดกับกติกาใหม่ · ใบสรุปบวกเลขแล้วตรง · ช่องกรอกแผงสกรีนตามมาตรฐานเว็บ
   รัน npm run build && npm run export:wp ก่อน */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { estimate } from '../src/js/estimate.js'
import { calcKinds } from '../src/js/prices.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const P = JSON.parse(read('src/data/prices.json'))
const S = P.products.screen
const site = JSON.parse(read('src/data/site.json'))
const lead = JSON.parse(read('src/data/lead-times.json'))
const html = read('wp-theme/teamdee/build/pages/screen-printing.body.html')

test('หน้าสกรีน: ไม่มีบรรทัดชำระ "มัดจำ 50%" แบบทั่วไป · วิธีนับวันใช้งานด่วนของสกรีน', () => {
  assert.ok(!html.includes(site.payLine), 'site.payLine')
  /* ตัวตัดบรรทัดไทยห่อคำด้วยแท็ก → เทียบหลังตัดแท็ก */
  const how = (html.match(/<details class="nb-how[\s\S]*?<\/details>/) || [''])[0].replace(/<[^>]+>/g, '')
  assert.ok(how.includes(S.rush), 'S.rush')
  assert.ok(!how.includes(lead.rush), 'lead.rush')
})

test('llms.txt: ชำระเงินและงานด่วนบอกข้อยกเว้นของสกรีน', () => {
  const t = read('wp-theme/teamdee/build/llms.txt')
  assert.match(t, new RegExp(`ชำระเงิน:[^\\n]*สกรีน DTF: มัดจำขึ้นแบบ ${S.deposit} บาท`))
  assert.ok(t.split('\n').some((l) => l.includes(lead.rush) && l.includes(S.rush)), 'rush line')
})

test('ใบสรุป: ราคาต่อตัว × จำนวน + บวกเพิ่ม = ยอดรวม (ไซซ์ใหญ่ · ค่าส่ง)', () => {
  const K = calcKinds(P)
  for (const o of [{ qty: 35, spots: ['A4'], big: 3 }, { qty: 20, spots: ['A4'] }, { qty: 20, spots: ['A3', 'A7'], big: 2 }, { qty: 80, spots: ['A4', 'A4'] }]) {
    const r = estimate(K, { kind: 'screen', service: 'own', shirt: 'premium', ...o })
    assert.equal(r.unit * r.qty + r.extra.amount, r.total, JSON.stringify(o))
  }
  const a = estimate(K, { kind: 'screen', qty: 20, spots: ['A3', 'A7'], big: 2, service: 'own', shirt: 'premium' })
  assert.equal(a.extra.amount, 90); assert.match(a.extra.names, /ไซซ์ 2XL ขึ้นไป 2 ตัว · ค่าส่ง/)
  assert.equal(estimate(K, { kind: 'screen', qty: 80, spots: ['A4'], service: 'own', shirt: 'premium' }).extra.amount, 0)
  const page = read('site/calculations/index.html')
  assert.match(page, /<div><dt>× จำนวน<\/dt><dd id="sQty">–<\/dd><\/div>\s*<div id="rExtra" hidden><dt>บวกเพิ่ม<span id="sExtraNames"><\/span><\/dt><dd id="sExtra"><\/dd><\/div>/)
})

test('ช่องเลือกลาย/ไซซ์ใหญ่: ตัวอักษร ≥16px (iOS ไม่ซูม) · ขอบ 2px สีช่องกรอก (คอนทราสต์ 3:1)', () => {
  const rule = (read('src/styles/page-calculations.css').match(/\.calc-spot select, \.calc-big input \{[^}]*\}/) || [''])[0]
  assert.match(rule, /font-size: 16px/); assert.match(rule, /border: 2px solid var\(--color-field\)/)
})
