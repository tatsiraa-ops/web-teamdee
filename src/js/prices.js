/* ราคาทั้งเว็บอ่านจาก src/data/prices.json ผ่านไฟล์นี้ที่เดียว · มีเทส tests/prices.test.js
   ใช้ทั้งตอน build (vite.config.js) และในเบราว์เซอร์ (เครื่องคำนวณ /calculations/)
   กติกา (audit 2.2): ทุกราคาที่โชว์ต้องบอกจำนวนที่ราคานั้นใช้ได้ · ช่วงจำนวนเป็นตัวเลข ป้ายสร้างจากตัวเลข ไม่พิมพ์เอง */

const fmt = (n) => Number(n).toLocaleString('en-US')

/** ป้ายช่วงจำนวน "10–20" · "1,001–2,000" · "200 ขึ้นไป" */
export const bandLabel = (b) => (b.max === null ? `${fmt(b.min)} ขึ้นไป` : `${fmt(b.min)}–${fmt(b.max)}`)
/** จำนวนพร้อมหน่วย "10–20 ตัว" · "200 ตัวขึ้นไป" */
export const qtyText = (b) => (b.max === null ? `${fmt(b.min)} ตัวขึ้นไป` : `${bandLabel(b)} ตัว`)
/** รหัสช่วงในลิงก์เครื่องคำนวณ (?band=) "10-20" · "200+" */
export const bandId = (b) => (b.max === null ? `${b.min}+` : `${b.min}-${b.max}`)
/** ช่วงที่จำนวนนี้ตก · ต่ำกว่าขั้นต่ำ = null */
export const bandFor = (p, qty) => p.bands.find((b) => qty >= b.min && (b.max === null || qty <= b.max)) || null

const has = (b, col) => b.price[col] !== null && b.price[col] !== undefined
/* ปลายแพง = ช่วงแรก · ปลายถูก = ช่วงสุดท้ายที่ยังมีราคา (ช่วงที่ต้องทักถามไม่นับ) */
const ends = (p, col = p.cols[0].id) => {
  const withPrice = p.bands.filter((b) => has(b, col))
  return { hi: withPrice[0], lo: withPrice.at(-1), col }
}
const name = (c) => c.short || c.name
/* ส่วนต่างคอลัมน์ที่ 2 กับคอลัมน์แรกเท่ากันทุกช่วงไหม (พิมพ์ลาย: คอปก +50 ทุกช่วง) */
const sameDiff = (p) => {
  if (p.cols.length !== 2) return null
  const [a, b] = p.cols.map((c) => c.id)
  const d = p.bands.map((x) => x.price[b] - x.price[a])
  return d.every((x) => x === d[0]) ? d[0] : null
}
const optionsLine = (P) => `เพิ่มต่อตัว: ${P.options.map((o) => `${o.name} +${fmt(o.add)} บาท`).join(' · ')}`

/** ลิงก์เครื่องคำนวณพร้อม ?kind= ตรงสินค้า (ตัวแรกของ calc) · สินค้าที่เครื่องคิดเป็นตัวเลขไม่ได้ = null */
export const calcHref = (P, id, calcUrl) => {
  const p = P.products[id]
  return p && p.bands && p.calc?.length ? `${calcUrl}?kind=${p.calc[0].kind}` : null
}

/** ตารางราคาหน้าเครื่องคำนวณ + ช่วงจำนวนของตัวช่วยเลือกหน้าแรก · ช่วงจำนวนกับราคาของพิมพ์ลาย + สกรีน (ประเมินตามแบบ)
    kindOf = สินค้า → ?kind= ของเครื่องคำนวณ (home-plan.js ใช้ส่งโปโลไปโปโล ไม่ใช่คอปกพิมพ์ลาย) */
export const calcPricing = (P) => {
  const pr = P.products.print
  const sc = P.products.screen
  const bands = pr.bands.map((b) => ({ id: bandId(b), label: bandLabel(b), qty: qtyText(b), min: b.min, max: b.max }))
  const kinds = [
    ...pr.cols.map((c) => ({ id: c.id, name: c.name, sub: pr.calcSub })),
    { id: sc.calc[0].kind, name: sc.calc[0].name, sub: sc.calcSub, byDesign: true },
  ]
  const prices = Object.fromEntries(kinds.map((k) => [k.id, Object.fromEntries(pr.bands.map((b) => [bandId(b), k.byDesign ? null : b.price[k.id] ?? null]))]))
  const kindOf = Object.fromEntries(Object.entries(P.products).filter(([, p]) => p.calc?.length).map(([id, p]) => [id, p.calc[0].kind]))
  return { vatIncluded: !!P.vatIncluded, source: 'ตารางราคาทีมดี', kinds, bands, prices, options: P.options, kindOf }
}

