import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync, readdirSync, openSync, readSync, closeSync } from 'node:fs'
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'
import tailwindcss from '@tailwindcss/vite'
import { makeUrl, pageFor } from './src/js/routes.js'
import { faqSchema, businessSchema, designListSchema, ldJson } from './src/js/seo-schema.js'
import { videosFor, videoView, videoSchema } from './src/js/video-view.js'
import { fillNudge } from './src/js/nudge.js'
import { fontPreloadTag, injectFontPreload } from './scripts/lib/font-preload.mjs'
import { workOf, WORK } from './src/js/design-filter.js'
import { buildRealGrid } from './src/js/real-grid.js'
import { parseStat } from './src/js/count-up.js'
import { productView, pending } from './src/js/product-view.js'
import { useView, fullRows } from './src/js/use-view.js'
import { useCta, lineMessageUrl, pageLineText, REORDER_TEXT, TRACK_TEXT } from './src/js/use-cta.js'
import { faqAskText } from './src/js/faq-search.js'
import { prunePending } from './src/js/prune.js'
import { homeView } from './src/js/home-view.js'
import { iconFor, FABRIC_ICONS, USE_ICON } from './src/js/fabric-icons.js'
import { blogView } from './src/js/blog-model.js'
import { guideView } from './src/js/guide-view.js'
import { guidePresentation } from './src/js/guide-presentation.js'
import { gallerySelection } from './src/js/gallery-selection.js'
import { mediaFor as pickFrom, galleryFor } from './src/js/media-library.js'
import { designDetail } from './src/js/design-page.js'
import { phrases, chunks } from './src/js/phrases.js'
import { thaiBreaks } from './src/js/thai-break.js'
import { calcPricing, calcKinds, calcHref, fabricRanges, productPrice, heroPrice, priceLine, useQuote, priceSummary } from './src/js/prices.js'

/* ข้อความ LINE: ชื่ออังกฤษต่อท้ายคำไทยต้องเว้นวรรค ("ขอราคา Jersey Oversize" · ตรวจละเอียด 30 ต.ค.) */
const sp = (n) => (/^[A-Za-z0-9]/.test(n) ? ` ${n}` : n)
const root = dirname(fileURLToPath(import.meta.url))
/* ไฟล์หน้าเว็บอยู่ใน site/ วางโฟลเดอร์ตาม URL จริง เช่น site/sublimation/index.html → /sublimation/
   dev กับ build จึงได้ URL เดียวกันโดยไม่ต้อง rewrite (PLAN ข้อ 6) */
const siteDir = resolve(root, 'site')
/* build สำหรับธีม WordPress (scripts/export-wp.mjs ตั้ง TD_TARGET=wp) · ตัด hero ต้นแบบ ไม่ทำ sitemap เอง (ปลั๊กอิน SEO ทำ) */
const forWp = process.env.TD_TARGET === 'wp'
const json = (f) => JSON.parse(readFileSync(resolve(root, 'src/data', f), 'utf8'))
/* รีวิวจริงจากแชทลูกค้า (src/data/reviews.json · 27 ต.ค.) · หน้าแต่ละกลุ่มเอารีวิวกลุ่มเดียวกันขึ้นก่อน แล้วเติมจากกลุ่มอื่นให้ครบ n */
/* ทุกรีวิวมีลิงก์ LINE "อยากได้แบบนี้" อ้างถึงทีมในรีวิว (ใช้ในกล่องดูรูป review-dialog.js) */
/* รูปลูกค้าองค์กรจริงที่ใส่โปโล (ดูด้วยตา 27 ต.ค.) · /embroidery/ แกลเลอรี · /corporate/ ส่วนเสื้อจริง (อาร์ตอนุญาต 30 ต.ค.) */
const POLO_CORP_PHOTOS = [['co01', 'ทีมพนักงานใส่โปโลน้ำเงินแดงหน้าอาคาร'], ['co05', 'กลุ่มพนักงานใส่โปโลชมพูหน้าอาคาร'], ['co07', 'ทีมใส่โปโลกรมในงานกิจกรรมกลางแจ้ง'], ['co10', 'ผู้บริหารใส่โปโลขาวเทาบนเวทีงานกอล์ฟ'], ['co12', 'กลุ่มพนักงานถือใบประกาศ ใส่โปโลลายแดง'], ['co14', 'ลูกค้าใส่โปโลลายสีสดในร้านค้า']]
/* แบนเนอร์ LINE (lineCta.hbs): เสื้อลายจริงลอยเข้าหามือถือ = ภาพตัวหน้า (scripts/design-fronts.py) + รหัสจริง · ไม่มีภาพตัวหน้า = build พัง
   ใช้ร่วม /designs/ (รอบ 156) + /project/ (รอบ 160) */
const lineFly = (designs) => ['TD-0001', 'TD-0006', 'TD-0007', 'TD-0008', 'TD-0021'].map((code) => { const x = designs.find((y) => y.code === code); const f = x && `/img/design-front/${x.img.split('/').pop().replace(/\.\w+$/, '')}-720.webp`; if (!f || !existsSync(resolve(root, 'public' + f))) throw new Error(`lineCta fly: ไม่มีภาพตัวหน้า ${code}`); return { code, img: f } })
const reviewItems = () => json('reviews.json').items.map((r) => ({ ...r, line: lineMessageUrl(`สนใจทำเสื้อแบบในรีวิว "${r.who || r.kind}" บนเว็บทีมดี\nใช้กับงาน: \nจำนวนประมาณ:  ตัว`) }))
const pickReviews = (use, n = 3, strict = false) => { const all = reviewItems(); const same = [...all.filter((r) => r.use === use && r.img), ...all.filter((r) => r.use === use && !r.img)]; return (strict ? same : [...same, ...all.filter((r) => r.use !== use && r.img)]).slice(0, n) }
/* รูปหลักหน้าสินค้า ใช้ของจริงแทนภาพจำลอง (2 พ.ย.: หน้าเบสบอลเดิมเป็นเสื้อคอปกซิป) · fit = เสื้อตัวเดียว ไม่ครอป */
const HERO_PHOTO = {
  print: { img: '/img/case/fti-team.webp', alt: 'ทีม FTI ใส่เสื้อโปโลพิมพ์ลายในวันงานจริง', tag: 'งานผลิตจริง' },
  baseball: { img: '/img/download-designs/loose-121.webp', alt: 'เสื้อเบสบอลตัวจริงวางราบ', tag: 'งานผลิตจริง', fit: true },
  jersey: { img: '/img/download-designs/brand-068.webp', alt: 'เสื้อเจอร์ซีย์ BALAC CHULA ตัวจริงบนหุ่น', tag: 'งานผลิตจริง', fit: true },
}
/* รีวิวของหน้าสินค้า เลือกให้เข้าเรื่อง (2 พ.ย.: เดิมหน้าโปโลขึ้นรีวิวทีมฟุตบอล หน้าคอตตอนขึ้น "แห้งง่าย") */
const REVIEW_PRODUCT = {
  polo: ['hr-outing', 'hospital', 'resort'],
  print: ['print-fabric', 'krungthai-badminton', 'swim-kids'],
  screen: ['runners', 'shrine', 'school-crossword'],
  warmup: ['school-sportsday', 'krungthai-badminton', 'school-crossword'],
  baseball: ['outing-fabric', 'shrine', 'school-crossword'],
  jersey: ['np-connect', 'krungthai-badminton', 'swim-kids'],
}
const REVIEW_USE = { corp: 'corp', shop: 'corp', gov: 'corp', edu: 'school', class: 'school', faculty: 'school', sport: 'sport', badminton: 'sport', running: 'sport', event: 'event', polo: 'corp', print: 'sport', screen: 'event', warmup: 'school', baseball: 'sport', jersey: 'sport' }

/* srcset ของรูป hero (audit 2.7 · P2 · use-03): มีไฟล์ย่อคู่กันใน public/ (เช่น -540 · -320) จึงใส่ srcset · ไม่มีก็ใช้ไฟล์เดียว
   bigW = ความกว้างไฟล์ใหญ่จริง (ตรวจด้วย sips 24 ต.ค.: mockup/design 1080 · real 760 · customer 640) */
const srcsetOf = (img, small, smallW, bigW) => {
  if (!img) return ''
  const s = img.replace(/(\.\w+)$/, `-${small}$1`)
  return existsSync(resolve(root, 'public' + s)) ? `${s} ${smallW}w, ${img} ${bigW}w` : ''
}

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
    /* งาน: พิมพ์ลาย งานปัก งานสกรีน (ตัวกรองหน้า /designs/) */
    work: workOf(d),
    thumbBoard: d.tech === 'embroidery' && d.img.startsWith('/img/download-designs/'),
    /* ภาพตัด 3:2 ให้เสื้อเต็มการ์ด /designs/ (6 พ.ย. "ทำรูปให้มันเต็มๆหน่อย" · scripts/design-thumbs.py) · ไม่มีไฟล์ = ใช้ภาพเดิม */
    ...(() => { const b = d.img.split('/').pop().replace(/\.\w+$/, ''); const t = `/img/design-thumb/${b}`; return existsSync(resolve(root, `public${t}-540.webp`)) ? { thumb: `${t}-1080.webp`, thumbSmall: `${t}-540.webp` } : {} })(),
    meta: [
      /* โปโลที่พิมพ์ลายทั้งตัวไม่ใช่โปโลปัก (audit 26 ต.ค. H6) · บอกทรงคู่กับเทคนิค */
      (d.product || []).map((x) => (x === 'print' && d.garment === 'polo' ? 'เสื้อโปโลพิมพ์ลาย' : P[x])).join(' / '),
      (d.use || []).map((x) => U[x]).join(' / '),
      (d.style || []).map((x) => S[x]).join(' / '),
    ].filter(Boolean).join(' · '),
  }))
}

