/* เมกะเมนู เปิดได้ทั้งคลิกและ hover
   คลิกคือทางหลัก เพราะ hover อย่างเดียวจะปิดเองเวลาเมาส์เลื่อนออกนิดเดียว
   และบนจอสัมผัสไม่มี hover ให้ใช้ */
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

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  let timer

  for (const root of roots) {
    root.querySelector('[data-mega-btn]').addEventListener('click', () => {
      isOpen(root) ? close(root) : open(root)
    })
    /* hover เป็นของแถม มีหน่วงกันเมนูกระพริบตอนเมาส์ผ่าน */
    root.addEventListener('pointerenter', () => {
      if (!fine.matches) return
      clearTimeout(timer)
      timer = setTimeout(() => open(root), 120)
    })
    root.addEventListener('pointerleave', () => {
      if (!fine.matches) return
      clearTimeout(timer)
      timer = setTimeout(() => close(root), 220)
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
