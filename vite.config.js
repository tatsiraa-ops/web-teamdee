import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'
import tailwindcss from '@tailwindcss/vite'
import { makeUrl, pageFor } from './src/js/routes.js'
import { faqSchema, businessSchema, ldJson } from './src/js/seo-schema.js'
import { buildRealGrid } from './src/js/real-grid.js'
import { parseStat } from './src/js/count-up.js'
import { productView, pending } from './src/js/product-view.js'
import { useView } from './src/js/use-view.js'
import { useCta, lineMessageUrl } from './src/js/use-cta.js'
import { prunePending } from './src/js/prune.js'
import { homeView } from './src/js/home-view.js'
import { guideView } from './src/js/guide-view.js'
import { designDetail } from './src/js/design-page.js'
import { phrases } from './src/js/phrases.js'
import { calcPricing, calcKinds, calcHref, productPrice, priceFact, heroPrice, priceLine, useQuote } from './src/js/prices.js'

const root = dirname(fileURLToPath(import.meta.url))
/* ไฟล์หน้าเว็บอยู่ใน site/ วางโฟลเดอร์ตาม URL จริง เช่น site/sublimation/index.html → /sublimation/
   dev กับ build จึงได้ URL เดียวกันโดยไม่ต้อง rewrite (PLAN ข้อ 6) */
