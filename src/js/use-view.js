/* ประกอบข้อมูลหน้ากลุ่มลูกค้าตาม Wireframe v22 (src/data/use-pages.json) กับของจริงที่มี (แบบเสื้อ ผลงาน ภาพลูกค้า)
   กติกาเดียวกับ product-view.js · มีเทส tests/use-view.test.js
   - เว็บจริง: ตัดข้อความ / การ์ด / คำถามที่ยังมี [วงเล็บ] · ส่วนที่ยังไม่มีของจริง (สถิติ ผลงาน ภาพลูกค้า) ซ่อน
   - ต้นแบบ: เก็บไว้ทั้งหมด ติด pending · ยกเว้นรีวิว ไม่มีรีวิวตรงกลุ่มซ่อนทั้งสองแบบ (อาร์ตเคาะ 2 พ.ย.) */
import { pending, anyPending } from './product-view.js'

/** จำนวนที่แสดงให้กริดเต็มแถว (ข้อ 5 ตรวจ UI 2 พ.ย.: แถว 6+1 · 3+2 ดูเหมือนของขาด) · ไม่ถึง 1 แถวแสดงตามจริง */
export const fullRows = (n, cols, max = n) => (n < cols ? n : Math.floor(Math.min(n, max) / cols) * cols)

/** ไอคอนของข้อ "ทำไมทีมดี" ตามความหมายของหัวข้อ (2 พ.ย. รอบ 64) · ลำดับสำคัญ: คำเฉพาะก่อนคำกว้าง · ไม่เข้ากลุ่ม = เช็ก */
const BENEFIT_ICO = [
  [/เอกสาร|เงื่อนไข/, 'Doc'], [/ดูแล/, 'Shield'], [/ตัวอย่าง|ทรง/, 'Swatch'], [/วางแผน|วัน/, 'Calendar'],
  [/สมาชิก|รายบุคคล|แยก|กลุ่ม|คนรวบรวม|ผู้ประสาน/, 'Users'], [/ภาพลักษณ์|เอกลักษณ์|ธีม|เรื่องราว/, 'Spark'],
  [/เลือก|กีฬา|บทบาท|หน้าที่|ผู้ใส่/, 'Shirt'],
]
/** H1 หน้ากลุ่ม "คำหลัก / คำค้น / คำค้น" → คำหลักตัวใหญ่ + คำค้นบรรทัดรอง (2 พ.ย. รอบ 64 · ข้อความใน H1 ครบเหมือนเดิม) */
export const h1Parts = (h) => { const [main, ...rest] = String(h || '').split(' / '); return { main, rest: rest.join(' / ') } }

/** ไอคอนของโจทย์คนสั่ง (2 พ.ย. รอบ 64) · คำเฉพาะก่อนคำกว้าง */
const PAIN_ICO = [
  [/ไซซ์|ชั้นปี/, 'Ruler'], [/โลโก้|ตรา|สปอนเซอร์|เอกลักษณ์|ธีม|สีและโลโก้|แบบไม่เหมือน|เริ่มแบบ/, 'Pen'],
  [/เอกสาร|จัดซื้อ|งบ|อนุมัติ|หลายฝ่าย/, 'Doc'], [/ทรง|ผ้า|ใส่สบาย|เลือกเสื้อ|เสื้อแข่ง/, 'Shirt'],
  [/วัน|ก่อน|ถึงไหน|ทัน/, 'Calendar'], [/ชื่อ|สมาชิก|แยก|ใครคือ|ทีมงาน|จำนวน/, 'Users'],
]
export const painIcon = (h) => (PAIN_ICO.find(([re]) => re.test(h)) || [0, 'Check'])[1]

export const benefitIcon = (h) => (BENEFIT_ICO.find(([re]) => re.test(h)) || [0, 'Check'])[1]

