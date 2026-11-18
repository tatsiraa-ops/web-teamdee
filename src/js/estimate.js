/* เครื่องคำนวณราคาเบื้องต้น (/calculations/) · ใช้ทั้งในเบราว์เซอร์และในเทส (tests/estimate.test.js)
   ข้อมูล K มาจาก calcKinds(prices.json) (src/js/prices.js) · ราคาไฟล์เดียว
   กติกา (audit 3.4):
   - ยอดรวมเป็นตัวเลขเดียว = (ราคาต่อตัวของช่วงที่จำนวนตก + ออปชัน) × จำนวน ไม่ใช่ช่วงกว้าง
   - ราคาที่ยังไม่มี (null) ห้ามคิดเป็นศูนย์ คืน ok:false ให้หน้าเว็บขึ้น "ทักถามราคา" แทนตัวเลข
   - ออปชันนับเฉพาะสินค้าที่ prices.json ตั้ง options: true (พิมพ์ลาย · โปโล) */

import { screenQuote, bandIndex } from './screen-price.js'

const fmt = (n) => Number(n).toLocaleString('en-US')
const qtyLabel = ([min, max]) => `${fmt(min)}–${fmt(max)} ตัว`
/* สกรีน DTF (18 พ.ย. 2026): ค่าเริ่มของแผงสกรีน · ไม่ระบุลาย = A4 จุดเดียว */
const SCREEN_DEFAULT = { service: 'own', shirt: 'premium', spots: ['A4'], big: 0 }
const screenMin = (k, service) => (service === 'customer' ? k.screen.customer.minQty : k.minQty)
const inBand = (b, q) => q >= b.min && (b.max === null || q <= b.max)
const priceOf = (b, col) => b.price[col] ?? null

const kindOf = (K, id) => {
  const k = K.kinds.find((x) => x.id === id)
  if (!k) throw new Error(`ไม่มีประเภท "${id}"`)
  return k
}

/** คิดราคา · { kind, fabric, qty, options } → ผลพร้อมข้อความที่หน้าเว็บใช้ */
export const estimate = (K, { kind, fabric, qty, options = [], service, shirt, spots, big }) => {
  const k = kindOf(K, kind)
  if (k.screen) return screenEstimate(K, k, { qty, service, shirt, spots, big })
  let fab = null
  if (k.fabrics) {
    fab = k.fabrics.find((f) => f.id === (fabric || k.fabric))
    if (!fab) throw new Error(`ไม่มีผ้า "${fabric}"`)
  }
  const all = options.map((id) => {
    const o = K.options.find((x) => x.id === id)
    if (!o) throw new Error(`ไม่มีออปชัน "${id}"`)
    return o
  })
  const opts = k.options ? all : []
  const add = opts.reduce((s, o) => s + o.add, 0)
  const q = Number(qty)
  const belowMin = !Number.isInteger(q) || q < (k.minQty || K.minQty)
  const base = { kind: k, fabric: fab, qty: belowMin ? null : q, opts, add, vatIncluded: !!K.vatIncluded, minQty: k.minQty || K.minQty }
  const none = { ok: false, band: null, base: null, unit: null, total: null, next: null }
  if (belowMin) return { ...base, ...none, belowMin: true }
  if (k.byDesign) return { ...base, ...none, byDesign: true }

  const col = fab ? fab.id : k.col
  const i = k.bands.findIndex((b) => inBand(b, q))
  const band = k.bands[i]
  const price = priceOf(band, col)
  if (price === null) return { ...base, ...none, band, ask: k.ask }

  const unit = price + add
  const total = unit * q
  /* ชวนสั่งเพิ่มเฉพาะเมื่อยอดรวมของช่วงถัดไป (ที่จำนวนต้นช่วง) ต่ำกว่ายอดตอนนี้จริง */
  const nb = k.bands[i + 1]
  const np = nb ? priceOf(nb, col) : null
  const next = np !== null && (np + add) * nb.min < total ? { more: nb.min - q, qty: nb.min, unit: np + add, total: (np + add) * nb.min } : null
  return { ...base, ok: true, band, base: price, unit, total, next }
}

