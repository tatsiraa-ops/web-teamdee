/* กล่อง CTA หน้าแรก (อาร์ต 26 ต.ค.) · แชทตัวอย่างต้องตรงกับข้อความที่ปุ่ม LINE พิมพ์รอไว้ และไม่มีข้อความรอยืนยัน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const home = JSON.parse(readFileSync(new URL('../src/data/home.json', import.meta.url), 'utf8'))

test('cta1/cta2 มีข้อความแชทตั้งต้น · ช่องให้เติมครบตามรายการ "ต้องบอก" · มีรูป/ไฟล์แนบตามบริบท', () => {
  for (const k of ['cta1', 'cta2']) {
    const c = home[k]
    assert.ok(Array.isArray(c.msg) && c.msg.length >= 3, k)
    assert.ok(c.msg.every((m) => typeof m.t === 'string' && m.t.trim()), k)
    assert.ok(c.msg.filter((m) => m.q).length >= 2, `${k}: ต้องมีช่องให้ลูกค้าเติม`)
    assert.ok(c.attach?.length && c.attach.every((a) => a.img || a.file), `${k}: แชทต้องมีสิ่งที่แนบตามบริบท`)
    assert.ok(c.note, k)
    const texts = [c.title, c.lead, ...c.send.items, ...c.msg.map((m) => m.t), c.note]
    for (const t of texts) assert.doesNotMatch(t, /\[[^\]]*\]/, `${k}: ห้ามมีข้อความรอยืนยัน`)
  }
})
