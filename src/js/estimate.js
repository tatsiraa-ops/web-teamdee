/* เครื่องคำนวณราคาเบื้องต้น (/calculations/) · ใช้ทั้งในเบราว์เซอร์และในเทส (tests/estimate.test.js)
   ข้อมูล K มาจาก calcKinds(prices.json) (src/js/prices.js) · ราคาไฟล์เดียว
   กติกา (audit 3.4):
   - ยอดรวมเป็นตัวเลขเดียว = (ราคาต่อตัวของช่วงที่จำนวนตก + ออปชัน) × จำนวน ไม่ใช่ช่วงกว้าง
   - ราคาที่ยังไม่มี (null) ห้ามคิดเป็นศูนย์ คืน ok:false ให้หน้าเว็บขึ้น "ทักถามราคา" แทนตัวเลข
   - ออปชันนับเฉพาะสินค้าที่ prices.json ตั้ง options: true (พิมพ์ลาย · โปโล) */

const fmt = (n) => Number(n).toLocaleString('en-US')
const inBand = (b, q) => q >= b.min && (b.max === null || q <= b.max)
const priceOf = (b, col) => b.price[col] ?? null

const kindOf = (K, id) => {
  const k = K.kinds.find((x) => x.id === id)
  if (!k) throw new Error(`ไม่มีประเภท "${id}"`)
  return k
}

/** คิดราคา · { kind, fabric, qty, options } → ผลพร้อมข้อความที่หน้าเว็บใช้ */
export const estimate = (K, { kind, fabric, qty, options = [] }) => {
  const k = kindOf(K, kind)
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
  const belowMin = !Number.isInteger(q) || q < K.minQty
  const base = { kind: k, fabric: fab, qty: belowMin ? null : q, opts, add, vatIncluded: !!K.vatIncluded, minQty: K.minQty }
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

const MAX_QTY = 99999

/** ค่าจาก URL (?kind=&qty=&fabric=&opt=a,b) · ค่าไหนไม่มีจริงเป็น null/[] · ?band=21-50 (ลิงก์เดิม) ใช้ต้นช่วง */
export const readCalcQuery = (K, search) => {
  const s = new URLSearchParams(search || '')
  const k = K.kinds.find((x) => x.id === s.get('kind')) || null
  const num = (v) => (/^\d{1,5}$/.test(v || '') ? Number(v) : null)
  let qty = num(s.get('qty'))
  if (qty === null) qty = num((/^(\d+)(?:-\d+|\+)$/.exec(s.get('band') || '') || [])[1])
  if (qty !== null && (qty < K.minQty || qty > MAX_QTY)) qty = null
  /* ผ้าที่รวมชิปกัน รับรหัสผ้าตัวไหนในกลุ่มก็ได้ */
  const f = s.get('fabric')
  const fabric = (f && k?.fabrics?.find((x) => x.cols.includes(f))?.id) || null
  const options = k && !k.options ? [] : (s.get('opt') || '').split(',').filter((id) => K.options.some((o) => o.id === id))
  return { kind: k ? k.id : null, qty, fabric, options: [...new Set(options)] }
}

/** สิ่งที่เลือกเป็น ?query สำหรับ history.replaceState · ใส่ผ้า/ออปชันเฉพาะสินค้าที่มี */
export const calcSearch = (K, { kind, qty, fabric, options = [] }) => {
  const k = kindOf(K, kind)
  const parts = [`kind=${k.id}`]
  if (Number.isInteger(qty)) parts.push(`qty=${qty}`)
  if (k.fabrics && fabric) parts.push(`fabric=${encodeURIComponent(fabric)}`)
  if (k.options && options.length) parts.push(`opt=${options.map(encodeURIComponent).join(',')}`)
  return `?${parts.join('&')}`
}

/** ข้อความตั้งต้นในแชท LINE (oaMessage) · อยู่ใน URL จึงมีแค่เรื่องงาน ไม่มีชื่อ เบอร์ อีเมล หรือข้อมูลองค์กร */
export const lineText = (r) => {
  const k = r.kind
  const rows = [
    'ขอราคาเสื้อจากเครื่องคำนวณบนเว็บ',
    `สินค้า: ${k.name}${k.include ? ` (${k.include})` : ''}`,
    r.fabric && `ผ้า: ${r.fabric.name}`,
    r.qty && `จำนวน: ${fmt(r.qty)} ตัว`,
    r.opts.length && `ออปชัน: ${r.opts.map((o) => `${o.name} +${fmt(o.add)}`).join(' · ')}`,
  ]
  if (r.byDesign) rows.push('จะส่งโลโก้ + จำนวนสี ในแชทนี้ ให้ทีมดีประเมินราคา')
  else if (r.ok) rows.push(`ราคาต่อตัว: ${fmt(r.unit)} บาท`, `ยอดรวม: ${fmt(r.total)} บาท${r.vatIncluded ? ' (รวม VAT 7%)' : ''}`)
  else if (r.band) rows.push('ราคาต่อตัว: ขอให้ทีมดีประเมิน')
  return rows.filter(Boolean).join('\n')
}

/** สรุปสั้นที่ส่งไปฟอร์มขอใบเสนอราคา (?from=) · ทีมขายเห็นว่าลูกค้าคิดราคาอะไรมา */
export const fromText = (r) => [
  '/calculations/',
  r.kind.name,
  r.fabric && `ผ้า${r.fabric.name.replaceAll(' · ', '/')}`,
  r.qty && `${fmt(r.qty)} ตัว`,
  ...r.opts.map((o) => o.name),
  r.byDesign ? 'ประเมินตามแบบ' : r.ok ? `${fmt(r.unit)} บาท/ตัว · รวม ${fmt(r.total)} บาท` : r.band ? 'ขอให้ประเมินราคา' : '',
].filter(Boolean).join(' · ')

/** ยอดย่อในแถบล่างมือถือ (calc-03) · 2 บรรทัด */
export const barText = (r) => {
  if (r.belowMin) return { main: `ขั้นต่ำ ${fmt(r.minQty)} ตัว`, sub: '' }
  if (r.ok) return { main: `${fmt(r.total)} บาท`, sub: `${fmt(r.unit)}/ตัว · ${fmt(r.qty)} ตัว` }
  return { main: r.byDesign ? 'ทีมดีประเมินให้' : 'ทักถามราคา', sub: `${fmt(r.qty)} ตัว` }
}
