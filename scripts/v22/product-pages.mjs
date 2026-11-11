/* แปลงเนื้อหาหน้าสินค้า 6 หน้าจาก Wireframe v22 (docs/spec/teamdee-v22/extracted/products.json) → src/data/product-pages.json
   รัน: node scripts/v22/product-pages.mjs · ไฟล์ผลลัพธ์แก้มือต่อได้ แต่ถ้ารันใหม่จะทับ

   กติกา (PLAN ข้อ 5 · START-HERE v22 ข้อ 5)
   - คำสัญญาที่ v22 ระบุว่ายังต้องยืนยัน (ตัวอย่างผ้าฟรี มัดจำ 50% แจ้งปัญหา 7 วัน รับบัตรเครดิต) → [รอยืนยัน: …]
   - โน้ตของ wireframe (ภาพแนวทาง Wireframe · บนมือถือเลื่อนตาราง) ตัดทิ้ง · รหัสแบบจำลอง WF-xxx ตัดทิ้ง ใช้แบบจริงจาก designs แทน
   - ลิงก์ #hash ของ wireframe → key ใน routes.json · หน้าที่ยังไม่มี vite จะกรองทิ้งตอน build */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { claim, STATS } from './claims.mjs'
import { fixProductCopy } from './copy-fixes.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const raw = JSON.parse(readFileSync(join(root, 'docs/spec/teamdee-v22/extracted/products.json'), 'utf8'))

const ID = { polo: 'polo', printed: 'print', screen: 'screen', warmup: 'warmup', baseball: 'baseball', oversize: 'jersey' }
const LINK = {
  business: 'uses.corp', organization: 'uses.gov', shop: 'uses.shop', education: 'uses.edu', class: 'uses.class',
  faculty: 'uses.faculty', sport: 'uses.sport', badminton: 'uses.badminton', running: 'uses.running', activity: 'uses.event',
  polo: 'products.polo', printed: 'products.print', screen: 'products.screen', warmup: 'products.warmup',
  baseball: 'products.baseball', oversize: 'products.jersey', works: 'projects', designs: 'designs', contact: 'contact',
  'guide-size': 'guides.size', 'guide-fabric': 'guides.fabric', 'guide-embroider': 'guides.polo', 'guide-print': 'guides.print',
  'guide-screen': 'guides.screen', 'guide-delivery': 'guides.delivery', 'guide-files': 'guides.logo',
}
const DROP = [/Wireframe/, /บนมือถือเลื่อนตาราง/, /รหัสจำลอง WF-/]

