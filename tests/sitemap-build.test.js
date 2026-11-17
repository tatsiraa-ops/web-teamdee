/* 17 พ.ย. 2026 รอบตรวจ SEO: sitemap ของ build อ่าน template ดิบ → หน้าแกลเลอรี 10 หน้า (มี {{#unless}}<meta robots noindex> ในเงื่อนไข) หลุดจาก sitemap
   ส่วน /hero-storyboard/ (noindex,nofollow · ไม่ตรงสตริง content="noindex") กลับอยู่ใน sitemap → ตัดสินจาก HTML ที่ render แล้ว + จับ noindex ด้วย regex */
import test from 'node:test'
import assert from 'node:assert/strict'
import { sitemapPaths } from '../src/build/plugins.js'

test('sitemapPaths: ตัดสินจาก HTML ที่ render แล้ว · noindex ทุกรูปแบบไม่เข้า · 404 ไม่เข้า', () => {
  const pages = [
    ['index.html', '<meta name="robots" content="index,follow">'],
    ['sports-shirt/index.html', '<title>x</title>'],
    ['hero-storyboard/index.html', '<meta name="robots" content="noindex,nofollow">'],
    ['search/index.html', '<meta content="noindex, follow" name="robots">'],
    ['404.html', ''],
  ]
  assert.deepEqual(sitemapPaths(pages), ['/', '/sports-shirt/'])
})
