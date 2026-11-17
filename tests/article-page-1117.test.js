/* 17 พ.ย. 2026 อาร์ต "ทำ ui หน้าบทความให้ดีกว่าเดิม" → "แก้ตามแนะนำมาได้เลย" (ปรับของเดิม ไม่รื้อ)
   ตรวจบทความจริงบน staging (เจาะโครงสร้างราคาสั่งผลิต ล็อต 100–10,000 ตัว · h2 5 · h3 14 · ตาราง 2):
   - วันที่ภาษาอังกฤษ "October 5, 2026" → วันที่ไทยแบบเดียวกับทั้งเว็บ "5 ต.ค. 2026"
   - ไม่บอกหมวด / เวลาอ่าน → หมวด (ลิงก์) + "อ่านประมาณ N นาที" ใต้ชื่อเรื่อง
   - สารบัญ 19 บรรทัด (h2 + h3) → หัวข้อใหญ่ (h2) อย่างเดียว · มี h2 ไม่ถึง 2 ค่อยใช้ h3 ด้วย
   - ไม่มีจุดถามระหว่างอ่าน → กล่องทัก LINE เงียบๆ กลางบทความ (ก่อนหัวข้อใหญ่ช่วงกลาง) · ข้อความพิมพ์รอไว้บอกชื่อบทความ
   PRODUCT.md: ปุ่มขายต้องรองจากการอ่าน · ห้ามแต่งชื่อผู้เขียน */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { tocHeadings } from '../src/js/article-reader.js'

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const single = readFileSync(new URL('../wp-theme/teamdee/single.php', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles/article-reader.css', import.meta.url), 'utf8')
const fnSrc = (name) => { const a = source.indexOf(`function ${name}(`); assert.ok(a >= 0, name); let depth = 0, i = source.indexOf('{', a); for (; i < source.length; i++) { if (source[i] === '{') depth++; else if (source[i] === '}' && --depth === 0) break } return source.slice(a, i + 1) }

async function php(code) {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const p = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try { const r = await p.run({ code: `<?php ${code}` }); assert.equal(r.errors, ''); return JSON.parse(r.text) } finally { p.exit() }
}

test('td_thai_date: Y-m-d → "5 ต.ค. 2026" (รูปแบบเดียวกับการ์ดบทความทั้งเว็บ) · ค่าเพี้ยน = ว่าง', { skip: !runtime }, async () => {
  const out = await php(`${fnSrc('td_thai_date')} echo json_encode(array_map('td_thai_date', ['2026-10-05', '2026-01-31', '2026-12-01', 'oops', '']), JSON_UNESCAPED_UNICODE);`)
  assert.deepEqual(out, ['5 ต.ค. 2026', '31 ม.ค. 2026', '1 ธ.ค. 2026', '', ''])
})

test('td_reading_minutes: นับตัวอักษรที่ไม่ใช่ช่องว่างหลังตัดแท็ก · 1,000 ตัว/นาที ปัดขึ้น · ขั้นต่ำ 1', { skip: !runtime }, async () => {
  const out = await php(`${fnSrc('td_reading_minutes')} echo json_encode([
    td_reading_minutes(str_repeat('ก', 15758)),
    td_reading_minutes('<p class="' . str_repeat('x', 5000) . '">' . str_repeat('ข ', 1000) . '</p>'),
    td_reading_minutes(''),
    td_reading_minutes(str_repeat('ค', 1000)),
  ]);`)
  assert.deepEqual(out, [16, 1, 1, 1])
})

test('td_insert_mid_cta: วางก่อนหัวข้อใหญ่ช่วงกลาง (h2 3 → ก่อนตัวที่ 2 · 4–5 → ตัวที่ 3 · 6 → ตัวที่ 4) · h2 ไม่ถึง 3 = ไม่ใส่', { skip: !runtime }, async () => {
  const doc = (n) => Array.from({ length: n }, (_, i) => `<h2 id="s${i + 1}">หัวข้อ ${i + 1}</h2><p>เนื้อหา</p>`).join('')
  const out = await php(`${fnSrc('td_insert_mid_cta')}
    $r = [];
    foreach ([2, 3, 4, 5, 6] as $n) {
      $html = '';
      for ($i = 1; $i <= $n; $i++) $html .= '<h2 id="s' . $i . '">หัวข้อ ' . $i . '</h2><p>เนื้อหา</p>';
      $out = td_insert_mid_cta($html, '[BOX]');
      $at = strpos($out, '[BOX]');
      $r[$n] = $at === false ? null : (int) substr_count(substr($out, 0, $at), '<h2') + 1;
    }
    $r['h2attr'] = substr_count(td_insert_mid_cta('<h2>a</h2><H2 class="x">b</H2><h2>c</h2><h20>no</h20>', '[BOX]'), '[BOX]');
    echo json_encode($r);`)
  assert.deepEqual(out, { 2: null, 3: 2, 4: 3, 5: 3, 6: 4, h2attr: 1 })
  assert.ok(doc(3))
})

test('td_article_line_url: LINE OA @teamdee พร้อมข้อความ "อ่านบทความ … แล้วมีคำถาม" และชื่อบทความ', { skip: !runtime }, async () => {
  const out = await php(`${fnSrc('td_article_line_url')} echo json_encode(td_article_line_url('ราคาสั่งผลิตเสื้อ ล็อต 100 & 10,000 ตัว'), JSON_UNESCAPED_SLASHES);`)
  assert.match(out, /^https:\/\/line\.me\/R\/oaMessage\/@teamdee\/\?/)
  const text = decodeURIComponent(out.split('?')[1])
  assert.match(text, /^สวัสดี ทีมดี อ่านบทความ "ราคาสั่งผลิตเสื้อ ล็อต 100 & 10,000 ตัว" แล้วมีคำถาม\nคำถาม: /)
})

test('tocHeadings: หัวข้อใหญ่ (h2) อย่างเดียว · h2 ไม่ถึง 2 = ใช้ h2 + h3 · ตัดหัวข้อว่างและส่วนที่ไม่เอาเข้าสารบัญ', () => {
  const h = (tag, text, exclude = false) => ({ tag, text, exclude })
  const list = [h('H2', 'ก'), h('H3', 'ก1'), h('H3', 'ก2'), h('H2', 'ข'), h('H3', 'ข1'), h('H2', '  '), h('H2', 'ค', true)]
  assert.deepEqual(tocHeadings(list).map((x) => x.text), ['ก', 'ข'])
  assert.deepEqual(tocHeadings([h('H2', 'ก'), h('H3', 'ก1'), h('H3', 'ก2')]).map((x) => x.text), ['ก', 'ก1', 'ก2'])
  assert.deepEqual(tocHeadings([h('H3', 'ก1')]).map((x) => x.text), ['ก1'])
  assert.deepEqual(tocHeadings([]), [])
})

test('single.php: วันที่ไทย · หมวด + เวลาอ่านใต้ชื่อเรื่อง · กล่อง LINE กลางบทความ (ไม่เข้าสารบัญ) · ไม่มีชื่อผู้เขียน', () => {
  assert.match(single, /td_thai_date\(get_the_date\('Y-m-d'\)\)/)
  assert.match(single, /td_thai_date\(get_the_modified_date\('Y-m-d'\)\)/)
  assert.doesNotMatch(single, /esc_html\(get_the_date\(\)\)|esc_html\(get_the_modified_date\(\)\)/)
  assert.match(single, /td_reading_minutes\(/)
  assert.match(single, /อ่านประมาณ/)
  assert.match(single, /class="td-reader__cat"/)
  assert.match(single, /td_insert_mid_cta\(/)
  /* esc_url ตัด %0A (ขึ้นบรรทัด) ทิ้ง → ข้อความ LINE ติดกัน "…แล้วมีคำถามคำถาม:" (staging 17 พ.ย.) · URL สร้างเองด้วย rawurlencode จึงใช้ esc_attr */
  assert.match(single, /esc_attr\(td_article_line_url\(get_the_title\(\)\)\)/)
  assert.doesNotMatch(single, /esc_url\(td_article_line_url/)
  assert.match(single, /class="td-reader__ask" data-reader-exclude/)
  assert.doesNotMatch(single, /the_author|get_the_author/)
})

test('CSS: ตารางหัวโทนอ่อน (ไม่ใช่พื้นดำ) เส้นบาง · เลขตรงคอลัมน์ · กล่องถามไม่ใช้เส้นสีหนาด้านข้าง', () => {
  assert.doesNotMatch(css, /\.td-reader__body thead \{ background: #111/)
  assert.match(css, /\.td-reader__body thead th \{[^}]*background:/)
  assert.match(css, /font-variant-numeric: tabular-nums/)
  assert.match(css, /\.td-reader__ask \{/)
  assert.doesNotMatch(css.match(/\.td-reader__ask \{[^}]*\}/)?.[0] || '', /border-left: *[2-9]/)
})

test('ป๊อปอัปโปรบนหน้าบทความ: รออ่านจบ (ถึง "อ่านต่อ" / ท้ายบทความ) ไม่เด้งกลางเนื้อหา · หน้าอื่นใช้กฎเดิม', () => {
  const js = readFileSync(new URL('../src/js/promo-popup.js', import.meta.url), 'utf8')
  assert.match(js, /const readerEnd = document\.querySelector\('\.td-reader__related, \.td-reader__end'\)/)
  assert.match(js, /const markTop = readerEnd \? readerEnd\.getBoundingClientRect\(\)\.top \+ scrollY : faq \? faq\.getBoundingClientRect\(\)\.top \+ scrollY : null/)
})

test('มือถือ: ตารางที่เลื่อนข้างได้มีเงาบอกขอบที่ยังเลื่อนต่อ (WCAG: เนื้อหาหลังขอบเลื่อนต้องมีสัญญาณ) · บรรทัดหมวด/วันที่ไม่ชิดบทนำ', () => {
  const mobile = css.slice(css.indexOf('@media (max-width: 767px)'))
  assert.match(mobile, /\.td-reader__body table:not\(\.rtable\) \{ display: block; overflow-x: auto;[^}]*background:[^}]*local[^}]*scroll/)
  assert.match(css, /\.td-reader__meta \+ \.td-reader__lead \{ margin-top: 20px; \}/)
})
