/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A8: รูปแชร์ (og:image) เดิมเป็น WebP 46/47 หน้า (LINE/FB บางแอปไม่แสดง) · บางหน้าแนวตั้ง/2.88:1 โดนครอปหนัก · 7 หน้าใช้รูปเดียวกัน
   → JPG 1200×630 รายหน้า public/img/og/<slug>.jpg (สร้างด้วย scripts/make-og.py จากรูปที่หน้านั้นใช้อยู่) · build ใช้ไฟล์นี้เมื่อมี + บอกขนาด */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const pages = JSON.parse(readFileSync(new URL('../wp-theme/teamdee/build/pages.json', import.meta.url), 'utf8')).pages
const head = (slug) => readFileSync(new URL(`../wp-theme/teamdee/build/pages/${slug}.head.html`, import.meta.url), 'utf8')

test('ทุกหน้าที่ index ได้: og:image เป็น JPG 1200×630 · twitter:image ตรงกัน · ไฟล์มีจริง', () => {
  const bad = []
  for (const [route, p] of Object.entries(pages)) {
    if (!route.startsWith('/') || /noindex/.test(p.robots || '')) continue
    const h = head(p.slug)
    const og = (h.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || ''
    const tw = (h.match(/<meta name="twitter:image" content="([^"]+)"/) || [])[1] || ''
    const file = (og.match(/(\/img\/og\/[^"]+\.jpg)$/) || [])[1]
    if (!file) { bad.push(`${route}: ${og.split('/').pop()}`); continue }
    if (!existsSync(new URL(`../public${file}`, import.meta.url))) bad.push(`${route}: ไม่มีไฟล์ ${file}`)
    if (!/og:image:width" content="1200"/.test(h) || !/og:image:height" content="630"/.test(h)) bad.push(`${route}: ไม่บอกขนาด`)
    if (tw !== og) bad.push(`${route}: twitter:image ไม่ตรง`)
  }
  assert.deepEqual(bad, [])
})
