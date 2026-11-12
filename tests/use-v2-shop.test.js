/* /custom-staff-shirts/ ร้านค้า โฉมใหม่ · 11 พ.ย. 2026 อาร์ต "เริ่มหน้าร้านค้าได้เลย เอาหน้าบริษัทคือต้นแบบของหน้าประเภทลูกค้า"
   ใช้ partial ชุดเดียวกับ /corporate/ ทุกส่วน · ข้อมูลร้านค้า (use-pages.json shop + use-v2.json shop) · ห้ามมีคำของกลุ่มบริษัท
   รอภาพเจน (Magnific ใช้ไม่ได้ตอนทำ): hero + ฉากแท็บบริบท · คลังรีวิวยังไม่เปิด (รูปร้านค้า q3 ไม่พอ ไม่ซ้ำกับส่วนอื่น) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const order = (m) => [...m.matchAll(/<section class="([^"]*)"(?: id="([^"]*)")?/g)].map((x) => x[1].split(' ').filter((c) => /^(up2-|hm-show|hm-faq|hm-origin|hm-talk__card|hm-logowrap|hm-stats-band|rvw-sec)/.test(c) || x[2] === 'services')[0] || x[1])
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const shop = main('custom-staff-shirts')

test('ร้านค้า: ส่วนเรียงตามหน้าบริษัท (ยกเว้นคลังรีวิวที่รอรูป)', () => {
  const pending = new Set(['rvw-sec'])
  const want = order(main('corporate')).filter((c) => !pending.has(c))
  assert.deepEqual(order(shop).filter((c) => want.includes(c)), want)
  for (const id of ['plan', 'photos', 'work']) assert.doesNotMatch(shop, new RegExp(`<section[^>]*id="${id}"`), `ไม่มีส่วนเดิม #${id}`)
  for (const [, id] of shop.matchAll(/href="#([^"]+)"/g)) assert.ok(shop.includes(`id="${id}"`), `ลิงก์ #${id} ไม่มีปลายทาง`)
})

test('ร้านค้า: ไม่มีคำของกลุ่มบริษัท ทั้งในหน้าและข้อความ LINE', () => {
  /* ยกเว้น: ชื่อนิติบุคคลทีมดี · สถิติกลางของทีมดี "2,800+ องค์กร" (ทุกหน้าเหมือนกัน) · JSON ใน <script> ไม่แสดงบนหน้า */
  const body = text(shop.replace(/<script[\s\S]*?<\/script>/g, '')).replace(/บริษัท ดีดี ฟินิกซ์ จำกัด|2,800\s*\+?\s*องค์กร/g, '')
  assert.doesNotMatch(body, /บริษัท|องค์กร/, (body.match(/.{30}(บริษัท|องค์กร).{30}/) || [])[0])
  for (const [, href] of shop.matchAll(/href="(https:\/\/line\.me[^"]+)"/g)) assert.doesNotMatch(decodeURIComponent(href.replace(/&amp;/g, '&')), /บริษัท/, href)
})

