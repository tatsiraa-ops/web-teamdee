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
    /* 17 พ.ย. 2026 A8: รูปแชร์ JPG 1200×630 รายหน้า public/img/og/<slug>.jpg (scripts/make-og.py) มาก่อน · tests/og-images.test.js */
    const ogSlug = path.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home'
    const ogFile = existsSync(resolve(root, `public/img/og/${ogSlug}.jpg`)) ? `/img/og/${ogSlug}.jpg` : null
    const image = site.baseUrl + (ogFile || (ogMark && ogMark[1]) || firstImg || site.ogImage)

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
      ...(ogFile || ogMark ? ['<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">'] : []),
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
/** [path ใน dist, HTML ที่ render แล้ว] → path ที่ใส่ sitemap · ข้ามหน้า noindex (ทุกรูปแบบ) และ 404
    17 พ.ย. 2026: เดิมอ่าน template ดิบ → หน้าที่มี noindex ในเงื่อนไข {{#unless}} หลุด · noindex,nofollow ไม่ตรงสตริง เลยหลุดเข้า */
export const sitemapPaths = (pages) => pages
  .filter(([f]) => f.endsWith('index.html'))
  .filter(([, html]) => !/<meta\b(?=[^>]*\bname="robots")(?=[^>]*\bcontent="[^"]*noindex)[^>]*>/i.test(html))
  .map(([f]) => '/' + f.slice(0, -10))
  .sort()

export const seoFiles = () => ({
  name: 'teamdee-seo-files',
  apply: 'build',
  /* order post: HTML ของหน้า (vite:build-html) ต้องอยู่ใน bundle แล้ว */
  generateBundle: { order: 'post', handler(_, bundle) {
    const site = json('site.json')
    const urls = sitemapPaths(Object.values(bundle).filter((a) => a.type === 'asset' && a.fileName.endsWith('.html')).map((a) => [a.fileName, String(a.source)]))
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
  } },
})

/* 16 พ.ย. 2026 audit: Vite สลับลำดับ <link rel="stylesheet"> เองทุก build · กฎที่ความเจาะจงเท่ากันจึงชนะสลับกันไปมา (88 จุดใน 39 หน้า)
   ล็อกลำดับ: CSS กลาง (site-extras / nav) → CSS ชิ้นส่วนที่ใช้หลายหน้า → CSS ของหน้า (ชนะท้ายสุด) · ในกลุ่มเรียงตามชื่อ · tests/css-order.test.js */
const CSS_SHARED = ['site-extras', 'nav']
const CSS_PARTS = ['article-reader', 'line-cta', 'need-by-ui', 'pick-tray', 'review-wall']
const cssName = (tag) => (tag.match(/\/([a-z0-9-]+?)-[A-Za-z0-9_-]{8}\.css/) || [])[1] || ''
/* home-page.css = กฎเฉพาะหน้าแรกที่แยกจาก home.css (17 พ.ย. 2026) · Vite ตั้งชื่อ chunk ตาม entry หน้าแรก = main-*.css
   เดิมกฎอยู่ในไฟล์กลาง → ต่อจากกลางทันที ก่อนชิ้นส่วน */
const CSS_HOME = ['home-page', 'main']
const cssRank = (n) => (CSS_SHARED.includes(n) ? 0 : CSS_HOME.includes(n) ? 0.5 : CSS_PARTS.includes(n) ? 1 : 2)
export function orderStylesheets(html) {
  const re = /<link\b[^>]*\brel="stylesheet"[^>]*>\n?/g
  const tags = html.match(re) || []
  if (tags.length < 2) return html
  const sorted = [...tags].map((t) => t.replace(/\n$/, '')).sort((a, b) => cssRank(cssName(a)) - cssRank(cssName(b)) || cssName(a).localeCompare(cssName(b)))
  const first = html.search(re)
  const rest = html.replace(re, '')
  return rest.slice(0, first) + sorted.join('\n') + '\n' + rest.slice(first)
}
export const cssOrder = () => ({
  name: 'teamdee-css-order',
  apply: 'build',
  transformIndexHtml: { order: 'post', handler: (html) => orderStylesheets(html) },
})

