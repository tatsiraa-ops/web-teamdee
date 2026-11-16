/* ตัวช่วยและค่ากลางของ build (แยกจาก vite.config.js · 16 พ.ย. 2026 B1a) · path · โหมดเว็บจริง (forWp) · อ่านข้อมูล · URL · รีวิว · รูป · ไฟล์ดาวน์โหลด */
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { makeUrl } from '../../src/js/routes.js'
import { lineMessageUrl } from '../../src/js/use-cta.js'
import { mediaFor as pickFrom } from '../../src/js/media-library.js'
import { productPages } from './content.js'


/* ข้อความ LINE: ชื่ออังกฤษต่อท้ายคำไทยต้องเว้นวรรค ("ขอราคา Jersey Oversize" · ตรวจละเอียด 30 ต.ค.) */
export const sp = (n) => (/^[A-Za-z0-9]/.test(n) ? ` ${n}` : n)
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
/* ไฟล์หน้าเว็บอยู่ใน site/ วางโฟลเดอร์ตาม URL จริง เช่น site/sublimation/index.html → /sublimation/
   dev กับ build จึงได้ URL เดียวกันโดยไม่ต้อง rewrite (PLAN ข้อ 6) */
export const siteDir = resolve(root, 'site')
/* build สำหรับธีม WordPress (scripts/export-wp.mjs ตั้ง TD_TARGET=wp) · ตัด hero ต้นแบบ ไม่ทำ sitemap เอง (ปลั๊กอิน SEO ทำ) */
export const forWp = process.env.TD_TARGET === 'wp'
export const json = (f) => JSON.parse(readFileSync(resolve(root, 'src/data', f), 'utf8'))
/* รีวิวจริงจากแชทลูกค้า (src/data/reviews.json · 27 ต.ค.) · หน้าแต่ละกลุ่มเอารีวิวกลุ่มเดียวกันขึ้นก่อน แล้วเติมจากกลุ่มอื่นให้ครบ n */
/* ทุกรีวิวมีลิงก์ LINE "อยากได้แบบนี้" อ้างถึงทีมในรีวิว (ใช้ในกล่องดูรูป review-dialog.js) */
/* รูปลูกค้าองค์กรจริงที่ใส่โปโล (ดูด้วยตา 27 ต.ค.) · /embroidery/ แกลเลอรี · /corporate/ ส่วนเสื้อจริง (อาร์ตอนุญาต 30 ต.ค.) */
export const POLO_CORP_PHOTOS = [['co01', 'ทีมพนักงานใส่โปโลน้ำเงินแดงหน้าอาคาร'], ['co05', 'กลุ่มพนักงานใส่โปโลชมพูหน้าอาคาร'], ['co07', 'ทีมใส่โปโลกรมในงานกิจกรรมกลางแจ้ง'], ['co10', 'ผู้บริหารใส่โปโลขาวเทาบนเวทีงานกอล์ฟ'], ['co12', 'กลุ่มพนักงานถือใบประกาศ ใส่โปโลลายแดง'], ['co14', 'ลูกค้าใส่โปโลลายสีสดในร้านค้า']]
/* แบนเนอร์ LINE (lineCta.hbs): เสื้อลายจริงลอยเข้าหามือถือ = ภาพตัวหน้า (scripts/design-fronts.py) + รหัสจริง · ไม่มีภาพตัวหน้า = build พัง
   ใช้ร่วม /designs/ (รอบ 156) + /project/ (รอบ 160) */
