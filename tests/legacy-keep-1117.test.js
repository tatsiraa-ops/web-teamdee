/* 17 พ.ย. 2026 อาร์ต "/size-chart/ /collar-styles/ คงไว้" (กัน SEO เก่าหลุดตอนสลับเว็บ)
   /size-chart/ (คลิกจาก Google มากสุด 564 · อันดับเฉลี่ย 5.2): ใช้หน้าใหม่ แต่ title / H1 ตามเว็บจริงเดิม · description เดิมแต่ตัดคำว่า "โรงงาน" (กฎอาร์ต)
     → รอ 3–4 สัปดาห์ให้อันดับนิ่งแล้วค่อยพิจารณาเปลี่ยน · title ยาวเกิน 60 ตัวอักษรได้เฉพาะหน้านี้ (ตัวเดียวกับที่ Google แสดงอยู่ตอนนี้)
   /collar-styles/ (24 คลิก · อันดับ 6.2): หน้า Elementor เดิมแสดงในกรอบธีม · เนื้อหามี H1 ของตัวเองแล้ว → ธีมไม่ใส่ H1 ซ้ำ (เว็บจริงมี H1 เดียว) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const pages = JSON.parse(readFileSync(new URL('../wp-theme/teamdee/build/pages.json', import.meta.url), 'utf8')).pages
const html = readFileSync(new URL('../wp-theme/teamdee/build/pages/size-chart.body.html', import.meta.url), 'utf8')
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const index = readFileSync(new URL('../wp-theme/teamdee/index.php', import.meta.url), 'utf8')
const runtime = process.env.PHP_WASM_MODULES
const fnSrc = (name) => { const a = source.indexOf(`function ${name}(`); assert.ok(a >= 0, name); let depth = 0, i = source.indexOf('{', a); for (; i < source.length; i++) { if (source[i] === '{') depth++; else if (source[i] === '}' && --depth === 0) break } return source.slice(a, i + 1) }
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

test('/size-chart/: title + H1 ตามเว็บจริงเดิม · description เดิมไม่มีคำว่าโรงงาน', () => {
  const p = pages['/size-chart/']
  assert.equal(p.title, 'ตารางไซส์เสื้อมาตรฐาน S-5XL พร้อมวิธีวัดตัวสั่งทำเสื้อโปโล-เสื้อกีฬา | TEAMDEE')
  assert.equal(p.description, 'เช็กตารางไซส์เสื้อมาตรฐาน S-5XL ครบทั้งเสื้อโปโล เสื้อยืด เสื้อกีฬาพิมพ์ลาย พร้อมวิธีวัดรอบอกและความยาวเสื้อก่อนสั่งผลิต ประเมินราคาง่ายๆ กับ TEAMDEE')
  assert.doesNotMatch(p.title + p.description, /โรงงาน/)
  const h1 = html.match(/<h1[\s\S]*?<\/h1>/g) || []
  assert.equal(h1.length, 1)
  assert.equal(text(h1[0]), 'ตารางไซส์เสื้อโปโล เสื้อกีฬา และเสื้อกิจกรรม มาตรฐาน TEAMDEE')
})

test('td_content_has_h1: เนื้อหาที่มี <h1 ของตัวเอง (Elementor) = true · h2 / ข้อความ "h1" ไม่นับ', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  const cases = [['<div class="elementor"><h1 class="elementor-heading-title">รูปแบบคอเสื้อ</h1></div>', true], ['<H1>x</H1>', true],
    ['<h2>x</h2><p>h1 คือหัวข้อ</p>', false], ['<header><h10>x</h10>', false], ['', false]]
  try {
    const r = await php.run({ code: `<?php ${fnSrc('td_content_has_h1')} echo json_encode(array_map('td_content_has_h1', json_decode(${JSON.stringify(JSON.stringify(cases.map((c) => c[0])))}, true)));` })
    assert.equal(r.errors, '')
    assert.deepEqual(JSON.parse(r.text), cases.map((c) => c[1]))
  } finally { php.exit() }
})

test('index.php: หน้าเดี่ยวใส่ H1 ชื่อหน้าเฉพาะเมื่อเนื้อหายังไม่มี H1 · แสดงเนื้อหาที่ผ่าน the_content แล้วครั้งเดียว', () => {
  assert.match(index, /\$content = apply_filters\('the_content', get_the_content\(\)\);/)
  assert.match(index, /<\?php if \(!td_content_has_h1\(\$content\)\) : \?><h1 class="t-display text-\[clamp\(30px,4\.4vw,52px\)\]"><\?php the_title\(\); \?><\/h1><\?php endif; \?>/)
  assert.match(index, /<div class="td-prose mt-8"><\?php echo \$content; \/\/ phpcs:ignore \?><\/div>/)
  assert.doesNotMatch(index, /<\?php the_content\(\); \?>/)
  /* มีเนื้อหาไหม ตัดสินจากเนื้อหาที่ผ่าน the_content แล้ว (Elementor สร้างเนื้อหาตอนนี้ · ของดิบอาจว่าง) ไม่งั้นซ่อน H1 ธีมแต่ไม่แสดง H1 ของเนื้อหา = หน้าไม่มี H1 */
  assert.match(index, /<\?php if \(trim\(wp_strip_all_tags\(\$content\)\) !== ''\) : \?>/)
})