/* ---------- SVG ซ้ำในหน้า → sprite (17 พ.ย. 2026 อาร์ตเลือกข้อ 6ก · tests/svg-sprite.test.js) ----------
   หน้าแรกฝัง SVG 303 อันแต่มีแค่ 27 แบบ (ไอคอนขยายซ้ำ 188 ครั้ง) · ตอน build เก็บแบบที่ซ้ำไว้ครั้งเดียวใน <symbol> ต้น <body>
   จุดใช้เหลือ <svg ขนาด/class/aria><use href="#iN"/></svg> · หน้าตาเหมือนเดิม (fill/stroke/viewBox ย้ายไปที่ symbol สืบทอดเหมือนเดิม)
   ไม่แตะ: ข้างในมี class/id/style/title/defs/use/text (CSS/JS เข้าไม่ถึงข้างใน <use>) · ตัว svg มี id/hidden · class ที่ CSS เจาะข้างใน */
const SVG_KEEP = /^(width|height|viewBox|class|role|focusable|style|xmlns|aria-[\w-]+)$/
const SVG_SKIP_INNER = /\s(class|id|style)=|<(title|desc|defs|use|symbol|animate|text|foreignObject|linearGradient|radialGradient|clipPath|mask|svg)\b/
/* class ของ SVG ที่ CSS เจาะรูปทรงข้างใน (เช่น ".pp2-stb__path path" เส้นประ) · tests/svg-sprite.test.js สแกน CSS ทุกไฟล์ว่าไม่ตกหล่น */
export const SVG_SKIP_CLASS = /\b(th-mark|th-arc|g-lab|fc-sprite|hm-end__arc|dz__lines|pp2-stb__path|fl__lines|lb__ico)/
/* ค่าใน "…" หรือ '…' (code review 17 พ.ย.: เดิมอ่านแค่ "…" · quote เดี่ยว = ค่าหาย → build พัง) */
const svgAttrs = (s) => [...s.matchAll(/\s([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g)].map((m) => [m[1], m[2] ?? m[3]])
export function svgSprite(html) {
  const body = /<body\b[^>]*>/.exec(html)
  if (!body) return html
  const re = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/g
  const items = []
  for (const m of html.matchAll(re)) {
    if (m.index < body.index) continue
    const attrs = svgAttrs(m[1])
    const get = (k) => attrs.find(([n]) => n === k)
    if (!get('viewBox')?.[1]?.trim() || get('id') || get('hidden') || SVG_SKIP_INNER.test(m[2]) || SVG_SKIP_CLASS.test(get('class')?.[1] || '')) continue
    /* viewBox อยู่ทั้งสองที่: ตัวนอก "0 0 W H" ให้สัดส่วนกับ SVG ที่ CSS กำหนดแค่ความกว้าง · symbol คงของเดิม (viewBox ไม่เริ่ม 0 ไม่เลื่อนซ้ำสองชั้น) */
    const vb = get('viewBox')[1].trim().split(/[\s,]+/)
    const keep = attrs.filter(([n]) => SVG_KEEP.test(n)).map(([n, v]) => [n, n === 'viewBox' ? `0 0 ${vb[2]} ${vb[3]}` : v])
    const draw = attrs.filter(([n]) => n === 'viewBox' || !SVG_KEEP.test(n))
    const fmt = (list) => list.map(([n, v]) => (v === undefined ? ` ${n}` : ` ${n}="${v}"`)).join('')
    items.push({ start: m.index, end: m.index + m[0].length, keep: fmt(keep), draw: fmt(draw), inner: m[2], key: fmt(draw) + '|' + m[2] })
  }
  const count = new Map()
  for (const it of items) count.set(it.key, (count.get(it.key) || 0) + 1)
  const ids = new Map(); const symbols = []
  for (const it of items) {
    if (count.get(it.key) < 2 || ids.has(it.key)) continue
    const id = `i${ids.size + 1}`
    ids.set(it.key, id); symbols.push(`<symbol id="${id}"${it.draw}>${it.inner}</symbol>`)
  }
  if (!symbols.length) return html
  let out = '', at = 0
  for (const it of items) {
    const id = ids.get(it.key)
    if (!id) continue
    out += html.slice(at, it.start) + `<svg${it.keep}><use href="#${id}"/></svg>`; at = it.end
  }
  out += html.slice(at)
  const b = /<body\b[^>]*>/.exec(out)
  return out.slice(0, b.index + b[0].length) + `<svg hidden aria-hidden="true" style="display:none">${symbols.join('')}</svg>` + out.slice(b.index + b[0].length)
}
export const svgSpriteP = () => ({ name: 'teamdee-svg-sprite', apply: 'build', transformIndexHtml: { order: 'post', handler: (html) => svgSprite(html) } })
