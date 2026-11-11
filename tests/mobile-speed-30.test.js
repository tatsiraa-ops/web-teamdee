/* ความเร็วมือถือ 4 จุด (audit 30 ต.ค.) · รูปรีวิว /project/ · รูปการ์ดแนะนำที่ยังซ่อน · รูปลูกค้า /embroidery/ · preload ฟอนต์ไทย */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { loadPics } from '../src/js/nudge.js'
import { fontPreloadTag, injectFontPreload } from '../scripts/lib/font-preload.mjs'
import { makeRewrite } from '../scripts/wp-rewrite.mjs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const pub = (p) => new URL(`../public${p}`, import.meta.url)
const vite = read('vite.config.js')

/* 1. /project/ รูปรีวิวในแถวเลื่อน + รูปเล็กในโมเสกเรื่องราว: เดิมไฟล์ -480 (~40KB) ในช่องกว้าง 96–132px */
test('รูปรีวิวทุกรูปมีไฟล์ย่อ -480-320 / -480-400 (ย่อจากไฟล์ -480 · srcset ไม่เกิน 480) และเล็กกว่าไฟล์ -480 จริง', () => {
  const { items } = JSON.parse(read('src/data/reviews.json'))
  const imgs = new Set(items.flatMap((r) => [r.img, ...(r.gallery || []).map((g) => g.img)]).filter(Boolean))
  assert.ok(imgs.size >= 30, `เจอ ${imgs.size} รูป`)
  for (const img of imgs) {
    const base = img.replace(/\.webp$/, '-480')
    for (const w of [320, 400]) {
      assert.ok(existsSync(pub(`${base}-${w}.webp`)), `${base}-${w}.webp`)
      assert.ok(statSync(pub(`${base}-${w}.webp`)).size < statSync(pub(`${base}.webp`)).size, `${base}-${w} ไม่เล็กกว่า -480`)
    }
  }
})