const siteDir = resolve(root, 'site')
/* build สำหรับธีม WordPress (scripts/export-wp.mjs ตั้ง TD_TARGET=wp) · ตัด hero ต้นแบบ ไม่ทำ sitemap เอง (ปลั๊กอิน SEO ทำ) */
const forWp = process.env.TD_TARGET === 'wp'
const json = (f) => JSON.parse(readFileSync(resolve(root, 'src/data', f), 'utf8'))

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
  /* เมนูหลักตาม v22 · src/data/nav.json */
  nav: json('nav.json'),
  techniques: json('techniques.json'),
  groups: json('groups.json'),
  works: json('works.json'),
  /* เครื่องคำนวณ /calculations/ · สร้างจาก prices.json ไฟล์ราคาเดียวของเว็บ (src/js/prices.js) */
  pricing: calcPricing(json('prices.json')),
  /* ชิปขั้น 1 · ผ้าโปโล · ออปชัน · บรรทัดราคาใต้ H1 ของเครื่องคำนวณ (audit calc-01 calc-06) */
  calculator: calcKinds(json('prices.json')),
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
  legacyPosts: (() => {
    const l = json('legacy-posts.json')
    const name = Object.fromEntries(l.cats.map((c) => [c.id, c.name]))
    const items = l.items.map((x) => ({ ...x, catName: name[x.cat] }))
    return { ...l, items, featured: items[0], side: items.slice(1, 3) }
  })(),
  v22Posts: Object.entries(json('posts.json')).filter(([k]) => k[0] !== '_').map(([id, x]) => ({ id, title: x.h1, lead: x.lead })),
  nudges: json('nudges.json').items,
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
  /* แผงกลุ่มงานหน้าแรก · ใช้รูปทีมลูกค้าจริง (public/img/real) แทนภาพกราฟิกโปรโมต · อาร์ตสั่งรื้อ 20 ต.ค. 2026 */
  /* lines = จุดตัดบรรทัดชื่อกลุ่มในแผงแคบ ไม่ให้ภาษาไทยตัดกลางวลี (เช่น กีฬาและการ / แข่งขัน) */
  homeUses: (() => {
    const pick = {
      /* why = ข้อสังเกตเฉพาะกลุ่ม ย่อจาก uses.json lead (ข้อความของทีมดีเอง) · แสดงในดัชนีกลุ่มลูกค้าหน้าแรก (อาร์ต 23 ต.ค. แบบ A) */
      corp: { lines: ['เสื้อบริษัท ร้านค้า', 'และยูนิฟอร์ม'], en: 'CORPORATE', why: ['ภาพลักษณ์ที่ลูกค้าเห็น', 'งบ และกำหนดใช้ที่ชนกัน'], photo: '/img/real/r23.jpg', alt: 'ทีมพนักงานบริษัทใส่เสื้อทีมสีแดงที่ทีมดีผลิต' },
      gov: { lines: ['เสื้อหน่วยงาน', 'และองค์กร'], en: 'ORGANIZATION', why: ['งานราชการแพ้ชนะกันที่เอกสารและรอบเวลา', 'ไม่ใช่ที่ลาย'], photo: '/img/real/r26.jpg', alt: 'เจ้าหน้าที่หน่วยงานใส่เสื้อโปโลสีกรมท่าที่ทีมดีผลิต' },
      edu: { lines: ['เสื้อโรงเรียน', 'และมหาวิทยาลัย'], en: 'EDUCATION', why: ['มีรอบปฏิทินทุกปี', 'และต้องรวบรวมความเห็นหลายฝ่าย'], photo: '/img/real/r16.jpg', alt: 'นักเรียนใส่เสื้อโปโลสีขาวฟ้าที่ทีมดีผลิต' },
      sport: { lines: ['เสื้อกีฬา', 'และการแข่งขัน'], en: 'SPORTS', why: ['ใส่ซ้ำทั้งฤดูกาล ผ้ากับทรงสำคัญกว่าลาย', 'ชื่อ-เบอร์แยกรายคน'], photo: '/img/real/r17.jpg', alt: 'ทีมฟุตบอลใส่เสื้อลายทางแดงขาวที่ทีมดีผลิต' },
      event: { lines: ['เสื้อกิจกรรม', 'และชมรม'], en: 'EVENTS', why: ['จำนวนเยอะ สปอนเซอร์หลายเจ้า', 'และวันงานขยับไม่ได้'], photo: '/img/real/r21.jpg', alt: 'นักวิ่งใส่เสื้อสีม่วงที่ทีมดีผลิต ในงานวิ่ง' },
    }
    /* หน้าแรก Section 03 ตาม v22 = 5 การ์ด บริษัท กีฬา กิจกรรม โรงเรียน หน่วยงาน · กลุ่มอื่นเข้าทางเมนู */
    return json('uses.json').filter((u) => pick[u.id]).map((u) => ({ ...u, ...pick[u.id] }))
  })(),
  /* หน้าแรกตาม Wireframe v4 (21 ต.ค. 2026) · ข้อความอยู่ใน home.json · ที่นี่เติมรูปจริงที่มีอยู่แล้ว
     ช่องที่ยังไม่มีของจริง (รีวิว คลิป โลโก้ที่ได้อนุญาต งานสกรีน งานแบบพิเศษ) คงเป็นช่องรอข้อมูลตาม v4 */
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
    const photoRows = [mixed.slice(0, 12)]
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
         ราคาต้องบอกจำนวนที่ใช้ได้ (audit home-02) · การ์ดที่เครื่องคำนวณคิดได้ มีลิงก์ "คำนวณราคาตามจำนวน" พร้อม ?kind= */
      /* วิธีนับวันผลิตใต้การ์ดบริการ (เปิดทุกวัน · เริ่มนับวันถัดจากยืนยันแบบ · ช่วงคิวแน่น · งานด่วน) */
      cats: { ...h.cats, leadNote: json('lead-times.json').note, items: h.cats.items.map((c) => {
        const prices = json('prices.json')
        const price = priceFact(prices, c.id)
        const lead = json('lead-times.json')[c.id]
        return { ...c, product: pick(c.id), calcHref: calcHref(prices, c.id, url('calculations')), facts: [
          /* มีตัวเลข = "ราคารวม VAT" · สกรีนที่ประเมินตามแบบ = "ราคา" เฉยๆ */
          { k: price?.sub ? 'ราคารวม VAT' : 'ราคา', v: price?.v || '', sub: price?.sub || '' },
          /* สกรีนของทีมดีมีแค่ DFT (26 ต.ค.) · คงคำว่า DFT ไว้ให้รู้ว่าเป็นงานแบบไหน */
          { k: 'ผลิต', v: lead ? lead.days : '' },
          { k: 'ขั้นต่ำ', v: `${prices.minQty} ตัว` },
        ].filter((f) => f.v) }
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
        items: printDesigns,
        total: printDesigns.length,
        uses: uses.map((u) => ({ id: u.id, name: u.name, n: printDesigns.filter((d) => (d.use || []).includes(u.id)).length })).filter((u) => u.n > 0),
      },
      works: {
        ...h.works,
        /* แถวเดียวมีแท็บ 4 หมวด · เว็บจริงไม่มีช่องรอภาพ และไม่มีแท็บที่ยังไม่มีงานจริง */
        rows: h.works.rows
          .map((row) => {
            const real = works.filter((w) => w.product === row.id)
            /* ช่องรอภาพโชว์เฉพาะแถวที่ยังไม่มีงานจริงเลย (21 ต.ค.: แถวโปโล/พิมพ์ลายมีงานจริงพอแล้ว ช่องเปล่าเกินมา) */
            return { ...row, real, pending: forWp || real.length ? [] : row.pending }
          })
          .filter((row) => row.real.length || !forWp)
          .map((row, i) => ({ ...row, first: i === 0 })),
      },
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
    const firstImg = (html.match(/<img[^>]+src="(\/img\/[^"]+)"/) || [])[1]
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
const webpImages = () => ({
  name: 'teamdee-webp',
  enforce: 'post',
  /* เฉพาะ path ของเราเองที่ขึ้นต้นด้วย /img/ (ต้นค่า หรือหลังจุลภาคใน srcset) ไม่แตะ URL ของเว็บอื่น */
  transformIndexHtml: (html) =>
    html.replace(/\b(src|srcset)="([^"]+)"/g, (m, attr, val) =>
      `${attr}="${val.replace(/(^|[\s,])(\/img\/[^\s",?#]+)\.jpg(?=[\s,?#]|$)/g, (p, pre, path) =>
        existsSync(resolve(root, 'public' + path + '.webp')) ? `${pre}${path}.webp` : p)}"`),
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

/* แบบเสื้อของแต่ละกลุ่มลูกค้า (v22) · ใช้ทั้งหน้ากลุ่มลูกค้าและแกลเลอรีรายกลุ่ม
   ตรงตามแท็กการใช้งาน (use) หรือทรง (garment) เท่านั้น · ร้านค้า รุ่น/ชมรม คณะ ยังไม่มีแบบติดแท็ก = ว่าง ไม่ยืมกลุ่มอื่น */
const DESIGN_TAG = { corp: { use: 'corp' }, gov: { use: 'gov' }, edu: { use: 'edu' }, sport: { use: 'sport' }, event: { use: 'event' }, badminton: { garment: 'badminton' }, running: { garment: 'running' } }
const designsFor = (designs, id) => {
  const q = DESIGN_TAG[id]
  return !q ? [] : designs.filter((r) => (q.use ? (r.use || []).includes(q.use) : r.garment === q.garment))
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
        const base = { ...data, page, wp: forWp }
        /* หน้าแรก: ข้อมูลธุรกิจ + FAQ ให้ Google อ่าน (SEO เสื้อโปโล / ยูนิฟอร์ม 21 ต.ค. 2026) */
        if (at === '/') base.homeLd = [businessSchema(data.site), faqSchema(json('home.json').faq.items)].filter(Boolean).map(ldJson)
        /* เครื่องคำนวณ: FAQ ราคาให้ Google อ่าน (audit calc-11) · เว็บจริงใช้ FAQ ที่ตัดข้อรอยืนยันแล้ว */
        if (at === '/calculations/') base.calcLd = (() => { const s = faqSchema(data.faq.calc); return s && ldJson(s) })()
        const { kind, id } = page
        /* แม่แบบหน้าแบบเสื้อ (v22 /design-[รหัส]/) · ต้นแบบเท่านั้น ตัวอย่างใช้แบบแรกในคลัง */
        if (at === '/design-sample/') return { ...base, designItem: designDetail(data.designs[0], { uses: data.uses, contactHref: url('contact') }) }
        if (kind === 'products') {
          const item = data.allProducts.find((x) => x.id === id)
          const tech = data.techniques[item.technique]
          /* ผ้าตามเทคนิค ดึงจากรายการผ้ากลางก่อน แล้วต่อด้วยรายการที่ยังรอยืนยัน ไม่ใช้ผ้าชุดเดียวกันทุกเทคนิค */
          const fabrics = [
            ...tech.fabricNames.map((n) => data.sizing.fabrics.find((f) => f.name === n)).filter(Boolean),
            ...tech.fabrics,
          ]
          /* v22: คลังแบบกราฟิกเป็นของงานพิมพ์ลายเท่านั้น · โปโลปักกับสกรีนไม่แสดงแกลเลอรีแบบ */
          const designsOf = item.technique === 'sublimation' ? data.designs.filter((r) => (r.product || []).includes(id)) : []
          const productTags = (item.tags || [])
            .map((t) => {
              const of = designsOf.filter((r) => r.garment === t.garment)
              return { ...t, n: of.length, sample: of[0] }
            })
            .filter((t) => t.n > 0)
          const productDesigns = item.tags ? designsOf : designsOf.slice(0, 6)
          const productWorks = data.works.filter((w) => w.product === id).slice(0, 3)
          /* หน้าสินค้าตาม Wireframe v22 (22 ต.ค. 2026) · ข้อความจาก product-pages.json + ข้อมูลจริงที่มีอยู่ */
          const has = (key) => { try { url(key); return true } catch { return false } }
          const pp = productView(json('product-pages.json')[id], { works: productWorks, designs: productDesigns, tags: productTags, fabrics, spec: item.spec, sizes: data.sizing.sizes, price: productPrice(json('prices.json'), id, { calcUrl: url('calculations') }) }, { forWp, has })
          return {
            ...base,
            item,
            pp,
            /* ภาพขั้นตอนผลิต: ยังไม่มี · รูปเครื่องพิมพ์ / เครื่องปัก / เครื่อง DFT เดิมพิสูจน์ที่มาไม่ได้ และทำให้ดูเหมือนทีมดีมีโรงงานเอง
               (อาร์ตเคาะ 24 ต.ค. ให้เอาออกทุกที่ · tests/clean-rules.test.js) · ได้ภาพในโรงงานพาร์ตเนอร์ที่ได้รับอนุญาตแล้วค่อยใส่ พร้อมคำบรรยายว่าเป็นพาร์ตเนอร์ */
            productionPhoto: null,
            /* ปุ่ม LINE ใน hero / กล่องราคา / ส่วนปิด พร้อมชื่อสินค้า (audit P5) */
            priceAsk: lineMessageUrl(`ขอราคา${item.name} จำนวนประมาณ ... ตัว ใช้วันที่ ...`),
            /* กล่องชวนขอราคา: LINE พิมพ์แม่แบบ 3 ข้อที่ต้องส่งไว้ให้กรอก (audit P5) · ไม่มีชื่อหรือเบอร์ลูกค้าใน URL */
            quoteLine: lineMessageUrl([`ขอราคา${item.name}`, ...(pp.quote.send || []).map((x) => `- ${x}: `)].join('\n')),
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
             แบบเสื้อ: แท็กการใช้งาน (use) หรือทรง (garment) · ผลงาน: works.use · ภาพลูกค้า: customers.cat */
          const PHOTO = { corp: 'corporate', edu: 'school', sport: 'sports', event: 'event' }
          /* บริษัท หน่วยงาน ร้านค้า: แบบโปโลขึ้นก่อน (agent ลูกค้า 22 ต.ค.: หน้าบริษัทเปิดมาเจอเสื้อฟุตบอล) */
          const POLO_FIRST = new Set(['corp', 'gov', 'shop'])
          const coded = designsFor(data.designs, id)
          const useDesigns = POLO_FIRST.has(id) ? [...coded.filter((d) => d.garment === 'polo'), ...coded.filter((d) => d.garment !== 'polo')] : coded
          /* แบบจากแกลเลอรีเดิมบนเว็บจริง (live-gallery.json) เติมให้ครบ 6 · ลิงก์ดูทั้งหมดไปหน้าแกลเลอรีของกลุ่ม */
          const live = (json('live-gallery.json').groups[id]?.items || []).map((x, i) => ({ img: x.img, square: true, alt: `แบบ${item.name}ที่ทีมดีออกแบบ ${i + 1} ด้านหน้าและด้านหลัง` }))
          /* งานที่ตรงหน้าย่อยกว่า (alsoUse เช่น แบดมินตัน วิ่ง คณะ) ขึ้นก่อนงานของกลุ่มหลัก */
          const useWorks = [...data.works.filter((w) => (w.alsoUse || []).includes(id)), ...data.works.filter((w) => w.use === id)].slice(0, 3)
          /* ภาพที่แยกกลุ่มย่อยแล้ว (customers.json uses · เช่น แบด วิ่ง หน่วยงาน คณะ) ขึ้นก่อน แล้วต่อด้วยหมวดใหญ่ */
          const cs = json('customers.json')
          const usePhotos = [...cs.filter((c) => (c.uses || []).includes(id)), ...(PHOTO[id] ? cs.filter((c) => c.cat === PHOTO[id] && !(c.uses || []).includes(id)) : [])].slice(0, 12)
          const has = (key) => { try { url(key); return true } catch { return false } }
          /* ภาพจริงของการ์ดบริบทงาน (ตามลำดับการ์ดใน use-pages.json · null = ยังไม่มีภาพ) · เลือกจากภาพลูกค้าบนเว็บจริงทีละรูป */
          const CTX = {
            corp: [['/img/customer/co03.webp', 'ทีมโรงพยาบาลใส่เสื้อโปโลที่ทีมดีทำ'], null, null],
            gov: [['/img/customer/co16.webp', 'เจ้าหน้าที่หน่วยงานรัฐใส่เสื้อที่ทีมดีทำ'], ['/img/customer/co17.webp', 'ทีมหน่วยทหารใส่เสื้อทีมกิจกรรมที่ทีมดีทำ'], ['/img/customer/ev13.webp', 'ทีมงานโครงการใส่เสื้อที่ทีมดีทำในวันงาน']],
          }
          const contextPhotos = (CTX[id] || []).map((x) => (x ? { img: x[0], alt: x[1] } : null))
          const up = useView(json('use-pages.json')[id], { designs: [...useDesigns, ...live].slice(0, 6), works: useWorks, photos: usePhotos, contextPhotos }, { forWp, has })
          /* ส่วน 06 เป็นใบราคาย่อ (audit use-02) · แถวตามการ์ดสินค้าของกลุ่ม ราคาจาก prices.json · สินค้าที่ยังไม่มีราคาเปิด LINE พร้อมข้อความตั้งต้น */
          const productName = (pid) => data.allProducts.find((x) => x.id === pid)?.name || ''
          /* hero (audit use-03): ราคาบรรทัดเดียวของสินค้าตัวแรกในใบราคาย่อที่มีตารางราคา · รูปจริงมีไฟล์ -320 คู่กัน */
          const P = json('prices.json')
          const firstPriced = up.products.cards.map((c) => c.to.split('.')[1]).find((pid) => priceLine(P, pid))
          up.hero.price = firstPriced ? { name: productName(firstPriced), line: priceLine(P, firstPriced), moq: `ขั้นต่ำ ${P.minQty} ตัว` } : null
          up.hero.srcset = srcsetOf(item.img, 320, 320, item.img?.startsWith('/img/real/') ? 760 : 640)
          up.products.quote = useQuote(json('prices.json'), up.products.cards, json('lead-times.json'), { askHref: (pid) => lineMessageUrl(`ขอราคา${productName(pid)} สำหรับ${item.shortName} จำนวนประมาณ ... ตัว`) })
          return {
            ...base,
            item,
            up,
            useDesignsAll: useDesigns.length + live.length,
            designsHref: url('galleries', id),
            cta: useCta(item, data.site, url('contact')),
            useLd: (() => { const s = faqSchema(up.faq.items); return s && ldJson(s) })(),
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
          const logos = lg.show && lg.approved ? readdirSync(resolve(root, 'public/img/client')).filter((f) => /\.(png|svg|webp)$/.test(f)).sort().map((f) => `/img/client/${f}`) : []
          const stats = wk.brands.stats.filter((x) => !forWp || !pending(x.n))
          const brands = { ...wk.brands, logos, stats, show: !forWp || logos.length > 0 || stats.length >= 2 }
          /* รูปงานจริงจาก works.json (r01–r09) ไม่มีเรื่องเล่าแล้ว (24 ต.ค.) → รวมเข้าภาพลูกค้า ใช้คำบรรยายตามที่เห็นในรูป
             รูปที่ยังไม่แน่ใจกลุ่ม (works.use ว่าง) ขึ้นที่หน้านี้กับกริดหน้าแรกเท่านั้น ไม่ไปอยู่หน้ากลุ่มลูกค้า */
          const workPhotos = data.works.map((w) => ({ imgSmall: w.img.replace(/\.(jpg|webp)$/, '-320.jpg'), catName: w.catName, alt: w.alt }))
          return { ...base, wk: { ...wk, brands, heroPhotos: mixed.slice(0, 6), photos: { ...wk.photos, items: [...workPhotos, ...mixed] }, contact: { ...wk.contact, links: wk.contact.links.filter((l) => has(l.to)) } } }
        }
        if (kind === 'galleries') {
          const dp = json('design-pages.json').groups[id]
          /* แบบในคลังเรา (มีรหัส) + แบบจากหน้าแกลเลอรีเดิมบนเว็บจริง (live-gallery.json · รูปสี่เหลี่ยมจัตุรัส ยังไม่ถอดรหัส) */
          const item = data.uses.find((x) => x.id === id)
          const live = (json('live-gallery.json').groups[id]?.items || []).map((x, i) => ({ img: x.img, square: true, alt: `แบบ${item.name}ที่ทีมดีออกแบบ ${i + 1} ด้านหน้าและด้านหลัง` }))
          return { ...base, item, dp, gallery: { items: [...designsFor(data.designs, id), ...live] } }
        }
        if (kind === 'designs') {
          const dp = json('design-pages.json').index
          const has = (key) => { try { url(key); return true } catch { return false } }
          const liveN = (g) => json('live-gallery.json').groups[g]?.items.length || 0
          return { ...base, dp: { ...dp, pills: dp.pills.filter((l) => has(l.to)).map((l) => ({ ...l, n: designsFor(data.designs, l.to.split('.')[1]).length + liveN(l.to.split('.')[1]) })) } }
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
            item: (() => { const g = guideView(data.allGuides.find((x) => x.id === id), json('guide-pages.json')[id], { forWp }); return { ...g, hasLinks: g.sections.some((s) => s.kind === 'links') } })(),
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
        /* {{{ph หัวข้อ}}} ห่อวลีไทยไม่ให้หักกลาง (src/js/phrases.js) */
        ph: (t) => phrases(t),
        /* ลิงก์แผนที่ · ช่องว่างและภาษาไทยใน query ต้อง encode */
        enc: (t) => encodeURIComponent(String(t ?? '')),
        /* {{#with (stat this.n)}} แยกตัวเลข/+/หน่วย ให้สถิติหน้าแรกวิ่งนับได้ (src/js/count-up.js) */
        stat: (t) => parseStat(t),
        /* {{url 'contact'}} · {{url 'products' this.id}} · {{url 'guides.size'}} — ลิงก์ภายในทุกตัวต้องผ่านตัวนี้ */
        url: (key, id) => url(key, typeof id === 'string' ? id : undefined),
      },
    }),
  ],
  define: { 'import.meta.env.TD_WP': JSON.stringify(forWp) },
  build: { outDir: resolve(root, forWp ? 'dist-wp' : 'dist'), emptyOutDir: true, rollupOptions: { input } },
})
