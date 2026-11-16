/* ปลั๊กอิน build (แยกจาก vite.config.js · 16 พ.ย. 2026 B1c) · แท็ก SEO · รูป webp/srcset · ตัดบรรทัดไทย · preload ฟอนต์ · robots/sitemap */
import { resolve } from 'node:path'
import { existsSync, readFileSync, openSync, readSync, closeSync } from 'node:fs'
import handlebars from 'vite-plugin-handlebars'
import { fontPreloadTag, injectFontPreload } from '../../scripts/lib/font-preload.mjs'
import { thaiBreaks } from '../../src/js/thai-break.js'
import { root, siteDir, json, walk, url } from './shared.js'

/* ใส่แท็กแชร์และ SEO ให้ทุกหน้าอัตโนมัติ อ่าน title กับ description ที่หน้านั้นเขียนไว้แล้ว
   ทำเป็นปลั๊กอินเพราะไม่อยากให้ 33 หน้าต้องมาก๊อปแท็กเดียวกันไว้เองทีละหน้า
   enforce post เพื่อให้ทำงานหลัง handlebars เรนเดอร์เสร็จ ไม่งั้นจะอ่านเจอแต่ตัวแปร */
export const seoTags = () => ({
  name: 'teamdee-seo',
  enforce: 'post',
  transformIndexHtml(html, ctx) {
    const site = json('site.json')
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

    /* ข้อความที่อ่านจาก HTML ถูก escape มาแล้ว · ถอดก่อนแล้วค่อย esc ใหม่ ไม่งั้น & กลายเป็น &amp;amp; (ตรวจโค้ด 23 ต.ค.) */
    const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/&#x3D;/g, '=').replace(/&amp;/g, '&')
    const title = unesc((html.match(/<title>([^<]*)<\/title>/) || [, site.brand])[1])
    const desc = unesc((html.match(/<meta name="description" content="([^"]*)"/) || [, site.tagline])[1])
    const noindex = html.includes('name="robots" content="noindex"')

    // path เว็บจริงลงท้ายด้วย / ตาม URL เดิมของเว็บ ตัด index.html ทิ้ง
    let path = (ctx.path || '/index.html').split('?')[0]
    if (path.endsWith('index.html')) path = path.slice(0, -10)
    const url = site.baseUrl + path

    // รูปแชร์: หน้าที่ประกาศ <meta name="td-og-image"> ใช้อันนั้น (JPG 1200×630 ตามขนาดที่ LINE/FB ต้องการ · หน้าแรก)
    // ไม่มีก็ใช้รูปแรกของหน้านั้น จะได้ตรงกับเนื้อหา ไม่ใช่รูปเดียวกันทุกหน้า
    const ogMark = html.match(/\s*<meta name="td-og-image" content="([^"]+)">/)
    if (ogMark) html = html.replace(ogMark[0], '')
    /* รูปแรกในเนื้อหา (<main>) ไม่เอารูปการ์ดแนะนำ/ท้ายเว็บ · มีไฟล์ใหญ่ (ตัด -320/-480/-540) ใช้ไฟล์ใหญ่ (ตรวจ SEO 30 ต.ค.: 12 หน้ารูปแชร์เล็กกว่า 600px) */
    const mainAt = html.indexOf('<main')
    let firstImg = mainAt >= 0 ? (html.slice(mainAt).match(/<img[^>]+src="(\/img\/[^"]+)"/) || [])[1] : null
    if (firstImg) {
      const big = firstImg.replace(/-(?:320|400|440|480|540|640)(\.\w+)$/, '$1')
      if (big !== firstImg && existsSync(resolve(root, 'public' + big))) firstImg = big
    }
    const image = site.baseUrl + ((ogMark && ogMark[1]) || firstImg || site.ogImage)

    const tags = [
      `<link rel="canonical" href="${esc(url)}">`,
      `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
      `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="${esc(site.brand)}">`,
      `<meta property="og:locale" content="th_TH">`,
      `<meta property="og:url" content="${esc(url)}">`,
      `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(desc)}">`,
      `<meta property="og:image" content="${esc(image)}">`,
      `<meta property="og:image:alt" content="${esc(title)}">`,
      ...(ogMark ? ['<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">'] : []),
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${esc(title)}">`,
      `<meta name="twitter:description" content="${esc(desc)}">`,
      `<meta name="twitter:image" content="${esc(image)}">`,
    ]
    if (noindex) tags.splice(0, 1) // หน้า noindex ไม่ต้องมี canonical
    return html.replace('</head>', `  ${tags.join('\n  ')}\n</head>`)
  },
})

/* รูป JPG ที่มีไฟล์ .webp คู่กัน (สร้างด้วย cwebp) ให้หน้าเว็บโหลด webp แทน เล็กลงราวครึ่ง (Lighthouse 21 ต.ค. 2026)
   แตะแค่ src / srcset · og:image ยังเป็น JPG ให้แอปแชร์ที่ไม่รองรับ webp */
export const toWebp = (html) =>
  html.replace(/\b(src|srcset|data-full)="([^"]+)"/g, (m, attr, val) =>
    /* รับ prefix ใดๆ ก่อน /img/ (ธีม WP ใส่ /wp-content/themes/teamdee/build นำหน้า) */
    `${attr}="${val.replace(/(^|[\s,])([^\s",?#]*?)(\/img\/[^\s",?#]+)\.jpg(?=[\s,?#]|$)/g, (p, pre, base, path) =>
      existsSync(resolve(root, 'public' + path + '.webp')) ? `${pre}${base}${path}.webp` : p)}"`)