test('ร้านค้า: รีวิวเฉพาะร้านค้า (resort) · กำแพงรูปเป็นรูปร้านค้าจริง ไม่ซ้ำกัน', () => {
  const rv = shop.slice(shop.indexOf('id="reviews"'), shop.indexOf('</section>', shop.indexOf('id="reviews"')))
  assert.deepEqual([...new Set([...rv.matchAll(/data-rv-open="([^"]+)"/g)].map((m) => m[1]))], ['resort'])
  assert.match(rv, /นอนเลชมจันทร์/)
  const wall = rv.slice(rv.indexOf('up2-rv__wall'), rv.indexOf('</ul>', rv.indexOf('up2-rv__wall')))
  const srcs = [...wall.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1])
  assert.ok(srcs.length >= 8, `กำแพงรูป ${srcs.length}`)
  assert.equal(new Set(srcs).size, srcs.length)
  const lib = JSON.parse(readFileSync('src/data/media-library.json', 'utf8')).items
  for (const s of srcs) { assert.ok(pub(s), s); const full = s.replace(/-(?:320|400|480)(?:-\d+)?\.webp$/, '.webp'); const it = lib.find((x) => x.path === full); assert.ok(it && (it.groups || []).includes('shop'), `${s}: รูปร้านค้าจากคลัง`) }
})

test('ร้านค้า: หัวข้อสีส้มตามข้อมูลร้านค้า · showroom ลิงก์แบบเสื้อพนักงานร้าน', () => {
  const hl = [...shop.matchAll(/<h2[^>]*>[\s\S]*?<span class="hm-hl">([\s\S]*?)<\/span><\/span>[\s\S]*?<\/h2>/g)].map((m) => text(m[1]).trim())
  for (const t of ['ไว้วางใจทีมดี', 'พนักงานต้องใส่ทำงานได้ทั้งวัน', 'งานของคุณ', 'เหมาะกับทีม?', 'ผู้ดูแลทีมบริการ', 'เสื้อพนักงานร้านค้าที่ผลิตจริง', 'กับทีมดี?', 'เสื้อพนักงานร้านค้า']) assert.ok(hl.includes(t), `${t} · ได้ ${hl.join(' | ')}`)
  const show = shop.slice(shop.indexOf('id="real-work"'))
  assert.match(show, /href="\/staff-shirt-designs\/"/)
  for (const [, s] of show.slice(0, show.indexOf('</section>')).matchAll(/<img src="([^"]+)"/g)) assert.ok(pub(s), s)
})

/* 11 พ.ย. hero แบนเนอร์แบบหน้าบริษัท (GPT 2.5 อ้างอิง banner-team · เสื้อลอย = แบบร้านค้าจริง PISPENG / GS VARTA / LENSO MOTUL / โปโลดำปักตราทอง) */
test('ร้านค้า: hero แบนเนอร์ 2304×800 + ภาพมือถือ 3:4 ของร้านค้า · ไม่มีสารบัญ/แถบสรุปใต้ hero', () => {
  const at = shop.indexOf('<section class="band-hero up2-hero')
  assert.ok(at >= 0, 'hero โฉมใหม่')
  const hero = shop.slice(at, shop.indexOf('</section>', at))
  assert.match(hero, /\/img\/use-hero\/shop-2304\.webp/); assert.match(hero, /width="2304" height="800"/)
  assert.match(hero, /\/img\/use-hero\/shop-m-768\.webp/)
  assert.doesNotMatch(hero, /corp-/)
  for (const f of ['shop-2304', 'shop-1280', 'shop-800', 'shop-m-768', 'shop-m-480']) assert.ok(pub(`/img/use-hero/${f}.webp`), f)
  assert.match(text(hero), /รับทำเสื้อพนักงานร้านค้า/)
  assert.doesNotMatch(shop, /data-toc|class="pp-strip/, 'ไม่มีสารบัญ/แถบสรุปเดิม')
})

/* 11 พ.ย. อาร์ต "ระหว่างอันนี้มีอันนึงที่หายไป ทำอันนี้ให้ด้วย" (ระหว่างปัญหาคนสั่งกับบริการ) → แท็บบริบทงานร้านค้า 5 แท็บ
   ฉากไดโอรามาสูตร d5 (AI ทำเฉพาะฉาก + วางเสื้อจริงจากไฟล์แบบ) · รูปจริงร้านค้า 2 รูป/แท็บ · เสื้อบนแท่นไม่ซ้ำ hero และ showroom */
test('ร้านค้า: แท็บบริบท 3 ประเภทร้านที่มีแบบจริง · ฉากร้านค้า · รูปจริงร้านค้า 2 รูป · alt บอกภาพจำลอง · ไม่ซ้ำรูปอื่น', () => {
  const at = shop.indexOf('<section class="up2-ctx"')
  assert.ok(at > shop.indexOf('id="up2-pain"') && at < shop.indexOf('id="services"'), 'อยู่ระหว่างปัญหาคนสั่งกับบริการ')
  const ctx = shop.slice(at, shop.indexOf('</section>', at))
  const tabs = [...ctx.matchAll(/role="tab"[^>]*id="up2-ctx-tab-([a-z]+)"/g)].map((m) => m[1])
  assert.deepEqual(tabs, ['retail', 'parts', 'car'])
  for (const t of tabs) for (const f of ['1200', '760', '480', 'thumb']) assert.ok(pub(`/img/use-ctx/shop-${t}-${f}.webp`), `shop-${t}-${f}`)
  const scenes = [...ctx.matchAll(/class="up2-ctx__img" src="([^"]+)"[^>]*alt="([^"]+)"/g)]
  assert.equal(scenes.length, 3); for (const [, , alt] of scenes) assert.match(alt, /^ภาพจำลอง/)
  const lib = JSON.parse(readFileSync('src/data/media-library.json', 'utf8')).items
  const photos = [...ctx.matchAll(/class="up2-ctx__ph[^"]*"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(photos.length, 6)
  for (const s of photos) { const full = s.replace(/-(?:320|400|480)\.webp$/, '.webp'); assert.ok((lib.find((x) => x.path === full)?.groups || []).includes('shop'), `${s}: รูปร้านค้า`) }
  const rest = shop.slice(0, at) + shop.slice(shop.indexOf('</section>', at))
  for (const s of photos) assert.ok(!rest.includes(s.replace(/(-\d+)?\.webp$/, '')), `${s}: ไม่ซ้ำส่วนอื่น`)
  /* อาร์ต "ห้ามมั่ว": เสื้อบนแท่น = แบบร้านค้าที่ยืนยันชื่องานแล้ว · alt ระบุชื่อร้าน */
  for (const n of ['Coin Museum Shop', 'บ้านแบตเตอรี่รถยนต์', 'AUTO QUIKS']) assert.ok(scenes.some(([, , alt]) => alt.includes(n)), n)
  for (const [, href] of ctx.matchAll(/href="(https:\/\/line\.me[^"]+)"/g)) assert.match(decodeURIComponent(href.replace(/&amp;/g, '&')), /เสื้อพนักงานร้านค้า/)
})
