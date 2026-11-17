/* 16 พ.ย. 2026 อาร์ต (ภาพหน้า /embroidery/):
   - "รายละเอียดที่เลือกได้" → "ทำเป็นเสื้อของเราหน้าหลัง และชี้ไปยังจุดต่างๆ ทำให้กดรูปแต่ละออปชันมีป๊อปอัปขึ้นมาได้ และไม่ต้องให้กดเลือกแล้ว"
   - กล่อง "ยังไม่แน่ใจ ให้ทีมดีช่วยเลือกได้" → "ทำมาดีๆหน่อย" (ไม่มี "ล้างที่เลือก" แล้ว เพราะไม่มีการเลือก)
   - "ตำแหน่งปักและขนาด" → "เอาเป็นตัวเสื้อหน้าหลัง และเอาแบบมีเส้นแล้วชี้ไปในแต่ละจุดมาพอ"
   ภาพเสื้อ TEAMDEE ดำแต่งส้ม หน้า+หลัง ไม่มีจุด (Magnific 16 พ.ย.) → public/img/emb-guide/shirt-fb-* · เส้นวาดด้วย src/js/shirt-callouts.js */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { calloutPath, placeLabels } from '../src/js/shirt-callouts.js'

const built = new URL('../wp-theme/teamdee/build/pages/embroidery.body.html', import.meta.url)
const page = () => readFileSync(built, 'utf8')
const pub = (p) => existsSync(new URL(`../public${p}`, import.meta.url))
const txt = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
const between = (s, a, b) => { const i = s.indexOf(a); return i < 0 ? '' : s.slice(i, s.indexOf(b, i)) }

/* 16 พ.ย. 2026 อาร์ต "แปลกๆ ไม่สวยเลย" (ผังรายละเอียดเสื้อ: เส้นเฉียงยาวตัดตัวเสื้อ ป้ายกระจายไม่ตรงจุด)
   → ป้ายวางระดับเดียวกับจุดที่ชี้ · เส้นวิ่งแนวนอนที่ระดับป้าย แล้วหักมุม 45° เข้าจุด
   (หักใกล้จุด ไม่ใช่ใกล้ป้าย: จุด 01 อกซ้าย กับ 02 อกขวา อยู่ระดับเดียวกัน ถ้าวิ่งแนวนอนที่ระดับจุด เส้น 01 จะทับจุด 02) */
test('เส้นชี้: ระดับเดียวกัน = เส้นตรงแนวนอน', () => {
  assert.equal(calloutPath({ x: 100, y: 50 }, { x: 300, y: 50 }, 'l'), 'M100 50 H300')
})
test('เส้นชี้: ต่างระดับ = แนวนอนที่ระดับป้าย แล้วหักมุม 45° เข้าจุด', () => {
  assert.equal(calloutPath({ x: 100, y: 50 }, { x: 300, y: 120 }, 'l'), 'M100 50 H230 L300 120')
  assert.equal(calloutPath({ x: 900, y: 80 }, { x: 700, y: 60 }, 'r'), 'M900 80 H720 L700 60')
})
test('เส้นชี้: จุดใกล้ป้ายมาก มุมเฉียงไม่เลยจุด', () => {
  assert.equal(calloutPath({ x: 100, y: 0 }, { x: 140, y: 100 }, 'l'), 'M100 0 H116 L140 100')
})

test('วางป้าย: ไม่ชนกัน = อยู่ตรงระดับจุด', () => {
  assert.deepEqual(placeLabels([{ y: 50, h: 40 }, { y: 200, h: 40 }], { gap: 12, max: 400 }), [50, 200])
})
test('วางป้าย: ชนกัน = เรียงห่างเท่ากัน กลุ่มอยู่กลางจุดเฉลี่ย ลำดับตามจุด', () => {
  assert.deepEqual(placeLabels([{ y: 115, h: 40 }, { y: 100, h: 40 }, { y: 110, h: 40 }], { gap: 12, max: 400 }).map(Math.round), [160, 56, 108])
})
test('วางป้าย: ไม่ล้นขอบบน-ล่าง', () => {
  assert.deepEqual(placeLabels([{ y: 5, h: 40 }], { gap: 12, max: 400 }), [20])
  assert.deepEqual(placeLabels([{ y: 395, h: 40 }], { gap: 12, max: 400 }), [380])
})