/** สกรีน DTF: รูปแบบผลเดียวกับสินค้าอื่น (ok · unit · total · band · belowMin) + r.screen = ผลเต็มจาก screenQuote (แตกรายการ · วันผลิต · แผนชำระ) */
const screenExtra = (sq) => {
  const xs = sq.ok ? sq.lines.filter((l) => l.per === null || l.amount !== l.per * sq.qty) : []
  return { amount: xs.reduce((s, l) => s + l.amount, 0), names: xs.map((l) => l.label.replace(/ \(.*\)$/, '')).join(' · ') }
}

const screenEstimate = (K, k, { qty, service, shirt, spots, big }) => {
  const sel = { service: service || SCREEN_DEFAULT.service, shirt: shirt || SCREEN_DEFAULT.shirt, spots: spots?.length ? spots : SCREEN_DEFAULT.spots, big: big || 0 }
  const S = k.screen
  const q = Number(qty)
  const sq = screenQuote(S, { ...sel, qty: q })
  const belowMin = sq.reason === 'belowMin'
  const bands = sel.service === 'customer' ? S.customer.bands : S.own.bands
  const i = belowMin ? -1 : bandIndex(bands, q)
  const band = i >= 0 ? { min: bands[i][0], max: bands[i][1], qty: qtyLabel(bands[i]) } : null
  return {
    kind: k, fabric: null, opts: [], add: 0, vatIncluded: !!K.vatIncluded, minQty: screenMin(k, sel.service), sel, screen: sq,
    qty: belowMin ? null : q, belowMin, ok: sq.ok, band, base: sq.ok ? sq.lines[0].per : null, unit: sq.unit, total: sq.total, next: null,
    /* บวกเพิ่มที่ไม่ใช่ต่อตัว (ไซซ์ใหญ่บางตัว · ค่าส่ง) → ใบสรุป: ราคาต่อตัว × จำนวน + บวกเพิ่ม = ยอดรวม */
    extra: screenExtra(sq),
    ...(sq.ok || belowMin ? {} : { ask: k.ask }),
  }
}

/** แถบช่วงราคาใต้ช่องจำนวน (รื้อหน้า 26 ต.ค.) · ทุกช่วงของแบบ+ผ้าที่เลือก ราคารวมออปชันแล้ว · on = ช่วงที่จำนวนตอนนี้อยู่ · แตะแล้วเปลี่ยนจำนวนเป็นต้นช่วง (calc-page.js) */
export const tiers = (r) => {
  const k = r.kind
  /* สกรีน: ราคาต่อตัวของลาย/เสื้อที่เลือก ที่ต้นแต่ละช่วง */
  if (k.screen) {
    const S = k.screen
    const bands = r.sel.service === 'customer' ? S.customer.bands : S.own.bands
    return bands.map(([min, max]) => ({ qty: qtyLabel([min, max]), min, unit: screenQuote(S, { ...r.sel, qty: min }).unit, on: !!r.band && r.band.min === min }))
  }
  if (!k.bands) return []
  const col = r.fabric ? r.fabric.id : k.col
  return k.bands.map((b) => {
    const p = priceOf(b, col)
    return { qty: b.qty, min: b.min, unit: p === null ? null : p + r.add, on: r.band === b }
  })
}

const MAX_QTY = 99999

