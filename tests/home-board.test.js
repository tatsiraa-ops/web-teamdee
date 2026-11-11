/* หน้าแรกตามบอร์ด Miro ของอาร์ต (3 พ.ย. 2026 · "เน้นรูปภาพ รูปต้องดูเต็ม ไอคอนต้องเด่นกว่าข้อความ")
   ต้นแบบ: hero รูปเต็มกรอบ + แถบไอคอน (Delicake) · การ์ดบริการรูปคนเต็มใบ + ขั้นตอนไอคอน + แถวเสื้อจริง (PMK) · การ์ดรูปใหญ่ + ปุ่มลูกศร (Tumtook)
   ส่วนที่บอร์ดไม่ได้วาง (ขั้นตอน ชำระเงิน รับประกัน กล่องชวนคุย) ผมเก็บไว้แบบกระชับ · H2 ของ v22 ยังครบ (v22-structure.test.js) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const home = () => { const h = read('dist-wp/index.html'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const css = () => read('src/styles/home.css')
const rule = (sel) => (css().match(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[1] || ''
const px = (body, prop) => Number((body.match(new RegExp(`(?:^|;|\\s)${prop}:\\s*(\\d+)px`)) || [])[1] || 0)

test('ลำดับส่วนตามบอร์ด: hero → ไอคอน → โลโก้ → รู้จักทีมดี → บริการ → ตัวเลข → กลุ่มลูกค้า → รีวิว → แบบเสื้อ → ชวนคุย → ดูแลงาน → ผลงาน → ชำระเงิน/รับประกัน → เรื่องราว → บทความ → FAQ', () => {
  const m = home()
  const order = ['data-hero-sets', 'id="benefits"', 'aria-labelledby="logo-h"', 'id="brand-expertise"', 'id="services"', 'aria-label="ตัวเลขทีมดี"', 'id="uses"', 'id="reviews"', 'id="designs"', 'id="cta-discover"', 'id="cta-quote"', 'id="process"', 'id="review-wall"', 'id="aftercare"', 'id="story"', 'id="home-stories"', 'id="faq"']
  const at = order.map((k) => [k, m.indexOf(k)])
  assert.deepEqual(at.filter(([, i]) => i < 0).map(([k]) => k), [], 'ส่วนหาย')
  const wrong = at.filter(([, i], n) => n && i < at[n - 1][1]).map(([k]) => k)
  assert.deepEqual(wrong, [], 'ลำดับผิด')
})

test('แถบไอคอนเกยขอบล่าง hero: ไอคอนใหญ่กว่าตัวหนังสือ · 8 ข้อครบ', () => {
  const m = home()
  const band = m.slice(m.indexOf('id="benefits"'), m.indexOf('</section>', m.indexOf('id="benefits"')))
  assert.match(band, /hm-benefits--icons/)
  assert.equal((band.match(/<li\b/g) || []).length, 8)
  const ico = px(rule('.hm-benefits--icons .hm-benefits__ico'), 'width')
  const h = px(rule('.hm-benefits--icons .hm-benefits__h'), 'font-size')
  assert.ok(ico >= 52 && h && ico >= h * 3, `ไอคอน ${ico}px ต้องใหญ่กว่าหัวข้อ ${h}px อย่างน้อย 3 เท่า`)
})

test('การ์ดบริการ: รูปเต็มใบ ชื่อบริการทับบนรูป (PMK) · การ์ดกลุ่มลูกค้า: รูปใหญ่ + ปุ่มลูกศร (Tumtook)', () => {
  const m = home()
  /* 3 พ.ย. รอบต่อมา: การ์ดบริการเปลี่ยนเป็นภาพซ้าย ข้อความขวา (ตรวจในเทส "การ์ดบริการแบบ PMK") */
  assert.match(m, /class="hm-cats hm-cats--3 hm-cats--poster hm-cats--hero-cards"/)
  assert.match(m, /class="wrap hm-uses-rows"/)
})