export function useView(up, real, { forWp, has, drop = [] }) {
  const ok = (s) => !forWp || !pending(s)
  const strs = (a) => (a || []).filter((s) => s && ok(s))
  const links = (a) => (a || []).filter((l) => has(l.to))
  const sec = (data, show) => ({ ...data, show: !!show, pending: anyPending(data) })
  /* cards: เก็บการ์ด ตัดเฉพาะข้อความ/ช่องรอภาพที่รอยืนยัน · cardsKeepFilled: การ์ดที่ข้อความทั้งหมดรอยืนยัน ตัดทั้งใบ */
  const cards = (a) => (a || []).filter((c) => ok(c.h)).map((c) => ({ ...c, p: strs(c.p), img: c.img && ok(c.img) ? c.img : null }))
  const cardsKeepFilled = (a) => (a || []).filter((c) => ok(c.h)).map((c) => ({ ...c, p: strs(c.p) })).filter((c) => !forWp || c.p.length)

  const v = {}
  v.hero = { ...up.hero, facts: strs(up.hero.facts), h1p: h1Parts(up.hero.h1) }
  /* สถิติ: ตัวที่ยังรอยืนยันถูกตัด · เว็บจริงโชว์เมื่อยืนยันแล้วอย่างน้อย 2 ตัว */
  const stats = (up.trust.stats || []).filter((s) => ok(s.n))
  v.trust = sec({ ...up.trust, stats, note: ok(up.trust.note) ? up.trust.note : '' }, !forWp || stats.length >= 2)
  v.pain = sec({ ...up.pain, intro: strs(up.pain.intro), cards: cardsKeepFilled(up.pain.cards).map((c) => ({ ...c, ico: painIcon(c.h), p: (c.p || []).map((t, i) => (i ? t : t.replace(/^ช่วย\s*/, ''))) })) } /* แสดงต่อ "ทีมดีช่วย" → ตัด "ช่วย" ซ้ำต้นประโยค */, up.pain.cards.length)
  /* ภาพลูกค้าจริงของแต่ละบริบท (real.contextPhotos เรียงตามการ์ด) แทนช่องรอภาพ */
  const ctxCards = up.contexts ? cards(up.contexts.cards).map((c, i) => (real.contextPhotos?.[i] ? { ...c, img: null, photo: real.contextPhotos[i] } : c)) : []
  /* เว็บจริง: การ์ดที่ยังไม่มีภาพลูกค้าไม่ขึ้น (2 พ.ย. · การ์ดฟาร์มบน /corporate/ ดูเหมือนรูปหาย) */
  const ctxShown = forWp ? ctxCards.filter((c) => c.photo) : ctxCards
  v.contexts = up.contexts ? sec({ ...up.contexts, cards: ctxShown, links: links(up.contexts.links) }, ctxShown.length) : { show: false }
  v.designs = sec({ ...up.designs, intro: strs(up.designs.intro), items: real.designs || [] }, (real.designs || []).length || !forWp)
  const products = up.products.cards.filter((c) => c.to && has(c.to))
  v.products = sec({ ...up.products, cards: products }, products.length)
  v.help = sec({ ...up.help }, up.help.h)
  v.work = sec({ ...up.work, real: real.works || [] }, (real.works || []).length || !forWp)
  /* รีวิวจริงตรงกลุ่ม (real.reviews จาก vite) · เงื่อนไขเดียวกับที่หน้าแสดง ทั้งเว็บจริงและต้นแบบ · สารบัญจึงมี "รีวิว" ตรงกับส่วนที่ขึ้นจริง */
  v.reviews = sec({ ...up.reviews, items: real.reviews || [] }, (real.reviews || []).length)
  const benefits = cardsKeepFilled(up.benefits.cards)
  v.benefits = sec({ ...up.benefits, cards: benefits.map((c) => ({ ...c, ico: benefitIcon(c.h) })), photo: real.benefitPhoto || null }, benefits.length)
  const pl = up.plan
  const payment = pl.payment ? { ...pl.payment, p: strs(pl.payment.p) } : null
  v.plan = sec({ ...pl, need: pl.need && { ...pl.need, items: strs(pl.need.items) }, price: pl.price && { ...pl.price, p: strs(pl.price.p) }, steps: pl.steps.filter((s) => ok(s.h)).map((s) => ({ ...s, p: ok(s.p) ? s.p : '' })), payment: payment && payment.p.length ? payment : null, links: links(pl.links) }, pl.steps.length || pl.need)
  v.photos = sec({ ...up.photos, items: real.photos || [], links: links(up.photos.links) }, (real.photos || []).length || !forWp)
  v.schedule = sec({ ...up.schedule }, up.schedule.h)
  const items = up.faq.items.filter(([q, a]) => ok(q) && ok(a))
  v.faq = sec({ ...up.faq, items }, items.length)
  v.team = sec({ ...up.team, p: strs(up.team.p), links: links(up.team.links) }, up.team.h)
  const rel = up.related ? links(up.related.links) : []
  v.related = sec({ ...(up.related || {}), links: rel }, rel.length)
  /* ส่วนปิดหน้า "เล่าโจทย์ของทีมคุณมา" ขึ้นทุกหน้ากลุ่ม */
  v.end = { show: true }
  /* use-v2.json drop: ส่วนที่อาร์ตสั่งลบทั้งส่วนในหน้านั้น (4 พ.ย. /corporate/ "ลบตามภาพ") · สารบัญตัดตามด้านล่าง */
  for (const k of drop) if (v[k]) v[k] = { ...v[k], show: false }
  v.toc = (up.toc || []).filter((t) => v[t.key]?.show)
  return v
}
