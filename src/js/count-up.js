/* สถิติหน้าแรก วิ่งนับขึ้นตอนเลื่อนมาเห็น (อาร์ต 23 ต.ค.: "animated เต็มที่ เอาให้ว้าวๆ")
   ตัวเลขจริงอยู่ใน HTML เสมอ (ไม่มี JS / โปรแกรมอ่านหน้าจอเห็นค่าจริง) · ตั้งค่าลดการเคลื่อนไหว = ไม่นับ โชว์ค่าจริงทันที */

/** "2,800+ องค์กร" → { n: 2800, plus: '+', unit: 'องค์กร' } · ไม่ใช่ตัวเลข = null */
export const parseStat = (s) => {
  const m = /^\s*([\d,]+)(\+?)\s*(.*)$/.exec(String(s ?? ''))
  return m ? { n: Number(m[1].replace(/,/g, '')), plus: m[2], unit: m[3].trim() } : null
}

/** ตัวเลขที่ progress 0–1 (เกิน 1 = ค่าจริง) · มีคอมม่าแบบ en-US เหมือนค่าจริง */
export const statAt = (s, p) => Math.round(s.n * Math.min(1, Math.max(0, p))).toLocaleString('en-US')

/** expo out · พุ่งเร็วแล้วค่อยๆ เข้าเป้า ให้ความรู้สึกตัวเลขใหญ่ */
export const easeOut = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

/** จังหวะนับ (ms) · 17 พ.ย. 2026 จากรอบตรวจ UI: เดิม 2200 + เหลื่อม 220 คนเลื่อนผ่านเร็วเห็นตัวเลขค้างครึ่งทาง */
export const COUNT_MS = { desktop: 1400, mobile: 650, stagger: 120 }

export function initCountUp(root = document) {
  const box = root.querySelector('[data-countup]')
  if (!box) return
  const items = [...box.querySelectorAll('[data-stat]')].map((el) => ({ el, s: parseStat(el.dataset.stat), num: el.querySelector('[data-stat-n]') })).filter((x) => x.s && x.num)
  if (!items.length) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { box.classList.add('is-done'); return }
  const mobile = matchMedia('(max-width: 767px)').matches
  items.forEach(({ s, num }) => { num.textContent = statAt(s, mobile ? 1 : 0) })
  box.classList.add('is-armed')
  const DUR = mobile ? COUNT_MS.mobile : COUNT_MS.desktop
  const io = new IntersectionObserver((list) => {
    if (!list.some((e) => e.isIntersecting)) return
    io.disconnect()
    box.classList.add('is-run')
    const t0 = performance.now()
    const frame = (now) => {
      let busy = false
      items.forEach(({ s, num, el }, i) => {
        const t = (now - t0 - i * (mobile ? 0 : COUNT_MS.stagger)) / DUR
        num.textContent = statAt(s, mobile ? .85 + .15 * easeOut(Math.max(0, t)) : easeOut(Math.max(0, t)))
        if (t >= 1) el.classList.add('is-hit')
        else busy = true
      })
      if (busy) requestAnimationFrame(frame)
      else box.classList.add('is-done')
    }
    requestAnimationFrame(frame)
  }, { threshold: 0.3 })
  io.observe(box)
}