/** เครื่องคำนวณ /calculations/ (audit calc-01) · ชิปขั้น 1 จาก "calc" ของแต่ละสินค้าใน prices.json
    แต่ละแบบมีช่วงจำนวนของสินค้าตัวเอง (โปโล 10–50 · พิมพ์ลาย 10–20 · เบสบอล 10–20 ...) · from = ราคาต่อตัวที่จำนวนขั้นต่ำ
    โปโลเลือกผ้าได้ · ผ้าที่ราคาเท่ากันทุกช่วงรวมเป็นชิปเดียว (TC · ทรีคอต · ปีเก้) · ตรรกะคิดราคาอยู่ที่ estimate.js */
export const calcKinds = (P) => {
  const kinds = Object.entries(P.products).flatMap(([pid, p]) => (p.calc || []).map((c) => {
    if (!p.bands) return { id: c.kind, name: c.name, product: pid, sub: p.byDesign, byDesign: true, options: false }
    const bands = p.bands.map((b) => ({ min: b.min, max: b.max, label: bandLabel(b), qty: qtyText(b), price: b.price }))
    const at10 = (col) => p.bands[0].price[col] ?? null
    const k = { id: c.kind, name: c.name, product: pid, options: !!p.options, bands, ask: p.ask || 'ทักถามราคาได้เลย' }
    if (c.col || p.cols.length === 1) return { ...k, col: c.col || p.cols[0].id, from: at10(c.col || p.cols[0].id) }
    /* หลายผ้า · จัดกลุ่มผ้าที่ราคาเหมือนกันทุกช่วง */
    const groups = new Map()
    for (const col of p.cols) {
      const key = JSON.stringify(p.bands.map((b) => b.price[col.id] ?? null))
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(col)
    }
    const fabrics = [...groups.values()].map((cols) => ({ id: cols[0].id, name: cols.map((x) => x.chip || x.name).join(' · '), cols: cols.map((x) => x.id), from: at10(cols[0].id) }))
    return { ...k, fabrics, fabric: fabrics[0].id, from: fabrics[0].from, include: p.include?.long }
  }))
  const polo = kinds.find((k) => k.product === 'polo')
  const round = kinds.find((k) => k.product === 'print')
  const poloCol = P.products.polo?.cols[0]
  /* บรรทัดใต้ H1 (calc-06) · ราคาต่อตัวที่ขั้นต่ำของโปโลผ้าแรกกับพิมพ์ลายคอกลม */
  const lead = polo && round
    ? `สั่ง ${fmt(P.minQty)} ตัว: ${polo.name} (${name(poloCol)}) ${fmt(polo.from)} · ${P.products.print.calcSub} ${fmt(round.from)} บาท/ตัว · สั่งมากยิ่งถูก รวม VAT ส่งฟรี`
    : ''
  return { minQty: P.minQty, vatIncluded: !!P.vatIncluded, options: P.options, kinds, lead }
}

/** กล่องราคา + ตาราง + หมายเหตุ ของหน้าสินค้า (P3) · สินค้าที่ยังไม่มีตารางราคา = null */
export const productPrice = (P, id, { calcUrl } = {}) => {
  const p = P.products[id]
  if (!p || !p.bands) return null
  const { hi, lo, col } = ends(p)
  const tailLast = p.bands.at(-1) !== lo ? `${qtyText(p.bands.at(-1))} ${p.ask}` : ''
  let box
  if (p.box === 'from') {
    /* โปโล: ราคาผ้าแรกที่จำนวนน้อยสุด + ช่วงราคาผ้าอื่นที่จำนวนเดียวกัน */
    const others = p.cols.slice(1).map((c) => hi.price[c.id])
    box = {
      amount: fmt(hi.price[col]),
      p: [`${name(p.cols[0])} ${qtyText(hi)}`, others.length && `ผ้าอื่น ${fmt(Math.min(...others))}–${fmt(Math.max(...others))}`, p.include?.long].filter(Boolean).join(' · '),
    }
  } else {
    const diff = sameDiff(p)
    box = {
      amount: `${fmt(hi.price[col])} → ${fmt(lo.price[col])}`,
      p: [`${p.cols.length > 1 ? `${p.cols[0].name} ` : ''}${qtyText(hi)} → ${qtyText(lo)}`, diff && `${name(p.cols[1])} +${fmt(diff)} ทุกช่วง`, tailLast, p.tail].filter(Boolean).join(' · '),
    }
  }
  box.unit = 'บาท/ตัว'
  box.small = `ขั้นต่ำ ${P.minQty} ตัว · ราคารวม VAT 7% แล้ว`
  return {
    box,
    table: {
      head: ['จำนวน (ตัว)', ...p.cols.map((c) => c.name)],
      rows: p.bands.map((b) => [bandLabel(b), ...p.cols.map((c) => (has(b, c.id) ? fmt(b.price[c.id]) : p.ask))]),
    },
    notes: [...(p.options ? [optionsLine(P)] : []), ...(p.notes || [])],
    included: `ราคานี้รวม ${P.included.join(' · ')}`,
    calcHref: calcUrl ? calcHref(P, id, calcUrl) : null,
  }
}