test('/project/: แถวรีวิวได้ srcset จาก data-sizes (addSrcset · ตั้งจากไฟล์ -480) · หน้าแรกยังใช้ไฟล์ -480 เหมือนเดิม', () => {
  const mini = read('src/partials/reviewMini.hbs')
  assert.match(mini, /<img src="\{\{this\.imgSmall\}\}"\{\{#if sizes\}\} data-sizes="\{\{sizes\}\}"\{\{\/if\}\}/)
  /* รอบ 169c: /project/ เลิกแถวรีวิวเลื่อน → กระดานรีวิว (projectReviews) · รูปวงกลมใช้ไฟล์ -480-160 · โมเสกช่องเล็กส่ง data-sizes */
  const pr = read('src/partials/projectReviews.hbs')
  assert.match(pr, /background-image:url\(\{\{this\.thumb\}\}\)/)
  assert.match(pr, /data-sizes="\(min-width:1024px\) 240px, 33vw"/)
  assert.match(read('site/project/index.html'), /\{\{> projectReviews /)
  assert.doesNotMatch(read('src/partials/homeReference-reviews.hbs'), /thumbSizes/)
})

test('/project/: รูปใหญ่ในกระดานรีวิวใช้ srcset ไฟล์ -480/1200 (รอบ 169c แทนโมเสกเรื่องราวเดิม)', () => {
  const s = read('src/partials/projectReviews.hbs')
  assert.match(s, /srcset="\{\{this\.imgSmall\}\} 480w, \{\{this\.img\}\} 1200w"/)
})

/* 2. การ์ดแนะนำมุมซ้ายล่าง: รูป 3 รูปไม่ควรโหลดตอนการ์ดยังซ่อน */
test('การ์ดแนะนำ: รูปใช้ data-src ในเทมเพลตตรงๆ (ไม่มี src ก่อนการ์ดโชว์)', () => {
  const fl = read('src/partials/floats.hbs')
  assert.match(fl, /<img data-src="\{\{this\.img\}\}" alt="" width="112" height="112" decoding="async">/)
  assert.doesNotMatch(fl, /nudge__pic[^\n]*\n\s*\{\{#if this\.img\}\}<img src=/)
})

test('loadPics: ตั้ง src จาก data-src เฉพาะรูปในการ์ดที่โชว์ · รูปที่มี src แล้วไม่แตะ', () => {
  const img = (data) => ({ dataset: { src: data }, src: '', removeAttribute(n) { if (n === 'data-src') delete this.dataset.src } })
  const a = img('/img/a.webp')
  const el = { querySelectorAll: (sel) => (sel === 'img[data-src]' ? [a].filter((x) => x.dataset.src) : []) }
  loadPics(el)
  assert.equal(a.src, '/img/a.webp')
  assert.equal(a.dataset.src, undefined)
  loadPics(el)
  assert.equal(a.src, '/img/a.webp')
  loadPics(null)
})

test('nudge.js โหลดรูปตอนโชว์การ์ด', () => {
  const js = read('src/js/nudge.js')
  const show = js.match(/const show = \(n\) => \{[\s\S]*?\n  \}/)[0]
  assert.match(show, /loadPics\(items\[n\]\)/)
})

/* 3. /embroidery/ แกลเลอรีลูกค้าองค์กร: ไฟล์ 640px ในช่องกว้าง 164–182px (มือถือ) */
test('/embroidery/: รูปแกลเลอรีและรูปหลักใน hero ได้ srcset จาก data-sizes · รูปหลักยัง fetchpriority=high', () => {
  /* ย้ายจาก poloV3 → แม่แบบ v22 (2 พ.ย.): แกลเลอรี = ppWork · รูปหลัก = ppHero */
  const real = read('src/partials/ppWork.hbs').match(/<ul class="pp-real">[\s\S]*?<\/ul>/)[0]
  assert.match(real, /<img src="\{\{this\.img\}\}" data-sizes="[^"]+"/)
  assert.match(read('src/partials/ppHero.hbs'), /<img src="\{\{heroPhoto\.img\}\}" data-sizes="[^"]+"[^>]*fetchpriority="high"/)
  /* มือถือ 375 DPR2: ช่อง 164px ต้องการ 328px (ไฟล์ 320 ไม่พอ Chrome เลือก 640) → มีไฟล์ -400 · รูปหลัก ~224px ต้องการ 448 → มี -480 */
  for (const c of ['co01', 'co05', 'co07', 'co10', 'co12', 'co14']) for (const w of [320, 400]) {
    assert.ok(existsSync(pub(`/img/customer/${c}-${w}.webp`)), `${c}-${w}`)
    assert.ok(statSync(pub(`/img/customer/${c}-${w}.webp`)).size < statSync(pub(`/img/customer/${c}.webp`)).size, `${c}-${w} ไม่เล็กกว่า 640`)
  }
  for (const w of [320, 480]) assert.ok(existsSync(pub(`/img/customer/co13-${w}.webp`)), `co13-${w}`)
})

/* 4. preload ฟอนต์ไทย (ชุด thai) ด้วยชื่อไฟล์จริงหลัง Vite ใส่ hash */
test('fontPreloadTag: หาไฟล์ฟอนต์ไทยที่ hash แล้วจาก bundle · ไม่เจอ = ไม่ใส่', () => {
  const names = ['assets/noto-sans-thai-latin-N3v1vcg9.woff2', 'assets/noto-sans-thai-thai-DvQ_ZkZP.woff2', 'assets/page-x.js']
  assert.equal(fontPreloadTag(names), '<link rel="preload" href="/assets/noto-sans-thai-thai-DvQ_ZkZP.woff2" as="font" type="font/woff2" crossorigin>')
  assert.equal(fontPreloadTag(['assets/page-x.js']), '')
})

test('injectFontPreload: ใส่ก่อน stylesheet ตัวแรกครั้งเดียว · ไม่มี stylesheet = ก่อน </head>', () => {
  const tag = '<link rel="preload" href="/assets/noto-sans-thai-thai-A.woff2" as="font" type="font/woff2" crossorigin>'
  const html = '<head>\n<meta charset="utf-8">\n<link rel="stylesheet" crossorigin href="/assets/a.css">\n<link rel="stylesheet" href="/assets/b.css">\n</head>'
  const out = injectFontPreload(html, tag)
  assert.equal(out.split(tag).length, 2)
  assert.ok(out.indexOf(tag) < out.indexOf('a.css'))
  assert.equal(injectFontPreload(out, tag), out)
  assert.match(injectFontPreload('<head><title>x</title></head>', tag), new RegExp(`${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</head>`))
  assert.equal(injectFontPreload(html, ''), html)
})

test('preload ฟอนต์: vite.config มีปลั๊กอิน · export ธีม WP แปลง href เข้าโฟลเดอร์ธีม · head.hbs ไม่อ้างว่าไม่มี preload แล้ว', () => {
  assert.match(vite, /fontPreloadTag/)
  assert.match(vite, /injectFontPreload/)
  const rw = makeRewrite({ themeUrl: '/wp-content/themes/teamdee/build', baseUrl: 'https://team-dee.com' })
  assert.equal(rw('<link rel="preload" href="/assets/noto-sans-thai-thai-A.woff2" as="font" type="font/woff2" crossorigin>'), '<link rel="preload" href="/wp-content/themes/teamdee/build/assets/noto-sans-thai-thai-A.woff2" as="font" type="font/woff2" crossorigin>')
  assert.doesNotMatch(read('src/partials/head.hbs'), /ไม่ใส่ preload/)
})
