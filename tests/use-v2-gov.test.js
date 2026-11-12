/* /custom-organization-shirts/ หน่วยงาน โฉมใหม่ · 11 พ.ย. 2026 อาร์ต "ต่อเลย" (หลังร้านค้า) · โครงหน้าบริษัท
   เกณฑ์อาร์ต "ห้ามมั่ว": เสื้อบนแท่น/ใน hero = แบบหน่วยงานที่ยืนยันจากใบแบบ · รูปจริงในแท็บยืนยันจากป้าย/เสื้อในรูป */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const order = (m) => [...m.matchAll(/<section class="([^"]*)"(?: id="([^"]*)")?/g)].map((x) => x[1].split(' ').filter((c) => /^(up2-|hm-show|hm-faq|hm-origin|hm-talk__card|hm-logowrap|hm-stats-band|rvw-sec)/.test(c) || x[2] === 'services')[0] || x[1])
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const gov = main('custom-organization-shirts')

test('หน่วยงาน: ส่วนเรียงตามหน้าบริษัททุกส่วน · ไม่มีส่วนเดิม · ลิงก์ในหน้ามีปลายทาง', () => {
  assert.deepEqual(order(gov).filter((c) => order(main('corporate')).includes(c)), order(main('corporate')))
  for (const id of ['plan', 'photos', 'work']) assert.doesNotMatch(gov, new RegExp(`<section[^>]*id="${id}"`))
  for (const [, id] of gov.matchAll(/href="#([^"]+)"/g)) assert.ok(gov.includes(`id="${id}"`), `#${id}`)
  assert.match(gov, /id="gov-review-wall"/)
})

test('หน่วยงาน: hero ภาพหน่วยงาน · ไม่มีคำของกลุ่มบริษัท/ร้านค้า', () => {
  const hero = gov.slice(gov.indexOf('<section class="band-hero up2-hero'), gov.indexOf('</section>', gov.indexOf('<section class="band-hero up2-hero')))
  for (const f of ['gov-2304', 'gov-1280', 'gov-800', 'gov-m-768', 'gov-m-480']) { assert.match(hero, new RegExp(`/img/use-hero/${f}\\.webp`)); assert.ok(pub(`/img/use-hero/${f}.webp`), f) }
  assert.doesNotMatch(hero, /corp-|shop-/)
  const body = text(gov.replace(/<script[\s\S]*?<\/script>/g, '')).replace(/บริษัท ดีดี ฟินิกซ์ จำกัด|2,800\s*\+?\s*องค์กร|หนังสือรับรองบริษัท/g, '')
  assert.doesNotMatch(body, /บริษัท|ร้านค้า/, (body.match(/.{30}(บริษัท|ร้านค้า).{30}/) || [])[0])
})

test('หน่วยงาน: แท็บ 3 ประเภท เสื้อจริงยืนยันแล้ว · รูปจริงไม่ซ้ำส่วนอื่น · รีวิวตรงแท็บ', () => {
  const at = gov.indexOf('<section class="up2-ctx"')
  const ctx = gov.slice(at, gov.indexOf('</section>', at))
  assert.deepEqual([...ctx.matchAll(/role="tab"[^>]*id="up2-ctx-tab-([a-z]+)"/g)].map((m) => m[1]), ['hosp', 'office', 'sports'])
  for (const t of ['hosp', 'office', 'sports']) for (const f of ['1200', '760', '480', 'thumb']) assert.ok(pub(`/img/use-ctx/gov-${t}-${f}.webp`), `gov-${t}-${f}`)
  const alts = [...ctx.matchAll(/class="up2-ctx__img"[^>]*alt="([^"]+)"/g)].map((m) => m[1])
  for (const n of ['BANGKRATHUM HOSPITAL', 'กรมประชาสัมพันธ์', 'MWA']) assert.ok(alts.some((a) => a.startsWith('ภาพจำลอง') && a.includes(n)), n)
  const photos = [...ctx.matchAll(/class="up2-ctx__ph[^"]*"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(photos.length, 6)
  const rest = gov.slice(0, at) + gov.slice(gov.indexOf('</section>', at))
  for (const s of photos) assert.ok(!rest.includes(s.replace(/(-\d+)?\.webp$/, '')), `${s}: ไม่ซ้ำ`)
  assert.match(ctx, /blockquote[\s\S]*โทรคมนาคมแห่งชาติ/, 'แท็บกีฬามีรีวิว NT')
})

test('หน่วยงาน: การ์ดรีวิวเฉพาะ hospital + nt-snooker · คลังรีวิวไม่มีรูปที่ไม่ใช่หน่วยงาน (cr11 lc428)', () => {
  const rv = gov.slice(gov.indexOf('id="reviews"'), gov.indexOf('</section>', gov.indexOf('id="reviews"')))
  assert.deepEqual([...new Set([...rv.matchAll(/data-rv-open="([^"]+)"/g)].map((m) => m[1]))].sort(), ['hospital', 'nt-snooker'])
  const wall = gov.slice(gov.indexOf('id="gov-review-wall"'), gov.indexOf('</section>', gov.indexOf('id="gov-review-wall"')))
  assert.doesNotMatch(wall, /cr11|lc428/)
})
