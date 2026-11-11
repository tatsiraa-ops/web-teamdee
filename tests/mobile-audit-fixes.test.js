/* ตรวจมือถือทุกหน้า 30 ต.ค. 2026 (รอบ 45 · อาร์ต "แก้ทั้งหมดเลย") · กันของที่แก้แล้วกลับมา */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')
const main = read('src/styles/main.css')
/* CSS เฉพาะหน้าแบบเสื้อ/รีวิว ย้ายออกจาก main.css (30 ต.ค. รอบ 48) */
const designs = read('src/styles/page-designs.css')

/* พื้นดำหน้าโปโลปัก (.v3-dark) ถูกลบ 2 พ.ย. (กลับแม่แบบ v22) → กันไม่ให้ส่วนพื้นดำกลับมาโดยไม่มีกติกาสีลิงก์ */
test('HIGH: หน้าสินค้าไม่มีส่วนพื้นดำแล้ว · ลิงก์ .pp-more ไม่มีทางดำบนดำ', () => {
  assert.doesNotMatch(read('src/styles/product-page.css'), /v3-dark/)
  assert.doesNotMatch(read('src/partials/productPage.hbs'), /v3-dark/)
})

test('HIGH: คำนำหน้าแบบเสื้อไม่ถูกตัด 2 บรรทัดโดยกดอ่านต่อไม่ได้', () => {
  const rule = designs.match(/\.dg-hero__p \{[^}]*\}/g).join('\n')
  assert.doesNotMatch(rule, /line-clamp/)
})

test('หัวเว็บมือถือ 64px ทุกหน้า (ไม่ผูกหน้าแรก)', () => {
  assert.match(main, /\[data-header\] > \.wrap-full \{ min-height: 64px; \}/)
  assert.doesNotMatch(read('src/styles/home.css'), /\.page-home,\.td-page-home\) \[data-header\] > \.wrap-full/)
})

test('จุดกดที่เคยต่ำกว่า 44px', () => {
  for (const [sel, css] of [['.fq-pop__list a', main], ['.fq-act', main], ['.dcard__pick', designs]]) {
    const rule = css.slice(css.indexOf(`${sel} {`), css.indexOf('}', css.indexOf(`${sel} {`)))
    assert.match(rule, /min-height: 44px/, sel)
  }
  assert.match(read('src/styles/blog.css'), /\.mz-archives a \{[^}]*min-height: 44px/)
  assert.match(main, /\.ft__bottom a, \.ft__bottom button, \.ft__dl \.ft__map \{ min-height: 44px; \}/)
  assert.match(read('src/partials/ppOptions.hbs'), /<a class="pp-more" href="\{\{url 'contact'\}\}\?from=collar-options">/)
})