/** ค่าจาก URL (?kind=&qty=&fabric=&opt=a,b) · ค่าไหนไม่มีจริงเป็น null/[] · ?band=21-50 (ลิงก์เดิม) ใช้ต้นช่วง */
export const readCalcQuery = (K, search) => {
  const s = new URLSearchParams(search || '')
  /* ลิงก์เดิมก่อน 18 พ.ย. 2026: ?kind=screen-oversize = สกรีนเสื้อ Oversize */
  const legacyOversize = s.get('kind') === 'screen-oversize'
  const k = K.kinds.find((x) => x.id === (legacyOversize ? 'screen' : s.get('kind'))) || null
  const num = (v) => (/^\d{1,5}$/.test(v || '') ? Number(v) : null)
  let qty = num(s.get('qty'))
  if (qty === null) qty = num((/^(\d+)(?:-\d+|\+)$/.exec(s.get('band') || '') || [])[1])
  if (k?.screen) {
    const S = k.screen
    const service = s.get('svc') === 'customer' ? 'customer' : 'own'
    const shirt = legacyOversize || s.get('shirt') === 'oversize' ? 'oversize' : 'premium'
    const spots = (s.get('spots') || '').split(',').filter((id) => S.sizes.some((z) => z.id === id)).slice(0, S.extra.maxSpots)
    const big = num(s.get('big')) || 0
    if (qty !== null && (qty < screenMin(k, service) || qty > S.maxQty)) qty = null
    return { kind: k.id, qty, fabric: null, options: [], service, shirt, spots: spots.length ? spots : SCREEN_DEFAULT.spots, big }
  }
  if (qty !== null && (qty < (k?.minQty || K.minQty) || qty > MAX_QTY)) qty = null
  /* ผ้าที่รวมชิปกัน รับรหัสผ้าตัวไหนในกลุ่มก็ได้ */
  const f = s.get('fabric')
  const fabric = (f && k?.fabrics?.find((x) => x.cols.includes(f))?.id) || null
  const options = k && !k.options ? [] : (s.get('opt') || '').split(',').filter((id) => K.options.some((o) => o.id === id))
  return { kind: k ? k.id : null, qty, fabric, options: [...new Set(options)] }
}

/** สิ่งที่เลือกเป็น ?query สำหรับ history.replaceState · ใส่ผ้า/ออปชันเฉพาะสินค้าที่มี */
export const calcSearch = (K, { kind, qty, fabric, options = [], service, shirt, spots = [], big = 0 }) => {
  const k = kindOf(K, kind)
  const parts = [`kind=${k.id}`]
  if (Number.isInteger(qty)) parts.push(`qty=${qty}`)
  if (k.screen) {
    if (service === 'customer') parts.push('svc=customer')
    else if (shirt === 'oversize') parts.push('shirt=oversize')
    if (spots.length) parts.push(`spots=${spots.join(',')}`)
    if (service !== 'customer' && shirt !== 'oversize' && big > 0) parts.push(`big=${big}`)
    return `?${parts.join('&')}`
  }
  if (k.fabrics && fabric) parts.push(`fabric=${encodeURIComponent(fabric)}`)
  if (k.options && options.length) parts.push(`opt=${options.map(encodeURIComponent).join(',')}`)
  return `?${parts.join('&')}`
}

/** ข้อความตั้งต้นในแชท LINE (oaMessage) · อยู่ใน URL จึงมีแค่เรื่องงาน ไม่มีชื่อ เบอร์ อีเมล หรือข้อมูลองค์กร */
export const lineText = (r) => {
  const k = r.kind
  if (k.screen) return screenLineText(r)
  const rows = [
    'ขอราคาเสื้อจากเครื่องคำนวณบนเว็บ',
    `สินค้า: ${k.name}${k.include ? ` (${k.include})` : ''}`,
    r.fabric && `ผ้า: ${r.fabric.name}`,
    r.qty && `จำนวน: ${fmt(r.qty)} ตัว`,
    r.opts.length && `ออปชัน: ${r.opts.map((o) => `${o.name} +${fmt(o.add)}`).join(' · ')}`,
  ]
  /* 30 ต.ค. สกรีนเป็น DFT ไม่คิดตามจำนวนสี · ขอแค่โลโก้กับขนาดลาย */
  if (r.byDesign) rows.push('จะส่งโลโก้และขนาดลายในแชทนี้ ให้ทีมดีประเมินราคา')
  else if (r.ok) rows.push(`ราคาต่อตัว: ${fmt(r.unit)} บาท`, `ยอดรวม: ${fmt(r.total)} บาท${r.vatIncluded ? ' (รวม VAT 7%)' : ''}`)
  else if (r.band) rows.push('ราคาต่อตัว: ขอให้ทีมดีประเมิน')
  return rows.filter(Boolean).join('\n')
}

