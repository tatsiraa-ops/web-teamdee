/* /custom-university-shirts/ เสื้อคณะ / เสื้อมหาวิทยาลัย โฉมใหม่ · 14 พ.ย. 2026 อาร์ต "ทำหน้าเสื้อคณะต่อเลย" → เลือก "ทำเต็ม + แถวคนใส่"
   โครงเดียวกับหน้าโรงเรียน · เสื้อบนแท่น/ใน hero = เสื้อจริงในคลัง Packshot (SOCIAL SCIENCES · MAHIDOL NAKHONSAWAN · SIT KMUTT · FRESHY GAME RSU · KMUTNB DET'20)
   ไม่มีรีวิวของลูกค้ากลุ่มคณะในคลัง → ไม่มีการ์ดรีวิว (มีแต่คลังรูปลูกค้าจริง) · ตัด F1 จุฬา (โลโก้ Finix + สปอนเซอร์) · ไม่ใช้ด้านหลังเสื้อ Freshy (มีชื่อคน) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const order = (m) => [...m.matchAll(/<section class="([^"]*)"(?: id="([^"]*)")?/g)].map((x) => x[1].split(' ').filter((c) => /^(up2-|hm-show|hm-faq|hm-origin|hm-talk__card|hm-logowrap|hm-stats-band|rvw-sec)/.test(c) || x[2] === 'services')[0] || x[1])
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const fac = main('custom-university-shirts')
const edu = main('education')

/* 16 พ.ย. 2026 คลังรีวิวเดียว (review-pool.js): หน้าคณะมีส่วนรีวิวแล้ว (รีวิวจริงจากกลุ่มอื่น · หัวข้อกลาง) → เรียงเหมือนหน้าโรงเรียนทุกส่วน */
test('คณะ: ส่วนเรียงตามหน้าโรงเรียน · ไม่มีส่วนเดิม · ลิงก์ในหน้ามีปลายทาง', () => {
  assert.deepEqual(order(fac), order(edu))
  for (const id of ['plan', 'photos', 'work']) assert.doesNotMatch(fac, new RegExp(`<section[^>]*id="${id}"`))
  assert.match(fac, /<section class="hm-customer-proof up2-rv" id="reviews"/)
  for (const [, id] of fac.matchAll(/(?<!<use )href="#([^"]+)"/g)) assert.ok(fac.includes(`id="${id}"`), `#${id}`)
  assert.match(fac, /id="faculty-review-wall"/)
})

test('คณะ: hero ภาพคณะ · ไม่มีคำของกลุ่มร้านค้า/หน่วยงาน', () => {
  const at = fac.indexOf('<section class="band-hero up2-hero')
  const hero = fac.slice(at, fac.indexOf('</section>', at))
  for (const f of ['faculty-2304', 'faculty-1280', 'faculty-800', 'faculty-m-768', 'faculty-m-480']) { assert.match(hero, new RegExp(`/img/use-hero/${f}\\.webp`)); assert.ok(pub(`/img/use-hero/${f}.webp`), f) }
  assert.doesNotMatch(hero, /corp-|shop-|gov-|edu-/)
  /* 16 พ.ย. 2026 รีวิวข้ามกลุ่ม (review-pool.js · อาร์ต "คนละประเภทลูกค้าไม่เป็นไร"): ป้ายประเภทลูกค้าในรีวิว (เช่น "หน่วยงานโรงพยาบาล") ไม่นับ · ตรวจเฉพาะข้อความของหน้า */
  const body = text(fac.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<section class="hm-customer-proof up2-rv"[\s\S]*?<\/section>|<blockquote class="up2-ctx__rv">[\s\S]*?<\/blockquote>/g, ''))
  assert.doesNotMatch(body, /ร้านค้า|หน่วยงาน/, (body.match(/.{30}(ร้านค้า|หน่วยงาน).{30}/) || [])[0])
})

