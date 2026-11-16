/* คลังรีวิวเดียวของหน้ากลุ่มลูกค้า (16 พ.ย. 2026 อาร์ต "การ์ดรีวิว + คำรีวิวในแท็บ เอารวมกันได้เลย คนละประเภทลูกค้าไม่เป็นไร เอาให้ครบๆ")
   ฟังก์ชันล้วน ไม่แตะ DOM · ใช้ตอน build (vite.config.js) · tests/review-pool.test.js
   - รีวิวจริงทุกรายใน reviews.json ขึ้นทุกหน้า แบ่งเป็นคำรีวิวในแท็บ + การ์ดในส่วนรีวิว · ในหน้าเดียวไม่ซ้ำ
   - own = รีวิวของกลุ่มหน้านี้ (รายการที่อาร์ตเคาะไว้ · ไม่มีรายการ = ตาม use ของกลุ่ม) ขึ้นส่วนรีวิวก่อน
   - ที่เหลือเรียงตามกลุ่มใกล้เคียง (RELATED) · แท็บที่ยังว่างได้รีวิวกลุ่มอื่นตามลำดับนี้ */

/* รีวิวที่อาร์ตเคาะให้กลุ่มนั้น (เดิม REVIEW_PICK ใน vite.config.js · 2–14 พ.ย.) · ไม่มีในนี้ = own ตาม use */
export const PICK = {
  shop: ['resort'],
  gov: ['hospital', 'nt-snooker'],
  faculty: [],
  class: [],
  sport: ['swim-kids', 'np-connect', 'krungthai-badminton'],
  badminton: ['krungthai-badminton'],
  running: ['runners'],
  event: ['outing-fabric', 'hr-outing', 'shrine'],
}
/* use ของกลุ่ม (ชุดเดียวกับ REVIEW_USE ใน vite.config.js) */
const USE = { corp: 'corp', shop: 'corp', gov: 'corp', edu: 'school', faculty: 'school', class: 'school', sport: 'sport', badminton: 'sport', running: 'sport', event: 'event' }
/* ลำดับกลุ่มที่ใกล้กับหน้านั้น (ใกล้ → ไกล) */
const RELATED = {
  corp: ['corp', 'event', 'sport', 'school'],
  shop: ['corp', 'event', 'sport', 'school'],
  gov: ['corp', 'event', 'sport', 'school'],
  edu: ['school', 'event', 'sport', 'corp'],
  faculty: ['school', 'event', 'sport', 'corp'],
  class: ['school', 'event', 'sport', 'corp'],
  sport: ['sport', 'corp', 'event', 'school'],
  badminton: ['sport', 'corp', 'event', 'school'],
  running: ['sport', 'event', 'corp', 'school'],
  event: ['event', 'corp', 'sport', 'school'],
}

/** own ของแต่ละหน้า: (review) => boolean */
export const OWN = Object.fromEntries(Object.keys(USE).map((id) => [id, (r) => !!r && (PICK[id] ? PICK[id].includes(r.id) : r.use === USE[id])]))

/** ลำดับคลังของหน้านี้: own (ตามลำดับที่เคาะ) → กลุ่มใกล้ → ไกล · ในกลุ่มเดียวกัน รายการที่มีรูปก่อน */
export function poolFor(id, reviews) {
  const own = OWN[id]
  const pinned = (PICK[id] || []).map((rid) => reviews.find((r) => r.id === rid)).filter(Boolean)
  const ownRest = reviews.filter((r) => own(r) && !pinned.includes(r))
  const others = (RELATED[id] || []).flatMap((u) => {
    const g = reviews.filter((r) => r.use === u && !own(r))
    return [...g.filter((r) => r.img), ...g.filter((r) => !r.img)]
  })
  const listed = new Set([...pinned, ...ownRest, ...others])
  return [...pinned, ...ownRest, ...others, ...reviews.filter((r) => !listed.has(r))].map((r) => ({ ...r, own: own(r) }))
}

/** แบ่งรีวิวของหน้า: tabs = แท็บเดิมที่ทุกแท็บมี review (id) · board = การ์ดส่วนรีวิว (own ก่อน)
    รีวิว own ขึ้นส่วนรีวิวเสมอ (การ์ดใหญ่มีรูป) · แท็บที่เคยใส่ own ไว้ได้รีวิวกลุ่มใกล้เคียงแทน · แท็บที่ใส่รีวิวกลุ่มอื่นไว้คงเดิม */
export function planReviews(id, reviews, tabs) {
  const pool = poolFor(id, reviews)
  const isOwn = (rid) => pool.find((r) => r.id === rid)?.own
  const keep = (t) => t.review && !isOwn(t.review)
  const taken = new Set(tabs.filter(keep).map((t) => t.review))
  const spare = pool.filter((r) => !r.own && !taken.has(r.id))
  const outTabs = tabs.map((t) => {
    if (keep(t)) return t
    const r = spare.shift()
    if (!r) return t
    taken.add(r.id)
    return { ...t, review: r.id }
  })
  const board = pool.filter((r) => !taken.has(r.id))
  return { tabs: outTabs, board }
}

/** แถวรูปรีวิวบนสุด (16 พ.ย. 2026 อาร์ต "รีวิวตรงหน้าปักน้อยๆ") · ใช้ทั้งหน้ากลุ่มลูกค้าและหน้าสินค้า
 *  รูปที่จัดไว้คงลำดับเดิม แล้ววนหยิบรูปที่ 1 ของทุกรีวิว → รูปที่ 2 … ไม่ซ้ำ จนครบ n
 *  wall [{ img: ชื่อไฟล์ไม่มี .webp, w, h, review }] · reviews [{ id, img?, gallery?: [{ img }] }] · lib = คลังรูป (path w h) */
export function topUpWall(wall, reviews, lib, n = 10) {
  const out = [...wall]
  const have = new Set(out.map((w) => w.img))
  const gal = reviews.filter((r) => r.img).map((r) => ({ id: r.id, pics: (r.gallery?.length ? r.gallery : [{ img: r.img }]).map((g) => g.img) }))
  for (let k = 0; out.length < n && gal.some((g) => g.pics[k]); k++) {
    for (const g of gal) {
      const p = g.pics[k]
      const key = p && p.split('/').pop().replace(/\.webp$/, '')
      if (!p || have.has(key) || out.length >= n) continue
      const m = lib.find((x) => x.path === p)
      have.add(key)
      out.push({ img: key, w: m?.w || 1200, h: m?.h || 900, review: g.id })
    }
  }
  return out
}
