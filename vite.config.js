import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, readdirSync } from 'node:fs'
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'
import tailwindcss from '@tailwindcss/vite'
import { makeUrl, pageFor } from './src/js/routes.js'

const root = dirname(fileURLToPath(import.meta.url))
/* ไฟล์หน้าเว็บอยู่ใน site/ วางโฟลเดอร์ตาม URL จริง เช่น site/sublimation/index.html → /sublimation/
   dev กับ build จึงได้ URL เดียวกันโดยไม่ต้อง rewrite (PLAN ข้อ 6) */
const siteDir = resolve(root, 'site')
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

/* ชื่อสินค้า · การใช้งาน · สไตล์ ของแต่ละแบบ ใช้เป็นคำบรรยายในรูปใหญ่ตาม Wireframe
   เช่น "เสื้อพิมพ์ลาย · กีฬาและการแข่งขัน · ไล่เฉดสี" · ทุกจุดที่โชว์แบบเสื้อต้องผ่านตัวนี้ ไม่งั้นรูปใหญ่ไม่มีคำบรรยาย */
const withMeta = () => {
  const name = (list) => Object.fromEntries(list.map((x) => [x.id, x.menuName || x.name]))
  const P = name(json('products.json'))
  const U = name(json('uses.json'))
  const S = json('styles.json')
  return json('designs.json').map((d) => ({
    ...d,
    meta: [
      (d.product || []).map((x) => P[x]).join(' / '),
      (d.use || []).map((x) => U[x]).join(' / '),
      (d.style || []).map((x) => S[x]).join(' / '),
    ].filter(Boolean).join(' · '),
  }))
}