// อ่านใหม่ทุกครั้งที่เรนเดอร์ ไม่งั้นแก้ไฟล์ JSON แล้วต้องรีสตาร์ต dev server ถึงจะเห็น
const loadData = () => ({
  site: json('site.json'),
  videos: json('videos.json').items,
  /* products / guides = ที่โชว์ในเมนู ค้นหา และหน้ารวม · all* = รวมหน้าที่ "รองรับไว้" แต่ยังไม่เปิด (hidden) */
  products: json('products.json').filter((x) => !x.hidden),
  allProducts: json('products.json'),
  /* เมนูสินค้า: แกนเดียวคือเทคนิค ทรงเสื้อเป็นลูก (Wireframe v2) */
  productTree: (() => {
    const shown = json('products.json').filter((x) => !x.hidden)
    return shown.filter((x) => !x.parent).map((x) => ({ ...x, children: shown.filter((c) => c.parent === x.id) }))
  })(),
  /* hero หน้าแรก: มีแบบแล้ว → เปิดไลน์พร้อมข้อความตั้งต้น (ส่งรูปแบบต่อในแชทได้) */
  haveDesignLine: lineMessageUrl('มีแบบแล้ว อยากให้ทีมดีช่วยดู'),
  /* ปุ่ม LINE ในกล่อง CTA หน้าแรก: เปิดแชทพร้อมข้อความตั้งต้นที่มีช่องให้เติม (ตรงกับแชทตัวอย่างในกล่อง · home.json cta1/cta2.msg) */
  /* หน้าติดต่อ ส่วนที่ตั้ง: แชทนัดเข้าพบ (อาร์ต 26 ต.ค. "cta เอาสไตล์ที่ผมชอบ") · ข้อความในแชทตัวอย่าง = ข้อความที่ปุ่มพิมพ์รอไว้ */
  /* กล่องปิดหน้า /blog/ แบบแชท (รื้อแนวนิตยสาร 27 ต.ค.) · หัวข้อตาม v22 · อ่านแล้วยังมีคำถาม = ถามตรง */
  blogCta: {
    title: 'มีโจทย์เสื้อทีม เล่าให้ทีมดีฟังได้เลย',
    lead: 'อ่านแล้วยังมีคำถาม หรืออยากให้ช่วยเลือกผ้าและเทคนิคให้เหมาะกับงาน ทักมาคุยได้',
    send: { label: 'บอกทีมดี 3 อย่าง', items: ['เรื่องที่อยากถาม', 'ใช้เสื้อกับงานอะไร', 'จำนวนประมาณกี่ตัว'] },
    msg: [{ t: 'สวัสดี ทีมดี อ่านบทความแล้วมีคำถาม' }, { t: 'เรื่องที่อยากถาม', q: true }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }],
    attach: [{ img: '/img/real/r08-320.webp' }],
    note: 'ข้อความนี้พิมพ์รอไว้ในแชท · แนบรูปเสื้อที่ชอบได้เลย',
    cta: 'ทัก LINE ถามทีมดี',
  },
  blogCtaLine: lineMessageUrl('สวัสดี ทีมดี อ่านบทความแล้วมีคำถาม\nเรื่องที่อยากถาม: \nใช้กับงาน: \nจำนวนประมาณ:  ตัว'),
  /* กล่องปิดหน้า /faq/ แบบแชท (ctaBox · รื้อ 26 ต.ค.) · ไม่เจอคำตอบ = ถามตรง แนบรูปเสื้อที่อยากถามได้ */
  faqCta: {
    title: 'ยังมีเรื่องที่อยากถาม? คุยกับทีมดีได้เลย',
    /* หัวข้อตาม v22 (เทส v22-structure) */
    lead: 'พิมพ์คำถามมาในแชท ทีมขายตอบในเวลาทำการ ส่งรูปเสื้อที่อยากได้มาด้วยก็ได้',
    send: { label: 'ถ้าบอกเพิ่มได้ ตอบได้ตรงขึ้น', items: ['ใช้เสื้อกับงานอะไร', 'จำนวนประมาณกี่ตัว', 'อยากได้รับเสื้อวันไหน'] },
    msg: [{ t: 'สวัสดี ทีมดี มีคำถามเรื่องสั่งทำเสื้อ' }, { t: 'คำถาม', q: true }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }],
    attach: [{ img: '/img/real/r03-320.webp' }],
    note: 'ข้อความนี้พิมพ์รอไว้ในแชท · แนบรูปเสื้อที่อยากถามได้เลย',
    cta: 'ทัก LINE ถามทีมดี',
  },
  faqCtaLine: lineMessageUrl('สวัสดี ทีมดี มีคำถามเรื่องสั่งทำเสื้อ\nคำถาม: \nใช้กับงาน: \nจำนวนประมาณ:  ตัว'),
  /* กล่องติดต่อหน้า /about-us/ แบบแชท (ctaBox · 26 ต.ค.) · ข้อความเดิม "บอกทีมดี 3 อย่าง: ใครใส่ จำนวน ใช้วันไหน" */
  /* /about-us/ รอบ 170 (ref Delicake our-story · tests/about-v2.test.js) */
  /* 170t ผังกลุ่มลูกค้า: นับจำนวนทีมต่อกลุ่มจาก named.items (ไม่พิมพ์ตัวเลขเอง) · ช่องบอร์ด photo/num/ico ตามข้อมูลที่มี */
  aboutV2: ((a) => {
    const items = a.named.items.map((i) => ({ ...i, tile: i.img ? 'photo' : i.qty ? 'num' : 'ico', grp: a.named.groups.find((g) => g.id === i.g) }))
    const groups = a.named.groups.map((g) => ({ ...g, n: items.filter((i) => i.g === g.id).length }))
    return { ...a, named: { ...a.named, items, groups, photos: items.filter((i) => i.img), others: items.filter((i) => !i.img) } }
  })(json('about-v2.json')),
  aboutCta: {
    title: 'มีโจทย์เสื้อทีม เล่าให้ทีมดีฟังได้เลย',
    lead: 'ยังไม่มีแบบก็เริ่มคุยได้ ทีมดีช่วยคิดแบบ ช่วยจัดการรายละเอียด จนรับเสื้อ',
    send: { label: 'บอกทีมดี 3 อย่าง', items: ['ใครใส่', 'จำนวนประมาณเท่าไร', 'ใช้วันไหน'] },
    msg: [{ t: 'สวัสดี ทีมดี มีโจทย์เสื้อทีมอยากเล่าให้ฟัง' }, { t: 'ใครใส่', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }, { t: 'ใช้วันไหน', q: true }],
    attach: [{ img: '/img/real/r05-320.webp' }, { file: 'logo-team.ai', kind: 'ไฟล์โลโก้' }],
    note: 'ข้อความนี้พิมพ์รอไว้ในแชท · แนบรูปที่ชอบหรือโลโก้ทีมได้เลย',
    cta: 'ทัก LINE เล่าโจทย์ให้ฟัง',
  },
  aboutCtaLine: lineMessageUrl('สวัสดี ทีมดี มีโจทย์เสื้อทีมอยากเล่าให้ฟัง\nใครใส่: \nจำนวนประมาณ:  ตัว\nใช้วันไหน: '),
  /* กล่องปิดหน้า /project/ แบบแชท (ctaBox · รื้อ 26 ต.ค.) · เห็นผลงานแล้วอยากทำบ้าง */
  reviewsCta: {
    title: 'อยากทำเสื้อให้ทีมของคุณบ้าง?',
    lead: 'เล่าการใช้งาน จำนวน และวันที่ต้องการรับเสื้อ ให้ทีมดีช่วยเลือกแนวทาง',
    send: { label: 'บอกทีมดีแค่ 3 อย่าง', items: ['ใช้เสื้อกับงานอะไร', 'จำนวนประมาณกี่ตัว', 'อยากได้รับเสื้อวันไหน'] },
    msg: [{ t: 'สวัสดี ทีมดี เห็นผลงานแล้ว อยากทำเสื้อให้ทีมบ้าง' }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }, { t: 'อยากได้รับวันที่', q: true }],
    attach: [{ img: '/img/real/r08-320.webp' }, { img: '/img/real/r11-320.webp' }],
    note: 'ข้อความนี้พิมพ์รอไว้ในแชท · แนบรูปที่ชอบหรือโลโก้ทีมได้เลย',
    cta: 'ทัก LINE เล่างานให้ฟัง',
  },
  reviewsCtaLine: lineMessageUrl('สวัสดี ทีมดี เห็นผลงานแล้ว อยากทำเสื้อให้ทีมบ้าง\nใช้กับงาน: \nจำนวนประมาณ:  ตัว\nอยากได้รับวันที่: '),
  /* กล่องปิดหน้า /designs/ แบบแชท (ctaBox) · ยังไม่เจอแบบที่ชอบ → ส่งภาพอ้างอิง */
  designsCta: {
    title: 'ยังไม่เจอแบบที่ชอบ? ส่งภาพอ้างอิงมาคุยได้',
    lead: 'แบบในหน้านี้เป็นตัวอย่างที่เคยทำ งานของคุณออกแบบใหม่ได้ทั้งหมด ส่งรูปที่ชอบ สีทีม หรือโลโก้มา ดีไซเนอร์ช่วยทำแบบให้',
    send: { label: 'ส่งมาได้เลย', items: ['รูปแบบเสื้อที่ชอบ', 'สีทีมหรือโลโก้', 'จำนวนและวันใช้'] },
    msg: [{ t: 'สวัสดี ทีมดี อยากได้แบบเสื้อแนวนี้' }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }, { t: 'อยากได้รับวันที่', q: true }],
    attach: [{ img: '/img/real/r05-320.webp' }, { file: 'logo-team.ai', kind: 'ไฟล์โลโก้' }],
    note: 'ข้อความนี้พิมพ์รอไว้ในแชท · แนบรูปที่ชอบหรือโลโก้ได้เลย',
    cta: 'ส่งภาพอ้างอิงทาง LINE',
  },
  visitMsg: [{ t: 'สวัสดี ทีมดี ขอนัดเข้าพบที่ออฟฟิศ' }, { t: 'วันที่สะดวก', q: true }, { t: 'จำนวนคน', q: true, unit: 'คน' }, { t: 'อยากดู: ตัวอย่างผ้า / เสื้อตัวอย่าง' }],
  designsCtaLine: lineMessageUrl('สวัสดี ทีมดี อยากได้แบบเสื้อแนวนี้\nใช้กับงาน: \nจำนวนประมาณ:  ตัว\nอยากได้รับวันที่: '),
  visitLine: lineMessageUrl('สวัสดี ทีมดี ขอนัดเข้าพบที่ออฟฟิศ\nวันที่สะดวก: \nจำนวนคน:  คน\nอยากดู: ตัวอย่างผ้า / เสื้อตัวอย่าง'),
  ctaLine: (() => { const h = json('home.json'); const text = (c) => c.msg.map((m) => m.t + (m.q ? `: ${m.unit ? ` ${m.unit}` : ''}` : '')).join('\n'); return { no: lineMessageUrl(text(h.cta1)), have: lineMessageUrl(text(h.cta2)) } })(),
  /* บรรทัดราคาใต้ปุ่ม hero หน้าแรก (audit 26 ต.ค. M13) · ราคาที่จำนวนน้อยสุดพร้อมจำนวน */
  heroPrices: { polo: priceLine(json('prices.json'), 'polo'), print: priceLine(json('prices.json'), 'print') },
  /* แยก "220 บาท/ตัว (ผ้าจูติ 10–50 ตัว)" เป็นราคา + เงื่อนไข ให้ราคาเด่น เงื่อนไขตัวเล็กเทา (อาร์ต 26 ต.ค. "cta hero ต่อเลย") */
  heroPriceParts: Object.fromEntries(['polo', 'print'].map((k) => { const s = priceLine(json('prices.json'), k); const m = /^(.*?) \((.*)\)$/.exec(s); return [k, m ? { p: m[1], n: m[2] } : { p: s, n: '' }] })),
  /* เมนูหลักตาม v22 · src/data/nav.json */
  nav: json('nav.json'),
  techniques: json('techniques.json'),
  groups: json('groups.json'),
  works: json('works.json'),
  /* เครื่องคำนวณ /calculations/ · สร้างจาก prices.json ไฟล์ราคาเดียวของเว็บ (src/js/prices.js) */
  pricing: calcPricing(json('prices.json')),
  /* ชิปขั้น 1 · ผ้าโปโล · ออปชัน · บรรทัดราคาใต้ H1 ของเครื่องคำนวณ (audit calc-01 calc-06) */
  /* รูปเสื้อของแต่ละแบบในเครื่องคำนวณ (รื้อหน้า 26 ต.ค.) · การ์ดใช้ไฟล์ -540.webp · สกรีนยังไม่มีรูป = ไอคอน */
  calculator: (() => {
    const c = calcKinds(json('prices.json'))
    const IMG = { polo: '/img/mockup/polo-embroidery-scg', round: '/img/design/d01', collar: '/img/design/d11', baseball: '/img/mockup/m08', jersey: '/img/design/d12' }
    /* ชื่อบนการ์ดแยกเป็นก้อน ไม่ให้ตัดกลางคำ ("พิมพ์ลายคอ|ปก") */
    const parts = (n) => (n.startsWith('พิมพ์ลาย') ? ['พิมพ์ลาย', n.slice(8)] : n.split(' '))
    return { ...c, kinds: c.kinds.map((k) => ({ ...k, nameParts: parts(k.name), ...(IMG[k.id] && { img: { sm: `${IMG[k.id]}-540.webp` } }) })) }
  })(),
  /* เวลาผลิตแยกงาน · หน้ากลุ่มลูกค้าส่วน "มีวันใช้แล้ว" (23 ต.ค.) */
  leadTimes: json('lead-times.json'),
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
  contactDocs: ['ใบเสนอราคา', 'ใบกำกับภาษีเต็มรูป', 'หนังสือรับรองบริษัท', 'ภ.พ.20', 'ใบส่งของ'],
  /* บทความเดิม 12 เรื่องบนเว็บจริง (URL เดิม · ตัวบทความอยู่ใน CMS) · หน้า /blog/ เป็นฮับของบทความพวกนี้ตาม v22 */
  legacyPosts: blogView(json('legacy-posts.json')),
  v22Posts: Object.entries(json('posts.json')).filter(([k]) => k[0] !== '_').map(([id, x]) => ({ id, title: x.h1, lead: x.lead })),
  /* การ์ดมุมซ้ายล่าง · {designs} = จำนวนแบบที่มีรหัสจริง (nudge.js fillNudge) */
  nudges: json('nudges.json').items.map((x) => ({ ...x, title: fillNudge(x.title, { designs: json('designs.json').length }) })),
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
  /* hero แบบทีม (ค่าเริ่มต้น ตามแบบ Figma Present 2026) · เรียงเสื้อ 3D 5 ตัวแทนคน 5 คนในแบบ
     ระหว่างรอถ่ายรูปคนใส่จริง (อาร์ตเลือกทาง A-2 วันที่ 20 ต.ค. 2026) · ตัวกลางคือตัวเอก
     label = งานแบบไหน ดูจากโลโก้บนเสื้อ · ทุกตัวมีโลโก้ลูกค้าจริง ต้องขออนุญาตก่อนเผยแพร่ */
  teamLineup: [
    { id: 'school50', label: 'โรงเรียน · ครบรอบ 50 ปี', alt: 'ภาพจำลองเสื้อโปโลพิมพ์ลายไล่สีฟ้าเหลือง งานครบรอบ 50 ปีของโรงเรียน' },
    { id: 'choomthong', label: 'ทีมขาย · องค์กร', alt: 'ภาพจำลองเสื้อโปโลพิมพ์ลายสีแดงขาว ลายภูเขา ของทีมตัวแทนขาย' },
    { id: 'ptk', label: 'ยูนิฟอร์มบริษัท', alt: 'ภาพจำลองเสื้อโปโลพิมพ์ลายสีขาวฟ้า ลายเครื่องมือช่างไฟ ของบริษัท PTK' },
    { id: 'watsadu', label: 'ทีมงาน · ร้านวัสดุ', alt: 'ภาพจำลองเสื้อโปโลพิมพ์ลายสีน้ำเงิน มีโลโก้สปอนเซอร์ ของร้านวัสดุก่อสร้าง' },
    { id: 'highvolt', label: 'ค่าย · กิจกรรม', alt: 'ภาพจำลองเสื้อโปโลพิมพ์ลายสีม่วง HIGHVOLT CAMP' },
  ].map((x, i) => ({
    ...x,
    lead: i === 2,
    front: `/img/jersey3d/${x.id}-front.webp`,
    frontSmall: `/img/jersey3d/${x.id}-front-440.webp`,
    backSmall: `/img/jersey3d/${x.id}-back-440.webp`,
  })),
  /* hero ชุด 02 เสื้อกีฬา / เสื้อกิจกรรม (v22) · ภาพม็อกอัปเสื้อกีฬาพิมพ์ลายของทีมดีจากเว็บจริง ตัดเฉพาะตัวหน้าเป็นพื้นใส (22 ต.ค. 2026)
     มีชื่อทีม/งานลูกค้าบนเสื้อเหมือนชุดแรก ต้องขออนุญาตก่อนขึ้นจริง */
  sportLineup: [
    { id: 'jpark', alt: 'ภาพจำลองเสื้อวิ่งพิมพ์ลายสีฟ้า งานวิ่งการกุศล Jpark Charity Run 2025' },
    { id: 'red', alt: 'ภาพจำลองเสื้อกีฬาพิมพ์ลายสีแดง ทีม NOMKONZ' },
    { id: 'kongma', alt: 'ภาพจำลองเสื้อวิ่งพิมพ์ลายสีเหลืองลายเส้นฟ้า งาน KONG-MA RUN' },
    { id: 'navy', alt: 'ภาพจำลองเสื้อกีฬาพิมพ์ลายสีกรมท่า ทีม BADBUN' },
    { id: 'bpm', alt: 'ภาพจำลองเสื้อแบดมินตันพิมพ์ลายสีพาสเทล ชมรม 8PM' },
  ].map((x, i) => ({
    ...x,
    lead: i === 2,
    front: `/img/sport3d/${x.id}-front.webp`,
    frontSmall: `/img/sport3d/${x.id}-front-440.webp`,
  })),
  /* วงกลมรูปทีมลูกค้า 30 รูป สลับหมวดกันไม่ให้รูปองค์กรกองอยู่แถวเดียว · รูปชุดเดียวกับหน้า /projects/ */
  homeCircles: (() => {
    const c = json('customers.json')
    const byCat = {}
    for (const x of c) (byCat[x.cat] ||= []).push(x)
    const lists = Object.values(byCat)
    const out = []
    for (let i = 0; out.length < 30 && lists.some((l) => l[i]); i++) for (const l of lists) if (l[i] && out.length < 30) out.push(l[i])
    return out
  })(),
  /* กลุ่มลูกค้าหน้าแรก · แถวละกลุ่มตามเมนู "เสื้อสำหรับทีมคุณ" (อาร์ต 3 พ.ย. 2026) · ชื่อแถวจาก nav.json · การ์ดจาก home.json uses.cards · รูปจริงตัด 4:3 ใน public/img/uses-row */
  /* บทความหน้าแรก (อาร์ต 3 พ.ย. "เอาเป็นบทความแทน วางให้ชิดกว่าหน้า blog") · ล่าสุด 4 เรื่องจากบทความที่เผยแพร่จริง (legacy-posts.json) */
  homePosts: (() => {
    const j = json('legacy-posts.json')
    const cat = Object.fromEntries(j.cats.map((c) => [c.id, c.name]))
    return [...j.items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map((p) => ({ ...p, catName: cat[p.cat] || '' }))
  })(),
  /* คลังรีวิว (10 พ.ย. 2026 อาร์ต "เอาแค่รูป รูปลูกค้า เยอะๆ น่าเชื่อถือ · จะเอาไปใส่อีกหลายหน้า") · partial reviewWall.hbs
     รอบ 2 "รีวิวไม่ต้องเลื่อน แสดงเต็มๆ · เยอะๆ 10 แถว": ผนังรูปเรียงเต็มแถว (r = กว้าง/สูง ให้ CSS จัดสูงเท่ากันในแถว)
     รูปลูกค้าจริงจาก media-library (kind customer · คุณภาพ q3) คละกลุ่มสลับกันทีละรูป
     items = ทุกกลุ่ม 60 รูป (หน้าแรก) · groups.<id> = เฉพาะกลุ่มนั้น 30 รูป เตรียมไว้ให้หน้าอื่น ({{> reviewWall items=reviewWall.groups.corp}}) · faces = 3 วงบนปุ่ม */
  reviewWall: (() => {
    const lib = json('media-library.json').items
    const pool = lib.filter((x) => x.kind === 'customer' && x.q === 3 && x.w && x.h && (x.alt || x.occ)).sort((a, b) => a.path.localeCompare(b.path))
    const view = (x) => {
      const v = (x.variants || []).filter((y) => y.w < x.w).sort((a, b) => a.w - b.w)
      return { img: x.path, srcset: [...v.map((y) => `${y.path} ${y.w}w`), `${x.path} ${x.w}w`].join(', '), w: x.w, h: x.h, r: Math.round((x.w / x.h) * 1000) / 1000, sw: Math.round((200 * x.w) / x.h), alt: x.alt || x.occ, thumb: (v[0] || x).path }
    }
    const mix = (list) => {
      const by = new Map()
      for (const x of list) { const g = (x.primary || [])[0] || '-'; by.set(g, [...(by.get(g) || []), x]) }
      const qs = [...by.values()], out = []
      while (qs.some((q) => q.length)) for (const q of qs) if (q.length) out.push(q.shift())
      return out
    }
    const items = mix(pool).slice(0, 60).map(view)
    const ids = [...new Set(pool.flatMap((x) => x.primary || []))]
    return {
      total: lib.filter((x) => x.kind === 'customer').length,
      items,
      faces: items.filter((x) => x.r >= 0.9 && x.r <= 1.1).slice(0, 3).map((x) => x.thumb),
      groups: Object.fromEntries(ids.map((id) => [id, mix(pool.filter((x) => (x.groups || []).includes(id))).slice(0, 30).map(view)])),
    }
  })(),
  homeUseRows: (() => {
    const u = json('home.json').uses
    return json('nav.json').uses.groups.map((g, i) => ({ h: g.h, cards: u.rows[i].map((key) => ({ key, ...u.cards[key], img: `/img/uses-row/${key}-960.webp`, imgSmall: `/img/uses-row/${key}-640.webp` })) }))
  })(),
  /* หน้าแรกตาม Wireframe v4 (21 ต.ค. 2026) · ข้อความอยู่ใน home.json · ที่นี่เติมรูปจริงที่มีอยู่แล้ว
     ช่องที่ยังไม่มีของจริง (รีวิว คลิป โลโก้ที่ได้อนุญาต งานสกรีน งานแบบพิเศษ) คงเป็นช่องรอข้อมูลตาม v4 */
  homeCustomerProof: (() => {
    const allReviews = reviewItems()
    const vids = videosFor(json('videos.json').items, 'projects', { forWp }).map(videoView)
    return {
      allReviews,
      reviewRows: [allReviews.filter((_, i) => i % 2 === 0), allReviews.filter((_, i) => i % 2 === 1)],
      /* กระดานรีวิวหน้าแรก (อาร์ต 3 พ.ย. แบบ Delicake) · เฉพาะรีวิวที่มีรูป · โชว์ 3 รูปแรก ที่เหลือกดดูในกล่องดูรูป */
      board: allReviews.filter((r) => r.img).map((r) => { const g = r.gallery?.length ? r.gallery : [{ img: r.img, imgSmall: r.imgSmall }]; return { ...r, photos: g.slice(0, 3), more: Math.max(0, g.length - 3), total: g.length } }),
      boardChips: [['corp', 'องค์กร / บริษัท'], ['sport', 'ทีมกีฬา'], ['event', 'อีเวนต์ / งานบุญ'], ['school', 'โรงเรียน']].map(([use, name]) => ({ use, name, n: allReviews.filter((r) => r.img && r.use === use).length })),
      /* โมเสกซ้ายตามกลุ่ม · รูปลูกค้าจริงจาก img/customer (ย่อเป็น img/review-board/*-800) · ไม่ซ้ำกับการ์ดกลุ่มลูกค้าด้านบน */
      boardGroups: [['corp', 'องค์กร / บริษัท', ['lc237', 'lc264', 'lc22', 'lc211', 'lc203']], ['sport', 'ทีมกีฬา', ['lc14', 'lc128', 'lc161', 'lc12', 'lc113']], ['event', 'อีเวนต์ / งานบุญ', ['lc182', 'lc153', 'lc119', 'lc174', 'lc259']], ['school', 'โรงเรียน', ['lc334', 'lc123', 'lc292', 'lc278', 'lc328']]].map(([use, name, ids]) => ({ use, name, photos: ids.map((id) => `/img/review-board/${id}-800.webp`) })),
      clips: vids.slice(0, 3), moreClips: vids.slice(3),
    }
  })(),
  homeV4: (() => {
    const h = json('home.json')
    const products = json('products.json')
    const customers = json('customers.json')
    const works = json('works.json')
    const uses = json('uses.json')
    const designs = withMeta()
    const pick = (id) => products.find((p) => p.id === id)
    /* รูปทีมจริง 3 แถว × 6 รูป สลับหมวด ไม่ให้หมวดเดียวกองแถวเดียว */
    const byCat = {}
    for (const c of customers) (byCat[c.cat] ||= []).push(c)
    const lists = Object.values(byCat)
    const mixed = []
    for (let i = 0; mixed.length < 48 && lists.some((l) => l[i]); i++) for (const l of lists) if (l[i]) mixed.push(l[i])
    /* รูปลูกค้าแถวเดียว 12 รูป (เดิม 3 แถว ซ้ำกับส่วนอื่นมากไป) */
    const photoRows = [mixed.slice(0, 6), mixed.slice(6, 12), mixed.slice(12, 18)]
    /* กริด "ผลงานจริง" (เคส + ภาพลูกค้า) แทน 2 แถวเลื่อน · รูปเคสใช้ไฟล์ -320.webp ถ้ามี (อาร์ต 23 ต.ค.) */
    const realGrid = buildRealGrid(works, customers, { perCat: 4 })
    for (const it of realGrid.items) {
      const small = it.imgSmall || it.img.replace(/\.(jpg|webp)$/, '-320.webp')
      if (!it.imgSmall && existsSync(resolve(root, 'public' + small))) it.imgSmall = small
    }
    /* โลโก้ตัดขอบขาวแล้ววางกลางผืน 336×144 ขนาดตามพื้นที่ (img/client-fit จาก img/client · อาร์ตสั่ง 22 ต.ค.: ไม่เอากรอบ โลโก้ต้องอยู่กลาง) */
    const logoFiles = h.logos.show ? readdirSync(resolve(root, 'public/img/client-fit')).filter((f) => /\.(png|svg|webp)$/.test(f)).sort() : []
    const logoNames = json('client-logos.json')
    const half = Math.ceil(logoFiles.length / 2)
    const printDesigns = designs.filter((d) => (d.product || []).includes('print'))
    /* ส่วนที่ยังไม่มีข้อมูลจริง ต้นแบบโชว์พร้อมป้าย · เว็บจริงตัด [วงเล็บ] และซ่อนส่วนที่ไม่เหลือของจริง (src/js/home-view.js มีเทส) */
    const v = homeView(h, { forWp, latestPosts: json('legacy-posts.json').items.slice(0, 2), years: new Date().getFullYear() - json('site.json').foundedYear })
    return {
      ...v,
      /* การ์ดบริการ: ข้อมูลจริงที่ยืนยันแล้ว 3 ช่อง (ราคา prices.json · เวลาผลิต lead-times.json · ขั้นต่ำ) · อาร์ต 23 ต.ค. "ต้องดีที่สุด"
         ราคาต้องบอกจำนวนและชนิดคอเสื้อที่ใช้ได้ (audit home-02) · ใช้ heroPrice ร่วมกับหน้าสินค้า · การ์ดที่เครื่องคำนวณคิดได้ มีลิงก์ "คำนวณราคาตามจำนวน" พร้อม ?kind= */
      /* วิธีนับวันผลิตใต้การ์ดบริการ (เปิดทุกวัน · เริ่มนับวันถัดจากยืนยันแบบ · ช่วงคิวแน่น · งานด่วน) */
      cats: { ...h.cats, leadNote: json('lead-times.json').note, items: h.cats.items.map((c) => {
        const prices = json('prices.json')
        const price = heroPrice(prices, c.id)
        const lead = json('lead-times.json')[c.id]
        return { ...c, product: pick(c.id), calcHref: calcHref(prices, c.id, url('calculations')), facts: [
          /* มีตัวเลข = "ราคารวม VAT" · สกรีนที่ประเมินตามแบบ = "ราคา" เฉยๆ */
          { k: price?.sub ? 'ราคารวม VAT' : 'ราคา', v: price?.v || '', sub: price?.sub || '' },
          /* สกรีนของทีมดีมีแค่ DFT (26 ต.ค.) · คงคำว่า DFT ไว้ให้รู้ว่าเป็นงานแบบไหน */
          { k: 'ผลิต', v: lead ? lead.days : '' },
          { k: 'ขั้นต่ำ', v: `${prices.products[c.id]?.minQty ?? prices.minQty} ตัว` },
        ].filter((f) => f.v),
        /* ชิปบนการ์ด (อาร์ตเคาะ 30 ต.ค. "1 ก" · ไม่แตะ hero) · ราคาที่จำนวนน้อยสุด · สกรีนขั้นต่ำ 1 ตัว */
        chip: { price: price?.v?.match(/^[\d,]+ บาท\/ตัว/)?.[0] ? `เริ่ม ${price.v.match(/^[\d,]+ บาท\/ตัว/)[0]}` : '', meta: [`ขั้นต่ำ ${prices.products[c.id]?.minQty ?? prices.minQty} ตัว`, lead && `ผลิต ${lead.days}`].filter(Boolean).join(' · ') } }
      }) },
      logoRows: h.logos.show
        ? [logoFiles.slice(0, half), logoFiles.slice(half)].map((row) => row.map((f) => ({ img: `/img/client-fit/${f}`, alt: logoNames[f.replace(/\.\w+$/, '')] || '' })))
        : [1, 2].map((r) => Array.from({ length: 7 }, (_, i) => ({ ph: `โลโก้แบรนด์ ${r}-${i + 1}` }))),
      logoCount: logoFiles.length,
      photoRows,
      realGrid,
      /* แถบรูปลูกค้าจริงใต้ hero (critique 24 ต.ค. "หลักฐานมาช้าเกิน" · อาร์ตเลือก "หลักฐานขึ้นก่อน") · สลับหมวด ไม่ซ้ำกับกริดผลงาน */
      proofStrip: (() => {
        const used = new Set(realGrid.items.map((x) => x.img))
        return mixed.filter((c) => !used.has(c.img)).slice(0, 8)
      })(),
      gallery: {
        ...h.gallery,
        /* 3 พ.ย. อาร์ต "เอารหัสออก": รูป d01–d31 มีป้ายรหัสติดในไฟล์ → หน้าแรกใช้ชุด img/design-clean (ลบป้าย · ต้นฉบับไม่แตะ) */
        /* 9 พ.ย. อาร์ต "ทำให้ดีๆ ไม่ต้องเจนใหม่": การ์ดใช้ชุด design-home (ครอปชิดเสื้อ ลบพื้นตาราง/แถบโลโก้ · scripts/design-home-crops.py)
           full = ไฟล์ครอปสะอาด 1200 ให้กล่องดูรูปใหญ่ (original = ไฟล์ต้นฉบับ) · lead ขึ้นก่อน (คละกลุ่ม) · hide ไม่ขึ้นหน้าแรก */
        items: (() => {
          const lead = h.gallery.lead || []
          const rank = (d) => (lead.includes(d.code) ? lead.indexOf(d.code) : lead.length)
          return printDesigns
            .filter((d) => !(h.gallery.hide || []).includes(d.code))
            .map((d, i) => ({ d, i }))
            .sort((a, b) => rank(a.d) - rank(b.d) || a.i - b.i)
            .map(({ d }) => {
              const c = (p) => p && p.replace('/img/design/', '/img/design-clean/').replace(/\.jpg$/, '.webp')
              const full = d.img?.startsWith('/img/design/') && existsSync(resolve(root, 'public' + c(d.img))) ? c(d.img) : d.img
              return { ...d, design: 1, full: `/img/design-home/${d.code}-1200.webp`, original: full, img: `/img/design-home/${d.code}-720.webp`, imgSmall: `/img/design-home/${d.code}-480.webp` }
            })
            /* 10 พ.ย. อาร์ต "รวบรวมรูปมาให้เต็มๆ ทุกหมวด": แบบจริงจากแกลเลอรีเว็บเดิม (ไม่มีรหัส) ต่อท้าย เติมกลุ่มที่แบบมีรหัสน้อย · ตัวเดียวอยู่ได้หลายกลุ่ม */
            .concat((() => {
              const byKey = new Map()
              for (const [use, keys] of Object.entries(h.gallery.extra || {})) for (const k of keys) byKey.set(k, [...(byKey.get(k) || []), use])
              const nameOf = (id) => uses.find((u) => u.id === id)?.name.split(' / ')[0] || 'เสื้อทีม'
              return [...byKey].map(([k, use]) => ({ code: '', key: k, use, design: 1, garmentName: nameOf(use[0]), techName: 'พิมพ์ลาย', meta: `เสื้อพิมพ์ลาย · ${use.map((u) => uses.find((x) => x.id === u)?.shortName || u).join(' · ')}`,
                full: `/img/design-home/g-${k}-1200.webp`, original: `/img/gallery/${k.replace('-', '/')}.webp`, img: `/img/design-home/g-${k}-720.webp`, imgSmall: `/img/design-home/g-${k}-480.webp` }))
            })())
        })(),
        total: printDesigns.length,
        uses: uses.map((u) => ({ id: u.id, name: u.name, short: u.shortName || u.name, n: printDesigns.filter((d) => (d.use || []).includes(u.id)).length + (h.gallery.extra?.[u.id]?.length || 0) })).filter((u) => u.n > 0),
      },
      works: {
        ...h.works,
        /* แถวเสื้อจริงบนหุ่นแบบ PMK (บอร์ด Miro 3 พ.ย. 2026) */
        mannequin: json('home-work-showcase.json').mannequin || [],
        /* แถวเดียวมีแท็บ 4 หมวด · เว็บจริงไม่มีช่องรอภาพ และไม่มีแท็บที่ยังไม่มีงานจริง */
        rows: h.works.rows
          .map((row) => {
            const real = json('home-work-showcase.json')[row.id] || []
            const productIds = row.id === 'special' ? ['warmup', 'baseball', 'jersey'] : [row.id]
            return { ...row, real, links: productIds.map(id => ({ href: url('products', id), title: pick(id).name })) }

          })
          .filter(Boolean)
          .map((row, i) => ({ ...row, first: i === 0 })),
      },
      /* โชว์รูมผลงาน (อาร์ต 3 พ.ย. "ครีเอทเอง") · แท็บ 6 ประเภท แต่ละแผง 4 รูป (รูปแรกใหญ่) + การ์ดชวนคุย
         fit = แบบ/ภาพบนพื้นขาว ย่อพอดีกรอบไม่ตัด · ภาพงานจริง/ภาพลูกค้า = เต็มกรอบ · แผ่นแบบที่มีหัวโลโก้/แถบรหัส ใช้ไฟล์ครอป img/work-crop (ต้นฉบับไม่แตะ) */
      showroom: (() => {
        /* 3 พ.ย. รอบ 2 อาร์ต "แยกตามประเภทงานได้เลย พิมพ์ลาย ปัก สกรีน พิเศษ · แต่ละหมวดเจนรูปใส่หุ่น 4 รูป" (home-work-showcase.json byType)
           การ์ดสุดท้าย = ไอคอน 3D ประจำหมวด + ชิปลิงก์สินค้า + LINE เต็มกว้างในกรอบ */
        const show = json('home-work-showcase.json')
        const icon = { print: 'faq-compare', polo: 'talk-quote', screen: 'talk-design', special: 'faq-warmup' }
        const rows = Object.fromEntries(h.works.rows.map((r) => [r.id, r]))
        return ['print', 'polo', 'screen', 'special'].map((id) => {
          const row = rows[id]
          const productIds = id === 'special' ? ['warmup', 'baseball', 'jersey'] : [id]
          /* หมวดที่มีหลายสินค้า ชิปบอกครบแล้ว ไม่ต้องมีคำอธิบายซ้ำ (การ์ดแบบพิเศษเคยล้น 32px) */
          return { id, title: row.title, sub: row.lead, lead: productIds.length > 1 ? '' : row.lead, icon: `/img/icons/${icon[id]}.webp`, links: productIds.map((p) => ({ href: url('products', p), title: pick(p).name })), items: (show.byType?.[id] || []).slice(0, 4) }
        })
      })(),
    }
  })(),
  /* ผ้าที่มีรูปจริง ใช้ในแถบผ้าหน้าแรก */
  homeFabrics: json('sizing.json').fabrics.filter((f) => f.img),
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
    /* ทรงเสื้อ (garment) · ชื่อสั้นสำหรับชิป · เรียงตามจำนวนแบบ */
    const short = { football: 'ฟุตบอล', tank: 'แขนกุด', polo: 'โปโล', badminton: 'แบดมินตัน', running: 'วิ่ง', baseball: 'เบสบอล' }
    const garments = [...new Map(d.map((r) => [r.garment, r.garmentName])).entries()]
      .map(([id, name]) => ({ id, name: short[id] || name.replace(/^เสื้อ/, ''), n: d.filter((r) => r.garment === id).length }))
      .sort((a, b) => b.n - a.n)
    /* งาน: พิมพ์ลาย · งานปัก · งานสกรีน (อาร์ตเคาะ 26 ต.ค.) · งานที่ยังไม่มีแบบในคลังโชว์ไว้แต่เลือกไม่ได้ (none) ให้รู้ว่าทีมดีรับงานนี้
       ทางไปหน้าสินค้าของงานที่ยังไม่มีแบบอยู่ใน noDesigns ใต้ตัวกรอง */
    const works = Object.entries(WORK).map(([id, w]) => ({ id, name: w.name, n: d.filter((r) => workOf(r) === id).length })).map((w) => ({ ...w, none: w.n === 0 }))
    const noDesigns = products.filter((p) => !d.some((r) => (r.product || []).includes(p.id))).map((p) => ({ id: p.id, name: p.menuName || p.name }))
    return {
      works, noDesigns,
      garments, showGarments: garments.length > 1,
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
const toWebp = (html) =>
  html.replace(/\b(src|srcset|data-full)="([^"]+)"/g, (m, attr, val) =>
    /* รับ prefix ใดๆ ก่อน /img/ (ธีม WP ใส่ /wp-content/themes/teamdee/build นำหน้า) */
    `${attr}="${val.replace(/(^|[\s,])([^\s",?#]*?)(\/img\/[^\s",?#]+)\.jpg(?=[\s,?#]|$)/g, (p, pre, base, path) =>
      existsSync(resolve(root, 'public' + path + '.webp')) ? `${pre}${base}${path}.webp` : p)}"`)