const clean = (s) => claim(String(s || '').replace(/\s*(?:→\s*)?↗\s*$/, '').replace(/\s+/g, ' ').trim())
const keep = (s) => s && !DROP.some((re) => re.test(s))
const texts = (arr) => (arr || []).map(clean).filter(keep)
const to = (href) => {
  const k = String(href || '').replace(/^#/, '').split('/')[0]
  return LINK[k] || null
}
const links = (s) => s.links.filter((l) => to(l.href)).map((l) => ({ t: clean(l.t), to: to(l.href) }))
const card = (c) => ({ h: clean(c.h), p: texts(c.p), img: c.ph ? clean(c.ph.t) : null })
/* โจทย์ / สเปก / ทีมดีช่วย ติดกันเป็นก้อนเดียวใน wireframe · แยกเป็นรายการ */
const facts = (s) => clean(s).split(/(?=(?:โจทย์|สเปก|ทีมดีช่วย):)/).map((x) => x.trim()).filter(Boolean)

/* สารบัญเรียงตาม hero.toc ของ v22 (อาร์ตเคาะ 2 พ.ย. 2026 · แทนลำดับ 24 ต.ค. ข้อ 5 / 26 ต.ค.) · ลำดับใน productPage.hbs ต้องตรงกัน */
/* ปุ่มรองใน hero (อาร์ตเคาะ 24 ต.ค. ข้อ 8): โปโลปักปุ่มหลัก LINE ปุ่มรองฟอร์มขอใบเสนอราคา · หน้าอื่นปุ่มรองเป็นลิงก์ "ดูตารางราคา" อย่างเดียว */
const QUOTE_SECOND = new Set(['polo'])
/* กล่องชวนขอราคา (audit P5): "ส่ง 3 อย่างนี้" แยกตามสินค้า · แตกจากย่อหน้าของ v22 ในส่วนเดียวกัน (quote.p) ไม่เพิ่มคำสัญญาใหม่ */
const SEND = {
  polo: ['โลโก้ (ไฟล์หรือรูปถ่าย)', 'สีเสื้อ จำนวน และจุดปัก', 'วันที่ต้องได้รับเสื้อ'],
  print: ['รหัสแบบหรือภาพอ้างอิง', 'สีทีม โลโก้ และรายชื่อ-เบอร์', 'จำนวน และวันใช้งาน'],
  screen: ['ไฟล์ลาย ขนาด และตำแหน่งสกรีน', 'สีและชนิดตัวเสื้อ', 'จำนวน และวันที่ต้องการใช้'],
  warmup: ['ภาพแนวทางเสื้อวอร์ม', 'ลาย สีทีม และรายละเอียดตัวเสื้อ', 'จำนวน และวันใช้'],
  baseball: ['ภาพแนวทาง โลโก้ และข้อความ', 'ตำแหน่งลาย', 'จำนวนแยกไซซ์ และวันใช้'],
  jersey: ['แนวกราฟิกและโลโก้', 'สัดส่วนเสื้อที่ต้องการ', 'จำนวนแยกไซซ์ และวันใช้งาน'],
}
const MIN = JSON.parse(readFileSync(join(root, 'src/data/prices.json'), 'utf8')).minQty
const read = (f) => JSON.parse(readFileSync(join(root, 'src/data', f), 'utf8'))
const DETAILS = read('download-designs.json').details
const SPEC = Object.fromEntries(read('products.json').map((p) => [p.id, p.spec]))
const PRINT_FABRICS = read('techniques.json').sublimation.fabricNames
/* รูปจริงของการ์ดตัวเลือกและรายละเอียด (อาร์ตเคาะ 2 พ.ย. "เน้นใส่รูป") · เปิดดูรูปทุกใบแล้ว · ป้ายบอกตรงๆ ว่าเป็นภาพจริง ภาพ 3D หรือภาพแบบ
   [ไฟล์, ป้าย, alt, fit] · fit = วางทั้งตัว (ภาพเสื้อตัวเดียวที่ครอปแล้วขาด) · รูปในหน้าเดียวกันห้ามซ้ำ (tests/v22-cards.test.js) */
const MEDIA = JSON.parse(readFileSync(join(root, 'src/data/media-library.json'), 'utf8')).items
const pic = ([file, tag, alt, fit]) => {
  const m = MEDIA.find((x) => x.path.endsWith(`/${file}.webp`))
  if (!m) throw new Error(`ไม่พบรูป ${file} ใน media-library.json`)
  return { img: m.path, width: m.w, height: m.h, tag, alt, fit: !!fit }
}
const T3D = 'ภาพ 3D'
const REAL = 'ภาพจริง'
const MOCK = 'ภาพแบบ'
const OPTION_PHOTO = {
  polo: [
    ['embroider-005', T3D, 'เสื้อโปโลปักสีกรมท่าล้วน ด้านหน้าและหลัง'],
    ['embroider-014', T3D, 'เสื้อโปโลปักสีดำ ตัดต่อข้างลำตัวสีเหลือง'],
    ['embroider-031', T3D, 'เสื้อโปโลปักสีกรมท่า ปกและขอบแขนสีขาว'],
  ],
  print: [
    ['fti-front', REAL, 'เสื้อโปโลพิมพ์ลายสีแดงของทีม FTI บนหุ่น', true],
    ['brand-049', REAL, 'เสื้อคอกลมพิมพ์ลายสีดำลายธงตาหมากรุกบนหุ่น', true],
    ['m06', T3D, 'เสื้อคอปกพิมพ์ลายสีชมพู ปกและแขนต่างสี', true],
  ],
  screen: [
    ['brand-058', T3D, 'เสื้อยืดสีดำ ด้านหน้าและหลัง'],
    ['mockup-3d-entaneer', T3D, 'เสื้อสกรีนลายหน้าและหลังสีน้ำตาล'],
    ['mockup-3d-chula', T3D, 'เสื้อสกรีนตัวอักษรที่อกสีขาว'],
  ],
  warmup: [
    ['warmup-05', MOCK, 'เสื้อวอร์มซิปหน้าสีเทาขลิบส้ม ด้านหน้าและหลัง'],
    ['warmup-06', MOCK, 'เสื้อวอร์มมีฮู้ดสีดำลายส้ม ด้านหน้าและหลัง'],
    ['warmup-02', MOCK, 'เสื้อวอร์มพิมพ์ลายทีมกีฬาสีกรมท่าแดง ด้านหน้าและหลัง'],
  ],
  baseball: [
    ['loose-113', MOCK, 'เสื้อเบสบอลสีดำขลิบชมพู เห็นทรงและแขน', true],
    ['loose-105', MOCK, 'เสื้อเบสบอลสีขาวน้ำเงิน เห็นคอและแนวสาบกระดุม', true],
    ['loose-099', REAL, 'ชื่อและเบอร์พิมพ์บนหลังเสื้อระยะใกล้'],
  ],
  jersey: [
    ['d08', T3D, 'เสื้อเจอร์ซีย์สีแดงแบบ TD-0008 ด้านหน้าและหลัง', true],
    ['d22', T3D, 'เสื้อเจอร์ซีย์แบบ TD-0022 ด้านหน้าและหลัง'],
    ['d25', T3D, 'เสื้อเจอร์ซีย์สีเขียวแบบ TD-0025 ลายด้านหน้าและชื่อเบอร์ด้านหลัง', true],
  ],
}
const DETAIL_PICS = {
  polo: {
    'ตำแหน่งและขนาด': ['embroider-020', T3D, 'เสื้อโปโลสีขาวปักโลโก้ที่อกซ้าย'],
    'สีด้ายและความละเอียด': ['loose-123', REAL, 'งานปักโลโก้ TEAMDEE ด้ายสีส้มระยะใกล้'],
    'ตรวจแบบก่อนผลิต': ['embroider-024', T3D, 'ภาพ 3D ตรวจแบบเสื้อโปโล ด้านหน้าและหลัง'],
  },
  print: {
    'สีและลาย': ['brand-031', REAL, 'เสื้อพิมพ์ลายสีดำชมพูบนหุ่น เห็นสีและลาย', true],
    'โลโก้และข้อความ': ['fti-back', REAL, 'ข้อความพิมพ์บนหลังเสื้อระยะใกล้'],
    'ชื่อและเบอร์': ['d15', T3D, 'เสื้อพิมพ์ชื่อและเบอร์ด้านหลัง แบบ TD-0015', true],
  },
  warmup: {
    'สีและลายทีม': ['warmup-03', MOCK, 'เสื้อวอร์มมีฮู้ดลายทีมสีน้ำเงินขาว'],
    'ทรงและแขน': ['warmup-04', MOCK, 'เสื้อวอร์มซิปหน้าสีส้มกรมท่า เห็นทรงและแขน'],
    'รายละเอียดตัวเสื้อ': ['warmup-01', MOCK, 'เสื้อวอร์มคอปกสีเทาม่วง เห็นคอและซิป'],
  },
  baseball: { 'สีและกราฟิก': ['loose-108', MOCK, 'เสื้อเบสบอลสีครีมดำ ลายทางและกราฟิกตัวอักษร', true] },
  jersey: {
    'ทรงและสัดส่วน': ['d23', T3D, 'เสื้อเจอร์ซีย์สีชมพูเทาแบบ TD-0023 ด้านหน้าและหลัง', true],
    'ภาพสวมใส่': ['r17', REAL, 'ทีมลูกค้าใส่เสื้อทีมลายทางแดงขาวถ่ายรวม'],
    'สีและลาย': ['d24', T3D, 'เสื้อเจอร์ซีย์แบบ TD-0024 สีน้ำเงินลายทาง', true],
  },
}
/* การ์ด 3 ใบของ v22 กลับมาพร้อมรูปและปุ่ม (อาร์ตเคาะ 2 พ.ย. · แทน audit P9 ที่เคยตัดเพราะพูดซ้ำกับแท็บสเปก) · brief = ข้อความที่ v22 ส่งต่อให้ทีมขาย */
const optionCards = (pid, s) => {
  const list = s.cards.filter((c) => c.cta?.some((t) => /ปรึกษาตัวเลือกนี้|ให้ช่วยเลือกแนวนี้/.test(t)))
  const briefs = s.links.filter((l) => l.brief)
  return list.map((c, i) => ({ h: clean(c.h), p: texts(c.p), cta: clean(c.cta[0]), brief: clean(briefs[i].brief), ...pic(OPTION_PHOTO[pid][i]) }))
}
/* รูปจริงลงการ์ดรายละเอียด (download-designs.json): หัวการ์ด v22 → ไฟล์ · caption = ใช้ชื่อรูปแทนคำบรรยายของ wireframe ที่พูดเกินสิ่งที่เห็นในรูป */
const DETAIL_PHOTO = {
  baseball: { 'กระดุมและแนวสาบ': { file: 'loose-119' }, 'คอและทรง': { file: 'loose-120', caption: true } },
}
const detailCard = (pid, c) => {
  if (DETAIL_PICS[pid]?.[c.h]) return { ...c, ...pic(DETAIL_PICS[pid][c.h]) }
  const m = DETAIL_PHOTO[pid]?.[c.h]
  const d = m && DETAILS.find((x) => x.img.includes(m.file))
  if (m && !d) throw new Error(`ไม่พบรูป ${m.file} ใน download-designs.json`)
  return d ? { ...c, p: m.caption ? [d.title] : c.p, img: d.img, imgSmall: d.imgSmall, width: d.width, height: d.height, alt: d.title } : c
}
/* การ์ดโปโลปักเป็นข้อความจริงอ่านได้โดยไม่มีรูป (ตรวจอะไรบ้าง) ไม่ใช่คำบรรยายรูปแบบสินค้าอื่น → เว็บจริงโชว์ (อาร์ต 2 พ.ย.: H2 งานปักต้องกลับมา) */
const TEXT_CARDS = new Set(['polo'])
/* v22 ใส่ลิงก์คู่มือไว้ทั้งในย่อหน้าและลิงก์ · เหลือลิงก์อย่างเดียว */
const noLinkEcho = (s) => texts(s.intro).filter((t) => !links(s).some((l) => l.t === t))

const out = { _note: 'สร้างจาก Wireframe v22 ด้วย scripts/v22/product-pages.mjs (22 ต.ค. 2026) · [วงเล็บ] = รอข้อมูลจริง เว็บจริงซ่อนให้อัตโนมัติ' }
for (const [wid, pid] of Object.entries(ID)) {
  const p = raw[wid]
  /* ส่วนที่ไม่มี id ใน wireframe ได้ชื่อ n<ลำดับ> · ของหน้าสินค้ามีส่วนเดียวคือ "เลือก…ตามงานที่ใช้" */
  const sec = Object.fromEntries(p.sections.map((s) => [s.key === 'embroidery' ? 'detail' : /^n\d+$/.test(s.key) ? 'uses' : s.key, s]))
  const get = (k) => sec[k] || { intro: [], hints: [], cards: [], lists: [], tables: [], faq: [], links: [], payment: [], split: [] }
  const opt = get('options'), fab = get('fabric'), det = get('detail'), pri = get('price'), quo = get('quote')
  const pro = get('production'), wrk = get('work'), siz = get('size'), ord = get('order'), faq = get('faq'), use = get('uses'), con = get('contact')
  out[pid] = {
    hero: {
      kicker: clean(p.hero.kicker), h1: clean(p.hero.h1), lead: clean(p.hero.lead),
      cta: clean(p.hero.buttons[0]), second: QUOTE_SECOND.has(pid) ? 'quote' : 'price', imgNote: p.hero.ph ? clean(p.hero.ph.t) : '',
      facts: p.hero.facts.map((f) => { const [k, ...v] = f.split(':'); return { k: k.trim(), v: clean(v.join(':')) } }),
    },
    toc: p.hero.toc.map((t) => ({ t: clean(t.t), key: t.key === 'embroidery' ? 'detail' : t.key })),
    /* แถบความเชื่อใจใต้ hero (audit P6) · ตัวเลขชุดเดียวกับหน้ากลุ่มลูกค้า */
    trust: { stats: STATS },
    options: { h: clean(opt.h), intro: texts(opt.intro), cards: optionCards(pid, opt), links: links(opt) },
    fabric: { h: clean(fab.h), intro: texts(fab.intro), notes: texts(fab.hints), table: fab.tables[0] || null, links: links(fab) },
    detail: { h: clean(det.h), intro: noLinkEcho(det), cards: det.cards.map(card).filter((c) => c.h).map((c) => detailCard(pid, TEXT_CARDS.has(pid) ? { ...c, text: true } : c)), table: det.tables[0] || null, links: links(det) },
    price: {
      h: clean(pri.h),
      /* โปโลเป็นรายการ (ul) · หน้าอื่นเป็นย่อหน้า 2 ย่อหน้าใต้หัวข้อเดียว: ปัจจัย + ข้อมูลสำหรับขอราคา */
      factorsTitle: clean(pri.lists[0]?.h || pri.split[0]?.h),
      factors: pri.lists[0] ? texts(pri.lists[0].items) : texts(pri.split[0]?.p?.slice(0, 1)),
      need: pri.lists[0] ? null : (pri.split[0]?.p?.[1] ? { h: 'ข้อมูลสำหรับขอราคา', items: texts([pri.split[0].p[1]]) } : null),
      box: pri.price ? { strong: clean(pri.price.strong), p: clean(pri.price.p), small: clean(pri.price.small) } : null,
      table: pri.tables[0] || null, notes: texts(pri.hints),
    },
    quote: { h: clean(quo.h), p: texts(quo.intro)[0] || '', cta: clean(quo.links[0]?.t), send: SEND[pid] || [] },
    production: { h: clean(pro.h), cards: pro.cards.map(card).filter((c) => c.h), notes: texts(pro.hints) },
    work: { h: clean(wrk.h), cards: wrk.cards.map((c) => ({ h: clean(c.h), facts: facts((c.p || []).join('')), img: c.ph ? clean(c.ph.t) : null })), links: links(wrk).slice(0, 1) },
    reviews: { h: clean(get('reviews').h) },
    size: { h: clean(siz.h), title: clean(siz.split[0]?.h), p: texts(siz.split[0]?.p), table: siz.tables[0] || null, notes: texts(siz.hints), links: links(siz) },
    order: { h: clean(ord.h), steps: ord.cards.map((c) => ({ h: clean(c.h), p: texts(c.p)[0] || '' })), payment: ord.payment[0] ? { h: clean(ord.payment[0].h), p: texts(ord.payment[0].p) } : { h: 'การชำระเงินและเอกสาร', p: texts(ord.intro) }, links: links(ord) },
    faq: { h: clean(faq.h), items: faq.faq.map((f) => [clean(f.q), clean(f.a)]), links: links(faq) },
    uses: { h: clean(use.h), links: links(use).filter((l) => l.to.startsWith('uses.')), compare: links(use).filter((l) => l.to.startsWith('products.')) },
    contact: { h: clean(con.h), p: texts(con.intro)[0] || '', cta: clean(con.links[0]?.t) },
  }
}
/* เวลาผลิตจริงแยกตามงาน (src/data/lead-times.json · อาร์ตให้ใช้ 23 ต.ค. 2026 · วิธีนับวัน 26 ต.ค.) แทนช่อง [รอยืนยัน] ของ v22
   ช่องระยะผลิตบน hero + FAQ ที่ถามว่าใช้เวลากี่วัน */
const LEAD = JSON.parse(readFileSync(join(root, 'src/data/lead-times.json'), 'utf8'))
const leadText = (l) => `${l.days} ${LEAD.start}`
/* ประโยค FAQ: ชื่องานบอก DFT แล้ว ตัวเลขไม่ต้องซ้ำคำ · ชื่อที่ลงท้ายด้วยอักษรละตินเว้นวรรคก่อนคำไทย */
const faqLead = (l) => `${l.tech}${/[A-Za-z]$/.test(l.tech) ? ' ' : ''}ใช้เวลาผลิตประมาณ ${l.days.replace(/^DFT\s*/, '')} ${LEAD.start} (${LEAD.deposit}) ${LEAD.open} ${LEAD.season} ${LEAD.rush}`
for (const [pid, page] of Object.entries(out)) {
  const l = LEAD[pid]
  if (!l?.days) continue
  for (const f of page.hero.facts) if (/ผลิต/.test(f.k)) f.v = leadText(l)
  /* จอแรกมือถือ (audit P2) บรรทัดใต้ราคา "ขั้นต่ำ 10 ตัว · ผลิต X–Y วัน" */
  page.hero.make = `ขั้นต่ำ ${pid === 'screen' ? 1 : MIN} ตัว · ผลิต ${l.days}${l.more ? ` · ${l.more}` : ''}`
  page.faq.items = page.faq.items.map(([q, a]) => {
    if (!/กี่วัน|เวลาผลิต/.test(q)) return [q, a]
    const min = /ขั้นต่ำ/.test(q) ? `ขั้นต่ำ ${pid === 'screen' ? 1 : 10} ตัว ` : ''
    return [q, `${min}${faqLead(l)} แจ้งวันรับเสื้อที่ต้องการเพื่อวางแผนงานก่อนยืนยัน`]
  })
}

/* ตารางรายละเอียดของ v22 มีช่อง [วงเล็บ] → เติมจากสเปกจริง (products.json · techniques.json) อาร์ต 2 พ.ย. · เฉพาะแถวที่ยืนยันแล้ว
   - พิมพ์ลาย: ทุกแถวเป็นช่องรอ → เว็บจริงไม่มีส่วนรายละเอียด H2 v22 หาย
   - Jersey: ใช้ผ้าชุดเดียวกับเสื้อพิมพ์ลาย (อาร์ตเคาะ 2 พ.ย.) → ไม่มีตารางรอสเปกผ้าแล้ว */
const sure = (rows) => rows.filter(([, note]) => !/\[/.test(note)).map(([n]) => n)
const shapes = sure(SPEC.print.shape)
const sleeves = [...new Set(shapes.flatMap((n) => n.match(/แขน\S+/g) || []))]
out.print.detail.table.rows = [
  ['ทรงและไซซ์', `${shapes.join(' · ')}`],
  ['ผ้า', PRINT_FABRICS.join(' · ')],
  ['คอและแขน', [...sure(SPEC.print.collar), ...sleeves].join(' · ')],
]
out.jersey.detail.table.rows = out.jersey.detail.table.rows.map(([k, v]) => [k, k === 'ผ้า' ? PRINT_FABRICS.join(' · ') : v])
out.jersey.fabric.table = null
/* โปโล: ยังไม่มีรูปที่ยืนยันว่าเป็นงานปัก · รูปลูกค้าใส่โปโลขึ้นใต้หัวข้อนี้ ไม่เคลมว่าปัก (tests/v22-structure.test.js EXCEPT) */
out.polo.work.photoH = 'เสื้อโปโลที่ลูกค้าองค์กรใส่จริง'

/* หน้าสกรีนเขียนใหม่ตามราคาจริง (prices.json screen · FAQ ชุด faq.json screen) · เดิมแก้ใน product-pages.json ตรงๆ
   ย้ายมาไว้ที่นี่ 30 ต.ค. รันใหม่แล้วไม่ทับกลับเป็น "ขั้นต่ำ 10 ตัว" ของ v22 */
const FAQ = JSON.parse(readFileSync(join(root, 'src/data/faq.json'), 'utf8'))
const sc = out.screen
Object.assign(sc.hero, {
  h1: 'รับทำเสื้อสกรีน\nให้ลายของคุณอยู่บนเสื้อที่ใช่',
  lead: 'เสื้อคอตตอนสำหรับบริษัท ทีมงาน และกิจกรรม เลือก Premium C32 หรือ Oversize C20 พร้อมสกรีน DFT',
  make: 'ไม่มีขั้นต่ำ · ผลิต 3–14 วัน ตามสเกล จุดสกรีน และความยากง่าย',
})
for (const f of sc.hero.facts) {
  if (f.k === 'ขั้นต่ำ') f.v = '1 ตัว'
  if (/ผลิต/.test(f.k)) f.v = '3–14 วัน ตามสเกลงานและจุดสกรีน'
}
sc.toc.splice(sc.toc.findIndex((t) => t.key === 'faq'), 0, { t: 'ขั้นตอนสั่ง', key: 'order' })
sc.price.factorsTitle = 'เลือกทรง จำนวน และจุดที่ต้องการ'
sc.price.factors = ['ราคาปกติ รวม VAT 7% ทุกไซซ์ราคาเดียวกัน', 'ตำแหน่งเพิ่มเติมคิดแยกตามขนาดลาย ไม่คิดเหมาราคาเดียวทุกจุด']
sc.order.steps = [
  { h: 'เลือกเสื้อและส่งลาย', p: 'บอกทรง สี จำนวน ขนาดลาย ตำแหน่ง และวันที่ต้องใช้ เพื่อสรุปราคา' },
  { h: 'ออกแบบและยืนยัน', p: 'ออกแบบฟรี ปรับแบบได้ไม่จำกัดก่อนยืนยัน' },
  { h: 'ผลิตและส่งถึงทีม', p: 'ชำระ 50% ก่อนผลิต ใช้เวลา 3–14 วันตามสเกล จุดสกรีน และความยากง่าย ชำระส่วนที่เหลือก่อนจัดส่ง' },
]
sc.order.payment.p = [
  'ชำระ 50% ก่อนผลิต และอีก 50% เมื่อผลิตเสร็จก่อนจัดส่ง',
  'ราคารวม VAT 7% ออกใบเสร็จและใบกำกับภาษีได้ จัดส่งฟรีทั่วไทย',
  'หากพบตำหนิหรือความเสียหาย แจ้งภายใน 7 วันหลังรับสินค้า พร้อมเลขออเดอร์และภาพ โดยเสื้อสกรีนต้องยังไม่ผ่านการซักก่อนส่งเปลี่ยน',
]
sc.faq.items = FAQ.screen

fixProductCopy(out)
writeFileSync(join(root, 'src/data/product-pages.json'), JSON.stringify(out, null, 2) + '\n')
console.log('product-pages.json:', Object.keys(out).filter((k) => k[0] !== '_').join(', '))
