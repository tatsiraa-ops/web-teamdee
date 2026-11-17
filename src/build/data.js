/* ข้อมูลกลางทุกหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1b) · loadData() อ่าน src/data ทั้งหมด ประกอบเป็นข้อมูลที่เทมเพลตใช้ร่วมกัน (เมนู สินค้า กลุ่มลูกค้า หน้าแรก ฯลฯ) */
import { resolve } from 'node:path'
import { existsSync, readdirSync } from 'node:fs'
import { videosFor, videoView } from '../../src/js/video-view.js'
import { fillNudge } from '../../src/js/nudge.js'
import { workOf, WORK } from '../../src/js/design-filter.js'
import { buildRealGrid } from '../../src/js/real-grid.js'
import { lineMessageUrl } from '../../src/js/use-cta.js'
import { homeView } from '../../src/js/home-view.js'
import { blogView } from '../../src/js/blog-model.js'
import { calcPricing, calcKinds, calcHref, heroPrice, priceLine } from '../../src/js/prices.js'
import { root, forWp, json, reviewItems, tally, url } from './shared.js'

/* ชื่อสินค้า · การใช้งาน · สไตล์ ของแต่ละแบบ ใช้เป็นคำบรรยายในรูปใหญ่ตาม Wireframe
   เช่น "เสื้อพิมพ์ลาย · กีฬาและการแข่งขัน · ไล่เฉดสี" · ทุกจุดที่โชว์แบบเสื้อต้องผ่านตัวนี้ ไม่งั้นรูปใหญ่ไม่มีคำบรรยาย */
export const withMeta = () => {
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
export const loadData = () => ({
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
    { id: 'school50', label: 'โรงเรียน · ครบรอบ 50 ปี', alt: 'เสื้อโปโลพิมพ์ลายไล่สีฟ้าเหลือง งานครบรอบ 50 ปีของโรงเรียน' },
    { id: 'choomthong', label: 'ทีมขาย · องค์กร', alt: 'เสื้อโปโลพิมพ์ลายสีแดงขาว ลายภูเขา ของทีมตัวแทนขาย' },
    { id: 'ptk', label: 'ยูนิฟอร์มบริษัท', alt: 'เสื้อโปโลพิมพ์ลายสีขาวฟ้า ลายเครื่องมือช่างไฟ ของบริษัท PTK' },
    { id: 'watsadu', label: 'ทีมงาน · ร้านวัสดุ', alt: 'เสื้อโปโลพิมพ์ลายสีน้ำเงิน มีโลโก้สปอนเซอร์ ของร้านวัสดุก่อสร้าง' },
    { id: 'highvolt', label: 'ค่าย · กิจกรรม', alt: 'เสื้อโปโลพิมพ์ลายสีม่วง HIGHVOLT CAMP' },
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
    { id: 'jpark', alt: 'เสื้อวิ่งพิมพ์ลายสีฟ้า งานวิ่งการกุศล Jpark Charity Run 2025' },
    { id: 'red', alt: 'เสื้อกีฬาพิมพ์ลายสีแดง ทีม NOMKONZ' },
    { id: 'kongma', alt: 'เสื้อวิ่งพิมพ์ลายสีเหลืองลายเส้นฟ้า งาน KONG-MA RUN' },
    { id: 'navy', alt: 'เสื้อกีฬาพิมพ์ลายสีกรมท่า ทีม BADBUN' },
    { id: 'bpm', alt: 'เสื้อแบดมินตันพิมพ์ลายสีพาสเทล ชมรม 8PM' },
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
      /* 12 พ.ย. หน้าร้านค้า (อาร์ต "1-4 มาก่อน" ข้อ 2): กลุ่มที่รูป q3 ไม่พอ ใช้รูปที่กลุ่มหลัก (primary) เป็นกลุ่มนั้น คุณภาพ 2 ขึ้นไป · use-v2.json reviewWall.from = "primary" */
      primary: Object.fromEntries(ids.map((id) => [id, mix(lib.filter((x) => x.kind === 'customer' && x.q >= 2 && x.w && x.h && (x.alt || x.occ) && (x.primary || []).includes(id)).sort((a, b) => b.q - a.q || a.path.localeCompare(b.path))).slice(0, 30).map(view)])),
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
