/* 13 พ.ย. 2026 อาร์ต "เอาแค่ส่วน C เริ่มทำมาได้ · ไปเจนใหม่ได้ครับ"
   ส่วนใหม่บนหน้ากลุ่มลูกค้าโฉมใหม่ 4 หน้า (บริษัท หน่วยงาน โรงเรียน ร้านค้า): ตรวจตัวอย่าง → ตรวจก่อนแพ็ก → จัดส่ง
   ข้อเท็จจริงจากคู่มือสั่งเสื้อโปโลปัก TEAMDEE (polo.json guide.sample / qa / delivery) และขั้นตอนเสื้อพิมพ์ลาย (pp-v2.json print.steps) เท่านั้น ไม่แต่งเพิ่ม
   รูป 3 ภาพเจนด้วย Nano Banana 2.1 อ้างอิงเสื้อโปโลขาวปักโลโก้ TEAMDEE ของจริง (emb-3d/basic) → ต้องบอกว่าเป็นภาพจำลอง */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { ppV2, useV2 } from '../src/build/content.js'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const main = (f) => { const h = read(`dist-wp/${f}/index.html`); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const text = (h) => h.replace(/<\/?t-[a-z]+>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
const flat = (s) => s.replace(/\s+/g, '')
const guide = JSON.parse(read('src/data/polo.json')).guide
const v2 = useV2()
const print = ppV2().print.steps.items
const PAGES = { corp: 'corporate', gov: 'custom-organization-shirts', edu: 'education', shop: 'custom-staff-shirts', faculty: 'custom-university-shirts', class: 'custom-class-shirts', sport: 'sport', badminton: 'custom-badminton-shirts', running: 'custom-running-shirts', event: 'event' }
const sec = (f) => { const m = main(f); const at = m.indexOf('<section class="up2-chk"'); return { m, at, s: at < 0 ? '' : m.slice(at, m.indexOf('</section>', at)) } }

for (const [id, f] of Object.entries(PAGES)) {
  test(`${f}: มีส่วนตรวจตัวอย่าง-ตรวจก่อนแพ็ก-จัดส่ง ต่อจากผลงานจริง ก่อน "ทำไมทีมดี" · หัวข้อของกลุ่มนี้`, () => {
    const { m, at, s } = sec(f)
    assert.ok(at > 0, 'มีส่วน up2-chk')
    assert.ok(m.indexOf('id="real-work"') < at && at < m.indexOf('class="up2-why"'), 'ลำดับ: ผลงานจริง → ส่วนนี้ → ทำไมทีมดี')
    const h2 = flat(text(s.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]))
    assert.equal(h2, flat(v2[id].check.h))
    assert.ok(v2[id].check.h.endsWith(v2[id].check.accent), 'คำเน้นสีส้มอยู่ท้ายหัวข้อ')
    assert.equal([...s.matchAll(/<li class="up2-chk__card"/g)].length, 3, 'การ์ด 3 ใบ')
  })

  test(`${f}: เนื้อหาตรงคู่มือโปโลปัก (ตัวอย่าง 2 ระดับ · สิ่งที่ตรวจ · ตรวจก่อนแพ็ก 4 ข้อ · ช่องทางส่ง 3 ทาง · เคลม 7 วัน)`, () => {
    const t = flat(text(sec(f).s))
    /* 16 พ.ย. 2026 อาร์ต "ทุกอย่างนี้ไม่ต้องแยก ปักกับพิมพ์ลาย รวมมาได้เลย" → ตัวอย่าง 2 ระดับ / สิ่งที่ตรวจ / ตรวจก่อนแพ็ก เขียนรวม (use-v2.json _check) · มัดจำ ช่องทางส่ง เคลม ยังตรงคู่มือ */
    const c = v2._check
    for (const tier of c.sample.tiers) for (const part of tier.split(' · ')) assert.ok(t.includes(flat(part)), part)
    for (const x of c.sample.checks) assert.ok(t.includes(flat(x)), x)
    for (const part of guide.sample.pay.split(' · ')) assert.ok(t.includes(flat(part)), part)
    for (const q of c.qa.items) assert.ok(t.includes(flat(q)), q)
    for (const w of guide.delivery.ways) { assert.ok(t.includes(flat(w.t)), w.t); assert.ok(t.includes(flat(w.s)), w.s) }
    for (const part of guide.delivery.note.split(' · ')) assert.ok(t.includes(flat(part)), part)
    assert.ok(t.includes(flat(guide.delivery.claim)), 'เคลม 7 วัน')
    assert.doesNotMatch(t, /โรงงาน/)
  })

  test(`${f}: รูปมีไฟล์จริง บอกว่าเป็นภาพจำลอง · ปุ่ม LINE ของส่วนนี้`, () => {
    const { s } = sec(f)
    const imgs = [...s.matchAll(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/g)].map((x) => ({ src: x[1], alt: x[2] }))
    assert.equal(imgs.length, 3)
    for (const { src, alt } of imgs) { assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src); assert.match(alt, /^ภาพจำลอง: /, src) }
    assert.match(text(s), /ภาพจำลองจากเสื้อจริงของทีมดี/)
    const line = s.match(/<a[^>]*href="(https:\/\/line\.me[^"]+)"[^>]*data-track="line"[^>]*data-where="use-check"/)
    assert.ok(line, 'ปุ่ม LINE data-where="use-check"')
    if (id === 'shop') assert.doesNotMatch(decodeURIComponent(line[1].replace(/&amp;/g, '&')), /บริษัท|องค์กร/)
  })
}

