/* /education/ โรงเรียน โฉมใหม่ · 11 พ.ย. 2026 อาร์ต "ต่อ" (หลังหน่วยงาน) · โครงหน้าบริษัท
   เกณฑ์อาร์ต "ห้ามมั่ว": เสื้อบนแท่น/ใน hero = แบบโรงเรียนที่ยืนยันจากใบแบบ · รูปจริงในแท็บยืนยันจากป้าย/เสื้อในรูป */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const order = (m) => [...m.matchAll(/<section class="([^"]*)"(?: id="([^"]*)")?/g)].map((x) => x[1].split(' ').filter((c) => /^(up2-|hm-show|hm-faq|hm-origin|hm-talk__card|hm-logowrap|hm-stats-band|rvw-sec)/.test(c) || x[2] === 'services')[0] || x[1])
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const edu = main('education')

test('โรงเรียน: ส่วนเรียงตามหน้าบริษัททุกส่วน · ไม่มีส่วนเดิม · ลิงก์ในหน้ามีปลายทาง', () => {
  assert.deepEqual(order(edu).filter((c) => order(main('corporate')).includes(c)), order(main('corporate')))
  for (const id of ['plan', 'photos', 'work']) assert.doesNotMatch(edu, new RegExp(`<section[^>]*id="${id}"`))
  for (const [, id] of edu.matchAll(/href="#([^"]+)"/g)) assert.ok(edu.includes(`id="${id}"`), `#${id}`)
  assert.match(edu, /id="edu-review-wall"/)
})

test('โรงเรียน: hero ภาพโรงเรียน · ไม่มีคำของกลุ่มบริษัท/ร้านค้า/หน่วยงาน', () => {
  const hero = edu.slice(edu.indexOf('<section class="band-hero up2-hero'), edu.indexOf('</section>', edu.indexOf('<section class="band-hero up2-hero')))
  for (const f of ['edu-2304', 'edu-1280', 'edu-800', 'edu-m-768', 'edu-m-480']) { assert.match(hero, new RegExp(`/img/use-hero/${f}\\.webp`)); assert.ok(pub(`/img/use-hero/${f}.webp`), f) }
  assert.doesNotMatch(hero, /corp-|shop-|gov-/)
  const body = text(edu.replace(/<script[\s\S]*?<\/script>/g, '')).replace(/บริษัท ดีดี ฟินิกซ์ จำกัด|2,800\s*\+?\s*องค์กร|หนังสือรับรองบริษัท/g, '')
  assert.doesNotMatch(body, /บริษัท|ร้านค้า|หน่วยงาน/, (body.match(/.{30}(บริษัท|ร้านค้า|หน่วยงาน).{30}/) || [])[0])
})

test('โรงเรียน: แท็บ 3 ประเภท เสื้อจริงยืนยันแล้ว · รูปจริงไม่ซ้ำส่วนอื่น · รีวิวตรงแท็บ', () => {
  const at = edu.indexOf('<section class="up2-ctx"')
  const ctx = edu.slice(at, edu.indexOf('</section>', at))
  assert.deepEqual([...ctx.matchAll(/role="tab"[^>]*id="up2-ctx-tab-([a-z]+)"/g)].map((m) => m[1]), ['teachers', 'sportsday', 'classroom'])
  for (const t of ['teachers', 'sportsday', 'classroom']) for (const f of ['1200', '760', '480', 'thumb']) assert.ok(pub(`/img/use-ctx/edu-${t}-${f}.webp`), `edu-${t}-${f}`)
  const alts = [...ctx.matchAll(/class="up2-ctx__img"[^>]*alt="([^"]+)"/g)].map((m) => m[1])
  for (const n of ['บ้านหนองมีหัวดง', 'SRIBOONYANON', 'ROOM 8']) assert.ok(alts.some((a) => a.startsWith('ภาพจำลอง') && a.includes(n)), n)
  const photos = [...ctx.matchAll(/class="up2-ctx__ph[^"]*"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(photos.length, 6)
  const rest = edu.slice(0, at) + edu.slice(edu.indexOf('</section>', at))
  for (const s of photos) assert.ok(!rest.includes(s.replace(/(-\d+)?\.webp$/, '')), `${s}: ไม่ซ้ำ`)
  assert.match(ctx, /id="up2-ctx-sportsday"[\s\S]*?<blockquote/, 'แท็บกีฬาสีมีรีวิวจริง')
})

test('โรงเรียน: การ์ดรีวิวเฉพาะรีวิวโรงเรียน · คลังรีวิวมีรูปโรงเรียน', () => {
  const rv = edu.slice(edu.indexOf('id="reviews"'), edu.indexOf('</section>', edu.indexOf('id="reviews"')))
  assert.deepEqual([...new Set([...rv.matchAll(/data-rv-open="([^"]+)"/g)].map((m) => m[1]))].sort(), ['school-crossword', 'school-sportsday'])
  const wall = edu.slice(edu.indexOf('id="edu-review-wall"'), edu.indexOf('</section>', edu.indexOf('id="edu-review-wall"')))
  assert.ok((wall.match(/<li class="rvw__ph"/g) || []).length >= 12, 'คลังรีวิวรูปเยอะพอ')
})

/* 11 พ.ย. วัด 1280/1440: หัวข้อโรงเรียนยาว (3 บรรทัด) ข้อความทับเส้นทางหน้าและล้นขอบล่างแบนเนอร์ → hero.compact ย่อหัวข้อเฉพาะหน้านี้ */
test('โรงเรียน: hero หัวข้อกระชับ (เปิดผ่านข้อมูล เฉพาะหน้านี้)', () => {
  assert.match(edu, /<section class="band-hero up2-hero up2-hero--compact"/)
  assert.doesNotMatch(main('corporate'), /up2-hero--compact/)
  const css = readFileSync('src/styles/use-page.css', 'utf8')
  assert.match(css, /@media \(min-width: 1024px\) \{\s*\.up2-hero--compact \.th-o__h \{ font-size: clamp\(/)
})
