/* partial โฉมใหม่หน้ากลุ่ม (up2*) ใช้ได้ทุกกลุ่ม · 11 พ.ย. 2026 อาร์ต "เริ่มหน้าร้านค้าได้เลย เอาหน้าบริษัทคือต้นแบบของหน้าประเภทลูกค้า"
   คำเฉพาะกลุ่ม (ท้ายหัวข้อสีส้ม · คำบรรยาย · ป้าย) อยู่ใน use-v2.json[<กลุ่ม>].copy ไม่ฝังใน partial */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const text = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

test('partial up2* ไม่มีคำของกลุ่มบริษัทฝังอยู่ (นอกคอมเมนต์)', () => {
  for (const f of readdirSync('src/partials').filter((x) => /^up2.*\.hbs$/.test(x))) {
    const src = readFileSync(`src/partials/${f}`, 'utf8').replace(/\{\{!--[\s\S]*?--\}\}/g, '')
    assert.doesNotMatch(src, /บริษัท|องค์กร/, f)
    assert.doesNotMatch(src, /\/corp-|corp\.(webp|jpg)/, `${f}: ไม่ฝังไฟล์ภาพของ corp`)
  }
  assert.doesNotMatch(readFileSync('src/partials/usePage.hbs', 'utf8'), /id="corp-review-wall"/, 'id คลังรีวิวตามกลุ่ม')
})

test('/corporate/ หัวข้อสีส้มเหมือนเดิมทุกส่วนหลังย้ายคำไปไว้ในข้อมูล', () => {
  const hl = [...main('corporate').matchAll(/<h2[^>]*>[\s\S]*?<span class="hm-hl">([\s\S]*?)<\/span><\/span>[\s\S]*?<\/h2>/g)].map((m) => text(m[1]))
  assert.deepEqual(hl, ['ไว้วางใจทีมดี', 'มากกว่าเลือกแบบ', 'แต่ละลักษณะธุรกิจ', 'งานของบริษัทคุณ?', 'เหมาะกับทีม?', 'คนใส่เสื้อบริษัท', 'ใส่เสื้อทีมดี', 'เสื้อบริษัทที่ผลิตจริง', /* 13 พ.ย. ส่วนตรวจตัวอย่าง-ตรวจก่อนแพ็ก-จัดส่ง (tests/use-check.test.js) */ 'ตรวจอีกรอบก่อนส่ง', 'จัดการง่ายขึ้น?', 'เสื้อบริษัท', 'นนทบุรี'])
  assert.match(main('corporate'), /id="corp-review-wall"/)
})

/* 11 พ.ย. hero โฉมใหม่จอ 768–1023 (แท็บเล็ต): แบนเนอร์ 2304:800 สูงแค่ ~280px ข้อความยาวกว่าภาพ → หัวข้อทับเส้นทางหน้า คำโปรยทับเสื้อลอย (เจอทั้ง /corporate/ และร้านค้า)
   → ช่วงนี้ภาพ 16:9 ครอปเข้าหาคนกับเสื้อ (ขวา) · เส้นทางหน้า + ข้อความอยู่ใต้ภาพ ไม่ลอยทับ */
test('hero โฉมใหม่จอแท็บเล็ต: ข้อความอยู่ใต้ภาพ ไม่ทับภาพ', () => {
  const css = readFileSync('src/styles/use-page.css', 'utf8')
  const m = css.match(/@media \(min-width: 768px\) and \(max-width: 1023px\) \{([\s\S]*?)\n\}/)
  assert.ok(m, 'มีกฎช่วง 768–1023')
  assert.match(m[1], /\.up2-hero__reel \{[^}]*aspect-ratio: auto/)
  assert.match(m[1], /\.up2-hero__img \{[^}]*aspect-ratio: 16 \/ 9[^}]*object-position: 8\d% /)
  assert.match(m[1], /\.up2-hero__copy \{[^}]*position: relative/)
  assert.match(m[1], /\.up2-hero__crumb \{[^}]*position: relative/)
})

