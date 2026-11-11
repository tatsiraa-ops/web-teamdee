import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stepIndex, firstOfUse } from '../src/js/review-board.js'

/* กระดานรีวิวหน้าแรก (3 พ.ย. อาร์ต "แบบ Delicake") · ลูกศรวนรอบ · ชิปกลุ่มงาน = กระโดดไปรีวิวแรกของกลุ่ม */
test('ลูกศรถัดไป/ก่อนหน้าวนรอบ', () => {
  assert.equal(stepIndex(5, 0, 1), 1)
  assert.equal(stepIndex(5, 4, 1), 0)
  assert.equal(stepIndex(5, 0, -1), 4)
  assert.equal(stepIndex(1, 0, 1), 0)
})

test('ชิปกลุ่มงานพาไปรีวิวแรกของกลุ่ม · ไม่มีกลุ่มนั้น = คงที่เดิม', () => {
  const uses = ['corp', 'sport', 'corp', 'school']
  assert.equal(firstOfUse(uses, 'sport', 0), 1)
  assert.equal(firstOfUse(uses, 'school', 0), 3)
  assert.equal(firstOfUse(uses, 'event', 2), 2)
})

test('โมเสกรูปตามกลุ่มของรีวิวที่แสดง', async () => {
  const { groupFor } = await import('../src/js/review-board.js')
  assert.equal(groupFor(['corp', 'sport'], 1), 'sport')
  assert.equal(groupFor(['corp'], 5), 'corp')
})

test('แบบเสื้อหน้าแรก: แบบแรกของผลกรองเป็นการ์ดใหญ่ (featureIndex)', async () => {
  const { featureIndex } = await import('../src/js/gallery-feature.js')
  assert.equal(featureIndex([false, true, true]), 1)
  assert.equal(featureIndex([false, false]), -1)
})
