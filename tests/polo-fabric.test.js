/* 11 พ.ย. 2026 แผงผ้า + สี + ราคา หน้างานปัก (src/js/polo-fabric.js · pp2PoloFabric.hbs)
   ชื่อผ้าใน polo.json ขึ้นต้นด้วย "ผ้า" อยู่แล้ว → ข้อความ LINE ต้องไม่เป็น "ขอตัวอย่างผ้าผ้า…" (เจอตอนตรวจหน้าจริง) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { askText } from '../src/js/polo-fabric.js'

test('ข้อความขอตัวอย่าง: ชื่อผ้าไม่ซ้ำคำว่าผ้า · มีรหัสสีที่เลือก', () => {
  assert.equal(askText('ผ้าทีซี ลาคอส', '35DF'), 'ขอตัวอย่างผ้าทีซี ลาคอส\nสีที่สนใจ: 35DF\nจำนวนที่จะสั่งประมาณ:  ตัว')
  assert.doesNotMatch(askText('ผ้าจูติ', ''), /ผ้าผ้า/)
})

test('ลิงก์ขอตัวอย่างตั้งต้นในหน้า (ก่อนเลือกสี) ไม่มี "ผ้าผ้า"', () => {
  const h = readFileSync('dist-wp/embroidery/index.html', 'utf8')
  const asks = [...h.matchAll(/class="pp-more pf2__ask" href="([^"]+)"/g)].map((m) => decodeURIComponent(m[1].split('?')[1].replace(/&amp;/g, '&')))
  assert.equal(asks.length, 6)
  for (const a of asks) assert.doesNotMatch(a, /ผ้าผ้า/, a)
})