/** ราคาในการ์ดบริการหน้าแรก (home-02) · v = ตัวเลขหลักพร้อมจำนวน · sub = บรรทัดเล็ก */
export const priceFact = (P, id) => {
  const p = P.products[id]
  if (!p) return null
  if (!p.bands) return { v: p.byDesign || p.askLine }
  const { hi, lo, col } = ends(p)
  if (p.box === 'from') return { v: `${fmt(hi.price[col])} บาท/ตัว`, sub: [`${name(p.cols[0])} ${qtyText(hi)}`, p.include?.short].filter(Boolean).join(' ') }
  return { v: `${fmt(hi.price[col])} บาท/ตัว (${qtyText(hi)})`, sub: `ลดถึง ${fmt(lo.price[col])} เมื่อสั่ง ${qtyText(lo)}` }
}

/** แถวราคาใน hero หน้าสินค้า (audit P2) · ตัวเลขเดียวกับการ์ดหน้าแรก (priceFact)
    สินค้าที่มีราคา 2 คอลัมน์ (พิมพ์ลาย: คอกลม / คอปก) บอกว่าเลขนี้เป็นของคอไหน และอีกคอเพิ่มเท่าไร */
export const heroPrice = (P, id) => {
  const f = priceFact(P, id)
  const p = P.products[id]
  if (!f || !p.bands || p.box === 'from' || p.cols.length < 2) return f
  const diff = sameDiff(p)
  return { ...f, sub: [p.cols[0].name, f.sub, diff && `${name(p.cols[1])} +${fmt(diff)}`].filter(Boolean).join(' · ') }
}

/** ราคาบรรทัดเดียว "220 บาท/ตัว (ผ้าจูติ 10–50 ตัว)" · hero หน้ากลุ่มลูกค้า (audit use-03)
    ราคาที่จำนวนน้อยสุด · หลายคอลัมน์บอกผ้า/คอที่ใช้ราคานี้ · สินค้าที่ไม่มีตารางราคา = null */
export const priceLine = (P, id) => {
  const p = P.products[id]
  if (!p || !p.bands) return null
  const { hi, col } = ends(p)
  return `${fmt(hi.price[col])} บาท/ตัว (${p.cols.length > 1 ? `${name(p.cols[0])} ` : ''}${qtyText(hi)})`
}

/** ใบราคาย่อหน้ากลุ่มลูกค้า (use-02) · แถวตามการ์ดสินค้าของกลุ่ม (cards[].to = "products.<id>")
    แต่ละแถว: ราคา 2 ปลาย · จำนวนของแต่ละปลาย · เวลาผลิต · สกรีน = ประเมินตามแบบ · วอร์ม = ทัก LINE */
export const useQuote = (P, cards, leadTimes, { askHref } = {}) => {
  const rows = cards.map((c) => {
    const id = c.to.split('.')[1]
    const p = P.products[id]
    const lead = leadTimes[id]?.days || ''
    const base = { id, h: c.h, p: c.p, to: c.to, lead }
    if (!p) return null
    if (!p.bands) return { ...base, text: p.byDesign || p.askLine, askHref: p.askLine && askHref ? askHref(id) : null }
    const { hi, lo, col } = ends(p)
    const extra = p.box === 'from'
      ? [name(p.cols[0]), p.include?.short].filter(Boolean).join(' ')
      : p.cols.length > 1 ? (() => { const e = ends(p, p.cols[1].id); return `${name(p.cols[1])} ${fmt(e.hi.price[e.col])} → ${fmt(e.lo.price[e.col])}` })() : ''
    return { ...base, amount: `${fmt(hi.price[col])} → ${fmt(lo.price[col])}`, unit: 'บาท/ตัว', qty: [`${qtyText(hi)} → ${qtyText(lo)}`, extra].filter(Boolean).join(' · ') }
  }).filter(Boolean)
  /* วิธีนับวันผลิต (เปิดทุกวัน · เริ่มนับวันถัดจากยืนยันแบบ · ช่วงคิวแน่น · งานด่วน) ใต้ตาราง */
  return { rows, foot: `ขั้นต่ำ ${P.minQty} ตัวทุกสินค้า · ราคานี้รวม ${P.included.join(' · ')}`, leadNote: leadTimes.note || '' }
}