/* รูปที่ประกาศ data-sizes="…" → เติม srcset จากไฟล์ย่อ -{w}.webp ที่มีจริง (ตรวจความเร็ว 30 ต.ค.)
   เช่น รูปผ้า 700px ที่แสดง 64px ได้ corn-160 / corn-320 · ปกบทความ · รูปจากข้อมูลที่ template สร้าง path ไฟล์ย่อเองไม่ได้ */
export const VARIANT_W = [160, 320, 400, 440, 480, 540, 640, 760]
export const webpWidth = (file) => {
  const b = Buffer.alloc(30); const fd = openSync(file, 'r'); readSync(fd, b, 0, 30, 0); closeSync(fd)
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return 0
  const t = b.toString('ascii', 12, 16)
  return t === 'VP8X' ? 1 + b.readUIntLE(24, 3) : t === 'VP8L' ? 1 + (b.readUInt16LE(21) & 0x3fff) : t === 'VP8 ' ? b.readUInt16LE(26) & 0x3fff : 0
}
export const autoSrcset = (src) => {
  const m = src.match(/^(.*?)(\/img\/[^\s"?#]+?)\.(webp|jpe?g|png)$/)
  if (!m) return ''
  const [, pre, base] = m
  const big = resolve(root, `public${base}.webp`)
  const bigW = existsSync(big) ? webpWidth(big) : 0
  if (!bigW) return ''
  const parts = VARIANT_W.filter((w) => w < bigW && existsSync(resolve(root, `public${base}-${w}.webp`))).map((w) => `${pre}${base}-${w}.webp ${w}w`)
  return parts.length ? [...parts, `${pre}${base}.webp ${bigW}w`].join(', ') : ''
}
export const addSrcset = (html) => html.replace(/<img\b[^>]*\sdata-sizes="[^"]*"[^>]*>/g, (tag) => {
  const sizes = tag.match(/\sdata-sizes="([^"]*)"/)[1]
  const src = tag.match(/\ssrc="([^"]+)"/)?.[1]
  const set = !/\ssrcset=/.test(tag) && src && autoSrcset(src)
  return tag.replace(/\sdata-sizes="[^"]*"/, set ? ` srcset="${set}" sizes="${sizes}"` : '')
})
export const webpImages = () => ({
  name: 'teamdee-webp',
  enforce: 'post',
  transformIndexHtml: { order: 'post', handler: (html) => addSrcset(toWebp(html)) },
  /* แก้ไฟล์ HTML ที่ออกจริงอีกชั้น: transformIndexHtml อย่างเดียวไม่ติด srcset บางจุด (audit 26 ต.ค. M29: ยังเหลือ JPG 59 จุด) */
  generateBundle(_, bundle) {
    for (const f of Object.values(bundle)) if (f.type === 'asset' && f.fileName.endsWith('.html') && typeof f.source === 'string') f.source = addSrcset(toWebp(f.source))
  },
})

/* ตัดบรรทัดภาษาไทย: ห่อคำที่เบราว์เซอร์หักผิด + วลีในหัวข้อ/คำถาม/ลิงก์สั้น (src/js/thai-break.js · มือถือ 30 ต.ค.) */
export const thaiLines = () => ({
  name: 'teamdee-thai-lines',
  enforce: 'post',
  transformIndexHtml: { order: 'post', handler: (html) => thaiBreaks(html) },
})

/* ความเร็วมือถือ 30 ต.ค.: preload ฟอนต์ไทยด้วยชื่อไฟล์ที่ hash แล้ว (scripts/lib/font-preload.mjs) · ทุกหน้า · export WP แปลง /assets/ เข้าธีมเอง */
export const fontPreload = () => ({
  name: 'teamdee-font-preload',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const tag = fontPreloadTag(Object.keys(bundle))
    for (const f of Object.values(bundle)) if (f.type === 'asset' && f.fileName.endsWith('.html') && typeof f.source === 'string') f.source = injectFontPreload(f.source, tag)
  },
})

/* สร้าง robots.txt กับ sitemap.xml ตอน build จากรายชื่อหน้าจริง
   จะได้ไม่ต้องมานั่งไล่แก้มือทุกครั้งที่เพิ่มหน้า */
export const seoFiles = () => ({
  name: 'teamdee-seo-files',
  apply: 'build',
  generateBundle() {
    const site = json('site.json')
    const urls = []
    for (const f of walk('.').sort()) {
      if (!f.endsWith('index.html')) continue // 404.html ไม่ใช่หน้าที่ให้ค้นเจอ
      const html = readFileSync(resolve(siteDir, f), 'utf8')
      if (html.includes('name="robots" content="noindex"')) continue
      urls.push('/' + f.slice(0, -10))
    }
    const today = new Date().toISOString().slice(0, 10)
    const body = urls
      .map((u) => `  <url>\n    <loc>${site.baseUrl}${u}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${u === '/' ? '1.0' : '0.7'}</priority>\n  </url>`)
      .join('\n')
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    })
    this.emitFile({
      type: 'asset',
      fileName: 'robots.txt',
      source: `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`,
    })
  },
})
