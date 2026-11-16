/* /event/ เสื้ออีเวนต์ / กิจกรรม / Outing โฉมใหม่ · 14 พ.ย. 2026 อาร์ต "ทำหน้าเสื้ออีเวนต์ต่อเลย" → "ทำตามแผน ~1,405"
   โครงเดียวกับหน้าเสื้อกีฬา/แบด/วิ่ง (มีรีวิวจริง 3 ราย) · คลัง Packshot ไม่มีเสื้ออีเวนต์ → เสื้อบนแท่น/ใน hero ทำจากเสื้อจริงในรูปรีวิว/รูปลูกค้า (ครอปเฉพาะตัวเสื้อ ไม่ใช้หน้าคน):
   OUTING SEMINAR @KOHCHANG (rv29) · FTI OUTING 2026 (rv54 บนหุ่น · ไฟล์แบบ loose-162) · AEC MARKETING HOME (lc174) · เสื้อแดงลายไทยทอง (ev21) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const order = (m) => [...m.matchAll(/<section class="([^"]*)"(?: id="([^"]*)")?/g)].map((x) => x[1].split(' ').filter((c) => /^(up2-|hm-show|hm-faq|hm-origin|hm-talk__card|hm-logowrap|hm-stats-band|rvw-sec)/.test(c) || x[2] === 'services')[0] || x[1])
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const evt = main('event')
const spt = main('sport')

test('อีเวนต์: ส่วนเรียงตามหน้าเสื้อกีฬา · ไม่มีส่วนเดิม · ลิงก์ในหน้ามีปลายทาง', () => {
  assert.deepEqual(order(evt), order(spt))
  for (const id of ['plan', 'photos', 'work']) assert.doesNotMatch(evt, new RegExp(`<section[^>]*id="${id}"`))
  for (const [, id] of evt.matchAll(/href="#([^"]+)"/g)) assert.ok(evt.includes(`id="${id}"`), `#${id}`)
  assert.match(evt, /id="event-review-wall"/)
})

test('อีเวนต์: hero ภาพเสื้ออีเวนต์ · ไม่มีคำของกลุ่มร้านค้า/หน่วยงาน', () => {
  const at = evt.indexOf('<section class="band-hero up2-hero')
  const hero = evt.slice(at, evt.indexOf('</section>', at))
  for (const f of ['event-2304', 'event-1280', 'event-800', 'event-m-768', 'event-m-480']) { assert.match(hero, new RegExp(`/img/use-hero/${f}\\.webp`)); assert.ok(pub(`/img/use-hero/${f}.webp`), f) }
  assert.doesNotMatch(hero, /corp-|shop-|gov-|edu-|faculty-|class-|sport-|badminton-|running-/)
  const body = text(evt.replace(/<script[\s\S]*?<\/script>/g, ''))
  assert.doesNotMatch(body, /ร้านค้า|หน่วยงาน/, (body.match(/.{30}(ร้านค้า|หน่วยงาน).{30}/) || [])[0])
})

test('อีเวนต์: แท็บ 4 แบบ จากเสื้อจริง · ช่องรูปเป็นรูปลูกค้าจริง · ไม่ซ้ำส่วนอื่น', () => {
  const at = evt.indexOf('<section class="up2-ctx"')
  const ctx = evt.slice(at, evt.indexOf('</section>', at))
  const TABS = ['outing', 'seminar', 'festival', 'staff']
  assert.deepEqual([...ctx.matchAll(/role="tab"[^>]*id="up2-ctx-tab-([a-z]+)"/g)].map((m) => m[1]), TABS)
  assert.match(ctx, /class="up2-ctx__shelf"[^>]*style="--n:4"/)
  for (const t of TABS) for (const f of ['1200', '760', '480', 'thumb']) assert.ok(pub(`/img/use-ctx/event-${t}-${f}.webp`), `event-${t}-${f}`)
  const alts = [...ctx.matchAll(/class="up2-ctx__img"[^>]*alt="([^"]+)"/g)].map((m) => m[1])
  for (const n of ['OUTING SEMINAR', 'FTI', 'AEC MARKETING HOME', 'Motor Expo']) assert.ok(alts.some((a) => a.startsWith('ภาพจำลอง') && a.includes(n)), n)
  const photos = [...ctx.matchAll(/class="up2-ctx__ph[^"]*"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(photos.length, 8)
  assert.equal((ctx.match(/class="up2-ctx__real">รูปจริงจากลูกค้า</g) || []).length, 4)
  const rest = (evt.slice(0, at) + evt.slice(evt.indexOf('</section>', at))).replace(/background-image:url\([^)]*\)/g, '')
  for (const s of photos) assert.ok(!new RegExp(`${s.replace(/(-\d+)?\.webp$/, '')}(-\\d+)?\\.webp`).test(rest), `${s}: ไม่ซ้ำ`)
  assert.match(ctx, /id="up2-ctx-outing"[\s\S]*?<blockquote/, 'แท็บ Outing มีรีวิวเสื้อทริป')
  assert.match(ctx, /id="up2-ctx-seminar"[\s\S]*?<blockquote/, 'แท็บกิจกรรมบริษัทมีรีวิวฝ่ายบุคคล')
})

test('อีเวนต์: แถวแบบเสื้อ = ไฟล์แบบงานจริง · แถวคนใส่ 4 รูป · แถวเสื้อตัวจริงขึ้นเสื้อ FTI ก่อน ไม่ซ้ำรูปเดิม', () => {
  const show = evt.slice(evt.indexOf('id="real-work"'))
  for (const d of ['loose-162', 'brand-047', 'd20']) { assert.match(show, new RegExp(`/img/design-front/${d}-720`)); assert.ok(pub(`/img/design-front/${d}-720.webp`)) }
  for (let i = 1; i <= 4; i++) { assert.match(show, new RegExp(`/img/use-worn/event-${i}\\.webp`)); assert.ok(pub(`/img/use-worn/event-${i}-540.webp`)) }
  const at = show.indexOf('id="show-real"')
  assert.equal([...show.slice(at).matchAll(/<img src="([^"]+)"/g)][0][1], '/img/use-real/event-fti.webp')
  assert.doesNotMatch(show.slice(at), /real-front\/loose-157/, 'เสื้อ FTI ตัวเดียวกันไม่ขึ้นซ้ำ')
})

test('อีเวนต์: รีวิว 3 รายของกลุ่มนี้ · กล่องชำระเงินเป็นเสื้ออีเวนต์', () => {
  const rv = evt.slice(evt.indexOf('id="reviews"'), evt.indexOf('</section>', evt.indexOf('id="reviews"')))
  assert.deepEqual([...new Set([...rv.matchAll(/data-rv-open="([^"]+)"/g)].map((m) => m[1]))].sort(), ['hr-outing', 'outing-fabric', 'shrine'])
  assert.match(evt, /\/img\/use-pay\/event-box/)
})
