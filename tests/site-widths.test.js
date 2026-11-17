/* 17 พ.ย. 2026 รอบตรวจ UI: ส่วนที่ใช้ความกว้างนอกกฎ (อาร์ต 6 พ.ย. "กว้างปกติ กับ พิเศษ" · ปกติ .wrap 1240 · พิเศษ calc(100% − 64px) สูงสุด 1400)
   แถบตัวเลขหน้าแรก 1360 · ผลงานจริงหน้าแรก 1320 · วิธีชำระเงิน 1200 → ขอบซ้ายไม่ตรงกับส่วนข้างเคียง */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as fs from 'node:fs'

const css = (f) => readFileSync(new URL(`../src/styles/${f}`, import.meta.url), 'utf8')

test('ไม่มีความกว้างส่วนที่ 1200 / 1360 (ใช้ปกติหรือพิเศษเท่านั้น)', () => {
  assert.doesNotMatch((css('home.css') + css('home-page.css')), /max-width:\s*1360px/)
  /* #real-work 1320 คงไว้: อาร์ต 4 พ.ย. "คอมผลงานกว้างเท่าบริการ" (tests/mobile-audit-fixes.test.js) */
  assert.doesNotMatch(css('pay-block.css'), /\.up2-pay > \.wrap \{[^}]*max-width: 1200px/)
})

test('แถบตัวเลขหน้าแรก = กว้างพิเศษ (≥768)', () => {
  const h = (css('home.css') + css('home-page.css'))
  assert.match(h, /@media \(min-width: 768px\) \{ \.hm-stats-band\.wrap \{ width: calc\(100% - 64px\); max-width: 1400px; padding-inline: 0; \} \}/)
})

/* 17 พ.ย. 2026 รอบตรวจ UI: จอ 768–1023 แถบเลือกสไลด์ hero (กลางล่าง) ทับปุ่ม "ทัก LINE ขอราคา" → ย้ายไปชิดขวาล่าง */
test('hero หน้าแรกบนแท็บเล็ต: แถบเลือกสไลด์ชิดขวา ไม่ทับปุ่ม LINE', () => {
  assert.match((css('home.css') + css('home-page.css')), /@media \(min-width: 768px\) and \(max-width: 1023px\) \{ \.th--slides \.th-ctrl \{ left: auto; right: 24px; translate: none; \} \}/)
})

/* 17 พ.ย. 2026 รอบตรวจ UI: ปุ่ม LINE หน้าติดต่อเป็นสี่เหลี่ยมมุมมน 14–16px ขณะที่ปุ่ม LINE ทุกที่อื่นเป็นแคปซูล 999px */
test('หน้าติดต่อ: ปุ่ม LINE (เริ่มแชทเลย · ปุ่ม LINE สำนักงาน) และปุ่มโทรคู่กัน เป็นแคปซูล', () => {
  const c = css('page-contact.css')
  for (const sel of ['\\.cx-lc__go', '\\.cx-linebadge', '\\.cx-office__tel']) assert.match(c, new RegExp(`${sel} \\{[^}]*border-radius: 999px`), sel)
})

/* 17 พ.ย. 2026 อาร์ต "รวมขนาด H2 ให้เป็นชุดเดียว": หน้าแรก/กลุ่มลูกค้า/สินค้า H2 ส่วน = clamp(30px, 3.06vw, 44px)
   แต่ค่าตั้งต้น .hm-head h2 = 46 · /about-us/ 40/46/48 · /project/ 40/46 → ใช้ชุดเดียวกัน (ยกเว้นประโยคใหญ่ .ab2-win ตั้งใจ 60 ส่วนเดียว) */
test('H2 ระดับส่วน = clamp(30px, 3.06vw, 44px) ทุกหน้า', () => {
  const H = 'clamp\\(30px, 3\\.06vw, 44px\\)'
  assert.match(css('home.css'), new RegExp(`\\.hm-head h2, \\.hm-end h2 \\{ font-size: ${H};`))
  const ab = css('about.css')
  assert.match(ab, new RegExp(`\\.ab2-h \\{ font-size: ${H};`))
  assert.match(ab, new RegExp(`\\.ab2-end__h \\{ font-size: ${H};`))
  assert.match(ab, new RegExp(`\\.ab-logos \\.ab2-h \\{ font-size: ${H}; \\}`))
  assert.match(readFileSync(new URL('../site/project/index.html', import.meta.url), 'utf8'), /<h2 id="photos-h" class="t-display text-\[clamp\(30px,3\.06vw,44px\)\]/)
})

/* 17 พ.ย. 2026 อาร์ต "รวมขนาดมุมโค้งการ์ดให้เป็นชุดเดียว": มุมการ์ดมี 14/16/18/20/22/24/26/28/30 ปนกัน (6–8 ค่าต่อหน้า)
   → สเกลทีละ 4px: 16 · 20 · 24 · 28 (ขยับไม่เกิน 2px ให้การ์ดซ้อนการ์ดยังเข้ากัน) · ชิ้นเล็ก ≤12px และแคปซูล 999px ไม่แตะ */
test('มุมโค้งการ์ด (ค่าเดี่ยว 14–32px · ใหญ่กว่านี้เป็นฉากตกแต่ง) อยู่ในสเกล 16 / 20 / 24 / 28 เท่านั้น', () => {
  const { readdirSync } = fs
  const dir = new URL('../src/styles/', import.meta.url)
  const off = []
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.css'))) {
    for (const m of readFileSync(new URL(f, dir), 'utf8').matchAll(/border-radius:\s*(\d+)px\s*[;}!]/g)) {
      const v = Number(m[1]); if (v >= 14 && v <= 32 && ![16, 20, 24, 28].includes(v)) off.push(`${f}: ${v}px`)
    }
  }
  assert.deepEqual(off, [])
})
