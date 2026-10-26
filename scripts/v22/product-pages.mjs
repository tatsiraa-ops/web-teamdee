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

/* ลำดับส่วนสำหรับคนที่มาจากแอด (audit P9 · อาร์ตเคาะ 24 ต.ค. ข้อ 5 ให้ต่างจาก v22 ได้ · H2 ของ v22 ยังอยู่ครบ)
   hero → ตัวเลขทีมดี → ราคา → แบบ → เสื้อจริง → ชวนขอราคา → ผ้า → รายละเอียด → ขั้นตอน → FAQ → ไซซ์ → การผลิต → ตามงาน → ปิดท้าย
   สารบัญเรียงตามนี้ · ลำดับใน productPage.hbs ต้องตรงกัน */
const ORDER = ['price', 'options', 'work', 'reviews', 'fabric', 'detail', 'order', 'faq', 'size', 'production']
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
    toc: p.hero.toc.map((t) => ({ t: clean(t.t), key: t.key === 'embroidery' ? 'detail' : t.key })).sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key)),
    /* แถบความเชื่อใจใต้ hero (audit P6) · ตัวเลขชุดเดียวกับหน้ากลุ่มลูกค้า */
    trust: { stats: STATS },
    /* การ์ดตัวหนังสือ 3 ใบของ v22 พูดซ้ำกับแท็บสเปก ทรง/คอ/ออปชั่น และกริดแบบในส่วนเดียวกัน (audit P9 "ตัดการ์ดตัวหนังสือ 3 ใบ") → ตัด เหลือหัวข้อ + คำนำ */
    options: { h: clean(opt.h), intro: texts(opt.intro), cards: [], links: links(opt) },
    fabric: { h: clean(fab.h), intro: texts(fab.intro), notes: texts(fab.hints), table: fab.tables[0] || null, links: links(fab) },
    detail: { h: clean(det.h), intro: texts(det.intro), cards: det.cards.map(card).filter((c) => c.h), table: det.tables[0] || null, links: links(det) },
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
  /* จอแรกมือถือ (audit P2) บรรทัดใต้ราคา "ขั้นต่ำ 10 ตัว · ผลิต X–Y วันทำการ" */
  page.hero.make = `ขั้นต่ำ ${MIN} ตัว · ผลิต ${l.days}`
  page.faq.items = page.faq.items.map(([q, a]) => {
    if (!/กี่วัน|เวลาผลิต/.test(q)) return [q, a]
    const min = /ขั้นต่ำ/.test(q) ? 'ขั้นต่ำ 10 ตัว ' : ''
    return [q, `${min}${faqLead(l)} แจ้งวันรับเสื้อที่ต้องการเพื่อวางแผนงานก่อนยืนยัน`]
  })
}

writeFileSync(join(root, 'src/data/product-pages.json'), JSON.stringify(out, null, 2) + '\n')
console.log('product-pages.json:', Object.keys(out).filter((k) => k[0] !== '_').join(', '))
