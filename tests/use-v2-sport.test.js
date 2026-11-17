/* /sport/ เสื้อกีฬา โฉมใหม่ · 14 พ.ย. 2026 อาร์ต "ทำหน้าเสื้อกีฬาต่อเลย" → "ทำตามแผน ~1,405"
   โครงเดียวกับหน้าโรงเรียน (มีรีวิวจริงของกลุ่มนี้ → มีการ์ดรีวิว) · เสื้อบนแท่น/ใน hero = เสื้อจริง:
   REB Assitalia · เสื้อกอล์ฟลายพลาง (คลัง Packshot · ด้านหน้าเท่านั้น ด้านหลังมีชื่อคน) · VAKUZA SWIMMING CLUB (จากรูปลูกค้า lc129) · TOGETHER WE WIN (จากรูปลูกค้า lc228)
   ตัดออก: Oversize ดำแดง + DMK (โลโก้ Finix กลางอก) · TG RC เก็บไว้หน้าเสื้อวิ่ง */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const order = (m) => [...m.matchAll(/<section class="([^"]*)"(?: id="([^"]*)")?/g)].map((x) => x[1].split(' ').filter((c) => /^(up2-|hm-show|hm-faq|hm-origin|hm-talk__card|hm-logowrap|hm-stats-band|rvw-sec)/.test(c) || x[2] === 'services')[0] || x[1])
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const spt = main('sport')
const edu = main('education')

test('กีฬา: ส่วนเรียงตามหน้าโรงเรียน (มีรีวิว) · ไม่มีส่วนเดิม · ลิงก์ในหน้ามีปลายทาง', () => {
  assert.deepEqual(order(spt), order(edu))
  for (const id of ['plan', 'photos', 'work']) assert.doesNotMatch(spt, new RegExp(`<section[^>]*id="${id}"`))
  for (const [, id] of spt.matchAll(/(?<!<use )href="#([^"]+)"/g)) assert.ok(spt.includes(`id="${id}"`), `#${id}`)
  assert.match(spt, /id="sport-review-wall"/)
})

test('กีฬา: hero ภาพเสื้อกีฬา · ไม่มีคำของกลุ่มร้านค้า/หน่วยงาน', () => {
  const at = spt.indexOf('<section class="band-hero up2-hero')
  const hero = spt.slice(at, spt.indexOf('</section>', at))
  for (const f of ['sport-2304', 'sport-1280', 'sport-800', 'sport-m-768', 'sport-m-480']) { assert.match(hero, new RegExp(`/img/use-hero/${f}\\.webp`)); assert.ok(pub(`/img/use-hero/${f}.webp`), f) }
  assert.doesNotMatch(hero, /corp-|shop-|gov-|edu-|faculty-|class-/)
  /* 16 พ.ย. 2026 รีวิวข้ามกลุ่ม (review-pool.js · อาร์ต "คนละประเภทลูกค้าไม่เป็นไร"): ป้ายประเภทลูกค้าในรีวิว (เช่น "หน่วยงานโรงพยาบาล") ไม่นับ · ตรวจเฉพาะข้อความของหน้า */
  const body = text(spt.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<section class="hm-customer-proof up2-rv"[\s\S]*?<\/section>|<blockquote class="up2-ctx__rv">[\s\S]*?<\/blockquote>/g, ''))
  assert.doesNotMatch(body, /ร้านค้า|หน่วยงาน/, (body.match(/.{30}(ร้านค้า|หน่วยงาน).{30}/) || [])[0])
})

