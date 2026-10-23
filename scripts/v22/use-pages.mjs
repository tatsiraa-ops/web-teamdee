/* แปลงหน้ากลุ่มลูกค้า 10 หน้า + แกลเลอรีแบบเสื้อ 11 หน้า + หน้ารีวิว จาก Wireframe v22 → src/data/{use-pages,design-pages,works-page}.json
   รัน: node scripts/v22/extract-pages.mjs แล้ว node scripts/v22/use-pages.mjs · ผลลัพธ์แก้มือต่อได้ แต่รันใหม่จะทับ
   กติกาเดียวกับ product-pages.mjs: คำสัญญาที่ต้องยืนยัน → [รอยืนยัน: …] (claims.mjs) · โน้ตของ wireframe และรหัส WF ตัดทิ้ง
   ลิงก์ #hash → key ใน routes.json · หน้าที่ยังไม่มี vite กรองทิ้งตอน build */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { claim } from './claims.mjs'

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
const empty = { intro: [], hints: [], cards: [], lists: [], tables: [], faq: [], links: [], payment: [], split: [] }
const sections = (p, extra = {}) => Object.fromEntries(p.sections.map((s) => [extra[s.key] || (/^n\d+$/.test(s.key) ? 'related' : s.key), s]))

/* 8 ปี (เริ่ม 2018) + 2,800+ องค์กร ยืนยันจาก Brand Strategy v2 · 10,000+ งาน อาร์ตยืนยัน (22 ต.ค.) */
const STATS = [['8 ปี', 'ดูแลงานเสื้อทีม', true], ['2,800+ องค์กร', 'ลูกค้าที่ไว้วางใจ', true], ['10,000+ งาน', 'งานผลิตที่ดูแล', true]].map(([n, t, ok]) => ({ n: ok ? n : `[รอยืนยัน: ${n}]`, t }))

/* ขั้นตอน 01–03: ใน v22 หน้า 9 กลุ่ม (ยกเว้นบริษัท) เอารายการ "เตรียมข้อมูล" มาวางเป็นคำอธิบายขั้นตอน อ่านไม่รู้เรื่อง
   (agent ลูกค้า 22 ต.ค.) → เก็บหัวข้อขั้นตอนของ v22 แต่ใช้คำอธิบายกลางที่เป็นข้อเท็จจริงยืนยันแล้ว (Brand Strategy v2) เฉพาะขั้นที่ซ้ำ */
const STEP_P = [
  'เล่างานและจำนวนคร่าว ๆ ทีมดีช่วยเลือกประเภทเสื้อ ผ้า และแจ้งราคา',
  'ดูแบบและปรับได้ไม่จำกัดจนพอใจ แล้วยืนยันแบบ ไซซ์ และจำนวนก่อนผลิต',
  'อัปเดตทุกขั้นตอนหลักระหว่างผลิต ส่งถึงมือ และแจ้งเคลมได้ภายใน 7 วันหลังรับสินค้า',
]
const steps = (plan) => {
  const need = (plan.lists[0]?.items || []).map(clean)
  return plan.cards.filter((c) => c.h).map((c, i) => {
    const p = clean(texts(c.p)[0] || '')
    const dup = need.some((n) => n && p.includes(n))
    return { h: clean(c.h), p: dup ? STEP_P[i] || p : p }
  })
}

/* เอกสารและการชำระเงิน: v22 รวมทุกอย่างไว้ประโยคเดียวที่มี [รอยืนยัน] → เว็บจริงตัดทิ้งทั้งบรรทัด หน้าหน่วยงานเลยไม่เหลือเรื่องเอกสารเลย
   (agent ลูกค้า 22 ต.ค.) → แยกบรรทัด ข้อที่ยืนยันแล้วอยู่ต่อ · รายการเอกสารตรงกับช่อง "เอกสารที่ต้องการ" ในฟอร์มติดต่อ */
