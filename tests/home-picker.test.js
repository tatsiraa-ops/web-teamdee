import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planFor } from '../src/js/home-plan.js'
import { readPrefill } from '../src/js/estimate.js'

const uses = [
  { id: 'corp', name: 'บริษัท', recommend: [{ id: 'polo', name: 'เสื้อโปโลปัก' }, { id: 'print', name: 'เสื้อพิมพ์ลาย' }] },
  { id: 'sport', name: 'กีฬา', recommend: [{ id: 'print', name: 'เสื้อพิมพ์ลาย' }, { id: 'jersey', name: 'Jersey' }, { id: 'baseball', name: 'เบสบอล' }] },
]
const pricing = {
  kinds: [{ id: 'round' }, { id: 'collar' }, { id: 'screen' }],
  bands: [{ id: '10-20', label: '10–20' }, { id: '21-50', label: '21–50' }, { id: '200+', label: '200 ขึ้นไป' }],
}

test('แนะนำตัวแรกของกลุ่มเป็นตัวหลัก ที่เหลือเป็นทางเลือก', () => {
  const p = planFor(uses, pricing, 'sport', '21-50')
  assert.equal(p.main.id, 'print')
  assert.deepEqual(p.alts.map((x) => x.id), ['jersey', 'baseball'])
})

test('ลิงก์ไปเครื่องคิดราคาเลือกประเภทให้ตรง โปโลปัก = คอปก นอกนั้นคอกลม', () => {
  assert.equal(planFor(uses, pricing, 'corp', '10-20').calcQuery, '?kind=collar&band=10-20')
  assert.equal(planFor(uses, pricing, 'sport', '200+').calcQuery, '?kind=round&band=200%2B')
})

test('กลุ่มหรือช่วงจำนวนที่ไม่มี คืน null ไม่เดา', () => {
  assert.equal(planFor(uses, pricing, 'xx', '10-20'), null)
  assert.equal(planFor(uses, pricing, 'corp', '9-9'), null)
})

test('หน้าคิดราคาอ่านค่าที่ส่งมาจากหน้าแรก', () => {
  assert.deepEqual(readPrefill(pricing, '?kind=collar&band=200%2B'), { kind: 'collar', band: '200+' })
})

test('ค่าที่ส่งมาไม่ถูกต้องถูกทิ้ง ไม่ทำให้ฟอร์มพัง', () => {
  assert.deepEqual(readPrefill(pricing, '?kind=xx&band=21-50'), { kind: null, band: '21-50' })
  assert.deepEqual(readPrefill(pricing, ''), { kind: null, band: null })
})

test('คำแนะนำบอกจำนวนที่เลือกด้วย เปลี่ยนจำนวนแล้วข้อความต้องเปลี่ยนตาม', () => {
  assert.equal(planFor(uses, pricing, 'corp', '10-20').qtyText, 'สำหรับ 10–20 ตัว')
  assert.equal(planFor(uses, pricing, 'corp', '200+').qtyText, 'สำหรับ 200 ตัวขึ้นไป')
  assert.equal(planFor(uses, pricing, 'corp', '200+').ctaText, 'คำนวณราคา 200 ตัวขึ้นไป')
  assert.equal(planFor(uses, pricing, 'corp', '21-50').ctaText, 'คำนวณราคา 21–50 ตัว')
})