/* สกรีน DTF: บริการ · เสื้อ · จำนวน · ลายแต่ละจุด · ไซซ์ใหญ่ · ราคาต่อตัว · ค่าส่ง · ยอดรวม · วันผลิต */
const screenLineText = (r) => {
  const S = r.kind.screen
  const sq = r.screen
  const own = r.sel.service !== 'customer'
  const shirt = S.shirts.find((x) => x.id === r.sel.shirt) || S.shirts[0]
  const spots = (sq.ok ? sq.spots : r.sel.spots).map((id, i) => `ลายจุดที่ ${i + 1}: ${id} (${S.sizes.find((z) => z.id === id).cm} ซม.)`)
  const rows = [
    'ขอราคาเสื้อจากเครื่องคำนวณบนเว็บ',
    `สินค้า: ${r.kind.name} · ${own ? 'เสื้อ + สกรีน' : 'สกรีนบนเสื้อของคุณ'}`,
    own && `เสื้อ: ${shirt.name}`,
    r.qty && `จำนวน: ${fmt(r.qty)} ตัว`,
    ...spots,
    own && shirt.bigAdd && r.sel.big > 0 && `ไซซ์ ${shirt.bigFrom} ขึ้นไป: ${fmt(Math.min(r.sel.big, r.qty || r.sel.big))} ตัว`,
  ]
  if (sq.ok) rows.push(`ราคาต่อตัว: ${fmt(sq.unit)} บาท`, sq.shipping && `ค่าส่ง: ${fmt(sq.shipping)} บาท`, `ยอดรวม: ${fmt(sq.total)} บาท${r.vatIncluded ? ' (รวม VAT 7%)' : ''}`, `ผลิตประมาณ: ${sq.lead}`)
  else if (!r.belowMin) rows.push('ราคาต่อตัว: ขอให้ทีมดีประเมิน')
  return rows.filter(Boolean).join('\n')
}

/** ส่งให้หัวหน้าดู (ตรวจมือถือ 30 ต.ค.) · ตัวเลขชุดเดียวกับข้อความ LINE แต่ขึ้นหัวเป็นใบประเมิน + ลิงก์ที่เปิดแล้วเห็นค่าเดิม */
export const shareText = (r, url) => ['ใบประเมินราคาเบื้องต้น จาก TEAMDEE', ...lineText(r).split('\n').slice(1), `ดูใบประเมิน: ${url}`].join('\n')

/** หน้าเลือกเพื่อน/กลุ่มใน LINE (ใช้ได้บน LINE มือถือ) */
export const lineShareUrl = (text) => `https://line.me/R/share?text=${encodeURIComponent(text)}`

/** สรุปสั้นที่ส่งไปฟอร์มขอใบเสนอราคา (?from=) · ทีมขายเห็นว่าลูกค้าคิดราคาอะไรมา */
export const fromText = (r) => (r.kind.screen ? [
  '/calculations/',
  r.kind.name,
  r.sel.service === 'customer' ? 'เสื้อของคุณ' : r.kind.screen.cols.find((c) => c.id === r.sel.shirt)?.name,
  r.qty && `${fmt(r.qty)} ตัว`,
  `ลาย ${(r.screen.ok ? r.screen.spots : r.sel.spots).join('+')}`,
  r.ok ? `${fmt(r.unit)} บาท/ตัว · รวม ${fmt(r.total)} บาท` : r.belowMin ? '' : 'ขอให้ประเมินราคา',
].filter(Boolean).join(' · ') : [
  '/calculations/',
  r.kind.name,
  r.fabric && `ผ้า${r.fabric.name.replaceAll(' · ', '/')}`,
  r.qty && `${fmt(r.qty)} ตัว`,
  ...r.opts.map((o) => o.name),
  r.byDesign ? 'ประเมินตามแบบ' : r.ok ? `${fmt(r.unit)} บาท/ตัว · รวม ${fmt(r.total)} บาท` : r.band ? 'ขอให้ประเมินราคา' : '',
].filter(Boolean).join(' · '))

/** ยอดย่อในแถบล่างมือถือ (calc-03) · 2 บรรทัด */
export const barText = (r) => {
  if (r.belowMin) return { main: `ขั้นต่ำ ${fmt(r.minQty)} ตัว`, sub: '' }
  if (r.ok) return { main: `${fmt(r.total)} บาท`, sub: `${fmt(r.unit)}/ตัว · ${fmt(r.qty)} ตัว` }
  return { main: r.byDesign ? 'ทีมดีประเมินให้' : 'ทักถามราคา', sub: `${fmt(r.qty)} ตัว` }
}