const PAYMENT_P = [
  'ออกใบเสร็จ / ใบกำกับภาษีได้',
  'ขอเอกสารจัดซื้อได้ ใบเสนอราคา ใบกำกับภาษีเต็มรูป หนังสือรับรองบริษัท ภ.พ.20 ใบส่งของ',
  'วางบิลได้ตามเงื่อนไขที่ตกลงก่อนสั่ง (ไม่รับบัตรเครดิต)',
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
   เก็บของ v22 ไว้เฉพาะเรื่องวันรับ และข้อที่ยังรอยืนยัน (เว็บจริงตัดเอง) */
const PRINT_GROUPS = new Set(['sport', 'badminton', 'running', 'event', 'class'])
const heroFacts = (id, facts) => [
  'ออกแบบฟรี ปรับได้ไม่จำกัด',
  'ขั้นต่ำ 10 ตัว',
  PRINT_GROUPS.has(id) ? 'ใส่ชื่อ-เบอร์รายคนได้' : 'ออกใบเสร็จ / ใบกำกับภาษีได้',
  /* วันรับ: เอาแค่ตัวแรก ("วางวันรับตามวันแจกเสื้อ / วันรับอุปกรณ์ / …" ยาวจนป้ายตัดสองบรรทัดบนมือถือ) */
  ...facts.filter((f) => /^วางวันรับ|\[รอยืนยัน/.test(f)).map((f) => (f.startsWith('วางวันรับ') ? f.split(' / ')[0] : f)),
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
  return page
}

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
    toc: p.hero.toc.map((t) => ({ t: clean(t.t), key: t.key === 'customer-photos' ? 'photos' : t.key })),
    trust: { h: clean(g('trust').h), stats: STATS, note: texts(g('trust').hints)[0] || '' },
    pain: { h: clean(g('pain').h), intro: texts(g('pain').intro), cards: cards(g('pain')) },
    contexts: sec.contexts ? { h: clean(g('contexts').h), cards: cards(g('contexts')), links: links(g('contexts')) } : null,
    designs: { h: clean(g('designs').h), intro: texts(g('designs').intro) },
    products: { h: clean(g('products').h), cards: g('products').cards.filter((c) => c.h).map((c, i) => ({ h: clean(c.h), p: texts(c.p), to: links(g('products'))[i]?.to || null })) },
    help: { h: clean(g('help').h), p: texts(g('help').intro)[0] || '', cta: cta(g('help')) },
    work: { h: clean(g('work').h) },
    reviews: { h: clean(g('reviews').h) },
    benefits: { h: clean(g('benefits').h), cards: cards(g('benefits')) },
    plan: {
      h: clean(plan.h),
      need: plan.lists[0] ? { h: clean(plan.lists[0].h), items: texts(plan.lists[0].items) } : null,
      price: priceSplit ? { h: clean(priceSplit.h), p: texts(priceSplit.p) } : null,
      steps: steps(plan),
      payment: plan.payment[0] ? { h: clean(plan.payment[0].h), p: PAYMENT_P } : null,
      links: links(plan), cta: cta(plan),
    },
    photos: { h: clean(g('photos').h), intro: texts(g('photos').intro)[0] || '' },
    schedule: { h: clean(g('schedule').h), p: texts(g('schedule').intro)[0] || '', cta: cta(g('schedule')) },
    faq: { h: clean(g('faq').h), items: faqItems(id, g('faq').faq.map((f) => [clean(f.q), clean(f.a)])) },
    team: { h: clean(g('team').h), title: clean(team.h), p: texts(team.p), links: links(g('team')) },
    related: sec.related ? { h: clean(sec.related.h), links: links(sec.related) } : null,
  }
}
for (const id of Object.keys(out)) if (id[0] !== '_') shortenH2(id, out[id])
writeFileSync(join(root, 'src/data/use-pages.json'), JSON.stringify(out, null, 2) + '\n')
console.log('use-pages.json:', Object.keys(out).filter((k) => k[0] !== '_').join(', '))

/* แกลเลอรีแบบเสื้อ: หน้ารวม /designs/ + รายกลุ่ม 10 หน้า · กริดแบบใช้แบบจริงรหัส TD (vite) ไม่ใช้รหัส WF */
const des = read('designs')
const sec3 = (p) => p.sections
const gal = { _note: 'สร้างจาก Wireframe v22 ด้วย scripts/v22/use-pages.mjs · กริดแบบเติมจาก designs.json ตอน build', groups: {} }
const di = des.designs
gal.index = {
  kicker: clean(di.hero.kicker), h1: clean(di.hero.h1), lead: clean(di.hero.lead),
  pillsH: clean(sec3(di)[0].h), pills: links(sec3(di)[0]), filterH: clean(sec3(di)[1].h),
  cta: { h: clean(sec3(di)[2].h), p: texts(sec3(di)[2].intro)[0] || '' },
}
for (const [wid, id] of Object.entries(USE)) {
  const p = des[`designs-${wid}`]
  const [grid, check, ctaSec] = sec3(p)
  gal.groups[id] = {
    kicker: clean(p.hero.kicker), h1: clean(p.hero.h1), lead: clean(p.hero.lead), back: clean(p.hero.buttons[0]),
    gridH: clean(grid.h), checkH: clean(check.h), check: texts(check.lists[0]?.items), cta: { h: clean(ctaSec.h), p: texts(ctaSec.intro)[0] || '' },
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
