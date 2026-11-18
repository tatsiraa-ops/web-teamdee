/* เครื่องคิดราคาสกรีน DTF (18 พ.ย. 2026 · สไลด์ "ขายงานสกรีน DTF" 17 พ.ย. 2026)
   ใช้ทั้งเบราว์เซอร์ (calc-page.js) ตอน build (หน้า /screen-printing/) และเทส (tests/screen-price-1118.test.js)
   S = prices.json → products.screen · ไม่มีตัวเลขราคาในไฟล์นี้
   กติกา: จุดแรก = ลายใหญ่สุด (ราคาเสื้อ + สกรีน) · จุดที่ 2–3 คิดตามขนาด เรทตามจำนวนรวม (5–20 ตัวใช้ช่องแรกของตารางจุดเพิ่ม)
   Oversize บวกต่อตัว · ไซซ์ 2XL+ บวกต่อตัวที่เป็นไซซ์ใหญ่ (เฉพาะเสื้อที่มี bigAdd) · 5–20 ตัวบวกค่าส่งครั้งเดียว */

/** ช่วงที่ qty ตก · bands = [[min, max], …] · −1 = นอกช่วง */
export const bandIndex = (bands, qty) => bands.findIndex(([min, max]) => qty >= min && qty <= max)

const sizeRank = (S, id) => S.sizes.findIndex((s) => s.id === id)
const sizeText = (S, id) => `${id} (${S.sizes[sizeRank(S, id)].cm} ซม.)`

/** วันผลิตตามจำนวน */
export const screenLead = (S, qty) => (S.lead.find(([min, max]) => qty >= min && qty <= max) || [])[2] || S.leadMore

/** แผนชำระ: มัดจำขึ้นแบบ → สั่งผลิต 50% (หักมัดจำ) → ส่วนที่เหลือก่อนส่ง · ยอดต่ำกว่า payFullBelow จ่ายเต็มตอนสั่งผลิต */
export const screenPay = (S, total) => {
  if (total < S.payFullBelow) return { deposit: S.deposit, atProduction: total - S.deposit, beforeShip: 0, full: true }
  const half = Math.round(total / 2)
  return { deposit: S.deposit, atProduction: half - S.deposit, beforeShip: total - half, full: false }
}

/** ราคาจุดแรกต่ำสุดของแต่ละช่วง (เสื้อของเรา) · ใช้กับป้าย "เริ่ม …" และตารางย่อ */
export const screenFrom = (S, col) => {
  const add = S.shirts.find((s) => s.id === col)?.add || 0
  return S.own.bands.map((_, i) => Math.min(...Object.values(S.own.first).map((row) => row[i])) + add)
}

/** คิดราคา · { service: 'own' | 'customer', shirt: 'premium' | 'oversize', qty, spots: ['A3', 'A7', …], big } */
export const screenQuote = (S, { service = 'own', shirt = 'premium', qty, spots = [], big = 0 }) => {
  const own = service !== 'customer'
  const table = own ? S.own : S.customer
  const min = own ? S.minQty : S.customer.minQty
  const q = Number(qty)
  const fail = (reason, extra = {}) => ({ ok: false, reason, min, unit: null, total: null, lines: [], spots: [], shipping: 0, lead: null, pay: null, ...extra })
  if (!Number.isInteger(q) || q < min) return fail('belowMin')
  if (q > S.maxQty) return fail('aboveMax')
  const valid = spots.filter((id) => sizeRank(S, id) >= 0)
  if (!valid.length) return fail('noSpot')
  if (valid.length > S.extra.maxSpots) return fail('tooManySpots')

  const sorted = [...valid].sort((a, b) => sizeRank(S, b) - sizeRank(S, a))
  const sh = own ? S.shirts.find((s) => s.id === shirt) || S.shirts[0] : null
  const col = sh && S.cols.find((c) => c.id === sh.id)
  const i = bandIndex(table.bands, q)
  const ei = Math.max(0, bandIndex(S.extra.bands, q))

  const lines = []
  const first = table.first[sorted[0]][i]
  lines.push({ label: `${own ? `เสื้อ ${col.name} + ` : ''}สกรีนจุดที่ 1 · ${sizeText(S, sorted[0])}`, per: first, amount: first * q })
  sorted.slice(1).forEach((id, n) => {
    const p = S.extra.price[id][ei]
    lines.push({ label: `สกรีนจุดที่ ${n + 2} · ${sizeText(S, id)}`, per: p, amount: p * q })
  })
  if (sh?.add) lines.push({ label: `${col.name} เพิ่ม`, per: sh.add, amount: sh.add * q })
  const unit = lines.reduce((s, l) => s + l.per, 0)

  const bigN = sh?.bigAdd ? Math.min(q, Math.max(0, Math.floor(Number(big) || 0))) : 0
  if (bigN) lines.push({ label: `ไซซ์ ${sh.bigFrom} ขึ้นไป ${bigN} ตัว`, per: sh.bigAdd, amount: sh.bigAdd * bigN })
  const shipping = own && q <= S.shipping.upTo ? S.shipping.fee : 0
  if (shipping) lines.push({ label: `ค่าส่ง (${S.minQty}–${S.shipping.upTo} ตัว)`, per: null, amount: shipping })

  const total = lines.reduce((s, l) => s + l.amount, 0)
  return { ok: true, service: own ? 'own' : 'customer', shirt: sh?.id || null, qty: q, min, unit, total, lines, spots: sorted, shipping, lead: screenLead(S, q), pay: screenPay(S, total) }
}
