/* dropdown เมนูหลัก เปิดได้ทั้งคลิกและ hover
   คลิกคือทางหลัก เพราะ hover อย่างเดียวจะปิดเองเวลาเมาส์เลื่อนออกนิดเดียว
   และบนจอสัมผัสไม่มี hover ให้ใช้
   คีย์บอร์ด: ลูกศรลงที่ปุ่ม = เปิดแล้วไปข้อแรก · ในเมนูใช้ลูกศรขึ้นลง Home End · Esc ปิดแล้วกลับไปที่ปุ่ม */
export function initNav() {
  const roots = [...document.querySelectorAll('[data-mega-root]')]

  const close = (root) => {
    const btn = root.querySelector('[data-mega-btn]')
    const panel = root.querySelector('[data-mega-panel]')
    btn.setAttribute('aria-expanded', 'false')
    panel.hidden = true
  }
  const open = (root) => {
    for (const r of roots) if (r !== root) close(r)
    const btn = root.querySelector('[data-mega-btn]')
    const panel = root.querySelector('[data-mega-panel]')
    btn.setAttribute('aria-expanded', 'true')
    panel.hidden = false
  }
  const isOpen = (root) => root.querySelector('[data-mega-btn]').getAttribute('aria-expanded') === 'true'
  const links = (root) => [...root.querySelectorAll('[data-mega-panel] a[href]')]

  /* บอกว่าตอนนี้อยู่หน้าไหนในเมนู · เทียบ path ไม่สนใจ ?query กับ #หัวข้อ */
  for (const a of document.querySelectorAll('[data-mega-panel] a[href]')) {
    if (new URL(a.href, location.href).pathname === location.pathname) a.setAttribute('aria-current', 'page')
  }

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  let timer

  for (const root of roots) {
    const btn = root.querySelector('[data-mega-btn]')
    btn.addEventListener('click', () => {
      isOpen(root) ? close(root) : open(root)
    })
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      open(root)
      const list = links(root)
      list[e.key === 'ArrowDown' ? 0 : list.length - 1]?.focus()
    })
    root.querySelector('[data-mega-panel]').addEventListener('keydown', (e) => {
      const list = links(root)
      const at = list.indexOf(document.activeElement)
      const go = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: list.length - 1 }[e.key]
      if (go === undefined) return
      e.preventDefault()
      list[(go + list.length) % list.length]?.focus()
    })
    /* hover เป็นของแถม มีหน่วงกันเมนูกระพริบตอนเมาส์ผ่าน */
    root.addEventListener('pointerenter', () => {
      if (!fine.matches) return
      clearTimeout(timer)
      timer = setTimeout(() => open(root), 100)
    })
    root.addEventListener('pointerleave', () => {
      if (!fine.matches) return
      clearTimeout(timer)
      timer = setTimeout(() => close(root), 300)
    })
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    for (const r of roots) if (isOpen(r)) { close(r); r.querySelector('[data-mega-btn]').focus() }
    const mm = document.getElementById('mobileMenu')
    if (mm && !mm.hidden) closeMobile()
  })
  document.addEventListener('click', (e) => {
    for (const r of roots) if (isOpen(r) && !r.contains(e.target)) close(r)
  })
  document.addEventListener('focusin', (e) => {
    for (const r of roots) if (isOpen(r) && !r.contains(e.target)) close(r)
  })

  /* เมนูมือถือเต็มจอ */
  const menu = document.getElementById('mobileMenu')
  const openBtn = document.querySelector('[data-menu-open]')
  function closeMobile() {
    menu.hidden = true
    document.body.style.overflow = ''
    openBtn?.setAttribute('aria-expanded', 'false')
    openBtn?.focus()
  }
  if (menu && openBtn) {
    openBtn.addEventListener('click', () => {
      menu.hidden = false
      document.body.style.overflow = 'hidden'
      openBtn.setAttribute('aria-expanded', 'true')
      menu.querySelector('[data-menu-close]')?.focus()
    })
    menu.querySelector('[data-menu-close]')?.addEventListener('click', closeMobile)
  }
}
