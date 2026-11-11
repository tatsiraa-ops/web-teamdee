/* สิ่งที่ทำให้หน้าดูไม่เสร็จ ไม่น่าเชื่อ (docs/audit/2026-11-02-confidence.md) ห้ามกลับมา */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { promoTrigger, promoDue } from '../src/js/promo.js'
import { priceSummary } from '../src/js/prices.js'
import { quietFloats } from '../src/js/nudge.js'
import { HERO_CTA } from '../src/js/mobile-ui.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const json = (p) => JSON.parse(read(p))
const pages = json('src/data/product-pages.json')
const uses = json('src/data/use-pages.json')
const entries = (o) => Object.entries(o).filter(([k]) => k[0] !== '_')

test('สกรีนไม่มีมัดจำออกแบบ (อาร์ตเคาะ 2 พ.ย.) · ยังมัดจำ 50% ก่อนผลิต', () => {
  for (const f of ['src/data/product-pages.json', 'src/data/prices.json', 'src/data/faq.json']) assert.doesNotMatch(read(f), /มัดจำออกแบบ|มัดจำ 500/, f)
  assert.match(JSON.stringify(pages.screen.order), /ชำระ 50% ก่อนผลิต/)
})

test('ไม่มีข้อความติดลบตัวเอง', () => {
  assert.doesNotMatch(read('src/partials/ppReviews.hbs'), /ไม่ได้เจาะจงสินค้านี้/)
  for (const [id, u] of entries(uses)) assert.equal(u.trust.note, '', id)
})

test('หัวข้อส่วนโจทย์ไม่ซ้ำกันทั้ง 10 หน้า', () => {
  const hs = entries(uses).map(([, u]) => u.pain.h)
  assert.equal(new Set(hs).size, hs.length)
})

test('แถวประเภทเสื้อไม่มีคำบรรยายรูปของ v22', () => {
  for (const [id, u] of entries(uses)) {
    for (const c of u.products.cards) assert.doesNotMatch(c.p.join(' '), /ภาพตำแหน่งสี|แสดงจุดที่ลาย|รองรับจริง|ตรวจชนิดผ้า|ในสเกลใกล้กัน|เสื้ออีเวนต์ \/ เสื้อกิจกรรม/, `${id} ${c.h}`)
  }
})

test('FAQ ที่ถามว่าได้ไหม ขึ้นต้นด้วยคำตอบตรง ยกเว้นเรื่องที่ยังไม่มีข้อมูล', () => {
  const OPEN = new Set(['หน้านี้รับทำเครื่องแบบนักเรียนด้วยไหม?', 'มีไซซ์เด็กให้เลือกไหม?'])
  const YES = /^(ได้|ไม่|มี|รับได้|ทัน|ใกล้เคียง|ต่างกัน|ทำได้|รับ|ออก|สั่ง)/
  const all = [...entries(uses), ...entries(pages)].flatMap(([id, p]) => p.faq.items.map(([q, a]) => ({ id, q, a })))
  for (const { id, q, a } of all) if (/(ได้ไหม|ไหม\?)/.test(q) && !OPEN.has(q)) assert.match(a, YES, `${id}: ${q}`)
})

test('หน้าสินค้าไม่มีคำบรรยายรูปหรือคำนักพัฒนา', () => {
  const s = read('src/data/product-pages.json')
  for (const w of ['เห็นวิธีทำลาย', 'แสดงจุดต่อลาย', 'แสดงจุดที่ลาย', 'ข้อมูลประกอบการตัดสินใจ', 'พร้อมตารางแยกสินค้า', 'พร้อมภาพผู้สวม', 'ยังไม่รับรองระยะเวลา']) assert.ok(!s.includes(w), w)
})

test('ป๊อปอัปขึ้นตอนเลื่อนเกินครึ่งหน้าทุกขนาดจอ ไม่ขึ้นบังหัวข้อ', () => {
  assert.equal(promoTrigger({ narrow: false, cookieSession: false }), 'scroll')
  assert.equal(promoTrigger({ narrow: false, cookieSession: true }), null)
})

