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
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(check) } }, { passive: true })
  mq.addEventListener?.('change', check)
}
