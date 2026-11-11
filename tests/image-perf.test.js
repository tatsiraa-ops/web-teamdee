import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, statSync } from 'node:fs'

/* รูป/ความเร็ว รอบ 30 ต.ค. (audit H19–H22) · วัดขนาดที่แสดงจริงในเบราว์เซอร์ที่ 375/600/820/1024/1440 */
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const pub = (p) => new URL(`../public${p}`, import.meta.url)

test('srcset ที่เขียนตรงในเทมเพลต ชี้ไฟล์ที่มีอยู่จริงทุกไฟล์', () => {
  const files = ['src/partials/heroTeam.hbs', 'src/partials/homeReference-teamdee-location.hbs', 'src/partials/homeOriginStory.hbs' /* 9 พ.ย. แยกเรื่องราว+การ์ดบริษัทออกมาใช้ร่วมกับ /about-us/ */, 'src/partials/homeReference-process.hbs', 'src/partials/homeReference-home-stories.hbs', 'site/index.html']
  let n = 0
  for (const f of files) {
    for (const [, set] of read(f).matchAll(/\ssrcset="([^"]+)"/g)) {
      for (const part of set.split(',')) {
        const url = part.trim().split(/\s+/)[0]
        if (!url.startsWith('/img/')) continue
        n++
        assert.ok(existsSync(pub(url)), `${f}: ${url}`)
      }
    }
  }
  /* 3 พ.ย.: ตัดแกลเลอรีเรื่องราวหน้าแรกออก (อาร์ต "เยอะเต็มไปหมด") จำนวน srcset ลดจาก 20+ เหลือ ~13 · เกณฑ์นี้แค่กันเทสไม่เจออะไรเลย */
  /* 3 พ.ย. รอบ 2: ส่วนดูแลงานเหลือภาพเดียว (เดิม 3 รูป) → ~9 */
  assert.ok(n >= 8, `เจอ ${n} ไฟล์`)
})

test('hero หน้าแรก (สไลด์แบนเนอร์ 3 พ.ย.): ภาพแรกโหลดก่อน ภาพถัดไป lazy · มีไฟล์ 1280 กับ 2304 ให้จอคอมทั่วไปกับจอ DPR2', () => {
  const h = read('src/partials/heroTeam.hbs')
  const img = h.match(/<img class="th-front th-slide__img"[^>]*>/)[0]
  assert.match(img, /1280w/)
  assert.match(img, /2304w/)
  /* 3 พ.ย. อาร์ต "แสดงเต็มๆ ไม่ต้องเอากรอบ" → ภาพกว้างเต็มจอ */
  assert.match(img, /sizes="100vw"/)
  assert.match(img, /\{\{#if @first\}\} fetchpriority="high"\{\{else\}\} loading="lazy"\{\{\/if\}\}/)
  for (const n of ['team', 'sport']) for (const w of [1280, 2304]) assert.ok(existsSync(pub(`/img/hero/banner-${n}-${w}.webp`)), `${n}-${w}`)
})
test('ปกบทความ/คู่มือล็อกกรอบ 16:9 ตรงกับ width/height ในแท็ก (กัน CLS ~150px)', () => {
  const css = read('src/styles/article-reader.css')
  const rule = css.match(/\.td-reader__cover img \{[^}]+\}/)[0]
  assert.match(rule, /aspect-ratio: 16 \/ 9/)
  assert.match(rule, /object-fit: cover/)
  assert.match(read('src/partials/articlePage.hbs'), /width="1200" height="675"/)
})

test('รูปผ้า 64px มีไฟล์ -160/-320 ครบทุกผ้า และไฟล์ 160 เล็กจริง', () => {
  const { fabrics } = JSON.parse(read('src/data/sizing.json'))
  for (const f of fabrics.filter((x) => x.img)) {
    const base = f.img.replace(/\.\w+$/, '')
    for (const w of [160, 320]) assert.ok(existsSync(pub(`${base}-${w}.webp`)), `${base}-${w}`)
    assert.ok(statSync(pub(`${base}-160.webp`)).size < 8000, `${base}-160 เกิน 8KB`)
  }
  assert.match(read('src/partials/ppFabric.hbs'), /data-sizes="64px"/)
})

test('alt รูปลูกค้าหน้าแรกใช้ occ เมื่อยังไม่มี alt · โลโก้ /project/ ใช้ alt จากข้อมูลเมื่อมี', () => {
  /* 3 พ.ย. รอบ 2: โชว์รูมผลงานเหลือ 4 ประเภทงาน (รูปเสื้อบนหุ่น) · กำแพงรูปลูกค้าตัดออก → ตรวจว่ารูปในโชว์รูมมี alt ครบ */
  const html = read('dist-wp/index.html')
  /* 10 พ.ย. ส่วนผลงานบนหุ่นหน้าแรกเปลี่ยนเป็นคลังรีวิว (reviewWall) → ตรวจ alt รูปลูกค้าในคลังรีวิว */
  const sec = html.slice(html.indexOf('id="review-wall"'), html.indexOf('</section>', html.indexOf('id="review-wall"')))
  const alts = [...sec.matchAll(/<li class="rvw__ph"[^>]*><img [^>]*alt="([^"]*)"/g)].map((x) => x[1])
  assert.ok(alts.length >= 60)
  for (const a of alts) assert.ok(a.trim().length > 3, `alt ว่าง: "${a}"`)
  /* รอบ 165: โลโก้ /project/ ใช้ชิ้นโลโก้วิ่งของหน้าแรก (hm-marquee) · แถวจริงใช้ alt ชื่อลูกค้าจากข้อมูล · แถวซ้ำซ่อนจากโปรแกรมอ่านจอ */
  assert.match(read('site/project/index.html'), /<ul class="hm-marquee__track" aria-label="โลโก้ลูกค้า แถว \{\{inc @index\}\}">\{\{#each this\}\}\{\{#if this\.img\}\}<li><img src="\{\{this\.img\}\}" alt="\{\{this\.alt\}\}"/)
})

test('/blog/: รูปปกหลักโหลดก่อน เรื่องรองและการ์ดอื่น lazy', () => {
  const b = read('site/blog/index.html')
  const imgs = [...b.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  assert.match(imgs[0], /fetchpriority="high"/)
  assert.doesNotMatch(imgs[0], /loading="lazy"/)
  for (const t of imgs.slice(1)) assert.match(t, /loading="lazy"/, t)
})