test('hero หน้าสินค้าโฉมใหม่ (/sublimation/) จอแท็บเล็ต: ข้อความอยู่ใต้ภาพเหมือนหน้ากลุ่ม', () => {
  const css = readFileSync('src/styles/product-page.css', 'utf8')
  const m = css.match(/@media \(min-width: 768px\) and \(max-width: 1023px\) \{([\s\S]*?)\n\}/)
  assert.ok(m, 'มีกฎช่วง 768–1023')
  assert.match(m[1], /\.pp2-hero__reel \{[^}]*aspect-ratio: auto/)
  assert.match(m[1], /\.pp2-hero__img \{[^}]*aspect-ratio: 16 \/ 9/)
  assert.match(m[1], /\.pp2-hero__copy \{[^}]*position: relative[^}]*width: auto/)
})

/* 11 พ.ย. จอคอม 1024–1366: ข้อความ hero จัดกลางทั้งแบนเนอร์ → หัวข้อยาว (ร้านค้า 3 บรรทัด) ขึ้นไปทับเส้นทางหน้า (วัดได้ทับ 6–39px)
   → กล่องข้อความยืดเต็มความสูงแบนเนอร์ เว้นที่ด้านบนให้เส้นทางหน้า แล้วจัดกลางในพื้นที่ที่เหลือ (ทั้ง up2-hero และ pp2-hero) */
test('hero โฉมใหม่จอคอม: ข้อความจัดกลางใต้เส้นทางหน้า ไม่ขึ้นไปทับ', () => {
  for (const [f, p] of [['use-page.css', 'up2'], ['product-page.css', 'pp2']]) {
    const css = readFileSync(`src/styles/${f}`, 'utf8')
    const m = css.match(new RegExp(`@media \\(min-width: 1024px\\) \\{\\s*\\.${p}-hero__copy \\{([^}]*)\\}`))
    assert.ok(m, `${f}: กฎจอคอม`)
    assert.match(m[1], /top: 0/); assert.match(m[1], /bottom: 0/); assert.match(m[1], /translate: none/)
    assert.match(m[1], /justify-content: center/); assert.match(m[1], /padding-top: calc\(/)
  }
})

test('hero หน้ากลุ่มจอ 1024–1179: หัวข้อย่อลงให้หัวข้อยาว (ร้านค้า) พอดีแบนเนอร์', () => {
  const css = readFileSync('src/styles/use-page.css', 'utf8')
  assert.match(css, /@media \(min-width: 1024px\) and \(max-width: 1179px\) \{\s*\.up2-hero \.th-o__h \{ font-size: 2\.\d+vw; \}/)
})

/* 11 พ.ย. อาร์ตแคปแถบแท็บร้านค้า: 3 แท็บชิดซ้าย เหลือที่ว่างครึ่งแถว → การ์ดกว้างเท่าหน้าบริษัท (1/6 แถว) จัดกลางตามหัวข้อ · จำนวนแท็บมาจากข้อมูล */
test('แถบแท็บบริบท: จำนวนคอลัมน์ตามจำนวนแท็บ การ์ดกว้างเท่ากันทุกหน้า จัดกลาง', () => {
  const css = readFileSync('src/styles/use-page.css', 'utf8')
  assert.match(css, /\.up2-ctx__shelf \{[^}]*grid-template-columns: repeat\(var\(--n, 6\), minmax\(0, calc\(\(100% - 70px\) \/ 6\)\)\)[^}]*justify-content: center/)
  /* 13 พ.ย. ร้านค้ามี 4 แท็บ (เพิ่มร้านสัตว์เลี้ยง) · หน่วยงาน 6 แท็บ (เพิ่มรัฐวิสาหกิจ กองทัพ ชุมชน) · โรงเรียน 4 แท็บ (เพิ่มเสื้อรุ่น ม.6) */
  for (const [f, n] of [['corporate', 6], ['custom-staff-shirts', 4], ['custom-organization-shirts', 6], ['education', 4], ['custom-university-shirts', 5], ['custom-class-shirts', 4], ['sport', 4], ['custom-badminton-shirts', 4], ['custom-running-shirts', 4], ['event', 4]]) assert.match(main(f), new RegExp(`class="up2-ctx__shelf"[^>]*style="--n:${n}"`), f)
})
