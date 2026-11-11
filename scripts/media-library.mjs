/* คลังรูปกลาง (30 ต.ค. อาร์ต "ทำคลังรูปแยกดีๆ เผื่อจะเอารูปอะไรจากส่วนกลางไปใช้งาน")
   สำรวจรูปทุกไฟล์ใน public/img → src/data/media-library.json (รูปละแถว · รันซ้ำได้ผลเดิม)
   รัน: node scripts/media-library.mjs
   - ไฟล์ย่อ -160/-320/-400/-440/-480/-540/-640/-760/-1080 และ .jpg คู่ .webp รวมเป็นรูปเดียว (variants / formats)
   - ขนาดอ่านจากหัวไฟล์ · md5 ของไฟล์หลักใช้หารูปซ้ำ (dupOf = ไฟล์แรกตามชื่อที่เนื้อไฟล์ตรงกัน)
   - กลุ่มลูกค้า / สินค้า / คำบรรยาย มาจากข้อมูลที่มีอยู่เท่านั้น (customers works designs reviews live-gallery download-designs …) ไม่เดา
   - "ใช้ในหน้า" (usedOn) อ่านจาก dist/ ที่ build ล่าสุด → build ก่อน (npx vite build --logLevel error) แล้วค่อยรัน
   - "อ้างถึงใน" (refs) = ไฟล์ข้อมูล/แม่แบบที่เขียน path รูปนี้ไว้ตรงๆ
   หน้าเลือกรูปสำหรับทีม: /ui/media/ (ต้นแบบเท่านั้น ไม่ export) · ตัวเลือกรูปให้หน้าเว็บ: src/js/media-library.js */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const VARIANT_W = [160, 320, 400, 440, 480, 540, 640, 760, 1080]
const EXT = /\.(webp|jpe?g|png|svg)$/i
const FORMAT_ORDER = ['webp', 'jpg', 'jpeg', 'png', 'svg']

const walk = (d, base = '') => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory()
  ? walk(join(d, e.name), `${base}${e.name}/`)
  : [`${base}${e.name}`])).sort()

/** รวมไฟล์เป็นรูป · คืน Map(key → { main, formats, variants:[{w,file}] }) · key = path ไม่มีนามสกุลและขนาด เช่น "real/r01"
 *  -{w} นับเป็นไฟล์ย่อเมื่อมีไฟล์ตั้งต้น หรือมีไฟล์ย่อชื่อเดียวกัน ≥ 2 ขนาด (studio-440 เดี่ยวๆ = ชื่อรูป ไม่ใช่ไฟล์ย่อ) */
export function groupFiles(files) {
  const imgs = files.filter((f) => EXT.test(f))
  const stem = (f) => f.replace(EXT, '')
  const ext = (f) => f.match(EXT)[1].toLowerCase()
  const stems = new Set(imgs.map(stem))
  const sfx = (s) => { const m = s.match(/^(.*)-(\d+)$/); return m && VARIANT_W.includes(+m[2]) ? { base: m[1], w: +m[2] } : null }
  const widths = new Map()
  for (const s of stems) { const v = sfx(s); if (v) widths.set(v.base, (widths.get(v.base) || new Set()).add(v.w)) }
  const variantOf = (s) => { const v = sfx(s); return v && (stems.has(v.base) || widths.get(v.base).size >= 2) ? v : null }
  const pick = (list) => [...list].sort((a, b) => FORMAT_ORDER.indexOf(ext(a)) - FORMAT_ORDER.indexOf(ext(b)))[0]
  const raw = new Map()
  for (const f of [...imgs].sort()) {
    const v = variantOf(stem(f))
    const key = v ? v.base : stem(f)
    if (!raw.has(key)) raw.set(key, { base: [], byW: new Map() })
    const r = raw.get(key)
    if (v) r.byW.set(v.w, [...(r.byW.get(v.w) || []), f])
    else r.base.push(f)
  }
  const out = new Map()
  for (const [key, r] of [...raw.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    let mainFiles = r.base
    const ws = [...r.byW.keys()].sort((a, b) => a - b)
    if (!mainFiles.length) { mainFiles = r.byW.get(ws.at(-1)); ws.pop() }
    out.set(key, {
      main: pick(mainFiles),
      formats: [...new Set(mainFiles.map(ext))].sort(),
      variants: ws.map((w) => ({ w, file: pick(r.byW.get(w)) })),
    })
  }
  return out
}

/** ขนาดภาพจากหัวไฟล์ (webp VP8/VP8L/VP8X · jpg SOF · png IHDR · svg viewBox) · อ่านไม่ได้ = 0 */
export function imageSize(b) {
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const t = b.toString('ascii', 12, 16)
    if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) }
    if (t === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 } }
    if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }
  }
  if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) { i++; continue }
      const m = b[i + 1]
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) }
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue }
      i += 2 + b.readUInt16BE(i + 2)
    }
  }
  const s = b.toString('utf8', 0, Math.min(b.length, 2000))
  const vb = s.match(/<svg[^>]*viewBox="[\d.\-]+[\s,]+[\d.\-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/)
  if (vb) return { w: Math.round(+vb[1]), h: Math.round(+vb[2]) }
  return { w: 0, h: 0 }
}

