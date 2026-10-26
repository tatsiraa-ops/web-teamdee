import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { planFor } from '../src/js/home-plan.js'
import { readCalcQuery } from '../src/js/estimate.js'
import { calcKinds, calcPricing } from '../src/js/prices.js'

const uses = [
  { id: 'corp', name: 'บริษัท', recommend: [{ id: 'polo', name: 'เสื้อโปโลปัก' }, { id: 'print', name: 'เสื้อพิมพ์ลาย' }] },
  { id: 'sport', name: 'กีฬา', recommend: [{ id: 'print', name: 'เสื้อพิมพ์ลาย' }, { id: 'jersey', name: 'Jersey' }, { id: 'baseball', name: 'เบสบอล' }] },
]
const pricing = {
  kindOf: { polo: 'polo', print: 'round', jersey: 'jersey', baseball: 'baseball' },
  bands: [{ id: '10-20', label: '10–20', min: 10 }, { id: '21-50', label: '21–50', min: 21 }, { id: '200+', label: '200 ขึ้นไป', min: 200 }],
}

test('แนะนำตัวแรกของกลุ่มเป็นตัวหลัก ที่เหลือเป็นทางเลือก', () => {
  const p = planFor(uses, pricing, 'sport', '21-50')
  assert.equal(p.main.id, 'print')
  assert.deepEqual(p.alts.map((x) => x.id), ['jersey', 'baseball'])
})

test('ลิงก์ไปเครื่องคิดราคาเลือกสินค้าให้ตรง โปโลปัก = โปโล (ไม่ใช่พิมพ์ลายคอปก) · จำนวน = ต้นช่วงที่เลือก', () => {
  assert.equal(planFor(uses, pricing, 'corp', '10-20').calcQuery, '?kind=polo&qty=10')
  assert.equal(planFor(uses, pricing, 'sport', '200+').calcQuery, '?kind=round&qty=200')
})

test('กลุ่มหรือช่วงจำนวนที่ไม่มี คืน null ไม่เดา', () => {
  assert.equal(planFor(uses, pricing, 'xx', '10-20'), null)
  assert.equal(planFor(uses, pricing, 'corp', '9-9'), null)
})

test('ข้อมูลจริง: ตัวช่วยหน้าแรกส่งโปโลไปเครื่องคิดแล้วได้ราคาโปโลจูติ 220 ไม่ใช่คอปกพิมพ์ลาย 329', () => {
  const P = JSON.parse(readFileSync(new URL('../src/data/prices.json', import.meta.url), 'utf8'))
  const real = calcPricing(P)
  assert.deepEqual(real.kindOf, { polo: 'polo', print: 'round', baseball: 'baseball', jersey: 'jersey', screen: 'screen' })
  const q = readCalcQuery(calcKinds(P), planFor(uses, real, 'corp', '10-20').calcQuery)
  assert.deepEqual(q, { kind: 'polo', qty: 10, fabric: null, options: [] })
})

test('คำแนะนำบอกจำนวนที่เลือกด้วย เปลี่ยนจำนวนแล้วข้อความต้องเปลี่ยนตาม', () => {
  assert.equal(planFor(uses, pricing, 'corp', '10-20').qtyText, 'สำหรับ 10–20 ตัว')
  assert.equal(planFor(uses, pricing, 'corp', '200+').qtyText, 'สำหรับ 200 ตัวขึ้นไป')
  assert.equal(planFor(uses, pricing, 'corp', '200+').ctaText, 'คำนวณราคา 200 ตัวขึ้นไป')
  assert.equal(planFor(uses, pricing, 'corp', '21-50').ctaText, 'คำนวณราคา 21–50 ตัว')
})

import { faqMoreLabel } from '../src/js/faq-more.js'

test('FAQ มือถือ: ป้ายปุ่มบอกจำนวนที่ซ่อน · เปิดแล้วเป็นย่อกลับ', () => {
  assert.equal(faqMoreLabel(5, false), 'ดูอีก 5 คำถาม')
  assert.equal(faqMoreLabel(5, true), 'ย่อคำถามกลับ')
})