test('กีฬา: แท็บ 4 ชนิดกีฬา จากเสื้อจริง · ช่องรูปเป็นรูปลูกค้าจริงทุกแท็บ · ไม่ซ้ำส่วนอื่น', () => {
  const at = spt.indexOf('<section class="up2-ctx"')
  const ctx = spt.slice(at, spt.indexOf('</section>', at))
  const TABS = ['football', 'golf', 'swim', 'indoor']
  assert.deepEqual([...ctx.matchAll(/class="up2-ctx__pick" id="up2-ctx-tab-([a-z]+)"/g)].map((m) => m[1]), TABS)
  assert.match(ctx, /class="up2-ctx__shelf"[^>]*style="--n:4"/)
  for (const t of TABS) for (const f of ['1200', '760', '480', 'thumb']) assert.ok(pub(`/img/use-ctx/sport-${t}-${f}.webp`), `sport-${t}-${f}`)
  const alts = [...ctx.matchAll(/class="up2-ctx__img"[^>]*alt="([^"]+)"/g)].map((m) => m[1])
  for (const n of ['REB Assitalia', 'กอล์ฟ', 'VAKUZA SWIMMING CLUB', 'TOGETHER WE WIN']) assert.ok(alts.some((a) => !/^(ภาพจำลอง|ภาพประกอบ)/.test(a) && a.includes(n)), n)
  const photos = [...ctx.matchAll(/class="up2-ctx__ph[^"]*"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(photos.length, 8)
  assert.equal((ctx.match(/class="up2-ctx__real">รูปจริงจากลูกค้า</g) || []).length, 4)
  const rest = spt.slice(0, at) + spt.slice(spt.indexOf('</section>', at))
  /* เทียบชื่อไฟล์เต็ม (lc11 ต้องไม่ชนกับ lc110 lc111 lc113) */
  for (const s of photos) assert.ok(!new RegExp(`${s.replace(/(-\d+)?\.webp$/, '')}(-\\d+)?\\.webp`).test(rest), `${s}: ไม่ซ้ำ`)
  assert.match(ctx, /id="up2-ctx-swim"[\s\S]*?<blockquote/, 'แท็บว่ายน้ำมีรีวิวจริง')
  assert.doesNotMatch(ctx, /NAPAWUT|finix/i)
})

test('กีฬา: แถวแบบเสื้อ = แบบเสื้อกีฬาจริง · แถวคนใส่ 4 รูป · แถวเสื้อตัวจริงขึ้นเสื้อกีฬาก่อน', () => {
  const show = spt.slice(spt.indexOf('id="real-work"'))
  assert.match(show, /id="show-designs"/)
  for (let i = 1; i <= 4; i++) { assert.match(show, new RegExp(`/img/use-worn/sport-${i}\\.webp`)); assert.ok(pub(`/img/use-worn/sport-${i}-540.webp`)) }
  const at = show.indexOf('id="show-real"')
  const first = [...show.slice(at).matchAll(/<img src="([^"]+)"/g)].slice(0, 2).map((m) => m[1])
  assert.deepEqual(first, ['reb', 'golf'].map((k) => `/img/use-real/sport-${k}.webp`))
})

test('กีฬา: รีวิวเฉพาะกลุ่มกีฬา · แถบโลโก้แถวแรกเป็นชมรมกีฬา · กล่องชำระเงินเป็นเสื้อกีฬา', () => {
  const rv = spt.slice(spt.indexOf('id="reviews"'), spt.indexOf('</section>', spt.indexOf('id="reviews"')))
  const ids = [...new Set([...rv.matchAll(/data-rv-open="([^"]+)"/g)].map((m) => m[1]))]
  assert.ok(ids.includes('swim-kids'))
  for (const id of ids) assert.ok(['swim-kids', 'krungthai-badminton', 'nt-snooker', 'np-connect'].includes(id), id)
  const logos = spt.slice(spt.indexOf('hm-marquee__track'), spt.indexOf('</ul>', spt.indexOf('hm-marquee__track')))
  const alts = [...logos.matchAll(/alt="([^"]+)"/g)].map((m) => m[1])
  assert.ok(alts.includes('GLO Darts Club') && alts.includes('EXAT Bowling Club'), alts.join(','))
  assert.match(spt, /\/img\/use-pay\/sport-box/)
})
