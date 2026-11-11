/* แปลงหน้ากลุ่มลูกค้า 10 หน้า + แกลเลอรีแบบเสื้อ 11 หน้า + หน้ารีวิว จาก Wireframe v22 → src/data/{use-pages,design-pages,works-page}.json
   รัน: node scripts/v22/extract-pages.mjs แล้ว node scripts/v22/use-pages.mjs · ผลลัพธ์แก้มือต่อได้ แต่รันใหม่จะทับ
   กติกาเดียวกับ product-pages.mjs: คำสัญญาที่ต้องยืนยัน → [รอยืนยัน: …] (claims.mjs) · โน้ตของ wireframe และรหัส WF ตัดทิ้ง
   ลิงก์ #hash → key ใน routes.json · หน้าที่ยังไม่มี vite กรองทิ้งตอน build */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { claim, STATS } from './claims.mjs'
import { PAIN_H, applyFaq, fixRow } from './copy-fixes.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const read = (n) => JSON.parse(readFileSync(join(root, `docs/spec/teamdee-v22/extracted/${n}.json`), 'utf8'))

/* รหัสหน้า v22 → id ใน routes.json (uses.*) */
const USE = { business: 'corp', shop: 'shop', organization: 'gov', education: 'edu', class: 'class', faculty: 'faculty', sport: 'sport', badminton: 'badminton', running: 'running', activity: 'event' }
const LINK = {
  ...Object.fromEntries(Object.entries(USE).map(([w, id]) => [w, `uses.${id}`])),
  polo: 'products.polo', printed: 'products.print', screen: 'products.screen', warmup: 'products.warmup',
  baseball: 'products.baseball', oversize: 'products.jersey', works: 'projects', designs: 'designs', contact: 'contact', about: 'about',
  'guide-size': 'guides.size', 'guide-fabric': 'guides.fabric', 'guide-embroider': 'guides.polo', 'guide-print': 'guides.print',
  'guide-screen': 'guides.screen', 'guide-delivery': 'guides.delivery', 'guide-files': 'guides.logo',
  article: 'posts.polo', 'article-fabric': 'posts.fabric', 'article-design': 'posts.design', 'article-checklist': 'posts.checklist',
  ...Object.fromEntries(Object.entries(USE).map(([w, id]) => [`designs-${w}`, `galleries.${id}`])),
}
const DROP = [/Wireframe/, /รหัส WF/, /WF-[A-Z]\d/, /บนมือถือเลื่อน/]