/* รูปที่ประกาศ data-sizes="…" → เติม srcset จากไฟล์ย่อ -{w}.webp ที่มีจริง (ตรวจความเร็ว 30 ต.ค.)
   เช่น รูปผ้า 700px ที่แสดง 64px ได้ corn-160 / corn-320 · ปกบทความ · รูปจากข้อมูลที่ template สร้าง path ไฟล์ย่อเองไม่ได้ */
const VARIANT_W = [160, 320, 400, 440, 480, 540, 640, 760]
const webpWidth = (file) => {
  const b = Buffer.alloc(30); const fd = openSync(file, 'r'); readSync(fd, b, 0, 30, 0); closeSync(fd)
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return 0
  const t = b.toString('ascii', 12, 16)
  return t === 'VP8X' ? 1 + b.readUIntLE(24, 3) : t === 'VP8L' ? 1 + (b.readUInt16LE(21) & 0x3fff) : t === 'VP8 ' ? b.readUInt16LE(26) & 0x3fff : 0
}
const autoSrcset = (src) => {
  const m = src.match(/^(.*?)(\/img\/[^\s"?#]+?)\.(webp|jpe?g|png)$/)
  if (!m) return ''
  const [, pre, base] = m
  const big = resolve(root, `public${base}.webp`)
  const bigW = existsSync(big) ? webpWidth(big) : 0
  if (!bigW) return ''
  const parts = VARIANT_W.filter((w) => w < bigW && existsSync(resolve(root, `public${base}-${w}.webp`))).map((w) => `${pre}${base}-${w}.webp ${w}w`)
  return parts.length ? [...parts, `${pre}${base}.webp ${bigW}w`].join(', ') : ''
}
const addSrcset = (html) => html.replace(/<img\b[^>]*\sdata-sizes="[^"]*"[^>]*>/g, (tag) => {
  const sizes = tag.match(/\sdata-sizes="([^"]*)"/)[1]
  const src = tag.match(/\ssrc="([^"]+)"/)?.[1]
  const set = !/\ssrcset=/.test(tag) && src && autoSrcset(src)
  return tag.replace(/\sdata-sizes="[^"]*"/, set ? ` srcset="${set}" sizes="${sizes}"` : '')
})
const webpImages = () => ({
  name: 'teamdee-webp',
  enforce: 'post',
  transformIndexHtml: { order: 'post', handler: (html) => addSrcset(toWebp(html)) },
  /* แก้ไฟล์ HTML ที่ออกจริงอีกชั้น: transformIndexHtml อย่างเดียวไม่ติด srcset บางจุด (audit 26 ต.ค. M29: ยังเหลือ JPG 59 จุด) */
  generateBundle(_, bundle) {
    for (const f of Object.values(bundle)) if (f.type === 'asset' && f.fileName.endsWith('.html') && typeof f.source === 'string') f.source = addSrcset(toWebp(f.source))
  },
})

/* ตัดบรรทัดภาษาไทย: ห่อคำที่เบราว์เซอร์หักผิด + วลีในหัวข้อ/คำถาม/ลิงก์สั้น (src/js/thai-break.js · มือถือ 30 ต.ค.) */
const thaiLines = () => ({
  name: 'teamdee-thai-lines',
  enforce: 'post',
  transformIndexHtml: { order: 'post', handler: (html) => thaiBreaks(html) },
})

