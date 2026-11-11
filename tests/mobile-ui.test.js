/* มือถือทั้งเว็บ ข (30 ต.ค. 2026 · หน้าสั้นลง): ท้ายเว็บพับ + รางเลื่อนแนวนอน เป็นของกลาง ไม่ผูกกับหน้าแรก
   เดิม footer พับเฉพาะหน้าแรก (home-mobile.js) หน้าอื่นท้ายเว็บสูง ~1,670px ที่ 375 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RAILS, MOBILE_FOLDS, railIndex, railColumns } from '../src/js/mobile-ui.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')

test('initSiteExtras เรียก initMobileUi (ทุกหน้าได้ footer พับ + ราง)', () => {
  const s = read('src/js/site-extras.js')
  assert.match(s, /from '\.\/mobile-ui\.js'/)
  assert.match(s, /safe\(initMobileUi\)/)
})

test('หน้าแรกไม่พับ footer เอง (กันพับซ้อนสองชั้น) และใช้ปุ่มรางชุดกลาง', () => {
  const s = read('src/js/home-mobile.js')
  assert.doesNotMatch(s, /hm-mobile-footer/)
  assert.match(s, /addRailControls/)
})

test('CSS พับ footer และรางไม่ผูกกับหน้าแรก', () => {
  const css = read('src/styles/main.css')
  assert.match(css, /\.m-fold > summary/)
  assert.match(css, /\.m-rail\b/)
  assert.doesNotMatch(read('src/styles/home.css'), /\.hm-mobile-footer/)
})

test('รางครอบส่วนยาวของหน้าสินค้าและหน้าการใช้งาน', () => {
  for (const sel of ['.download-assets__catalog', '.download-assets__details', '.pp-work-grid', 'ul.rvc:not(.rvc--all)', 'ul.pp-fabrics', 'ul.pp-photos']) {
    assert.ok(RAILS.includes(sel), sel)
  }
})

test('railIndex: ใบที่ชิดขอบซ้ายที่สุด · เลื่อนสุดขวาแล้วเป็นใบสุดท้าย', () => {
  assert.equal(railIndex([0, 300, 600], 0, false), 0)
  assert.equal(railIndex([-290, 10, 310], 0, false), 1)
  assert.equal(railIndex([-590, -290, 10], 0, true), 2)
  assert.equal(railIndex([-400, -100, 200], 0, true), 2)
})

test('railColumns: รางหลายแถว (ภาพลูกค้า 2 แถว) นับเป็นคอลัมน์ ปุ่มถัดไปต้องเลื่อนไปคอลัมน์ใหม่', () => {
  assert.deepEqual(railColumns([0, 0, 160, 160, 320]), [0, 2, 4])
  assert.deepEqual(railColumns([0, 300, 600]), [0, 1, 2])
  assert.deepEqual(railColumns([10.2, 10.6, 170]), [0, 2])
})

test('ตารางไซซ์พับบนมือถือ (รอบ 44 · สูง ~765px ที่ 375) มีป้ายบอกว่ากดดูอะไร', () => {
  const size = MOBILE_FOLDS.find((f) => f.sel === '.ptable.pp-size')
  assert.ok(size)
  assert.match(size.label, /ตารางไซซ์/)
  assert.match(read('src/styles/main.css'), /\.m-fold--table/)
})

test('กล่อง CTA บนมือถือ (รอบ 44 · อาร์ตเลือก ก): ซ่อนแชทตัวอย่าง แสดงรายการ "ต้องส่ง" แทนในตำแหน่งเดิม · จอคอมคงแชท', () => {
  const css = read('src/styles/home.css')
  const m = css.match(/@media \(max-width: 767px\) \{[^}]*\.cx__chat[^}]*display: none[^}]*\}[\s\S]*?\.cx__send:has\(li\)[^{]*\{[^}]*grid-area: chat/)
  assert.ok(m, 'ต้องมีกฎมือถือ: .cx__chat display:none และ .cx__send:has(li) อยู่ที่ grid-area chat')
  assert.match(read('src/partials/ctaBox.hbs'), /class="cx__send"/)
})

/* ตรวจระยะ /corporate/ 4 พ.ย.: กล่องแท็บบริบทงานโฉมใหม่ (up-contexts up2-ctx__box) ถูกจับเป็นราง แท็บกับแผงเรียงข้างกัน สูง ~800px เนื้อหาตกขวาจอ
   รางยังครอบการ์ดบริบทงานแบบเดิมของหน้ากลุ่มอื่น */
test('ราง .up-contexts ไม่จับกล่องแท็บบริบทงานโฉมใหม่', async () => {
  const { JSDOM } = await import('jsdom').catch(() => ({}))
  const sel = RAILS.find((s) => s.startsWith('.up-contexts'))
  assert.ok(sel, 'การ์ดบริบทงานเดิมยังเป็นราง')
  const matches = (cls) => {
    if (JSDOM) { const d = new JSDOM(`<div class="${cls}"></div>`).window.document; return d.querySelector('div').matches(sel) }
    /* ไม่มี jsdom: ตรวจจากข้อความ selector */
    return cls.includes('up2-ctx__box') ? !/:not\(\.up2-ctx__box\)/.test(sel) : true
  }
  assert.equal(matches('up-contexts grid'), true)
  assert.equal(matches('up-contexts up2-ctx__box'), false)
})
