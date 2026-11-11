/* /sublimation/ "ออกแบบให้เป็นทีมคุณ" (partials/pp2Custom.hbs) · รอบ 124
   วาดเส้นโยงจากการ์ด (สี · โลโก้ · ข้อความ · กราฟิก) ไปจุดบนเสื้อ · ไม่มีการกด ไม่มีแอนิเมชัน
   จอแคบ (การ์ดเรียงใต้เสื้อ) ไม่วาดเส้น · ไม่มี JS = เห็นจุดบนเสื้ออย่างเดียว */

/** เส้นจากขอบการ์ด a → จุด b: ออกแนวนอนครึ่งทาง แล้วหักตรงเข้าหาจุด */
export function dzPath(a, b) {
  if (Math.abs(a.y - b.y) < 1) return `M${Math.round(a.x)} ${Math.round(a.y)}H${Math.round(b.x)}`
  const mid = Math.round(a.x + (b.x - a.x) / 2)
  return `M${Math.round(a.x)} ${Math.round(a.y)}H${mid}L${Math.round(b.x)} ${Math.round(b.y)}`
}

/** ความสูงที่เส้นออกจากการ์ด: ระดับเดียวกับจุดถ้าอยู่ในช่วงการ์ด (เส้นตรง) · ไม่งั้นชิดขอบบน/ล่างเว้น 30px */
export function dzAnchorY(top, bottom, dotY, pad = 30) {
  return Math.min(bottom - pad, Math.max(top + pad, dotY))
}

/* 10 พ.ย. หน้ามีแผนผัง 2 ชุด (สี โลโก้ ข้อความ กราฟิก · โครงเสื้อ คอ แขน ผ้า ทรง) → วาดเส้นทุกชุด */
export function initCustomize(root = document) {
  root.querySelectorAll('[data-dz]').forEach(initOne)
}

function initOne(dz) {
  const svg = dz.querySelector('.dz__lines')
  const wide = matchMedia('(min-width: 1100px)')
  const draw = () => {
    svg.replaceChildren()
    if (!wide.matches) return
    const box = dz.getBoundingClientRect()
    svg.setAttribute('viewBox', `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`)
    const hero = dz.querySelector('.dz__hero')?.getBoundingClientRect()
    for (const card of dz.querySelectorAll('[data-card]')) {
      const dot = dz.querySelector(`[data-dot="${card.dataset.card}"]`)
      if (!dot) continue
      const c = card.getBoundingClientRect(), d = dot.getBoundingClientRect()
      /* 10 พ.ย. การ์ดแถวล่าง (คอ แขน ผ้า ทรง) อยู่ใต้เสื้อ → ไม่ลากเส้นผ่านตัวเสื้อ ใช้เลขบนเสื้อจับคู่แทน */
      if (hero && c.top >= hero.bottom - 40) continue
      const to = { x: d.left + d.width / 2 - box.left, y: d.top + d.height / 2 - box.top }
      const onLeft = c.left + c.width / 2 - box.left < to.x
      const from = { x: (onLeft ? c.right : c.left) - box.left, y: dzAnchorY(c.top - box.top, c.bottom - box.top, to.y) }
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', dzPath(from, to))
      p.dataset.line = card.dataset.card
      const end = document.createElementNS('http://www.w3.org/2000/svg', 'circle') // หัวเส้นที่ขอบการ์ด
      end.setAttribute('cx', Math.round(from.x)); end.setAttribute('cy', Math.round(from.y)); end.setAttribute('r', 5)
      end.dataset.line = card.dataset.card
      svg.append(p, end)
    }
  }
  /* ชี้การ์ด = เส้นและจุดของเรื่องนั้นเด่นขึ้น */
  dz.addEventListener('pointerover', (e) => { dz.dataset.on = e.target.closest?.('[data-card]')?.dataset.card || '' })
  dz.addEventListener('pointerleave', () => { dz.dataset.on = '' })
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(dz)
  wide.addEventListener?.('change', draw)
  dz.querySelectorAll('img').forEach((i) => i.complete || i.addEventListener('load', draw, { once: true }))
  draw()
}
