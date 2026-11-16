/* 13 พ.ย. 2026 อาร์ต "เอาแค่ส่วน C เริ่มทำมาได้ · ไปเจนใหม่ได้ครับ"
   ส่วนใหม่บนหน้ากลุ่มลูกค้าโฉมใหม่ 4 หน้า (บริษัท หน่วยงาน โรงเรียน ร้านค้า): ตรวจตัวอย่าง → ตรวจก่อนแพ็ก → จัดส่ง
   ข้อเท็จจริงจากคู่มือสั่งเสื้อโปโลปัก TEAMDEE (polo.json guide.sample / qa / delivery) และขั้นตอนเสื้อพิมพ์ลาย (pp-v2.json print.steps) เท่านั้น ไม่แต่งเพิ่ม
   รูป 3 ภาพเจนด้วย Nano Banana 2.1 อ้างอิงเสื้อโปโลขาวปักโลโก้ TEAMDEE ของจริง (emb-3d/basic) → ต้องบอกว่าเป็นภาพจำลอง */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const main = (f) => { const h = read(`dist-wp/${f}/index.html`); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const text = (h) => h.replace(/<\/?t-[a-z]+>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
const flat = (s) => s.replace(/\s+/g, '')
const guide = JSON.parse(read('src/data/polo.json')).guide
const v2 = JSON.parse(read('src/data/use-v2.json'))
const print = JSON.parse(read('src/data/pp-v2.json')).print.steps.items
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
    for (const k of ['lt100', 'ge100']) for (const part of guide.sample[k].split(' · ')) assert.ok(t.includes(flat(part)), part)
    for (const c of guide.sample.check) assert.ok(t.includes(flat(c)), c)
    for (const part of guide.sample.pay.split(' · ')) assert.ok(t.includes(flat(part)), part)
    for (const q of guide.qa) assert.ok(t.includes(flat(q)), q)
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

/* 13 พ.ย. อาร์ตยืนยัน "ทุกงานหรือทุกประเภทของเรา เราจะลองเทสพิมพ์ลายเหมือนกับงานปัก" → การ์ด 01 ไม่จำกัดแค่งานปัก · บอกว่างานพิมพ์ลายมีเทสพิมพ์ตัวอย่างด้วย
   (เดิมบรรทัดนี้ใช้ "เห็นแบบ 3D ใน 24 ชม." จากขั้นออกแบบ ซึ่งไม่ใช่ตัวอย่างจริง) · การ์ด 02 ยังใช้ข้อความจากขั้นตอนหน้าเสื้อพิมพ์ลาย */
test('การ์ด 01 ครอบคลุมทั้งงานปักและงานพิมพ์ลาย · บรรทัดเสื้อพิมพ์ลายของการ์ด 02 มาจากขั้นตอนหน้าเสื้อพิมพ์ลายจริง', () => {
  const notes = print.map((x) => x.note).join(' ')
  const c = v2._check
  assert.doesNotMatch(c.sample.t, /งานปัก/, 'หัวการ์ดไม่จำกัดแค่งานปัก')
  assert.match(c.sample.sub, /งานปัก/); assert.match(c.sample.sub, /พิมพ์ลาย/)
  assert.match(c.sample.print, /เทสพิมพ์ลายตัวอย่าง/); assert.match(c.sample.print, /ก่อนผลิตจริง/)
  assert.ok(notes.includes('ถ่ายภาพเสื้อบนหุ่นให้ดูก่อนส่ง') && c.qa.print.includes('ถ่ายภาพเสื้อบนหุ่นให้ดูก่อนส่ง'))
  for (const f of Object.values(PAGES)) {
    const s = sec(f).s, t = flat(text(s))
    assert.ok(t.includes(flat(c.sample.print)), f); assert.ok(t.includes(flat(c.qa.print)), f)
    assert.equal(flat(text(s.match(/<h3>([\s\S]*?)<\/h3>/)[1])), flat(c.sample.t), f)
  }
})

test('CSS: ความกว้างพิเศษ 1400 · ตัวหนังสือบนพื้นส้มเรียบเป็นสีดำ · จอเล็กเรียงลงมาไม่ซ่อนเนื้อหา', () => {
  const css = read('src/styles/use-page.css')
  assert.match(css, /\.up2-chk > \.wrap \{[^}]*max-width: 1400px/)
  assert.match(css, /\.up2-chk__no \{[^}]*background: #fff/)
  assert.doesNotMatch(css.slice(css.indexOf('.up2-chk')), /\.up2-chk[^{]*\{[^}]*display: none/)
})
