import { test } from 'node:test'
import assert from 'node:assert/strict'
import { designDetail, designSlug } from '../src/js/design-page.js'

const uses = [{ id: 'sport', name: 'เสื้อกีฬา' }, { id: 'corp', name: 'เสื้อบริษัท' }]
const d = { code: 'TD-0001', img: '/img/design/d01.webp', garmentName: 'เสื้อฟุตบอล Jersey', techName: 'พิมพ์ลาย', use: ['sport'], color: 'น้ำเงิน', style: ['stripe'] }

test('URL หน้าแบบ: /design-[รหัส]/ ตัวพิมพ์เล็ก (v22)', () => {
  assert.equal(designSlug('TD-0001'), '/design-td-0001/')
})

test('หน้ารายละเอียดแบบ: H1 / ตารางรายละเอียด / ไปต่อ ตามแม่แบบ v22 · ช่องที่ยังไม่มีข้อมูลเป็น [รอ]', () => {
  const v = designDetail(d, { uses, contactHref: '/contact-us/' })
  assert.equal(v.h1, 'แบบเสื้อกีฬา พิมพ์ลาย รหัส TD-0001')
  assert.deepEqual(v.rows.map(([k]) => k), ['ประเภทแบบ', 'กลุ่มการใช้งาน', 'แนวทาง', 'รายละเอียดปรับแบบ', 'ทรงและผ้า'])
  assert.equal(v.rows[1][1], 'เสื้อกีฬา')
  assert.equal(v.use.id, 'sport')
  assert.match(v.quoteHref, /code=TD-0001/)
})
