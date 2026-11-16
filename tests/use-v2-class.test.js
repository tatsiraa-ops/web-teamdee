/* /custom-class-shirts/ เสื้อรุ่น / เสื้อชมรม โฉมใหม่ · 14 พ.ย. 2026 อาร์ต "ทำหน้าเสื้อรุ่นต่อเลย" → "ทำตามแผน ~1,405"
   โครงเดียวกับหน้าคณะ · เสื้อบนแท่น/ใน hero = เสื้อจริงในคลัง Packshot (คริสเตียน 137 · โปโลลายเลขไทย ๖๐ · WARRIORS ESPORTS · BHS CREW CLASS OF 2026)
   ไม่มีรีวิวลูกค้ากลุ่มนี้ → ไม่มีการ์ดรีวิว · ไฟล์แบบเสื้อรุ่นจริงมีแบบเดียว → ไม่มีแถวแบบเสื้อ (มีแถวคนใส่ + ภาพถ่ายเสื้อจริง)
   ตัดออก: COOP KORAT (สหกรณ์) · เสื้อกอล์ฟ (ตราคล้ายหน่วยงาน) · เสื้อโบว์ลิ่ง (โลโก้ Finix) · Aespa (ชื่อวงดนตรีจริง) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const order = (m) => [...m.matchAll(/<section class="([^"]*)"(?: id="([^"]*)")?/g)].map((x) => x[1].split(' ').filter((c) => /^(up2-|hm-show|hm-faq|hm-origin|hm-talk__card|hm-logowrap|hm-stats-band|rvw-sec)/.test(c) || x[2] === 'services')[0] || x[1])
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const cls = main('custom-class-shirts')
const fac = main('custom-university-shirts')

/* 16 พ.ย. 2026 คลังรีวิวเดียว (review-pool.js): หน้าเสื้อรุ่นมีส่วนรีวิวแล้ว (รีวิวจริงจากกลุ่มอื่น · หัวข้อกลาง) */
test('รุ่น: ส่วนเรียงตามหน้าคณะ · ไม่มีส่วนเดิม · ลิงก์ในหน้ามีปลายทาง', () => {
  assert.deepEqual(order(cls), order(fac))
  for (const id of ['plan', 'photos', 'work']) assert.doesNotMatch(cls, new RegExp(`<section[^>]*id="${id}"`))
  assert.match(cls, /<section class="hm-customer-proof up2-rv" id="reviews"/)
  for (const [, id] of cls.matchAll(/href="#([^"]+)"/g)) assert.ok(cls.includes(`id="${id}"`), `#${id}`)
  assert.match(cls, /id="class-review-wall"/)
})

test('รุ่น: hero ภาพเสื้อรุ่น · ไม่มีคำของกลุ่มร้านค้า/หน่วยงาน', () => {
  const at = cls.indexOf('<section class="band-hero up2-hero')
  const hero = cls.slice(at, cls.indexOf('</section>', at))
  for (const f of ['class-2304', 'class-1280', 'class-800', 'class-m-768', 'class-m-480']) { assert.match(hero, new RegExp(`/img/use-hero/${f}\\.webp`)); assert.ok(pub(`/img/use-hero/${f}.webp`), f) }
  assert.doesNotMatch(hero, /corp-|shop-|gov-|edu-|faculty-/)
  /* 16 พ.ย. 2026 รีวิวข้ามกลุ่ม (review-pool.js · อาร์ต "คนละประเภทลูกค้าไม่เป็นไร"): ป้ายประเภทลูกค้าในรีวิว (เช่น "หน่วยงานโรงพยาบาล") ไม่นับ · ตรวจเฉพาะข้อความของหน้า */
  const body = text(cls.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<section class="hm-customer-proof up2-rv"[\s\S]*?<\/section>|<blockquote class="up2-ctx__rv">[\s\S]*?<\/blockquote>/g, ''))
  assert.doesNotMatch(body, /ร้านค้า|หน่วยงาน/, (body.match(/.{30}(ร้านค้า|หน่วยงาน).{30}/) || [])[0])
})

