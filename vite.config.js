import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, readdirSync } from 'node:fs'
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'
import tailwindcss from '@tailwindcss/vite'

const root = dirname(fileURLToPath(import.meta.url))
const json = (f) => JSON.parse(readFileSync(resolve(root, 'src/data', f), 'utf8'))

// นับจำนวนต่อหมวดให้ชิปตัวกรอง เรียงหมวดที่มีของเยอะสุดขึ้นก่อน
const tally = (rows, key, nameKey) => {
  const seen = new Map()
  for (const r of rows) {
    if (!seen.has(r[key])) seen.set(r[key], { id: r[key], name: r[nameKey], n: 0 })
    seen.get(r[key]).n++
  }
  return [...seen.values()].sort((a, b) => b.n - a.n)
}

// อ่านใหม่ทุกครั้งที่เรนเดอร์ ไม่งั้นแก้ไฟล์ JSON แล้วต้องรีสตาร์ต dev server ถึงจะเห็น
const loadData = () => ({
  site: json('site.json'),
  products: json('products.json'),
  groups: json('groups.json'),
  works: json('works.json'),
  pricing: json('pricing.json'),
  faq: json('faq.json'),
  hero: json('hero.json'),
  sizing: json('sizing.json'),
  designs: json('designs.json'),
  customers: json('customers.json'),
  // ชิปตัวกรองสร้างจากข้อมูลจริง เพิ่มหมวดใหม่ในไฟล์ JSON แล้วชิปขึ้นเอง
  designFilters: (() => {
    const d = json('designs.json')
    const techs = tally(d, 'tech', 'techName')
    return { garments: tally(d, 'garment', 'garmentName'), techs, showTechs: techs.length > 1, total: d.length }
  })(),
  customerFilters: (() => {
    const c = json('customers.json')
    return { cats: tally(c, 'cat', 'catName'), total: c.length }
  })(),
  // รูปที่ดึงมาจากเว็บจริง เก็บเป็นลิสต์ให้เทมเพลตวนเอง แก้จำนวนได้จากตรงนี้
  // โลโก้ลูกค้าจริง 45 อัน แบ่งสามแถวให้วิ่งสวนทางกัน
  clientRows: (() => {
    const all = Array.from({ length: 45 }, (_, i) => `/img/client/c${String(i + 1).padStart(2, '0')}.png`)
    const per = Math.ceil(all.length / 3)
    return [all.slice(0, per), all.slice(per, per * 2), all.slice(per * 2)]
  })(),
  realShots: Array.from({ length: 28 }, (_, i) => `/img/real/r${String(i + 1).padStart(2, '0')}.jpg`),
  // ชุดหลัง r13–r28 ให้หน้า works ใช้เป็นแกลเลอรี จะได้ไม่ซ้ำกับรูปการ์ดเคส r01–r09 ในหน้าเดียวกัน
  galleryShots: Array.from({ length: 16 }, (_, i) => `/img/real/r${String(i + 13).padStart(2, '0')}.jpg`),
  workShots: Array.from({ length: 24 }, (_, i) => `/img/work/w${String(i + 1).padStart(2, '0')}.jpg`),
})

/* ใส่แท็กแชร์และ SEO ให้ทุกหน้าอัตโนมัติ อ่าน title กับ description ที่หน้านั้นเขียนไว้แล้ว
   ทำเป็นปลั๊กอินเพราะไม่อยากให้ 33 หน้าต้องมาก๊อปแท็กเดียวกันไว้เองทีละหน้า
   enforce post เพื่อให้ทำงานหลัง handlebars เรนเดอร์เสร็จ ไม่งั้นจะอ่านเจอแต่ตัวแปร */
const seoTags = () => ({
  name: 'teamdee-seo',
  enforce: 'post',
  transformIndexHtml(html, ctx) {
    const site = json('site.json')
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

    const title = (html.match(/<title>([^<]*)<\/title>/) || [, site.brand])[1]
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [, site.tagline])[1]
    const noindex = html.includes('name="robots" content="noindex"')

    // path เว็บจริง หน้าแรกเป็น / ส่วนหน้าอื่นเก็บ .html ไว้ตามที่ลิงก์ในเว็บใช้กัน
    let path = (ctx.path || '/index.html').split('?')[0]
    if (path.endsWith('/index.html')) path = path.slice(0, -10)
    const url = site.baseUrl + path

    // รูปแชร์ ใช้รูปแรกของหน้านั้นถ้ามี จะได้ตรงกับเนื้อหา ไม่ใช่รูปเดียวกันทุกหน้า
    const firstImg = (html.match(/<img[^>]+src="(\/img\/[^"]+)"/) || [])[1]
    const image = site.baseUrl + (firstImg || site.ogImage)

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
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${esc(title)}">`,
      `<meta name="twitter:description" content="${esc(desc)}">`,
      `<meta name="twitter:image" content="${esc(image)}">`,
    ]
    if (noindex) tags.splice(0, 1) // หน้า noindex ไม่ต้องมี canonical
    return html.replace('</head>', `  ${tags.join('\n  ')}\n</head>`)
  },
})

/* สร้าง robots.txt กับ sitemap.xml ตอน build จากรายชื่อหน้าจริง
   จะได้ไม่ต้องมานั่งไล่แก้มือทุกครั้งที่เพิ่มหน้า */
const seoFiles = () => ({
  name: 'teamdee-seo-files',
  apply: 'build',
  generateBundle() {
    const site = json('site.json')
    const files = readdirSync(resolve(root, 'pages')).filter((f) => f.endsWith('.html'))
    const urls = ['/']
    for (const f of files) {
      const html = readFileSync(resolve(root, 'pages', f), 'utf8')
      if (html.includes('name="robots" content="noindex"')) continue
      urls.push('/pages/' + f)
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

const pages = readdirSync(resolve(root, 'pages')).filter((f) => f.endsWith('.html'))
const input = { main: resolve(root, 'index.html') }
for (const p of pages) input[p.replace('.html', '')] = resolve(root, 'pages', p)

export default defineConfig({
  appType: 'mpa',
  plugins: [
    tailwindcss(),
    seoTags(),
    seoFiles(),
    handlebars({
      partialDirectory: resolve(root, 'src/partials'),
      context(pagePath) {
        const data = loadData()
        const file = pagePath.split('/').pop().replace('.html', '')
        const m = /^(product|case|group)-(.+)$/.exec(file)
        if (!m) return data
        const [, kind, id] = m
        const pick =
          kind === 'product' ? data.products.find((x) => x.id === id)
          : kind === 'case' ? data.works.find((x) => x.id === id)
          : data.groups.find((x) => x.id === id)
        const extra = {}
        if (kind === 'product') extra.relatedProducts = data.products.filter((x) => x.id !== id).slice(0, 4)
        if (kind === 'case') extra.related = data.works.filter((w) => w.group === pick.group && w.id !== id).slice(0, 3)
        if (kind === 'group') extra.related = data.works.filter((w) => w.group === id).slice(0, 3)
        return { ...data, item: pick, ...extra }
      },
      helpers: {
        eq: (a, b) => a === b,
        baht: (n) => Number(n).toLocaleString('en-US'),
        lt: (a, b) => Number(a) < Number(b),
        inc: (n) => Number(n) + 1,
      },
    }),
  ],
  build: { outDir: 'dist', rollupOptions: { input } },
})
