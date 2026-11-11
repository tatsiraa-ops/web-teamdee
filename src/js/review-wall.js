import { initLightbox } from './lightbox.js'

/* คลังรีวิว (reviewWall.hbs · 10 พ.ย. 2026) · ผนังรูปไม่เลื่อน เรียงเต็มแถว · กดรูป = ดูรูปใหญ่ (กล่องมืดของรูปลูกค้า)
   อาร์ต "เยอะๆ 10 แถวได้" → "ดีมาก เอาเป็น 6 แถวพอ" → ไม่เกิน 6 แถวทุกจอ · แถวท้ายที่ไม่เต็มซ่อน (ไม่เหลือรูปเดี่ยว)
   ใส่ hidden ให้รูปที่ไม่แสดง → กล่องดูรูปนับเฉพาะรูปที่เห็น · คำนวณใหม่เมื่อเปลี่ยนขนาดจอ */

/** items = [{ top, w }] ตามลำดับ · คืน index ที่ต้องซ่อน (แถวเกิน max และแถวท้ายที่กว้างรวมไม่ถึง 85%) */
export const MAX_ROWS = 6

export function rowsToHide(items, width, max) {
  const rows = []
  items.forEach((it, i) => {
    const last = rows[rows.length - 1]
    if (last && Math.abs(last.top - it.top) < 4) { last.idx.push(i); last.w += it.w } else rows.push({ top: it.top, idx: [i], w: it.w })
  })
  const keep = rows.slice(0, max)
  if (keep.length > 1 && keep[keep.length - 1].w < width * 0.85) keep.pop()
  const shown = new Set(keep.flatMap((r) => r.idx))
  return items.map((_, i) => i).filter((i) => !shown.has(i))
}

export function initReviewWall() {
  const walls = [...document.querySelectorAll('[data-rvw]')]
  if (!walls.length) return
  const small = matchMedia('(max-width: 767px)')
  walls.forEach((wall, n) => {
    if (!wall.id) wall.id = `rvw-${n}`
    const grid = wall.querySelector('.rvw__grid')
    const items = [...wall.querySelectorAll('li.rvw__ph')]
    const fit = () => {
      items.forEach((li) => { li.hidden = false })
      const box = grid.getBoundingClientRect()
      const hide = new Set(rowsToHide(items.map((li) => { const b = li.getBoundingClientRect(); return { top: b.top, w: b.width } }), box.width, MAX_ROWS))
      items.forEach((li, i) => { li.hidden = hide.has(i) })
    }
    fit()
    let t = 0
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150) })
    initLightbox(`#${wall.id}`, 'li.rvw__ph', 'ภาพลูกค้าใส่เสื้อทีมดี')
  })
}