test('รุ่น: แท็บ 4 ประเภท จากเสื้อจริง · รูปจริงไม่ซ้ำส่วนอื่น · ป้ายบอกชนิดรูป', () => {
  const at = cls.indexOf('<section class="up2-ctx"')
  const ctx = cls.slice(at, cls.indexOf('</section>', at))
  const TABS = ['reunion', 'party', 'esports', 'classof']
  assert.deepEqual([...ctx.matchAll(/role="tab"[^>]*id="up2-ctx-tab-([a-z]+)"/g)].map((m) => m[1]), TABS)
  assert.match(ctx, /class="up2-ctx__shelf"[^>]*style="--n:4"/)
  for (const t of TABS) for (const f of ['1200', '760', '480', 'thumb']) assert.ok(pub(`/img/use-ctx/class-${t}-${f}.webp`), `class-${t}-${f}`)
  const alts = [...ctx.matchAll(/class="up2-ctx__img"[^>]*alt="([^"]+)"/g)].map((m) => m[1])
  for (const n of ['คริสเตียน 137', '๖๐', 'WARRIORS ESPORTS', 'BHS CREW']) assert.ok(alts.some((a) => a.startsWith('ภาพจำลอง') && a.includes(n)), n)
  const photos = [...ctx.matchAll(/class="up2-ctx__ph[^"]*"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(photos.length, 8)
  assert.equal((ctx.match(/class="up2-ctx__real">ภาพถ่ายเสื้อจริง</g) || []).length, 2)
  assert.equal((ctx.match(/class="up2-ctx__real">รูปจริงจากลูกค้า</g) || []).length, 2)
  for (const s of photos.filter((x) => x.includes('/use-real/'))) assert.ok(pub(s), s)
  const rest = cls.slice(0, at) + cls.slice(cls.indexOf('</section>', at))
  for (const s of photos) assert.ok(!rest.includes(s.replace(/(-\d+)?\.webp$/, '')), `${s}: ไม่ซ้ำ`)
  assert.doesNotMatch(ctx, /COOP KORAT|aespa|finix/i)
  /* ฉาก BHS ของหน้านี้เป็นภาพใหม่ ไม่ใช้ฉากเดียวกับหน้าโรงเรียน */
  assert.doesNotMatch(ctx, /edu-batch/)
})

test('รุ่น: ไม่มีแถวแบบเสื้อ · แถวคนใส่ = ภาพจำลอง 4 รูป · แถวเสื้อตัวจริงขึ้นเสื้อรุ่น/ชมรมก่อน', () => {
  const show = cls.slice(cls.indexOf('id="real-work"'))
  assert.doesNotMatch(show, /id="show-designs"/)
  for (let i = 1; i <= 4; i++) { assert.match(show, new RegExp(`/img/use-worn/class-${i}\\.webp`)); assert.ok(pub(`/img/use-worn/class-${i}-540.webp`)) }
  assert.match(show, /alt="ภาพจำลอง: [^"]*คริสเตียน 137/)
  const at = show.indexOf('id="show-real"')
  const first = [...show.slice(at).matchAll(/<img src="([^"]+)"/g)].slice(0, 4).map((m) => m[1])
  assert.deepEqual(first, ['christian', 'sixty', 'warriors', 'bhs'].map((k) => `/img/use-real/class-${k}.webp`))
})

test('รุ่น: กล่องชำระเงินเป็นเสื้อรุ่น · คลังรูปลูกค้าจริงพอ', () => {
  assert.match(cls, /\/img\/use-pay\/class-box/)
  const wall = cls.slice(cls.indexOf('id="class-review-wall"'), cls.indexOf('</section>', cls.indexOf('id="class-review-wall"')))
  assert.ok((wall.match(/<li class="rvw__ph"/g) || []).length >= 12, 'คลังรูปเยอะพอ')
})
