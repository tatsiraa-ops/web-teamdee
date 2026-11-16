/* 13 พ.ย. 2026 ตรวจ 3 หน้า (หน่วยงาน โรงเรียน ร้านค้า) ทีละส่วนเทียบหน้าบริษัท → อาร์ต "1-9 มาได้เลย"
   1 การ์ด "ทำไมทีมดี" หัวข้อกับป้ายไม่ตรงกัน · 2 คลังรีวิวหน่วยงานมีแค่ 12 รูป · 3 คลังรีวิวโรงเรียนมีรูปกลุ่มเดียวกันซ้ำ 4 รูป
   4 คลังรีวิวร้านค้าขึ้นงานเดียวกับรูปในส่วนรีวิวที่อยู่ติดกัน · 5 รีวิวมีน้อย การ์ดใบเดียวต้องกดเลื่อน/ดูโล่ง → แสดงครบทุกใบ (รีวิวเพิ่มรอแคปแชทจากอาร์ต)
   6 FAQ หน่วยงาน 5 ข้อ ช่องว่าง · 7 แถวผลงานไม่ใช่ของกลุ่ม → เพิ่มแถวภาพจำลองคนใส่เสื้อแบบจริงของกลุ่ม (แถวภาพถ่ายจริงยังอยู่)
   8 รูปกล่องเสื้อในส่วนชำระเงินเป็นของหน้าบริษัท · 9 ไม่มีบรรทัดอธิบายใต้หัวข้อโลโก้ */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const main = (f) => { const h = read(`dist-wp/${f}/index.html`); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const text = (h) => h.replace(/<\/?t-[a-z]+>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const flat = (s) => s.replace(/\s+/g, '')
const sec = (m, marker) => { const at = m.indexOf(marker); assert.ok(at > 0, marker); return m.slice(m.lastIndexOf('<section', at), m.indexOf('</section>', at)) }
const lib = JSON.parse(read('src/data/media-library.json')).items
const v2 = JSON.parse(read('src/data/use-v2.json')), pages = JSON.parse(read('src/data/use-pages.json'))
const guide = JSON.parse(read('src/data/polo.json')).guide
const P = { gov: 'custom-organization-shirts', edu: 'education', shop: 'custom-staff-shirts' }
const wall = (id) => [...sec(main(P[id]), `id="${id}-review-wall"`).matchAll(/<li class="rvw__ph"[^>]*><img src="([^"]+)"/g)].map((x) => x[1])
const name = (s) => s.split('/').pop().replace(/\.webp$/, '')

for (const [id, f] of Object.entries(P)) {
  test(`1 · ${f}: การ์ด "ทำไมทีมดี" หัวข้อ ไอคอน และป้ายพูดเรื่องเดียวกัน`, () => {
    const s = sec(main(f), 'class="up2-why"')
    const tiles = [...s.matchAll(/<li class="up2-why__tile">([\s\S]*?)<\/li>/g)].map((x) => ({ h: text(x[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]), fact: text((x[1].match(/class="up2-why__fact">([\s\S]*?)<\/span>/) || [0, ''])[1]), icon: x[1].match(/src="([^"]+)"/)[1] }))
    assert.equal(tiles.length, 4)
    for (const t of tiles) {
      assert.ok(pub(t.icon), t.icon); assert.ok(t.fact, `${t.h}: มีป้าย`)
      if (/ตัวอย่าง/.test(t.h)) assert.match(t.fact, /ตัวอย่าง/, t.h)
      if (/เอกสาร/.test(t.h)) assert.match(t.fact, /ใบเสร็จ|ใบกำกับ/, t.h)
      if (/ใบเสร็จ|ใบกำกับ/.test(t.fact)) assert.match(t.h, /เอกสาร/, t.fact)
      if (/ดูแลหลังรับ/.test(t.h)) assert.match(t.fact, /7 วัน/, t.h)
    }
    assert.equal(new Set(tiles.map((t) => t.icon)).size, 4, 'ไอคอนไม่ซ้ำ')
  })

  test(`7 · ${f}: แถวภาพจำลองคนใส่เสื้อแบบจริงของกลุ่ม อยู่ระหว่างแบบ 3D กับภาพถ่ายจริง · บอกว่าเป็นภาพจำลอง`, () => {
    const m = main(f)
    const a = m.indexOf('id="show-designs"'), b = m.indexOf('id="show-worn"'), c = m.indexOf('id="show-real"')
    assert.ok(a > 0 && a < b && b < c, 'ลำดับ: แบบ 3D → ภาพจำลอง → ภาพถ่ายจริง')
    const row = m.slice(b, c).replace(/<\/?t-[a-z]+>/g, '') /* ตัดแท็กกันตัดคำกลางวลีออกก่อนเทียบ */
    assert.match(row, /<span class="up2-show__kind up2-show__kind--mock">ภาพจำลอง<\/span>/)
    const imgs = [...row.matchAll(/<figure class="hm-show__item"><img src="([^"]+)"[^>]*alt="([^"]*)"/g)]
    assert.equal(imgs.length, 4)
    for (const [, src, alt] of imgs) { assert.match(src, new RegExp(`^/img/use-worn/${id}-\\d\\.webp$`)); assert.ok(pub(src), src); assert.ok(pub(src.replace('.webp', '-540.webp')), src); assert.match(alt, /^ภาพจำลอง: /) }
    assert.match(text(row), /ภาพจำลองจากลายเสื้อจริง/)
  })

  test(`8 · ${f}: รูปกล่องเสื้อในส่วนชำระเงินเป็นเสื้อของกลุ่มนี้`, () => {
    const s = sec(main(f), 'id="payment"')
    assert.match(s, new RegExp(`/img/use-pay/${id}-box-960\\.webp`))
    for (const w of [960, 560]) assert.ok(pub(`/img/use-pay/${id}-box-${w}.webp`))
    assert.doesNotMatch(s, /corp-box/)
    assert.match(v2[id].payment.back.alt, /^ภาพจำลอง: /)
  })

  test(`9 · ${f}: มีบรรทัดอธิบายใต้หัวข้อโลโก้`, () => {
    const s = sec(main(f), 'up2-logos"')
    const sub = text((s.match(/<p class="up2-logos__sub">([\s\S]*?)<\/p>/) || [0, ''])[1])
    assert.ok(sub.length > 30, sub)
    assert.match(sub, /เสื้อโปโลปัก/); assert.match(sub, /เสื้อพิมพ์ลาย/); assert.match(sub, /เสื้อสกรีน/)
    assert.doesNotMatch(sub, /โรงงาน/)
    if (id === 'shop') assert.doesNotMatch(sub, /บริษัท|องค์กร/)
  })
}

test('2 · หน่วยงาน: คลังรีวิวใช้รูปหน่วยงานที่เหลือในคลังครบ (เดิม 12 → 15) · เป็นรูปลูกค้าหน่วยงานจากคลัง ไม่ซ้ำ', () => {
  const w = wall('gov')
  /* รูปหน่วยงานในคลังที่ยังไม่ถูกใช้ในส่วนอื่นของหน้านี้มี 15 รูป (ที่เหลืออยู่ในแท็บและส่วนรีวิวแล้ว) · จะเกินนี้ต้องมีรูปลูกค้าหน่วยงานเพิ่ม */
  assert.ok(w.length >= 15, `รูป ${w.length}`)
  assert.equal(new Set(w).size, w.length)
  for (const src of w) { const it = lib.find((x) => x.path === src); assert.ok(it && it.kind === 'customer' && ((it.groups || []).includes('gov') || (it.primary || []).includes('gov')), src) }
})

test('3 · โรงเรียน: คลังรีวิวไม่มีรูปกลุ่มเดียวกันมุมเกือบเหมือนกันซ้ำ', () => {
  const w = wall('edu').map(name)
  for (const dup of ['lc251', 'lc253', 'lc254', 'lc372']) assert.ok(!w.includes(dup), dup)
  assert.ok(w.includes('lc250'), 'เหลือรูปกลุ่มนั้น 1 รูป')
  assert.ok(w.length >= 20, `รูป ${w.length}`)
})

test('4 · ร้านค้า: คลังรีวิวไม่ขึ้นงานเดียวกับรูปในส่วนรีวิวที่อยู่ติดกัน', () => {
  const w = wall('shop').map(name)
  for (const same of ['lc384', 'lc385', 'lc360', 'lc361']) assert.ok(!w.includes(same), same)
  /* รูปเติม (พนักงานบริษัท) ก็ต้องไม่มีกลุ่มเดียวกันมุมซ้ำ: เสื้อส้มหน้าอาคาร 4 รูปเหลือ lc205 · lc22/lc23 เหลือ lc22 */
  for (const dup of ['lc198', 'lc203', 'lc204', 'lc23']) assert.ok(!w.includes(dup), dup)
  assert.equal(w.length, 30)
})

test('5 · รีวิวไม่เกิน 2 ราย แสดงครบทุกใบ ไม่ต้องกดเลื่อน (หน่วยงาน โรงเรียน ร้านค้า) · หน้าบริษัท 5 รายยังเลื่อนได้', () => {
  for (const [id, f] of Object.entries(P)) {
    const s = sec(main(f), 'id="reviews"')
    const n = (s.match(/data-rvb-item/g) || []).length
    assert.ok(n >= 1 && n <= 2, `${id}: ${n} ราย`)
    assert.match(s, /class="hm-rvb up2-rv__board up2-rv__board--all"/, id)
    assert.doesNotMatch(s, /data-rvb-step|data-rvb-count/, `${id}: ไม่มีปุ่มเลื่อน`)
    assert.doesNotMatch(s, /<div class="hm-rvb [^"]*"[^>]* data-rvb[ >]/, `${id}: ไม่ให้สคริปต์ซ่อนใบที่สอง`)
  }
  const corp = sec(main('corporate'), 'id="reviews"')
  assert.match(corp, /data-rvb-step/); assert.doesNotMatch(corp, /up2-rv__board--all/)
  const css = read('src/styles/use-page.css')
  assert.match(css, /\.up2-rv__board--all \.hm-rvb__right \{[^}]*display: grid/)
})

test('6 · หน่วยงาน: FAQ ครบ 6 ข้อ · ข้อใหม่เรื่องจัดส่งตรงคู่มือ · ทุกหน้าไอคอนครบทุกข้อ', () => {
  const items = pages.gov.faq.items
  assert.equal(items.length, 6)
  assert.match(items[5][0], /จัดส่ง/)
  for (const part of ['Kerry / Flash', 'เลขติดตามพัสดุ', 'นัดรับด้วยตัวเอง', 'จัดส่งฟรีตามช่องทางที่ตกลงกับทีมดี']) { assert.ok(items[5][1].includes(part), part); assert.ok(JSON.stringify(guide.delivery).includes(part), `คู่มือ: ${part}`) }
  for (const id of Object.keys(P)) {
    assert.equal(v2[id].faq.icons.length, pages[id].faq.items.length, id)
    for (const i of v2[id].faq.icons) assert.ok(pub(`/img/icons/${i}.webp`), i)
  }
  assert.match(sec(main(P.gov), 'id="faq"'), /จัดส่งเสื้อถึงหน่วยงาน/)
})

test('CSS: ป้าย "ภาพจำลอง" ของแถวผลงาน', () => {
  assert.match(read('src/styles/use-page.css'), /\.up2-show__kind--mock \{/)
})