export const lineFly = (designs) => ['TD-0001', 'TD-0006', 'TD-0007', 'TD-0008', 'TD-0021'].map((code) => { const x = designs.find((y) => y.code === code); const f = x && `/img/design-front/${x.img.split('/').pop().replace(/\.\w+$/, '')}-720.webp`; if (!f || !existsSync(resolve(root, 'public' + f))) throw new Error(`lineCta fly: ไม่มีภาพตัวหน้า ${code}`); return { code, img: f } })
export const reviewItems = () => json('reviews.json').items.map((r) => ({ ...r, line: lineMessageUrl(`สนใจทำเสื้อแบบในรีวิว "${r.who || r.kind}" บนเว็บทีมดี\nใช้กับงาน: \nจำนวนประมาณ:  ตัว`) }))
export const pickReviews = (use, n = 3, strict = false) => { const all = reviewItems(); const same = [...all.filter((r) => r.use === use && r.img), ...all.filter((r) => r.use === use && !r.img)]; return (strict ? same : [...same, ...all.filter((r) => r.use !== use && r.img)]).slice(0, n) }
/* รูปหลักหน้าสินค้า ใช้ของจริงแทนภาพจำลอง (2 พ.ย.: หน้าเบสบอลเดิมเป็นเสื้อคอปกซิป) · fit = เสื้อตัวเดียว ไม่ครอป */
export const HERO_PHOTO = {
  print: { img: '/img/case/fti-team.webp', alt: 'ทีม FTI ใส่เสื้อโปโลพิมพ์ลายในวันงานจริง', tag: 'งานผลิตจริง' },
  baseball: { img: '/img/download-designs/loose-121.webp', alt: 'เสื้อเบสบอลตัวจริงวางราบ', tag: 'งานผลิตจริง', fit: true },
  jersey: { img: '/img/download-designs/brand-068.webp', alt: 'เสื้อเจอร์ซีย์ BALAC CHULA ตัวจริงบนหุ่น', tag: 'งานผลิตจริง', fit: true },
}
/* รีวิวของหน้าสินค้า เลือกให้เข้าเรื่อง (2 พ.ย.: เดิมหน้าโปโลขึ้นรีวิวทีมฟุตบอล หน้าคอตตอนขึ้น "แห้งง่าย") */
export const REVIEW_PRODUCT = {
  polo: ['hr-outing', 'hospital', 'resort'],
  print: ['print-fabric', 'krungthai-badminton', 'swim-kids'],
  screen: ['runners', 'shrine', 'school-crossword'],
  warmup: ['school-sportsday', 'krungthai-badminton', 'school-crossword'],
  baseball: ['outing-fabric', 'shrine', 'school-crossword'],
  jersey: ['np-connect', 'krungthai-badminton', 'swim-kids'],
}
export const REVIEW_USE = { corp: 'corp', shop: 'corp', gov: 'corp', edu: 'school', class: 'school', faculty: 'school', sport: 'sport', badminton: 'sport', running: 'sport', event: 'event', polo: 'corp', print: 'sport', screen: 'event', warmup: 'school', baseball: 'sport', jersey: 'sport' }

/* srcset ของรูป hero (audit 2.7 · P2 · use-03): มีไฟล์ย่อคู่กันใน public/ (เช่น -540 · -320) จึงใส่ srcset · ไม่มีก็ใช้ไฟล์เดียว
   bigW = ความกว้างไฟล์ใหญ่จริง (ตรวจด้วย sips 24 ต.ค.: mockup/design 1080 · real 760 · customer 640) */
export const srcsetOf = (img, small, smallW, bigW) => {
  if (!img) return ''
  const s = img.replace(/(\.\w+)$/, `-${small}$1`)
  return existsSync(resolve(root, 'public' + s)) ? `${s} ${smallW}w, ${img} ${bigW}w` : ''
}

// นับจำนวนต่อหมวดให้ชิปตัวกรอง เรียงหมวดที่มีของเยอะสุดขึ้นก่อน
export const tally = (rows, key, nameKey) => {
  const seen = new Map()
  for (const r of rows) {
    if (!seen.has(r[key])) seen.set(r[key], { id: r[key], name: r[nameKey], n: 0 })
    seen.get(r[key]).n++
  }
  return [...seen.values()].sort((a, b) => b.n - a.n)
}


