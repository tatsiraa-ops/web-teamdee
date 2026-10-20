/* ตัวช่วยเลือกหน้าแรก · เลือกกลุ่มงาน + จำนวน → แนะนำเสื้อจาก uses.json แล้วส่งต่อไปเครื่องคิดราคา
   ไม่มีราคาหรือระยะผลิตในนี้ ตัวเลขพวกนั้นยังรอยืนยัน (pricing.json เป็น null) */
export const planFor = (uses, pricing, useId, bandId) => {
  const use = uses.find((u) => u.id === useId)
  const band = pricing.bands.find((b) => b.id === bandId)
  if (!use || !band || !use.recommend?.length) return null
  const [main, ...alts] = use.recommend
  /* เครื่องคิดราคาแยกแค่ คอปก (โปโล) กับ คอกลม/คอวี (พิมพ์ลาย) */
  const kind = main.id === 'polo' ? 'collar' : 'round'
  /* "200 ขึ้นไป" → "200 ตัวขึ้นไป" · ช่วงอื่น "21–50" → "21–50 ตัว" */
  const qty = band.label.endsWith('ขึ้นไป') ? band.label.replace(/\s*ขึ้นไป$/, ' ตัวขึ้นไป') : `${band.label} ตัว`
  return { use, band, main, alts, qtyText: `สำหรับ ${qty}`, ctaText: `คำนวณราคา ${qty}`, calcQuery: `?kind=${kind}&band=${encodeURIComponent(band.id)}` }
}
