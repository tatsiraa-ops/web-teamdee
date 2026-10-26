/* ประกอบข้อมูลหน้าสินค้าตาม Wireframe v22 (src/data/product-pages.json) กับข้อมูลจริงที่มีอยู่แล้ว
   ใช้ตอน build ใน vite.config.js · มีเทส tests/product-view.test.js
   - เว็บจริง (forWp): ตัดทุกข้อความ / แถว / การ์ดที่ยังมี [วงเล็บ] · ส่วนที่ไม่เหลืออะไรซ่อนทั้งส่วน
   - ต้นแบบ: เก็บไว้ทั้งหมด ติด pending ให้เห็นว่ารอข้อมูล
   - ลิงก์ไปหน้าที่ยังไม่มีใน routes.json ตัดทิ้งทั้งสองแบบ ไม่ให้ build พัง */

export const pending = (s) => /\[[^\]]*\]/.test(String(s ?? ''))
/** มีข้อความรอข้อมูลอยู่ข้างในไหม · ไล่เฉพาะข้อความ (เดิมใช้ JSON.stringify ทำให้วงเล็บของ array ถูกนับเป็น [รอข้อมูล] ทุกครั้ง) */
export const anyPending = (x) => (typeof x === 'string' ? pending(x) : x && typeof x === 'object' ? Object.values(x).some(anyPending) : false)

export function productView(pp, real, { forWp, has }) {
  const ok = (s) => !forWp || !pending(s)
  const strs = (a) => (a || []).filter((s) => s && ok(s))
  const links = (a) => (a || []).filter((l) => has(l.to))
  const card = (c) => ({ ...c, p: strs(c.p) })
  const table = (t) => {
    if (!t) return null
    const rows = t.rows.filter((r) => !forWp || !r.some(pending))
    return rows.length ? { ...t, rows } : null
  }
  const sec = (data, hasContent) => ({ ...data, show: hasContent, pending: anyPending(data) })

  const v = {}
  v.hero = { ...pp.hero, facts: pp.hero.facts.filter((f) => ok(f.v)) }
  /* ตัวเลขทีมดีใต้ hero (audit P6) · ตัวที่ยังรอยืนยันถูกตัด · เว็บจริงโชว์เมื่อเหลืออย่างน้อย 2 ตัว (กติกาเดียวกับหน้ากลุ่ม) */
  const stats = (pp.trust?.stats || []).filter((s) => ok(s.n))
  v.trust = sec({ ...pp.trust, stats }, stats.length >= 2 || (!forWp && stats.length > 0))

  const opt = pp.options
  /* สเปกที่ผลิตได้จริง (products.json) · แท็บ ทรง / คอ / ออปชั่น โชว์เฉพาะแท็บที่ยังมีแถว */
  const rows = (r) => (r || []).filter((x) => !forWp || !x.some(pending))
  const spec = { shape: rows(real.spec?.shape), collar: rows(real.spec?.collar), option: rows(real.spec?.option) }
  const specTabs = [['shape', 'ทรง'], ['collar', 'คอ'], ['option', 'ออปชั่น']].filter(([k]) => spec[k].length).map(([id, t]) => ({ id, t }))
  v.options = sec({ ...opt, intro: strs(opt.intro), cards: opt.cards.filter((c) => ok(c.h)).map(card), links: links(opt.links), designs: real.designs || [], tags: real.tags || [], spec, specTabs }, true)

  const fab = pp.fabric
  const fabrics = (real.fabrics || []).filter((f) => ok(f.name) && ok(f.use))
  v.fabric = sec({ ...fab, intro: strs(fab.intro), notes: strs(fab.notes), table: forWp ? null : fab.table, links: links(fab.links), fabrics }, fabrics.length > 0 || !forWp)

  const det = pp.detail
  const detCards = det.cards.filter((c) => ok(c.h)).map(card)
  v.detail = sec({ ...det, intro: strs(det.intro), cards: detCards, table: table(det.table), links: links(det.links) }, detCards.length > 0)

  /* ราคาจริงจาก src/data/prices.json (ตารางราคาที่ทีมดีอนุมัติ) มาแทนกล่อง/ตาราง/หมายเหตุที่ยังรอราคา */
  const pri = real.price ? { ...pp.price, ...real.price } : pp.price
  const factors = strs(pri.factors)
  const need = pri.need ? { ...pri.need, items: strs(pri.need.items) } : null
  /* กล่องราคาจริงมี amount / unit / p มาจาก src/js/prices.js แล้ว (ตัวเลขใหญ่ + หน่วยเล็ก · ไม่แกะเลขจากข้อความ) */
  const box = pri.box && (!forWp || !anyPending(pri.box)) ? pri.box : null
  v.price = sec({ ...pri, confirmed: !!real.price, factors, need: need && need.items.length ? need : null, box, table: table(pri.table), notes: strs(pri.notes).filter((n) => !forWp || !/รอข้อมูลจริง|รอราคา/.test(n)) }, factors.length > 0 || !!box)

  v.quote = sec({ ...pp.quote }, !!pp.quote.h)

  const pro = pp.production
  const proCards = pro.cards.filter((c) => ok(c.h)).map(card)
  v.production = sec({ ...pro, cards: proCards, notes: strs(pro.notes) }, proCards.length > 0)

  const works = real.works || []
  const workCards = forWp ? [] : (works.length ? [] : pp.work.cards)
  v.work = sec({ ...pp.work, real: works, cards: workCards, links: links(pp.work.links) }, works.length > 0 || !forWp)

  v.reviews = sec({ ...pp.reviews }, !forWp)
  v.reviews.pending = true

  const siz = pp.size
  v.size = sec({ ...siz, p: strs(siz.p), notes: strs(siz.notes).filter((n) => !forWp || !/^รอ/.test(n)), links: links(siz.links), sizes: real.sizes || [] }, true)

  const ord = pp.order
  v.order = sec({ ...ord, steps: ord.steps.filter((s) => ok(s.h)).map((s) => ({ ...s, p: ok(s.p) ? s.p : '' })), payment: { ...ord.payment, p: strs(ord.payment.p) }, links: links(ord.links) }, ord.steps.length > 0)

  const items = pp.faq.items.filter(([q, a]) => ok(q) && ok(a))
  v.faq = sec({ ...pp.faq, items, links: links(pp.faq.links) }, items.length > 0)

  v.uses = sec({ ...pp.uses, links: links(pp.uses.links), compare: links(pp.uses.compare) }, true)
  v.contact = sec({ ...pp.contact }, true)

  v.toc = pp.toc.filter((t) => v[t.key]?.show)
  return v
}