test('ป๊อปอัปไม่ขึ้นกลางส่วนราคา: หน้าที่มีส่วนราคา รอถึง FAQ · หน้าอื่นใช้ครึ่งหน้าเหมือนเดิม', () => {
  assert.equal(promoDue({ y: 7900, view: 812, doc: 16000, markTop: 11000 }), false)
  assert.equal(promoDue({ y: 10300, view: 812, doc: 16000, markTop: 11000 }), true)
  assert.equal(promoDue({ y: 7900, view: 812, doc: 16000, markTop: null }), true)
  assert.equal(promoDue({ y: 0, view: 812, doc: 1000, markTop: null }), false)
})

test('สรุปราคา 3 แถวใต้ hero: เรียงจากจำนวนน้อยไปมาก ราคาตรง prices.json · ไม่มีราคา = ไม่ขึ้น', () => {
  const P = json('src/data/prices.json')
  for (const id of ['polo', 'print', 'screen', 'baseball', 'jersey']) {
    const s = priceSummary(P, id)
    assert.equal(s.rows.length, 3, id)
    const n = s.rows.map((r) => Number(r.price.replace(/,/g, '')))
    assert.ok(n[0] >= n[1] && n[1] >= n[2], `${id}: ${n}`)
    assert.equal(n[0], P.products[id].bands.find((b) => Number.isFinite(b.price[P.products[id].cols[0].id])).price[P.products[id].cols[0].id], id)
  }
  assert.equal(priceSummary(P, 'warmup'), null)
})

test('หน้าลูกค้าใช้สารบัญติดจอชุดเดียวกับหน้าสินค้า และมีรายการราคา', () => {
  assert.match(read('src/partials/usePage.hbs'), /\{\{> ppToc items=up\.toc\}\}/)
  assert.match(read('src/js/use-page.js'), /initToc\(\)/)
  for (const [id, u] of entries(uses)) assert.ok(u.toc.some((t) => t.key === 'products' && t.t === 'ราคา'), id)
})