/* ชนิดรูปตามโฟลเดอร์ · ข้อมูลเปลี่ยนชนิดได้ (เช่น download-designs ที่มีรหัส TD = design) */
export const KINDS = {
  design: 'แบบมีรหัส TD', customer: 'ภาพลูกค้าจริง', real: 'ภาพทีมจริง (ชุด real)', work: 'ภาพงานจริง (ชุด work)', review: 'ภาพจากรีวิว',
  case: 'ภาพเคส FTI', gallery: 'แบบจากแกลเลอรีเว็บเดิม', mockup3d: 'เสื้อ 3D (lineup)', mockup: 'ม็อกอัปเสื้อ', proof: 'ภาพคู่แบบ / เสื้อจริง',
  shape: 'ภาพทรงเสื้อวอร์ม', detail: 'รายละเอียดใกล้', reference: 'อ้างอิงการวางกราฟิก', download: 'คลังดาวน์โหลดที่ยังไม่ใช้',
  screen: 'งานสกรีน', warmup: 'แบบเสื้อวอร์ม', fabric: 'ผ้า', logo: 'โลโก้ลูกค้า', 'logo-fit': 'โลโก้ลูกค้า (จัดกลาง)',
  hero: 'ภาพ hero', category: 'ภาพหมวด (groups.json)', og: 'ภาพแชร์ OG', icon: 'ภาพประกอบ SVG',
}
const FOLDER_KIND = {
  customer: 'customer', real: 'real', work: 'work', review: 'review', case: 'case', design: 'design', 'download-designs': 'download',
  gallery: 'gallery', mockup: 'mockup', jersey3d: 'mockup3d', sport3d: 'mockup3d', client: 'logo', 'client-fit': 'logo-fit', fabric: 'fabric',
  hero: 'hero', cat: 'category', screen: 'screen', 'warmup-collection': 'warmup', og: 'og', services: 'icon',
}

/* เสื้อ 3D ของ hero หน้าแรก · กลุ่มอ่านจากป้าย/คำบรรยายที่เขียนไว้ใน vite.config.js (teamLineup · sportLineup)
   ตัวที่ 3 = แบบ TD เดียวกัน (ชื่อทีมบนเสื้อตรงกัน ดูด้วยตา 30 ต.ค.) · แกลเลอรีไม่ใส่ซ้ำกับแบบมีรหัส */
const LINEUP = {
  'jersey3d/school50': [['edu'], 'ภาพจำลองเสื้อโปโลพิมพ์ลายไล่สีฟ้าเหลือง งานครบรอบ 50 ปีของโรงเรียน'],
  'jersey3d/choomthong': [['corp'], 'ภาพจำลองเสื้อโปโลพิมพ์ลายสีแดงขาว ลายภูเขา ของทีมตัวแทนขาย'],
  'jersey3d/ptk': [['corp'], 'ภาพจำลองเสื้อโปโลพิมพ์ลายสีขาวฟ้า ลายเครื่องมือช่างไฟ ของบริษัท PTK'],
  'jersey3d/watsadu': [['shop'], 'ภาพจำลองเสื้อโปโลพิมพ์ลายสีน้ำเงิน มีโลโก้สปอนเซอร์ ของร้านวัสดุก่อสร้าง'],
  'jersey3d/highvolt': [['event'], 'ภาพจำลองเสื้อโปโลพิมพ์ลายสีม่วง HIGHVOLT CAMP'],
  'sport3d/jpark': [['running'], 'ภาพจำลองเสื้อวิ่งพิมพ์ลายสีฟ้า งานวิ่งการกุศล Jpark Charity Run 2025', 'TD-0020'],
  'sport3d/red': [['sport'], 'ภาพจำลองเสื้อกีฬาพิมพ์ลายสีแดง ทีม NOMKONZ', 'TD-0009'],
  'sport3d/kongma': [['running'], 'ภาพจำลองเสื้อวิ่งพิมพ์ลายสีเหลืองลายเส้นฟ้า งาน KONG-MA RUN', 'TD-0013'],
  'sport3d/navy': [['sport'], 'ภาพจำลองเสื้อกีฬาพิมพ์ลายสีกรมท่า ทีม BADBUN', 'TD-0019'],
  'sport3d/bpm': [['badminton'], 'ภาพจำลองเสื้อแบดมินตันพิมพ์ลายสีพาสเทล ชมรม 8PM', 'TD-0006'],
}
/* รีวิว: reviews.json use เป็นหมวดใหญ่ (school = โรงเรียน) · กลุ่มย่อยอ่านจากชื่อ/ประเภทรีวิวเท่านั้น */
const REVIEW_GROUP = { corp: 'corp', school: 'edu', sport: 'sport', event: 'event' }
const reviewExtra = (r) => [/แบด|badminton/i.test(`${r.id} ${r.kind}`) && 'badminton', /นักวิ่ง|runner/i.test(`${r.id} ${r.kind}`) && 'running', /พนักงานร้าน/.test(r.kind || '') && 'shop'].filter(Boolean)