test('ตัวหนังสือ ≥13px และช่องเลือก 16px (iPhone ไม่ซูมเอง)', () => {
  assert.match(read('src/styles/blog.css'), /\.mz-archives b \{ font-size: 13px;/)
  assert.doesNotMatch(main + read('src/styles/page-project.css'), /\.pj-stats dt \{ font-size: 12px/)
  assert.match(read('src/styles/guide-material-lab.css'), /@media\(max-width:600px\)\{\.g-lab__select select\{font-size:16px\}\}\s*$/)
})

test('หัวข้อฟอร์มติดต่อไม่ข้ามระดับ · คำนำคู่มือไม่ห่อวลีแบบหัวข้อ · คำว่า "รหัส TD-" ไม่ห้อย', () => {
  const contact = read('site/contact-us/index.html')
  assert.match(contact, /<h2 class="cf-errs__h">/)
  assert.match(contact, /<h3 class="cf-fail__h">/)
  assert.match(read('src/partials/guidePage.hbs'), /<p class="td-guide__lead">\{\{item\.lead\}\}<\/p>/)
  assert.doesNotMatch(read('site/designs/index.html'), /รหัส TD-<\/span>/)
})

/* ตรวจหน้าแรก 4 พ.ย. (P0 · อาร์ต "แก้ 0"): แถวกลุ่มลูกค้าเป็น grid item min-width:auto ยืดตามรางเลื่อน → หน้ากว้าง 640 ที่จอ 390 แถบติดต่อล่างจอหลุดจอ */
test('P0: แถวกลุ่มลูกค้าไม่ดันหน้ากว้างเกินจอ (min-width:0)', () => {
  assert.match(read('src/styles/home.css'), /\.hm-uses-rows > li \{ min-width: 0; \}/)
})

/* WP export ใส่ td-page-home ที่ body ไม่ใช่ page-home → กฎกันล้นต้องผ่าน :is() ไม่งั้นไม่ทำงานบน WP */
test('P0: การ์ดดูแลหลังขายกันล้นจอ ทำงานบน WP ด้วย', () => {
  assert.match(read('src/styles/home.css'), /:is\(\.page-home,\.td-page-home\) #main \.hm-care__grid \{ grid-template-columns: minmax\(0, 1fr\); \}/)
})

test('P0: ปุ่มกรองรีวิวแถวเดียวบนมือถือเลื่อนข้างได้ ไม่ดันหน้ากว้าง', () => {
  assert.match(read('src/styles/home.css'), /@media \(max-width: 767px\) \{ \.hm-rvb__chips \{ overflow-x: auto;/)
})

test('P0: ปุ่มขอข้อมูลบริษัท (#story) จอ 320 ตัดบรรทัดได้ ไม่ดันหน้ากว้าง', () => {
  assert.match(read('src/styles/home.css'), /@media \(max-width: 379px\) \{ \.hm-origin__docbtn \{ max-width: 100%; white-space: normal;/)
})

/* ตรวจหน้าแรก 4 พ.ย. P1: จุดขาย 8 ช่องมือถือช่องละ ~88px · วลี <t-nw> ห้ามตัด → "เอกสารจัดซื้อครบ" ทับช่องข้าง */
test('P1: ชื่อจุดขายมือถือตัดบรรทัดในช่องได้ ไม่ทับช่องข้าง', () => {
  assert.match(read('src/styles/home.css'), /\.hm-benefits--icons \.hm-benefits__h t-nw \{ white-space: normal; \}/)
})

/* ตรวจหน้าแรก 4 พ.ย. P1: ส้ม #F05A00 บนพื้นการ์ดคู่ขอราคา (#f0edea / #fbede2) = 2.92–2.97:1 ไม่ถึง 3:1 → #E05000 (≥3.20 ทุกพื้น) */
test('P1: คำส้มในหัวข้อการ์ดคู่ขอราคา contrast ≥ 3:1', () => {
  assert.match(read('src/styles/home.css'), /\.hm-talk__card :is\(h2, h3\) \.hm-hl \{ color: #E05000; \}/)
})

/* ตรวจหน้าแรก 4 พ.ย. P2: เลขข้อในส่วนช่วยเลือก ตัว 15px บนพื้น #f3f1ee · #c24b00 = 4.33:1 ไม่ถึง 4.5 → #b84600 (4.76) */
test('P2: เลขข้อ .hm-help__no contrast ≥ 4.5:1', () => {
  assert.match(read('src/styles/home.css'), /#process\.hm-help \.hm-help__no \{[^}]*color: #b84600;/)
})

/* ตรวจหน้าแรก 4 พ.ย. P3: easing เด้งเลยเป้า (.34,1.56,.64,1) ดูเป็นของเล่น → ease-out ไม่เลยเป้า (.16,1,.3,1) ทั้งเว็บ */
test('P3: ไม่มี easing แบบเด้งใน CSS', () => {
  for (const f of ['main.css', 'home.css', 'page-project.css']) assert.doesNotMatch(read(`src/styles/${f}`), /cubic-bezier\(\.34, ?1\.56, ?\.64, ?1\)/, f)
})

/* P3: เลขข้อในหัวข้อช่วยเลือก (ol ให้ลำดับอยู่แล้ว) · โปรแกรมอ่านจอเคยอ่าน "1ช่วยคิด" ติดกัน */
test('P3: เลขข้อ .hm-help__no ซ่อนจากโปรแกรมอ่านจอ', () => {
  const p = read('src/partials/homeReference-process.hbs')
  assert.equal((p.match(/<span class="hm-help__no">/g) || []).length, 0)
  assert.equal((p.match(/<span class="hm-help__no" aria-hidden="true">/g) || []).length, 3)
})

/* 4 พ.ย. (อาร์ต "ฟอนต์มือถือใหญ่ไป แก้เต็มที่"): WP ใส่ body.td-page-home ไม่ใช่ page-home → กฎ ".page-home …" เฉยๆ (มือถือ 87 กฎ) ไม่ทำงานบน WP
   ต้องผ่าน :is(.page-home,body.td-page-home) · body. กันไม่ให้ไปโดน div.td-page-home ที่หน้าการใช้งานใช้ครอบ component */
test('กฎหน้าแรกไม่ผูก .page-home อย่างเดียว (ทำงานบน WP ด้วย)', () => {
  for (const f of ['home.css', 'main.css']) {
    const css = read(`src/styles/${f}`).replace(/\/\*[\s\S]*?\*\//g, '')
    const bare = css.match(/(?<!\()\.page-home(?![-\w])/g) || []
    assert.equal(bare.length, 0, f)
  }
})

/* 4 พ.ย. ไล่หน้าแรกมือถือ 390 ทีละส่วน (อาร์ต "ฟอนต์มือถือใหญ่ไป แก้เต็มที่") · ชุดเดียวท้าย home.css */
test('มือถือหน้าแรก: หัว FAQ กลาง · ข้อความการ์ดบริการไม่ถูกตัด', () => {
  const css = read('src/styles/home.css')
  const block = css.slice(css.indexOf('/* มือถือหน้าแรก 4 พ.ย.'))
  assert.match(block, /#faq \.hm-faq__head \{ align-items: center;/)
  assert.match(block, /\.hm-cats--hero-cards \.hm-cat__tag \{ white-space: normal;/)
})

/* 4 พ.ย. อาร์ต "ทำ h2 ให้เท่ากันด้วย": เดสก์ท็อปเดิม 32 / 41.8 / 44 / 44.6 / 46 / 56 → ค่าเดียว 44px 800 ทุกส่วน (มือถือคง 24 จากกฎมือถือ) */
test('H2 หน้าแรกเดสก์ท็อปขนาดเดียวกันทุกส่วน', () => {
  const css = read('src/styles/home.css')
  const block = css.slice(css.indexOf('/* H2 หน้าแรกขนาดเดียว 4 พ.ย.'))
  assert.match(block, /@media \(min-width: 768px\) \{\s*:is\(\.page-home,body\.td-page-home\) #main section:not\(\.th\) h2 \{ font-size: clamp\(30px, 3\.06vw, 44px\); font-weight: 800; line-height: 1\.35; \}/)
  assert.match(block, /\.hm-talk__card h2 \{ padding-right: 0; \}/)
})

/* 4 พ.ย. ตรวจ H2 ที่ 1024/768: การ์ดดูแลหลังขาย 1fr 1fr ยืดตามเนื้อใน → หน้ากว้าง 1077 / 977 · ต้อง minmax(0,1fr) ทุกขนาดจอ */
test('การ์ดดูแลหลังขายใช้คอลัมน์ minmax(0, 1fr) ไม่ดันหน้ากว้าง', () => {
  assert.match(read('src/styles/home.css'), /\.hm-care__grid \{ display:grid; grid-template-columns:repeat\(2, minmax\(0, 1fr\)\); gap:24px; \}/)
})

/* ตรวจหน้าแรกรอบ 2 (4 พ.ย.): home-mobile.js หา .hm-brand-story__lead ที่ถูกรื้อไปแล้ว → null.nextSibling พังทุกครั้งบนมือถือ
   ฟังก์ชันหยุดกลางทาง: ปุ่มเลื่อนราง (บริการ/ผลงาน) ไม่ถูกใส่ · ไม่ฟังการหมุนจอ · กันซ้ำ: querySelector ที่ใช้ต่อทันที (ไม่มี ?.) ต้องมีในหน้าแรก */
test('home-mobile.js ไม่เรียกของที่ไม่มีในหน้าแรกโดยไม่เช็ค null', () => {
  const src = read('src/js/home-mobile.js')
  const html = read('dist-wp/index.html')
  const last = (sel) => sel.match(/[.#]([\w-]+)\]?\s*$/)?.[1] || sel.match(/\[([\w-]+)\]\s*$/)?.[1]
  /* ตัวแม่ (const x = document.querySelector('…')) ไม่มีในหน้า = โค้ดส่วนนั้นอยู่ใน if (x) ไม่ได้รัน */
  const parents = Object.fromEntries([...src.matchAll(/const (\w+) = document\.querySelector\('([^']+)'\)/g)].map((m) => [m[1], m[2]]))
  for (const [, owner, sel] of src.matchAll(/(\w+)\.querySelector\('([^']+)'\)(?!\?)\.\w+/g)) {
    if (parents[owner] && !html.includes(last(parents[owner]))) continue
    if (!sel.startsWith('.')) continue
    assert.ok(html.includes(last(sel)), `${owner}.querySelector('${sel}') ไม่มีในหน้าแรก`)
  }
})

/* 4 พ.ย. อาร์ต "uiux ปรับให้เข้ากับมือถือหน่อย ตอนนี้มันแปลกๆ" (ภาพการ์ดคู่): กฎ CTA เก่า :is(#cta-discover, #cta-quote) จัดกลาง
   แต่ id ย้ายมาอยู่บนการ์ดคู่แล้ว → การ์ดกลางบ้างซ้ายบ้าง · ลบกฎค้าง · มือถือชิดซ้ายทั้งการ์ด ไอคอนในมุมการ์ด */
test('การ์ดคู่มือถือ: ไม่มีกฎ CTA เก่าจัดกลาง · ชิดซ้ายทั้งการ์ด ไอคอนในการ์ด', () => {
  const css = read('src/styles/home.css')
  assert.doesNotMatch(css, /:is\(#cta-discover, #cta-quote\)/)
  assert.doesNotMatch(css, /#cta-discover \.row/)
  const block = css.slice(css.indexOf('/* การ์ดคู่มือถือ 4 พ.ย.'))
  assert.match(block, /\.hm-talk__card \{ padding: 24px 22px 22px; text-align: left; \}/)
  assert.match(block, /\.hm-talk__pop \{ width: 84px; height: 84px; top: 14px; right: 12px; \}/)
  assert.match(block, /\.hm-talk__or \{ position: relative; top: auto;/)
})

/* 4 พ.ย. hero มือถือ (อาร์ตส่งภาพ hero มือถือ + "ปรับให้เข้ากับมือถือ"): ภาพ 2.88:1 สูง ~140px คนตัวเล็ก ข้อความชิดซ้ายในพื้นเทา
   → ภาพ 4:3 โฟกัสคน ข้อความกลางเหมือนส่วนอื่น ปุ่มกว้าง · ป้ายสไลด์กีฬาเป็น h2 โดนกฎมือถือ h2 24px → ล็อก 14px เท่าสไลด์แรก */
test('hero มือถือ: ภาพแนวตั้ง 3:4 ข้อความกลาง ป้ายสองสไลด์เท่ากัน', () => {
  const css = read('src/styles/home.css')
  const block = css.slice(css.indexOf('/* hero มือถือ 4 พ.ย.'))
  assert.match(block, /\.th-slide__img \{ aspect-ratio: 3 \/ 4; object-fit: cover; object-position: center top; \}/)
  assert.match(block, /\.th-copy-o \{ position: relative; z-index: 2; top: auto; left: auto; margin-top: -88px; text-align: center;/)
  assert.match(block, /#main \.th h2\.th-o__kick \{ font-size: 14px;/)
})

/* 4 พ.ย. ส่วนดูแลงานมือถือ: ป้าย "ดูแลงานครบ 3 ขั้น" ชิดซ้ายใต้หัวข้อกลาง · ลิงก์เช็กลิสต์ + หมายเหตุชิดซ้ายใต้ปุ่มกลาง → หัว/ท้ายส่วนกลางชุดเดียว การ์ด 3 ขั้นคงชิดซ้าย */
test('ส่วนดูแลงานมือถือ: ป้าย ลิงก์ หมายเหตุ อยู่กลางเหมือนหัวข้อ', () => {
  const css = read('src/styles/home.css')
  const block = css.slice(css.indexOf('/* ส่วนดูแลงานมือถือ 4 พ.ย.'))
  assert.match(block, /#process\.hm-help \.hm-help__kick \{ display: flex; width: fit-content; margin-inline: auto; \}/)
  assert.match(block, /#process\.hm-help \.hm-help__note \{ text-align: center; \}/)
})

/* ตรวจรอบ 2 (4 พ.ย.): คำส้ม "ลูกค้าพึ่งพาได้" ในหัวข้อไทม์ไลน์ 18.5px ตัวหนา ต่ำกว่าเกณฑ์ตัวใหญ่ 18.67px → ต้อง 4.5:1 แต่ส้มบนขาว 3.4 · หัวข้อ 19px = ตัวใหญ่ ผ่าน 3:1 */
test('หัวข้อไทม์ไลน์ #story ≥ 18.67px ตัวหนา (คำส้มนับเป็นตัวใหญ่)', () => {
  assert.match(read('src/styles/home.css'), /\.hm-origin \.hm-origin__copy \.hm-tl h3, \.hm-tl h3 \{ margin: 0 0 4px; font-size: 19px; font-weight: 800;/)
})

/* ตรวจหน้าแรกมือถือเข้ม 4 พ.ย. → อาร์ต "แก้ทั้งหมดเลย" (docs/audit/2026-11-04-home-mobile-audit.md) · ชุดเดียวท้าย home.css */
test('ตรวจมือถือเข้ม: แก้ครบทุกข้อในชุดเดียว', () => {
  const css = read('src/styles/home.css')
  const b = css.slice(css.indexOf('/* ตรวจมือถือเข้ม 4 พ.ย.'))
  assert.ok(b.length > 100, 'ไม่มีชุด')
  assert.match(b, /\.th-o__accent \{ color: #E05000; \}/) // 1 ส้ม hero ≥ 3:1 บน #efece8
  assert.match(b, /\.th-slide__img \{ max-height: max\(300px, calc\(100svh - 330px\)\);/) // 2 จอเตี้ย
  assert.match(b, /#real-work \.hm-show__line5 \{ grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 62%;/) // 3 ราง
  assert.match(b, /:is\(\.hm-talk__alt, \.hm-show__rhead \.hm-show__links a\) \{ min-height: 44px;/) // 4 จุดกด
  assert.match(b, /\.hm-visit h3\.hm-visit__h \{ font-size: 19px;/) // 5 (ต้องชนะกฎ h3 มือถือ 18px ระดับ id)
  assert.match(b, /\.hm-visit__actions > a \{ width: 100%;/) // 6
  assert.doesNotMatch(b, /\.hm-dz__card:nth-last-child\(1 of :not\(\[hidden\]\)\)/) // 7 (9 พ.ย. ตัวกรองโชว์เต็มแถวเอง · กฎซ่อนเดิมทำให้ 6 ใบเหลือ 5)
  assert.match(readFileSync(new URL('../src/js/home-picker.js', import.meta.url), 'utf8'), /const show = n >= cols \? n - \(n % cols\) : n/)
  assert.match(b, /\.hm-rvb__pop \{ width: 84px; height: 84px;/) // 8 (ไอคอนการ์ดดูแลหลังขายย้ายไปชุดการ์ดดูแลหลังขายมือถือ)
})

/* จอเตี้ย (≤ 800 เช่น iPhone SE 667): ภาพถูกจำกัดสูงแล้วข้อความซ้อน -88 ไปทับลำตัว/เสื้อ อ่านยาก → ซ้อนแค่ -24 ภาพจางเร็วขึ้น สูงไม่เกินจอ − 380 */
test('hero จอเตี้ย: ข้อความไม่ทับคนในภาพ', () => {
  const css = read('src/styles/home.css')
  assert.match(css, /@media \(max-width: 767px\) and \(max-height: 800px\) \{\s*\.th-slide__img \{ max-height: max\(260px, calc\(100svh - 380px\)\);[^}]*mask-image: linear-gradient\(#000 62%, transparent\); \}\s*\.th-copy-o \{ margin-top: -24px; \}/)
})

/* 4 พ.ย. อาร์ต (ภาพการ์ด 7 วัน / 30 วัน มือถือ) "ทำตรงนี้มาดีๆ": ไอคอนล้นมุมการ์ด · ตัวเลข 76 คู่หัวข้อ (หัวข้อถูกบีบ 187px) · ช่องระหว่างการ์ด 96
   → ตัวเลข 56 + ไอคอน 72 ในการ์ดแถวเดียว · หัวข้อเต็มกว้างแถวถัดไป · ช่อง 14 · ตัวเล็กสุด 14 */
test('การ์ดดูแลหลังขายมือถือ: ไอคอนในการ์ด หัวข้อเต็มกว้าง ช่องแคบ', () => {
  const css = read('src/styles/home.css')
  const b = css.slice(css.indexOf('/* การ์ดดูแลหลังขายมือถือ 4 พ.ย.'))
  assert.ok(b.length > 50)
  assert.match(b, /#aftercare\.hm-care--pop \.hm-care__grid \{ margin-top: 24px; row-gap: 14px; \}/)
  assert.match(b, /#aftercare\.hm-care--pop \.hm-care__pop \{ top: 14px; right: 14px; width: 72px; height: 72px; \}/)
  assert.match(b, /#aftercare\.hm-care--pop \.hm-care__heading \{ display: block; padding-right: 0; \}/)
  assert.doesNotMatch(css, /\.hm-care__pop \{ width: 96px/)
})

/* 4 พ.ย. อาร์ตส่งภาพ (เรื่องราว · การ์ดเข้าพบ · บทความ) ต่อจาก "ทำตรงนี้มาดีๆ": มือถือ
   เรื่องราว ข้อความยาวก่อนเห็นภาพ → ภาพก่อนไทม์ไลน์ · การ์ดเข้าพบ ปุ่ม Maps ลอยทับภาพอาคาร → ตัดภาพ ปุ่มที่ 3 เต็มกว้าง
   บทความ 2 คอลัมน์แคบ หัวข้อ 3 บรรทัดตัดกลางคำ ("สั่งผลิ/ตล็อต") → รางเลื่อนการ์ด 80% */
test('มือถือ: เรื่องราวภาพก่อน · Maps เป็นปุ่ม · บทความเป็นราง', () => {
  const css = read('src/styles/home.css')
  const b = css.slice(css.indexOf('/* เรื่องราว เข้าพบ บทความ มือถือ 4 พ.ย.'))
  assert.ok(b.length > 50)
  assert.match(b, /#story \.hm-origin__hero \{ order: -1;/)
  assert.match(b, /\.hm-visit__art \{ display: none; \}/)
  assert.match(b, /\.hm-visit__maplink \{ position: static;[^}]*width: 100%;/)
  assert.match(b, /#home-stories \.hm-posts \{ grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 80%;/)
})

/* 4 พ.ย. อาร์ต "ไปตรวจสอบหน้าแรก desktop อันไหนยังห่างๆเกินทำให้กระชับ": ช่องระหว่างส่วน 92–169px (ส่วนละ 56/56 + จุดพิเศษ 80) → ส่วนละ 40/40 ทั้งหน้า */
test('หน้าแรกเดสก์ท็อป: ระยะส่วนกระชับชุดเดียว', () => {
  const css = read('src/styles/home.css')
  const b = css.slice(css.indexOf('/* หน้าแรกเดสก์ท็อปกระชับ 4 พ.ย.'))
  assert.ok(b.length > 50)
  assert.match(b, /@media \(min-width: 1024px\)/)
  assert.match(b, /main :is\(#uses, #process, #home-stories, #story, #faq, #reviews, #designs, #real-work, #services, #brand-expertise\) \{ padding-block: 40px; \}/)
  assert.match(b, /\.hm-stats-band \{ padding-bottom: 40px; \}/)
  assert.match(b, /#aftercare\.hm-care \{ padding-top: 40px; \}/)
  assert.match(b, /main \.hm-benefits-band \{ padding-top: 24px; padding-bottom: 8px; \}/) // กฎรวมต้องไม่ทับแถบจุดขาย
})

/* 4 พ.ย. อาร์ต "ไปดูระยะอะไรต่างๆให้หน่อย ทั้งหมดคอมและมือถือ": มือถือช่องระหว่างส่วน ~96 (ห่างกว่าคอม 80) · ตัวเลข→เลือกเสื้อ 24 · ป้ายเลือกกลุ่มแบบเสื้อติดคำอธิบาย 0px
   คอม ส่วนผลงานกว้าง 1376 ไม่เท่าบริการ/เลือกเสื้อ 1320 */
test('ระยะทั้งหน้า: มือถือส่วนละ 36 · ป้ายเลือกกลุ่มมีระยะ · คอมผลงานกว้างเท่าบริการ', () => {
  const css = read('src/styles/home.css')
  const b = css.slice(css.indexOf('/* ระยะทั้งหน้า 4 พ.ย.'))
  assert.ok(b.length > 50)
  assert.match(b, /@media \(max-width: 767px\) \{[\s\S]*main :is\(#uses, #process, #home-stories, #story, #faq, #reviews, #designs, #real-work, #services, #brand-expertise\) \{ padding-block: 36px; \}/)
  assert.match(b, /#designs \.hm-mobile-filter \{ margin: 20px 0 16px; text-align: left; justify-items: start; \}/) // ต้องชนะกฎเดิม #designs จัดกลาง
  assert.match(b, /#real-work\.hm-show\.wrap \{ width: calc\(100% - 120px\); max-width: 1320px; \}/)
})

/* 4 พ.ย. อาร์ต (ภาพส่วนดูแลงาน 3 ขั้น มือถือ) "ทำมาดีๆหน่อย": ภาพ 4:5 ทรงโค้งสูง 468px · แผ่นเบจด้านหลังเยื้องชนขอบจอ · ไอคอนขั้น 72px
   → ภาพ 16:10 มุมโค้งเท่ากัน ตัดแผ่นเยื้อง · การ์ดขั้นแน่นขึ้น ไอคอน 56 */
test('ส่วนดูแลงานมือถือ: ภาพเตี้ย ไม่มีแผ่นเยื้อง การ์ดขั้นแน่น', () => {
  const css = read('src/styles/home.css')
  const b = css.slice(css.indexOf('/* ส่วนดูแลงานมือถือ ภาพและการ์ดขั้น 4 พ.ย.'))
  assert.ok(b.length > 50)
  assert.match(b, /#process\.hm-help \.hm-help__photo \{ aspect-ratio: 16 \/ 10;[^}]*border-radius: 22px;/)
  assert.match(b, /#process\.hm-help \.hm-help__media::before \{ content: none; \}/)
  assert.match(b, /#process\.hm-help \.hm-help__step \{ grid-template-columns: 56px minmax\(0, 1fr\);/)
})

/* 4 พ.ย. อาร์ต (ภาพหัวแถวส่วนผลงานมือถือ) "ui cta แปลกๆ": ลิงก์ "ดูรายละเอียด…" ชิดขวาลอยบรรทัดเดียว · เส้นใต้ขาดสองท่อน (flex แยกลูกศร) · แถวพิเศษ 3 ลิงก์ลูกศรตัวเดียว
   → มือถือ ปุ่มแคปซูลขอบเทา ชิดซ้ายใต้ชื่อกลุ่ม ไม่มีเส้นใต้ ลูกศรส้ม · หลายลิงก์ตัดบรรทัดเป็นกลุ่ม */
test('หัวแถวผลงานมือถือ: ลิงก์เป็นปุ่มแคปซูลชิดซ้าย', () => {
  const css = read('src/styles/home.css')
  const b = css.slice(css.indexOf('/* หัวแถวผลงานมือถือ 4 พ.ย.'))
  assert.ok(b.length > 50)
  assert.match(b, /#real-work \.hm-show__rhead \.hm-show__links \{ display: flex; flex-wrap: wrap; justify-content: flex-start;/)
  assert.match(b, /#real-work \.hm-show__rhead \.hm-show__links a \{[^}]*border-radius: 999px;[^}]*text-decoration: none;/)
})

/* 4 พ.ย. อาร์ต (ภาพแบบเสื้อมือถือ) "แปลกๆแฮะ": ป้ายชื่อแคปซูลทับครึ่งล่างของรูปเสื้อ (บาส-วอลเลย์ 2 บรรทัดทับเยอะ) · ใบเดี่ยวท้ายขยายเต็มแถวหนักเกิน
   → การ์ดเล็กชื่ออยู่ใต้รูป ไม่ทับเสื้อ · ใบเดี่ยวท้ายซ่อนบนมือถือ (ดูทั้งหมดผ่านปุ่มใต้ตาราง) */
/* อาร์ตต่อ "แสดงมาแค่รูปพอ" (ชื่อใต้รูปบนจอที่ชี้เมาส์ได้ซ่อนรอ hover เหลือพื้นว่าง) → การ์ดเล็กแสดงรูปอย่างเดียว */
test('แบบเสื้อมือถือ: การ์ดเล็กแสดงแค่รูป', () => {
  const css = read('src/styles/home.css')
  const b = css.slice(css.indexOf('/* แบบเสื้อมือถือ การ์ดเล็ก 4 พ.ย.'))
  assert.ok(b.length > 50)
  assert.match(b, /#pickGrid > \.hm-dz__card:not\(\.is-feature\) \.hm-dz__cap \{ display: none; \}/)
})

/* 11 พ.ย. อาร์ต "ตัวหนังสือหาย" (/corporate/ #services จอ ~1100): บรรทัดรอง nowrap + การ์ดแคบ → ล้นการ์ดโดนตัด
   วัดจริง: 1440 การ์ด 427 ไม่ล้น · 1100 การ์ด 327 ล้น 18px · 900 การ์ด 260 ล้น 48px + ลิงก์ล้น 8px · เดิมแก้แค่ ≤767
   → ≤1279 บรรทัดรองตัดบรรทัดได้ · 768–1023 การ์ดเป็นแถบปัดแบบมือถือ (การ์ด 62%) */
test('การ์ดบริการ (หน้าแรก + /corporate/): ข้อความไม่ถูกตัดทุกขนาดจอ', () => {
  const css = read('src/styles/home.css')
  const block = css.slice(css.indexOf('/* การ์ดบริการไม่ตัดข้อความ 11 พ.ย.'))
  assert.ok(block.length > 100, 'มีชุดแก้')
  assert.match(block, /@media \(max-width: 1279px\) \{[^@]*\.hm-cats--hero-cards \.hm-cat__tag \{ white-space: normal;/)
  assert.match(block, /@media \(min-width: 768px\) and \(max-width: 1023px\) \{[^@]*\.hm-cats--hero-cards \{[^}]*grid-auto-flow: column;[^}]*grid-auto-columns: 62%;[^}]*overflow-x: auto;/)
})

/* 11 พ.ย. อาร์ต "ฟอนต์ headline ฝั่งซ้ายเอาเท่ากับฝั่งขวา" (การ์ดคู่ ยังไม่แน่ใจ / มีแบบแล้ว)
   ต้นเหตุ: ซ้ายเป็น h2 โดนกฎหัวข้อส่วนทั้งหน้า (44px) · ขวาเป็น h3 ขนาดการ์ด clamp(26–34) → หัวข้อในการ์ดทั้งคู่ใช้ขนาดการ์ด */
test('การ์ดคู่ชวนคุย: หัวข้อซ้าย (h2) ขนาดเท่าขวา (h3)', () => {
  const css = read('src/styles/home.css')
  const block = css.slice(css.indexOf('/* หัวข้อการ์ดคู่เท่ากัน 11 พ.ย.'))
  assert.ok(block.length > 50, 'มีชุดแก้')
  assert.ok(block.includes('body #main .hm-talk.hm-talk .hm-talk__card:is(section, div, article) :is(h2, h3) { font-size: clamp(26px, 2.3vw, 34px);'), 'เจาะจง (1,3,3) ชนะกฎหัวข้อส่วนทั้งหน้าแรกและหน้ากลุ่มลูกค้า')
})

/* 11 พ.ย. อาร์ต "ทำสองแถวเอายาวๆได้" (หัวข้อการ์ดซ้าย "ยังไม่แน่ใจว่าเสื้อแบบไหน / เหมาะกับทีม?")
   ต้นเหตุ 3 แถว: h2 เว้นขวา 150px ให้ภาพสมุด · วัดจริงข้อความ 344px · ไม่เว้น = 476px พอบรรทัดเดียว
   ≥1280 ไม่ทับภาพ → ไม่เว้น · 1024–1279 ภาพสมุดชิดหัวข้อ 20px → ไม่เว้น + ดันหัวข้อลง 22px · มือถือคงเดิม */
test('การ์ดคู่ชวนคุย: หัวข้อซ้าย 2 แถวยาวบนจอคอม ไม่ทับภาพสมุด', () => {
  const css = read('src/styles/home.css')
  const block = css.slice(css.indexOf('/* หัวข้อการ์ดซ้าย 2 แถว 11 พ.ย.'))
  assert.ok(block.length > 50, 'มีชุดแก้')
  assert.match(block, /@media \(min-width: 1024px\) \{[^@]*\.hm-talk__card:is\(section, div, article\) h2 \{ padding-right: 0; \}/)
  assert.doesNotMatch(block, /margin-top: 22px/, 'แถวแรกสั้นลง (ยังไม่แน่ใจว่า) ไม่ชนภาพสมุดแล้ว ไม่ต้องดันลง')
})