const clean = (s) => claim(String(s || '').replace(/\s*(?:→\s*)?↗\s*$/, '').replace(/\s+/g, ' ').trim())
const keep = (s) => s && !DROP.some((re) => re.test(s))
const texts = (a) => (a || []).map(clean).filter(keep)
const to = (href) => LINK[String(href || '').replace(/^#/, '').split('/')[0]] || null
const links = (s) => (s?.links || []).filter((l) => to(l.href)).map((l) => ({ t: clean(l.t), to: to(l.href) }))
const cards = (s) => (s?.cards || []).filter((c) => c.h && keep(c.h)).map((c) => ({ h: clean(c.h), p: texts(c.p), img: c.ph ? clean(c.ph.t) : null }))
const cta = (s) => clean((s?.links || []).find((l) => !l.href)?.t)
/* ปุ่มที่ v22 ส่งเรื่องให้ทีมขาย (data-brief) · ของเราเปิด LINE พร้อมข้อความนี้ (vite.config.js) */
const briefs = (s) => (s?.links || []).filter((l) => l.brief).map((l) => ({ t: clean(l.t), brief: clean(l.brief) }))
const empty = { intro: [], hints: [], cards: [], lists: [], tables: [], faq: [], links: [], payment: [], split: [] }
const sections = (p, extra = {}) => Object.fromEntries(p.sections.map((s) => [extra[s.key] || (/^n\d+$/.test(s.key) ? 'related' : s.key), s]))

/* ตัวเลขทีมดี (STATS) ย้ายไป claims.mjs ใช้ร่วมกับหน้าสินค้า (24 ต.ค.) */

/* ขั้นตอน 01–03: ใน v22 หน้า 9 กลุ่ม (ยกเว้นบริษัท) เอารายการ "เตรียมข้อมูล" มาวางเป็นคำอธิบายขั้นตอน อ่านไม่รู้เรื่อง
   (agent ลูกค้า 22 ต.ค.) → เก็บหัวข้อขั้นตอนของ v22 แต่ใช้คำอธิบายกลางที่เป็นข้อเท็จจริงยืนยันแล้ว (Brand Strategy v2) เฉพาะขั้นที่ซ้ำ */
const STEP_P = [
  'เล่างานและจำนวนคร่าว ๆ ทีมดีช่วยเลือกประเภทเสื้อ ผ้า และแจ้งราคา',
  'ดูแบบและปรับได้ไม่จำกัดจนพอใจ แล้วยืนยันแบบ ไซซ์ และจำนวนก่อนผลิต',
  'อัปเดตทุกขั้นตอนหลักระหว่างผลิต ส่งถึงมือ และแจ้งเคลมได้ภายใน 7 วันหลังรับสินค้า',
]
/* ขั้นตอน 1–2 ของหน้าคำค้น /custom-* เขียนตามงานของกลุ่มนั้น (audit 26 ต.ค.: ข้อความซ้ำคำต่อคำ 9–10 หน้า · เสี่ยงเนื้อหาซ้ำ)
   ไม่มีคำสัญญาใหม่ · ขั้นตอน 3 (ผลิต อัปเดต เคลม 7 วัน) ใช้ร่วมกันเพราะเป็นเงื่อนไขชุดเดียว */
const STEP_FOR = {
  badminton: ['เล่าว่าเป็นก๊วนหรือทีมแข่ง และจำนวนคนคร่าว ๆ ทีมดีช่วยเลือกแบบ ผ้าสำหรับเสื้อแบด และแจ้งราคา', 'รวมชื่อ เบอร์ และไซซ์ของสมาชิก ดูแบบและปรับได้ไม่จำกัด แล้วยืนยันก่อนผลิต'],
  class: ['บอกรุ่นหรือห้อง วันที่จะใส่ และจำนวนนักเรียนคร่าว ๆ ทีมดีช่วยเลือกแบบ ผ้า และแจ้งราคาต่อตัว', 'ให้ตัวแทนรุ่นรวมไซซ์ด้วยแม่แบบตาราง ดูแบบและปรับได้ไม่จำกัด แล้วยืนยันก่อนผลิต'],
  faculty: ['บอกคณะหรือสาขา โอกาสที่ใส่ และจำนวนคร่าว ๆ ทีมดีช่วยเลือกแบบ ผ้า และแจ้งราคา', 'ส่งแบบให้อาจารย์หรือสโมสรอนุมัติ ปรับได้ไม่จำกัด แล้วยืนยันไซซ์และจำนวนก่อนผลิต'],
  running: ['บอกชื่องานวิ่ง วันงาน และจำนวนนักวิ่งหรือสตาฟคร่าว ๆ ทีมดีช่วยเลือกแบบ ผ้า และแจ้งราคา', 'ดูแบบพร้อมโลโก้สปอนเซอร์ ปรับได้ไม่จำกัด แล้วยืนยันไซซ์แยกตามรายการก่อนผลิต'],
  shop: ['บอกประเภทร้าน จำนวนพนักงาน และตำแหน่งโลโก้ที่อยากได้ ทีมดีช่วยเลือกทรง ผ้า และแจ้งราคา', 'ดูแบบพร้อมโลโก้ร้าน ปรับได้ไม่จำกัด แล้วยืนยันไซซ์ของพนักงานแต่ละคนก่อนผลิต'],
  gov: ['แจ้งชื่อหน่วยงาน จำนวน และเอกสารที่ต้องใช้จัดซื้อ ทีมดีช่วยเลือกทรง ผ้า และทำใบเสนอราคา', 'ส่งแบบและใบเสนอราคาให้ผู้อนุมัติ ปรับได้ไม่จำกัด แล้วยืนยันไซซ์และจำนวนก่อนผลิต'],
}
/* ย่อหน้าทีมและราคาแยกตามงานของกลุ่ม (เก็บงานค้าง 26 ต.ค.: เดิมคำต่อคำเหมือนกัน 9 หน้า) · ไม่มีคำสัญญาใหม่ · ปี 2018 จาก site.json foundedYear */
const TEAM_FOR = {
  corp: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ ตำแหน่งโลโก้บริษัท และไซซ์พนักงานก่อนสั่งผลิต',
  shop: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ โลโก้ร้าน และไซซ์พนักงานแต่ละคนก่อนสั่งผลิต',
  gov: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ ตราหน่วยงาน และเอกสารจัดซื้อก่อนสั่งผลิต',
  edu: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ ตราโรงเรียน สีคณะสี และไซซ์ทีละห้องก่อนสั่งผลิต',
  class: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ ชื่อรุ่น และตารางไซซ์ที่ตัวแทนรุ่นรวบรวมก่อนสั่งผลิต',
  faculty: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ สีคณะ และตรามหาวิทยาลัยก่อนส่งให้ผู้อนุมัติ',
  sport: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ ชื่อ เบอร์ และไซซ์นักกีฬาทีละคนก่อนสั่งผลิต',
  badminton: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ ชื่อก๊วน และไซซ์สมาชิกก่อนสั่งผลิต',
  running: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ โลโก้สปอนเซอร์ และจำนวนแยกไซซ์ก่อนสั่งผลิต',
  event: 'จากงานเสื้อทีมในปี 2018 สู่ทีมที่ช่วยตรวจแบบ ธีมงาน และจำนวนแยกไซซ์ให้ทันวันงาน',
}
const PRICE_FOR = {
  corp: 'ราคาเสื้อบริษัทขึ้นกับประเภทเสื้อ (โปโลปักหรือเสื้อพิมพ์ลาย) ผ้า ทรง จำนวน และขนาดโลโก้',
  shop: 'ราคาเสื้อพนักงานร้านขึ้นกับประเภทเสื้อ ผ้า ทรง จำนวนพนักงาน และตำแหน่งโลโก้ร้าน',
  gov: 'ราคาเสื้อหน่วยงานขึ้นกับประเภทเสื้อ ผ้า ทรง จำนวน และรายละเอียดตราหน่วยงาน',
  edu: 'ราคาเสื้อโรงเรียนขึ้นกับประเภทเสื้อ ผ้า ทรง จำนวนทั้งโรงเรียน และจำนวนสีของคณะสี',
  class: 'ราคาเสื้อรุ่นขึ้นกับประเภทเสื้อ ผ้า ทรง จำนวนคนในรุ่น และรายละเอียดลาย',
  faculty: 'ราคาเสื้อคณะขึ้นกับประเภทเสื้อ ผ้า ทรง จำนวน และรายละเอียดตราคณะหรือมหาวิทยาลัย',
  sport: 'ราคาเสื้อกีฬาขึ้นกับผ้า ทรง จำนวน และการพิมพ์ชื่อกับเบอร์แยกรายคน',
  badminton: 'ราคาเสื้อแบดขึ้นกับผ้า ทรง จำนวนสมาชิก และการพิมพ์ชื่อหรือโลโก้ก๊วน',
  running: 'ราคาเสื้องานวิ่งขึ้นกับผ้า ทรง จำนวนนักวิ่งและสตาฟ และจำนวนโลโก้สปอนเซอร์',
  event: 'ราคาเสื้ออีเวนต์ขึ้นกับประเภทเสื้อ ผ้า ทรง จำนวน และจำนวนโลโก้สปอนเซอร์',
}
const steps = (plan, id) => {
  const need = (plan.lists[0]?.items || []).map(clean)
  return plan.cards.filter((c) => c.h).map((c, i) => {
    const p = clean(texts(c.p)[0] || '')
    const dup = need.some((n) => n && p.includes(n))
    return { h: clean(c.h), p: STEP_FOR[id]?.[i] || (dup ? STEP_P[i] || p : p) }
  })
}

/* เอกสารและการชำระเงิน: v22 รวมทุกอย่างไว้ประโยคเดียวที่มี [รอยืนยัน] → เว็บจริงตัดทิ้งทั้งบรรทัด หน้าหน่วยงานเลยไม่เหลือเรื่องเอกสารเลย
   (agent ลูกค้า 22 ต.ค.) → แยกบรรทัด ข้อที่ยืนยันแล้วอยู่ต่อ · รายการเอกสารตรงกับช่อง "เอกสารที่ต้องการ" ในฟอร์มติดต่อ */
/* กลุ่มที่ต้องมีเอกสารจัดซื้อ · กลุ่มอื่นไม่ต้องเห็นหนังสือรับรองบริษัท ภ.พ.20 (ตรงกับ QUOTE_FIRST ใน src/js/use-cta.js) */
const DOC_GROUPS = new Set(['corp', 'shop', 'gov', 'edu', 'faculty'])
const PAYMENT_P = [
  'ออกใบเสร็จ / ใบกำกับภาษีได้',
  'ขอเอกสารจัดซื้อได้ ใบเสนอราคา ใบกำกับภาษีเต็มรูป หนังสือรับรองบริษัท ภ.พ.20 ใบส่งของ',
  /* มัดจำ 50% ยืนยันแล้ว 23 ต.ค. · หน้าแรกกับ /faq/ บอกแล้ว หน้ากลุ่มต้องบอกเหมือนกัน (audit 26 ต.ค. H3) */
  'มัดจำ 50% ก่อนเริ่มผลิต ชำระส่วนที่เหลือก่อนจัดส่ง',
  'วางบิลได้ตามเงื่อนไขที่ตกลงก่อนสั่ง · รับบัตรเครดิต Visa / Mastercard',
]

/* FAQ: แก้คำตอบที่ปฏิเสธลอย ๆ ("ไม่ยืนยัน… โดยอัตโนมัติ") ให้บอกสิ่งที่ทำได้ก่อน · ตัดข้อที่ถามซ้ำ · เพิ่มเรื่องไม่ทันวันงาน (agent ลูกค้า 22 ต.ค.) */
const LATE = ['ถ้าผลิตไม่ทันวันงาน จะรู้ตอนไหน?', 'รู้ตั้งแต่ตอนคุยครั้งแรก ทีมดีตรวจคิวผลิตและขนส่งจากวันที่ต้องใช้เสื้อก่อนรับงาน ถ้าไม่ทันจะบอกตรง ๆ ไม่รับปากไว้ก่อน']
const FAQ_FIX = {
  gov: {
    answer: { 'รองรับเงื่อนไขจัดซื้อของหน่วยงานไหม?': 'ได้ ทีมดีออกใบเสนอราคา ใบกำกับภาษี และเอกสารประกอบการจัดซื้อให้ ส่วนเครดิตหรือวิธีเบิกจ่ายเฉพาะของหน่วยงาน ส่งเงื่อนไขมาให้ทีมดีตรวจและตกลงกันก่อนสั่ง' },
    drop: ['รับประกันกำหนดเบิกจ่ายหรือเครดิตทุกหน่วยงานไหม?'],
  },
  running: {
    answer: { 'มีทรงแขนกุดหรือแบบอื่นให้เลือกไหม?': 'ส่งทรงที่ต้องการมาได้ ทีมดีตรวจแบบและผ้าที่ทำทรงนั้นได้ แล้วแจ้งราคาให้' },
    add: [LATE],
  },
  event: {
    answer: { 'งานด่วนรับได้ไหม ต้องแจ้งอะไรบ้าง?': 'แจ้งประเภทเสื้อ จำนวน วันที่ต้องได้รับเสื้อ และสถานะไฟล์หรือแบบ ทีมดีตรวจคิวผลิตและขนส่ง แล้วแจ้งวันปิดแบบและวันรับเสื้อที่ทำได้จริง' },
    add: [LATE],
  },
}
const faqItems = (id, items) => {
  const fx = FAQ_FIX[id] || {}
  const kept = items.filter(([q]) => !(fx.drop || []).includes(q)).map(([q, a]) => [q, fx.answer?.[q] || a])
  return [...kept, ...(fx.add || [])]
}

/* hero: v22 มีแต่ "ช่วยเลือกแบบ / ตรวจรายการ" ไม่บอกจุดขาย (agent ลูกค้า 22 ต.ค.) → ใส่ข้อที่ยืนยันแล้ว (faq.json: ออกแบบฟรี ขั้นต่ำ 10 ตัว ชื่อ-เบอร์รายคนในงานพิมพ์)
   เก็บของ v22 ไว้เฉพาะเรื่องวันรับ การชำระ (บริษัท · ยืนยันแล้ว 30 ต.ค.) และข้อที่ยังรอยืนยัน (เว็บจริงตัดเอง) */
const PRINT_GROUPS = new Set(['sport', 'badminton', 'running', 'event', 'class'])
const heroFacts = (id, facts) => [
  'ออกแบบฟรี ปรับได้ไม่จำกัด',
  'ขั้นต่ำ 10 ตัว',
  PRINT_GROUPS.has(id) ? 'ใส่ชื่อ-เบอร์รายคนได้' : 'ออกใบเสร็จ / ใบกำกับภาษีได้',
  /* วันรับ: เอาแค่ตัวแรก ("วางวันรับตามวันแจกเสื้อ / วันรับอุปกรณ์ / …" ยาวจนป้ายตัดสองบรรทัดบนมือถือ) */
  ...facts.filter((f) => /^วางวันรับ|^รับบัตรเครดิต|\[รอยืนยัน/.test(f)).map((f) => (f.startsWith('วางวันรับ') ? f.split(' / ')[0] : f)),
]

/* H2: v22 ใส่ชื่อเต็ม "เสื้อแบดมินตัน / เสื้อแบด / เสื้อก๊วนแบด" ทุกหัวข้อ อ่านยาวและซ้ำ (agent ลูกค้า 22 ต.ค.)
   → เก็บชื่อเต็มไว้ที่หัวข้อแบบเสื้อกับ FAQ (คำค้นยังอยู่) ที่เหลือใช้ชื่อแรก */
const siteUses = JSON.parse(readFileSync(join(root, 'src/data/uses.json'), 'utf8'))
const KEEP_FULL = new Set(['designs', 'faq'])
const shortenH2 = (id, page) => {
  const full = siteUses.find((u) => u.id === id)?.name || ''
  if (!full.includes(' / ')) return page
  const first = full.split(' / ')[0]
  for (const [k, x] of Object.entries(page)) if (x && typeof x.h === 'string' && !KEEP_FULL.has(k)) x.h = x.h.replace(full, first).replace(/\s{2,}/g, ' ')
  /* ปุ่มปิดท้ายใช้ชื่อแรก (ชื่อเต็มล้นปุ่มบนมือถือ) */
  page.team.ask.t = page.team.ask.t.replace(full, first)
  return page
}

/* ย่อหน้าแบบเสื้อของบริษัท/ร้านค้ามีงานปักด้วย (เดิมแก้ใน use-pages.json ตรงๆ · ย้ายมาไว้ที่นี่ 30 ต.ค.) */
const DESIGNS_INTRO = {
  corp: 'ดูแนวโปโลปักและเสื้อพิมพ์ลาย แล้วเลือกสีและตำแหน่งโลโก้ให้เข้ากับองค์กร',
  shop: 'ดูแนวเสื้อพนักงานร้านค้า ทั้งงานปักและพิมพ์ลาย ใช้รหัสแบบคุยต่อเรื่องสี โลโก้ และข้อความ',
}

/* ลำดับส่วนตาม v22 ทุกส่วน (อาร์ตเคาะ 2 พ.ย. 2026 · ยกเลิก "หลักฐานขึ้นครึ่งบน" ของ audit use-04 / 24 ต.ค. ข้อ 5)
   สารบัญเรียงตามลำดับส่วนจริงบนหน้า (hero.toc ของ v22 สลับ "ภาพลูกค้า" ไว้ก่อน "วางงบ" ไม่ตรงกับส่วนของ v22 เอง) · ลำดับใน usePage.hbs ต้องตรงกัน (tests/v22-structure.test.js) */
const ORDER = ['designs', 'products', 'work', 'reviews', 'plan', 'photos', 'faq']
const uses = read('uses')
const out = { _note: 'สร้างจาก Wireframe v22 ด้วย scripts/v22/use-pages.mjs (22 ต.ค. 2026) · [วงเล็บ] = รอข้อมูลจริง เว็บจริงซ่อนให้อัตโนมัติ' }
for (const [wid, id] of Object.entries(USE)) {
  const p = uses[wid]
  const sec = sections(p)
  const g = (k) => sec[k] || empty
  const plan = g('plan')
  /* กล่องงบ: บริษัทใช้หัวข้อ "ราคาขึ้นกับอะไร?" อีก 9 หน้าใช้ "ประเมินงบและวันรับ" */
  const priceSplit = plan.split.find((x) => /^ราคา|^ประเมินงบ/.test(x.h))
  const team = g('team').split[0] || { h: '', p: [] }
  out[id] = {
    hero: { kicker: clean(p.hero.kicker), h1: clean(p.hero.h1), lead: clean(p.hero.lead), cta: clean(p.hero.buttons[0]), cta2: clean(p.hero.buttons[1]), facts: heroFacts(id, texts(p.hero.facts)), imgNote: p.hero.ph ? clean(p.hero.ph.t) : '' },
    toc: p.hero.toc.map((t) => ({ t: clean(t.t), key: t.key === 'customer-photos' ? 'photos' : t.key })).sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key)),
    trust: { h: clean(g('trust').h), stats: STATS, note: texts(g('trust').hints)[0] || '' },
    pain: { h: clean(g('pain').h), intro: texts(g('pain').intro), cards: cards(g('pain')) },
    contexts: sec.contexts ? { h: clean(g('contexts').h), cards: cards(g('contexts')), links: links(g('contexts')), ask: briefs(g('contexts'))[0] || null } : null,
    designs: { h: clean(g('designs').h), intro: DESIGNS_INTRO[id] ? [DESIGNS_INTRO[id]] : texts(g('designs').intro) },
    products: { h: clean(g('products').h), cards: g('products').cards.filter((c) => c.h).map((c, i) => ({ h: clean(c.h), p: texts(c.p), to: links(g('products'))[i]?.to || null })), links: links(g('products')).slice(g('products').cards.filter((c) => c.h).length) },
    help: { h: clean(g('help').h), p: texts(g('help').intro)[0] || '', cta: cta(g('help')) },
    work: { h: clean(g('work').h) },
    reviews: { h: clean(g('reviews').h) },
    benefits: { h: clean(g('benefits').h), cards: cards(g('benefits')) },
    plan: {
      h: clean(plan.h),
      need: plan.lists[0] ? { h: clean(plan.lists[0].h), items: texts(plan.lists[0].items) } : null,
      price: priceSplit ? { h: clean(priceSplit.h), p: (([first, ...rest]) => [PRICE_FOR[id] || first, ...rest])(texts(priceSplit.p)) } : null,
      steps: steps(plan, id),
      payment: plan.payment[0] ? { h: clean(plan.payment[0].h), p: DOC_GROUPS.has(id) ? PAYMENT_P : PAYMENT_P.filter((t) => !t.startsWith('ขอเอกสารจัดซื้อ')) } : null,
      links: links(plan), cta: cta(plan), asks: briefs(plan),
    },
    photos: { h: clean(g('photos').h), intro: texts(g('photos').intro)[0] || '', ask: briefs(g('photos'))[0] || null, links: links(g('photos')) },
    schedule: { h: clean(g('schedule').h), p: texts(g('schedule').intro)[0] || '', cta: cta(g('schedule')) },
    faq: { h: clean(g('faq').h), items: faqItems(id, g('faq').faq.map((f) => [clean(f.q), clean(f.a)])) },
    team: { h: clean(g('team').h), title: clean(team.h), p: [TEAM_FOR[id] || texts(team.p)[0]] /* 2 พ.ย.: ย่อหน้า LINE·เวลา และเคลม 7 วัน ย้ายไปการ์ดติดต่อที่ดึง site.json (เวลาเคยขึ้นซ้ำ 2 รูปแบบ) */, links: links(g('team')), ask: briefs(g('team'))[0], place: { t: clean(g('team').links.find((l) => l.href === '#home/teamdee-location').t), to: 'contact#location' } },
    related: sec.related ? { h: clean(sec.related.h), links: links(sec.related) } : null,
  }
}
for (const id of Object.keys(out)) if (id[0] !== '_') shortenH2(id, out[id])
/* เขียนใหม่หลังตรวจ 2 พ.ย. (scripts/v22/copy-fixes.mjs) */
for (const [id, u] of Object.entries(out)) {
  if (id[0] === '_') continue
  u.trust.note = ''
  /* ส่วนนี้มีใบราคาย่อ · สารบัญบอกตรงๆ ว่าราคาอยู่ตรงนี้ (ตรวจ UI 2 พ.ย.) */
  for (const t of u.toc) if (t.key === 'products') t.t = 'ราคา'
  if (PAIN_H[id]) u.pain.h = PAIN_H[id]
  for (const c of u.products.cards) c.p = c.p.map(fixRow)
  u.faq.items = applyFaq(u.faq.items)
}
writeFileSync(join(root, 'src/data/use-pages.json'), JSON.stringify(out, null, 2) + '\n')
console.log('use-pages.json:', Object.keys(out).filter((k) => k[0] !== '_').join(', '))

/* แกลเลอรีแบบเสื้อ: หน้ารวม /designs/ + รายกลุ่ม 10 หน้า · กริดแบบใช้แบบจริงรหัส TD (vite) ไม่ใช้รหัส WF */
/* ข้อความที่อาร์ตเคาะแทนของ v22 (26 ต.ค. 2026) · แก้ที่นี่ ไม่แก้ design-pages.json ตรงๆ (สคริปต์นี้เขียนทับทุกครั้ง)
   หน้า /designs/: ชื่อหน้า "แบบเสื้อ" (คำค้นใน seo-keywords.json) · หัวข้อตัวกรอง "ค้นหาและกรองแบบเสื้อ" (ยกเว้นใน v22-structure) · ย่อหน้าแรกมีคำค้น
   แกลเลอรี 10 หน้า: ย่อหน้าแรก + คำอธิบายหน้า แยกตามกลุ่ม (เดิมแม่แบบเดียวกัน) */
const INDEX_FIX = {
  h1: 'แบบเสื้อ',
  lead: 'แบบเสื้อทีมที่ทีมดีออกแบบไว้ เลือกดูตามกลุ่มลูกค้า หรือกรองตามงาน ทรงเสื้อ สไตล์ และสี ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับโลโก้ ข้อความ และสีให้เป็นของทีมคุณ',
  pillsH: 'ค้นหาและกรองแบบเสื้อ',
}
const GAL_COPY = {
  corp: { h1: 'แบบเสื้อบริษัท ปักและพิมพ์ลาย', lead: 'แบบเสื้อปักและพิมพ์ลายสำหรับพนักงานและงานบริษัท ดูแนวสีและการวางโลโก้ที่ใช้ได้ทั้งงานประจำและงานกิจกรรม ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับโลโก้และสีให้เป็นของบริษัทคุณ', desc: 'รวมแบบเสื้อบริษัทปักและพิมพ์ลายที่ทีมดีออกแบบ ดูแนวสีและการวางโลโก้สำหรับพนักงาน เลือกแบบที่ชอบแล้วส่งภาพหรือรหัสทาง LINE ขอราคาได้' },
  shop: { h1: 'แบบเสื้อพนักงานร้านค้า ปักและพิมพ์ลาย', lead: 'แบบเสื้อปักและพิมพ์ลายสำหรับพนักงานร้านค้าและหน้าร้าน ดูแนวที่ใส่โลโก้ร้านให้ลูกค้าจำได้ ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับให้เข้ากับสีของร้าน', desc: 'แบบเสื้อพนักงานร้านค้าปักและพิมพ์ลาย ใส่โลโก้ร้านให้ลูกค้าจำได้ เลือกแนวที่ชอบแล้วส่งรหัสให้ทีมดีปรับสีตามร้านของคุณ' },
  gov: { lead: 'แบบเสื้อพิมพ์ลายสำหรับหน่วยงานและงานราชการ ดูแนวที่วางตราหน่วยงานและข้อความได้ชัด ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย พร้อมขอใบเสนอราคาสำหรับงานจัดซื้อ', desc: 'แบบเสื้อหน่วยงานพิมพ์ลาย วางตราหน่วยงานและข้อความให้ชัด ส่งรหัสแบบที่ชอบมาคุย พร้อมขอใบเสนอราคาสำหรับงานจัดซื้อกับทีมดี' },
  edu: { lead: 'แบบเสื้อพิมพ์ลายสำหรับโรงเรียนและงานกีฬาสี ดูแนวสีประจำคณะสีหรือระดับชั้น ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับตราโรงเรียนและสีตามคณะสีให้', desc: 'แบบเสื้อโรงเรียนและเสื้อกีฬาสีพิมพ์ลาย ดูแนวสีตามคณะสีหรือระดับชั้น ส่งรหัสแบบที่ชอบให้ทีมดีปรับตราโรงเรียนและสี' },
  class: { lead: 'แบบเสื้อพิมพ์ลายสำหรับเสื้อรุ่นและเสื้อชมรม ดูแนวที่ใส่ชื่อรุ่น ปีการศึกษา หรือโลโก้ชมรม ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับให้เป็นของรุ่นคุณ', desc: 'แบบเสื้อรุ่นและเสื้อชมรมพิมพ์ลาย ใส่ชื่อรุ่น ปีการศึกษา หรือโลโก้ชมรม ส่งรหัสแบบที่ชอบให้ทีมดีปรับเป็นของรุ่นคุณ' },
  faculty: { lead: 'แบบเสื้อพิมพ์ลายสำหรับคณะและมหาวิทยาลัย ดูแนวสีประจำคณะและการวางตรามหาวิทยาลัย ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับให้เข้ากับสีคณะ', desc: 'แบบเสื้อคณะและเสื้อมหาวิทยาลัยพิมพ์ลาย ดูแนวสีประจำคณะและตรามหาวิทยาลัย ส่งรหัสแบบที่ชอบให้ทีมดีปรับตามสีคณะ' },
  sport: { lead: 'แบบเสื้อกีฬาพิมพ์ลายสำหรับทีมที่ลงสนามจริง ดูแนวลายทั้งตัว ชื่อและเบอร์บนเสื้อ ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับโลโก้และสีให้เป็นของทีมคุณ', desc: 'รวมแบบเสื้อกีฬาพิมพ์ลายทั้งตัวที่ทีมดีออกแบบ ดูแนวลาย ชื่อ และเบอร์บนเสื้อ ส่งรหัสแบบที่ชอบทาง LINE ขอราคาได้' },
  badminton: { lead: 'แบบเสื้อแบดมินตันพิมพ์ลายสำหรับก๊วนแบดและทีมองค์กร ดูแนวลายทั้งตัวที่ใส่ชื่อก๊วนและโลโก้ได้ ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับให้เป็นของก๊วนคุณ', desc: 'แบบเสื้อแบดมินตันพิมพ์ลายสำหรับก๊วนแบดและทีมองค์กร ใส่ชื่อก๊วนและโลโก้ได้ ส่งรหัสแบบที่ชอบให้ทีมดีปรับให้' },
  running: { lead: 'แบบเสื้อวิ่งพิมพ์ลายสำหรับงานวิ่งและชมรมวิ่ง ดูแนวที่วางชื่องาน โลโก้ผู้จัด และสปอนเซอร์ ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับให้เป็นของงานคุณ', desc: 'แบบเสื้อวิ่งและเสื้องานวิ่งพิมพ์ลาย วางชื่องาน โลโก้ผู้จัด และสปอนเซอร์ ส่งรหัสแบบที่ชอบให้ทีมดีปรับเป็นของงานคุณ' },
  event: { lead: 'แบบเสื้อพิมพ์ลายสำหรับอีเวนต์ กิจกรรม และ Outing ดูแนวสีตามธีมงานและการวางโลโก้สปอนเซอร์ ชอบแบบไหนส่งรหัส TD หรือแนบภาพมาคุย ทีมดีปรับให้เข้ากับธีมงานคุณ', desc: 'แบบเสื้ออีเวนต์ เสื้อกิจกรรม และเสื้อ Outing พิมพ์ลาย ดูแนวสีตามธีมงานและโลโก้สปอนเซอร์ ส่งรหัสแบบที่ชอบให้ทีมดีปรับให้' },
}
/* หัวข้องานจริงท้ายกริด (คลังรูปกลาง 30 ต.ค.) · ภาพลูกค้ากลุ่มนี้จาก customers.json / works.json ไม่ใช่แบบที่มีรหัส */
const REAL_COPY = {
  realH: 'งานจริงของลูกค้ากลุ่มนี้',
  realP: 'ภาพลูกค้าใส่เสื้อที่ทีมดีผลิตในงานจริง ใช้ดูสี ทรง และบรรยากาศการใส่ ภาพเหล่านี้ไม่มีรหัสแบบ ชอบภาพไหนกด "เลือก" ใต้ภาพ เลือกได้หลายภาพแล้วส่งทาง LINE ครั้งเดียว',
}
const des = read('designs')
const sec3 = (p) => p.sections
const gal = { _note: 'สร้างจาก Wireframe v22 ด้วย scripts/v22/use-pages.mjs · กริดแบบเติมจาก designs.json ตอน build', groups: {} }
const di = des.designs
gal.index = {
  kicker: clean(di.hero.kicker), h1: clean(di.hero.h1), lead: clean(di.hero.lead),
  pillsH: clean(sec3(di)[0].h), pills: links(sec3(di)[0]), filterH: clean(sec3(di)[1].h),
  cta: { h: clean(sec3(di)[2].h), p: texts(sec3(di)[2].intro)[0] || '' },
  ...INDEX_FIX,
}
for (const [wid, id] of Object.entries(USE)) {
  const p = des[`designs-${wid}`]
  const [grid, check, ctaSec] = sec3(p)
  gal.groups[id] = {
    kicker: clean(p.hero.kicker), h1: clean(p.hero.h1), lead: clean(p.hero.lead), back: clean(p.hero.buttons[0]),
    gridH: clean(grid.h), checkH: clean(check.h), check: texts(check.lists[0]?.items), cta: { h: clean(ctaSec.h), p: texts(ctaSec.intro)[0] || '' },
    ...GAL_COPY[id], ...REAL_COPY,
  }
}
writeFileSync(join(root, 'src/data/design-pages.json'), JSON.stringify(gal, null, 2) + '\n')
console.log('design-pages.json: index +', Object.keys(gal.groups).join(', '))

/* หน้ารีวิว /project/ หน้าเดียว (v22: ไม่มีตัวกรอง ไม่มีหน้ารายกลุ่ม) · เรื่องราวใช้ works.json · ภาพลูกค้าใช้ customers.json */
const wk = read('works').works
const ws = Object.fromEntries(wk.sections.map((s) => [s.key, s]))
const works = {
  _note: 'สร้างจาก Wireframe v22 ด้วย scripts/v22/use-pages.mjs · เรื่องราวและภาพลูกค้าเติมจากข้อมูลจริงตอน build',
  hero: { kicker: clean(wk.hero.kicker), h1: clean(wk.hero.h1), lead: clean(wk.hero.lead), cta: clean(wk.hero.buttons[0]), cta2: clean(wk.hero.buttons[1]) },
  brands: { h: clean(ws.brands.h), p: texts(ws.brands.intro)[0] || '', stats: STATS },
  reviews: { h: clean(ws.reviews.h) },
  videos: { h: clean(ws.videos.h) },
  work: { h: clean(ws.work.h) },
  photos: { h: clean(ws.photos.h), p: texts(ws.photos.intro)[0] || '' },
  contact: { h: clean(ws.contact.h), p: texts(ws.contact.intro)[0] || '', cta: cta(ws.contact), links: links(ws.contact).filter((l) => l.to.startsWith('products.')) },
}
writeFileSync(join(root, 'src/data/works-page.json'), JSON.stringify(works, null, 2) + '\n')
console.log('works-page.json: ok')

/* บทความใหม่ 4 เรื่อง (v22 · ร่าง) · ใช้หัวข้อและย่อหน้าร่างของ v22 แล้วต่อด้วยบทความเดิมในต้นแบบที่เรื่องตรงกัน (base)
   ตั้ง noindex จนกว่าจะมีผู้ตรวจ (START-HERE v22: ไม่เผยแพร่หน้าร่างเป็นหน้า SEO) */
const info = read('info')
const POSTS = { polo: ['article', 'print-vs-embroidery'], fabric: ['article-fabric', 'pick-fabric'], design: ['article-design', 'design-ideas'], checklist: ['article-checklist', 'collect-sizes'] }
const SKIP_H = /^(ดูรายละเอียด|บทความเกี่ยวกับ|ปรึกษา|ข้อมูลที่เกี่ยวข้อง|มีโจทย์)/
const posts = { _note: 'สร้างจาก Wireframe v22 ด้วย scripts/v22/use-pages.mjs · base = บทความเดิมใน articles.json ที่เรื่องตรงกัน ต่อท้ายเนื้อหา v22' }
/* บทความเสื้อโปโลปักกับพิมพ์ลาย: ตัวบทความใน v22 อยู่ในหน้า wireframe แต่ extract-pages เก็บไม่ได้ (เป็นตาราง + ย่อหน้า ไม่อยู่ในส่วนมาตรฐาน)
   → คัดจาก PAGE-CONTENT.json v22 ตามตัวอักษร */
const POST_BODY = {
  polo: [
    { t: 'เสื้อโปโลปักกับเสื้อพิมพ์ลาย ต่างกันตรงไหน?', body: 'เสื้อโปโลปักเน้นรายละเอียดโลโก้จากฝีเข็มบนตัวเสื้อ ส่วนเสื้อพิมพ์ลายใช้สีและกราฟิกสร้างภาพรวมของทีม การเลือกระหว่างสองแบบจึงควรเริ่มจากภาพลักษณ์ที่ต้องการ ขนาดและตำแหน่งโลโก้ และลักษณะงานของพนักงาน',
      table: { head: ['เรื่องที่เปรียบเทียบ', 'เสื้อโปโลปัก', 'เสื้อพิมพ์ลาย'], rows: [['ภาพลักษณ์', 'เน้นสีตัวเสื้อและโลโก้เป็นจุดเด่น', 'เน้นสี ลาย และองค์ประกอบกราฟิก'], ['สิ่งที่ต้องตรวจ', 'ขนาดโลโก้ เส้นเล็ก สีด้าย และตำแหน่งปัก', 'การจัดวางลาย สี ข้อความ และโลโก้หน้า-หลัง'], ['ผ้าและความสบาย', 'เลือกจากผ้าและทรงที่รองรับงานปัก', 'เลือกจากผ้าและทรงที่รองรับงานพิมพ์ลาย']] } },
    { t: 'เลือกเสื้อบริษัทจากงานที่พนักงานทำ', body: 'สำหรับทีมพบลูกค้าหรือหน้าร้าน ลองเริ่มจากภาพลักษณ์และการมองเห็นโลโก้ ส่วนทีมออกบูธหรือกิจกรรมอาจต้องดูความเด่นของสีและลายร่วมด้วย ทั้งสองรูปแบบควรเทียบเนื้อผ้า ทรง และการดูแลตามสเปกจริง ไม่ตัดสินความสบายจากเทคนิคตกแต่งเสื้อเพียงอย่างเดียว', links: [{ t: 'ดูแนวทางสั่งทำเสื้อบริษัทและยูนิฟอร์ม', to: 'uses.corp' }] },
    { t: 'เตรียมอะไรเพื่อขอราคาและเทียบแบบ?', body: 'ส่งโลโก้ สีองค์กร จำนวนพนักงาน ลักษณะงาน และวันที่ต้องการใช้ หากยังตัดสินใจไม่ได้ ให้แจ้งว่าต้องการเทียบเสื้อโปโลปักกับเสื้อพิมพ์ลายบนจำนวนและรายละเอียดใกล้เคียงกัน ก่อนเลือกให้ทีมดีตรวจผ้า แบบ และเงื่อนไขของแต่ละงาน', links: [{ t: 'วิธีเตรียมไฟล์โลโก้และรายการสั่งทำเสื้อ', to: 'guides.logo' }] },
  ],
}
/* ส่วนท้ายบทความตาม v22: ลิงก์ต่อ (ดูรายละเอียดเสื้อ / ข้อมูลที่เกี่ยวข้อง) · หัวข้อบทความเกี่ยวข้อง · หัวข้อปิดท้าย */
const LINK_MORE = { ...LINK, articles: null }
const tail = (p) => {
  const more = p.sections.find((x) => /^(ดูรายละเอียด|ข้อมูลที่เกี่ยวข้อง)/.test(x.h))
  const rel = p.sections.find((x) => /^บทความเกี่ยวกับ/.test(x.h))
  const end = p.sections.find((x) => /^(ปรึกษา|มีโจทย์)/.test(x.h))
  return {
    more: more ? { h: clean(more.h), links: more.links.map((l) => ({ t: clean(l.t), to: LINK_MORE[l.href.replace(/^#/, '')] })).filter((l) => l.to) } : null,
    relatedH: rel ? clean(rel.h) : '',
    cta: end ? { h: clean(end.h), p: texts(end.intro)[0] || '' } : null,
  }
}
for (const [id, [wid, base]] of Object.entries(POSTS)) {
  const p = info[wid]
  const body = POST_BODY[id] || p.sections.filter((x) => x.h && !SKIP_H.test(x.h)).map((x) => ({ t: clean(x.h), body: texts(x.intro).join(' ') || clean(x.all.replace(x.h, '')) }))
  posts[id] = {
    base, h1: clean(p.hero.h1), lead: clean(p.hero.lead),
    sections: body.map((x, i) => ({ id: `v22-${i + 1}`, ...x })),
    ...tail(p),
  }
}
writeFileSync(join(root, 'src/data/posts.json'), JSON.stringify(posts, null, 2) + '\n')
console.log('posts.json:', Object.keys(posts).filter((k) => k[0] !== '_').join(', '))
