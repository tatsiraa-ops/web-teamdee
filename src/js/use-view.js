/* ประกอบข้อมูลหน้ากลุ่มลูกค้าตาม Wireframe v22 (src/data/use-pages.json) กับของจริงที่มี (แบบเสื้อ ผลงาน ภาพลูกค้า)
   กติกาเดียวกับ product-view.js · มีเทส tests/use-view.test.js
   - เว็บจริง: ตัดข้อความ / การ์ด / คำถามที่ยังมี [วงเล็บ] · ส่วนที่ยังไม่มีของจริง (สถิติ รีวิว ผลงาน ภาพลูกค้า) ซ่อน
   - ต้นแบบ: เก็บไว้ทั้งหมด ติด pending */
import { pending, anyPending } from './product-view.js'

export function useView(up, real, { forWp, has }) {
  const ok = (s) => !forWp || !pending(s)
  const strs = (a) => (a || []).filter((s) => s && ok(s))
  const links = (a) => (a || []).filter((l) => has(l.to))
  const sec = (data, show) => ({ ...data, show: !!show, pending: anyPending(data) })
  /* cards: เก็บการ์ด ตัดเฉพาะข้อความ/ช่องรอภาพที่รอยืนยัน · cardsKeepFilled: การ์ดที่ข้อความทั้งหมดรอยืนยัน ตัดทั้งใบ */
  const cards = (a) => (a || []).filter((c) => ok(c.h)).map((c) => ({ ...c, p: strs(c.p), img: c.img && ok(c.img) ? c.img : null }))
  const cardsKeepFilled = (a) => (a || []).filter((c) => ok(c.h)).map((c) => ({ ...c, p: strs(c.p) })).filter((c) => !forWp || c.p.length)

  const v = {}
  v.hero = { ...up.hero, facts: strs(up.hero.facts) }
  /* สถิติ: ตัวที่ยังรอยืนยันถูกตัด · เว็บจริงโชว์เมื่อยืนยันแล้วอย่างน้อย 2 ตัว */
  const stats = (up.trust.stats || []).filter((s) => ok(s.n))
  v.trust = sec({ ...up.trust, stats }, !forWp || stats.length >= 2)
  v.pain = sec({ ...up.pain, intro: strs(up.pain.intro), cards: cardsKeepFilled(up.pain.cards) }, up.pain.cards.length)
  /* ภาพลูกค้าจริงของแต่ละบริบท (real.contextPhotos เรียงตามการ์ด) แทนช่องรอภาพ */
  const ctxCards = up.contexts ? cards(up.contexts.cards).map((c, i) => (real.contextPhotos?.[i] ? { ...c, img: null, photo: real.contextPhotos[i] } : c)) : []
  v.contexts = up.contexts ? sec({ ...up.contexts, cards: ctxCards, links: links(up.contexts.links) }, up.contexts.cards.length) : { show: false }
  v.designs = sec({ ...up.designs, intro: strs(up.designs.intro), items: real.designs || [] }, (real.designs || []).length || !forWp)
  const products = up.products.cards.filter((c) => c.to && has(c.to))
  v.products = sec({ ...up.products, cards: products }, products.length)
  v.help = sec({ ...up.help }, up.help.h)
  v.work = sec({ ...up.work, real: real.works || [] }, (real.works || []).length || !forWp)
  v.reviews = sec({ ...up.reviews }, !forWp)
  v.reviews.pending = true
  const benefits = cardsKeepFilled(up.benefits.cards)
  v.benefits = sec({ ...up.benefits, cards: benefits }, benefits.length)
  const pl = up.plan
  const payment = pl.payment ? { ...pl.payment, p: strs(pl.payment.p) } : null
  v.plan = sec({ ...pl, need: pl.need && { ...pl.need, items: strs(pl.need.items) }, price: pl.price && { ...pl.price, p: strs(pl.price.p) }, steps: pl.steps.filter((s) => ok(s.h)).map((s) => ({ ...s, p: ok(s.p) ? s.p : '' })), payment: payment && payment.p.length ? payment : null, links: links(pl.links) }, pl.steps.length || pl.need)
  v.photos = sec({ ...up.photos, items: real.photos || [] }, (real.photos || []).length || !forWp)
  v.schedule = sec({ ...up.schedule }, up.schedule.h)
  const items = up.faq.items.filter(([q, a]) => ok(q) && ok(a))
  v.faq = sec({ ...up.faq, items }, items.length)
  v.team = sec({ ...up.team, p: strs(up.team.p), links: links(up.team.links) }, up.team.h)
  const rel = up.related ? links(up.related.links) : []
  v.related = sec({ ...(up.related || {}), links: rel }, rel.length)
  v.toc = (up.toc || []).filter((t) => v[t.key]?.show)
  return v
}
