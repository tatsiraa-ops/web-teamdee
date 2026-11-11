/* แยก CSS + ตัดของไม่ใช้ (อาร์ตอนุญาต 30 ต.ค. รอบ 48 ข้อ 13) · CSS ที่ทุกหน้าโหลด 366KB → 277KB (gzip 65 → 51KB)
   ตรวจด้วย computed style ทุก element ทุกหน้า 375/768/1440 ก่อน/หลังแยก · กันของเฉพาะหน้าไหลกลับเข้า main.css */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const main = strip(read('src/styles/main.css'))
const PAGES = [
  ['works-page.js', 'page-project.css', ['pj']],
  ['designs-page.js', 'page-designs.css', ['dz', 'dg', 'dcard', 'grp']],
  ['calc-page.js', 'page-calculations.css', ['kcard', 'slip']],
]

test('CSS เฉพาะหน้าอยู่ไฟล์ของหน้านั้น โหลดจากสคริปต์ของหน้านั้นเท่านั้น', () => {
  for (const [js, css, fams] of PAGES) {
    assert.match(read(`src/js/${js}`), new RegExp(`^import './page\\.js'\\nimport '\\.\\./styles/${css.replace('.', '\\.')}'`), js)
    const own = read(`src/styles/${css}`)
    for (const f of fams) {
      assert.match(own, new RegExp(`\\.${f}[-_]`), `${css} มี .${f}-`)
      /* selector ที่ขึ้นต้นด้วยตระกูลของหน้า (ที่เหลือใน main.css อยู่ใน :not()/:is() รวมกับหน้าอื่น) */
      assert.doesNotMatch(main, new RegExp(`^\\s*\\.${f}[-_]`, 'm'), `main.css ไม่มี .${f}- แล้ว`)
    }
  }
})

test('rule ที่ไม่มีหน้าไหนใช้ถูกตัดแล้ว ไม่กลับมา', () => {
  for (const gone of ['.hm-faq-h', '.hm-panels', '.th-kicker', '.pill-row', '.stepx', '.cdot', '.band-ink']) {
    assert.ok(!main.includes(gone + ' ') && !strip(read('src/styles/home.css')).includes(gone + ' '), gone)
  }
})
