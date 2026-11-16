/* /custom-running-shirts/ เสื้อวิ่ง โฉมใหม่ · 14 พ.ย. 2026 อาร์ต "ทำหน้าเสื้อวิ่งต่อเลย" → "ทำตามแผน ~1,405"
   โครงเดียวกับหน้าเสื้อกีฬา/แบด (มีรีวิวจริง: กลุ่มนักวิ่ง runners) · เสื้อบนแท่น/ใน hero = เสื้อจริง:
   TG RC (คลัง Packshot การบินไทย ชมพูม่วง · ครอปไม่ให้เห็นกล่อง Finix · ตรงกับรูปลูกค้าชมรมวิ่ง co04) · ไฟล์แบบ KONG-MA RUN (d13) · Jpark CHARITY RUN (d20) · FUN RUN 5 KM (d14) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const order = (m) => [...m.matchAll(/<section class="([^"]*)"(?: id="([^"]*)")?/g)].map((x) => x[1].split(' ').filter((c) => /^(up2-|hm-show|hm-faq|hm-origin|hm-talk__card|hm-logowrap|hm-stats-band|rvw-sec)/.test(c) || x[2] === 'services')[0] || x[1])
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const run = main('custom-running-shirts')
const spt = main('sport')

test('วิ่ง: ส่วนเรียงตามหน้าเสื้อกีฬา · ไม่มีส่วนเดิม · ลิงก์ในหน้ามีปลายทาง', () => {
  assert.deepEqual(order(run), order(spt))
  for (const id of ['plan', 'photos', 'work']) assert.doesNotMatch(run, new RegExp(`<section[^>]*id="${id}"`))
  for (const [, id] of run.matchAll(/href="#([^"]+)"/g)) assert.ok(run.includes(`id="${id}"`), `#${id}`)
  assert.match(run, /id="running-review-wall"/)
})

test('วิ่ง: hero ภาพเสื้อวิ่ง · ไม่มีคำของกลุ่มร้านค้า/หน่วยงาน', () => {
  const at = run.indexOf('<section class="band-hero up2-hero')
  const hero = run.slice(at, run.indexOf('</section>', at))
  for (const f of ['running-2304', 'running-1280', 'running-800', 'running-m-768', 'running-m-480']) { assert.match(hero, new RegExp(`/img/use-hero/${f}\\.webp`)); assert.ok(pub(`/img/use-hero/${f}.webp`), f) }
  assert.doesNotMatch(hero, /corp-|shop-|gov-|edu-|faculty-|class-|sport-|badminton-/)
  const body = text(run.replace(/<script[\s\S]*?<\/script>/g, ''))
  assert.doesNotMatch(body, /ร้านค้า|หน่วยงาน/, (body.match(/.{30}(ร้านค้า|หน่วยงาน).{30}/) || [])[0])
})

test('วิ่ง: แท็บ 4 แบบ จากเสื้อจริง · ช่องรูปเป็นรูปลูกค้านักวิ่งจริง · ไม่ซ้ำส่วนอื่น', () => {
  const at = run.indexOf('<section class="up2-ctx"')
  const ctx = run.slice(at, run.indexOf('</section>', at))
  const TABS = ['club', 'race', 'charity', 'funrun']
  assert.deepEqual([...ctx.matchAll(/role="tab"[^>]*id="up2-ctx-tab-([a-z]+)"/g)].map((m) => m[1]), TABS)
  assert.match(ctx, /class="up2-ctx__shelf"[^>]*style="--n:4"/)
  for (const t of TABS) for (const f of ['1200', '760', '480', 'thumb']) assert.ok(pub(`/img/use-ctx/running-${t}-${f}.webp`), `running-${t}-${f}`)
  const alts = [...ctx.matchAll(/class="up2-ctx__img"[^>]*alt="([^"]+)"/g)].map((m) => m[1])
  for (const n of ['TG RC', 'KONG-MA RUN', 'CHARITY RUN', 'FUN RUN']) assert.ok(alts.some((a) => a.startsWith('ภาพจำลอง') && a.includes(n)), n)
  const photos = [...ctx.matchAll(/class="up2-ctx__ph[^"]*"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(photos.length, 8)
  assert.equal((ctx.match(/class="up2-ctx__real">รูปจริงจากลูกค้า</g) || []).length, 4)
  /* ไม่นับรูปวงกลมเล็กในปุ่ม "ดูผลงานลูกค้า" (avatar stack ใช้ทุกหน้า background-image) */
  const rest = (run.slice(0, at) + run.slice(run.indexOf('</section>', at))).replace(/background-image:url\([^)]*\)/g, '')
  for (const s of photos) assert.ok(!new RegExp(`${s.replace(/(-\d+)?\.webp$/, '')}(-\\d+)?\\.webp`).test(rest), `${s}: ไม่ซ้ำ`)
  assert.match(ctx, /id="up2-ctx-race"[\s\S]*?<blockquote/, 'แท็บงานวิ่งมีรีวิวกลุ่มนักวิ่ง')
  assert.doesNotMatch(ctx, /finix/i)
})

test('วิ่ง: แถวแบบเสื้อ = แบบวิ่งจริง · แถวคนใส่ 4 รูป · แถวเสื้อตัวจริงขึ้น TG RC ก่อน', () => {
  const show = run.slice(run.indexOf('id="real-work"'))
  for (const d of ['d13', 'd14', 'd20']) { assert.match(show, new RegExp(`/img/design-front/${d}-720`)); assert.ok(pub(`/img/design-front/${d}-720.webp`)) }
  for (let i = 1; i <= 4; i++) { assert.match(show, new RegExp(`/img/use-worn/running-${i}\\.webp`)); assert.ok(pub(`/img/use-worn/running-${i}-540.webp`)) }
  const at = show.indexOf('id="show-real"')
  assert.equal([...show.slice(at).matchAll(/<img src="([^"]+)"/g)][0][1], '/img/use-real/running-tgrc.webp')
})

test('วิ่ง: รีวิวกลุ่มนักวิ่ง · กล่องชำระเงินเป็นเสื้อวิ่ง', () => {
  const rv = run.slice(run.indexOf('id="reviews"'), run.indexOf('</section>', run.indexOf('id="reviews"')))
  assert.deepEqual([...new Set([...rv.matchAll(/data-rv-open="([^"]+)"/g)].map((m) => m[1]))], ['runners'])
  assert.match(run, /\/img\/use-pay\/running-box/)
})