// อ่านใหม่ทุกครั้งที่เรนเดอร์ ไม่งั้นแก้ไฟล์ JSON แล้วต้องรีสตาร์ต dev server ถึงจะเห็น
const loadData = () => ({
  site: json('site.json'),
  /* products / guides = ที่โชว์ในเมนู ค้นหา และหน้ารวม · all* = รวมหน้าที่ "รองรับไว้" แต่ยังไม่เปิด (hidden) */
  products: json('products.json').filter((x) => !x.hidden),
  allProducts: json('products.json'),
  /* เมนูสินค้า: แกนเดียวคือเทคนิค ทรงเสื้อเป็นลูก (Wireframe v2) */
  productTree: (() => {
    const shown = json('products.json').filter((x) => !x.hidden)
    return shown.filter((x) => !x.parent).map((x) => ({ ...x, children: shown.filter((c) => c.parent === x.id) }))
  })(),
  techniques: json('techniques.json'),
  groups: json('groups.json'),
  works: json('works.json'),
  pricing: json('pricing.json'),
  faq: json('faq.json'),
  hero: json('hero.json'),
  sizing: json('sizing.json'),
  /* ชื่อสินค้า · การใช้งาน · สไตล์ ของแต่ละแบบ ใช้เป็นคำบรรยายในรูปใหญ่ตาม Wireframe
     เช่น "เสื้อพิมพ์ลาย · กีฬาและการแข่งขัน · ไล่เฉดสี" */
  designs: withMeta(),
  uses: json('uses.json'),
  guides: json('guides.json').filter((x) => !x.hidden),
  allGuides: json('guides.json'),
  styles: json('styles.json'),
  articles: json('articles.json'),
  // รูปฮีโร่หน้าแรก ต้องเป็นภาพทีมจริงตาม Brief ข้อ 06 ไม่ใช่ภาพจำลอง
  heroShot: { img: '/img/real/r23.jpg', alt: 'ทีมพนักงานใส่เสื้อทีมที่ TEAMDEE ผลิตให้ ถ่ายในวันงานจริง' },
  /* hero หน้าแรก · รูปทีมจริง 4 ประเภทงาน แทนรูปเดียว · รูปจริงทุกรูปกว้างแค่ 760px ขยายรูปเดียวให้ใหญ่จะเบลอ
     แต่ละรูปกดไปหน้าการใช้งานนั้นได้ ภาพจึงเป็นทั้งหลักฐานและทางเข้า */
  /* hero หน้าแรก ฉาก A · คู่ "ไฟล์แบบ + รูปทีมใส่จริงของงานเดียวกัน"
     confirmed: false = คู่ตัวอย่างที่สีและประเภทใกล้กัน แต่ยังไม่ใช่งานเดียวกัน หน้าเว็บจะติดป้ายบอก
     ได้คู่จริงแล้วแก้ code กับ photo แล้วตั้ง confirmed: true */
  heroPairs: (() => {
    const d = withMeta()
    return [
      { code: 'TD-0009', photo: '/img/real/r17.jpg', who: 'ทีมฟุตบอล', confirmed: false },
      { code: 'TD-0008', photo: '/img/real/r23.jpg', who: 'พนักงานบริษัท', confirmed: false },
      { code: 'TD-0030', photo: '/img/real/r16.jpg', who: 'นักเรียน', confirmed: false },
      { code: 'TD-0006', photo: '/img/real/r21.jpg', who: 'ทีมวิ่ง', confirmed: false },
    ].map((p) => ({ ...p, design: d.find((x) => x.code === p.code) }))
  })(),
  /* ผนังแบบเสื้อของ hero · แบ่ง 6 คอลัมน์ ขยับทั้งคอลัมน์ ไม่ขยับรายช่อง
     (66 ช่องขยับแยก = เฟรมค้าง 50–333ms ตอนผนังขึ้นครั้งแรก วัดจริง 2 ต.ค. 2026) */
  heroWallCols: (() => {
    const d = withMeta()
    const cols = Array.from({ length: 6 }, () => [])
    d.forEach((x, i) => cols[i % 6].push(x))
    return cols.map((c, i) => ({ dir: i % 2 ? 'down' : 'up', tiles: [...c, ...c] }))
  })(),
  /* hero แบบเลื่อน · เสื้อ 3D จริงของทีมดี 5 แบบ (อาร์ตส่งมา 2 ต.ค. 2026) ตัวกลางคือตัวเอก
     มีโลโก้ลูกค้าจริงทุกตัว ต้องขออนุญาตลูกค้าก่อนเผยแพร่ (Brief ข้อ 08) */
  heroLineup: ['ptk', 'school50', 'highvolt', 'choomthong', 'watsadu'].map((id) => ({
    id,
    front: `/img/jersey3d/${id}-front.webp`,
    frontSmall: `/img/jersey3d/${id}-front-440.webp`,
    back: `/img/jersey3d/${id}-back.webp`,
    backSmall: `/img/jersey3d/${id}-back-440.webp`,
  })),
  heroTeams: [
    { img: '/img/real/r23.jpg', use: 'corp', label: 'บริษัท', alt: 'พนักงานบริษัทใส่เสื้อทีมสีแดงที่ TEAMDEE ผลิต ถ่ายในวันงานจริง' },
    { img: '/img/real/r17.jpg', use: 'sport', label: 'ทีมกีฬา', alt: 'นักฟุตบอลใส่เสื้อลายทางแดงขาวที่ TEAMDEE ผลิต' },
    { img: '/img/real/r16.jpg', use: 'edu', label: 'โรงเรียน', alt: 'นักเรียนใส่เสื้อโปโลสีขาวฟ้าที่ TEAMDEE ผลิต' },
    { img: '/img/real/r21.jpg', use: 'event', label: 'กิจกรรม', alt: 'ทีมนักวิ่งใส่เสื้อสีม่วงที่ TEAMDEE ผลิต ถ่ายที่สนามจริง' },
  ],
  // แบบเสื้อที่คัดมาโชว์หน้าแรก 6 แบบ เกณฑ์ตาม Wireframe: ครอบคลุมสินค้าหลายประเภท
  pickedDesigns: (() => {
    const d = withMeta()
    const seen = new Map()
    for (const r of d) {
      const key = r.garment
      if (!seen.has(key)) seen.set(key, r)
    }
    const out = [...seen.values()].slice(0, 6)
    for (const r of d) { if (out.length >= 6) break; if (!out.includes(r)) out.push(r) }
    return out.slice(0, 6)
  })(),
  customers: json('customers.json'),
  // ชิปตัวกรองสร้างจากข้อมูลจริง เพิ่มหมวดใหม่ในไฟล์ JSON แล้วชิปขึ้นเอง
  /* ตัวกรองแบบเสื้อ 3 แกนตาม Brief ข้อ 06 — สินค้า / การใช้งาน / สไตล์ (สีเป็นตัวเสริม)
     แกนไหนยังไม่มีข้อมูลจะไม่ขึ้นเป็นชิป แทนที่จะโชว์ปุ่มที่กดแล้วไม่มีอะไรเกิดขึ้น */
  designFilters: (() => {
    const d = json('designs.json')
    const products = json('products.json')
    const uses = json('uses.json')
    const styleNames = json('styles.json')
    const count = (key, id) => d.filter((r) => (r[key] || []).includes(id)).length
    const axis = (list, key) =>
      list.map((x) => ({ id: x.id, name: x.menuName || x.name, n: count(key, x.id) })).filter((x) => x.n > 0)
    const colors = [...new Set(d.map((r) => r.color).filter(Boolean))]
      .map((c) => ({ id: c, name: c, n: d.filter((r) => r.color === c).length }))
      .sort((a, b) => b.n - a.n)
    const styles = Object.entries(styleNames)
      .map(([id, name]) => ({ id, name, n: count('style', id) }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
    const byProduct = axis(products, 'product')
    const byUse = axis(uses, 'use')
    return {
      products: byProduct, showProducts: byProduct.length > 1,
      uses: byUse, showUses: byUse.length > 1,
      styles, showStyles: styles.length > 1,
      colors, showColors: colors.length > 1,
      total: d.length,
    }
  })(),
  customerFilters: (() => {
    const c = json('customers.json')
    return { cats: tally(c, 'cat', 'catName'), total: c.length }
  })(),
  /* ตัวกรองผลงานตามบริบท ตาม Wireframe ส่วนที่ 1 — กลุ่มการใช้งาน + ประเภทสินค้า */
  articleFilters: (() => {
    const a = json('articles.json')
    return {
      cats: a.cats.map((c) => ({ ...c, n: a.items.filter((x) => x.cat === c.id).length })).filter((c) => c.n > 0),
      total: a.items.length,
    }
  })(),
  workFilters: (() => {
    const w = json('works.json')
    const uses = json('uses.json')
    const products = json('products.json')
    const pick = (list, key) =>
      list.map((x) => ({ id: x.id, name: x.menuName || x.name, n: w.filter((r) => r[key] === x.id).length }))
        .filter((x) => x.n > 0)
    return { uses: pick(uses, 'use'), products: pick(products, 'product'), total: w.length }
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

    // path เว็บจริงลงท้ายด้วย / ตาม URL เดิมของเว็บ ตัด index.html ทิ้ง
    let path = (ctx.path || '/index.html').split('?')[0]
    if (path.endsWith('index.html')) path = path.slice(0, -10)
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

const walk = (dir, base = '') => {
  const out = []
  for (const e of readdirSync(resolve(siteDir, dir), { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...walk(`${dir}/${e.name}`, `${base}${e.name}/`))
    else if (e.name.endsWith('.html')) out.push(base + e.name)
  }
  return out
}
/* สร้าง robots.txt กับ sitemap.xml ตอน build จากรายชื่อหน้าจริง
   จะได้ไม่ต้องมานั่งไล่แก้มือทุกครั้งที่เพิ่มหน้า */
const seoFiles = () => ({
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

const input = {}
for (const p of walk('.')) input[p === 'index.html' ? 'main' : p.replace(/\/?index\.html$|\.html$/, '').replace(/\//g, '-')] = resolve(siteDir, p)

const routes = json('routes.json')
const url = makeUrl(routes)

export default defineConfig({
  appType: 'mpa',
  root: siteDir,
  publicDir: resolve(root, 'public'),
  /* หน้าใน site/ เรียก /src/... เหมือนเดิม ชี้กลับไปที่ src/ ของโปรเจกต์ */
  resolve: { alias: [{ find: /^\/src\//, replacement: resolve(root, 'src') + '/' }] },
  server: { fs: { allow: [root] } },
  plugins: [
    tailwindcss(),
    seoTags(),
    seoFiles(),
    handlebars({
      partialDirectory: resolve(root, 'src/partials'),
      context(pagePath) {
        const data = loadData()
        /* หาว่าไฟล์นี้คือหน้าอะไรจาก URL ของมันเอง ตารางอยู่ที่ routes.json */
        const rel = pagePath.replace(/\\/g, '/').replace(siteDir.replace(/\\/g, '/'), '')
        const at = ('/' + rel.replace(/^\//, '')).replace(/index\.html$/, '')
        const page = pageFor(routes, data.articles.items.map((a) => a.id))[at] || { kind: null, id: null }
        const base = { ...data, page }
        const { kind, id } = page
        if (kind === 'products') {
          const item = data.allProducts.find((x) => x.id === id)
          const tech = data.techniques[item.technique]
          /* ผ้าตามเทคนิค ดึงจากรายการผ้ากลางก่อน แล้วต่อด้วยรายการที่ยังรอยืนยัน ไม่ใช้ผ้าชุดเดียวกันทุกเทคนิค */
          const fabrics = [
            ...tech.fabricNames.map((n) => data.sizing.fabrics.find((f) => f.name === n)).filter(Boolean),
            ...tech.fabrics,
          ]
          const designsOf = data.designs.filter((r) => (r.product || []).includes(id))
          return {
            ...base,
            item,
            tech: { ...tech, fabrics },
            parentItem: item.parent ? data.allProducts.find((x) => x.id === item.parent) : null,
            childProducts: data.products.filter((x) => x.parent === id),
            /* แท็กในหน้า (เสื้อวิ่ง / ฟุตบอล) ต้องมีแบบให้กรองได้จริง ไม่งั้นไม่โชว์ */
            productTags: (item.tags || [])
              .map((t) => {
                const of = designsOf.filter((r) => r.garment === t.garment)
                return { ...t, n: of.length, sample: of[0] }
              })
              .filter((t) => t.n > 0),
            productFaq: data.faq.product[id] || [],
            productDesigns: item.tags ? designsOf : designsOf.slice(0, 6),
            relatedProducts: data.products.filter((x) => x.id !== id && x.id !== item.parent && x.parent !== id),
            relatedUses: data.uses.filter((u) => (u.recommend || []).some((r) => r.id === id)),
            productWorks: data.works.filter((w) => w.product === id).slice(0, 3),
            guideId: data.allGuides.some((g) => g.id === id) ? id : item.parent || 'print',
          }
        }
        if (kind === 'uses' && id !== 'index') {
          const item = data.uses.find((x) => x.id === id)
          return {
            ...base,
            item,
            useFaq: data.faq.use[id] || [],
            useDesigns: data.designs.filter((r) => (r.use || []).includes(id)).slice(0, 6),
            useWorks: data.works.filter((w) => (item?.legacyIds || []).includes(w.group)).slice(0, 3),
            relatedUses: data.uses.filter((x) => x.id !== id),
          }
        }
        if (kind === 'articles') {
          const all = data.articles.items
          const item = all.find((x) => x.id === id)
          /* บทความเกี่ยวข้องเอาหมวดเดียวกันก่อน ถ้าไม่พอค่อยเติมจากหมวดอื่น */
          const same = all.filter((x) => x.id !== id && x.cat === item?.cat)
          const other = all.filter((x) => x.id !== id && x.cat !== item?.cat)
          return { ...base, item, related: [...same, ...other].slice(0, 3) }
        }
        if (kind === 'guides') {
          return {
            ...base,
            item: data.allGuides.find((x) => x.id === id),
            otherGuides: data.guides.filter((x) => x.id !== id),
          }
        }
        return base
      },
      helpers: {
        eq: (a, b) => a === b,
        baht: (n) => Number(n).toLocaleString('en-US'),
        lt: (a, b) => Number(a) < Number(b),
        inc: (n) => Number(n) + 1,
        /* {{url 'contact'}} · {{url 'products' this.id}} · {{url 'guides.size'}} — ลิงก์ภายในทุกตัวต้องผ่านตัวนี้ */
        url: (key, id) => url(key, typeof id === 'string' ? id : undefined),
      },
    }),
  ],
  build: { outDir: resolve(root, 'dist'), emptyOutDir: true, rollupOptions: { input } },
})
