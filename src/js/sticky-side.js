/* การ์ดข้างที่ติดตามเวลาเลื่อน [data-sticky] (หน้าติดต่อ · ใบประเมินหน้าคำนวณ · อาร์ต 26 ต.ค. "บนๆการ์ดเวลาเลื่อนไม่หาย") · มีเทส tests/sticky-side.test.js
   ระยะติดคำนวณจากขอบล่างหัวเว็บจริง (สูงไม่เท่ากันตามจอ และมีแถบ WordPress ตอนล็อกอิน) แทนค่าตายตัว
   การ์ดสูงกว่าที่เหลือในจอ = ติดด้วยขอบล่าง เลื่อนจนเห็นท้ายการ์ดก่อนค่อยติด ไม่โดนตัดท้าย */
export const stickyTop = ({ header, viewport, height, gap = 16 }) => {
  const h = Number.isFinite(header) ? header : 0
  return Math.round(Math.min(h + gap, viewport - height - gap))
}

/** ขอบล่างหัวเว็บที่แถบติดใต้หัวเว็บใช้ · หัวเว็บกำลังหลบ (มือถือ header-hide.js) = 0 แม้ยังเลื่อนออกไม่หมด
    2 พ.ย.: เดิมวัดตอนกำลังเลื่อน ค้าง 35–65px เป็นช่องว่างเหนือสารบัญ */
export const headerEdge = (bottom, hidden) => (hidden ? 0 : Math.max(0, Math.round(bottom)))

export function initSticky() {
  const els = [...document.querySelectorAll('[data-sticky]')]
  const hdr = document.querySelector('[data-header]')
  /* --hdr-b = ขอบล่างหัวเว็บจริง ให้แถบที่ติดใต้หัวเว็บใช้ (แถบตัวกรองหน้าแบบเสื้อ) */
  const update = () => {
    const root = document.documentElement
    const header = headerEdge(hdr ? hdr.getBoundingClientRect().bottom : 0, root.classList.contains('hdr-hidden'))
    root.style.setProperty('--hdr-b', `${header}px`)
    for (const el of els) {
      /* จอเล็ก CSS เลิกติด (position static/relative) ก็ไม่ต้องตั้ง */
      if (getComputedStyle(el).position !== 'sticky') { el.style.top = ''; continue }
      el.style.top = `${stickyTop({ header, viewport: window.innerHeight, height: el.offsetHeight })}px`
    }
  }
  update()
  addEventListener('resize', update, { passive: true })
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(update)
    for (const el of els) ro.observe(el)
    if (hdr) ro.observe(hdr)
  }
}
