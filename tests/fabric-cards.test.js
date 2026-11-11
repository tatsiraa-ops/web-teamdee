/* ผ้าพิมพ์ลาย /sublimation/
   รอบ 185 การ์ดสะสม → 186 ทางการ → 187 สมุดตัวอย่างผ้า → 188 วงแหวน 3D
   → 189 อาร์ต "แยกใหม่กับเก่าเป็นสองแถว · การ์ดทางการสุดๆ หรือขยายการ์ดเมื่ออยู่ตรงกลาง" เลือก A แถวเลื่อน ใบกลางขยาย */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fx from '../src/js/fabric-cards.js'
const { centerIndex, scrollLeftFor, startIndex, loopHome, nearestCopy } = fx
import { iconFor, FABRIC_ICONS } from '../src/js/fabric-icons.js'

test('รอบ 190: ไม่มีการคำนวณความใกล้กลางทุกเฟรม (ต้นเหตุกระตุก)', () => {
  assert.equal(fx.proximity, undefined)
})

test('centerIndex: ใบที่จุดกลางใกล้กลางรางที่สุด', () => {
  const centers = [170, 510, 850, 1190]
  assert.equal(centerIndex(centers, 0), 0)
  assert.equal(centerIndex(centers, 600), 1)
  assert.equal(centerIndex(centers, 700), 2)
  assert.equal(centerIndex(centers, 9999), 3)
})

test('scrollLeftFor: เลื่อนรางให้ใบเป้าหมายอยู่กลางพอดี · ไม่ติดลบ', () => {
  assert.equal(scrollLeftFor(1000, 340, 1200), 1000 + 170 - 600)
  assert.equal(scrollLeftFor(100, 340, 1200), 0)
})

test('startIndex: เริ่มที่ใบกลางแถว ซ้ายขวาไม่โล่ง', () => {
  assert.equal(startIndex(8), 3)
  assert.equal(startIndex(6), 2)
  assert.equal(startIndex(1), 0)
})

/* รอบ 191 อาร์ต "เลื่อนแล้ววนกลับมาที่เดิมได้มั้ย แบบไม่มีสิ้นสุด และบอกจุดเริ่มหรือสิ้นสุดไว้ด้วย กันงง"
   รางมี 3 ชุด: สำเนาก่อน (0..n-1) · ของจริง (n..2n-1) · สำเนาหลัง (2n..3n-1) · หยุดเลื่อนในสำเนา = กระโดดกลับใบจริงใบเดียวกัน */
test('loopHome: ใบในสำเนา → ใบจริงที่ตรงกัน · ใบจริงอยู่ที่เดิม', () => {
  assert.equal(loopHome(3, 8), 11, 'สำเนาก่อน ใบ 4 → ของจริง ใบ 4')
  assert.equal(loopHome(17, 8), 9, 'สำเนาหลัง ใบ 2 → ของจริง ใบ 2')
  assert.equal(loopHome(12, 8), 12, 'ของจริงไม่ต้องย้าย')
  assert.equal(loopHome(0, 6), 6)
  assert.equal(loopHome(17, 6), 11)
})

test('nearestCopy: กดจุดบอกตำแหน่ง → ไปชุดที่ใกล้ใบปัจจุบันที่สุด (หมุนทางสั้น)', () => {
  assert.equal(nearestCopy(0, 15, 8), 16, 'อยู่ใบสุดท้าย (ของจริง) กดใบแรก → ไปข้างหน้า 1 ใบ ไม่ย้อน 7 ใบ')
  assert.equal(nearestCopy(7, 8, 8), 7, 'อยู่ใบแรก กดใบสุดท้าย → ถอย 1 ใบ')
  assert.equal(nearestCopy(4, 11, 8), 12)
})

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
