/* 13 พ.ย. 2026 อาร์ต "ไปตรวจ banner ทำบริษัท ทำดีแล้ว หน้า หน่วยงาน โรงเรียน ร้านค้า ยังไม่ได้"
   เทียบกับ /corporate/ แล้วต่าง 2 เรื่อง:
   1) ภาพ: เสื้อลอยของ 3 หน้าแบนเหมือนแปะ ทับนายแบบ · โรงเรียนใช้ฉากสนามหญ้ารก · ร้านค้าฉากร้านกาแฟ → เจนใหม่ทั้ง 3 หน้า (จอใหญ่ + มือถือ) ให้เสื้อลอยมีมิติแบบหน้าบริษัท ฉากขาวสว่างเดียวกัน
   2) หัวข้อ: หน้าบริษัท 2 บรรทัด (ดำ + ส้ม) · หน่วยงานดำล้วน 3 บรรทัด · ร้านค้ามี "/" ห้อยท้ายบรรทัด · โรงเรียน 3 บรรทัดต้องย่อทั้งหัวข้อ
      → แบ่งคำหลัก (ดำ ใหญ่) กับคำต่อท้าย (ส้ม เล็กลง บรรทัดเดียว) โดยข้อความ H1 เดิมครบทุกคำ */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { h1Split } from '../src/js/use-view.js'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const main = (f) => { const h = read(`dist-wp/${f}/index.html`); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const text = (h) => h.replace(/<\/?t-[a-z]+>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const flat = (s) => s.replace(/\s+/g, '')
const pages = JSON.parse(read('src/data/use-pages.json'))
const v2 = JSON.parse(read('src/data/use-v2.json'))
const PAGES = { gov: 'custom-organization-shirts', edu: 'education', shop: 'custom-staff-shirts', faculty: 'custom-university-shirts', class: 'custom-class-shirts', sport: 'sport', badminton: 'custom-badminton-shirts', running: 'custom-running-shirts', event: 'event' }

test('h1Split: แบ่งคำหลักกับคำต่อท้าย · มี " / " คั่นเดิมก็เก็บไว้ให้โปรแกรมอ่านจอ · แบ่งไม่ได้ = ไม่แบ่ง', () => {
  assert.deepEqual(h1Split('สั่งทำเสื้อหน่วยงาน พร้อมตราสัญลักษณ์และเอกสารประกอบงาน', 'สั่งทำเสื้อหน่วยงาน'), { main: 'สั่งทำเสื้อหน่วยงาน', rest: 'พร้อมตราสัญลักษณ์และเอกสารประกอบงาน', sep: ' ', sub: true })
  assert.deepEqual(h1Split('รับทำเสื้อพนักงานร้านค้า / เสื้อร้านอาหาร / เสื้อคาเฟ่', 'รับทำเสื้อพนักงานร้านค้า'), { main: 'รับทำเสื้อพนักงานร้านค้า', rest: 'เสื้อร้านอาหาร / เสื้อคาเฟ่', sep: ' / ', sub: true })
  assert.equal(h1Split('รับทำเสื้อกีฬา', 'เสื้อวิ่ง'), null)
  assert.equal(h1Split('รับทำเสื้อกีฬา', 'รับทำเสื้อกีฬา'), null)
})

for (const [id, f] of Object.entries(PAGES)) {
  test(`${f}: หัวข้อ hero = คำหลัก + บรรทัดรองสีส้ม (แบบหน้าบริษัท) · ข้อความ H1 เดิมครบ`, () => {
    const m = main(f)
    const h1 = m.slice(m.indexOf('<h1'), m.indexOf('</h1>') + 5)
    assert.match(h1, /<span class="th-o__accent th-o__accent--sub">/)
    assert.equal(flat(text(h1)), flat(pages[id].hero.h1), 'H1 ข้อความเดิม')
    assert.ok(pages[id].hero.h1.startsWith(v2[id].hero.h1Main))
    assert.doesNotMatch(m, /up2-hero--compact/, 'ไม่ต้องย่อทั้งหัวข้อแล้ว')
  })

  test(`${f}: ภาพ hero ชุดใหม่ครบทุกขนาด · คำบรรยายภาพตรงกับภาพ (ฉากขาวเดียวกับหน้าบริษัท)`, () => {
    for (const s of ['2304', '1280', '800', 'm-768', 'm-480']) assert.ok(existsSync(new URL(`../public/img/use-hero/${id}-${s}.webp`, import.meta.url)), `${id}-${s}`)
    assert.doesNotMatch(v2[id].hero.alt, /ร้านกาแฟ|อาคารเรียน/)
    assert.match(v2[id].hero._imgNote, /13 พ\.ย\./)
  })
}

test('/corporate/ ไม่เปลี่ยน: บรรทัดส้มขนาดเท่าคำหลัก', () => {
  const m = main('corporate')
  const h1 = m.slice(m.indexOf('<h1'), m.indexOf('</h1>'))
  assert.match(h1, /<span class="th-o__accent">/)
  assert.doesNotMatch(h1, /th-o__accent--sub/)
})

test('CSS: บรรทัดรองเล็กกว่าคำหลัก · จอ 1024 ขึ้นไปอยู่บรรทัดเดียว', () => {
  const css = read('src/styles/use-page.css')
  assert.match(css, /\.up2-hero \.th-o__accent--sub \{[^}]*font-size: \.6em/)
  assert.match(css, /@media \(min-width: 1024px\) \{\s*\.up2-hero \.th-o__accent--sub \{ white-space: nowrap; \}/)
})