const uniq = (a) => [...new Set(a.filter(Boolean))]

/** สร้างคลัง · only = จำกัดโฟลเดอร์ชั้นแรก (ใช้ในเทส) */
export function buildLibrary(root, { only } = {}) {
  const pub = join(root, 'public')
  const data = (f) => JSON.parse(readFileSync(join(root, 'src/data', f), 'utf8'))
  const files = walk(join(pub, 'img')).filter((f) => !only || only.includes(f.split('/')[0]))
  const groups = groupFiles(files)
  const products = data('products.json')
  const techOf = Object.fromEntries(products.map((p) => [p.id, p.technique]))

  /* path รูปใดๆ (/img/x/y-320.jpg) → key ของรูปในคลัง */
  const keyOf = (p) => {
    const m = String(p || '').match(/\/img\/([^\s"'`?#)]+?)\.(?:webp|jpe?g|png|svg)\b/i)
    if (!m) return null
    if (groups.has(m[1])) return m[1]
    const v = m[1].match(/^(.*)-(\d+)$/)
    return v && groups.has(v[1]) ? v[1] : null
  }

  const meta = new Map()
  const tag = (img, t, source) => {
    const k = keyOf(img)
    if (!k) return
    const m = meta.get(k) || { groups: [], primary: [], product: [], sources: [] }
    if (t.kind) m.kind = t.kind
    if (t.groups) m.groups.push(...t.groups)
    if (t.primary) m.primary.push(...t.primary)
    if (t.product) m.product.push(...t.product)
    for (const f of ['alt', 'occ', 'q', 'code', 'sameAs', 'garment', 'color', 'origin', 'cat']) if (t[f] != null && m[f] == null) m[f] = t[f]
    m.sources.push(source)
    meta.set(k, m)
  }

  /* แบบมีรหัส TD · กลุ่ม = use + ทรงแบด/วิ่ง (ตรงกับ designsFor ใน vite.config.js) */
  for (const d of data('designs.json')) {
    const g = uniq([...(d.use || []), ['badminton', 'running'].includes(d.garment) && d.garment])
    tag(d.img, { kind: 'design', code: d.code, groups: g, primary: g, product: d.product || [], garment: d.garment, color: d.color, alt: `แบบ${d.garmentName} ${d.techName} รหัส ${d.code}` }, 'designs.json')
  }
  /* ภาพลูกค้า · photoGroup = กลุ่มหลักของรูป · uses = กลุ่มย่อยที่ติดไว้ */
  for (const c of data('customers.json')) {
    tag(c.img, { kind: 'customer', groups: uniq([c.photoGroup, ...(c.uses || [])]), primary: uniq([c.photoGroup]), alt: c.alt, occ: c.occ, q: c.q, cat: c.catName }, 'customers.json')
  }
  for (const w of data('works.json')) {
    tag(w.img, { groups: uniq([w.photoGroup, w.use, ...(w.alsoUse || [])]), primary: uniq([w.photoGroup || w.use]), product: uniq([w.product]), alt: w.alt, occ: w.occ, q: w.q, cat: w.catName }, 'works.json')
  }
  for (const r of data('reviews.json').items) {
    const g = uniq([REVIEW_GROUP[r.use], ...reviewExtra(r)])
    for (const x of [r, ...(r.gallery || [])]) if (x.img) tag(x.img, { kind: 'review', groups: g, primary: g, alt: `ภาพจากรีวิว ${r.who || r.kind}` }, 'reviews.json')
  }
  for (const [g, x] of Object.entries(data('live-gallery.json').groups)) {
    for (const it of x.items) tag(it.img, { kind: 'gallery', groups: [g], primary: [g], origin: it.src }, 'live-gallery.json')
  }
  const dd = data('download-designs.json')
  for (const p of dd.proofs) {
    for (const [x, kind] of [[p.design, 'proof'], [p.real, 'proof']]) if (x?.img) tag(x.img, { kind, groups: p.use || [], primary: p.use || [], product: p.product || [], alt: p.title }, 'download-designs.json')
    /* ภาพเคส FTI ในโฟลเดอร์ case เป็นงานเดียวกับคู่ภาพ fti */
    if (p.id === 'fti') for (const k of groups.keys()) if (k.startsWith('case/fti-')) tag(`/img/${k}.webp`, { groups: p.use || [], primary: p.use || [], product: p.product || [] }, 'download-designs.json (proofs fti)')
  }
  for (const s of dd.shapes) tag(s.img, { kind: 'shape', product: ['warmup'], alt: s.title }, 'download-designs.json')
  for (const s of dd.details) tag(s.img, { kind: 'detail', product: uniq([s.product]), alt: s.title }, 'download-designs.json')
  for (const s of dd.references) tag(s.img, { kind: 'reference', product: uniq([s.product]), alt: s.title }, 'download-designs.json')
  /* แถวผลงานหน้าแรก: polo / print / screen ตรงกับ id สินค้า · special รวมหลายสินค้า ไม่ติดสินค้า */
  /* 3 พ.ย.: ไฟล์มี byType (รูปเสื้อบนหุ่นแยกประเภทงาน) และ _note* ที่ไม่ใช่รายการรูป → ข้ามสิ่งที่ไม่ใช่ array */
  const showcase = data('home-work-showcase.json')
  for (const [row, list] of [...Object.entries(showcase), ...Object.entries(showcase.byType || {})]) {
    if (!Array.isArray(list)) continue
    for (const x of list) tag(x.img, { product: techOf[row] ? [row] : [], alt: x.alt || x.caption }, 'home-work-showcase.json')
  }
  for (const p of products) if (p.img) tag(p.img, { product: [p.id] }, 'products.json')
  for (const u of data('uses.json')) if (u.img) tag(u.img, { groups: [u.id], primary: [u.id] }, 'uses.json')
  for (const [k, [g, alt, sameAs]] of Object.entries(LINEUP)) {
    for (const side of ['front', 'back']) tag(`/img/${k}-${side}.webp`, { groups: g, primary: g, product: ['print'], alt: side === 'back' ? `${alt} ด้านหลัง` : alt, sameAs }, 'vite.config.js (teamLineup / sportLineup)')
  }
  for (const h of data('hero.json')) tag(h.img, { alt: h.alt }, 'hero.json')
  const logos = data('client-logos.json')
  for (const k of groups.keys()) {
    const m = k.match(/^client(?:-fit)?\/(c\d+)$/)
    if (m && logos[m[1]]) tag(`/img/${k}.png`, { alt: logos[m[1]] }, 'client-logos.json')
  }
  for (const f of data('sizing.json').fabrics) if (f.img) tag(f.img, { alt: f.name }, 'sizing.json')
  for (const g of data('groups.json')) if (g.img) tag(g.img, { alt: g.name }, 'groups.json')

  /* refs: ไฟล์ที่เขียน path รูปไว้ตรงๆ */
  const srcFiles = [
    ...walk(join(root, 'src')).map((f) => `src/${f}`).filter((f) => /\.(json|hbs|js|css)$/.test(f) && f !== 'src/data/media-library.json'),
    ...walk(join(root, 'site')).map((f) => `site/${f}`).filter((f) => f.endsWith('.html')),
    'vite.config.js',
  ]
  const refs = new Map()
  for (const f of srcFiles) {
    for (const [p] of readFileSync(join(root, f), 'utf8').matchAll(/\/img\/[^\s"'`?#),]+/g)) {
      const k = keyOf(p)
      if (k) refs.set(k, (refs.get(k) || new Set()).add(f))
    }
  }
  /* usedOn: หน้าใน dist/ ที่โหลดรูปนี้ (build ล่าสุด) */
  const used = new Map()
  const dist = join(root, 'dist')
  if (existsSync(dist)) {
    for (const f of walk(dist).filter((x) => x.endsWith('.html'))) {
      const route = `/${f.replace(/index\.html$/, '')}`
      if (route.startsWith('/ui/media/')) continue
      for (const [p] of readFileSync(join(dist, f), 'utf8').matchAll(/\/img\/[^\s"'`?#),]+/g)) {
        const k = keyOf(p)
        if (k) used.set(k, (used.get(k) || new Set()).add(route))
      }
    }
  }

  const items = []
  for (const [k, g] of groups) {
    const buf = readFileSync(join(pub, 'img', g.main))
    const m = meta.get(k) || { groups: [], primary: [], product: [], sources: [] }
    const folder = k.split('/')[0]
    let kind = m.kind || FOLDER_KIND[folder] || 'download'
    if (folder === 'download-designs' && m.code) kind = 'design'
    const product = uniq(m.product).sort()
    items.push({
      path: `/img/${g.main}`, kind, folder, ...imageSize(buf), bytes: statSync(join(pub, 'img', g.main)).size,
      formats: g.formats, variants: g.variants.map((v) => ({ w: v.w, path: `/img/${v.file}` })),
      md5: createHash('md5').update(buf).digest('hex'),
      ...(m.code && { code: m.code }),
      groups: uniq(m.groups).sort(), primary: uniq(m.primary).sort(), product, tech: uniq(product.map((p) => techOf[p])).sort(),
      ...Object.fromEntries(['sameAs', 'alt', 'occ', 'q', 'cat', 'garment', 'color', 'origin'].filter((f) => m[f] != null).map((f) => [f, m[f]])),
      sources: uniq(m.sources).sort(), refs: [...(refs.get(k) || [])].sort(), usedOn: [...(used.get(k) || [])].sort(),
    })
  }
  /* รูปซ้ำ: เนื้อไฟล์ตรงกัน → ตัวแรกตามชื่อเป็นตัวหลัก */
  const byMd5 = new Map()
  for (const m of items) byMd5.set(m.md5, [...(byMd5.get(m.md5) || []), m])
  let dupGroups = 0
  for (const list of byMd5.values()) {
    if (list.length < 2) continue
    dupGroups++
    for (const m of list.slice(1)) m.dupOf = list[0].path
  }

  const count = (fn) => items.reduce((o, m) => { for (const k of [].concat(fn(m))) o[k] = (o[k] || 0) + 1; return o }, {})
  const live = items.filter((m) => !m.dupOf)
  return {
    _note: 'คลังรูปกลาง · สร้างด้วย node scripts/media-library.mjs (อย่าแก้มือ รันใหม่จะทับ) · แท็กมาจากข้อมูลที่มีอยู่ (sources) · usedOn อ่านจาก dist/ ที่ build ล่าสุด · ดู/ค้นที่ /ui/media/',
    kinds: KINDS,
    groupNames: Object.fromEntries(data('uses.json').map((u) => [u.id, u.shortName])),
    productNames: Object.fromEntries(products.map((p) => [p.id, p.menuName || p.name])),
    stats: {
      images: items.length, files: files.filter((f) => EXT.test(f)).length, bytes: items.reduce((s, m) => s + m.bytes, 0),
      byKind: count((m) => m.kind), byFolder: count((m) => m.folder),
      duplicates: items.filter((m) => m.dupOf).length, dupGroups,
      byGroup: count((m) => (m.dupOf ? [] : m.groups)), untagged: live.filter((m) => !m.groups.length && !m.product.length).length,
    },
    items,
  }
}

/* รูปละแถว ให้ diff อ่านง่าย */
export const serialize = (lib) => {
  const { items, ...head } = lib
  const top = JSON.stringify(head, null, 2).replace(/\n}$/, '')
  return `${top},\n  "items": [\n${items.map((m) => `    ${JSON.stringify(m)}`).join(',\n')}\n  ]\n}\n`
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const lib = buildLibrary(root)
  writeFileSync(join(root, 'src/data/media-library.json'), serialize(lib))
  const s = lib.stats
  console.log(`media-library.json: ${s.images} รูป (${s.files} ไฟล์) · ซ้ำ ${s.duplicates} รูปใน ${s.dupGroups} ชุด · ไม่มีแท็ก ${s.untagged}`)
  console.log('ชนิด:', Object.entries(s.byKind).map(([k, n]) => `${k} ${n}`).join(' · '))
  console.log('กลุ่ม:', Object.entries(s.byGroup).map(([k, n]) => `${k} ${n}`).join(' · '))
  if (!existsSync(join(root, 'dist'))) console.log('ยังไม่มี dist/ · usedOn ว่าง (build ก่อนแล้วรันใหม่)')
}