test('ปุ่มดูภาพลูกค้าเพิ่มเติม: เปิดแล้วเปลี่ยนเป็นกริด ไม่ไปต่อท้ายราง · ย้ายโฟกัสไปภาพแรกที่เพิ่ม', () => {
  assert.match(read('src/styles/use-page.css'), /ul\.pp-photos\.m-rail\.is-open/)
  const js = read('src/js/use-page.js')
  assert.match(js, /classList\.toggle\('is-open'/)
  assert.match(js, /\.lb-open/)
})

test('ส่วนผ้าหน้าวอร์มและเบสบอลมีหัวข้อตามสารบัญ', () => {
  assert.doesNotMatch(read('src/partials/ppFabric.hbs'), /stripOnly/)
  assert.doesNotMatch(read('src/js/product-view.js'), /stripOnly/)
})

test('หน้าที่มีสารบัญพร้อมปุ่ม LINE ติดจอ ไม่ขึ้นการ์ดแนะนำและปุ่มลอยซ้ำ (ตรวจ UI 2 พ.ย.: ของลอยกิน 29% ของจอ)', () => {
  assert.equal(quietFloats({ querySelector: (q) => (q === '.ab-toc__cta' ? {} : null) }), true)
  assert.equal(quietFloats({ querySelector: () => null }), false)
})

test('แถบล่างมือถือหลบตอนปุ่ม LINE ในจอแรกยังเห็นอยู่ ทุกแม่แบบ ไม่ใช่แค่หน้าแรก', () => {
  for (const w of ['hero', 'pp-hero', 'use-hero']) assert.ok(HERO_CTA.includes(`[data-where="${w}"]`), w)
  assert.match(read('src/js/page.js'), /initHeroBar\(\)/)
  assert.doesNotMatch(read('src/js/home.js'), /is-hero-cta/)
})

test('FAQ หน้าสินค้ามีปุ่ม LINE ปุ่มเดียวตาม v22 (เช็กคิว)', () => {
  const t = read('src/partials/ppFaq.hbs')
  assert.match(t, /เช็กคิวตามวันใช้เสื้อ/)
  assert.doesNotMatch(t, /pp-next-faq/)
})

test('ข้อ 4 ลดความยาวมือถือ: การ์ดรูปหน้าสินค้าและการ์ดราคาหน้ากลุ่มเป็นราง · ขั้นตอนใช้ pp-steps', async () => {
  const { RAILS } = await import('../src/js/mobile-ui.js')
  assert.ok(RAILS.includes('.pp-cards'))
  assert.ok(RAILS.includes('ul.uq-grid'))
  assert.match(read('src/partials/ppOptCards.hbs'), /class="pp-cards /)
  assert.match(read('src/partials/ppDetail.hbs'), /class="pp-cards /)
  for (const f of ['ppProduction', 'ppOrder']) assert.match(read(`src/partials/${f}.hbs`), /class="pp-steps /, f)
  /* รอบ 64: ขั้นตอนส่วนวางงบเปลี่ยนเป็นเส้นเวลา up-flow · เหลือ pp-steps ที่ส่วนปัญหา */
  /* รอบ 64: ส่วนปัญหาเปลี่ยนเป็นการ์ดปัญหา–ทีมดีช่วย (up-pain) · หน้ากลุ่มไม่ใช้ pp-steps แล้ว */
  assert.equal((read('src/partials/usePage.hbs').match(/class="pp-steps /g) || []).length, 0)
})

test('ข้อ 5 กริดไม่เหลือแถวไม่เต็ม: fullRows ปัดลงให้เต็มแถว · น้อยกว่า 1 แถวคงเดิม', async () => {
  const { fullRows } = await import('../src/js/use-view.js')
  assert.equal(fullRows(7, 6, 12), 6)
  assert.equal(fullRows(8, 6, 12), 6)
  assert.equal(fullRows(24, 6, 12), 12)
  assert.equal(fullRows(5, 3, 6), 3)
  assert.equal(fullRows(4, 3, 6), 3)
  assert.equal(fullRows(6, 3, 6), 6)
  assert.equal(fullRows(2, 3, 6), 2)
  assert.equal(fullRows(0, 6, 12), 0)
})

test('ข้อ 5 หน้ากลุ่ม: ภาพลูกค้าเริ่มแสดงเต็มแถว ที่เหลืออยู่หลังปุ่มดูเพิ่ม · แบบเสื้อเต็มแถว', () => {
  const t = read('src/partials/usePage.hbs')
  assert.match(t, /lt @index \.\.\/up\.photos\.shown/)
  assert.match(t, /lt up\.photos\.shown up\.photos\.items\.length/)
  assert.match(read('vite.config.js'), /fullRows\(/)
})

test('รูปลูกค้าจริงที่เคยไม่ได้ลงทะเบียน (2 พ.ย.) มีกลุ่ม คำบรรยาย และไฟล์จริง', () => {
  const cs = json('src/data/customers.json')
  const groups = Object.keys(json('src/data/use-pages.json')).filter((k) => k[0] !== '_')
  /* 2 พ.ย. รอบ 63: เทียบรูปซ้ำแบบเลื่อนหา (ncc) แล้วตัด co08 co18 sp14 sp19 (= real/r06 r08 r01 r05) และ lc218 lc420 lc427 (ซ้ำ lc217 sp26 co35) */
  const want = 'lc161 lc174 lc211 lc222 lc246 lc262 lc289 lc298 lc307 lc323 lc346 lc379 lc391'.split(' ')
  for (const n of 'co08 co18 sp14 sp19 lc218 lc420 lc427'.split(' ')) assert.ok(!cs.find((x) => x.img === `/img/customer/${n}.webp`)?.photoGroup, `${n}: ซ้ำ ต้องไม่อยู่ในกลุ่ม`)
  for (const n of want) {
    const c = cs.find((x) => x.img === `/img/customer/${n}.webp`)
    assert.ok(c, n)
    assert.ok(groups.includes(c.photoGroup), `${n}: กลุ่ม ${c.photoGroup}`)
    assert.ok(c.occ && c.q >= 2, `${n}: occ/q`)
    assert.ok(existsSync(`public${c.imgSmall}`), `${n}: ${c.imgSmall}`)
  }
  assert.equal(cs.filter((x) => x.img === '/img/customer/lc289.webp').length, 1)
})

test('การ์ดเบสบอลและ Jersey ใช้รูปเสื้อจริงแล้ว ไม่มีโน้ต "รอรูป" ค้าง', () => {
  const P = json('src/data/products.json')
  for (const id of ['baseball', 'jersey']) {
    const p = P.find((x) => x.id === id)
    assert.equal(p.imgKind, 'real', id)
    assert.ok(existsSync(`public${p.img}`), p.img)
    assert.doesNotMatch(p.imgNote || '', /รอรูป/, id)
  }
})

test('หน้า Jersey และเบสบอลมีผลงานจริง 3 รูป ไฟล์มีจริง (2 พ.ย. หารูปเพิ่ม)', () => {
  const works = json('src/data/works.json')
  for (const id of ['jersey', 'baseball']) {
    const w = works.filter((x) => x.product === id)
    assert.equal(w.length, 3, id)
    for (const x of w) {
      assert.equal(x.imgKind, 'real')
      assert.ok(existsSync(`public${x.img}`), x.img)
      assert.ok(x.alt && !/รอ/.test(x.alt), x.alt)
    }
  }
  assert.match(read('src/partials/ppWork.hbs'), /this\.fit/)
})

test('ภาพลูกค้าชุดรูปรีวิว (cr) ตัดแถบเบอร์โทรท้ายภาพแล้ว มีกลุ่มและคำบรรยายไม่ซ้ำในกลุ่มเดียวกัน', () => {
  const cs = json('src/data/customers.json').filter((x) => x.img.startsWith('/img/customer/cr'))
  assert.ok(cs.length >= 30, `cr ${cs.length}`)
  const seen = new Set()
  for (const c of cs) {
    assert.ok(existsSync(`public${c.img}`) && existsSync(`public${c.imgSmall}`), c.img)
    assert.ok(c.photoGroup && c.occ, c.img)
    const k = `${c.photoGroup}|${c.occ}`
    assert.ok(!seen.has(k), `คำบรรยายซ้ำในกลุ่ม ${k}`); seen.add(k)
  }
})

test('ส่วนทีมดีหน้ากลุ่ม: สองคอลัมน์ตาม v22 · การ์ดออฟฟิศและหลังรับเสื้อจาก site.json · ไม่ซ้ำส่วนปิด', () => {
  const t = read('src/partials/usePage.hbs')
  const sec = t.slice(t.indexOf('<!-- 15 ·'), t.indexOf('{{!-- ส่วนปิดแบบเดียวกับหน้าแรก'))
  /* รอบ 64: เบอร์โทร/เวลาทำการอยู่ในส่วนปิดที่อยู่ติดกันแล้ว → การ์ดเหลือ ออฟฟิศ + หลังรับเสื้อ */
  assert.equal((sec.match(/class="up-care__row"/g) || []).length, 2)
  assert.doesNotMatch(sec, /site\.hours|site\.phonePrimary/)
  for (const k of ['site.address', 'site.mapUrl', 'site.claimDays']) assert.ok(sec.includes(k), k)
  assert.doesNotMatch(sec, /#each up\.team\.p/)
  for (const [id, up] of Object.entries(json('src/data/use-pages.json'))) if (id[0] !== '_') assert.equal(up.team.p.length, 1, id)
})

test('ส่วนวางงบหน้ากลุ่ม: แผ่นเดียวสองฝั่ง · รายการเป็นไอคอนเช็ก · ขั้นตอนเป็นเส้นเวลา · ปุ่มถามมีไอคอน LINE', () => {
  const t = read('src/partials/usePage.hbs')
  const sec = t.slice(t.indexOf('id="plan"'), t.indexOf('<!-- 12 ·'))
  assert.match(sec, /class="up-brief"/)
  assert.equal((sec.match(/class="up-checks"/g) || []).length, 2)
  assert.doesNotMatch(sec, /pp-dot/)
  assert.match(sec, /#each up\.plan\.price\.p\}\}<p/)
  assert.match(sec, /class="up-flow"/)
  assert.match(sec, /cb cb--s[^"]*"[^>]*>\s*<span class="cb__ico"[^>]*>\{\{> icoLine\}\}/)
  assert.match(read('src/styles/main.css'), /\.cb--s \.cb__ico\s*\{[^}]*background/)
})

test('ส่วน "ทำไมทีมดี": ทุกข้อได้ไอคอนที่มีไฟล์จริง ตรงความหมาย · ภาพประกอบไม่ซ้ำกับภาพลูกค้าบนหน้า', async () => {
  const { benefitIcon } = await import('../src/js/use-view.js')
  assert.equal(benefitIcon('มีเอกสารสำหรับองค์กร'), 'Doc')
  assert.equal(benefitIcon('มีคนดูแลหลังรับเสื้อ'), 'Shield')
  assert.equal(benefitIcon('ดูตัวอย่างก่อนตัดสินใจ'), 'Swatch')
  assert.equal(benefitIcon('วางแผนตามวันแจกจริง'), 'Calendar')
  for (const [id, up] of Object.entries(json('src/data/use-pages.json'))) {
    if (id[0] === '_') continue
    for (const c of up.benefits.cards) assert.ok(existsSync(`src/partials/ico${benefitIcon(c.h)}.hbs`), `${id}: ${c.h}`)
  }
  const t = read('src/partials/usePage.hbs')
  assert.match(t, /class="up-why__list"/)
  assert.match(t, /\{\{> \(concat 'ico' this\.ico\)\}\}/)
  assert.match(read('vite.config.js'), /benefitPhoto/)
})

test('แถบสรุปใต้ hero หน้ากลุ่ม (อาร์ต 2 พ.ย.: ลบราคา เหลือสิทธิพิเศษ) · ส่วนตัวเลขมีโลโก้ลูกค้าวิ่ง พร้อมปุ่มหยุด', () => {
  const t = read('src/partials/usePage.hbs')
  const strip = t.slice(t.indexOf('class="pp-strip'), t.indexOf('</section>', t.indexOf('class="pp-strip')))
  assert.match(strip, /<ul class="pp-strip__make up-strip__facts">/)
  assert.doesNotMatch(strip, /up\.hero\.price|ดูราคาทุกแบบ/)
  const trust = t.slice(t.indexOf('{{#if up.trust.show}}'), t.indexOf('<!-- 03 ·'))
  assert.match(trust, /data-marquee/)
  assert.match(trust, /homeV4\.logoRows/)
  /* ปุ่มหยุดเลื่อนมาจาก site-extras.js ทุกหน้า · ห้ามเรียกซ้ำในหน้า (เคยได้ 2 ปุ่ม) */
  assert.match(read('src/js/site-extras.js'), /safe\(initMarqueePause\)/)
  assert.doesNotMatch(read('src/js/use-page.js'), /initMarqueePause/)
  const html = read('dist-wp/corporate/index.html')
  assert.ok((html.match(/class="hm-marquee__track"/g) || []).length >= 2, 'โลโก้ขึ้นจริง')
})

test('ส่วนโจทย์คนสั่ง: การ์ดแยกปัญหากับสิ่งที่ทีมดีช่วย · ไอคอนตามความหมาย · ไม่มีเลขลำดับ', async () => {
  const { painIcon } = await import('../src/js/use-view.js')
  assert.equal(painIcon('ต้องรวบรวมไซซ์หลายแผนก'), 'Ruler')
  assert.equal(painIcon('ต้องพร้อมก่อนวันแข่งขัน'), 'Calendar')
  assert.equal(painIcon('สปอนเซอร์หลายรายต้องอนุมัติโลโก้'), 'Pen')
  for (const [id, up] of Object.entries(json('src/data/use-pages.json'))) {
    if (id[0] === '_') continue
    for (const c of up.pain.cards || []) assert.ok(existsSync(`src/partials/ico${painIcon(c.h)}.hbs`), `${id}: ${c.h}`)
  }
  const t = read('src/partials/usePage.hbs')
  const sec = t.slice(t.indexOf('{{#if up.pain.show}}'), t.indexOf('{{/if}}', t.indexOf('{{#if up.pain.show}}')))
  assert.match(sec, /class="up-pain"/)
  assert.match(sec, /ทีมดีช่วย/)
  assert.doesNotMatch(sec, /pp-card__no|eyebrow/)
  for (const f of ['corporate', 'custom-staff-shirts']) assert.doesNotMatch(read(`dist-wp/${f}/index.html`).replace(/<[^>]+>/g, ''), /ทีมดีช่วย\s+ช่วย/, f)
})

test('hero หน้ากลุ่ม: H1 คำหลักเด่น คำค้นต่อท้ายเป็นบรรทัดรอง (ข้อความครบ) · คำสัญญาเป็นจุดมีไอคอน · ป้ายรูปจริงระบบเดียว', async () => {
  const { h1Parts } = await import('../src/js/use-view.js')
  assert.deepEqual(h1Parts('รับทำเสื้อพนักงานร้านค้า / เสื้อร้านอาหาร / เสื้อคาเฟ่'), { main: 'รับทำเสื้อพนักงานร้านค้า', rest: 'เสื้อร้านอาหาร / เสื้อคาเฟ่' })
  assert.deepEqual(h1Parts('รับทำเสื้อกีฬา'), { main: 'รับทำเสื้อกีฬา', rest: '' })
  const t = read('src/partials/usePage.hbs')
  const hero = t.slice(t.indexOf('<!-- 01 · hero'), t.indexOf('</section>', t.indexOf('<!-- 01 · hero')))
  assert.match(hero, /class="up-h1__rest"/)
  assert.match(hero, /class="up-promise"/)
  assert.match(hero, /class="up-hero__proof"/)
  const html = read('dist-wp/custom-staff-shirts/index.html')
  const h1 = html.slice(html.indexOf('<h1'), html.indexOf('</h1>')).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
  for (const w of ['รับทำเสื้อพนักงานร้านค้า', 'เสื้อร้านอาหาร', 'เสื้อคาเฟ่']) assert.ok(h1.includes(w), `H1 ยังมี ${w}: ${h1}`)
})

test('ภาพแบบ → เสื้อจริง: กรอบสองฝั่งเท่ากัน · ป้ายวางบนรูป · ลูกศรเชื่อมเป็น SVG · หัวข้อไม่ซ้ำแท็บ', () => {
  const t = read('src/partials/downloadAssets.hbs')
  assert.match(t, /<figcaption class="proof-tag proof-tag--design">/)
  assert.match(t, /<figcaption class="proof-tag proof-tag--real">/)
  assert.match(t, /คุยเรื่องเสื้อแนวนี้<span class="arw" aria-hidden="true">&rarr;<\/span>/)
  assert.match(t, /class="proof-arrow"[^>]*>\{\{> icoArrow\}\}/)
  const css = read('src/styles/main.css')
  assert.match(css, /\.download-assets__proofs \.design-proof__pair figure\s*\{[^}]*aspect-ratio/)
  assert.match(css, /\.download-assets__proofs:has\(\.proof-tabs\) \.design-proof > h3/)
})

test('ภาพแบบ → เสื้อจริง (จอคอม): ข้อความและปุ่มเลือกงานซ้าย รูปเสื้อขวา · มือถือเรียงเดิม', () => {
  const t = read('src/partials/downloadAssets.hbs')
  assert.match(t, /<div class="design-proof__text"><h3>\{\{this\.title\}\}<\/h3><p class="proof-note">/)
  const css = read('src/styles/main.css')
  assert.match(css, /@media \(min-width: 1024px\)[^@]*\.download-assets__proofs:has\(\.proof-tabs\)\s*\{[^}]*grid-template-columns/)
  assert.match(css, /grid-template-rows: subgrid/)
})

test('ภาพแบบ → เสื้อจริง: ปุ่มเลือกงานมีรูปเสื้อจริงย่อ · หัวข้อในกล่องข้อความไม่ซ้ำปุ่มที่เลือก', () => {
  const t = read('src/partials/downloadAssets.hbs')
  assert.match(t, /role="tab" class="proof-tab"[^>]*><img src="\{\{this\.real\.imgSmall\}\}" alt=""/)
  const css = read('src/styles/main.css')
  assert.match(css, /\.download-assets__proofs:has\(\.proof-tabs\) \.design-proof__text > h3/)
  assert.match(css, /\.proof-tabs \.proof-tab\[aria-selected="true"\]/)
})

test('hero หน้ากลุ่ม (อาร์ต: ยังดูโหล): รูปล้นขอบขวา · การ์ดแบบ 3D จริงของกลุ่มลอยทับ · ลายเส้นโค้งจากโลโก้ทีมดี · คำหลักขีดเน้น', () => {
  const t = read('src/partials/usePage.hbs')
  const hero = t.slice(t.indexOf('<!-- 01 · hero'), t.indexOf('</section>', t.indexOf('<!-- 01 · hero')))
  assert.match(hero, /class="up-hero__mark"[^>]*>\{\{> brandMark\}\}/)
  assert.match(hero, /class="up-hero__design"/)
  assert.match(hero, /up\.designs\.items\.\[0\]/)
  assert.match(hero, /data-where="use-hero"/)
  assert.match(read('src/partials/brandMark.hbs'), /M1555\.08,0c/)
  assert.match(read('src/styles/use-page.css'), /\.up-hero__fig\s*\{[^}]*margin-right: calc\(/)
})