test('ผังเสื้อ: พื้นกล่องสีเดียวกับพื้นภาพเสื้อ (#F0ECE8 วัดจาก webp ในเบราว์เซอร์) ไม่เป็นกล่องเทาซ้อนในกล่องขาว · ป้ายบนคอมไม่มีกรอบ', () => {
  const css = (readFileSync(new URL('../src/styles/pp-base.css', import.meta.url), 'utf8') + readFileSync(new URL('../src/styles/product-page.css', import.meta.url), 'utf8'))
  assert.match(css, /\.sc \{[^}]*background: #F0ECE8/)
  assert.match(css, /\.sc\.is-placed \.sc__lab \{[^}]*border: 0/)
})

test('ภาพเสื้อหน้า-หลังมีครบทุกขนาด', () => {
  for (const w of [640, 1000, 1600]) assert.ok(pub(`/img/emb-guide/shirt-fb-${w}.webp`), w)
})

const sc = (h, id) => between(h, `<div class="sc" data-sc id="${id}"`, '<svg class="sc__lines"')
test('ตำแหน่งปัก: เสื้อหน้า-หลัง + เส้นชี้ 5 จุด (ชื่อ ขนาด รูปงานปัก กดดูใหญ่ได้) · งานปักพิเศษยังอยู่', { skip: !existsSync(built) }, () => {
  const h = page()
  const s = sc(h, 'emb-pos')
  assert.ok(s, 'มีผังตำแหน่งปัก')
  assert.match(s, /\/img\/emb-guide\/shirt-fb-1000\.webp/)
  const items = [...s.matchAll(/<li class="sc__item" data-x="([\d.]+)" data-y="([\d.]+)">([\s\S]*?)<\/li>/g)]
  assert.equal(items.length, 5)
  /* ป้าย = เลข | ชื่อ | ขนาด (แท็กคั่นเป็นช่องว่าง · ปลั๊กอินตัดบรรทัดไทยห่อคำด้วยแท็ก) */
  const t = items.map((m) => m[3].replace(/<img[^>]*>/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ · /g, ' · ').trim())
  ;['01 อกซ้าย · ข้อความ กว้างไม่เกิน 6–6.5 ซม.', '02 อกขวา · โลโก้ กว้างไม่เกิน 6–6.5 ซม.', '03 แขนซ้าย / แขนขวา กว้างไม่เกิน 7 ซม.', '04 ด้านหลัง ใต้คอ กว้างไม่เกิน 10 ซม.', '05 กลางหลัง กว้างไม่เกิน 15 ซม.']
    .forEach((want) => assert.ok(t.some((x) => x.trim() === want), want))
  for (const [, , , li] of items) assert.match(li, /<img class="sc__thumb" src="[^"]*\/img\/emb-guide\/pos-[1-5]\.webp"/)
  assert.equal((s.match(/class="sc__dot"/g) || []).length, 5)
  assert.match(txt(between(h, 'class="ps2__special"', '</div>')), /งานปักพิเศษ[\s\S]*ส่งแบบให้ประเมิน/)
  assert.doesNotMatch(h, /emb-guide\/pos-map\.webp/, 'ผังเก่าที่มีจุดในภาพเลิกใช้')
})

test('รายละเอียดเสื้อ: เสื้อหน้า-หลัง + เส้นชี้ 5 จุด ลิงก์ไปแถวแบบ · ทุกแบบกดดูรูปใหญ่ · ไม่มีการเลือกแล้ว', { skip: !existsSync(built) }, () => {
  const h = page()
  const s = sc(h, 'emb-parts')
  const items = [...s.matchAll(/<li class="sc__item" data-x="[\d.]+" data-y="[\d.]+"><a class="sc__lab" href="#grp-([a-z]+)">([\s\S]*?)<\/a><\/li>/g)]
  assert.deepEqual(items.map((m) => m[1]).sort(), ['col', 'cut', 'pkt', 'plk', 'slv'])
  const o = between(h, 'id="polo-details"', '</section>\n')
  assert.equal((o.match(/class="ps2__pi"/g) || []).length, 28)
  for (const k of ['col', 'plk', 'slv', 'pkt', 'cut']) assert.match(o, new RegExp(`<ul class="ps2__pr" id="ps2-grp-${k}">`), k)
  assert.doesNotMatch(o, /data-polo-option|data-polo-options|aria-pressed|ps2__choice|ล้างที่เลือก/, 'ไม่มีการเลือก')
  const js = readFileSync(new URL('../src/js/product-page.js', import.meta.url), 'utf8')
  assert.match(js, /initLightbox\(`#ps2-grp-\$\{k\}`, 'li'/)
  assert.match(js, /initLightbox\('#emb-pos', '\.sc__item'/)
  assert.match(js, /initShirtCallouts\(\)/)
})

test('กล่องช่วยเลือก: หัวข้อ + คำอธิบาย + ปุ่ม LINE สีเขียวชุดเดียวกับทั้งเว็บ · ไม่มีล้างที่เลือก', { skip: !existsSync(built) }, () => {
  const box = between(page(), '<div class="ps2__help">', '</div>\n    </div>')
  assert.ok(box, 'มีกล่อง')
  assert.match(txt(box), /ยังไม่แน่ใจ ให้ทีมดีช่วยเลือก/)
  assert.match(box, /<a class="cb cb--p ps2__help-cta" href="https:\/\/line\.me\/R\/oaMessage\/[^"]+" data-track="line" data-where="pp-options">/)
  assert.doesNotMatch(txt(box), /ภาพจำลอง/) /* 16 พ.ย. 2026 อาร์ต "ไม่เอาป้ายภาพจำลอง" → "เอาออกทั้งหมด": ไม่มีป้ายภาพจำลอง/ภาพประกอบ (tests/no-image-labels.test.js) */
  assert.doesNotMatch(box, /ล้างที่เลือก|data-polo/)
})

/* 16 พ.ย. 2026 รอบ 3 อาร์ต (ภาพผังตำแหน่งปัก) "ทำมาดีๆ กว้างพิเศษได้ เอารูปใหญ่ๆมาได้เลย"
   → ส่วนแบบเสื้อมาตรฐานทั้งส่วนใช้ความกว้างพิเศษ (100% − 64 สูงสุด 1400 · memory site-widths)
   → ภาพเสื้อตัดพื้นออก (โปร่งใส) + ครอปชิดตัวเสื้อ = เสื้อใหญ่ขึ้น ไม่มีกรอบสี่เหลี่ยมจางๆ รอบภาพ
   → รูปงานปักบนป้ายเป็นแนวนอนเต็มภาพ (ภาพต้นฉบับ 334×207) ไม่ครอปจน "TEAMDEE" ขาด */
test('ส่วนแบบเสื้อมาตรฐาน (.ps2) ใช้ความกว้างพิเศษ 1400 ค่าเดียวกับส่วนกว้างอื่น', () => {
  const css = (readFileSync(new URL('../src/styles/pp-base.css', import.meta.url), 'utf8') + readFileSync(new URL('../src/styles/product-page.css', import.meta.url), 'utf8'))
  assert.match(css, /@media \(min-width: 768px\) \{ \.ps2 > \.wrap \{ width: calc\(100% - 64px\); max-width: 1400px; padding-inline: 0; \} \}/)
})
test('ภาพเสื้อหน้า-หลัง: พื้นโปร่งใส (webp มีช่อง alpha) ทุกขนาด', () => {
  for (const w of [640, 1000, 1600]) {
    const b = readFileSync(new URL(`../public/img/emb-guide/shirt-fb-${w}.webp`, import.meta.url))
    assert.equal(b.toString('ascii', 12, 16), 'VP8X', `${w}: webp แบบขยาย`)
    assert.ok(b[20] & 0x10, `${w}: มี alpha`)
  }
})
test('ผังเสื้อ: ขนาดภาพตามไฟล์ใหม่ (1000×596) · รูปงานปักแนวนอน 104×64 · ไม่มี mask ขอบภาพแล้ว', { skip: !existsSync(built) }, () => {
  const s = sc(page(), 'emb-pos')
  assert.match(s, /src="[^"]*\/img\/emb-guide\/shirt-fb-1000\.webp"[^>]*width="1000" height="596"/)
  assert.match(s, /<img class="sc__thumb" [^>]*width="104" height="64"/)
  const css = (readFileSync(new URL('../src/styles/pp-base.css', import.meta.url), 'utf8') + readFileSync(new URL('../src/styles/product-page.css', import.meta.url), 'utf8'))
  assert.doesNotMatch(css, /\.sc__fig img \{[^}]*mask-image/)
})
