/* ฟอนต์เก็บในเว็บเอง (อาร์ตอนุญาต 30 ต.ค. รอบ 48 ข้อ 14) · ไม่ส่ง IP ผู้เข้าชมให้ Google Fonts ก่อนยินยอม · ไม่ต้องต่อโดเมนเพิ่ม 2 โดเมน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('head ไม่โหลดฟอนต์จาก Google แล้ว', () => {
  assert.doesNotMatch(read('src/partials/head.hbs'), /fonts\.(googleapis|gstatic)\.com/)
})

test('fonts.css มี Noto Sans Thai 3 ชุดอักษร (thai latin latin-ext) ไฟล์มีจริง · variable 400–800 · swap', () => {
  const css = read('src/styles/fonts.css')
  const faces = [...css.matchAll(/@font-face \{([\s\S]*?)\}/g)].map((m) => m[1])
  assert.equal(faces.length, 3)
  for (const f of faces) {
    assert.match(f, /font-family: 'Noto Sans Thai';/)
    assert.match(f, /font-weight: 400 800;/)
    assert.match(f, /font-display: swap;/)
    const file = f.match(/url\("\.\.\/assets\/fonts\/([^"]+)"\)/)[1]
    assert.ok(existsSync(new URL(`../src/assets/fonts/${file}`, import.meta.url)), file)
  }
  assert.ok(faces.some((f) => /U\+0E01-0E5B/.test(f)), 'ชุดอักษรไทย')
  assert.match(read('src/styles/main.css'), /@import '\.\/fonts\.css';/)
  assert.ok(existsSync(new URL('../src/assets/fonts/OFL.txt', import.meta.url)), 'สัญญาอนุญาต OFL')
})

test('ไม่มี preload ที่ชี้ /src/ (Vite ไม่แปลง → 404 บนเว็บจริง)', () => {
  assert.doesNotMatch(read('src/partials/head.hbs'), /rel="preload"[^>]*href="\/src\//)
})
