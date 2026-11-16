/* ผังเสื้อหน้า-หลังมีเส้นชี้ (16 พ.ย. 2026 อาร์ต "เอาเป็นตัวเสื้อหน้าหลัง และเอาแบบมีเส้นแล้วชี้ไปในแต่ละจุด") · partial shirtCallouts.hbs
   รอบ 2 (16 พ.ย. อาร์ต "แปลกๆ ไม่สวยเลย"): ป้ายวางระดับเดียวกับจุดที่ชี้ (placeLabels) · เส้นแนวนอนที่ระดับป้ายแล้วหักมุมเข้าจุด (calloutPath)
   คอม: JS ใส่ .is-placed ให้กล่อง แล้ววางป้ายแบบ absolute · มือถือ (CSS ซ่อนเส้น) = ภาพบน + รายการใต้ภาพ ไม่ต้องวาง
   ไม่มี JS = ป้ายเรียงเป็นคอลัมน์ข้างภาพ ไม่มีเส้น (ยังอ่านครบ) */

const STUB = 16

/** เส้นจากขอบป้าย (from) ไปจุดบนเสื้อ (to) · side = 'l' (ป้ายซ้ายภาพ) | 'r'
 *  ระดับเดียวกัน = เส้นตรง · ต่างระดับ = แนวนอนที่ระดับป้าย แล้วหักมุม 45° เข้าจุด (จุดใกล้ป้ายเกิน = ออกจากป้าย 16px แล้วเฉียงเข้าจุด)
 *  หักใกล้จุด: จุดระดับเดียวกันหลายจุด (อกซ้าย/อกขวา) เส้นไม่ทับจุดอื่น */
export function calloutPath(from, to, side) {
  const dir = side === 'l' ? 1 : -1
  const fx = Math.round(from.x), fy = Math.round(from.y), tx = Math.round(to.x), ty = Math.round(to.y)
  if (fy === ty) return `M${fx} ${fy} H${tx}`
  const x1 = fx + STUB * dir
  const bend = tx - Math.abs(ty - fy) * dir
  return `M${fx} ${fy} H${(bend - x1) * dir > 0 ? bend : x1} L${tx} ${ty}`
}

/** จุดกึ่งกลางแนวตั้งของป้ายแต่ละอัน (ลำดับเดียวกับ items)
 *  items [{ y: ระดับจุดที่ชี้, h: ความสูงป้าย }] · ไม่ชนกัน = ตรงระดับจุด · ชนกัน = รวมกลุ่มเรียงห่าง gap กลุ่มอยู่กลางจุดเฉลี่ย · ไม่ล้น min–max */
export function placeLabels(items, { gap = 12, min = 0, max = Infinity } = {}) {
  const order = items.map((it, i) => ({ ...it, i })).sort((a, b) => a.y - b.y)
  const lay = (c) => {
    let o = 0
    const offs = c.map((it) => { const at = o + it.h / 2; o += it.h + gap; return at })
    const total = o - gap
    const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length
    const start = Math.max(min, Math.min(max - total, mean(c.map((it) => it.y)) - mean(offs)))
    return { c, start, end: start + total, centers: offs.map((x) => start + x) }
  }
  let groups = order.map((it) => lay([it]))
  for (let k = 0; k < groups.length - 1;) {
    if (groups[k].end + gap > groups[k + 1].start) {
      groups.splice(k, 2, lay([...groups[k].c, ...groups[k + 1].c]))
      k = Math.max(0, k - 1)
    } else k++
  }
  const out = []
  for (const g of groups) g.c.forEach((it, j) => { out[it.i] = g.centers[j] })
  return out
}

export function initShirtCallouts(root = document) {
  for (const box of root.querySelectorAll('[data-sc]')) {
    const svg = box.querySelector('.sc__lines')
    const img = box.querySelector('.sc__fig img')
    if (!svg || !img) continue
    const items = [...box.querySelectorAll('.sc__item')]
    const draw = () => {
      const f = img.getBoundingClientRect()
      if (getComputedStyle(svg).display === 'none' || !f.width) {
        box.classList.remove('is-placed')
        for (const li of items) li.style.top = ''
        svg.replaceChildren()
        return
      }
      box.classList.add('is-placed')
      /* วางป้ายตามระดับจุด แยกคอลัมน์ซ้าย-ขวา */
      for (const col of box.querySelectorAll('.sc__col')) {
        const lis = [...col.querySelectorAll('.sc__item')]
        const c = col.getBoundingClientRect()
        const ys = placeLabels(lis.map((li) => ({ y: f.top - c.top + (f.height * Number(li.dataset.y)) / 100, h: li.offsetHeight })), { gap: 14, min: 0, max: c.height })
        lis.forEach((li, i) => { li.style.top = `${Math.round(ys[i] - li.offsetHeight / 2)}px` })
      }
      const b = box.getBoundingClientRect()
      svg.setAttribute('viewBox', `0 0 ${Math.round(b.width)} ${Math.round(b.height)}`)
      const paths = items.map((li) => {
        const side = li.closest('.sc__col--l') ? 'l' : 'r'
        const lab = li.firstElementChild.getBoundingClientRect()
        const from = { x: (side === 'l' ? lab.right : lab.left) - b.left, y: lab.top + lab.height / 2 - b.top }
        const to = { x: f.left - b.left + (f.width * Number(li.dataset.x)) / 100, y: f.top - b.top + (f.height * Number(li.dataset.y)) / 100 }
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        p.setAttribute('d', calloutPath(from, to, side))
        return p
      })
      svg.replaceChildren(...paths)
    }
    if (img.complete) draw()
    else img.addEventListener('load', draw, { once: true })
    new ResizeObserver(draw).observe(box)
  }
}
