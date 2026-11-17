/* /custom-badminton-shirts/ เสื้อแบดมินตัน โฉมใหม่ · 14 พ.ย. 2026 อาร์ต "ทำหน้าเสื้อแบดต่อเลย" → "ทำตามแผน ~1,405"
   โครงเดียวกับหน้าเสื้อกีฬา (มีรีวิวจริง: ชมรมแบดกรุงไทย) · เสื้อบนแท่น/ใน hero = เสื้อจริง:
   JUSTICE BADMINTON (รูปลูกค้า lc31) · ALL GEN BADMINTON ลายมังกร (รูปลูกค้า lc84 · ทีมถือถ้วย lc87 ใส่ลายนี้) · FEATHER (คลัง Packshot · ครอปไม่ให้เห็นกล่อง Finix) · CONNECT BADMINTON (รูปลูกค้าเด็ก lc69) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const order = (m) => [...m.matchAll(/<section class="([^"]*)"(?: id="([^"]*)")?/g)].map((x) => x[1].split(' ').filter((c) => /^(up2-|hm-show|hm-faq|hm-origin|hm-talk__card|hm-logowrap|hm-stats-band|rvw-sec)/.test(c) || x[2] === 'services')[0] || x[1])
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const bad = main('custom-badminton-shirts')
const spt = main('sport')

test('แบด: ส่วนเรียงตามหน้าเสื้อกีฬา · ไม่มีส่วนเดิม · ลิงก์ในหน้ามีปลายทาง', () => {
  assert.deepEqual(order(bad), order(spt))
  for (const id of ['plan', 'photos', 'work']) assert.doesNotMatch(bad, new RegExp(`<section[^>]*id="${id}"`))
  for (const [, id] of bad.matchAll(/(?<!<use )href="#([^"]+)"/g)) assert.ok(bad.includes(`id="${id}"`), `#${id}`)
  assert.match(bad, /id="badminton-review-wall"/)
})

test('แบด: hero ภาพเสื้อแบด · ไม่มีคำของกลุ่มร้านค้า/หน่วยงาน', () => {
  const at = bad.indexOf('<section class="band-hero up2-hero')
  const hero = bad.slice(at, bad.indexOf('</section>', at))
  for (const f of ['badminton-2304', 'badminton-1280', 'badminton-800', 'badminton-m-768', 'badminton-m-480']) { assert.match(hero, new RegExp(`/img/use-hero/${f}\\.webp`)); assert.ok(pub(`/img/use-hero/${f}.webp`), f) }
  assert.doesNotMatch(hero, /corp-|shop-|gov-|edu-|faculty-|class-|sport-/)
  /* 16 พ.ย. 2026 รีวิวข้ามกลุ่ม (review-pool.js · อาร์ต "คนละประเภทลูกค้าไม่เป็นไร"): ป้ายประเภทลูกค้าในรีวิว (เช่น "หน่วยงานโรงพยาบาล") ไม่นับ · ตรวจเฉพาะข้อความของหน้า */
  const body = text(bad.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<section class="hm-customer-proof up2-rv"[\s\S]*?<\/section>|<blockquote class="up2-ctx__rv">[\s\S]*?<\/blockquote>/g, ''))
  assert.doesNotMatch(body, /ร้านค้า|หน่วยงาน/, (body.match(/.{30}(ร้านค้า|หน่วยงาน).{30}/) || [])[0])
})

test('แบด: แท็บ 4 แบบ จากเสื้อจริง · ช่องรูปเป็นรูปลูกค้าแบดจริง · ไม่ซ้ำส่วนอื่น', () => {
  const at = bad.indexOf('<section class="up2-ctx"')
  const ctx = bad.slice(at, bad.indexOf('</section>', at))
  const TABS = ['club', 'match', 'corp', 'kids']
  assert.deepEqual([...ctx.matchAll(/class="up2-ctx__pick" id="up2-ctx-tab-([a-z]+)"/g)].map((m) => m[1]), TABS)
  assert.match(ctx, /class="up2-ctx__shelf"[^>]*style="--n:4"/)
  for (const t of TABS) for (const f of ['1200', '760', '480', 'thumb']) assert.ok(pub(`/img/use-ctx/badminton-${t}-${f}.webp`), `badminton-${t}-${f}`)
  const alts = [...ctx.matchAll(/class="up2-ctx__img"[^>]*alt="([^"]+)"/g)].map((m) => m[1])
  for (const n of ['JUSTICE', 'ALL GEN', 'FEATHER', 'CONNECT']) assert.ok(alts.some((a) => !/^(ภาพจำลอง|ภาพประกอบ)/.test(a) && a.includes(n)), n)
  const photos = [...ctx.matchAll(/class="up2-ctx__ph[^"]*"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(photos.length, 8)
  assert.equal((ctx.match(/class="up2-ctx__real">รูปจริงจากลูกค้า</g) || []).length, 4)
  const rest = bad.slice(0, at) + bad.slice(bad.indexOf('</section>', at))
  for (const s of photos) assert.ok(!new RegExp(`${s.replace(/(-\d+)?\.webp$/, '')}(-\\d+)?\\.webp`).test(rest), `${s}: ไม่ซ้ำ`)
  assert.match(ctx, /id="up2-ctx-corp"[\s\S]*?<blockquote/, 'แท็บชมรมองค์กรมีรีวิวกรุงไทย')
  assert.doesNotMatch(ctx, /finix/i)
})

test('แบด: แถวแบบเสื้อ = แบบแบดจริง · แถวคนใส่ 4 รูป · แถวเสื้อตัวจริงขึ้นเสื้อแบดก่อน', () => {
  const show = bad.slice(bad.indexOf('id="real-work"'))
  assert.match(show, /\/img\/design-front\/d21/)
  for (let i = 1; i <= 4; i++) { assert.match(show, new RegExp(`/img/use-worn/badminton-${i}\\.webp`)); assert.ok(pub(`/img/use-worn/badminton-${i}-540.webp`)) }
  const at = show.indexOf('id="show-real"')
  const first = [...show.slice(at).matchAll(/<img src="([^"]+)"/g)].slice(0, 2).map((m) => m[1])
  assert.deepEqual(first, ['justice', 'feather'].map((k) => `/img/use-real/badminton-${k}.webp`))
})

test('แบด: รีวิวชมรมแบดกรุงไทย · กล่องชำระเงินเป็นเสื้อแบด', () => {
  const rv = bad.slice(bad.indexOf('id="reviews"'), bad.indexOf('</section>', bad.indexOf('id="reviews"')))
  /* 16 พ.ย. คลังรีวิวเดียว (review-pool.js): แถวรูปเติมจนครบ 10 ด้วยรูปจากรีวิวกลุ่มอื่น · รีวิวของกลุ่มนี้ขึ้นก่อน */
  const ids = [...new Set([...rv.matchAll(/data-rv-open="([^"]+)"/g)].map((m) => m[1]))]
  assert.deepEqual(ids.slice(0, 1), ['krungthai-badminton'])
  assert.ok(ids.length > 1, 'มีรีวิวกลุ่มอื่นต่อท้าย')
  assert.match(bad, /\/img\/use-pay\/badminton-box/)
})
