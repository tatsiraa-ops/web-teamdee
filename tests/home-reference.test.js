import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8')
const source = JSON.parse(read('docs/audit/2026-10-29-home-v22/reference.json'))
const home = JSON.parse(read('src/data/home.json'))
test('FAQ หน้าแรกครบ 11 ข้อ คำถามตามต้นแบบ · คำตอบแก้ 30 ต.ค. (อาร์ตอนุญาต: ขั้นต่ำสกรีน วันผลิต ตัดศัพท์ภายใน · รับบัตรเครดิต)', () => {
  /* คำถามยังตรงกับหน้าอ้างอิงทุกข้อ · คำตอบ 30 ต.ค. มีตัวเลขจริง ไม่มี "แคตตาล็อก" / "Lot 2" */
  assert.deepEqual(home.faq.items.map(([q]) => q), source.faq.map(([q]) => q))
  const text = home.faq.items.map(([, a]) => a).join(' ')
  assert.doesNotMatch(text, /แคตตาล็อก|Lot 2/)
  assert.match(text, /เสื้อสกรีนเริ่มสั่งได้ 1 ตัว/)
  assert.match(text, /10–15 วัน.*15–20 วัน.*3–14 วัน/)
  assert.match(text, /รับบัตรเครดิต Visa \/ Mastercard/)
  /* เทียบข้อความ ไม่สนแท็กห่อคำกันตัดบรรทัด (<span class="whitespace-nowrap">) */
  const markup = read('src/partials/homeReference-faq.hbs').replace(/<span class="whitespace-nowrap">([^<]*)<\/span>/g, '$1')
  for (const [q, a] of home.faq.items) { assert.ok(markup.includes(q), q); assert.ok(markup.includes(a), a) }
  /* 3 พ.ย. รื้อ: กลุ่มที่สองไม่ซ่อนใน "คำถามเพิ่มเติม" แล้ว เป็นหัวกลุ่มแทน (tests/home-board ตรวจโครง) */
  assert.equal((markup.match(/<details name="home-faq">/g) || []).length, 11)
  assert.ok(markup.includes('การชำระเงินและรายละเอียดสินค้า'))
})
/* 3 พ.ย. อาร์ต: การ์ดบริการแบบ PMK · ภาพด้านหน้าเสื้อตัวเดียว พริ้วสมจริง ไม่มีตัวหนังสือ (Magnific GPT 2.5 high จาก mockup เดิมทั้งสาม) */
test('การ์ดบริการใช้ภาพชุดใหม่ทั้งสาม (เรียง พิมพ์ลาย → ปัก → สกรีน · อาร์ต 3 พ.ย.) และไม่มีแถบรูปย่อยในการ์ดบริการ', () => {
  assert.deepEqual(home.cats.items.map(x => x.img), ['/img/services/svc-print-960.webp', '/img/services/svc-polo-960.webp', '/img/services/svc-screen-960.webp'])
  assert.ok(!read('site/index.html').includes('hm-cat__detail'))
})
