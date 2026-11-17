/* ผ้าพิมพ์ลาย /sublimation/
   รอบ 185 การ์ดสะสม → 186 ทางการ → 187 สมุดตัวอย่างผ้า → 188 วงแหวน 3D
   → 189 อาร์ต "แยกใหม่กับเก่าเป็นสองแถว · การ์ดทางการสุดๆ หรือขยายการ์ดเมื่ออยู่ตรงกลาง" เลือก A แถวเลื่อน ใบกลางขยาย */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { iconFor, FABRIC_ICONS } from '../src/js/fabric-icons.js'

/* 17 พ.ย. 2026 อาร์ต "เปลี่ยนเป็นโชว์ทั้งหมด": เลิกรางเลื่อนวน (fabric-cards.js ลบแล้ว) · ผ้าทุกชนิดอยู่ในตาราง (tests/pp-v2.test.js) */

test('iconFor: จุดเด่นทุกคำของผ้า 14 ชนิดได้ไอคอนที่มีจริง · คำที่มีหลายเรื่องใช้เรื่องแรกที่ตรง', () => {
  const tags = ['คงรูปไม่ย้วย', 'ซับเหงื่อได้ดี', 'ดูแลรักษาง่าย', 'ทนทานสูง', 'นุ่มเบา', 'บางเบา', 'ผิวสัมผัสนุ่ม', 'ผิวสัมผัสมีมิติ', 'ยับยาก', 'ยับยาก ไม่ย้วย', 'ยืดหยุ่นดีเยี่ยม', 'ยืดหยุ่นสูง', 'ยืดได้หลายทิศทาง', 'ระบายอากาศดี', 'ระบายอากาศดีเยี่ยม', 'ระบายอากาศได้ดี', 'ลวดลายมีมิติ', 'ลวดลายโดดเด่น', 'ลายผ้าชัด มีลูกเล่น', 'สัมผัสนุ่ม', 'อยู่ทรง', 'อยู่ทรงสวย', 'เบา นุ่มลื่น เงางาม', 'เบาสบาย', 'เบาสบาย แห้งไว', 'แห้งเร็ว', 'แห้งไว', 'แห้งไว ดูแลง่าย', 'ไม่ขึ้นขน', 'ไม่ต้องรีด', 'ไม่ยับ ไม่ย้วย', 'ไม่อับง่าย', 'ไม่แนบตัว']
  for (const t of tags) assert.ok(FABRIC_ICONS[iconFor(t)], `${t} → ${iconFor(t)}`)
  assert.equal(iconFor('ระบายอากาศดี'), 'air')
  assert.equal(iconFor('แห้งไว'), 'dry')
  assert.equal(iconFor('เบาสบาย แห้งไว'), 'dry')
  assert.equal(iconFor('ซับเหงื่อได้ดี'), 'drop')
  assert.equal(iconFor('ยืดหยุ่นสูง'), 'stretch')
  assert.equal(iconFor('ทนทานสูง'), 'shield')
  assert.equal(iconFor('ไม่ต้องรีด'), 'crease')
  assert.equal(iconFor('ยับยาก ไม่ย้วย'), 'crease')
  assert.equal(iconFor('อยู่ทรงสวย'), 'shape')
  assert.equal(iconFor('ลวดลายโดดเด่น'), 'spark')
  assert.equal(iconFor('ไม่ขึ้นขน'), 'lint')
  assert.equal(iconFor('นุ่มเบา'), 'soft')
  assert.equal(iconFor('คำอื่น'), 'dot')
  for (const [k, d] of Object.entries(FABRIC_ICONS)) assert.match(d, /^<(path|circle|rect|polyline|line)/, k)
  for (const w of ['event', 'team', 'corp', 'run', 'badminton', 'sport', 'uniform', 'work', 'craft', 'fashion']) assert.ok(FABRIC_ICONS[`u-${w}`], `u-${w}`)
})
