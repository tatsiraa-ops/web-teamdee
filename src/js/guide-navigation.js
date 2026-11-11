import { currentGuideSection, guideSectionURL, guideHashID } from './guide-navigation-model.js'

/** Native anchors and open details provide the complete no-JavaScript reading path. */
export function initGuideNavigation() {
  document.querySelectorAll('.td-guide').forEach((guide) => {
    if (guide.dataset.guideReady) return
    const toc = guide.querySelector('#guideToc')
    const sections = [...guide.querySelectorAll('.guide-sec[id]')]
    if (!toc || !sections.length) return
    guide.dataset.guideReady = 'true'
    const byID = new Map(sections.map((section) => [section.id, section]))
    const links = [...toc.querySelectorAll('a[href^="#"]')]
    const label = guide.querySelector('[data-guide-current]')
    const details = toc.querySelector('details')
    const compact = matchMedia('(max-width: 767px)')
    const setDisclosure = () => { if (details) details.open = !compact.matches }
    setDisclosure()
    // A manual disclosure choice survives resizes within the same breakpoint.
    compact.addEventListener('change', setDisclosure)
    let positions = []
    let active = null
    const update = () => {
      const id = currentGuideSection(positions, scrollY, innerHeight, document.documentElement.scrollHeight)
      if (id === active) return
      /* สารบัญชุด ab-toc (data-toc) ไฮไลต์เองด้วย about-toc.js · ไม่ทำซ้ำ (27 ต.ค.) */
      if (toc.hasAttribute('data-toc')) { active = id; return }
      active = id
      links.forEach((link) => {
        if (guideHashID(link.hash) === id) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      })
      if (label) label.textContent = byID.get(id)?.querySelector('h2, h3')?.textContent.trim() || ''
    }
    const measure = () => {
      positions = sections.map((section) => ({ id: section.id, y: section.getBoundingClientRect().top + scrollY }))
      update()
    }
    const focusHash = (hash) => {
      const section = byID.get(guideHashID(hash))
      if (!section) return
      const target = section.querySelector('h2, h3') || section
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
      measure()
    }
    guide.addEventListener('click', (event) => {
      const anchor = event.target.closest('a[href^="#"]')
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (!byID.has(guideHashID(anchor.hash))) return
      // Collapse the mobile overlay before native fragment scrolling measures its destination.
      if (compact.matches && details?.contains(anchor)) details.open = false
      // Leave URL, history and scroll to the browser; move keyboard focus after it.
      setTimeout(() => focusHash(anchor.hash), 0)
    })
    addEventListener('hashchange', () => focusHash(location.hash))
    addEventListener('scroll', update, { passive: true })
    addEventListener('resize', measure, { passive: true })
    addEventListener('load', measure)
    guide.addEventListener('load', measure, true)
    guide.addEventListener('toggle', measure, true)
    if (document.fonts?.ready) document.fonts.ready.then(measure)
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(guide)
    guide.querySelectorAll('[data-guide-copy]').forEach((button) => {
      const id = button.dataset.guideCopy
      if (!byID.has(id)) return
      let status = button.parentElement.querySelector('[data-guide-copy-status]')
      if (!status) {
        status = document.createElement('span')
        status.dataset.guideCopyStatus = ''
        status.className = 'td-guide__copy-status'
        button.after(status)
      }
      status.setAttribute('role', 'status')
      status.setAttribute('aria-live', 'polite')
      button.hidden = false
      button.addEventListener('click', async () => {
        /* ระหว่างคัดลอกใช้ aria-disabled ไม่ใช้ disabled · disabled ทำให้โฟกัสหลุด (ตรวจละเอียด 30 ต.ค.) */
        if (button.getAttribute('aria-disabled') === 'true') return
        const url = guideSectionURL(location.href, id)
        button.setAttribute('aria-disabled', 'true')
        status.textContent = ''
        try {
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
          await navigator.clipboard.writeText(url)
          status.textContent = 'คัดลอกลิงก์หัวข้อนี้แล้ว'
        } catch {
          status.textContent = `คัดลอกอัตโนมัติไม่ได้ เลือกและคัดลอกลิงก์นี้: ${url}`
        } finally {
          button.removeAttribute('aria-disabled')
        }
      })
    })
    measure()
  })
}
