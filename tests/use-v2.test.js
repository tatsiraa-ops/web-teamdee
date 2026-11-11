/* หน้ากลุ่มโฉมใหม่ (อาร์ต 3 พ.ย. 2026 "ทำแบบหน้าแรก" · src/data/use-v2.json) · เริ่มที่ /corporate/ ทีละส่วนตามโครงของอาร์ต
   กลุ่มที่ไม่มีคีย์ใน use-v2.json ต้องได้หน้าเดิมทุกส่วน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { statSync, readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const sec = (html, cls) => { const at = html.indexOf(`<section class="${cls}`); assert.ok(at >= 0, cls); return html.slice(at, html.indexOf('</section>', at)) }
const imgs = (html) => [...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1])
const pub = (src) => existsSync(new URL(`../public${src}`, import.meta.url))
const text = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')

test('/corporate/ hero: แบนเนอร์เต็มจอ ภาพไม่มีตัวหนังสือ + H1 เดิมครบ + ปุ่ม LINE use-hero · ไม่มีป้ายภาพประกอบ', () => {
  const m = main('corporate')
  const hero = sec(m, 'band-hero up2-hero')
  const src = imgs(hero)[0]
  assert.match(src, /^\/img\/use-hero\/corp-\d+\.webp$/)
  for (const s of hero.match(/srcset="([^"]+)"/)[1].split(',').map((x) => x.trim().split(' ')[0])) assert.ok(pub(s), s)
  assert.match(hero, /fetchpriority="high"/)
  const h1 = text(hero.slice(hero.indexOf('<h1'), hero.indexOf('</h1>')))
  for (const w of ['รับทำเสื้อบริษัท', 'เสื้อพนักงาน พร้อมโลโก้']) assert.ok(h1.includes(w), h1)
  assert.match(hero, /data-where="use-hero"/)
  assert.doesNotMatch(m, /ภาพประกอบ/)
})

/* อาร์ต 3 พ.ย. รอบ 2: "ภาพสองลบ" (แถบสิทธิพิเศษ + สารบัญ) · "แยกตามหน้าแรก ดึง uiux มาใช้" (โลโก้ + ตัวเลข) · "ยังดู ai" (ปัญหาคนสั่ง → โครง hm-help หน้าแรก) */
test('/corporate/ ไม่มีแถบสิทธิพิเศษและสารบัญใต้ hero', () => {
  const m = main('corporate')
  assert.doesNotMatch(m, /class="pp-strip|data-toc|ab-toc/)
})

test('/corporate/ โลโก้ + ตัวเลข: ชิ้นเดียวกับหน้าแรก (hm-logowrap 2 แถว → hm-stats-band)', () => {
  const m = main('corporate')
  const logos = sec(m, 'hm-sec hm-sec--tight hm-logowrap up2-logos')
  assert.match(text(logos), /บริษัทและทีมที่ไว้วางใจทีมดี/)
  assert.match(logos, /class="hm-marquee" data-marquee data-marquee-nobtn/)
  assert.equal((logos.match(/class="hm-marquee__row/g) || []).length, 2)
  const stats = sec(m, 'wrap hm-stats-band up2-stats')
  assert.equal((stats.match(/class="hm-stat"/g) || []).length, 3)
  assert.match(stats, /data-countup/)
  assert.ok(m.indexOf('up2-logos') < m.indexOf('up2-stats'))
})

/* อาร์ต 3 พ.ย. รอบ 3 "ชอบแบบ PMK แต่ทำให้ดีกว่า" */
test('/corporate/ ปัญหาคนสั่ง: หัวข้อกลาง · 3 คอลัมน์ ไอคอน 3D ในวงกลม + H3 v22 + บรรทัดส้มย่อ + ทีมดีช่วย', () => {
  const p = sec(main('corporate'), 'up2-pain')
  const items = [...p.matchAll(/<li class="up2-pain__item">([\s\S]*?)<\/li>/g)].map((x) => x[1])
  assert.equal(items.length, 3)
  for (const c of items) {
    const [src] = imgs(c)
    assert.match(src, /^\/img\/icons\/[a-z-]+\.webp$/); assert.ok(pub(src), src)
    assert.match(c, /<p class="up2-pain__hi">[^<]+<\/p>/)
    assert.match(text(c), /ทีมดีช่วย/)
  }
  for (const h of ['ต้องคุมงบและขออนุมัติ', 'ต้องรวบรวมไซซ์หลายแผนก', 'ต้องตอบทีมว่างานถึงไหนแล้ว']) assert.ok(text(p).includes(h), h)
  assert.doesNotMatch(p, /up2-pain__kick/, 'อาร์ต "ลบออก" ป้ายเหนือหัวข้อ')
})

/* 4 พ.ย. ภาพแบบสไลด์แรกหน้าแรก: กรอบ 33% ให้บรรทัดส้ม "เสื้อพนักงาน พร้อมโลโก้" บรรทัดเดียว · คำโปรย 88% ของกรอบ (= 29% ของภาพ เท่ากรอบหน้าแรก) · กลางแนวตั้ง -52% เท่าหน้าแรก */
test('/corporate/ hero ขนาดเท่าแบนเนอร์หน้าแรก (2304×800 · ข้อความ 11.5% · กรอบ 33% คำโปรย 29%)', () => {
  const css = (readFileSync('src/styles/use-page.css', 'utf8') + readFileSync('src/styles/review-wall.css', 'utf8'))
  assert.match(css, /\.up2-hero__reel \{[^}]*aspect-ratio: 2304 \/ 800/)
  assert.match(css, /\.up2-hero__copy \{[^}]*left: 11\.5%;[^}]*translate: 0 -52%;[^}]*width: 33%/)
  assert.match(css, /\.up2-hero__copy \.th-o__sub \{ max-width: 88%; \}/)
  assert.match(sec(main('corporate'), 'band-hero up2-hero'), /width="2304" height="800"/)
})

test('รูปในแท็บไม่ซ้ำส่วนเสื้อจริงและภาพลูกค้าของหน้าเดียวกัน', () => {
  const m = main('corporate')
  const ctx = new Set(imgs(sec(m, 'up2-ctx')).filter((s) => !s.includes('-480') && !s.includes('-320')))
  const rest = [m.indexOf('id="work"'), m.indexOf('id="photos"')].filter((at) => at >= 0).map((at) => imgs(m.slice(at, m.indexOf('</section>', at)))).flat()
  for (const s of rest) assert.ok(!ctx.has(s.replace(/-(320|400|480)\.webp$/, '.webp')), s)
})

test('กลุ่มอื่นยังใช้หน้าเดิม (ไม่มีส่วน up2-)', () => {
  for (const f of ['custom-staff-shirts', 'education', 'sport']) assert.doesNotMatch(main(f), /class="[^"]*up2-/, f)
})

/* อาร์ต 3 พ.ย. "ต่อที่เราทำในหน้าแรก ไปดึงมา" · "ไปดึง component มาใช้งาน" */
test('/corporate/ บริการของเรา: ชิ้น #services หน้าแรกทั้งชุด (hm-cats--hero-cards · ข้อมูลเดียวกัน) · หัวข้อ H2 v22', () => {
  const m = main('corporate')
  const s = sec(m, 'wrap hm-sec" id="services')
  assert.ok(m.includes('<div class="td-page-home up2-home">'))
  assert.match(s, /<ul class="hm-cats hm-cats--3 hm-cats--poster hm-cats--hero-cards">/)
  assert.equal((s.match(/<div class="hm-cat">/g) || []).length, 3)
  for (const src of imgs(s)) assert.ok(pub(src), src)
  assert.match(text(s), /เสื้อแบบไหนเหมาะกับงานของบริษัทคุณ\?/)
  const home = readFileSync('dist-wp/index.html', 'utf8')
  const card = (h) => h.slice(h.indexOf('<ul class="hm-cats hm-cats--3'), h.indexOf('</ul>', h.indexOf('<ul class="hm-cats hm-cats--3')))
  assert.equal(card(s), card(home), 'การ์ดตรงกับหน้าแรกทุกตัวอักษร')
})

test('/corporate/ ยังไม่แน่ใจ: คู่การ์ดชวนคุยของหน้าแรก (ยังไม่มีแบบ หรือ มีแบบแล้ว) · H2 v22 การ์ดแรก · LINE ทั้งสองใบ', () => {
  const m = main('corporate')
  const at = m.indexOf('<div class="hm-pair hm-pair--talk hm-talk wrap up2-talk">')
  assert.ok(at > 0)
  const p = m.slice(at, m.indexOf('<!-- /hm-pair -->', at))
  assert.match(p, /class="hm-talk__card is-new"[\s\S]*class="hm-talk__or"[\s\S]*class="hm-talk__card is-ready"/)
  assert.equal((p.match(/<h2/g) || []).length, 1)
  assert.match(text(p), /ยังไม่แน่ใจว่าเสื้อแบบไหนเหมาะกับทีม\?/)
  assert.equal((p.match(/href="https:\/\/line\.me\/R\/oaMessage\//g) || []).length, 2)
})

/* อาร์ต 3 พ.ย. "ต่อมา อันนี้ต่อเลย" (รีวิว) · ลำดับตามโครงอาร์ต: hero → โลโก้/ตัวเลข → ปัญหา → ธุรกิจ/กิจกรรม → บริการ → ยังไม่แน่ใจ → รีวิว */
test('/corporate/ รีวิว (แบบ Delicake): หัวข้อ H2 v22 · กำแพงรูปงานจริงกดเปิดรีวิว · แฮชแท็ก · การ์ดรีวิวหน้าแรกเฉพาะองค์กร · ไม่มีคลิป · ต่อจากยังไม่แน่ใจ', () => {
  const m = main('corporate')
  const r = sec(m, 'hm-customer-proof up2-rv')
  assert.match(text(r), /รีวิวจากคนสั่งและคนใส่เสื้อบริษัท/)
  /* อาร์ต "ทั้งหมดต้องเป็นรูปรีวิวลูกค้า ไม่เอาเสื้อใส่หุ่น ไม่เอารูปซ้ำ" */
  const wallHtml = r.slice(r.indexOf('class="up2-rv__wall"'), r.indexOf('class="up2-rv__tags"'))
  const wallImgs = imgs(wallHtml)
  assert.equal(wallImgs.length, 10)
  for (const src of wallImgs) { assert.ok(pub(src), src); assert.match(src, /^\/img\/(review|customer)\//, src); assert.doesNotMatch(src, /mannequin|rv54/, src) }
  const wall = [...wallHtml.matchAll(/data-rv-open="([a-z-]+)"/g)]
  assert.equal(new Set(wall.map((w) => w[1])).size, wall.length, 'รีวิวละรูป')
  const key = (s) => s.match(/\/((?:rv|lc|co|cr)\d+)[-.]/)?.[1]
  const pageImgs = imgs(m).map(key).filter(Boolean)
  for (const k of wallImgs.map(key)) assert.equal(pageImgs.filter((x) => x === k).length, 1, `${k} ซ้ำในหน้า`)
  assert.doesNotMatch(r.slice(r.indexOf('data-rvb')), /class="hm-rvb__photo"|hm-rvb__avatar/, 'การ์ดไม่มีรูป')
  assert.ok((r.match(/<span>#/g) || []).length >= 6)
  const items = [...r.matchAll(/data-rvb-item data-use="([a-z]+)"/g)].map((x) => x[1])
  assert.ok(items.length >= 3 && items.every((u) => u === 'corp'), items.join())
  assert.match(r, /data-where="use-review"/)
  assert.match(m, /<script type="application\/json" data-rv-json>/)
  for (const [, id] of wall) assert.ok(r.includes(`data-rv-open="${id}"`))
  assert.doesNotMatch(m, /id="home-clips"|data-embed-auto/, 'อาร์ต "ลบวีดีโอ"')
  const order = ['up2-hero', 'up2-logos', 'up2-stats', 'up2-pain', 'up2-ctx', 'id="services"', 'up2-talk', 'up2-rv']
  const pos = order.map((k) => m.indexOf(k))
  assert.ok(pos.every((n) => n > 0), order.filter((_, i) => pos[i] < 0).join())
  assert.deepEqual(pos, [...pos].sort((a, b) => a - b))
  assert.equal((m.match(/id="reviews"/g) || []).length, 1)
})

test('/corporate/ รูปในแท็บธุรกิจไม่ซ้ำกำแพงรูปรีวิว', () => {
  const m = main('corporate')
  const ids = (h) => new Set(imgs(h).map((s) => s.match(/\/(lc\d+|co\d+|cr\d+|rv\d+)[-.]/)?.[1]).filter(Boolean))
  const ctx = ids(sec(m, 'up2-ctx'))
  const mosaic = ids(m.slice(m.indexOf('class="up2-rv__wall"'), m.indexOf('class="up2-rv__tags"')))
  for (const k of mosaic) assert.ok(!ctx.has(k), k)
})

/* อาร์ต 3 พ.ย. "ดึงอันนี้มาใช้ แถวแรกเสื้อที่เราออกแบบบริษัท ต่อมาเสื้อใส่หุ่น แบบไม่ต้องซ้ำกัน" */
test('/corporate/ ผลงาน: โชว์รูมหน้าแรกทั้งชุด · แถว 1 แบบ 3D 9 แบบ · แถว 2 ภาพถ่ายเสื้อจริงบนหุ่น 9 รูป · รางเลื่อน · แบบไม่ซ้ำแบบที่เจนหุ่น · ต่อจากรีวิว', () => {
  const m = main('corporate')
  const s = sec(m, 'wrap hm-sec hm-reference hm-show" id="real-work')
  assert.match(text(s), /ผลงานเสื้อบริษัทที่ผลิตจริง/)
  const rows = [...s.matchAll(/<div class="hm-show__row up2-show--(?:3d|real)" id="show-([a-z]+)">([\s\S]*?)<!-- \/row -->/g)]
  assert.deepEqual(rows.map((r) => r[1]), ['designs', 'real'])
  const [d, r] = rows.map((x) => [...x[2].matchAll(/<figure class="hm-show__item"><img src="([^"]+)"/g)].map((y) => y[1]))
  /* อาร์ต 4 พ.ย. "เอาแบบหลายๆรูปได้": แถว 3D 9 แบบ (ด้านหน้าจากไฟล์แบบปักจริง · เฉพาะเสื้อบริษัท) · แถวภาพจริง 9 รูป (ภาพถ่ายเสื้อตัวจริงทั้งหมดในคลัง) · แต่ละแถวเป็นรางเลื่อน มีปุ่มเลื่อน */
  assert.equal(d.length, 9); assert.equal(r.length, 9)
  assert.equal(new Set(d).size, 9); assert.equal(new Set(r).size, 9)
  for (const x of d) { assert.match(x, /^\/img\/design-front\/embroider-\d{3}\.webp$/, 'อาร์ต "เอาแต่ด้านหน้าเสื้อ"'); assert.ok(pub(x), x) }
  /* อาร์ต 4 พ.ย. "แยกให้ชัดๆระหว่างแบบเสื้อ 3D กับ เสื้อจริงใส่หุ่น": แถว 2 = ภาพถ่ายเสื้อตัวจริง (ชุด mannequin "ภาพงานจริง") ไม่ใช่ภาพเจน work-mannequin
     ทุกแถวมีป้ายประเภทหน้าหัวข้อ + ป้ายบนทุกการ์ด · แถว 1 "แบบ 3D" · แถว 2 "ภาพถ่ายจริง" */
  const show0 = JSON.parse(readFileSync('src/data/home-work-showcase.json', 'utf8'))
  const realSet = new Set(show0.mannequin.filter((x) => x.kind === 'ภาพงานจริง').map((x) => x.img))
  /* อาร์ต 5 พ.ย. "เสื้อมันยังไม่ตรงกันปะ": ภาพถ่ายจริงตัดพื้นหลัง (Magnific) วางบนพื้นเดียวกัน สูงเท่ากัน ฐานเสื้อเส้นเดียวกัน → /img/real-front/<ชื่อเดิม>.webp (ต้นฉบับยังเป็นภาพถ่ายจริงชุด mannequin) */
  for (const x of r) {
    const m = x.match(/^\/img\/real-front\/([a-z]+-\d{3})\.webp$/)
    assert.ok(m, `${x} ต้องเป็นไฟล์จัดวางใหม่ใน real-front`)
    assert.ok(realSet.has(`/img/download-designs/${m[1]}.webp`), `${x} ต้นฉบับต้องเป็นภาพถ่ายจริง`)
    assert.ok(pub(x) && pub(x.replace('.webp', '-540.webp')), x)
  }
  const [dh, rh] = rows.map((x) => x[2])
  assert.match(dh, /<span class="up2-show__kind up2-show__kind--3d">แบบ 3D<\/span>/)
  assert.match(rh, /<span class="up2-show__kind up2-show__kind--real">ภาพถ่ายจริง<\/span>/)
  // อาร์ต 5 พ.ย. "เอาป้ายบนภาพออก": ไม่มีป้ายมุมการ์ด เหลือป้ายประเภทหน้าหัวข้อแถว
  assert.doesNotMatch(dh + rh, /up2-show__tag/)
  assert.doesNotMatch(dh, /งานปักจริง/, 'แถว 3D ไม่เรียกว่างานจริง')
  const rc = (readFileSync('src/styles/use-page.css', 'utf8') + readFileSync('src/styles/review-wall.css', 'utf8'))
  assert.match(rc, /#real-work \.up2-show--(?:3d|real) \.hm-show__line5[^{]*\{[^}]*grid-auto-flow: column[^}]*overflow-x: auto/)
  assert.match(readFileSync('src/js/use-page.js', 'utf8'), /addRailControls\([^)]*'up2-show-ctl'\)/)
  const show = JSON.parse(readFileSync('src/data/home-work-showcase.json', 'utf8'))
  const same = new Set(['embroider-004', 'embroider-005', 'embroider-012', 'embroider-017', 'embroider-022', 'embroider-024', 'embroider-029', ...show.polo.map((x) => x.img.match(/embroider-\d+/)?.[0])])
  for (const x of d) assert.ok(!same.has(x.match(/embroider-\d+/)[0]), `${x} ซ้ำแบบที่เจนหุ่น`)
  for (const [, , html] of rows) assert.match(html, /<div class="hm-show__cta">[\s\S]*data-where="use-work-/)
  assert.ok(m.indexOf('up2-rv') < m.indexOf('id="real-work"'))
  assert.ok(m.includes('<div class="td-page-home up2-home">\n<section class="wrap hm-sec hm-reference hm-show"'))
})

/* อาร์ต 3 พ.ย. ย้ำจุดขาย "ชอบแบบ PMK · ข้อมูลเดิม · เจนรูปมา" */
test('/corporate/ ย้ำจุดขาย: H2 v22 · การ์ดไอคอน 3D 4 ใบแถวเดียว · ข้อความบรรทัดเดียว หัวข้อ H3 v22', () => {
  const m = main('corporate')
  const w = sec(m, 'up2-why')
  assert.match(text(w), /ทำไมการสั่งเสื้อบริษัทกับทีมดีจึงจัดการง่ายขึ้น\?/)
  const tiles = [...w.matchAll(/<li class="up2-why__tile">([\s\S]*?)<\/li>/g)].map((x) => x[1])
  assert.equal(tiles.length, 4)
  for (const t of tiles) {
    for (const src of imgs(t)) assert.ok(pub(src), src)
    assert.match(t, /<h3 class="up2-why__tag">/)
    assert.doesNotMatch(t, /<p[\s>]/, 'อาร์ต "เอาข้อความมาแค่แถวเดียวพอ" · ข้อความมีแค่หัวข้อ')
    // 5 พ.ย. อาร์ต "ภาพยังไม่สื่อพอ" → "เอาตามเสนอ": ป้ายข้อเท็จจริงสั้นมุมภาพ (ไม่ใช่ย่อหน้า) + ภาพใหม่ชุด why2 (ของจริงที่พิสูจน์หัวข้อ)
    assert.match(t.replace(/<\/?t-(?:g|nw)>/g, ''), /<span class="up2-why__fact">[^<]{4,30}<\/span>/)
    // อาร์ต "ยังไม่ได้ ลองไอคอน 3D": การ์ดไอคอน 3D ชุด CI (ส้มเงา + ขาวเซรามิก) แทนภาพถ่าย · ไม่มีภาพถ่ายในการ์ด
    assert.match(t, /<img class="up2-why__ico" src="\/img\/icons\/why-[a-z]+\.webp" alt=""/)
    assert.doesNotMatch(t, /use-why\//)
  }
  assert.doesNotMatch(text(w), /ฟรี/, 'ป้ายข้อเท็จจริงไม่ใช้คำว่าฟรี')
  // 5 พ.ย. อาร์ต "ลองแบบขั้นตอน 1-4": รายการเรียงลำดับ (ol) · เลขขั้นจาก CSS counter · เส้นส้มเชื่อมขั้น
  assert.match(w, /<ol class="up2-why__grid up2-why__steps">/)
  const cs = (readFileSync('src/styles/use-page.css', 'utf8') + readFileSync('src/styles/review-wall.css', 'utf8'))
  assert.match(cs, /\.up2-why__steps \{[^}]*counter-reset: why/)
  assert.match(cs, /\.up2-why__steps > li::before \{[^}]*content: counter\(why\)/)
  for (const h of ['มีรายละเอียดให้ตรวจร่วมกัน', 'ดูตัวอย่างก่อนตัดสินใจ', 'มีเอกสารสำหรับองค์กร', 'มีคนดูแลหลังรับเสื้อ']) assert.ok(text(w).includes(h), h)
  const css = (readFileSync('src/styles/use-page.css', 'utf8') + readFileSync('src/styles/review-wall.css', 'utf8'))
  assert.match(css, /\.up2-why__grid \{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/, 'อาร์ต "กวาดตาเยอะไป" · แถวเดียว')
  assert.ok(m.indexOf('id="real-work"') < m.indexOf('up2-why'))
})

/* ติดต่อ: การ์ดพบทีมดีของหน้าแรก (อาร์ต 3 พ.ย. "ลบ" หัวข้อทีมดี ไทม์ไลน์ ภาพ การ์ดบริษัท) */
test('/corporate/ ติดต่อ: เหลือการ์ดพบทีมดีของหน้าแรก (หัวข้อ H2) · ไม่มีไทม์ไลน์ / การ์ดบริษัท · LINE use-teamdee-location', () => {
  const m = main('corporate')
  const at = m.indexOf('<section class="wrap hm-sec hm-reference hm-origin" id="story"')
  assert.ok(at > 0)
  const s = m.slice(at, m.indexOf('</section>', at))
  assert.match(s, /<h2 class="hm-visit__h" id="up2-visit-h">/)
  assert.doesNotMatch(s, /hm-tl__step|hm-origin__company|hm-origin__hero|id="origin-h"/)
  assert.match(s, /class="hm-visit"/); assert.match(s, /data-where="use-teamdee-location"/)
  for (const src of imgs(s)) assert.ok(pub(src), src)
  assert.doesNotMatch(m, /class="wrap section up-team"/)
})

/* อาร์ต 3 พ.ย. "faq ต่อ" · FAQ หน้าแรกทั้งชุด */
test('/corporate/ FAQ: ชิ้น FAQ หน้าแรก · H2 v22 · คำถามเดิม 6 ข้อ การ์ดไอคอน 3D · กล่องถามทีม LINE use-faq', () => {
  const m = main('corporate')
  const f = sec(m, 'wrap hm-sec hm-reference hm-faq up2-faq')
  assert.match(text(f), /คำถามก่อนสั่งทำเสื้อบริษัท/)
  const qs = [...f.matchAll(/<details name="use-faq"><summary><img class="hm-faq__art" src="([^"]+)"/g)].map((x) => x[1])
  assert.equal(qs.length, 6)
  for (const src of qs) assert.ok(pub(src), src)
  assert.equal(new Set(qs).size, 6, 'ไอคอนไม่ซ้ำ')
  assert.match(f, /class="hm-faq__help"[\s\S]*data-where="use-faq"/)
  assert.doesNotMatch(m, /hs-accordion/)
  const up = JSON.parse(readFileSync('src/data/use-pages.json', 'utf8')).corp
  for (const [q] of up.faq.items) assert.ok(text(f).includes(q), q)
})

/* อาร์ต 4 พ.ย. "ลบตามภาพ 1 2 3 4": ส่วนปิดหน้า (เล่าโจทย์ของทีมคุณมา) · วางงบและขั้นตอน · ภาพลูกค้าสวมเสื้อ · มีวันที่ต้องใช้เสื้อแล้ว? (เดิม 3 พ.ย. ส่วนปิดหน้าเสื้อ 3D ฟุ้ง) */
test('/corporate/ ไม่มี 4 ส่วนที่อาร์ตสั่งลบ · สารบัญ/ลิงก์ในหน้าไม่ชี้ไปส่วนที่ไม่มี · กลุ่มอื่นยังมีครบ', () => {
  const m = main('corporate')
  assert.doesNotMatch(m, /id="end-h"|class="hm-end|เล่าโจทย์ของทีมคุณมา/, 'ส่วนปิดหน้า')
  assert.doesNotMatch(m, /id="plan"|วางงบและขั้นตอนสั่งเสื้อบริษัท/, 'วางงบและขั้นตอน')
  assert.doesNotMatch(m, /id="photos"|id="usePhotos"|ภาพลูกค้าบริษัทสวมเสื้อในวันใช้งานจริง/, 'ภาพลูกค้าสวมเสื้อ')
  assert.doesNotMatch(m, /id="schedule-h"|id="useDate"|มีวันที่ต้องใช้เสื้อแล้ว/, 'มีวันใช้แล้ว')
  for (const [, id] of m.matchAll(/href="#([^"]+)"/g)) assert.ok(m.includes(`id="${id}"`), `ลิงก์ #${id} ไม่มีปลายทาง`)
  for (const f of ['custom-staff-shirts', 'education', 'sport']) {
    const o = main(f)
    for (const id of ['id="plan"', 'id="schedule-h"', 'id="end-h"']) assert.ok(o.includes(id), `${f} ${id}`)
  }
})

/* อาร์ต 4 พ.ย. "ชอบแบบนี้ทำมาเอามาวางต่อจากภาพสอง": วิธีชำระเงิน (หัวข้อซ้าย · รูปซ้อน 2 ใบ · ข้อความ + โลโก้บัตรขวา) ต่อจากการ์ดภาพ 4 ใบ ก่อน FAQ
   ข้อเท็จจริงเฉพาะที่ยืนยันแล้ว (site.json payLine · faq.json): ใบเสร็จ/ใบกำกับภาษี · Visa / Mastercard · วางบิลตามเงื่อนไข · มัดจำ 50% · ไม่มี UnionPay / JCB */
test('/corporate/ วิธีชำระเงิน (ไม่มีหัวข้อ): ต่อจากการ์ดภาพ 4 ใบ ก่อน FAQ · รูปจริง 2 ใบ · บัตร Visa / Mastercard เท่านั้น', () => {
  const m = main('corporate')
  const p = sec(m, 'up2-pay')
  assert.ok(m.indexOf('class="up2-why"') < m.indexOf('class="up2-pay"'), 'ต่อจากการ์ดภาพ')
  assert.ok(m.indexOf('class="up2-pay"') < m.indexOf('up2-faq'), 'ก่อน FAQ')
  /* อาร์ต "เอาแต่อันนี้" (4 พ.ย.): ไม่มีหัวข้อซ้าย เหลือรูปกับข้อความ · ชื่อส่วนอยู่ที่ aria-label */
  assert.match(p, /<section class="up2-pay" id="payment" aria-label="วิธีชำระเงิน">/)
  assert.doesNotMatch(p, /<h2/)
  const t = text(p)
  for (const w of ['ใบกำกับภาษี', 'บัตรเครดิต', 'วางบิล', 'มัดจำ 50%', 'Visa', 'Mastercard']) assert.ok(t.includes(w), w)
  assert.doesNotMatch(t, /UnionPay|JCB|ฟรี/)
  const ph = [...p.matchAll(/<img class="up2-pay__ph[^"]*" src="([^"]+)"[^>]*alt="([^"]+)"/g)]
  assert.equal(ph.length, 2)
  for (const [, src] of ph) assert.ok(pub(src), src)
  assert.match(p, /<ul class="up2-pay__cards" aria-label="บัตรที่รับ">/)
  assert.doesNotMatch(p, /<svg(?![^>]*aria-hidden="true")/, 'โลโก้บัตรเป็นของตกแต่ง ชื่อบัตรอยู่ใน sr-only')
})

/* อาร์ต 4 พ.ย. "ไปหารูปมาใส่ให้ครบ เสื้อบริษัทจริงๆ": กำแพงรีวิว 6 ช่องว่าง = รูปลูกค้า (img/customer) ใช้ไฟล์เต็ม 1200 ไม่มี srcset โหลดช้ากว่าช่องรีวิว (ไฟล์ย่อ 480)
   ทุกช่องต้องเริ่มจากไฟล์ย่อที่มีจริง + srcset ระบุความกว้างจริงของไฟล์ย่อ */
test('/corporate/ กำแพงรีวิว: ทุกช่องใช้ไฟล์ย่อ + srcset (ความกว้างตรงไฟล์จริง)', () => {
  const p = sec(main('corporate'), 'hm-customer-proof up2-rv')
  const wall = p.slice(p.indexOf('up2-rv__wall'), p.indexOf('</ul>', p.indexOf('up2-rv__wall')))
  const tags = [...wall.matchAll(/<img [^>]*>/g)].map((m) => m[0])
  assert.equal(tags.length, 10)
  for (const t of tags) {
    const src = t.match(/ src="([^"]+)"/)[1]
    const set = t.match(/ srcset="([^"]+)"/)?.[1]
    assert.ok(set, `ไม่มี srcset: ${src}`)
    assert.match(src, /-(320|480)\.webp$/, `ไม่ใช่ไฟล์ย่อ: ${src}`)
    assert.ok(pub(src), src)
    const [small, full] = set.split(', ').map((s) => s.split(' '))
    assert.equal(small[0], src)
    assert.equal(small[1], `${src.match(/-(\d+)\.webp$/)[1]}w`, src)
    assert.ok(pub(full[0]), full[0])
  }
  /* กล่องดูรูปใหญ่ (lightbox.js อ่าน data-full) ต้องได้ไฟล์เต็ม ไม่ใช่ไฟล์ย่อ */
  for (const [, full] of wall.matchAll(/<figure data-full="([^"]+)">/g)) assert.doesNotMatch(full, /-(320|480)\.webp$/)
  assert.equal((wall.match(/<figure data-full="/g) || []).length, (wall.match(/<figure/g) || []).length, 'ทุกรูปลูกค้ามี data-full')
})

/* ต้นเหตุจริงของช่องว่าง (4 พ.ย.): กฎ .up2-rv__wall button (พื้น #E6E1DC) จับปุ่มใส .lb-open ที่กล่องดูรูปวางทับรูปลูกค้า → แผ่นเทาทึบบังรูปที่โหลดแล้ว
   พื้นเทาต้องอยู่เฉพาะปุ่มเปิดรีวิว (li > button) · ปุ่ม .lb-open ในกำแพงต้องโปร่ง */
test('/corporate/ กำแพงรีวิว: ปุ่มดูรูปใหญ่ไม่บังรูปลูกค้า', () => {
  const css = (readFileSync('src/styles/use-page.css', 'utf8') + readFileSync('src/styles/review-wall.css', 'utf8'))
  assert.doesNotMatch(css, /\.up2-rv__wall button\s*\{/, 'กฎปุ่มกว้างเกินไป จับ .lb-open ด้วย')
  assert.match(css, /\.up2-rv__wall > li > button\s*\{[^}]*background: #E6E1DC/)
})

/* อาร์ต 4 พ.ย. "เช็คทั้งหมด พวกระยะ ทำให้ดีๆแบบหน้าแรก": ทุกส่วน 40/40 (≥768) · 36/36 (มือถือ) · H2 44 / 24 แบบหน้าแรก · จับเฉพาะหน้าโฉมใหม่ */
test('/corporate/ ระยะทั้งหน้าแบบหน้าแรก: ส่วนละ 40 / 36 · H2 สเกลเดียวกับหน้าแรก', () => {
  const css = (readFileSync('src/styles/use-page.css', 'utf8') + readFileSync('src/styles/review-wall.css', 'utf8'))
  const block = css.slice(css.indexOf('/* ---------- ระยะทั้งหน้าแบบหน้าแรก'))
  const desk = block.slice(block.indexOf('@media (min-width: 768px)'), block.indexOf('@media (max-width: 767px)'))
  const mob = block.slice(block.indexOf('@media (max-width: 767px)'))
  for (const s of ['.up2-pain', '.up2-ctx', '.up2-rv', '.up2-why', '.up2-pay', '#services', '#real-work', '#faq', '#story']) {
    assert.ok(desk.includes(s) && mob.includes(s), s)
  }
  assert.match(desk, /padding-top: 40px; padding-bottom: 40px;/)
  assert.match(mob, /padding-top: 36px; padding-bottom: 36px;/)
  assert.match(desk, /section:not\(\.up2-hero\) h2 \{ font-size: clamp\(30px, 3\.06vw, 44px\)/)
  assert.match(mob, /section:not\(\.up2-hero\) h2 \{ font-size: 24px/)
  assert.match(block, /^ *body:has\(\.up2-hero\) #main/m, 'จับเฉพาะหน้าโฉมใหม่')
})

/* อาร์ต 4 พ.ย. "ชอบแบบหน้าแรก พวกระยะข้อความ นายแบบนางแบบ องค์ประกอบกำลังดี ไปทำมาใหม่": hero แบบสไลด์แรกหน้าแรก
   ภาพคอม 2304×800 + ภาพมือถือ 3:4 (<picture> แบบ heroTeam.hbs) · มือถือ: ภาพ 3:4 ขอบล่างจาง ข้อความกลางซ้อนขึ้นบนภาพ ปุ่มเต็มกว้าง (ชุดกฎเดียวกับ home.css) */
test('/corporate/ hero แบบหน้าแรก: ภาพมือถือ 3:4 ใน <picture> · กฎมือถือชุดเดียวกับหน้าแรก', () => {
  const hero = sec(main('corporate'), 'band-hero up2-hero')
  const src = hero.match(/<source media="\(max-width: 767px\)" srcset="([^"]+)"/)
  assert.ok(src, 'มี <source> มือถือ')
  for (const s of src[1].split(',').map((x) => x.trim().split(' ')[0])) { assert.match(s, /^\/img\/use-hero\/corp-m-(480|768)\.webp$/); assert.ok(pub(s), s) }
  assert.match(hero, /<picture class="up2-hero__pic">/)
  const css = (readFileSync('src/styles/use-page.css', 'utf8') + readFileSync('src/styles/review-wall.css', 'utf8'))
  const mob = css.slice(css.indexOf('/* ---------- hero มือถือแบบหน้าแรก'))
  assert.ok(mob.length > 40, 'มีชุดกฎ hero มือถือ')
  assert.match(mob, /\.up2-hero__img \{[^}]*aspect-ratio: 3 \/ 4/)
  /* ก้อนข้อความ (เส้นทางหน้า + ข้อความ) ซ้อนขึ้นบนภาพ -88 เท่าหน้าแรก · หน้าแรกไม่มีเส้นทางหน้า จึงซ้อนที่ตัวแรกของก้อน */
  assert.match(mob, /\.up2-hero__crumb \{[^}]*margin-top: -88px/)
  assert.match(mob, /\.up2-hero__copy \{[^}]*text-align: center/)
  assert.match(mob, /\.up2-hero \.th-o__accent \{ color: #E05000; \}/)
})

/* 11 พ.ย. 2026 อาร์ต "ย้ายอันนี้ไว้ล่าง sub head และทำให้รู้ว่ากดเล่นได้ · ภาพสอง เอารีวิวลูกค้าแต่ละอันนั้นๆ" → เลือกทาง A (รูปจริง + รีวิว)
   แถบแท็บอยู่ใต้หัวข้อ+คำโปรย ก่อนแผง · คำนำ "เลือกงานของคุณ" · ปุ่ม ‹ › + ตัวนับ · แผง = รูปลูกค้าองค์กรจริง 3 รูป (ใหญ่ 1 เล็ก 2) + รีวิวเฉพาะแท็บที่ตรงงาน
   (แทนโชว์รูมไดโอรามา 3D 4–5 พ.ย. ที่สั่ง "ไม่เอารูปลูกค้าจริง" · ภาพจิ๋วเสื้อบนแท็บยังเป็นไฟล์แบบจริงของทีมดี) */
test('/corporate/ บริบทงาน รอบ 198: แท็บใต้หัวข้อ ดูกดได้ · แผงรูปลูกค้าองค์กรจริง 3 รูป + รีวิวที่ตรงงาน · ไม่ซ้ำรูปอื่นในหน้า', () => {
  const m = main('corporate')
  assert.equal((m.match(/<section class="up2-ctx[ "]/g) || []).length, 1)
  const c = sec(m, 'up2-ctx')
  assert.doesNotMatch(c, /ต้นแบบ|up2-ctx__dot|up2-ctx__frame/)
  /* ลำดับ: หัวข้อ+คำโปรย → คำนำ → แถบแท็บ → แผง → ‹ › ตัวนับ */
  const at = (s) => { const i = c.indexOf(s); assert.ok(i > 0, s); return i }
  assert.ok(at('class="up2-ctx__head"') < at('class="up2-ctx__hint"') && at('class="up2-ctx__hint"') < at('class="up2-ctx__shelf"') && at('class="up2-ctx__shelf"') < at('class="up2-ctx__views"'), 'แท็บอยู่ใต้หัวข้อ ก่อนแผง')
  /* 198c อาร์ต "ทำมาดีๆหน่อย เอากว้างพิเศษได้": ตัวนับ + ‹ › อยู่ในแผง (มุมขวาบน ติดหัวข้อ) ไม่ใช่แถวลอยใต้แผง */
  assert.match(c, /<div class="up2-ctx__views"><div class="up2-ctx__nav">/, 'ตัวนับ+ลูกศรอยู่ในแผง')
  assert.match(text(c.match(/<p class="up2-ctx__hint" id="up2-ctx-hint">([\s\S]*?)<\/p>/)[1]), /เลือกงานของคุณ/)
  assert.match(c, /<div class="up2-ctx__shelf" role="tablist" aria-label="[^"]+" aria-describedby="up2-ctx-hint">/)
  assert.match(c, /<button type="button" class="up2-ctx__step" data-ctx-step="-1" aria-label="ลักษณะงานก่อนหน้า">/)
  assert.match(c, /<button type="button" class="up2-ctx__step" data-ctx-step="1" aria-label="ลักษณะงานถัดไป">/)
  assert.match(c, /<span class="up2-ctx__count" aria-live="polite">1 \/ 6<\/span>/)
  const tabs = [...c.matchAll(/<button type="button" role="tab" class="up2-ctx__pick" id="up2-ctx-tab-([a-z]+)" aria-controls="up2-ctx-([a-z]+)" aria-selected="(true|false)" tabindex="(0|-1)">([\s\S]*?)<\/button>/g)]
  assert.deepEqual(tabs.map((t) => t[1]), ['office', 'seminar', 'trip', 'party', 'field', 'business'])
  tabs.forEach(([, id, ctl, sel, ti, inner], i) => {
    assert.equal(ctl, id); assert.equal(sel, String(i === 0)); assert.equal(ti, i === 0 ? '0' : '-1')
    const th = inner.match(/<img class="up2-ctx__thumb" src="([^"]+)"[^>]* alt=""/); assert.ok(th && pub(th[1]), `${id}: ภาพจิ๋วเสื้อ`)
    assert.match(inner, /class="up2-ctx__pname"/)
  })
  /* แผง: รูปลูกค้าจริง 3 รูป · รีวิวเฉพาะ สัมมนา ทริป ธุรกิจบริการ */
  const lib = JSON.parse(readFileSync(new URL('../src/data/customers.json', import.meta.url), 'utf8'))
  const RV = { seminar: 'ฝ่ายบุคคล งานกิจกรรมพนักงาน', trip: 'เสื้อทริปเอาต์ติ้ง', business: 'หน่วยงานโรงพยาบาล' }
  const panels = [...c.matchAll(/<div class="up2-ctx__panel" role="tabpanel" id="up2-ctx-([a-z]+)" aria-labelledby="up2-ctx-tab-([a-z]+)"( hidden)?>([\s\S]*?)<!-- \/panel -->/g)]
  assert.equal(panels.length, 6)
  const all = []
  panels.forEach(([, id, lab, hid, a], i) => {
    assert.equal(lab, id); assert.equal(!!hid, i !== 0)
    /* 196b-ctx อาร์ต "ต้องมีรูปอันเดิมด้วย": ภาพไดโอรามาเดิมเป็นภาพใหญ่ + รูปจริง 2 รูป (ป้าย "รูปจริงจากลูกค้า") · 198c: 2 คอลัมน์ ซ้ายไดโอรามา ขวาข้อความ + แถวรูปจริง */
    assert.match(a, /<div class="up2-ctx__media"><figure class="up2-ctx__scene">/, 'ซ้าย = ไดโอรามาอย่างเดียว')
    const body = a.slice(a.indexOf('class="up2-ctx__body"'))
    assert.match(body, /<figure class="up2-ctx__proof"><figcaption class="up2-ctx__real">รูปจริงจากลูกค้า<\/figcaption>/, 'รูปจริงอยู่ในคอลัมน์ข้อความ')
    assert.ok(body.indexOf('up2-ctx__proof') > body.indexOf('up2-ctx__gives') && body.indexOf('up2-ctx__proof') < body.indexOf('up2-ctx__line'), 'แถวรูปจริงอยู่ใต้ทีมดีจัดให้ ก่อนปุ่ม LINE')
    const sc = a.match(/<figure class="up2-ctx__scene"><img class="up2-ctx__img" src="([^"]+)" srcset="([^"]+)"[^>]*alt="([^"]+)"/); assert.ok(sc, `${id}: ภาพไดโอรามาเดิม`)
    for (const u of sc[2].split(',').map((x) => x.trim().split(' ')[0])) assert.ok(pub(u), u)
    assert.match(sc[3], /ภาพจำลอง 3D/, 'alt บอกว่าเป็นภาพจำลอง')
    const pics = [...a.matchAll(/<figure class="up2-ctx__ph up2-ctx__ph--(\d)"><img src="([^"]+)"[^>]*alt="([^"]+)"/g)]
    assert.deepEqual(pics.map((p) => p[1]), ['1', '2'], `${id}: รูปจริง 2 รูป`)
    for (const [, , src, alt] of pics) {
      const c0 = lib.find((x) => src === x.img || src === x.imgSmall); assert.ok(c0 && pub(src), `${id}: ${src} รูปลูกค้าจริง`)
      assert.ok(alt.trim()); all.push(c0.img)
    }
    assert.match(a, /<h3>/); assert.equal((a.match(/class="up2-ctx__give"/g) || []).length, 3)
    assert.match(a, new RegExp(`data-track="line" data-where="use-context-${id}"`))
    const rv = a.match(/<blockquote class="up2-ctx__rv">([\s\S]*?)<\/blockquote>/)
    if (RV[id]) { assert.ok(rv, `${id}: มีรีวิว`); assert.match(text(rv[1]), new RegExp(RV[id])); assert.match(text(rv[1]), /รีวิวจากแชทจริง/) } else assert.ok(!rv, `${id}: ไม่มีรีวิวตรงงาน = ไม่ใส่`)
  })
  assert.equal(new Set(all).size, 12, 'รูปจริงไม่ซ้ำกันทั้ง 6 แท็บ')
  const rest = m.replace(c, '')
  for (const s of all) assert.ok(!new RegExp(`${s.replace(/\.webp$/, '')}[.-]`).test(rest), `${s}: ไม่ซ้ำส่วนอื่นในหน้า (รวมรูปวงกลมบนปุ่ม)`) /* ชื่อไฟล์ตรงตัว: lc21 ≠ lc211 */
  /* ปุ่มดูรีวิว = ปุ่มแคปซูลรูปลูกค้าวงกลม 3 วง (ตัวเดียวกับคลังรีวิว .rvw__all · อาร์ต "cta ดีๆหน่อย") */
  const acts = c.slice(c.indexOf('class="up2-ctx__acts"'))
  const all2 = acts.match(/<a class="rvw__all" href="([^"]+)"><span class="rvw__faces" aria-hidden="true">([\s\S]*?)<\/span><span class="rvw__all-t">([^<]+)<\/span>/); assert.ok(all2, 'ปุ่มรูปลูกค้าวงกลม')
  assert.match(all2[1], /\/project\//); assert.equal((all2[2].match(/background-image:url\(/g) || []).length, 3); assert.match(all2[3], /ดูรีวิวลูกค้าทั้งหมด/)
  assert.doesNotMatch(acts, /class="hm-more"/, 'ไม่ใช่ลิงก์ตัวหนังสือแล้ว')
  /* CSS + JS */
  const css = readFileSync('src/styles/use-page.css', 'utf8')
  assert.match(css, /\.up2-ctx__pick\[aria-selected="true"\] \{[^}]*border-color: var\(--color-orange\)/, 'แท็บที่เลือก = กรอบส้ม')
  assert.match(css, /\.up2-ctx__pick \{[^}]*cursor: pointer/); assert.match(css, /\.up2-ctx__pick:focus-visible \{[^}]*outline:/)
  assert.match(css, /#up2-ctx > \.wrap \{[^}]*width: calc\(100% - 64px\);[^}]*max-width: 1400px/, 'กว้างพิเศษ (ความกว้างที่ 2 ของเว็บ)')
  assert.match(css, /\.up2-ctx__pp \{[^}]*display: grid/)
  assert.match(css, /\.up2-ctx__img \{[^}]*mask-image: radial-gradient/, 'ไดโอรามากลืนพื้น ไม่เห็นกรอบ')
  /* 198d อาร์ต "ทำความสูงให้เท่ากันดีๆหน่อย": ฝั่งภาพเป็นการ์ดเวที ยืดสูงเท่าคอลัมน์ข้อความ · ตัวนับ+‹ › อยู่มุมการ์ดภาพ หัวข้อไม่ต้องเว้นที่ */
  assert.match(css, /\.up2-ctx__panel \{[^}]*align-items: stretch/, 'สองฝั่งสูงเท่ากัน')
  assert.match(css, /\.up2-ctx__media \{[^}]*display: flex;[^}]*border-radius:[^}]*background:/, 'การ์ดเวทีภาพ')
  assert.doesNotMatch(css, /\.up2-ctx__body h3 \{ padding-right/, 'หัวข้อไม่ถูกบีบ')
  assert.match(css, /\.up2-ctx__panel \{ grid-area: 2 \/ 1;/, 'ทุกแผงซ้อนช่องเดียว = ทุกแท็บสูงเท่ากัน ไม่กระโดดตอนสลับ'); assert.match(css, /\.up2-ctx__panel\[hidden\] \{[^}]*visibility: hidden/, 'แผงที่ซ่อนยังกันที่ แต่โปรแกรมอ่านจอไม่อ่าน')
  assert.match(css, /prefers-reduced-motion: reduce/)
  const js = readFileSync('src/js/use-page.js', 'utf8')
  const g = js.slice(js.indexOf('[data-ctx-gal]'), js.indexOf('initReviewBoard()'))
  assert.match(g, /ArrowRight/); assert.match(g, /aria-selected/); assert.match(g, /data-ctx-step/); assert.match(g, /up2-ctx__count/)
  assert.doesNotMatch(g, /mouseenter/)
})

/* 11 พ.ย. อาร์ต "ยังไม่แน่ใจว่า / เสื้อแบบไหนเหมาะกับทีม? ตัดแบบนี้แทน": บังคับขึ้นบรรทัดหลัง "ว่า" (hl ตัวที่ 3) · ข้อความ v22 ไม่เปลี่ยน */
test('/corporate/ การ์ดชวนคุย: หัวข้อขึ้นบรรทัดหลัง "ยังไม่แน่ใจว่า" · แถว 2 เสื้อแบบไหน + เหมาะกับทีม? (ส้ม)', () => {
  const m = main('corporate')
  const h = m.match(/<h2 id="up2-help-h">([\s\S]*?)<\/h2>/)[1].replace(/<\/?t-[a-z]+>/g, '') /* ตัดแท็กตัดบรรทัดไทย */
  assert.match(h, /^<span class="inline-block">[\s\S]*?ยังไม่แน่ใจว่า[\s\S]*?<\/span><br><span class="inline-block">[\s\S]*?เสื้อแบบไหน[\s\S]*?<\/span><wbr><span class="hm-hl">[\s\S]*?เหมาะกับทีม\?/)
  assert.equal(text(h).replace(/\s/g, ''), 'ยังไม่แน่ใจว่าเสื้อแบบไหนเหมาะกับทีม?', 'ข้อความ v22 เดิม')
})