export const walk = (dir, base = '') => {
  const out = []
  for (const e of readdirSync(resolve(siteDir, dir), { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...walk(`${dir}/${e.name}`, `${base}${e.name}/`))
    else if (e.name.endsWith('.html')) out.push(base + e.name)
  }
  return out
}

export const input = {}
for (const p of walk('.').filter(p => !forWp || (!p.startsWith('design-preview/') && !p.startsWith('ui/')))) input[p === 'index.html' ? 'main' : p.replace(/\/?index\.html$|\.html$/, '').replace(/\//g, '-')] = resolve(siteDir, p)

export const routes = json('routes.json')
export const url = makeUrl(routes)

/* แบบเสื้อของแต่ละกลุ่มลูกค้า (v22) · ใช้ทั้งหน้ากลุ่มลูกค้าและแกลเลอรีรายกลุ่ม
   ตรงตามแท็กการใช้งาน (use) หรือทรง (garment) เท่านั้น · ร้านค้า รุ่น/ชมรม คณะ ยังไม่มีแบบติดแท็ก = ว่าง ไม่ยืมกลุ่มอื่น */
export const DESIGN_TAG = { shop: { use: 'shop' }, class: { use: 'class' }, faculty: { use: 'faculty' }, corp: { use: 'corp' }, gov: { use: 'gov' }, edu: { use: 'edu' }, sport: { use: 'sport' }, event: { use: 'event' }, badminton: { garment: 'badminton' }, running: { garment: 'running' } }
export const designsFor = (designs, id) => {
  const q = DESIGN_TAG[id]
  return !q ? [] : designs.filter((r) => (q.use ? (r.use || []).includes(q.use) : r.garment === q.garment))
}

/* คลังรูปกลาง (30 ต.ค.) · src/data/media-library.json สร้างด้วย node scripts/media-library.mjs · ดู/ค้นที่ /ui/media/
   หน้าใหม่ดึงรูปจากที่เดียว: mediaFor({ group: 'running', kind: ['customer', 'work'], limit: 6 })
   แม่แบบ: {{#each (media group="badminton" kind="customer,mockup3d" limit=6)}} · ได้ path / w / h / alt / occ / groups / product */
export const mediaLib = () => json('media-library.json')
export const mediaFor = (opts = {}) => pickFrom(mediaLib(), opts)


export const downloadAssetsFor = (kind, id, designs) => {
  const d = json('download-designs.json')
  /* รูปที่ขึ้นการ์ดตัวเลือก/รายละเอียดแล้วไม่ซ้ำในกล่องนี้ (2 พ.ย.) */
  const pageCards = kind === 'product' ? productPages()[id] : null
  const inPageCards = new Set(pageCards ? [...pageCards.options.cards, ...pageCards.detail.cards].map((c) => c.img) : [])
  const proofs = d.proofs.filter((p) => (p[kind] || []).includes(id)).slice(0, 3).map((p) => ({ ...p, line: lineMessageUrl(`สนใจเสื้อแนว ${p.title}\nจำนวนประมาณ:  ตัว\nใช้วันที่: `) }))
  const product = kind === 'product'
  const shapes = product && id === 'warmup' ? d.shapes.slice(0, 3) : [] // 3 ทรงที่ต่างกันจริง · เดิม 6 ภาพหน้าตาเกือบเหมือนกัน
  /* รูปรายละเอียดที่ลงการ์ดส่วน detail แล้ว (scripts/v22/product-pages.mjs DETAIL_PHOTO) ไม่ขึ้นซ้ำที่นี่ */
  const inCards = inPageCards
  const details = product ? d.details.filter((p) => p.product === id && !inCards.has(p.img)) : []
  const references = product ? d.references.filter((p) => p.product === id && !inPageCards.has(p.img)) : []
  /* โปโล: แบบตัวอย่างสีเสื้อซ้ำกับการ์ดตัวเลือกและแบบจากงานลูกค้า · v22 ไม่มีส่วนนี้ → เอาออก (2 พ.ย.) */
  const samples = []
  if (!proofs.length && !shapes.length && !details.length && !references.length && !samples.length) return null
  return { proofs, shapes, details, references, designs: samples, multipleProofs: proofs.length > 1,
    heading: shapes.length ? 'เลือกทรง ก่อนใส่ลายของทีม' : samples.length ? 'เลือกสีเสื้อ แล้วดูตำแหน่งโลโก้' : references.length ? 'เริ่มจากตำแหน่งลายที่อยากได้' : 'จากภาพแบบ สู่เสื้อที่ใส่จริง',
    intro: shapes.length ? 'เทียบแนวคอและฮู้ดจากภาพแบบ แล้วส่งทรงที่ชอบให้ทีมดีช่วยดูรายละเอียดต่อ' : samples.length ? 'ดูแนวสีและตำแหน่งปักจากภาพแบบ พร้อมภาพฝีเข็มระยะใกล้' : references.length ? 'ดูแนวการจัดวางกราฟิก แล้วให้ทีมดีช่วยเลือกวิธีทำให้เหมาะกับเสื้อของคุณ' : 'ดูภาพแบบคู่กับเสื้อจริง เพื่อเทียบการวางลาย คอเสื้อ และภาพรวมก่อนคุยแบบของทีม',
    note: shapes.length ? 'เลือกทรงที่ชอบ แล้วทีมดีวางลายของทีมให้' : samples.length ? 'รหัส TD ใช้อ้างอิงแบบบนเว็บไซต์ ส่งรหัสที่ชอบพร้อมโลโก้ของคุณให้ทีมดีได้เลย' : 'สีที่เห็นอาจต่างกันตามแสงและหน้าจอ ทีมดีช่วยตรวจรายละเอียดแบบก่อนผลิต',
    catalogLabel: product && id === 'jersey' ? 'ดูแนวลายเสื้อคณะ (ไม่ใช่ตัวเลือกทรง Oversize)' : 'เลือกแบบเพิ่มเติม',
    catalogHref: product && id === 'jersey' ? '/designs/?use=faculty&garment=football' : product && designs.some((d) => (d.product || []).includes(id)) ? `/designs/?product=${id}` : null,
  }
}