test('คณะ: แท็บ 5 ประเภท จากเสื้อจริง · รูปจริงไม่ซ้ำส่วนอื่น · ป้ายบอกชนิดรูป', () => {
  const at = fac.indexOf('<section class="up2-ctx"')
  const ctx = fac.slice(at, fac.indexOf('</section>', at))
  const TABS = ['major', 'polo', 'sports', 'freshy', 'dept']
  assert.deepEqual([...ctx.matchAll(/class="up2-ctx__pick" id="up2-ctx-tab-([a-z]+)"/g)].map((m) => m[1]), TABS)
  assert.match(ctx, /class="up2-ctx__shelf"[^>]*style="--n:5"/)
  for (const t of TABS) for (const f of ['1200', '760', '480', 'thumb']) assert.ok(pub(`/img/use-ctx/faculty-${t}-${f}.webp`), `faculty-${t}-${f}`)
  const alts = [...ctx.matchAll(/class="up2-ctx__img"[^>]*alt="([^"]+)"/g)].map((m) => m[1])
  for (const n of ['SOCIAL SCIENCES', 'MAHIDOL NAKHONSAWAN', 'SIT KMUTT', 'FRESHY GAME', 'KMUTNB']) assert.ok(alts.some((a) => !/^(ภาพจำลอง|ภาพประกอบ)/.test(a) && a.includes(n)), n)
  const photos = [...ctx.matchAll(/class="up2-ctx__ph[^"]*"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(photos.length, 10)
  assert.equal((ctx.match(/class="up2-ctx__real">ภาพถ่ายเสื้อจริง</g) || []).length, 2)
  assert.equal((ctx.match(/class="up2-ctx__real">รูปจริงจากลูกค้า</g) || []).length, 3)
  for (const s of photos.filter((x) => x.includes('/use-real/'))) assert.ok(pub(s), s)
  const rest = fac.slice(0, at) + fac.slice(fac.indexOf('</section>', at))
  for (const s of photos) assert.ok(!rest.includes(s.replace(/(-\d+)?\.webp$/, '')), `${s}: ไม่ซ้ำ`)
  assert.doesNotMatch(ctx, /NAPHAT|F1 จุฬา|finix/i)
})

test('คณะ: แถวแบบเสื้อ = ไฟล์แบบมหาวิทยาลัยจริง · แถวคนใส่ = ภาพจำลอง 4 รูป · แถวเสื้อตัวจริงขึ้นเสื้อคณะก่อน', () => {
  const show = fac.slice(fac.indexOf('id="real-work"'))
  for (const d of ['embroider-015', 'embroider-027', 'embroider-031']) assert.match(show, new RegExp(`/img/design-front/${d}`))
  for (let i = 1; i <= 4; i++) { assert.match(show, new RegExp(`/img/use-worn/faculty-${i}\\.webp`)); assert.ok(pub(`/img/use-worn/faculty-${i}-540.webp`)) }
  assert.match(show, /alt="[^"]*LAW STOU/); assert.doesNotMatch(show, /alt="ภาพจำลอง/)
  const at = show.indexOf('id="show-real"')
  const first = [...show.slice(at).matchAll(/<img src="([^"]+)"/g)].slice(0, 4).map((m) => m[1])
  assert.deepEqual(first, ['socsci', 'mahidol', 'kmutt', 'kmutnb'].map((k) => `/img/use-real/faculty-${k}.webp`))
})

test('คณะ: แถบโลโก้แถวแรกเป็นมหาวิทยาลัย · กล่องชำระเงินเป็นเสื้อคณะ · คลังรูปลูกค้าจริงพอ', () => {
  const logos = fac.slice(fac.indexOf('hm-marquee__track'), fac.indexOf('</ul>', fac.indexOf('hm-marquee__track')))
  const alts = [...logos.matchAll(/alt="([^"]+)"/g)].map((m) => m[1])
  assert.ok(alts.length >= 6 && alts.every((a) => /มหาวิทยาลัย|จุฬาลงกรณ์|คณะ/.test(a)), alts.join(','))
  assert.match(fac, /\/img\/use-pay\/faculty-box/)
  const wall = fac.slice(fac.indexOf('id="faculty-review-wall"'), fac.indexOf('</section>', fac.indexOf('id="faculty-review-wall"')))
  assert.ok((wall.match(/<li class="rvw__ph"/g) || []).length >= 12, 'คลังรูปเยอะพอ')
})
