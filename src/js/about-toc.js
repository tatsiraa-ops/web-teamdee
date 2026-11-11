/* สารบัญหน้ารู้จักทีมดี [data-toc] (26 ต.ค. "หน้านี้ต่อ" · หน้ายาว ~11,000px) · มีเทส tests/about-toc.test.js
   ติดใต้หัวเว็บ (CSS sticky top: --hdr-b) · ไฮไลต์ลิงก์ของส่วนที่อ่านอยู่ (aria-current) · แถบส้มบอกอ่านไปแล้วกี่ %
   มือถือ: เลื่อนลิงก์ที่ไฮไลต์ให้อยู่ในแถบ · ลดการเคลื่อนไหว = เลื่อนแบบไม่ลื่น */

/** ดัชนีส่วนที่อ่านอยู่ · tops = ตำแหน่งบนของแต่ละส่วนในหน้า · line = ตำแหน่งเส้นอ่าน (เลื่อน + ใต้แถบ) */
export const activeIndex = (tops, line) => {
  let at = -1
  tops.forEach((t, i) => { if (t <= line) at = i })
  return at
}

/** อ่านไปแล้ว 0–1 */
export const readProgress = ({ y, total, view }) => {
  const room = total - view
  if (room <= 0) return 1
  return Math.min(1, Math.max(0, y / room))
}

export function initToc() {
  const nav = document.querySelector('[data-toc]')
  if (!nav) return
  const links = [...nav.querySelectorAll('a[href^="#"]')]
  const secs = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean)
  if (!secs.length) return
  const row = nav.querySelector('.ab-toc__in')
  const cta = nav.querySelector('.ab-toc__cta')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let last = -2
  let queued = false
  const draw = () => {
    queued = false
    /* เส้นอ่าน = ใต้แถบลงมา 1 ใน 5 ของจอ (เดิม +24px ช้าไป 1 ส่วน เพราะกดลิงก์แล้วหัวส่วนหยุดต่ำกว่าแถบราว 40px) */
    const line = scrollY + nav.getBoundingClientRect().bottom + Math.min(180, innerHeight * 0.2)
    const i = activeIndex(secs.map((s) => s.getBoundingClientRect().top + scrollY), line)
    nav.style.setProperty('--p', String(readProgress({ y: scrollY, total: document.documentElement.scrollHeight, view: innerHeight })))
    const stuck = nav.getBoundingClientRect().top <= (parseFloat(getComputedStyle(nav).top) || 0) + 1
    nav.classList.toggle('is-stuck', stuck)
    /* ปุ่ม LINE ในแถบ (หน้าสินค้า) กดได้ / โฟกัสได้เฉพาะตอนโผล่ */
    if (cta) cta.tabIndex = stuck ? 0 : -1
    if (i === last) return
    last = i
    links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')))
    /* มือถือ: ลิงก์ที่ไฮไลต์อยู่นอกแถบ → เลื่อนแถบให้เห็น (ไม่เลื่อนหน้า) */
    const on = links[i]
    if (on && row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: on.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' })
  }
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(draw) } }
  addEventListener('scroll', ask, { passive: true })
  addEventListener('resize', ask, { passive: true })
  draw()
}