/* ความเร็วมือถือ 30 ต.ค.: preload ฟอนต์ไทยด้วยชื่อไฟล์ที่ hash แล้ว (scripts/lib/font-preload.mjs) · ทุกหน้า · export WP แปลง /assets/ เข้าธีมเอง */
const fontPreload = () => ({
  name: 'teamdee-font-preload',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const tag = fontPreloadTag(Object.keys(bundle))
    for (const f of Object.values(bundle)) if (f.type === 'asset' && f.fileName.endsWith('.html') && typeof f.source === 'string') f.source = injectFontPreload(f.source, tag)
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
for (const p of walk('.').filter(p => !forWp || (!p.startsWith('design-preview/') && !p.startsWith('ui/')))) input[p === 'index.html' ? 'main' : p.replace(/\/?index\.html$|\.html$/, '').replace(/\//g, '-')] = resolve(siteDir, p)

const routes = json('routes.json')
const url = makeUrl(routes)

/* แบบเสื้อของแต่ละกลุ่มลูกค้า (v22) · ใช้ทั้งหน้ากลุ่มลูกค้าและแกลเลอรีรายกลุ่ม
   ตรงตามแท็กการใช้งาน (use) หรือทรง (garment) เท่านั้น · ร้านค้า รุ่น/ชมรม คณะ ยังไม่มีแบบติดแท็ก = ว่าง ไม่ยืมกลุ่มอื่น */
const DESIGN_TAG = { shop: { use: 'shop' }, class: { use: 'class' }, faculty: { use: 'faculty' }, corp: { use: 'corp' }, gov: { use: 'gov' }, edu: { use: 'edu' }, sport: { use: 'sport' }, event: { use: 'event' }, badminton: { garment: 'badminton' }, running: { garment: 'running' } }
const designsFor = (designs, id) => {
  const q = DESIGN_TAG[id]
  return !q ? [] : designs.filter((r) => (q.use ? (r.use || []).includes(q.use) : r.garment === q.garment))
}

/* คลังรูปกลาง (30 ต.ค.) · src/data/media-library.json สร้างด้วย node scripts/media-library.mjs · ดู/ค้นที่ /ui/media/
   หน้าใหม่ดึงรูปจากที่เดียว: mediaFor({ group: 'running', kind: ['customer', 'work'], limit: 6 })
   แม่แบบ: {{#each (media group="badminton" kind="customer,mockup3d" limit=6)}} · ได้ path / w / h / alt / occ / groups / product */
const mediaLib = () => json('media-library.json')
export const mediaFor = (opts = {}) => pickFrom(mediaLib(), opts)


const downloadAssetsFor = (kind, id, designs) => {
  const d = json('download-designs.json')
  /* รูปที่ขึ้นการ์ดตัวเลือก/รายละเอียดแล้วไม่ซ้ำในกล่องนี้ (2 พ.ย.) */
  const pageCards = kind === 'product' ? json('product-pages.json')[id] : null
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
    webpImages(),
    thaiLines(),
    fontPreload(),
    ...(forWp ? [] : [seoFiles()]),
    handlebars({
      partialDirectory: resolve(root, 'src/partials'),
      context(pagePath) {
        const data = loadData()
        /* เว็บจริง: FAQ ทุกชุดและคู่มือ ตัดข้อที่ยังรอยืนยัน [วงเล็บ] (รอบ 5 · 22 ต.ค. 2026) · ต้นแบบเก็บไว้ให้เห็น */
        if (forWp) {
          data.faq = prunePending(data.faq)
          data.guides = prunePending(data.guides)
          data.allGuides = prunePending(data.allGuides)
        }
        /* หาว่าไฟล์นี้คือหน้าอะไรจาก URL ของมันเอง ตารางอยู่ที่ routes.json */
        const rel = pagePath.replace(/\\/g, '/').replace(siteDir.replace(/\\/g, '/'), '')
        const at = ('/' + rel.replace(/^\//, '')).replace(/index\.html$/, '')
        const page = pageFor(routes, data.articles.items.map((a) => a.id))[at] || { kind: null, id: null }
        const base = { ...data, page, wp: forWp, articleHref: at, articleDraft: true, sizeDraftHidden: forWp && data.sizing.status !== 'approved' }
        /* ปุ่ม LINE ส่วนกลาง (แถบล่าง · เมนู · hero · ปุ่มลอย · ท้ายเว็บ) ส่งข้อความตามหน้า + ทางเข้าลูกค้าเดิม (ตรวจมือถือ 30 ต.ค.) */
        {
          const named = (file) => { const j = json(file); return Object.fromEntries((Array.isArray(j) ? j : j.items || []).map((x) => [x.id, x.name])) }
          base.pageLine = lineMessageUrl(pageLineText(page, { products: named('products.json'), uses: named('uses.json') }, at))
          base.reorderLine = lineMessageUrl(REORDER_TEXT)
          base.trackLine = lineMessageUrl(TRACK_TEXT)
          /* ขอเอกสารบริษัท: หน้าแรก + หน้ากลุ่มโฉมใหม่ที่ใช้การ์ดบริษัทของหน้าแรก (up2Team.hbs) */
          base.homeDocsLine = lineMessageUrl('สวัสดี ทีมดี ขอเอกสารบริษัทสำหรับจัดซื้อ\nเอกสารที่ต้องการ (ภ.พ.20 / หนังสือรับรอง / อื่นๆ): \nชื่อหน่วยงาน: ')
          if (at === '/') {
            base.homePayLine = lineMessageUrl('สวัสดี ทีมดี สอบถามการชำระเงิน / วางบิล\nชื่อหน่วยงาน: \nวิธีที่สะดวก (โอน / PromptPay / บัตร / วางบิล): \nเอกสารที่ต้องใช้: ')
          }
          /* หน้าติดต่อรอบ 170b (ทาง ก. ตามบอร์ด): การ์ด LINE กระชับ · จอมือถือในการ์ด = บรรทัดที่ปุ่มพิมพ์รอไว้จริง (contactLineUrl)
             "ตอบภายใน 5 นาที" ผูกกับ LINE เท่านั้น (audit 2.4) */
          if (at === '/contact-us/') {
            const msg = [{ t: 'สวัสดี ทีมดี สนใจทำเสื้อทีม' }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }, { t: 'อยากได้รับวันที่', q: true }]
            base.contactLineUrl = lineMessageUrl(msg.map((m) => (m.q ? `${m.t}: ${m.unit ? ` ${m.unit}` : ''}` : m.t)).join('\n'))
            base.contactLineMsg = msg.slice(0, 3)
          }
        }
        /* ป๊อปอัปเข้าเว็บครั้งแรก (promo.json) · ลิงก์ปุ่มคิดตอน build · เลือกโปรตามวันที่ทำในเบราว์เซอร์ (promo-popup.js) */
        base.promos = json('promo.json').items.filter((p) => p.active !== false).map((p) => ({ ...p, ctaLine: p.cta.to === 'line', ctaHref: p.cta.to === 'line' ? (p.cta.message ? lineMessageUrl(p.cta.message) : data.site.lineUrl) : url(p.cta.to), cta2Href: p.cta2 && url(p.cta2.to) }))
        /* คลิปทีมดี (videos.json · PLAN.md "คลิปลูกค้าจาก IG") วางตามจุด = key ของ routes · เว็บจริงเอาเฉพาะคลิปที่พร้อม
           caseHref: หน้าเคสยังไม่ขึ้น WordPress (ต้องสร้างหน้าใน WP ก่อน) → เว็บจริงไม่ลิงก์ */
        {
          const place = page.kind && page.id ? `${page.kind}.${page.id}` : page.kind
          const caseOf = (v) => (v.places || []).find((x) => x.startsWith('cases.'))?.slice(6)
          base.vids = place ? videosFor(data.videos, place, { forWp }).map((v) => ({ ...videoView(v), caseHref: !forWp && caseOf(v) && place !== `cases.${caseOf(v)}` ? url('cases', caseOf(v)) : null })) : []
          base.videoLd = base.vids.filter((v) => v.ready).map((v) => ldJson(videoSchema(v, data.site.baseUrl)))
        }
        /* หน้าแรก: ข้อมูลธุรกิจ + FAQ ให้ Google อ่าน (SEO เสื้อโปโล / ยูนิฟอร์ม 21 ต.ค. 2026) */
        if (at === '/') base.homeLd = [businessSchema(data.site), faqSchema(json('home.json').faq.items)].filter(Boolean).map(ldJson)
        /* เครื่องคำนวณ: FAQ ราคาให้ Google อ่าน (audit calc-11) · เว็บจริงใช้ FAQ ที่ตัดข้อรอยืนยันแล้ว */
        /* /designs/ (ตรวจมือถือ 30 ต.ค.): หน้าแบบเสื้อไม่มีราคาเลย · แบบทั้งหมดเป็นเสื้อพิมพ์ลาย → ราคาเริ่ม ขั้นต่ำ วันผลิต ของพิมพ์ลาย */
        if (at === '/designs/') {
          const P = json('prices.json')
          base.dgFacts = { price: priceLine(P, 'print'), moq: `ขั้นต่ำ ${P.minQty} ตัว`, days: `ผลิต ${json('lead-times.json').print.days}` }
        }
        if (at === '/calculations/') base.calcLd = (() => { const s = faqSchema(data.faq.calc); return s && ldJson(s) })()
        /* /faq/: FAQPage จากคำถามทุกหมวด (ตัดข้อที่ซ้ำกับ "คำถามสำคัญ" ให้เหลือข้อเดียว) · audit 26 ต.ค. */
        if (at === '/faq/') base.faqLd = (() => {
          const seen = new Set()
          const items = [...(data.faq.home || []), ...(data.faq.full || []).flatMap((c) => c.items)].filter(([q]) => { const k = q.replace(/[?\s]/g, ''); if (seen.has(k)) return false; seen.add(k); return true })
          const s = faqSchema(items)
          return s && ldJson(s)
        })()
        /* /faq/ รื้อ 26 ต.ค.: หมวด + ไอคอน + ลิงก์ LINE รายข้อ (แนบคำถามข้อนั้น) · คำถามยอดฮิต = ชุดหน้าแรก ชี้ไปข้อเดียวกันในหมวด */
        if (at === '/faq/') {
          const ICO = { start: 'icoSpark', design: 'icoPen', spec: 'icoRuler', price: 'icoTag', produce: 'icoClock', after: 'icoTruck', company: 'icoShield' }
          const cats = (data.faq.full || []).map((c) => ({ ...c, ico: ICO[c.id] || 'icoChat', n: c.items.length, qs: c.items.map(([q, a], i) => ({ q, a, id: `${c.id}-${i}`, line: lineMessageUrl(faqAskText(q)) })) }))
          const all = cats.flatMap((c) => c.qs)
          base.fq = { cats, total: all.length, popular: (data.faq.home || []).map(([q]) => all.find((x) => x.q === q)).filter(Boolean) }
        }
        /* /search/: ค้นคำถาม FAQ ได้ด้วย (ลองใช้จริง 30 ต.ค.: "ใบกำกับภาษี" เจอแค่บทความเก่า ไม่เจอข้อ FAQ) · id เดียวกับหน้า /faq/ */
        if (at === '/search/') base.faqSearch = (data.faq.full || []).flatMap((c) => c.items.map(([q, a], i) => ({ q, a, id: `${c.id}-${i}` })))
        const { kind, id } = page
        /* แม่แบบหน้าแบบเสื้อ (v22 /design-[รหัส]/) · ต้นแบบเท่านั้น ตัวอย่างใช้แบบแรกในคลัง */
        if (at.startsWith('/design-preview/')) {
          const code = at.split('/')[2]?.toUpperCase()
          const d = data.designs.find(d => d.code === code)
          if (!d) throw new Error(`Unknown preview design: ${code}`)
          return { ...base, designItem: designDetail(d, { uses: data.uses, contactHref: url('contact') }) }
        }
        if (at === '/design-sample/') return { ...base, designItem: designDetail(data.designs[0], { uses: data.uses, contactHref: url('contact') }) }
        if (kind === 'products') {
          const item = data.allProducts.find((x) => x.id === id)
          const tech = data.techniques[item.technique]
          /* ผ้าตามเทคนิค ดึงจากรายการผ้ากลางก่อน แล้วต่อด้วยรายการที่ยังรอยืนยัน ไม่ใช้ผ้าชุดเดียวกันทุกเทคนิค */
          const fabrics = [
            ...tech.fabricNames.map((n) => data.sizing.fabrics.find((f) => f.name === n)).filter(Boolean),
            ...tech.fabrics,
          ]
          /* โปโลปัก: ผ้า 6 ชนิดตามตารางราคา (อาร์ต 2 พ.ย.) · ชื่อและช่วงราคาจาก prices.json · รูปผิวผ้ามีเฉพาะดรายเทค */
          const poloFabrics = () => { const P = json('prices.json'); const pic = { drytech: data.sizing.fabrics.find((f) => f.name === 'ผ้าดรายเทค')?.img }; return fabricRanges(P, 'polo').map((f) => ({ name: f.name, use: `${f.min}–${f.max} บาท/ตัว ตามจำนวน · ${P.products.polo.include.short}`, img: pic[f.id] })) }
          /* ข้อมูลสินค้าเองบอกว่าผ้ายังไม่ยืนยัน (วอร์ม "ผ้าและทรงยังรอยืนยัน" · เบสบอล "[ยืนยันผ้า…]") → product-view.js ซ่อนรายการบนเว็บจริง */
          const fabricsPending = /ผ้า[^·]*รอยืนยัน|\[ยืนยันผ้า/.test(item.spec?.fabricNote || '')
          /* v22: คลังแบบกราฟิกเป็นของงานพิมพ์ลายเท่านั้น · โปโลปักกับสกรีนไม่แสดงแกลเลอรีแบบ */
          /* รูปในการ์ดตัวเลือก/รายละเอียดไม่ซ้ำในกริดแบบ (2 พ.ย.) */
          const cardImgs = new Set([...json('product-pages.json')[id].options.cards, ...json('product-pages.json')[id].detail.cards].map((c) => c.img))
          const designsOf = (data.designs.filter((r) => (r.product || []).includes(id))).filter((d) => !cardImgs.has(d.img))
          const productTags = (item.tags || [])
            .map((t) => {
              const of = designsOf.filter((r) => r.garment === t.garment)
              return { ...t, n: of.length, sample: of[0] }
            })
            .filter((t) => t.n > 0)
          const productDesigns = item.tags ? designsOf : designsOf.slice(0, 6)
          const briefLine = (brief, page) => lineMessageUrl(`สวัสดี ทีมดี ${brief}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: \n(จากหน้า ${page})`)
          const productWorks = data.works.filter((w) => w.product === id).slice(0, 3).map((w) => ({ ...w, line: briefLine(`สนใจงานแนวนี้: ${w.alt}`, url('products', id)) }))
          /* หน้าสินค้าตาม Wireframe v22 (22 ต.ค. 2026) · ข้อความจาก product-pages.json + ข้อมูลจริงที่มีอยู่ */
          const has = (key) => { try { url(key); return true } catch { return false } }
          /* รูปลูกค้าองค์กรจริงที่ใส่โปโล (customers.json · ดูด้วยตา 27 ต.ค.) · คำบรรยาย = สิ่งที่เห็น ไม่ระบุชื่อองค์กร ไม่บอกว่าปักหรือพิมพ์ */
          const photos = id !== 'polo' ? [] : POLO_CORP_PHOTOS.map(([c, d], i) => ({ img: `/img/customer/${c}.webp`, d, line: lineMessageUrl(`สนใจทำเสื้อโปโลปัก แบบในรูปลูกค้าองค์กรบนหน้าโปโลปัก (รูปที่ ${i + 1}: ${d})\nจำนวนประมาณ:  ตัว\nใช้วันที่: `) }))
          /* งานปักจริงของลูกค้า (ไฟล์ _drive/td-embroidery · อาร์ตอนุญาต 2 พ.ย.) เป็นภาพ 3D ไม่ใช่รูปถ่าย → ติดป้ายตรงๆ · เลือกงานที่ชื่อระบุว่าปัก และไม่ซ้ำแบบในหน้า */
          const jobs = id !== 'polo' ? [] : ['TD-0133', 'TD-0132', 'TD-0127'].map((code) => ({ code, img: json('designs.json').find((d) => d.code === code).img }))
          const pp = productView(json('product-pages.json')[id], { works: productWorks, photos, jobs, designs: productDesigns, tags: productTags, fabrics: id === 'polo' ? poloFabrics() : fabrics, fabricsPending, spec: item.spec, sizes: data.sizing.sizes, price: productPrice(json('prices.json'), id, { calcUrl: url('calculations') }) }, { forWp, has })
          pp.options.cards = pp.options.cards.map((c) => ({ ...c, line: briefLine(c.brief, url('products', id)) }))
          return {
            ...base,
            item,
            promos: id === 'screen' ? [] : base.promos,
            screenColors: id === 'screen' ? [{name:'ขาว',hex:'#fafafa'},{name:'ดำ',hex:'#202020'},{name:'กรม',hex:'#242c40'},{name:'เบจ',hex:'#c5b598'},{name:'ครีม',hex:'#eee4cc'},{name:'เทา',hex:'#969892'},{name:'ช็อกโกแลต (น้ำตาล)',hex:'#4d3c30'}] : [],
            screenExtras: id === 'screen' ? [{size:'7 × 10',price:25},{size:'10 × 15',price:30},{size:'15 × 20',price:35},{size:'20 × 30',price:45},{size:'30 × 40',price:55}] : [],
            pp,
            /* หน้าสินค้าโฉมใหม่ (อาร์ต 5 พ.ย. · pp-v2.json) · ไม่มีคีย์ = hero เดิม */
            pp2: (() => {
              const v = json('pp-v2.json')[id]
              if (!v) return null
              /* ทำไมต้องสั่งกับทีมดี (5 พ.ย. ทาง ก): คลิปจริงจาก videos.json ตาม id · เว็บจริงไม่เอาคลิปที่ยังรอ (wait) */
              const vid = (vidId) => { const x = data.videos.find((y) => y.id === vidId); return x && (!forWp || videosFor([x], (x.places || [])[0], { forWp }).length) ? videoView(x) : null }
              const proof = v.proof ? { ...v.proof, clipsV: v.proof.clips.map(vid).filter(Boolean) } : null
    /* รีวิวโฉมใหม่ (5 พ.ย. ใช้ up2Reviews ของ /corporate/) · กำแพงรูปรีวิว img/review + การ์ดตามลำดับใน pp-v2.json */
    const rvAll = reviewItems()
    const reviews = v.reviews ? { ...v.reviews,
      wall: v.reviews.wall.map((w) => { const r = rvAll.find((x) => x.id === w.review); return { ...w, img: `/img/review/${w.img}.webp`, small: `/img/review/${w.img}-480.webp`, sw: 480, r: (w.w / w.h).toFixed(3), who: r.who || r.kind, alt: `งานจริงจากรีวิว ${r.who || r.kind}` } }),
      items: v.reviews.items.map((rid) => { const r = rvAll.find((x) => x.id === rid); if (!r) throw new Error(`pp-v2.json reviews: ไม่มีรีวิว ${rid}`); return { ...r, mono: [...(r.who || r.kind)].find((c) => !'เแโใไ'.includes(c)) } }) } : null
              /* เนื้อผ้า (6 พ.ย.): "เหมาะกับ" ดึงจาก sizing.json ที่เดียว (ข้อมูลเดียวกับส่วนผ้าเดิม) · ไม่มีชื่อผ้าในคลัง = build พัง */
              const fabric = v.fabric ? { ...v.fabric, sampleAsk: lineMessageUrl(`ขอตัวอย่างผ้า${sp(item.name)}\nผ้าที่สนใจ: \nจำนวนที่จะสั่งประมาณ:  ตัว`), guide: url('guides.fabric'), items: v.fabric.items.map((f) => { const s = f.use ? { use: f.use } : data.sizing.fabrics.find((x) => x.name === (f.sz || f.t)); if (!s) throw new Error(`pp-v2.json fabric: ไม่มี ${f.sz || f.t} ใน sizing.json`); const pf = json('prices.json').products.print.fabrics?.find((x) => x.id === f.k); if (!pf) throw new Error(`pp-v2.json fabric: ไม่มี ${f.k} ใน prices.json print.fabrics`); return { ...f, use: s.use, gsm: pf.gsm, tagsI: f.tags.map((t) => ({ t, icon: iconFor(t) })), ask: lineMessageUrl(`ขอตัวอย่าง${f.t}\nใช้ทำเสื้ออะไร: \nจำนวนที่จะสั่งประมาณ:  ตัว`) } }), icons: Object.entries(FABRIC_ICONS).map(([id, d]) => ({ id, d })) } : null
              /* รอบ 143: "เหมาะกับ" เป็นไอคอน 3D (use-*.webp · Magnific 6 พ.ย.) · คำจาก sizing.json ตัด "เสื้อ"/"ทั่วไป" ให้สั้น · คำที่ไม่มีไอคอน = build พัง */
              if (fabric) {
                const useIcon = { 'กิจกรรม': 'event', 'ทีม': 'team', 'องค์กร': 'corp', 'วิ่ง': 'run', 'แบดมินตัน': 'badminton', 'กีฬา': 'sport', 'ออกกำลังกาย': 'sport', 'ยูนิฟอร์ม': 'uniform', 'ทำงาน': 'work', 'ช่าง': 'craft', 'แฟชั่น': 'fashion', 'หน่วยงาน': 'corp' }
                fabric.items = fabric.items.map((f) => ({ ...f, uses: f.use.split(/\s+/).map((w) => { const t = w.replace(/^(เสื้อ|ชุด)/, '').replace(/ทั่วไป$/, ''); if (!useIcon[t]) throw new Error(`pp-v2.json fabric: ไม่มีไอคอนสำหรับ "${w}"`); return { t, icon: `/img/icons/use-${useIcon[t]}.webp`, line: USE_ICON[t] } }) }))
                /* รอบ 189 อาร์ต "แยกระหว่างใหม่กับเก่าเป็นสองแถว" · ช่วงแกรมคำนวณจากข้อมูล (prices.json) ไม่พิมพ์เอง */
                const gsmT = (xs) => { const g = xs.map((x) => x.gsm); const lo = Math.min(...g), hi = Math.max(...g); return lo === hi ? `${lo} แกรม` : `${lo}–${hi} แกรม` }
                const std = fabric.items.filter((f) => !f.new), fresh = fabric.items.filter((f) => f.new)
                fabric.groups = [{ id: 'std', h: `ผ้ามาตรฐาน ${std.length} ชนิด`, meta: `${gsmT(std)} · มีเสื้อจริงจากงานลูกค้า`, items: std }, { id: 'new', h: `ผ้าใหม่ ${fresh.length} ชนิด`, meta: gsmT(fresh), items: fresh }].filter((g) => g.items.length)
              }
              /* ตารางไซซ์ (6 พ.ย.): ทรงที่ยังไม่มีตาราง → ปุ่ม LINE ขอตารางของทรงนั้น (ข้อความตั้งต้นมีแค่ชื่อทรง) */
              const sizes = v.sizes ? { ...v.sizes, others: v.sizes.others.map((o) => ({ ...o, ask: lineMessageUrl(`ขอตารางไซซ์${o.name}\nจำนวนประมาณ:  ตัว`) })) } : null
              /* เสื้อจริงใส่หุ่น (6 พ.ย.): คำบรรยายจาก home-work-showcase · แบบ 3D ก่อนผลิตจาก download-designs proofs · รหัสจาก designs.json (ไม่มีในคลัง = ไม่ใส่รหัส) */
              const real = v.real ? (() => {
                const man = json('home-work-showcase.json').mannequin, proofs = json('download-designs.json').proofs
                const base = (s) => s.split('/').pop().replace(/(-540)?\.webp$/, '')
                const items = v.real.order.map((k) => {
                  const m = man.find((x) => base(x.img) === k) || (v.real.extra?.[k] && { img: `/img/real-even/${k}.webp`, ...v.real.extra[k] }); if (!m) throw new Error(`pp-v2.json real: ไม่มี ${k} ใน home-work-showcase / real.extra`)
                  const pr = proofs.find((x) => base(x.real.img) === k)
                  const d = pr && data.designs.find((x) => base(x.img) === base(pr.design.img))
                  /* 6 พ.ย.: ใช้ภาพครอปให้เสื้อเท่ากัน (public/img/real-even) · ไม่มีไฟล์ = build พัง · ไม่โชว์แบบ 3D แล้ว (รหัสยังส่งเข้า lightbox) */
                  const even = `/img/real-even/${k}`; if (!existsSync(resolve(root, `public${even}-540.webp`))) throw new Error(`pp-v2.json real: ไม่มีภาพครอป ${even}`)
                  return { img: `${even}.webp`, small: `${even}-540.webp`, caption: m.caption, alt: m.alt, code: d ? d.code : null }
                })
                /* 196f ปุ่มไปต่อ: รูปจริงวงกลม 3 วง · แบบเสื้อ = ภาพตัวหน้าแบบจริงของสินค้านี้ + จำนวนแบบ (นับแบบเดียวกับหน้า /designs/) · งานจริง = เสื้อจริงบนหุ่น 3 ตัวแรก */
                const mine = data.designs.filter((x) => (x.product || []).includes(id))
                const fronts = mine.map((x) => `/img/design-front/${x.img.split('/').pop().replace(/\.\w+$/, '')}-720.webp`).filter((f) => existsSync(resolve(root, 'public' + f))).slice(0, 3)
                const links = (v.real.links || []).map((l) => l.href.startsWith('/designs/') ? { ...l, faces: fronts, sub: `${mine.length} แบบ ปรับสี โลโก้ และชื่อทีมได้` } : l.href.startsWith('/project/') ? { ...l, faces: items.slice(0, 3).map((x) => x.small), sub: 'เสื้อที่ทีมดีผลิตให้ลูกค้า' } : l)
                for (const l of links) if (!l.faces || l.faces.length !== 3) throw new Error(`pp-v2.json real.links: ไม่มีรูป 3 วงสำหรับ ${l.href}`)
                return { ...v.real, items, links }
              })() : null
              /* ขั้นตอนแบบ B (ชั่วคราว): เส้นทางระหว่างขั้น 1→2 … 4→5 · ตั๋วชำระเงินตาม pay.at */
              const steps = v.steps ? { ...v.steps, links: v.steps.items.slice(0, -1).map((_, i) => { const at = `${i + 1}-${i + 2}`; return { at, flip: i % 2 === 1, pay: v.steps.items.map((s) => s.pay).find((p) => p && p.at === at) || null } }) } : null
              /* คอเสื้อ (รอบ 145): การ์ดถามทรงคอ → LINE ข้อความตั้งต้น */
              /* คอเสื้อ: การ์ดถามทรงคอ → LINE · 196e อาร์ต "ไม่ต้องแสดงราคา" → จัดตามตระกูลคอ (fams) ไม่มีกลุ่มตามราคา */
              const collars = v.collars ? { ...v.collars, total: v.collars.fams.reduce((n, f) => n + f.items.length, 0), ask: lineMessageUrl(`ขอปรึกษาทรงคอ${sp(item.name)}\nทรงที่สนใจ: \nจำนวนประมาณ:  ตัว`) } : null
              /* 196c ทรง → คอที่ทำได้ (cols: all · รายการคีย์ · null = ยังไม่ระบุ) · คีย์คอผิด = build พัง · 196e ไม่แสดงราคา */
              const types = v.types && v.collars ? (() => {
                const names = new Set(v.collars.fams.flatMap((f) => f.items).map((c) => c.k))
                return { ...v.types, types: v.types.types.map((t) => {
                  const list = Array.isArray(t.cols) ? t.cols : null
                  for (const k of list || []) if (!names.has(k)) throw new Error(`pp-v2.json types ${t.k}: ไม่มีคอ ${k}`)
                  return { ...t, cols: t.cols === 'all' ? 'all' : (list || []).join(' '), go: !t.href.startsWith('#') }
                }) }
              })() : v.types
              /* 11 พ.ย. คลังรีวิว (อาร์ต "เพิ่มคลังรีวิว"): รูปลูกค้าคละทุกกลุ่มจากคลังกลาง ไม่ซ้ำรูปที่ส่วนอื่นของหน้านี้ใช้ · น้อยกว่า 24 = build พัง */
              const reviewWall = v.reviewWall ? (() => {
                const usedHere = JSON.stringify({ v, proof, reviews, real, steps })
                const items = data.reviewWall.items.filter((x) => !usedHere.includes(x.img.replace(/\.webp$/, '')))
                if (items.length < 24) throw new Error(`pp-v2.json reviewWall: รูปไม่พอ (${items.length})`)
                return { ...v.reviewWall, items }
              })() : null
              if (!v.designs) return { ...v, proof, reviews, fabric, sizes, real, steps, collars, types, reviewWall }
              /* แบบเสื้อ 3D (5 พ.ย.): แถวตามทรงจาก productDesigns (มีรหัส + meta ให้ lightbox) · แถวละ ≤ 8 · ไม่ซ้ำ */
              const used = new Set()
              const rows = v.designs.rows.map((r) => ({ ...r, total: data.designs.filter((d) => (d.product || []).includes(id) && r.garments.includes(d.garment)).length, /* นับจากคลังเต็มแบบเดียวกับหน้า /designs/ (ตัวเลขต้องตรงกับที่หน้าแบบเสื้อแสดง) */ all: `${url('designs')}?product=${id}${r.garments.length === 1 ? `&garment=${r.garments[0]}` : ''}`, items: productDesigns.filter((d) => r.garments.includes(d.garment) && !used.has(d.code) && !(v.designs.skip || []).includes(d.code)).slice(0, 8).map((d) => { used.add(d.code); const f = `/img/design-front/${d.img.split('/').pop().replace(/\.\w+$/, '')}-720.webp`; return { ...d, front: existsSync(resolve(root, 'public' + f)) ? f : null } }) })).filter((r) => r.items.length >= 3) /* 6 พ.ย. "เอาแค่ด้านหน้าเสื้อ": ภาพคู่ใช้ไฟล์ตัดตัวหน้า (scripts/design-fronts.py) */
              return { ...v, proof, reviews, fabric, sizes, real, steps, collars, types, reviewWall, designs: { ...v.designs, rows } }
            })(),
            downloadAssets: downloadAssetsFor('product', id, data.designs),
            priceStrip: priceSummary(json('prices.json'), id),
            pageReviews: REVIEW_PRODUCT[id].map((rid) => reviewItems().find((r) => r.id === rid)),
            /* ภาพขั้นตอนผลิต: ยังไม่มี · รูปเครื่องพิมพ์ / เครื่องปัก / เครื่อง DFT เดิมพิสูจน์ที่มาไม่ได้ และทำให้ดูเหมือนทีมดีมีโรงงานเอง
               (อาร์ตเคาะ 24 ต.ค. ให้เอาออกทุกที่ · tests/clean-rules.test.js) · ได้ภาพในโรงงานพาร์ตเนอร์ที่ได้รับอนุญาตแล้วค่อยใส่ พร้อมคำบรรยายว่าเป็นพาร์ตเนอร์ */
            productionPhoto: null,
            /* ปุ่ม LINE ใน hero / กล่องราคา / ส่วนปิด พร้อมชื่อสินค้า (audit P5) */
            priceAsk: lineMessageUrl(`สวัสดี ทีมดี ขอราคา${sp(item.name)}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: `),
            /* กล่องชวนขอราคา: LINE พิมพ์แม่แบบ 3 ข้อที่ต้องส่งไว้ให้กรอก (audit P5) · ไม่มีชื่อหรือเบอร์ลูกค้าใน URL */
            quoteLine: lineMessageUrl([`ขอราคา${sp(item.name)}`, ...(pp.quote.send || []).map((x) => `- ${x}: `)].join('\n')),
            /* สารบัญเรียงตามส่วนในหน้า = hero.toc ของ v22 (อาร์ตเคาะ 2 พ.ย.) · หน้าสกรีนใช้ส่วนของตัวเอง (screenShowcase) จึงไม่กรองตาม productView
               กล่องกลางหน้า + ส่วนปิด = แชท (ctaBox) · ขั้นต่อไปท้ายส่วน = LINE พิมพ์ข้อความตามเรื่องนั้น */
            ppToc: id === 'screen' ? json('product-pages.json').screen.toc : pp.toc,
            ppQuoteCta: {
              title: pp.quote.h,
              lead: pp.quote.p,
              send: { label: 'ส่ง 3 อย่างนี้ ทีมดีแจ้งราคาได้', items: pp.quote.send || [] },
              msg: [{ t: `ขอราคา${sp(item.name)}` }, ...(pp.quote.send || []).map((x) => ({ t: x, q: true }))],
              attach: [{ file: 'logo-team.ai', kind: 'ไฟล์โลโก้' }, ...(item.img && item.imgKind === 'real' ? [{ img: item.img }] : [])],
              note: 'ข้อความนี้พิมพ์รอไว้ในแชท · แนบโลโก้เป็นไฟล์หรือรูปถ่ายก็ได้',
            },
            ppEndCta: {
              title: pp.contact.h,
              lead: pp.contact.p,
              send: { label: 'บอกทีมดี 3 อย่าง', items: ['ใช้เสื้อกับงานอะไร', 'จำนวนประมาณกี่ตัว', 'อยากได้รับเสื้อวันไหน'] },
              msg: [{ t: `สวัสดี ทีมดี สนใจ${sp(item.name)}` }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }, { t: 'อยากได้รับวันที่', q: true }],
              attach: [{ file: 'logo-team.ai', kind: 'ไฟล์โลโก้' }],
              note: 'ข้อความนี้พิมพ์รอไว้ในแชท · ยังไม่มีแบบก็เริ่มคุยได้',
            },
            ppEndLine: lineMessageUrl(`สวัสดี ทีมดี สนใจ${sp(item.name)}\nใช้กับงาน: \nจำนวนประมาณ:  ตัว\nอยากได้รับวันที่: `),
            /* โปโลปัก: ยังไม่มีรูปงานจริงที่ยืนยันว่าปัก → รูปหลักใช้รูปลูกค้าองค์กรจริงแทนภาพจำลอง · บรรยายแค่สิ่งที่เห็น */
            heroPhoto: { polo: { img: '/img/customer/co13.webp', alt: 'ทีมลูกค้าองค์กรใส่เสื้อโปโลสีน้ำเงิน ถ่ายรวมกลุ่มในอาคาร', tag: 'ภาพลูกค้าองค์กรจริงของทีมดี' }, ...HERO_PHOTO }[id] || null,
            ppNextLine: {
              fabric: lineMessageUrl(`ขอตัวอย่างผ้า${sp(item.name)}\nผ้าที่สนใจ: \nจำนวนที่จะสั่งประมาณ:  ตัว`),
              logo: lineMessageUrl(`ส่งโลโก้ให้ทีมดีช่วยดู (${item.name})\nจุดที่อยากวางโลโก้: \nขนาดโดยประมาณ: `),
              ask: lineMessageUrl(`สอบถามเรื่อง${sp(item.name)}: `),
              queue: lineMessageUrl(`สวัสดี ทีมดี ขอเช็กคิวตามวันใช้เสื้อ\nประเภทเสื้อ: ${sp(item.name)}\nจำนวน:  ตัว\nต้องใช้วันที่: \nแบบที่มี: `),
            },
            /* จอแรกมือถือ (audit P2): ราคาแถวเดียวพร้อมจำนวน · วอร์มยังไม่มีราคา (ปุ่ม LINE ขอราคาอยู่ข้างล่างแล้ว) ไม่โชว์แถวนี้ */
            heroPrice: (() => { const P = json('prices.json'); const h = heroPrice(P, id); return h && (h.sub || P.products[id]?.byDesign) ? h : null })(),
            heroSrcset: srcsetOf(item.img, 540, 540, 1080),
            tech: { ...tech, fabrics },
            parentItem: item.parent ? data.allProducts.find((x) => x.id === item.parent) : null,
            childProducts: data.products.filter((x) => x.parent === id),
            /* แท็กในหน้า (เสื้อวิ่ง / ฟุตบอล) ต้องมีแบบให้กรองได้จริง ไม่งั้นไม่โชว์ */
            productTags,
            productLd: (() => { const s = faqSchema(pp.faq.items); return s && ldJson(s) })(),
            productDesigns,
            relatedProducts: data.products.filter((x) => x.id !== id && x.id !== item.parent && x.parent !== id),
            relatedUses: data.uses.filter((u) => (u.recommend || []).some((r) => r.id === id)),
            productWorks,
            /* คู่มือตามเทคนิค (v4: เสื้อวอร์มใช้คู่มือพิมพ์ลายร่วม) */
            guideId: data.allGuides.some((g) => g.id === id) ? id : ({ sublimation: 'print', embroidery: 'polo', screen: 'screen' })[item.technique] || 'print',
          }
        }
        if (kind === 'uses') {
          const item = data.uses.find((x) => x.id === id)
          /* หน้ากลุ่มลูกค้าตาม Wireframe v22 (22 ต.ค. 2026) · ของจริงเลือกให้ตรงกลุ่มเท่านั้น ไม่ยืมรูปกลุ่มอื่นมาแทน
             แบบเสื้อ: แท็กการใช้งาน (use) หรือทรง (garment) · ผลงาน: works.use เติมด้วยภาพกลุ่มนี้ · ภาพลูกค้า: customers.photoGroup */
          /* บริษัท หน่วยงาน ร้านค้า: แบบโปโลขึ้นก่อน (agent ลูกค้า 22 ต.ค.: หน้าบริษัทเปิดมาเจอเสื้อฟุตบอล) */
          const POLO_FIRST = new Set(['corp', 'gov', 'shop'])
          const coded = designsFor(data.designs, id)
          const useDesigns = POLO_FIRST.has(id) ? [...coded.filter((d) => d.garment === 'polo'), ...coded.filter((d) => d.garment !== 'polo')] : coded
          /* แบบจากแกลเลอรีเดิมบนเว็บจริง (live-gallery.json) เติมให้ครบ 6 · ลิงก์ดูทั้งหมดไปหน้าแกลเลอรีของกลุ่ม */
          const live = (json('live-gallery.json').groups[id]?.items || []).map((x, i) => ({ img: x.img, imgSmall: srcsetOf(x.img, 540, 540, 1080), square: true, alt: `แบบ${item.name}ที่ทีมดีออกแบบ ${i + 1} ด้านหน้าและด้านหลัง` }))
          /* งานที่ตรงหน้าย่อยกว่า (alsoUse เช่น แบดมินตัน วิ่ง คณะ) ขึ้นก่อนงานของกลุ่มหลัก */
          const useWorks = [...data.works.filter((w) => (w.alsoUse || []).includes(id)), ...data.works.filter((w) => w.use === id)].slice(0, 3)
          const cs = json('customers.json')
          const has = (key) => { try { url(key); return true } catch { return false } }
          /* ภาพจริงของการ์ดบริบทงาน (ตามลำดับการ์ดใน use-pages.json · null = ยังไม่มีภาพ) · เลือกจากภาพลูกค้าบนเว็บจริงทีละรูป */
          const CTX = {
            corp: [['/img/customer/co03.webp', 'ทีมโรงพยาบาลใส่เสื้อโปโลที่ทีมดีทำ'], ['/img/review/rv384-480.webp', 'พนักงานรีสอร์ทริมน้ำใส่เสื้อโปโลที่ทีมดีทำ'], ['/img/customer/lc265.webp', 'ทีมธุรกิจเกษตรโชว์ลายหลังเสื้อที่ทีมดีทำ']],
            gov: [['/img/customer/co16.webp', 'เจ้าหน้าที่หน่วยงานรัฐใส่เสื้อที่ทีมดีทำ'], ['/img/customer/co17.webp', 'ทีมหน่วยทหารใส่เสื้อทีมกิจกรรมที่ทีมดีทำ'], ['/img/customer/ev13.webp', 'ทีมงานโครงการใส่เสื้อที่ทีมดีทำในวันงาน']],
          }
          const contextPhotos = (CTX[id] || []).map((x) => (x ? { img: x[0], alt: x[1] } : null))
          /* /corporate/ ใช้รูปบริษัทจริงตาม photoGroup เหมือนทุกกลุ่ม (อาร์ตเคาะ 2 พ.ย. · เดิมรูปโปโลจาก /embroidery/ ปนภาพ รพ.สต. กับทหาร) */
          /* ภาพจริงตามกลุ่ม (อาร์ตเคาะ 2 พ.ย.): photoGroup ของหน้านี้เท่านั้น ไม่ยืมกลุ่มอื่น · q สูงก่อน · ไม่เอา q ต่ำกว่า 2 · occ ซ้ำเอาภาพแรก · ไม่ซ้ำภาพ hero และการ์ดบริบท
             ส่วนเสื้อจริงเติมให้ครบ 3 ใบ (คำบรรยาย = occ ไม่แต่งโจทย์/สเปก) · ส่วนภาพลูกค้าใช้ภาพที่เหลือ ไม่ซ้ำกัน */
          /* โฉมใหม่ทีละส่วน (อาร์ต 3 พ.ย. "ทำแบบหน้าแรก" · src/data/use-v2.json · เริ่มที่ /corporate/) · แท็บบริบทใช้รูปลูกค้าจริง คำบรรยาย = occ */
          const v2 = json('use-v2.json')[id] || null
          const v2Photo = (k) => {
            const c = cs.find((x) => x.img === `/img/customer/${k}.webp`)
            if (c) return { img: c.img, small: c.imgSmall || c.img, alt: c.occ, cap: c.occ }
            const ctx = contextPhotos.find((x) => x?.img.includes(`/${k}`))
            if (ctx) return { img: `/img/review/${k}.webp`, small: ctx.img, alt: ctx.alt, cap: ctx.alt }
            throw new Error(`use-v2.json: ไม่มีรูป ${k}`)
          }
          if (v2?.pain?.photo) v2.pain.photo = v2Photo(v2.pain.photo)
          /* กำแพงรูปรีวิว: รูปหลักรีวิว (img/review) หรือรูปลูกค้าจริง (customers.json · alt = occ) · สัดส่วนจริงจาก use-v2.json */
          if (v2?.reviews) v2.reviews.wall = v2.reviews.wall.map((w) => {
            const k = w.img
            const base = k.startsWith('rv') ? { img: `/img/review/${k}.webp`, small: `/img/review/${k}-480.webp`, alt: '' } : (({ img, small, alt }) => ({ img, small, alt }))(v2Photo(k))
            /* ความกว้างไฟล์ย่อจากชื่อไฟล์ (-320 / -480) · ใช้ใน srcset ทุกช่อง (4 พ.ย. ช่องรูปลูกค้าเดิมโหลดไฟล์เต็มจนช่องว่าง) */
            return { ...w, ...base, sw: Number(/-(\d+)\.webp$/.exec(base.small)?.[1] || 480), r: (w.w / w.h).toFixed(3) }
          })
          /* 4 พ.ย. แท็บบริบทงานไม่มีรูปลูกค้าแล้ว (อาร์ต "ไม่เอารูปลูกค้าจริง") · มี photos เมื่อไหร่ค่อยแปลง */
          if (v2?.contexts) v2.contexts.tabs = v2.contexts.tabs.map((t) => (t.photos ? { ...t, photos: t.photos.map((k, i) => ({ ...v2Photo(k), ...(t.captions ? { cap: t.captions[i] } : {}) })) } : t))
          /* 11 พ.ย. ปุ่มดูรีวิวท้ายส่วน: รูปวงกลม = รูปจริงรูปแรกของ 3 แท็บแรก (ไม่ซ้ำคลังรีวิวในหน้า) */
          if (v2?.contexts) v2.contexts.faces = v2.contexts.tabs.slice(0, 3).map((t) => t.photos?.[0]?.small).filter(Boolean)
          /* 11 พ.ย. แท็บบริบทงาน: รีวิวที่ตรงงาน (reviews.json · คำจริง ตัด "… " หน้าคำ) · รหัสผิด = build พัง */
          if (v2?.contexts) v2.contexts.tabs = v2.contexts.tabs.map((t) => { if (!t.review) return t; const r = reviewItems().find((x) => x.id === t.review); if (!r) throw new Error(`use-v2.json contexts ${t.id}: ไม่มีรีวิว ${t.review}`); return { ...t, review: { quote: r.quote.replace(/^…\s*/, ''), who: r.who || r.kind } } })
          /* 4 พ.ย. "ทำให้ดีกว่าเดิม uiux": ปุ่ม LINE ต่อสถานการณ์ (ข้อความบอกทีมขายว่าสนใจงานไหน) + ชื่อสถานการณ์ถัดไป */
          if (v2?.contexts) v2.contexts.tabs = v2.contexts.tabs.map((t, i, all) => ({ ...t, line: lineMessageUrl(`สวัสดี ทีมดี เสื้อบริษัท — สนใจเสื้อสำหรับ${t.name}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: \n(จากหน้า ${url('uses', id)})`), next: all[i + 1]?.name || '', nextScene: all[i + 1]?.scene || '' }))
          const onPage = new Set([item.img, ...contextPhotos.map((x) => x?.img), ...(v2?.contexts?.tabs || []).flatMap((t) => (t.photos || []).map((x) => x.img)), v2?.pain?.photo?.img, ...(v2?.reviews?.wall || []).map((w) => w.img)])
          const occSeen = new Set()
          const groupPhotos = cs.filter((c) => c.photoGroup === id && c.q >= 2 && c.occ && !onPage.has(c.img)).sort((a, b) => b.q - a.q).filter((c) => !occSeen.has(c.occ) && occSeen.add(c.occ))
          /* ปุ่ม "สนใจงานแนวนี้" บอกทีมขายว่างานใบไหน (2 พ.ย.) */
          const workLine = (alt) => lineMessageUrl(`สวัสดี ทีมดี สนใจงานแนวนี้: ${alt}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: \n(จากหน้า ${url('uses', id)})`)
          const workCards = [...useWorks, ...groupPhotos.slice(0, Math.max(0, 3 - useWorks.length)).map((c) => ({ img: c.img, alt: c.occ }))].map((w) => ({ ...w, line: workLine(w.alt) }))
          const usePhotos = groupPhotos.filter((c) => !workCards.some((w) => w.img === c.img)).slice(0, 24)
          /* ภาพประกอบส่วน "ทำไมทีมดี" (2 พ.ย. รอบ 64): รูปถัดจาก 24 รูปที่แสดง ไม่ซ้ำกับรูปอื่นบนหน้า · กลุ่มที่รูปไม่ถึงไม่มีภาพ */
          const benefitPhoto = groupPhotos.filter((c) => !workCards.some((w) => w.img === c.img))[24] || null
          /* รีวิวตรงกลุ่ม (อาร์ตเคาะ 2 พ.ย.): ร้านค้า รีสอร์ท · หน่วยงาน โรงพยาบาลกับ NT · รุ่นและคณะยังไม่มีรีวิวตรงกลุ่ม = ซ่อน · วิ่ง กลุ่มนักวิ่งขึ้นก่อน · ที่เหลือตาม REVIEW_USE */
          const REVIEW_PICK = { shop: ['resort'], gov: ['hospital', 'nt-snooker'], class: [], faculty: [], running: ['runners'], badminton: ['krungthai-badminton'] }
          const useReviews = REVIEW_PICK[id] ? REVIEW_PICK[id].map((rid) => reviewItems().find((r) => r.id === rid)) : pickReviews(REVIEW_USE[id], 3, true)
          /* ภาพที่ขึ้นในกล่อง "จากภาพแบบ สู่เสื้อจริง" แล้วไม่ซ้ำในแบบเสื้อ (2 พ.ย.: 3d-082 brand-064) */
          const inProof = new Set(downloadAssetsFor('use', id, data.designs)?.proofs.flatMap((p) => [p.design?.img, p.real?.img]))
          /* แบบไม่ถึง 6 ใบ เติมภาพแบบจากคลังของกลุ่ม (2 พ.ย.: หน้าเสื้อรุ่นเดิมขึ้นใบเดียวทั้งที่มี 13 รายการ) */
          const galleryRefs = galleryFor(mediaLib(), { group: id, shortName: item.shortName, coded: gallerySelection(data.designs, id, designsFor(data.designs, id)).items }).items.filter((g) => g.square)
          /* กลุ่มที่แบบของตัวเองไม่ถึง 3 ใบ เติมแบบมีรหัสทรงเบสบอลและเจอร์ซีย์ (ทุกแบบปรับสีและลายให้กลุ่มนี้ได้) */
          const extraCoded = data.designs.filter((d) => ['baseball', 'football'].includes(d.garment))
          const firstShown = [...useDesigns, ...live, ...galleryRefs].filter((d, i, all) => !inProof.has(d.img) && all.findIndex((x) => x.img === d.img) === i)
          const filled = firstShown.length < 3 ? [...firstShown, ...extraCoded.filter((d) => !firstShown.some((x) => x.img === d.img))] : firstShown
          /* กริดแบบ 3 คอลัมน์บนจอคอม: 4–5 ใบเหลือแถวขาด ตัดเหลือเต็มแถว (แบบทั้งหมดอยู่หน้า /designs/) */
          const useShown = filled.slice(0, fullRows(filled.length, 3, 6))
          const up = useView(json('use-pages.json')[id], { designs: useShown, works: workCards, photos: usePhotos, contextPhotos, reviews: useReviews, benefitPhoto }, { forWp, has, drop: v2?.drop })
          up.v2 = v2
          /* รีวิวโฉมใหม่: การ์ดรีวิวเฉพาะกลุ่มองค์กร (แบบกระดานหน้าแรก) + กำแพงรูปจากแกลเลอรีรีวิว */
          if (v2?.reviews) {
            const corpRv = reviewItems().filter((r) => r.use === REVIEW_USE[id] && r.img)
            v2.reviews.items = corpRv.map((r) => { const g = r.gallery?.length ? r.gallery : [{ img: r.img, imgSmall: r.imgSmall }]; return { ...r, total: g.length, mono: [...(r.who || r.kind)].find((c) => !'เแโใไ'.includes(c)) } })
            for (const w of v2.reviews.wall) if (w.review) { const r = corpRv.find((x) => x.id === w.review); w.who = r.who || r.kind; w.alt = `งานจริงจากรีวิว ${w.who}` }
          }
          /* ผลงานโฉมใหม่: โชว์รูมหน้าแรก · แถวที่มี from = รูปบนหุ่นชุดหน้าแรก (home-work-showcase.json byType) */
          /* 11 พ.ย. คลังรีวิว (อาร์ต "เพิ่มคลังรีวิวตรงนี้"): use-v2.json reviewWall · รูปลูกค้ากลุ่มนี้จากคลังกลาง ไม่ซ้ำรูปที่หน้านี้ใช้แล้ว · น้อยกว่า 12 รูป = build พัง */
          if (v2?.reviewWall) {
            const inReviews = JSON.stringify(v2.reviews || {}) /* รูปในการ์ด/แกลเลอรีรีวิว */
            const items = (data.reviewWall.groups[id] || []).filter((x) => !onPage.has(x.img) && !inReviews.includes(x.img.replace(/\.webp$/, '')))
            if (items.length < 12) throw new Error(`use-v2.json ${id}.reviewWall: รูปไม่พอ (${items.length})`)
            v2.reviewWall = { ...v2.reviewWall, items }
          }
          if (v2?.showroom) v2.showroom = v2.showroom.rows.map((r) => ({ ...r, items: r.items || json('home-work-showcase.json').byType[r.from] }))
          /* บริการของเรา (โฉมใหม่): การ์ดสินค้าเดิม + รูปบริการตามสินค้า */
          if (v2?.products) v2.products.cards = up.products.cards.map((c) => ({ ...c, photo: v2.products.photos[c.to.split('.')[1]] }))
          /* ปุ่ม v22 เปิด LINE พร้อมเรื่องที่ v22 ส่งให้ทีมขาย */
          const withLine = (a) => a && { ...a, line: lineMessageUrl(`สวัสดี ทีมดี ${a.brief}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: \n(จากหน้า ${url('uses', id)})`) }
          up.plan.asks = (up.plan.asks || []).map(withLine)
          /* ภาพลูกค้า 6 คอลัมน์: เริ่มแสดงเต็มแถว ที่เหลืออยู่หลังปุ่มดูเพิ่ม */
          if (up.photos) up.photos.shown = fullRows(up.photos.items.length, 6, 12)
          up.team.ask = withLine(up.team.ask)
          up.photos.ask = withLine(up.photos.ask)
          if (up.contexts?.ask) up.contexts.ask = withLine(up.contexts.ask)
          /* ส่วน 06 เป็นใบราคาย่อ (audit use-02) · แถวตามการ์ดสินค้าของกลุ่ม ราคาจาก prices.json · สินค้าที่ยังไม่มีราคาเปิด LINE พร้อมข้อความตั้งต้น */
          const productName = (pid) => data.allProducts.find((x) => x.id === pid)?.name || ''
          /* hero (audit use-03): ราคาบรรทัดเดียวของสินค้าตัวแรกในใบราคาย่อที่มีตารางราคา · รูปจริงมีไฟล์ -320 คู่กัน */
          const P = json('prices.json')
          const firstPriced = up.products.cards.map((c) => c.to.split('.')[1]).find((pid) => priceLine(P, pid))
          /* + วันผลิตของสินค้าเดียวกัน (ตรวจมือถือ 30 ต.ค.: hero หน้ากลุ่มบอกแค่ขั้นต่ำ วันผลิตไปอยู่จอที่ 12) */
          up.hero.price = firstPriced ? { pid: firstPriced, name: productName(firstPriced), line: priceLine(P, firstPriced), moq: `ขั้นต่ำ ${P.minQty} ตัว · ผลิต ${json('lead-times.json')[firstPriced]?.days || ''}`.replace(/ · ผลิต $/, '') } : null
          /* แถบสรุปใต้ hero (2 พ.ย. รอบ 64): แยกตัวเลขราคาให้เด่น "220 บาท/ตัว (ผ้าจูติ 10–50 ตัว)" → 220 · บาท/ตัว · ผ้าจูติ 10–50 ตัว */
          if (up.hero.price) { const pm = /^([\d,]+) (\S+)(?: \((.*)\))?$/.exec(up.hero.price.line); if (pm) Object.assign(up.hero.price, { num: pm[1], unit: pm[2], cond: pm[3] || '' }) }
          /* ข้อเท็จจริงบรรทัดเล็กใต้ปุ่ม hero 3 ข้อ · "ขั้นต่ำ" ซ้ำกับบรรทัดราคาจึงตัด */
          up.hero.factLine = up.hero.facts.filter((f) => !(up.hero.price && f.startsWith('ขั้นต่ำ'))).slice(0, 3)
          /* การ์ดเสื้อจริง: ลิงก์สินค้าของงานนั้น · ไม่มีข้อมูลสินค้า (ภาพลูกค้า) ใช้สินค้าตัวแรกของกลุ่มในใบราคาย่อ */
          up.work.real = up.work.real.map((w) => { const pid = (has(`products.${w.product}`) && w.product) || firstPriced; return { ...w, productHref: pid && url('products', pid), productName: pid && productName(pid) } })
          up.hero.srcset = srcsetOf(item.img, 320, 320, item.img?.startsWith('/img/real/') ? 760 : 640)
          up.products.quote = useQuote(json('prices.json'), up.products.cards, json('lead-times.json'), { askHref: (pid) => lineMessageUrl(`ขอราคา${productName(pid)} สำหรับ${item.shortName} จำนวนประมาณ ... ตัว`) })
          return {
            ...base,
            item,
            up,
            downloadAssets: downloadAssetsFor('use', id, data.designs),
            /* เลขเดียวกับหน้าแกลเลอรี (2 พ.ย.: เดิมนับคนละชุด 109 กับ 125) */
            useDesignsAll: galleryFor(mediaLib(), { group: id, shortName: item.shortName, coded: gallerySelection(data.designs, id, designsFor(data.designs, id)).items }).items.length,
            /* กลุ่มที่ยังไม่มีแบบ (เสื้อรุ่น คณะ ร้านค้า) ไม่พาไปแกลเลอรีว่าง ไปหน้าแบบเสื้อรวมแทน (audit 26 ต.ค.) */
            designsHref: useDesigns.length + live.length ? url('galleries', id) : url('designs'),
            cta: useCta(item, data.site, url('contact')),
            priceAsk: useCta(item, data.site, url('contact')).primary.href,
            useLd: (() => { const s = faqSchema(up.faq.items); return s && ldJson(s) })(),
          }
        }
        if (kind === 'cases') {
          /* หน้าเคสลูกค้าจากคลิป (แนวทาง ก · 26 ต.ค.) · คลิปคือเนื้อหาหลัก · ข้อมูลจาก videos.json อย่างเดียว ไม่แต่งเพิ่ม
             ยังไม่พร้อม = noindex + ไม่ export (seo-check isExported) */
          const v = data.videos.find((x) => x.id === id)
          const cs = videoView(v)
          const use = data.uses.find((u) => u.id === v.use)
          const product = data.allProducts.find((p) => p.id === v.product)
          const qtyPending = /\[[^\]]*\]/.test(v.qty || '')
          return {
            ...base,
            cs: { ...cs, qtyPending, useName: use?.name, useHref: use && url('uses', use.id), productName: product?.menuName || product?.name, productHref: product && url('products', product.id) },
          }
        }
        if (kind === 'projects') {
          const wk = json('works-page.json')
          const has = (key) => { try { url(key); return true } catch { return false } }
          /* ภาพลูกค้าสลับหมวด ไม่ให้หมวดเดียวกองติดกัน */
          const byCat = {}
          for (const c of json('customers.json')) (byCat[c.cat] ||= []).push(c)
          const mixed = []
          for (let i = 0; mixed.length < 24 && Object.values(byCat).some((l) => l[i]); i++) for (const l of Object.values(byCat)) if (l[i] && mixed.length < 24) mixed.push(l[i])
          /* โลโก้ลูกค้า: ใช้ชุดเดียวกับหน้าแรก (อาร์ตอนุมัติ 22 ต.ค. · home.json logos.approved) · สถิติตัดตัวที่ยังรอยืนยันบนเว็บจริง */
          const lg = json('home.json').logos
          const logos = lg.show && lg.approved ? readdirSync(resolve(root, 'public/img/client')).filter((f) => /\.(png|svg|webp)$/.test(f)).sort().map((f) => ({ img: `/img/client/${f}`, alt: json('client-logos.json')[f.replace(/\.\w+$/, '')] || '' })) : []
          const stats = wk.brands.stats.filter((x) => !forWp || !pending(x.n))
          const brands = { ...wk.brands, logos, stats, show: !forWp || logos.length > 0 || stats.length >= 2 }
          /* ภาพลูกค้าสวมเสื้อ แยก 10 กลุ่มลูกค้าตาม v22 (28 ต.ค. อาร์ต "เติมให้ครบ แยกตาม v22") · ลำดับและชื่อเดียวกับเมนู "เสื้อสำหรับทีมคุณ"
             รูปมาจาก works.json + customers.json (photoGroup = กลุ่มของรูป · occ = โอกาสใช้งานตามที่เห็นในรูป · q = คุณภาพ 3 ดีสุด ขึ้นก่อน)
             กลุ่มที่ยังไม่มีรูปไม่แสดง · การ์ดกลุ่มเป็นแท็บ (works-page.js) ไม่มี JS = เรียงทุกกลุ่มต่อกัน */
          /* 11 พ.ย. รูปเล็กต้องมีไฟล์จริง (เดิมเดา -320.jpg เสมอ · รูปจาก download-designs มีแค่ -540.webp → รูปเสียในราง) */
          const smallOf = (img) => ['-320.jpg', '-320.webp', '-540.webp'].map((x) => img.replace(/\.(jpg|webp)$/, x)).find((f) => existsSync(resolve(root, 'public' + f))) || img
          const pool = [...data.works.map((w) => ({ ...w, imgSmall: smallOf(w.img) })), ...json('customers.json')].filter((x) => x.photoGroup)
          const groups = data.uses.map((u) => {
            const items = pool.filter((x) => x.photoGroup === u.id).sort((a, b) => (b.q ?? 2) - (a.q ?? 2)).map((x) => ({ img: x.img, imgSmall: x.imgSmall, occ: x.occ, alt: `${x.occ || 'ทีมลูกค้าใส่เสื้อ'} · ลูกค้ากลุ่ม${u.shortName}ของทีมดี` }))
            /* เหลือไม่เกิน 3 รูป โชว์ทั้งหมดเลย ไม่ทำปุ่ม "ดูอีก 1 ภาพ" */
            /* รอบ 166 (อาร์ต "แสดงลูกค้ามาทุกกลุ่มเลย แถวละกลุ่ม"): ทุกกลุ่มเรียงลงมา กลุ่มละแถว · ชุดแรก 5 รูป + ช่องที่ 6 = การ์ด "ดูอีก N ภาพ" (งบ DOM มือถือ gallery-paging ≤ 200 รูป) · ≤ 6 รูปโชว์หมด */
            const cut = items.length <= 6 ? items.length : 5
            return { cat: u.id, name: u.shortName, icon: { corp: 'use-corp', shop: 'use-fashion', gov: 'use-uniform', edu: 'help-think', class: 'use-team', faculty: 'use-flags', sport: 'use-sport', badminton: 'use-badminton', running: 'use-run', event: 'use-event' }[u.id], n: items.length, href: url('uses', u.id), useName: u.shortName, items, lead: items[0], thumbs: items.slice(1, cut), rest: items.slice(cut), /* 11 พ.ย. การ์ดโปสเตอร์: รูปแรกที่ยังไม่โชว์ในราง · คำบรรยายกลุ่มจากการ์ดกลุ่มหน้าแรก */ poster: `/img/uses-row/${u.id}-960.webp`, posterAt: { corp: '20%' }[u.id] || '50%', /* รอบ 3: ภาพบรรยากาศกลุ่มที่เคยเจน (ป้ายภาพจำลอง) */ sub: json('home.json').uses.cards[u.id]?.sub || '' }
          }).filter((g) => g.n)
          const rv = { groups, total: groups.reduce((s, g) => s + g.n, 0) }
          /* แบนเนอร์ (9 พ.ย. อาร์ตเลือกแบบ ค "กองภาพบนโต๊ะ แบบภาพส่งงาน"): ภาพลูกค้าจริง 5 ใบ คนละกลุ่ม สีสด แนวนอน (คัดจาก customers.json q=3)
             ใบแรก = บนสุดของกอง · ป้ายบนขอบภาพ = ชื่อกลุ่มลูกค้าตามเมนู · ไม่มีในคลัง = build พัง */
          const heroPile = ['lc314', 'lc271', 'lc203', 'lc276', 'lc37'].map((id) => {
            const x = json('customers.json').find((c) => c.img === `/img/customer/${id}.webp`)
            const u = x && data.uses.find((y) => y.id === x.photoGroup)
            if (!u) throw new Error(`heroPile: ไม่มีภาพ ${id} หรือกลุ่มลูกค้า`)
            return { img: x.img, tag: u.shortName, alt: `${x.occ || 'ทีมลูกค้าใส่เสื้อ'} · ลูกค้ากลุ่ม${u.shortName}ของทีมดี` }
          })
          /* รีวิว 2 แถวเลื่อน (อาร์ต 27 ต.ค. "เอาแบบสองแถวเลื่อนๆ กดดูหลายรูป") · แถวบนเลขคู่ แถวล่างเลขคี่
             รีวิวที่เป็นเรื่องราวแล้วไม่วิ่งซ้ำในแถว (28 ต.ค. คนเห็นคำพูดเดิมสองรอบ) · allReviews ยังครบ ให้กล่องดูรูปเปิดได้ทุกราย */
          const allR = reviewItems()
          const stories = json('reviews.json').stories.map((s) => ({ ...s, r: allR.find((x) => x.id === s.review) })).filter((s) => s.r)
          const inStory = new Set(stories.map((s) => s.r.id))
          const rowR = allR.filter((r) => !inStory.has(r.id))
          const reviewRows = [rowR.filter((_, i) => i % 2 === 0), rowR.filter((_, i) => i % 2 === 1)]
          /* รอบ 169 (9 พ.ย. อาร์ต "เสียงจากผู้สั่งฯ + เรื่องราวจากทีมลูกค้า เอามารวมกัน ไม่เอาเลื่อนๆ · กว้างพิเศษ")
             169c (อาร์ตแคปกระดานรีวิวหน้าแรก "ชอบแบบนี้อะ ทำให้มันดีกว่าอันนี้"): กระดานเดียวกับหน้าแรก (hm-rvb) รีวิวครบทุกราย
             เรื่องเด่นขึ้นก่อน (มีหัวเรื่อง ข้อเท็จจริง ไอคอน 3D Magnific 9 พ.ย.) ตามด้วยรีวิวอื่น · ไม่มีไอคอนของเรื่อง = build พัง */
          const storyIcon = { 'outing-fabric': 'trip', 'hr-outing': 'stage', 'school-sportsday': 'flag', 'krungthai-badminton': 'badminton' }
          const pjBoard = [...stories.map((st) => {
            if (!storyIcon[st.review]) throw new Error(`pjBoard: เรื่อง ${st.review} ไม่มีไอคอน`)
            return { ...st.r, story: { title: st.title, facts: st.facts, icon: `/img/icons/story-${storyIcon[st.review]}.webp` } }
          }), ...rowR].map((r) => ({ ...r, total: r.gallery?.length || (r.img ? 1 : 0), useName: { corp: 'องค์กร / บริษัท', sport: 'ทีมกีฬา', event: 'อีเวนต์ / งานบุญ', school: 'โรงเรียน' }[r.use] || '', mono: [...(r.who || r.kind)].find((c) => !'เแโใไ'.includes(c)),
            /* รูปวงกลม (การ์ด + แถวรายชื่อ) = พื้นหลัง CSS ไฟล์ -480-160 · ไม่นับงบรูปมือถือ (gallery-paging ≤ 200) · ไม่มีไฟล์ = build พัง */
            thumb: r.imgSmall ? (() => { const t = r.imgSmall.replace(/-480\.webp$/, '-480-160.webp'); if (!existsSync(resolve(root, 'public' + t))) throw new Error(`pjBoard: ไม่มี ${t}`); return t })() : '' }))
          /* รอบ 164 (อาร์ตแคปกล่องปิดเดิม "ต่อเลย"): แบนเนอร์ LINE ชุดเดียวกับ /designs/ (lineCta) · ข้อความในแชท = บรรทัดที่ปุ่มพิมพ์รอไว้ (reviewsCtaLine) */
          const att = data.designs.find((x) => x.code === 'TD-0004') || data.designs[0]
          const projectLine = { h2: data.reviewsCta.title, h: 'แชทผ่าน LINE', live: 'ตอบภายใน 5 นาที', sub: 'เล่างาน จำนวน และวันที่อยากได้รับเสื้อ ทีมดีช่วยเลือกแนวทางให้', cta: 'เริ่มแชทเลย', alt: 'หรือฝากข้อมูลให้ติดต่อกลับ',
            msg: data.reviewsCta.msg.slice(0, 3), design: { img: att.imgSmall || att.img, code: att.code }, fly: lineFly(data.designs) }
          return { ...base, projectLine, allReviews: allR, reviewRows, stories, pjBoard, wk: { ...wk, brands, rv, heroPile, contact: { ...wk.contact, links: wk.contact.links.filter((l) => has(l.to)) } } }
        }
        if (kind === 'galleries') {
          const dp = json('design-pages.json').groups[id]
          /* คลังรูปกลาง 30 ต.ค. (แกลเลอรีเดิมบาง 1–4 รูป): แบบมีรหัส TD ก่อน → ภาพแบบของกลุ่มนี้ (เสื้อ 3D · แกลเลอรีเว็บเดิม)
             → งานจริงของลูกค้ากลุ่มนี้ (customers.json / works.json ไม่เกิน 12) · ทุกภาพต้องมีแท็กกลุ่มนี้ในคลัง ไม่ยืมกลุ่มอื่น */
          const item = data.uses.find((x) => x.id === id)
          const sel = gallerySelection(data.designs, id, designsFor(data.designs, id))
          return { ...base, item, dp, gallery: { ...galleryFor(mediaLib(), { group: id, shortName: item.shortName, coded: sel.items }), inspiration: sel.inspiration } }
        }
        if (kind === 'designs') {
          const dp = json('design-pages.json').index
          const has = (key) => { try { url(key); return true } catch { return false } }
          const liveN = (g) => json('live-gallery.json').groups[g]?.items.length || 0
          /* ทางเข้าแกลเลอรีรายกลุ่ม (ส่วน "เลือกแบบตามงานที่ใช้") แบบการ์ด · เฉพาะกลุ่มที่มีแบบ (ไม่พาไปหน้าว่าง) · ชื่อสั้นจาก uses.json */
          const useById = Object.fromEntries(json('uses.json').map((u) => [u.id, u]))
          const small = (img) => { const s = img?.replace(/(\.\w+)$/, '-320$1'); return s && existsSync(resolve(root, 'public' + s)) ? s : img }
          /* รูปการ์ด = แบบเสื้อ 3D ที่มีรหัสของกลุ่มนั้น (อาร์ตเคาะ 26 ต.ค.) · ไม่ใช้แบบซ้ำกับการ์ดก่อนหน้า */
          const usedCard = new Set()
          const pills = dp.pills.filter((l) => has(l.to)).map((l) => {
            const id = l.to.split('.')[1]
            const u = useById[id] || {}
            const own = gallerySelection(data.designs, id, designsFor(data.designs, id)).items
            const d = own.find((x) => !usedCard.has(x.code)) || own[0]
            if (d) usedCard.add(d.code)
            return { ...l, id, short: u.shortName || l.t, photo: d?.imgSmall || small(u.img), n: own.length + liveN(id), codedN: own.length, referenceN: liveN(id) }
          }).filter((l) => l.n > 0)
          /* ชิปกลุ่มลูกค้า (รอบ 150): ลิงก์ ?use= ใช้ได้แม้ไม่มี JS · แบด/วิ่ง ไม่มีแบบติดกลุ่ม → กรองตามทรงเสื้อ (garment) · ชิปที่กรองแล้วไม่มีแบบ = build พัง */
          const byGarment = { badminton: 'badminton', running: 'running' }
          const home = url('designs')
          const chips = [{ t: dp.chipsAll, href: home, axis: '', val: '' }, ...pills.map((l) => {
            const axis = byGarment[l.id] ? 'garment' : 'use', val = byGarment[l.id] || l.id
            if (!data.designs.some((x) => (axis === 'use' ? (x.use || []).includes(val) : x.garment === val))) throw new Error(`design-pages.json: ชิป ${l.id} ไม่มีแบบ`)
            return { t: l.short, href: `${home}?${axis}=${val}`, axis, val }
          })]
          /* แบนเนอร์ LINE (รอบ 151): แนบภาพแบบจริงในแชทตัวอย่าง · ข้อความในแชท = บรรทัดที่ปุ่มพิมพ์รอไว้ (designsCtaLine) · "ตอบภายใน 5 นาที" คำเดียวกับ home.json */
          const att = data.designs.find((x) => x.code === 'TD-0004') || data.designs[0]
          const designsLine = { h2: data.designsCta.title, h: 'แชทผ่าน LINE', live: 'ตอบภายใน 5 นาที', sub: 'ส่งรหัสแบบที่เลือก ขอราคา หรือสั่งผลิต จบได้ในแชทเดียว', cta: 'เริ่มแชทเลย', alt: 'หรือฝากข้อมูลให้ติดต่อกลับ',
            msg: data.designsCta.msg.slice(0, 3), design: { img: att.imgSmall || att.img, code: att.code },
            /* รอบ 156 "ยังไม่โดน": เสื้อลายจริงลอยเข้าหามือถือ (lineFly) */
            fly: lineFly(data.designs) }
          return { ...base, dp: { ...dp, pills, chips }, designsLine, designsLd: ldJson(designListSchema(data.designs, data.site.baseUrl)) }
        }
        if (kind === 'posts') {
          /* บทความใหม่ตาม v22 · หัวข้อ/ร่างจาก posts.json ต่อด้วยบทความเดิมที่เรื่องตรงกัน · ลิงก์บทความเกี่ยวข้องชี้กันเองใน 4 เรื่องนี้ */
          const all = json('posts.json')
          const p = all[id]
          const src = data.articles.items.find((x) => x.id === p.base)
          const item = { ...src, title: p.h1, lead: p.lead || src.lead, sections: [...p.sections.filter((x) => x.body), ...src.sections].map((x) => ({ ...x, t: x.t || x.title })) }
          const related = Object.entries(all).filter(([k]) => k[0] !== '_' && k !== id).map(([k, x]) => {
            const b = data.articles.items.find((a) => a.id === x.base)
            return { ...b, title: x.h1, excerpt: x.lead, to: `posts.${k}` }
          })
          /* ส่วนท้ายตาม v22: ลิงก์ต่อ · หัวข้อบทความเกี่ยวข้อง · หัวข้อปิดท้าย */
          return { ...base, item, related, more: p.more, relatedH: p.relatedH, cta: p.cta }
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
            /* หัวข้อตาม v22 (guide-pages.json) + เนื้อหาเดิม · เว็บจริงซ่อนหัวข้อที่ยังว่าง */
            item: (() => { const g = guideView(data.allGuides.find((x) => x.id === id), json('guide-pages.json')[id], { forWp }); return guidePresentation({ ...g, hasLinks: g.sections.some((s) => s.kind === 'links') }, data.guides) })(),
            otherGuides: data.guides.filter((x) => x.id !== id),
            /* แชทปิดท้าย + ขั้นต่อไปกลางหน้า ตามเรื่องของคู่มือ (27 ต.ค. ตรวจหน้าคู่มือ · กติกา CTA แชทแนบของตามบริบท)
               เดิมทุกคู่มือใช้แชทของหน้ารู้จักทีมดี · ไม่มีคำเคลมใหม่ (ไม่พูดว่าฟรี / เร็ว) */
            guideCta: (() => {
              const g = (title, lead, send, msg, attach, note, cta, next) => {
                const text = msg.map((m) => (m.q ? `${m.t}: ${m.unit ? ` ${m.unit}` : ''}` : m.t)).join('\n')
                /* หัวข้อแชทตาม v22 ทุกคู่มือ (tests/v22-structure) · เรื่องเฉพาะของคู่มืออยู่ในคำโปรย ข้อความแชท และไฟล์แนบ */
                return { c: { title: 'มีโจทย์เสื้อทีม เล่าให้ทีมดีฟังได้เลย', lead: `${title} ${lead}`, send: { label: 'บอกทีมดี 3 อย่าง', items: send }, msg, attach, note }, cta, line: lineMessageUrl(text), next: next && { ...next, line: lineMessageUrl(next.text) } }
              }
              const logo = { file: 'logo-team.ai', kind: 'ไฟล์โลโก้' }
              const M = {
                print: g('อยากเริ่มทำเสื้อพิมพ์ลาย คุยกับทีมดีได้เลย', 'ยังไม่มีแบบก็เริ่มได้ ส่งภาพที่ชอบหรือเล่าโจทย์ให้ฟัง', ['ใช้เสื้อกับงานอะไร', 'จำนวนประมาณกี่ตัว', 'อยากได้รับวันไหน'],
                  [{ t: 'สวัสดี ทีมดี สนใจทำเสื้อพิมพ์ลาย' }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }, { t: 'อยากได้รับวันที่', q: true }], [{ img: '/img/real/r05-320.webp' }],
                  'ข้อความนี้พิมพ์รอไว้ในแชท · แนบรูปเสื้อที่ชอบได้เลย', 'ทัก LINE เล่าโจทย์', { section: 'start', ico: 'icoSpark', t: 'ยังไม่มีแบบ ส่งภาพที่ชอบมาก่อนได้', p: 'ทีมดีช่วยคิดแบบจากโจทย์ของทีมคุณ', label: 'ส่งภาพที่ชอบทาง LINE', text: 'ยังไม่มีแบบ อยากให้ทีมดีช่วยคิดแบบเสื้อพิมพ์ลาย\nใช้กับงาน: \nภาพที่ชอบ: (แนบในแชท)' }),
                screen: g('อยากรู้ราคาสกรีนตามแบบของทีมคุณ', 'ส่งโลโก้หรือลายที่จะสกรีน พร้อมจำนวนและสีเสื้อ', ['ลายหรือโลโก้ที่จะสกรีน', 'สีเสื้อและจำนวน', 'อยากได้รับวันไหน'],
                  [{ t: 'สวัสดี ทีมดี สนใจทำเสื้อสกรีน' }, { t: 'สีเสื้อ', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }, { t: 'อยากได้รับวันที่', q: true }], [logo],
                  'ข้อความนี้พิมพ์รอไว้ในแชท · แนบไฟล์ลายหรือโลโก้ได้เลย', 'ทัก LINE ขอราคาสกรีน', { section: 'price', ico: 'icoTag', t: 'อยากได้ราคาจริงตามแบบของคุณ?', p: 'ส่งลาย จำนวน และสีเสื้อ ทีมดีแจ้งราคาให้', label: 'ขอราคาสกรีนทาง LINE', text: 'ขอราคาเสื้อสกรีน\nลาย/โลโก้: (แนบในแชท)\nสีเสื้อ: \nจำนวนประมาณ:  ตัว' }),
                polo: g('มีโลโก้แล้ว ส่งให้ทีมดีช่วยดูงานปัก', 'ส่งไฟล์หรือรูปถ่ายโลโก้ จุดที่อยากปัก และจำนวนประมาณ', ['ไฟล์หรือรูปถ่ายโลโก้', 'จุดที่อยากปัก', 'จำนวนประมาณกี่ตัว'],
                  [{ t: 'สวัสดี ทีมดี ส่งโลโก้ให้ช่วยดูงานปักโปโล' }, { t: 'จุดที่อยากปัก', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }], [logo, { img: '/img/customer/co13-320.webp' }],
                  'ข้อความนี้พิมพ์รอไว้ในแชท · แนบโลโก้เป็นไฟล์หรือรูปถ่ายก็ได้', 'ทัก LINE ส่งโลโก้', { section: 'artwork', ico: 'icoPen', t: 'ส่งโลโก้ให้ทีมดีช่วยดูก่อนได้', p: 'แนบไฟล์หรือรูปถ่ายโลโก้ในแชท พร้อมจุดที่อยากปัก', label: 'ส่งโลโก้ทาง LINE', text: 'ส่งโลโก้ให้ทีมดีช่วยดู (เสื้อโปโลปัก)\nจุดที่อยากปัก: \nขนาดโดยประมาณ: ' }),
                fabric: g('อยากจับผ้าจริงก่อนเลือก?', 'บอกผ้าที่สนใจและงานที่จะใช้ ทีมดีช่วยแนะนำผ้าที่เหมาะ', ['ผ้าที่สนใจ', 'ใช้เสื้อกับงานอะไร', 'จำนวนประมาณกี่ตัว'],
                  [{ t: 'สวัสดี ทีมดี ขอปรึกษาเรื่องผ้า' }, { t: 'ผ้าที่สนใจ', q: true }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }], [{ img: '/img/fabric/honeycomb.webp' }],
                  'ข้อความนี้พิมพ์รอไว้ในแชท', 'ทัก LINE ถามเรื่องผ้า', { section: 'compare', ico: 'icoSwatch', t: 'อยากเห็นผ้าจริงก่อนตัดสินใจ?', p: 'ขอตัวอย่างผ้าไปดูสีและสัมผัสจริงได้', label: 'ขอตัวอย่างผ้าทาง LINE', text: 'ขอตัวอย่างผ้า\nผ้าที่สนใจ: \nใช้กับงาน: ' }),
                size: g('รวมไซซ์ทั้งทีมแล้ว ส่งไฟล์มาได้เลย', 'ส่งไฟล์ตารางไซซ์ที่กรอกแล้ว ทีมดีตรวจจำนวนให้ก่อนผลิต', ['ไฟล์ตารางไซซ์ทีม', 'ทรงเสื้อที่จะสั่ง', 'จำนวนทั้งหมด'],
                  [{ t: 'สวัสดี ทีมดี ส่งรายการไซซ์ทีม' }, { t: 'ทรงเสื้อ', q: true }, { t: 'จำนวนทั้งหมด', q: true, unit: 'ตัว' }], [{ file: 'size-team.csv', kind: 'ตารางไซซ์ทีม' }],
                  'ข้อความนี้พิมพ์รอไว้ในแชท · แนบไฟล์ที่กรอกแล้วได้เลย', 'ทัก LINE ส่งไฟล์ไซซ์', { section: 'collect', ico: 'icoRuler', t: 'กรอกไซซ์ครบแล้ว ส่งไฟล์ได้เลย', p: 'แนบไฟล์ตารางไซซ์ในแชท ทีมดีตรวจจำนวนให้', label: 'ส่งไฟล์ไซซ์ทาง LINE', text: 'ส่งรายการไซซ์ทีม (แนบไฟล์ในแชท)\nทรงเสื้อ: \nจำนวนทั้งหมด:  ตัว' }),
                logo: g('ส่งไฟล์โลโก้ให้ทีมดีตรวจก่อน', 'ไฟล์ยังไม่ครบก็ส่งที่มีได้ ทีมดีบอกว่าต้องเตรียมอะไรเพิ่ม', ['ไฟล์หรือรูปโลโก้ที่มี', 'เสื้อที่จะทำ', 'จำนวนประมาณกี่ตัว'],
                  [{ t: 'สวัสดี ทีมดี ส่งไฟล์โลโก้ให้ช่วยตรวจ' }, { t: 'เสื้อที่จะทำ', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }], [logo],
                  'ข้อความนี้พิมพ์รอไว้ในแชท · แนบไฟล์โลโก้ได้เลย', 'ทัก LINE ส่งไฟล์', { section: 'files', ico: 'icoDoc', t: 'ไม่แน่ใจว่าไฟล์ใช้ได้ไหม?', p: 'ส่งไฟล์ที่มีมาให้ทีมดีช่วยดูก่อน', label: 'ส่งไฟล์ทาง LINE', text: 'ส่งไฟล์โลโก้ให้ช่วยตรวจ (แนบในแชท)\nเสื้อที่จะทำ: ' }),
                delivery: g('ติดตามงานหรือแจ้งเรื่องหลังรับเสื้อ', 'บอกชื่องานหรือเลขใบเสนอราคา พร้อมเรื่องที่ต้องการแจ้ง', ['ชื่องานหรือเลขใบเสนอราคา', 'เรื่องที่ต้องการแจ้ง', 'รูปถ่าย (ถ้ามี)'],
                  [{ t: 'สวัสดี ทีมดี สอบถามเรื่องงานที่สั่ง' }, { t: 'ชื่องาน/เลขใบเสนอราคา', q: true }, { t: 'เรื่องที่ต้องการแจ้ง', q: true }], [{ file: 'photo.jpg', kind: 'รูปเสื้อที่ได้รับ' }],
                  'ข้อความนี้พิมพ์รอไว้ในแชท · แนบรูปถ่ายได้เลย', 'ทัก LINE แจ้งทีมดี', { section: 'problem', ico: 'icoChat', t: 'พบปัญหา แจ้งทีมดีพร้อมรูปถ่าย', p: 'บอกชื่องานและสิ่งที่พบ ทีมดีตรวจสอบให้', label: 'แจ้งทีมดีทาง LINE', text: 'แจ้งเรื่องหลังรับเสื้อ\nชื่องาน/เลขใบเสนอราคา: \nสิ่งที่พบ: \n(แนบรูปในแชท)' }),
                collar: g('ไม่แน่ใจว่าคอแบบไหนเหมาะกับทีม', 'บอกงานที่ใช้และเทคนิคที่สนใจ ทีมดีช่วยแนะนำทรงคอ', ['ใช้เสื้อกับงานอะไร', 'เทคนิคที่สนใจ', 'จำนวนประมาณกี่ตัว'],
                  [{ t: 'สวัสดี ทีมดี ปรึกษาเรื่องทรงคอเสื้อ' }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }], null,
                  'ข้อความนี้พิมพ์รอไว้ในแชท', 'ทัก LINE ปรึกษา', null),
              }
              return M[id] || M.print
            })(),
          }
        }
        return base
      },
      helpers: {
        eq: (a, b) => a === b,
        /* ชื่อแรกของชื่อที่มีหลายชื่อ ("เสื้อแบดมินตัน / เสื้อแบด / …") ใช้ใน breadcrumb ไม่ให้อ่านเป็นหลายชั้น */
        firstName: (s) => String(s || '').split(' / ')[0],
        baht: (n) => Number(n).toLocaleString('en-US'),
        lt: (a, b) => Number(a) < Number(b),
        /* (or rows @root.reviewWall.rows) ค่าแรกที่มี · partial ที่รับพารามิเตอร์แล้วมีค่าเริ่มต้น (คลังรีวิว 10 พ.ย.) */
        or: (...a) => a.slice(0, -1).find((x) => x != null && x !== '' && !(Array.isArray(x) && !x.length)),
        inc: (n) => Number(n) + 1,
        /* {{#each (array "a" "b")}} รายการคงที่ในเทมเพลต (ต้นแบบหลายทาง 4 พ.ย.) */
        array: (...a) => a.slice(0, -1),
        /* (concat (url 'contact') "?p=" item.id) ต่อข้อความ · ตัวท้ายคือ options ของ Handlebars ตัดทิ้ง */
        concat: (...a) => a.slice(0, -1).join(''),
        /* {{{ph หัวข้อ}}} ห่อวลีไทยไม่ให้หักกลาง (src/js/phrases.js) */
        ph: (t) => phrases(t),
        /* {{{hl หัวข้อ "ท้ายวลี"}}} ท้ายวลีเป็นสีส้ม .hm-hl (อาร์ต 3 พ.ย. แบบ "ที่ไว้วางใจทีมดี") · ข้อความต้องลงท้ายด้วยวลีนั้น ไม่งั้นแสดงปกติ */
        /* {{{hl หัวข้อ วลีท้ายสีส้ม [ขึ้นบรรทัดหลังคำนี้]}}} · ตัวที่ 3 (11 พ.ย. อาร์ต "ยังไม่แน่ใจว่า / เสื้อแบบไหนเหมาะกับทีม?") บังคับ <br> หลังคำนั้น ข้อความไม่เปลี่ยน */
        hl: (t, tail, brk) => {
          const s = String(t ?? '')
          if (typeof tail !== 'string' || !tail || !s.endsWith(tail)) return phrases(s)
          const head = s.slice(0, -tail.length)
          const h = head.trim()
          const lead = typeof brk === 'string' && brk && h.startsWith(brk) && h.length > brk.length ? `${phrases(brk)}<br>${phrases(h.slice(brk.length).trim())}` : phrases(h)
          return `${h ? lead + (/\s$/.test(head) ? ' ' : '<wbr>') : ''}<span class="hm-hl">${phrases(tail)}</span>`
        },
        /* {{{dots บรรทัด}}} ตัดบรรทัดเฉพาะที่ " · " (src/js/phrases.js chunks) */
        dots: (t) => chunks(t),
        /* ลิงก์แผนที่ · ช่องว่างและภาษาไทยใน query ต้อง encode */
        enc: (t) => encodeURIComponent(String(t ?? '')),
        /* {{{json list}}} ข้อมูลให้ JS ในหน้า (กล่องดูรูปรีวิว) · กัน </script> */
        json: (x) => JSON.stringify(x ?? null).replace(/</g, '\\u003c'),
        /* {{#with (stat this.n)}} แยกตัวเลข/+/หน่วย ให้สถิติหน้าแรกวิ่งนับได้ (src/js/count-up.js) */
        stat: (t) => parseStat(t),
        /* {{url 'contact'}} · {{url 'products' this.id}} · {{url 'guides.size'}} — ลิงก์ภายในทุกตัวต้องผ่านตัวนี้ */
        url: (key, id) => url(key, typeof id === 'string' ? id : undefined),
        /* {{#each (media group="sport" kind="customer,work" limit=6)}} ดึงรูปจากคลังกลาง (30 ต.ค.) · kind/product คั่นด้วยจุลภาค */
        media: (options) => {
          const h = { ...options.hash }
          for (const k of ['kind', 'product']) if (typeof h[k] === 'string') h[k] = h[k].split(',').map((s) => s.trim())
          return mediaFor(h)
        },
      },
    }),
  ],
  define: { 'import.meta.env.TD_WP': JSON.stringify(forWp) },
  build: { outDir: resolve(root, forWp ? 'dist-wp' : 'dist'), emptyOutDir: true, rollupOptions: { input } },
})
