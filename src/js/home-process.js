/** Native desktop scroll follows the three chapters; explicit selection always works. */
export function initHomeProcess() {
  const root = document.querySelector('[data-home-process]')
  if (!root) return
  const buttons = [...root.querySelectorAll('[data-process-step]')]
  const panels = buttons.map(button => document.getElementById(button.dataset.processStep))
  if (!buttons.length || panels.some(panel => !panel)) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const desktop = matchMedia('(min-width: 1000px) and (min-height: 700px)')
  const mobile = matchMedia('(max-width: 999px)')
  const number = root.querySelector('[data-process-number]')
  let active = -1
  let frame = 0
  let inView = false
  let scrollChoice = -1
  let animation
  const select = index => {
    if (index === active) return
    // Do not hide a focused lightbox trigger when a scroll chapter changes.
    if (active >= 0 && panels[active].contains(document.activeElement)) return
    animation?.cancel()
    active = index
    buttons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === index))
      panels[i].hidden = !mobile.matches && i !== index
    })
    if (number) number.textContent = String(index + 1).padStart(2, '0')
    root.style.setProperty('--process-progress', `${(index + 1) / buttons.length * 100}%`)
    if (!mobile.matches && !reduced.matches && panels[index].animate) {
      animation = panels[index].animate([{ opacity: .25, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 380, easing: 'ease-out' })
    }
  }
  const update = () => {
    frame = 0
    if (!inView || !desktop.matches || reduced.matches) return
    const line = innerHeight * .52
    let nearest = 0
    let distance = Infinity
    buttons.forEach((button, index) => {
      const rect = button.getBoundingClientRect()
      const next = Math.abs(rect.top + rect.height / 2 - line)
      if (next < distance) { distance = next; nearest = index }
    })
    // Manual choices persist until the reader moves into another chapter.
    if (nearest !== scrollChoice) { scrollChoice = nearest; select(nearest) }
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
  const syncMode = () => {
    root.classList.toggle('is-scroll-story', desktop.matches && !reduced.matches)
    panels.forEach((panel, index) => { panel.hidden = !mobile.matches && index !== active })
    scrollChoice = -1
    if (reduced.matches) animation?.cancel()
    schedule()
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index))
    button.addEventListener('keydown', event => {
      const target = { ArrowDown: (index + 1) % buttons.length, ArrowUp: (index + buttons.length - 1) % buttons.length, Home: 0, End: buttons.length - 1 }[event.key]
      if (target === undefined) return
      event.preventDefault()
      select(target)
      buttons[target].focus()
    })
  })
  select(0)
  mobile.addEventListener('change', syncMode)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) schedule() }).observe(root)
    addEventListener('scroll', () => { if (inView) schedule() }, { passive: true })
    addEventListener('resize', schedule)
    desktop.addEventListener('change', syncMode)
    reduced.addEventListener('change', syncMode)
    syncMode()
  }
}
