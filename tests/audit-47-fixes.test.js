/* ตรวจละเอียดทั้งเว็บ 30 ต.ค. 2026 (รอบ 47 · docs/audit/2026-10-30-full-audit.md) · กันของที่แก้แล้วกลับมา
   logic อยู่ในเทสของตัวเอง: back-close · contact-send (เลขไทย timeout from) · faq-search · thai-break · mobile-ui · consent · image-perf */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')
const main = read('src/styles/main.css')

test('H1: หน้าค้นหา ปิดหน้าต่างแล้วปุ่มขยายรูปไม่หาย (lightbox refresh · popstate ข้ามถ้าคำค้นเดิม)', () => {
  assert.match(read('src/js/lightbox.js'), /return \{ refresh: addButtons \}/)
  const s = read('src/js/search-page.js')
  assert.match(s, /lb\?\.refresh\(\)/)
  assert.match(s, /if \(q === input\.value\) return/)
})

test('H2: เบอร์เลขไทยแปลงก่อนส่ง', () => {
  assert.match(read('src/js/contact-page.js'), /tel: toAsciiDigits\(\$\('cTel'\)\.value\)/)
})

test('แถวรีวิวเป็นกล่องอ้างอิงของ sr-only (เดิมหน้ากว้าง 2,855px บนมือถือ)', () => {
  assert.match(main, /\.rvm__row \{ position: relative; overflow-x: auto;/)
})

test('วงโฟกัสบนพื้นสว่างเป็นสีดำ ไม่ใช่ส้ม (WCAG 1.4.11)', () => {
  assert.match(main, /\.m-fold > summary:focus-visible \{ outline: 3px solid var\(--color-ink\)/)
  assert.match(main, /\.mnav:focus-visible \{ outline: 2px solid var\(--color-ink\)/)
  assert.doesNotMatch(read('src/styles/home.css'), /focus-visible \{ outline:3px solid #ff7900; outline-offset:4px; \}/)
})

test('มือถือแนวนอน: หัวเว็บและแถบหมวดไม่ติดจอ', () => {
  assert.match(main, /@media \(orientation: landscape\) and \(max-height: 500px\) \{\n  \[data-header\] \{ position: relative; \}/)
})

test('แถวโลโก้เลื่อนเองมีปุ่มหยุด (WCAG 2.2.2)', () => {
  assert.match(read('src/js/site-extras.js'), /safe\(initMarqueePause\)/)
  assert.match(main, /\[data-marquee\]\.is-paused/)
})

test('แถบเลิกทำไม่หายขณะโฟกัส/แตะอยู่ · ตัวกรองไม่ปิดเมื่อกดลูกศร', () => {
  const s = read('src/js/designs-page.js')
  /* ถาดย้ายไป pick-tray.js ใช้ร่วมกับแกลเลอรี (audit มือถือ 30 ต.ค. ข้อ 11) */
  assert.match(read('src/js/pick-tray.js'), /if \(tray\.matches\(':hover'\) \|\| tray\.contains\(document\.activeElement\)\) return/)
  assert.match(s, /fs\.addEventListener\('pointerdown', \(\) => \{ ptr = true \}\)/)
})

test('a11y: การ์ดรีวิวอ่านคำรีวิวได้ · คัดลอกลิงก์ FAQ เป็นปุ่ม+ประกาศ · เครื่องคำนวณประกาศบรรทัดเดียว · แถบล่างลำดับตรงกับที่เห็น · เมนู inert', () => {
  assert.doesNotMatch(read('src/partials/reviewMini.hbs'), /aria-label="ดูรีวิวและรูปของ/)
  const faq = read('site/faq/index.html')
  assert.match(faq, /<button type="button" class="fq-act" data-href="#\{\{this\.id\}\}" data-copy-link>/)
  assert.match(faq, /id="fqCopyStatus"/)
  const calc = read('site/calculations/index.html')
  assert.match(calc, /<div id="calcSum">/)
  assert.match(calc, /role="status" id="calcSay"/)
  const ft = read('src/partials/footer.hbs')
  assert.ok(ft.indexOf('class="mb__btn" href="tel:') < ft.indexOf('class="mb__line"'))
  assert.doesNotMatch(main, /html \.mb__btn:nth-child\(2\) \{ order: 1; \}/)
  assert.match(read('src/js/nav.js'), /el\.inert = on/)
})

test('SEO: ลิงก์เข้าหน้าทรงคอ · breadcrumb คู่มือ/FAQ มี item · รูปแชร์จากเนื้อหา', () => {
  assert.match(read('src/partials/footer.hbs'), /url 'guides' 'collar'/)
  assert.match(read('src/partials/guidePage.hbs'), /"name":"คู่มือและบทความ","item":/)
  assert.match(read('site/faq/index.html'), /"name":"คู่มือและบทความ","item":/)
  assert.match(read('vite.config.js'), /const mainAt = html\.indexOf\('<main'\)/)
})

test('ไม่ใช้คำว่าโรงงาน (มติ 22 ต.ค.) แม้ SEO แนะนำ', () => {
  assert.doesNotMatch(read('site/index.html'), /โรงงาน/)
})