/* 3 พ.ย. รอบ 2 อาร์ต "เอาแค่ภาพเดียว เจนใหม่ภาพจริงและไอคอน จัดเรียงให้ดีกว่า (Delicake)" · ซ้ายภาพเดียวขอบโค้ง · ขวาหัวข้อ + 3 ขั้นไอคอน 3D ใหม่ · พื้นขาว */
test('ดูแลงาน 3 ขั้น: ภาพเดียวขอบโค้ง + 3 ขั้นไอคอน 3D ใหม่ · ข้อความเดิม · ไม่มีพื้นดำ', () => {
  const m = home()
  const p = m.slice(m.indexOf('id="process"'), m.indexOf('id="review-wall"'))
  assert.doesNotMatch(p, /data-home-process|hm-steps__img/)
  assert.equal((p.match(/<img class="hm-care2__photo"|<img class="hm-help__photo"/g) || []).length, 1)
  assert.ok(existsSync(new URL('../public/img/process/helping-1200.webp', import.meta.url)))
  const steps = [...p.matchAll(/<li class="hm-help__step"><img class="hm-help__ico" src="(\/img\/icons\/help-[a-z]+\.webp)"[\s\S]*?<h3>([\s\S]*?)<\/h3>/g)]
  assert.deepEqual(steps.map((x) => x[2].replace(/<span class="hm-help__no" aria-hidden="true">\d<\/span>/, '').replace(/<[^>]+>/g, '').trim()), ['ช่วยคิด', 'ช่วยจัดการ', 'ช่วยจบงาน'])
  for (const [, src] of steps) assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
  const t = p.replace(/<[^>]+>/g, '')
  for (const x of ['แนะนำผ้าและแบบตามงบ', 'ทวนสี ไซซ์ จำนวน ราคา และกำหนดส่ง', 'ตรวจงานก่อนส่ง', 'รายละเอียดชัด ขออนุมัติง่าย และติดตามงานได้']) assert.ok(t.includes(x), x)
  assert.match(p, /data-where="home-process"/)
  assert.match(p, /href="\/team-shirt-order-checklist\/"/)
  const s = css(); assert.match(s.slice(s.lastIndexOf('/* ดูแลงาน 3 ขั้น รอบ 2')), /#process\.hm-help \{[^}]*background: #fff/)
})


/* 3 พ.ย. อาร์ตกากบาทส่วนชำระเงินบนหน้าแรก (ข้อมูลยังอยู่ใน FAQ และแถบสิทธิประโยชน์) → รับประกันอยู่เดี่ยว */
test('ส่วนชำระเงินถูกลบจากหน้าแรก · กล่องชวนคุยสองกล่องอยู่แถบเดียวกัน', () => {
  const m = home()
  const pair = (a, b) => { const i = m.lastIndexOf('<div class="hm-pair', m.indexOf(a)); return i >= 0 && m.indexOf(b) > i && m.indexOf('<!-- /hm-pair -->', i) > m.indexOf(b) }
  assert.doesNotMatch(m, /id="payment"|hm-pair--care/)
  assert.ok(pair('id="cta-discover"', 'id="cta-quote"'), 'cta-discover + cta-quote')
})

/* 10 พ.ย. อาร์ต (ส่วนผลงานเสื้อบนหุ่น) "อันนี้เอาคลังรีวิวไปใส่ รีวิวลูกค้า เอาแค่รูปมาพอ รูปลูกค้า เอาแบบเยอะๆ เอาให้น่าเชื่อถือ
   ต่อจากนี้อันนี้จะเป็นคลังรีวิว จะเอาไปใส่อีกหลายๆหน้า ทำเตรียมรอไว้ก่อน เริ่มที่หน้านี้"
   → partial กลาง reviewWall.hbs · ข้อมูลกลาง reviewWall (vite.config.js · รูปลูกค้าจริงจาก media-library q3 คละกลุ่ม) · 3 แถวเลื่อนสวนกัน (review-marquee.js เดิม) · ปุ่มหยุด · กดดูรูปใหญ่ */
/* รอบ 2 (10 พ.ย.) อาร์ต "ทำ cta ดีๆหน่อย · headline ไว้กลางๆ · รีวิวไม่ต้องเลื่อน แสดงเต็มๆ · กว้างพิเศษ · เอาแบบรวมเยอะๆ 10 แถวได้"
   → ผนังรูปเรียงเต็มแถว (justified · สูงเท่ากันในแถว ไม่ตัดรูป) ไม่เลื่อนเอง · 60 รูป ≈ 10 แถวจอใหญ่ (มือถือ 20 รูป) · ขอบล่างจาง + CTA กลาง (ปุ่มรูปลูกค้า 3 วง + LINE) */
test('คลังรีวิว: ผนังรูปลูกค้าจริงเต็มแถว ไม่เลื่อน · 60 รูปไม่ซ้ำ · หัวข้อกลาง · กว้างพิเศษ · CTA กลาง · ใช้ partial กลาง', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="review-wall"'), m.indexOf('</section>', m.indexOf('id="review-wall"')))
  assert.ok(sec.length > 100)
  assert.doesNotMatch(m, /id="real-work"/, 'ส่วนผลงานบนหุ่นเดิมถูกแทนแล้ว')
  assert.doesNotMatch(sec, /data-rvm|rvw__dup|data-rvm-pause/, 'ไม่เลื่อนเอง')
  const figs = [...sec.matchAll(/<li class="rvw__ph" style="--r:([\d.]+)"><img src="([^"]+)"[^>]*alt="([^"]*)"/g)]
  assert.ok(figs.length >= 60, `มี ${figs.length} รูป`)
  assert.equal(new Set(figs.map((f) => f[2])).size, figs.length, 'รูปซ้ำ')
  for (const [, r, src, alt] of figs) {
    assert.ok(Number(r) > 0.4 && Number(r) < 3, src)
    assert.match(src, /^\/img\/customer\//)
    assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
    assert.ok(alt.trim().length > 3, src)
  }
  assert.match(sec, /class="wrap hm-head rvw-sec__head"/)
  const cta = sec.slice(sec.indexOf('class="rvw__cta"'))
  assert.match(cta, /class="rvw__all" href="\/project\/#reviews"/)
  assert.equal((cta.slice(0, cta.indexOf('</a>')).match(/background-image:url\(\/img\/customer\//g) || []).length, 3, 'ปุ่มมีรูปลูกค้าจริง 3 วง')
  assert.match(cta, /class="cb cb--p[^"]*" href="https:\/\/[^"]*line[^"]*"[^>]*data-where="review-wall"/)
  assert.ok(existsSync(new URL('../src/partials/reviewWall.hbs', import.meta.url)))
  assert.match(readFileSync(new URL('../site/index.html', import.meta.url), 'utf8'), /\{\{> reviewWall\b/)
  const c = css()
  assert.match(c, /\.rvw__ph \{[^}]*flex: calc\(var\(--r\) \* 100\) 1 calc\(var\(--r\) \* var\(--rvw-h\)\);/)
  assert.match(c, /@media \(min-width: 768px\) \{ \.rvw-sec > \.wrap, \.rvw \{ width: calc\(100% - 64px\); max-width: 1400px;/)
  assert.match(c, /\.rvw-sec__head \{[^}]*text-align: center;/)
})

test('แถบไอคอนใช้ภาพไอคอนชุดทีมดี 8 ตัว (Magnific · GPT 2.5 · 3 พ.ย.) ไม่ใช่ไอคอนเส้นเล็กชุดเดิม', () => {
  const m = home()
  const band = m.slice(m.indexOf('id="benefits"'), m.indexOf('</section>', m.indexOf('id="benefits"')))
  const imgs = [...band.matchAll(/<img class="hm-benefits__art" src="([^"]+)"[^>]*alt=""/g)].map((x) => x[1])
  assert.equal(imgs.length, 8)
  assert.equal(new Set(imgs).size, 8)
  for (const src of imgs) assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
  assert.doesNotMatch(band, /<svg/)
})

/* 3 พ.ย. อาร์ต: ฉากประกอบ "ดูปลอม" → แบนเนอร์ภาพเดียวจบ ข้อความอยู่ในภาพ เลื่อนเป็นสไลด์ ไม่แยกแท็บเสื้อทีม/กีฬา (Magnific GPT 2.5 high + รูปนายแบบจริงเป็นภาพอ้างอิง) */
test('hero เป็นสไลด์ภาพไม่มีตัวหนังสือ + ข้อความ HTML ทับฝั่งซ้าย (อาร์ต 3 พ.ย. "ข้อความ ฟอนต์ เดะเราเอามาใส่เอง") · ปุ่ม LINE กดได้จริง · H1/H2 ของ v22 อยู่ครบ', () => {
  const m = home()
  const hero = m.slice(m.indexOf('data-hero-sets'), m.indexOf('id="benefits"'))
  const imgs = [...hero.matchAll(/<img class="th-front th-slide__img" src="([^"]+)"[^>]*alt="([^"]*)"/g)]
  assert.ok(imgs.length >= 2, `${imgs.length} สไลด์`)
  for (const [, src, alt] of imgs) {
    assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
    assert.doesNotMatch(alt, /ทัก LINE/, 'ภาพไม่มีตัวหนังสือแล้ว alt บอกแค่ภาพ')
  }
  const copies = [...hero.matchAll(/<div class="th-copy-o">([\s\S]*?)<\/div>\s*<\/div>/g)].map((x) => x[1])
  assert.equal(copies.length, imgs.length)
  for (const c of copies) assert.match(c, /class="cb cb--p[^"]*"[^>]*data-where="hero"/)
  assert.match(copies[0], /เสื้อทีมที่ทุกคน[\s\S]*ภูมิใจจะใส่/)
  assert.match(hero, /<h1 id="th-h1" class="sr-only">รับทำเสื้อทีม เสื้อบริษัท พร้อมโลโก้<\/h1>/)
  /* export ห่อคำไทยด้วย <t-g>/<span> กันตัดบรรทัด · เทียบหลังตัดแท็ก */
  const h2 = (hero.match(/<h2 class="th-o__kick">([\s\S]*?)<\/h2>/) || [])[1] || ''
  assert.equal(h2.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), 'สั่งทำเสื้อกีฬา เสื้อกิจกรรม ตามแบบ')
  assert.equal((m.match(/<h1\b/g) || []).length, 1)
  assert.equal((hero.match(/role="tab"/g) || []).length, imgs.length)
  /* ข้อความอยู่ในกรอบกลางที่อาร์ตวาด (เริ่ม ~11% ของความกว้าง) */
  assert.match(rule('.th-copy-o'), /left:\s*11\.5%/)
})
test('แบนเนอร์เต็มจอ ไม่มีกรอบ (อาร์ต "แสดงเต็มๆมาเลยไม่ต้องเอากรอบ") · แถบไอคอนไม่ทับภาพ', () => {
  const reel = rule('.th-reel')
  assert.match(reel, /border-radius:\s*0/)
  assert.match(rule('.th--slides > .wrap'), /max-width:\s*none/)
  assert.match(rule(':is(.page-home,.td-page-home) .hm-benefits-band'), /margin-top:\s*0/)
})

test('แบนเนอร์สัดส่วนเท่า PMK (≈ 2.88:1 · อาร์ต "banner เอาขนาดเท่ากัน pmk") · width/height ในแท็กตรงกับไฟล์', () => {
  assert.match(rule('.th-reel'), /aspect-ratio:\s*2304 \/ 800/)
  const m = home()
  const hero = m.slice(m.indexOf('data-hero-sets'), m.indexOf('id="benefits"'))
  for (const t of hero.match(/<img class="th-front th-slide__img"[^>]*>/g)) assert.match(t, /width="2304" height="800"/)
})

test('แบนเนอร์มีปุ่มก่อนหน้า/ถัดไปที่มีชื่อ · ภาพลากไม่ได้ (กันภาพหลุดตอนปัด)', () => {
  const m = home()
  const hero = m.slice(m.indexOf('data-hero-sets'), m.indexOf('id="benefits"'))
  assert.match(hero, /<button type="button" class="th-nav th-nav--prev" data-set-prev aria-label="แบนเนอร์ก่อนหน้า">/)
  assert.match(hero, /<button type="button" class="th-nav th-nav--next" data-set-next aria-label="แบนเนอร์ถัดไป">/)
  for (const t of hero.match(/<img class="th-front th-slide__img"[^>]*>/g)) assert.match(t, /draggable="false"/)
})


test('แถบไอคอนไม่มีกรอบ ไม่มีเงา (อาร์ต 3 พ.ย. "ไม่เอากรอบ หรือ drop shadow")', () => {
  const r = rule(':is(.page-home,.td-page-home) .hm-benefits-band .hm-benefits--icons.is-flat')
  assert.match(r, /box-shadow:\s*none/)
  assert.match(r, /background:\s*transparent/)
  assert.match(home(), /class="hm-benefits hm-benefits--get hm-benefits--icons is-flat"/)
})

test('โลโก้ลูกค้าชิดกันขึ้น · "ที่ไว้วางใจทีมดี" เป็นส้ม (อาร์ต 3 พ.ย.)', () => {
  const m = home()
  const h = (m.match(/<h2 id="logo-h"[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || ''
  assert.match(h, /<span class="hm-hl">[\s\S]*ที่ไว้วางใจ[\s\S]*ทีมดี[\s\S]*<\/span>/)
  assert.equal(h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), 'ส่วนหนึ่งของทีม ที่ไว้วางใจทีมดี')
  assert.match(rule('.hm-hl'), /color:\s*#F05A00/)
  assert.ok(px(rule(':is(.page-home,.td-page-home) .hm-logowrap .hm-marquee__track'), 'gap') <= 12)
})

test('แถบโลโก้หน้าแรกไม่มีปุ่มหยุด (อาร์ต 3 พ.ย. "เอาปุ่มหยุดออก") · หยุดเองตอนโฟกัสคีย์บอร์ด · ลดการเคลื่อนไหว = นิ่ง', () => {
  const m = home()
  assert.match(m, /<div class="hm-marquee" data-marquee data-marquee-nobtn>/)
  assert.match(read('src/js/marquee-pause.js'), /\[data-marquee\]:not\(\[data-marquee-nobtn\]\)/)
  assert.match(css(), /\.hm-marquee:focus-within \.hm-marquee__track \{ animation-play-state: paused; \}/)
})

test('แถบไอคอนไม่มี hover (อาร์ต 3 พ.ย. "เอา hover ออก") · ไม่มีพื้นสีขึ้นหลังไอคอนตอนชี้', () => {
  assert.doesNotMatch(css(), /hm-benefits--icons > li:hover \.hm-benefits__ico \{ background: #ffe2c9; \}/)
  assert.match(css(), /hm-benefits--icons\.is-flat > li:hover[^{]*\{[^}]*background:\s*none/)
})

test('หัวข้อสไลด์กีฬา "เสื้อกีฬา เสื้องานวิ่ง" อยู่แถวเดียว (อาร์ต 3 พ.ย. "เอาแถวเดียว")', () => {
  assert.match(rule('#th-set-sport .th-o__h > .inline-block'), /white-space:\s*nowrap/)
  assert.doesNotMatch(css(), /#th-set-sport \.th-copy-o \{ width: 23%; \}/)
})

test('รู้จักทีมดี: รูปพื้นที่ผลิตภาพเดียวฝั่งซ้ายแบบ PMK + ป้าย "ภาพประกอบ" (AI · อาร์ตเลือกข้อ 3 · 3 พ.ย.) · ข้อความเดิม ไม่มีคำว่าโรงงาน', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="brand-expertise"'), m.indexOf('</section>', m.indexOf('id="brand-expertise"')))
  const img = sec.match(/<img class="hm-brand-story__main" src="([^"]+)"[^>]*>/)
  assert.ok(img && /\/img\/about\/production-/.test(img[1]), 'ใช้รูปพื้นที่ผลิต')
  assert.ok(existsSync(new URL(`../public${img[1]}`, import.meta.url)))
  assert.doesNotMatch(sec, /hm-brand-story__team/)
  /* 3 พ.ย. อาร์ต "ลบคำว่าภาพประกอบออกให้หมดในหน้าแรก" */
  assert.doesNotMatch(sec, /hm-brand-story__tag/)
  assert.doesNotMatch(sec.replace(/<[^>]+>/g, ''), /โรงงาน/)
})

test('รู้จักทีมดี: พื้นขาว · ชิดซ้าย · การ์ด "เคยเจอ → ทีมดีทำ" 3 ใบจาก expertise.pains · ป้าย 3 ช่วย · ไม่ซ้ำตัวเลขกับแถบสถิติ (อาร์ต 3 พ.ย.)', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="brand-expertise"'), m.indexOf('</section>', m.indexOf('id="brand-expertise"')))
  const txt = sec.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
  assert.match(sec, /<h2 id="exp-h"/)
  assert.match(sec, /<h3 class="hm-brand-story__h3">/)
  const rows = sec.match(/<li class="hm-fix">/g) || []
  assert.equal(rows.length, 3)
  for (const t of ['ตอบช้า', 'ตอบภายใน 5 นาที', 'ข้อมูลไม่ครบ', 'ทวนสเปกก่อนผลิตทุกงาน', 'เห็นแบบ 3D ใน 24 ชม.', 'ช่วยคิด', 'ช่วยจัดการ', 'ช่วยจบงาน']) assert.ok(txt.includes(t), t)
  assert.doesNotMatch(txt, /2,800|10,000|โรงงาน/)
  assert.doesNotMatch(sec, /hm-brand-story__links|hm-brand-story__values/)
  assert.match(rule('.hm-brand-story.is-white'), /background:\s*#fff/)
})
test('ช่องว่างระหว่างส่วนหน้าแรกแคบลงเป็นจังหวะเดียว (อาร์ต 3 พ.ย. "ช่องว่างระหว่างชั้นเยอะเกิน") · จอคอม 56px ส่วนบาง 40px', () => {
  assert.match(css(), /\/\* จังหวะช่องว่างหน้าแรก[\s\S]*?padding-block: 56px/)
  assert.match(css(), /\/\* จังหวะช่องว่างหน้าแรก[\s\S]*?\.hm-sec--tight[^{]*\{ padding-block: 40px; \}/)
})

test('รู้จักทีมดีเน้นภาพกับไอคอน: ไอคอน 3D ชุดใหม่ 6 ตัว (3 ช่วย + 3 การ์ด) ไฟล์มีจริง ไม่ซ้ำกัน (อาร์ต 3 พ.ย.)', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="brand-expertise"'), m.indexOf('</section>', m.indexOf('id="brand-expertise"')))
  const icons = [...sec.matchAll(/<img class="hm-ico3d" src="([^"]+)"[^>]*alt=""/g)].map((x) => x[1])
  assert.equal(icons.length, 6)
  assert.equal(new Set(icons).size, 6)
  for (const src of icons) assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
})

test('การ์ดบริการชุดใหม่: หัวข้อจากมุมคนสั่ง + บรรทัดรองข้อเท็จจริง (วันผลิตจาก lead-times) + ปุ่มส้มล้วน · ภาพคนใส่เสื้อเต็มการ์ด', () => {
  const lead = JSON.parse(read('src/data/lead-times.json'))
  const m = home()
  const sec = m.slice(m.indexOf('id="services"'), m.indexOf('</section>', m.indexOf('id="services"')))
  const txt = sec.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  for (const t of [`ผลิต ${lead.polo.days}`, `ผลิต ${lead.screen.days}`, 'ออกแบบฟรี']) assert.ok(txt.includes(t), t)
  assert.match(m, /class="hm-cats hm-cats--3 hm-cats--poster hm-cats--hero-cards"/)
  assert.match(rule(':is(.page-home,.td-page-home) #services .hm-cats--hero-cards .hm-cat__img'), /position:\s*absolute/)
})

test('การ์ดบริการเรียง พิมพ์ลาย → ปัก → สกรีน · CTA แบบลิงก์คลีน (ตัวหนา เส้นใต้ส้ม ลูกศร) ไม่ใช่แคปซูลวงกลมซ้อน (อาร์ต 3 พ.ย.)', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="services"'), m.indexOf('</section>', m.indexOf('id="services"')))
  const order = [...sec.matchAll(/class="hm-cat__img is-service-(\w+)"/g)].map((x) => x[1])
  assert.deepEqual(order, ['print', 'polo', 'screen'])
  const cta = rule(':is(.page-home,.td-page-home) #services .hm-cats--hero-cards .hm-cat__more.is-link')
  assert.match(cta, /background:\s*none/)
  assert.match(cta, /text-decoration-color:\s*#FF6C00/)
  assert.equal((sec.match(/<span class="hm-cat__more is-link"/g) || []).length, 3)
})

test('หัวข้อการ์ดบริการขึ้นต้นด้วยชื่อบริการ แล้วตามด้วยจุดเด่น (อาร์ต 3 พ.ย. "เสื้อพิมพ์ลาย ปัก สกรีน คำพวกนี้ขึ้นก่อน")', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="services"'), m.indexOf('</section>', m.indexOf('id="services"')))
  const heads = [...sec.matchAll(/<a class="hm-cat__name hm-cat__link"[^>]*>([\s\S]*?)<\/a>/g)].map((x) => x[1])
  const kind = heads.map((h) => (h.match(/<span class="hm-cat__kind">([\s\S]*?)<\/span>/) || [])[1]?.replace(/<[^>]+>/g, '').trim())
  assert.deepEqual(kind, ['เสื้อพิมพ์ลาย', 'เสื้อโปโลปัก', 'เสื้อสกรีน'])
  /* อาร์ต 3 พ.ย. "ไม่ต้องเอาคำต่อท้าย" → หัวข้อมีแค่ชื่อบริการ */
  for (const h of heads) assert.doesNotMatch(h, /hm-cat__need/)
})




/* 3 พ.ย. อาร์ต: "ทั้งแถวเป็นของบริษัท ต่อมาเป็นของโรงเรียน แถวสามแถวสี่" · แถวตามกลุ่มเมนู "เสื้อสำหรับทีมคุณ" (nav.json) · รูปลูกค้าจริงเต็มการ์ด 4:3 */
test('กลุ่มลูกค้าหน้าแรก: 4 แถวตามกลุ่มเมนู แถวละ 3 การ์ดรูปจริงใหญ่ · ช่องว่างใต้การ์ดบริการแคบลง', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="uses"'), m.indexOf('</section>', m.indexOf('id="uses"')))
  const nav = JSON.parse(readFileSync(new URL('../src/data/nav.json', import.meta.url), 'utf8')).uses.groups
  const strip = (x) => x.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const rows = sec.split('<li class="hm-uses-row"').slice(1)
  assert.equal(rows.length, 4)
  const seen = new Set()
  rows.forEach((r, i) => {
    assert.equal(strip(r.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]), nav[i].h)
    const cards = [...r.matchAll(/<a class="hm-use-card" href="([^"]+)"[\s\S]*?<img src="([^"]+)"[^>]*width="(\d+)" height="(\d+)"/g)]
    assert.equal(cards.length, 3, nav[i].h)
    for (const [, href, src, w, h] of cards) {
      assert.match(src, /\/img\/uses-row\/[a-z-]+-960\.webp$/)
      assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
      assert.ok(!seen.has(src), `รูปซ้ำ ${src}`); seen.add(src)
      assert.equal(Number(w) / Number(h), 4 / 3)
      assert.ok(href.length > 1)
    }
  })
})

/* 9 พ.ย. อาร์ต "เจนมาใหม่ รูปทั้งหมด เอาแบบเป็นรูปแบบประเภทนั้นๆ สมจริงๆ" · ภาพจำลอง Nano Banana จากลายเสื้อจริงของทีมดี (คนหันหลัง ไม่มีหน้า)
   alt ต้องบอกตรงๆ ว่าเป็นภาพจำลอง ไม่อ้างว่าเป็นลูกค้าจริง · ป้ายบนภาพไม่ใส่ (หน้าแรกห้ามคำว่า "ภาพประกอบ") */
test('กลุ่มลูกค้าหน้าแรก: ภาพจำลองจากลายเสื้อจริงทุกการ์ด · alt ไม่อ้างว่าเป็นลูกค้าจริง', () => {
  const cards = JSON.parse(readFileSync(new URL('../src/data/home.json', import.meta.url), 'utf8')).uses.cards
  assert.equal(Object.keys(cards).length, 12)
  for (const [k, c] of Object.entries(cards)) {
    assert.match(c.alt, /^ภาพจำลองจากลายเสื้อจริงของทีมดี /, k)
    assert.doesNotMatch(c.alt, /ลูกค้า/, k)
  }
  const m = home()
  const sec = m.slice(m.indexOf('id="uses"'), m.indexOf('</section>', m.indexOf('id="uses"')))
  assert.equal((sec.match(/alt="ภาพจำลองจากลายเสื้อจริงของทีมดี /g) || []).length, 12)
})

/* 3 พ.ย. อาร์ต "พวกระยะยังดูขัดๆ" · วัดจริง 1440: เนื้อหา→หัวข้อบริการ 112 · การ์ดบริการ→ตัวเลข 32 · เส้นคั่นตัวเลขชนขอบพื้นครีม → ตั้งจังหวะ 96 / 48 / 80 */
test('จังหวะช่วงบริการ: ห่างส่วนอื่น 96 · การ์ด→ตัวเลข 48 · ตัวเลขเว้นขาว 80 ก่อนพื้นครีม', () => {
  const s = css()
  const blk = s.slice(s.lastIndexOf('/* จังหวะ brand → บริการ → ตัวเลข → กลุ่มลูกค้า'))
  assert.match(blk, /main #services \{ padding-top: 40px; padding-bottom: 48px; \}/)
  assert.match(blk, /\.hm-stats-band \{ padding-bottom: 80px; \}/)
  assert.match(blk, /\.hm-stats-band \.hm-stats--fit \{ padding-top: 0; \}/)
  assert.match(blk, /main #uses \{ padding-top: 72px; \}/)
  assert.doesNotMatch(s, /^#services \{ padding-bottom: 24px; \}$/m)
})

/* 3 พ.ย. อาร์ต: หัวข้อส่วนต่างๆ ไฮไลท์ส้มท้ายวลีแบบ "ส่วนหนึ่งของทีม ที่ไว้วางใจทีมดี" · ใช้ helper hl (ข้อความเดิมไม่เปลี่ยน) */
test('หัวข้อทุกส่วนหน้าแรกไฮไลท์ส้มท้ายวลี (span.hm-hl)', () => {
  const m = home()
  const strip = (x) => x.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const want = {
    'logo-h': 'ที่ไว้วางใจทีมดี', 'exp-h': 'เข้าใจคนสั่งเสื้อบริษัท', 'cats-h': 'ให้เหมาะกับทีมคุณ', 'uses-h': 'ให้เหมาะกับทีมของคุณ',
    'home-reviews-h': 'ที่สั่งทำเสื้อกับทีมดี', 'designs-h': 'แยกตามกลุ่มลูกค้า', 'process-h': 'มีทีมดีช่วยดูแล',
    'review-wall-h': 'ใส่เสื้อทีมดี', /* 10 พ.ย. ผลงานบนหุ่น → คลังรีวิว */ 'care-h': 'และบริการหลังการขาย', 'origin-h': 'สู่ทีมดีที่คุณพบได้จริง', 'journal-h': 'และข่าวสารจากทีมดี',
  }
  for (const [id, tail] of Object.entries(want)) {
    const h = m.match(new RegExp(`<h2 id="${id}"[^>]*>([\\s\\S]*?)</h2>`))
    assert.ok(h, id)
    const hl = h[1].match(/<span class="hm-hl">([\s\S]*)<\/span>/)
    assert.ok(hl, `${id} ไม่มีไฮไลท์`)
    assert.equal(strip(hl[1]), tail, id)
  }
  for (const sec of ['cta-discover', 'cta-quote', 'faq']) {
    const s = m.slice(m.indexOf(`id="${sec}"`))
    assert.match(s.slice(0, s.indexOf('</h2>')), /class="hm-hl"/, sec)
  }
  assert.doesNotMatch(m, /\[\[|\]\]/)
  assert.match(css(), /\.hm-brand-story__copy h2 \.hm-hl \{ color: #F05A00; \}/)
})

/* 3 พ.ย. อาร์ต "ชอบสีพื้นหลังการ์ดแบบนี้" (พื้นสตูดิโอเทาอุ่นในรูปการ์ดบริการ) → แทนพื้นครีมทุกส่วนในหน้าแรก */
test('พื้นครีมหน้าแรกเปลี่ยนเป็นพื้นสตูดิโอแบบการ์ดบริการ (uses · designs · home-stories)', () => {
  const s = css()
  const blk = s.slice(s.lastIndexOf('/* พื้นสตูดิโอ'))
  assert.match(blk, /--hm-studio: [^;]*linear-gradient\(/)
  for (const id of ['uses', 'designs', 'home-stories']) assert.match(blk, new RegExp(`main #${id}[,{ ]`), id)
  assert.match(blk, /background: var\(--hm-studio\)/)
})

/* 3 พ.ย. FAQ รอบ 2 · อาร์ต "ที่โล่งเยอะไป ไปเจนไอคอนมาเพิ่ม" → หัวข้อแถวบน · การ์ดคำถาม 2 คอลัมน์ ทุกข้อมีไอคอน 3D ของตัวเอง · กล่องถามทีมเติมช่องสุดท้าย · เปิดทีละข้อ (details name) */
test('FAQ หน้าแรก: การ์ดคำถาม 2 กลุ่ม 6+5 ข้อ ไอคอน 3D ไม่ซ้ำทุกข้อ · กล่องถามทีมอยู่ในตาราง · ไม่มี details ซ้อน', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="faq"'), m.indexOf('</section>', m.indexOf('id="faq"')))
  assert.match(sec, /<header class="hm-faq__head">[\s\S]*?<h2 id="faq-h"[\s\S]*?href="\/faq\/"/)
  const groups = sec.split('class="hm-faq__group"').slice(1)
  assert.equal(groups.length, 2)
  assert.deepEqual(groups.map((g) => (g.match(/<details /g) || []).length), [6, 5])
  assert.equal((sec.match(/<details name="home-faq"/g) || []).length, 11)
  assert.doesNotMatch(sec, /v14-faq-more/)
  const icons = [...sec.matchAll(/<summary><img class="hm-faq__art" src="([^"]+)" alt="" width="(\d+)" height="(\d+)"/g)].map((x) => x[1])
  assert.equal(icons.length, 11)
  assert.equal(new Set(icons).size, 11)
  for (const src of icons) { assert.match(src, /\/img\/icons\/faq-[a-z-]+\.webp$/); assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src) }
  assert.equal((sec.match(/class="hm-faq__ico"/g) || []).length, 11)
  assert.match(groups[1], /class="hm-faq__help"[\s\S]*?faq-ask\.webp[\s\S]*?<a class="cb cb--p[^"]*" href="https:\/\/[^"]+" data-track="line" data-where="faq"/)
})

/* 3 พ.ย. อาร์ต: ส่วนท้าย "คู่มือ+ข่าวสาร" เปลี่ยนเป็นบทความจริง วางชิดกว่าหน้า /blog/ · บทความล่าสุด 4 เรื่องจาก legacy-posts.json แถวเดียว */
test('บทความหน้าแรก: 4 การ์ดบทความล่าสุดจริง (ปก หมวด ชื่อ วันที่) แถวเดียว ชิดกัน', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="home-stories"'), m.indexOf('</section>', m.indexOf('id="home-stories"')))
  const posts = JSON.parse(readFileSync(new URL('../src/data/legacy-posts.json', import.meta.url), 'utf8')).items
  const newest = [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const cards = [...sec.matchAll(/<a class="hm-post" href="([^"]+)"[\s\S]*?<img src="([^"]+)"[\s\S]*?<span class="hm-post__t">([\s\S]*?)<\/span>[\s\S]*?<time datetime="([^"]+)">/g)]
  assert.equal(cards.length, 4)
  cards.forEach(([, href, img, t, date], i) => {
    assert.equal(href, newest[i].url); assert.equal(img, newest[i].img); assert.equal(date, newest[i].date)
    assert.equal(t.replace(/<[^>]+>/g, ''), newest[i].title)
  })
  assert.match(sec, /href="\/blog\/"/)
  assert.doesNotMatch(sec, /hm-journal__card|facebook\.com/)
  const s = css()
  assert.match(s.slice(s.lastIndexOf('/* บทความหน้าแรก')), /\.hm-posts \{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); gap: 14px;/)
})

/* 3 พ.ย. อาร์ต "อันนี้ทำมาใหม่ เต็มที่" (กล่องพบทีมดี) · โทนขาวส้ม (ไม่ใช้พื้นมืด) · ภาพ 3D ไดโอรามา (ภาพประกอบ) + ปุ่ม Google Maps · ข้อมูล 3 แถวมีไอคอน 3D · ข้อมูลจริงจาก site.json */
test('กล่องพบทีมดี: ภาพ 3D ไดโอรามาติดป้ายภาพประกอบ · 3 แถวข้อมูลมีไอคอน 3D · LINE โทร แผนที่ · ข้อมูลจาก site.json', () => {
  const m = home()
  const site = JSON.parse(readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8'))
  const v = m.slice(m.indexOf('class="hm-visit"'), m.indexOf('</section>', m.indexOf('class="hm-visit"')))
  assert.ok(v.length > 100)
  assert.match(v, /<h3[^>]*>[\s\S]*?<span class="hm-hl">[\s\S]*?นนทบุรี[\s\S]*?<\/h3>/)
  assert.match(v, /<img class="hm-visit__art" src="\/img\/visit\/diorama-1200\.webp"/)
  assert.ok(existsSync(new URL('../public/img/visit/diorama-1200.webp', import.meta.url)))
  const rows = [...v.matchAll(/<li class="hm-visit__row"><img src="(\/img\/icons\/visit-[a-z]+\.webp)"/g)].map((x) => x[1])
  assert.equal(rows.length, 3)
  for (const src of rows) assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
  const text = v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  assert.ok(text.includes(site.address), 'ที่อยู่')
  assert.ok(text.includes(site.phonePrimary), 'เบอร์โทร')
  assert.match(v, /data-where="home-teamdee-location"/)
  assert.match(v, /href="tel:0975495941"/)
  const mapHref = (v.match(/class="hm-visit__map" href="([^"]+)"/) || [])[1] || ''
  assert.equal(mapHref.replace(/&#x3D;/g, '=').replace(/&amp;/g, '&'), site.mapUrl, 'ลิงก์แผนที่')
  assert.doesNotMatch(css().slice(css().lastIndexOf('/* กล่องพบทีมดี')), /background:\s*#2[0-9a-f]{5}|background:\s*#1[0-9a-f]{5}/i)
})

/* 3 พ.ย. อาร์ต: เรื่องจุดเริ่มต้นตามอินโฟกราฟิกของทีมดีเอง · รอบ 3 "รายละเอียดตามเดิมได้ อยากทำโครงแบบ wireframe v22 เอารูปหรือไอคอนเด่นๆ ชูโรง"
   → ซ้าย: ป้าย + H3 + ไทม์ไลน์ 4 ช่วงข้อความเต็ม · ขวา: ภาพ 3D ชูโรง (ภาพประกอบ ไม่ใช่หลักฐานเหตุการณ์) · ล่าง: การ์ดบริษัทเต็มกว้าง + ปุ่มขอเอกสาร */
test('เรื่องราวทีมดี: โครง v22 (ข้อความซ้าย ภาพ 3D ชูโรงขวา การ์ดบริษัทล่าง) · ไทม์ไลน์ 4 ช่วงข้อความเต็ม', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="story"'), m.indexOf('class="hm-visit"'))
  const strip = (x) => x.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  /* รอบ 5 อาร์ต "ลบ": ป้าย จุดเริ่มต้นของเรา + H3 จากคนสั่งเสื้อ… ออก · ไทม์ไลน์เริ่มเลยใต้ H2 */
  assert.doesNotMatch(sec, /class="tag"|จากคนสั่งเสื้อ/)
  assert.match(sec, /<div class="hm-origin__copy">\s*<ol class="hm-tl">/)
  /* รอบ 4 (อาร์ต "ไอคอนเยอะไป"): ภาพชูโรงภาพเดียวเล่า 4 ช่วง · ไทม์ไลน์ใช้จุดส้มบนเส้นแบบอินโฟกราฟิก ไม่มีไอคอนซ้ำ */
  assert.doesNotMatch(sec, /hm-tl__ico|story-ch-|faq-receipt/)
  const steps = [...sec.matchAll(/<li class="hm-tl__step"><span class="hm-tl__dot" aria-hidden="true"><\/span>(x?)[\s\S]*?<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)]
  /* ตรวจหน้าแรก 4 พ.ย. P2: ช่วงเวลาเป็น H3 ต่อจาก H2 (เดิม H4 ข้ามระดับ) */
  assert.equal(steps.length, 4)
  assert.deepEqual(steps.map(([, , h]) => strip(h)), ['2018 อยากทำเสื้อให้ทีมตัวเอง', 'ออกไปหาแหล่งผลิตด้วยตัวเอง', 'จากงานเสริม สู่การร่วมทีม', 'สร้างทางเลือกที่ลูกค้าพึ่งพาได้'])
  assert.match(strip(steps[0][3]), /ตอบช้า โทรไม่รับ และข้อมูลไม่ครบ/)
  assert.match(strip(steps[3][3]), /มีคนรับผิดชอบจนจบงาน/)
  /* รอบ 6: ภาพชูโรงเป็นภาพแนวคนทำงาน (ตามอินโฟกราฟิกของทีมดี) · ติดป้ายภาพประกอบทั้งบนภาพและใน alt */
  assert.match(sec, /<figure class="hm-origin__hero is-photo"><img src="\/img\/story\/designers-1200\.webp"[^>]*alt="[^"]+"/)
  assert.ok(existsSync(new URL('../public/img/story/designers-1200.webp', import.meta.url)))
  const company = sec.slice(sec.indexOf('<div class="hm-origin__company">'))
  assert.match(strip(company), /ทีมดีวันนี้ — บริษัท ดีดี ฟินิกซ์ จำกัด\s*จดทะเบียนบริษัท 19 มกราคม 2021/)
  assert.match(company, /data-where="home-company-documents"/)
  assert.doesNotMatch(sec, /hm-origin__gallery|โรงงาน/)
  assert.equal((sec.match(/href="\/about-us\/"/g) || []).length, 1)
})

/* 3 พ.ย. อาร์ต: "ลบคำว่าภาพประกอบออกให้หมดในหน้าแรก" (ป้ายบนภาพ alt และคอมเมนต์ที่หลุดไปหน้าเว็บ) */
test('หน้าแรกไม่มีคำว่า "ภาพประกอบ" เลย', () => {
  assert.doesNotMatch(readFileSync(new URL('../dist-wp/index.html', import.meta.url), 'utf8'), /ภาพประกอบ/)
})

/* 3 พ.ย. อาร์ต: ส่วนรับประกัน "เจนไอคอนแล้วฟิวไอคอนนอกการ์ด ให้มองภาพไม่ต้องอ่านก็รู้" · ไอคอน 3D ใหญ่ทะลุขอบบนการ์ด · ข้อมูลเดิม 7 วัน / 30 วัน */
test('รับประกัน: 2 การ์ดไอคอน 3D ใหญ่ทะลุขอบ (เคลม 7 วัน · สั่งเพิ่ม 30 วัน) ข้อมูลเดิมครบ', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="aftercare"'), m.indexOf('</section>', m.indexOf('id="aftercare"')))
  const strip = (x) => x.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
  const icons = [...sec.matchAll(/<img class="hm-care__pop" src="(\/img\/icons\/care-[a-z]+\.webp)"/g)].map((x) => x[1])
  assert.deepEqual(icons, ['/img/icons/care-claim.webp', '/img/icons/care-reorder.webp'])
  for (const src of icons) assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
  for (const t of ['แจ้งเคลมภายใน 7 วันหลังรับสินค้า', 'ภายใน 30 วันหลังรับเสื้อ', 'เลขออเดอร์', 'ผ้าต่างล็อตสีอาจต่างเล็กน้อย']) assert.ok(strip(sec).includes(t), t)
  assert.match(sec, /data-where="home-aftercare-reorder"/)
  const s = css(); const blk = s.slice(s.lastIndexOf('/* รับประกันแบบไอคอนทะลุการ์ด'))
  assert.match(blk, /\.hm-care__pop \{[^}]*position: absolute;[^}]*top: -\d+px/)
})

/* 3 พ.ย. อาร์ต: รีวิวหน้าแรกแบบ Delicake ("ทำให้ดีกว่า · พื้นที่ไม่เอาโล่ง") · ซ้าย: หัวข้อ + ชิปกลุ่มงาน + โมเสกรูปงานจริง 5 รูปของกลุ่ม
   ขวา: รูปใหญ่ของรีวิว + ลูกศร · การ์ดคำรีวิวเต็ม (รูปโปรไฟล์ ชื่อ งาน) ไอคอน 3D ทะลุการ์ด · กดรูปเปิดกล่องดูรูปเดิม */
test('รีวิวหน้าแรก: โครง Delicake · ชิป 4 กลุ่ม + โมเสกรูปจริงกลุ่มละ 5 · รีวิวจริงทีละราย ลูกศร · คำรีวิวเต็มจาก reviews.json', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="reviews"'), m.indexOf('id="home-clips"'))
  const reviews = JSON.parse(readFileSync(new URL('../src/data/reviews.json', import.meta.url), 'utf8')).items.filter((r) => r.img)
  assert.match(sec, /<div class="wrap hm-rvb" data-rvb>\s*<div class="hm-rvb__left">\s*<h2 id="home-reviews-h"/)
  assert.deepEqual([...sec.matchAll(/data-rvb-use="([a-z]+)"/g)].map((x) => x[1]), ['corp', 'sport', 'event', 'school'])
  /* อาร์ต 3 พ.ย. "เรียงแถวเดียว ไม่เอาจำนวน" */
  assert.doesNotMatch(sec.slice(sec.indexOf('hm-rvb__chips'), sec.indexOf('hm-rvb__mosaic')), /<b /)
  assert.match(css(), /\.hm-rvb__chips \{ display: flex; flex-wrap: nowrap;/)
  const groups = [...sec.matchAll(/<figure class="hm-rvb__mosaic" data-rvb-group="([a-z]+)"[^>]*>([\s\S]*?)<\/figure>/g)]
  assert.deepEqual(groups.map((g) => g[1]), ['corp', 'sport', 'event', 'school'])
  const all = new Set()
  for (const [, , g] of groups) {
    const imgs = [...g.matchAll(/<img src="([^"]+)"/g)].map((x) => x[1])
    assert.equal(imgs.length, 5)
    for (const src of imgs) { assert.match(src, /^\/img\/review-board\/lc\d+-800\.webp$/); assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src); all.add(src) }
  }
  assert.equal(all.size, 20, 'รูปโมเสกไม่ซ้ำกัน')
  assert.equal((sec.match(/data-rvb-step="-1"/g) || []).length, 1)
  assert.equal((sec.match(/data-rvb-step="1"/g) || []).length, 1)
  const items = [...sec.matchAll(/<article class="hm-rvb__item[^"]*" data-rvb-item data-use="([a-z]+)"[\s\S]*?data-rv-open="([^"]+)"[\s\S]*?<blockquote[^>]*><p>([\s\S]*?)<\/p><\/blockquote>/g)]
  assert.equal(items.length, reviews.length)
  items.forEach(([, use, id, q], i) => { assert.equal(id, reviews[i].id); assert.equal(use, reviews[i].use); assert.equal(q.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), reviews[i].quote) })
  assert.equal((sec.match(/<img class="hm-rvb__avatar"/g) || []).length, reviews.length)
  assert.match(sec, /<img class="hm-rvb__pop" src="\/img\/icons\/review-quote\.webp"/)
  assert.match(sec, /<script type="application\/json" data-rv-json>/)
  assert.match(sec, /href="\/project\/#reviews"/)
  assert.doesNotMatch(sec, /data-rvm/)
  assert.doesNotMatch(sec, /hm-rvb__tag|ภาพงานจริง ·/) /* อาร์ต 3 พ.ย. "ลบ" ป้ายบนโมเสก */
})

/* 3 พ.ย. อาร์ต "ใช้งานยาก เน้นรูปเสื้อที่ออกแบบ เอารหัสออก ชมได้เต็มที่ ไม่ต้องห่างกันเยอะ" · ชิปกรองแถวเดียวชื่อสั้น ไม่มีจำนวน · การ์ดรูปล้วน 4 คอลัมน์ ช่องห่าง 10
   ไม่มีรหัสบนการ์ด (รูป d01–d31 ใช้ชุด design-clean ที่ลบป้ายรหัสในรูป) · รหัสยังอยู่ใน data-code ให้กล่องดูรูปใหญ่ + ปุ่มสั่งแบบนี้ */
test('แบบเสื้อหน้าแรก: ชิปแถวเดียว · การ์ดรูปล้วนไม่มีรหัส · รูปชุดลบป้ายรหัส', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="designs"'), m.indexOf('</section>', m.indexOf('id="designs"')))
  assert.match(sec, /<div class="hm-dz__chips" role="group"[^>]*data-gallery-filter>/)
  assert.doesNotMatch(sec, /hm-dz__stat/) /* อาร์ต 3 พ.ย. "ลบขวามือออก" */
  assert.match(css(), /\.hm-dz__head \{ justify-content: center; text-align: center; \}/)
  assert.doesNotMatch(sec.slice(sec.indexOf('hm-dz__chips'), sec.indexOf('id="pickGrid"')), /<b /)
  const cards = [...sec.matchAll(/<figure class="hm-dz__card" data-code="(TD-\d+)"[^>]*>([\s\S]*?)<\/figure>/g)]
  assert.ok(cards.length >= 8)
  for (const [, code, body] of cards) {
    assert.doesNotMatch(body.replace(/(alt|src|srcset)="[^"]*"/g, ''), new RegExp(code), `${code} ยังโชว์รหัส`) /* ชื่อไฟล์ design-home/<รหัส> ไม่ใช่ตัวหนังสือบนการ์ด */
    const src = body.match(/<img src="([^"]+)"/)[1]
    assert.doesNotMatch(src, /^\/img\/design\/d\d+/, `${code} ใช้รูปที่มีป้ายรหัส`)
  }
  assert.doesNotMatch(sec, /data-gallery-count|hm-design-library__filters/)
})

/* 9 พ.ย. อาร์ต "ยังไม่ได้ ทำมาใหม่" → "ทำให้ดีๆ ไม่ต้องเจนใหม่ · ปุ่มดูแบบเสื้อพิมพ์ลายทั้งหมดดีๆ ไม่เอาตัวเลข"
   รูปชุด design-home (ครอปชิดเสื้อ ลบพื้นตาราง/แถบโลโก้ ด้วย scripts/design-home-crops.py) · การ์ดเท่ากัน 4×2 ไม่มีการ์ดใหญ่
   8 แบบแรกคละกลุ่ม (home.json gallery.lead) · ซ่อนแบบที่สะกดผิด · ปุ่มท้ายเป็นแถบส้มมีพัดรูปเสื้อ ไม่มีตัวเลข เปลี่ยนตามกลุ่มที่กรอง */
test('แบบเสื้อหน้าแรก รอบใหม่: รูปครอปชิดเสื้อ · การ์ดเท่ากัน 5 แถว · แถบดูทั้งหมดไม่มีตัวเลข', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="designs"'), m.indexOf('</section>', m.indexOf('id="designs"')))
  const g = JSON.parse(readFileSync(new URL('../src/data/home.json', import.meta.url), 'utf8')).homeV4?.gallery || JSON.parse(readFileSync(new URL('../src/data/home.json', import.meta.url), 'utf8')).gallery
  assert.match(sec, /id="pickGrid"[^>]*data-preview-limit="20"/) /* 10 พ.ย. อาร์ต "แสดงไม่เกิน 5 แถว" = 4 คอลัมน์ × 5 */
  assert.doesNotMatch(sec, /is-feature|hm-dz__flag|hm-dz__all/)
  const cards = [...sec.matchAll(/<figure class="hm-dz__card" data-code="(TD-\d+)"([^>]*)>([\s\S]*?)<\/figure>/g)]
  assert.ok(cards.length >= 60)
  for (const [, code, attrs, body] of cards) {
    assert.match(body, new RegExp(`<img src="/img/design-home/${code}-720\\.webp" srcset="/img/design-home/${code}-480\\.webp 480w, /img/design-home/${code}-720\\.webp 720w"`), code)
    assert.ok(existsSync(new URL(`../public/img/design-home/${code}-720.webp`, import.meta.url)), code)
    assert.match(attrs, /data-full="\/img\//, `${code} ไม่มีไฟล์เต็มให้กล่องดูรูปใหญ่`)
  }
  const shown = cards.filter(([, , attrs]) => !/ hidden/.test(attrs)).map(([, c]) => c)
  assert.equal(shown.length, 20)
  assert.deepEqual(shown.slice(0, 8), g.lead)
  for (const c of g.hide) assert.ok(!cards.some(([, code]) => code === c), `${c} ต้องไม่อยู่หน้าแรก`)
  const more = sec.slice(sec.indexOf('class="hm-dz__more"'))
  assert.match(more, /^class="hm-dz__more" href="\/designs\/" data-dz-more/)
  assert.equal((more.match(/<img /g) || []).length, 4)
  const txt = more.slice(0, more.indexOf('</a>')).replace(/<[^>]+>/g, ' ')
  assert.match(txt, /ดูแบบเสื้อพิมพ์ลายทั้งหมด/)
  assert.doesNotMatch(txt, /\d/, 'แถบดูทั้งหมดต้องไม่มีตัวเลข')
  const s = css()
  assert.match(s, /\.hm-dz__grid \{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/)
  assert.match(s, /\.hm-dz__more \{[^}]*background: #FF6C00;[^}]*color: #111;/)
  /* อาร์ต "กว้างพิเศษได้" (site-widths: 100% − 64 สูงสุด 1400 ตั้งแต่ 768) */
  assert.match(s, /@media \(min-width: 768px\) \{ #designs > \.wrap \{ width: calc\(100% - 64px\); max-width: 1400px; padding-inline: 0; \} \}/)
})

/* 3 พ.ย. อาร์ต "ต่อเลย คิดเอาเอง อยากดูความครีเอท" (การ์ดคู่ชวนคุย) · 2 ทางเลือก ยังไม่มีแบบ ↔ มีแบบแล้ว · ไอคอน 3D ทะลุการ์ด · รายการ "ส่งมาแค่นี้" 3 ข้อ · โทนขาวส้ม ไม่มีพื้นดำ */
test('การ์ดชวนคุย: 2 ทางเลือก ไอคอน 3D · ส่งมาแค่นี้ 3 ข้อ · ปุ่ม LINE เดิม · มีวงกลม หรือ คั่น · ไม่มีพื้นดำ', () => {
  const m = home()
  const pair = m.slice(m.indexOf('<div class="hm-pair hm-pair--talk'), m.indexOf('<!-- /hm-pair -->', m.indexOf('hm-pair--talk')))
  assert.match(pair, /class="hm-talk__or"[^>]*>หรือ</)
  for (const [id, ico, where] of [['cta-discover', 'talk-design', 'cta-design'], ['cta-quote', 'talk-quote', 'cta-have']]) {
    const s = pair.slice(pair.indexOf(`id="${id}"`), pair.indexOf('</section>', pair.indexOf(`id="${id}"`)))
    assert.match(s, new RegExp(`<img class="hm-talk__pop" src="/img/icons/${ico}\\.webp"`), id)
    assert.ok(existsSync(new URL(`../public/img/icons/${ico}.webp`, import.meta.url)), ico)
    assert.equal((s.match(/<li>/g) || []).length, 3, id)
    assert.match(s, new RegExp(`data-where="${where}"`), id)
  }
  const s = css(); const blk = s.slice(s.lastIndexOf('/* การ์ดชวนคุย 2 ทาง'))
  assert.ok(blk.length > 50)
  assert.doesNotMatch(blk, /background:\s*#(?:1|2)[0-9a-f]{5}/i)
})

/* ตรวจหน้าแรก 4 พ.ย. P2: รูปโปรไฟล์รีวิวแสดง 52px แต่โหลด 480px · โมเสกช่องเล็ก (~195px) โหลด 800px → srcset ให้เบราว์เซอร์เลือกไฟล์เล็ก */
test('P2: รูปโปรไฟล์รีวิว + โมเสกช่องเล็ก มี srcset ไฟล์เล็ก', () => {
  const m = home()
  const avatars = [...m.matchAll(/<img class="hm-rvb__avatar"[^>]*>/g)].map((x) => x[0])
  assert.ok(avatars.length >= 10)
  for (const a of avatars) assert.match(a, /srcset="[^"]*-480-160\.webp 160w[^"]*" sizes="52px"/)
  const mosaic = m.match(/<figure class="hm-rvb__mosaic"[^>]*>([\s\S]*?)<\/figure>/)[1]
  const tiles = [...mosaic.matchAll(/<img[^>]*>/g)].map((x) => x[0])
  assert.equal(tiles.length, 5)
  for (const i of [0, 1, 3]) assert.match(tiles[i], /-800-400\.webp 400w/)
  for (const i of [2, 4]) assert.doesNotMatch(tiles[i], /srcset/)
})

/* 4 พ.ย. อาร์ต (ภาพ hero มือถือ) "แปลกๆอะ ทำมาดีๆหน่อย เจนอะไรเพิ่มได้เต็มที่": ครอปภาพแนวนอนเสื้อขอบถูกตัด + พื้นเทาแยกก้อน
   → ภาพมือถือเจนเฉพาะ 3:4 (คน/เสื้อชุดเดียวกับเดสก์ท็อป เสื้อครบทุกตัว ล่างโล่งไล่สีพื้น) ผ่าน <picture><source media> · img เดิมไม่เปลี่ยน */
test('hero มือถือ: <picture> มี source ภาพแนวตั้ง 3:4 ทุกสไลด์', () => {
  const m = home()
  const pics = [...m.matchAll(/<picture class="th-pic"><source media="\(max-width: 767px\)" srcset="([^"]+)" sizes="100vw" width="768" height="1024"><img class="th-front th-slide__img"/g)]
  assert.equal(pics.length, 2)
  for (const [, set] of pics) {
    assert.match(set, /-m-480\.webp 480w, .*-m-768\.webp 768w/)
    for (const f of set.match(/\/img\/hero\/[\w-]+\.webp/g)) assert.ok(existsSync(new URL(`../public${f}`, import.meta.url)), f)
  }
})

test('หน้าแรก กลุ่มลูกค้า (6 พ.ย. อาร์ต "เอาแถบส้มที่ผมชอบมาใส่ + ปรับความกว้างเป็นพิเศษ"): ชื่อบนแถบส้มไล่สีในรูป · กว้างพิเศษ 100% − 64 สูงสุด 1400', () => {
  const css = readFileSync(new URL('../src/styles/home.css', import.meta.url), 'utf8')
  const blk = css.slice(css.indexOf('/* uses-band'))
  assert.ok(css.includes('/* uses-band'), 'มีชุดกฎแถบส้ม')
  assert.match(blk, /\.hm-use-card__body \{[^}]*position: absolute;[^}]*linear-gradient\(180deg, rgb\(240 90 0 \/ 0\)[^}]*#A33A00/, 'แถบส้มไล่สีแบบการ์ดผ้า/ภาพงาน')
  assert.match(blk, /\.hm-use-card__t \{[^}]*color: #fff/, 'ชื่อตัวขาว')
  assert.match(blk, /#uses :is\(\.hm-head, \.hm-uses-rows\)\.wrap \{ width: calc\(100% - 64px\); max-width: 1400px; padding-inline: 0; \}/, 'กว้างพิเศษ (site-widths)')
  assert.doesNotMatch(css, /#uses \.hm-uses-row \{ margin-inline: -80px; \}/, 'เลิกใช้ขอบเลยกรอบ -80 แบบเดิม')
})

/* 10 พ.ย. อาร์ต "ทำให้มันแสดงไม่เกิน 5 แถว ไปรวบรวมรูปมาให้เต็มๆ ทุกหมวดหน่อยครับ"
   → ทุกกลุ่มมีแบบอย่างน้อย 4 แถว (16) จากแบบมีรหัส + แบบจริงจากแกลเลอรีเว็บเดิม (home.json gallery.extra) · การ์ดแกลเลอรีไม่มีรหัส แต่เปิดกล่องแบบเสื้อโหมดสว่าง (data-design) */
test('แบบเสื้อหน้าแรก: ทุกกลุ่มลูกค้ามีแบบเต็มอย่างน้อย 4 แถว · แบบแกลเลอรีครอปชุดเดียวกัน', () => {
  const m = home()
  const sec = m.slice(m.indexOf('id="designs"'), m.indexOf('</section>', m.indexOf('id="designs"')))
  const cards = [...sec.matchAll(/<figure class="hm-dz__card"([^>]*)>([\s\S]*?)<\/figure>/g)].map(([, a, b]) => ({ a, b }))
  const chips = [...sec.matchAll(/data-use="([a-z]+)"/g)].map((x) => x[1])
  assert.ok(chips.length >= 8)
  for (const id of chips) {
    const n = cards.filter((c) => (c.a.match(/data-uses="([^"]*)"/) || [, ''])[1].split(' ').includes(id)).length
    assert.ok(n >= 16, `${id} มีแค่ ${n} แบบ`)
  }
  const extra = cards.filter((c) => /data-code=""/.test(c.a))
  assert.ok(extra.length >= 60)
  for (const c of extra) {
    assert.match(c.a, /data-design="1"/)
    assert.match(c.b, /<img src="\/img\/design-home\/g-[a-z]+-\d{3}-720\.webp"/)
    const f = c.b.match(/<img src="([^"]+)"/)[1]
    assert.ok(existsSync(new URL(`../public${f}`, import.meta.url)), f)
    assert.match(c.b, /alt="แบบเสื้อ[^"]+ งานพิมพ์ลาย/)
  }
  /* กล่องดูรูปเปิดโหมดสว่างให้แบบที่ไม่มีรหัสด้วย */
  assert.match(readFileSync(new URL('../src/js/lightbox.js', import.meta.url), 'utf8'), /dlg\.classList\.toggle\('lb--design', !!code \|\| el\.dataset\.design === '1'\)/)
})
