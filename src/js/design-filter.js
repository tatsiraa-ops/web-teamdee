/* ตรรกะตัวกรองแบบเสื้อหน้า /designs/ (ใช้ทั้งตอน build ใน vite.config.js และในเบราว์เซอร์ · มีเทส tests/design-filter.test.js)
   อาร์ตสั่ง 26 ต.ค. 2026: กรองตามงาน (พิมพ์ลาย งานปัก งานสกรีน) · ตัวเลขบนตัวเลือกเปลี่ยนตามตัวกรองอื่น ได้ 0 = เลือกไม่ได้ */

/** งานแยกตามเทคนิคที่ทีมดีรับ (อาร์ต 26 ต.ค. 2026) · to = หน้าสินค้าที่ใช้เทคนิคนั้น
    ตอนนี้แบบในคลังเป็นพิมพ์ลายทั้งหมด งานปัก/งานสกรีนโชว์ไว้แต่เลือกไม่ได้ จนกว่าจะเพิ่มแบบที่ tech ตรง */
export const WORK = {
  print: { name: 'พิมพ์ลาย', to: 'products.print' },
  embroidery: { name: 'งานปัก', to: 'products.polo' },
  screen: { name: 'งานสกรีน', to: 'products.screen' },
}

/** งานของแบบหนึ่งแบบ ตาม tech ใน designs.json · ทรงเสื้อ (โปโล เบสบอล) อยู่แกน garment */
export const workOf = (d) => (WORK[d.tech] ? d.tech : 'print')

/** คำค้นตรงกับแบบนี้ไหม · พิมพ์รหัสแบบย่อก็เจอ (12 / td12 / TD-12 / td 0012 → td-0012 · อาร์ต 26 ต.ค. "ค้นหาทำดีๆ") · text เป็นตัวพิมพ์เล็กแล้ว */
export const textHit = (text, q) => {
  if (!q) return true
  /* พิมพ์เป็นรหัส (มีแต่ td / เลข) = ต้องตรงทั้งรหัส ไม่ใช่เลขที่อยู่ในรหัสอื่น (12 ไม่เจอ td-0112) */
  const m = /^(?:td)?[\s-]*0*(\d{1,4})$/.exec(q.trim())
  if (!m) return text.includes(q)
  return new RegExp(`(^|\\s)td-${m[1].padStart(4, '0')}(\\s|$)`).test(text)
}

/** แบบนี้ผ่านตัวกรองทุกแกนและคำค้นไหม · skip = แกนที่ไม่ต้องดู (ใช้ตอนนับเลขบนชิปของแกนนั้น) */
export const matches = (it, state, q, axes, skip = null) => {
  if (q && !textHit(it.text, q)) return false
  return axes.every((a) => a === skip || state[a] === 'all' || (it.tags[a] || []).includes(state[a]))
}

/** จำนวนแบบถ้ากดชิปนี้ · คิดจากแกนอื่นที่เลือกอยู่ + คำค้น (แกนเดียวกันไม่นับค่าที่เลือกอยู่) */
export const countFor = (items, state, q, axes, axis, value) =>
  items.filter((it) => matches(it, state, q, axes, axis) && (it.tags[axis] || []).includes(value)).length

/** แถบ "กำลังกรอง": แกนที่เลือก + คำค้น · names[axis][value] = ชื่อที่คนอ่าน */
export const activeFilters = (state, q, axes, names) => [
  ...axes.filter((a) => state[a] !== 'all').map((a) => ({ axis: a, label: names[a]?.[state[a]] || state[a] })),
  ...(q ? [{ axis: 'q', label: `“${q}”` }] : []),
]

/** เขียน URL ตอนแผ่นตัวกรองมือถือเปิดอยู่: พักไว้ แล้วเขียนครั้งเดียวหลังแผ่นปิด (มีเทส tests/qa-2026-11-02.test.js)
 *  settle() เรียกตอน popstate · คืน true = เขียน URL แล้ว ไม่ต้องอ่านค่าจาก URL ทับ */
export const holdWhile = (isOpen, write) => {
  let held = false
  return {
    write(push) {
      if (isOpen()) held = true
      else write(push)
    },
    settle() {
      if (!held || isOpen()) return false
      held = false
      write(true)
      return true
    },
  }
}

/** ชิปกลุ่มลูกค้าบนหัวหน้า /designs/ (รอบ 150 · มีเทส tests/designs-chips.test.js)
 *  chip = { axis: 'use' | 'garment' | '' (ทั้งหมด), val } · ชิปทรง (แบด/วิ่ง) ล้าง use · ทั้งหมดล้างทั้ง use และ garment · คืน state ใหม่ */
export const chipApply = (state, chip) => {
  if (!chip.axis) return { ...state, use: 'all', garment: 'all' }
  if (chip.axis === 'garment') return { ...state, use: 'all', garment: chip.val }
  return { ...state, use: chip.val }
}
/** ชิปที่ต้องไฮไลต์ · ไม่มีตัวกรองกลุ่ม/ทรงจากชิป = ทั้งหมด (0) · กลุ่มที่ไม่มีชิป = -1 */
export const chipActive = (state, chips) => {
  if (state.use !== 'all') return chips.findIndex((c) => c.axis === 'use' && c.val === state.use)
  const g = chips.findIndex((c) => c.axis === 'garment' && c.val === state.garment)
  return g >= 0 ? g : 0
}

/** จำนวนแบบต่อหน้า = คอลัมน์ที่เห็นจริง × 10 แถว (อาร์ต 6 พ.ย. "แสดงมาซัก 10 แถว") · อ่านคอลัมน์ไม่ได้ = 40 */
export const pageSize = (cols, rows = 10) => (Number.isFinite(cols) && cols > 0 ? cols * rows : 40)
/** ป้ายปุ่มโหลดเพิ่ม: บอกจำนวนที่จะได้จริง */
export const moreLabel = (shown, total, page) => `ดูแบบเพิ่มอีก ${Math.min(page, Math.max(0, total - shown))} แบบ`
