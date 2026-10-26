/* ตัวช่วยเลือกหน้าแรก · เลือกกลุ่มงาน + จำนวน → แนะนำเสื้อจาก uses.json แล้วส่งต่อไปเครื่องคิดราคา
   ไม่มีราคาในนี้ · ช่วงจำนวนมาจาก calcPricing(prices.json) (src/js/prices.js) */
export const planFor = (uses, pricing, useId, bandId) => {
  const use = uses.find((u) => u.id === useId)
  const band = pricing.bands.find((b) => b.id === bandId)
  if (!use || !band || !use.recommend?.length) return null
  const [main, ...alts] = use.recommend
  /* ส่งสินค้าที่แนะนำไปแบบของมันในเครื่องคิด (pricing.kindOf จาก prices.json) · โปโลปัก → โปโล ไม่ใช่พิมพ์ลายคอปก (audit calc-01)
     สินค้าที่เครื่องคิดไม่มี ใช้พิมพ์ลายคอกลม · จำนวน = ต้นช่วงที่เลือก */
  const kind = pricing.kindOf?.[main.id] || pricing.kindOf?.print || 'round'
  /* "200 ขึ้นไป" → "200 ตัวขึ้นไป" · ช่วงอื่น "21–50" → "21–50 ตัว" */
  const qty = band.label.endsWith('ขึ้นไป') ? band.label.replace(/\s*ขึ้นไป$/, ' ตัวขึ้นไป') : `${band.label} ตัว`
  return { use, band, main, alts, qtyText: `สำหรับ ${qty}`, ctaText: `คำนวณราคา ${qty}`, calcQuery: `?kind=${kind}&qty=${band.min}` }
}
