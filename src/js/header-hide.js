/* มือถือ: หัวเว็บหลบตอนเลื่อนลง โผล่ตอนเลื่อนขึ้น (ตรวจมือถือ 30 ต.ค. · แถบลอยบังจอ 33–48%) · มีเทส tests/header-hide.test.js
   CSS main.css html.hdr-hidden (เฉพาะจอ < 768) · แถบที่ติดใต้หัวเว็บใช้ --hdr-b จึงตั้งค่านี้ตามไปด้วย ไม่ให้ค้างช่องว่าง */

const SLOP = 8

/** หลบหรือโผล่รอบนี้ · ใกล้บนสุด/เมนูเปิด = โผล่ · ขยับน้อยกว่า SLOP = คงเดิม */
export function nextHidden({ y, lastY, hidden, header, menuOpen }) {
  if (menuOpen || y <= header) return false
  const d = y - lastY
  if (Math.abs(d) <= SLOP) return hidden
  return d > 0
}

/** ตัวที่โฟกัสอยู่ใต้หัวเว็บที่ติดบน → ระยะเลื่อน (ติดลบ = ขึ้น) ให้พ้นขอบล่างหัวเว็บ + 16px · ไม่ถูกบัง = 0 (17 พ.ย. WCAG 2.4.11) */
export function uncoverDelta(rect, headerBottom) {
  if (headerBottom <= 0 || rect.bottom <= 0 || rect.top >= headerBottom) return 0
  return rect.top - headerBottom - 16
}

export function initHeaderHide() {
  const hdr = document.querySelector('[data-header]')
  if (!hdr) return
  const mq = matchMedia('(max-width: 767px)')
  const root = document.documentElement
  let lastY = scrollY
  let hidden = false
  let ticking = false
  const set = (on) => {
    if (on === hidden) return
    hidden = on
    root.classList.toggle('hdr-hidden', on)
    root.style.setProperty('--hdr-b', `${on ? 0 : Math.round(hdr.offsetHeight)}px`)
  }
  const check = () => {
    ticking = false
    /* แนวนอนหัวเว็บไม่ติดจอ (position relative) · จอใหญ่ไม่หลบ */
    if (!mq.matches || getComputedStyle(hdr).position !== 'sticky') { set(false); lastY = scrollY; return }
    const menuOpen = !!document.querySelector('#mobileMenu:not([hidden])') || hdr.contains(document.activeElement)
    set(nextHidden({ y: scrollY, lastY, hidden, header: hdr.offsetHeight, menuOpen }))
    lastY = scrollY
  }
  /* กด Tab เข้าหัวเว็บที่หลบอยู่ ต้องโผล่ · โฟกัสห้ามไปอยู่ของที่มองไม่เห็น (2 พ.ย.) */
  hdr.addEventListener('focusin', () => set(false))
  /* Shift+Tab ย้อนขึ้น: ตัวที่โฟกัสอยู่ในจอแต่ใต้หัวเว็บ เบราว์เซอร์ไม่เลื่อนให้ (scroll-padding ไม่ช่วยกรณีนี้) → เลื่อนเอง */
  document.addEventListener('focusin', (e) => {
    const t = e.target
    if (!(t instanceof Element) || hdr.contains(t) || t.closest('dialog, [role=dialog]') || !t.matches(':focus-visible')) return
    const pos = getComputedStyle(hdr).position
    if (pos !== 'sticky' && pos !== 'fixed') return
    const d = uncoverDelta(t.getBoundingClientRect(), hidden ? 0 : hdr.getBoundingClientRect().bottom)
    if (d) scrollBy({ top: d, behavior: 'instant' })
  })
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(check) } }, { passive: true })
  mq.addEventListener?.('change', check)
}
