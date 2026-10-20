/* ประมาณราคาเบื้องต้น (/calculations/) · ใช้ทั้งในเบราว์เซอร์และในเทส
   ราคาที่ยังไม่ยืนยันเก็บเป็น null ห้ามคิดเป็นศูนย์ คืน ok:false พร้อมบอกว่าขาดช่องไหน
   หน้าเว็บจะโชว์ [ยืนยัน] แทนตัวเลข จนกว่าจะได้ใบราคาขายจริง */
export const estimate = (data, { kind, band, options = [] }) => {
  if (!data.kinds.some((k) => k.id === kind)) throw new Error(`ไม่มีประเภท "${kind}"`)
  const b = data.bands.find((x) => x.id === band)
  if (!b) throw new Error(`ไม่มีช่วงจำนวน "${band}"`)
  const opts = options.map((id) => {
    const o = data.options.find((x) => x.id === id)
    if (!o) throw new Error(`ไม่มีออปชัน "${id}"`)
    return o
  })

  const missing = []
  const base = data.prices[kind]?.[band] ?? null
  if (base === null) missing.push(`ราคา ${kind} ช่วง ${b.label}`)
  for (const o of opts) if (o.add === null || o.add === undefined) missing.push(`ออปชัน ${o.name}`)

  const ok = missing.length === 0
  const perUnit = ok ? base + opts.reduce((s, o) => s + o.add, 0) : null
  return {
    ok,
    missing,
    perUnit,
    low: ok ? perUnit * b.min : null,
    high: ok && b.max !== null ? perUnit * b.max : null,
    band: b,
    vatIncluded: !!data.vatIncluded,
  }
}

/* ค่าที่ส่งมากับลิงก์ (?kind=&band=) จากตัวช่วยเลือกหน้าแรก · ค่าไหนไม่มีในตารางให้เป็น null */
export const readPrefill = (data, search) => {
  const q = new URLSearchParams(search)
  const kind = q.get('kind')
  const band = q.get('band')
  return {
    kind: data.kinds.some((k) => k.id === kind) ? kind : null,
    band: data.bands.some((b) => b.id === band) ? band : null,
  }
}