test('หัวข้อของทุกหน้าไม่ซ้ำกัน · หน้าร้านค้าไม่มีคำของกลุ่มบริษัท', () => {
  const hs = Object.keys(PAGES).map((id) => v2[id].check.h)
  assert.equal(new Set(hs).size, hs.length)
  assert.doesNotMatch(v2.shop.check.h + (v2.shop.check.lead || ''), /บริษัท|องค์กร/)
})

/* 16 พ.ย. 2026 อาร์ต (ภาพส่วนนี้ที่มีป้ายดำ "เสื้อพิมพ์ลาย" แยกบรรทัด) "ทุกอย่างนี้ไม่ต้องแยก ปักกับพิมพ์ลายครับ รวมมาได้เลย ทำมาดีๆ"
   → ไม่มีบรรทัด/ป้ายเสื้อพิมพ์ลายแยก · ข้อความทุกข้อใช้ได้กับทั้งสองงาน (คำว่า "ปัก" ที่เหลือมาคู่กับ "พิมพ์") · ถ่ายภาพเสื้อบนหุ่นก่อนส่งเป็นข้อตรวจก่อนแพ็กของทุกงาน */
test('ตรวจตัวอย่าง-ตรวจก่อนแพ็ก: เขียนรวมงานปักกับงานพิมพ์ลาย ไม่แยกป้าย', () => {
  const c = v2._check
  assert.ok(!('print' in c.sample) && !('print' in c.qa) && !('printTag' in c), 'ไม่มีบรรทัดเสื้อพิมพ์ลายแยก')
  assert.match(c.sample.sub, /งานปัก/); assert.match(c.sample.sub, /พิมพ์ลาย/)
  assert.equal(c.sample.tiers.length, 2)
  assert.match(c.sample.tiers[0], /^สั่งน้อยกว่า 100 ตัว · /); assert.match(c.sample.tiers[1], /^สั่งตั้งแต่ 100 ตัวขึ้นไป · เสื้อตัวอย่างจริง 1 ตัว/)
  assert.ok(c.qa.items.includes('ถ่ายภาพเสื้อบนหุ่นให้ดูก่อนส่ง'))
  for (const line of [...c.sample.tiers, ...c.sample.checks, ...c.qa.items, c.qa.sub]) if (/ปัก/.test(line)) assert.match(line, /พิมพ์/, `"${line}" พูดถึงแค่งานปัก`)
  for (const f of Object.values(PAGES)) {
    const s = sec(f).s
    assert.doesNotMatch(s, /up2-chk__print/, f)
    assert.equal((s.match(/class="up2-chk__list"[\s\S]*?<\/ul>/)[0].match(/<li>/g) || []).length, c.qa.items.length, `${f}: ข้อตรวจก่อนแพ็ก`)
    assert.equal(flat(text(s.match(/<h3>([\s\S]*?)<\/h3>/)[1])), flat(c.sample.t), f)
  }
})
