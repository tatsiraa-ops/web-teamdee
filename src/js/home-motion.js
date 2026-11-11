/** One-shot entrances and a small photo offset; content stays visible without JS. */
export function initHomeMotion() {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const desktop = matchMedia('(min-width: 1000px)')
  const animations = new Set()
  const targets = [
    ...document.querySelectorAll('#services .hm-cats > li, #uses .hm-uses > li, #real-work .reference-work-grid > figure, .hm-journal__card, .hm-origin__photo'),
    ...document.querySelectorAll('#brand-expertise h2, #real-work h2, #process h2, #story h2, #home-stories h2'),
  ]
  const enter = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      enter.unobserve(entry.target)
      if (reduced.matches || (!desktop.matches && entry.target.tagName === 'H2')) continue
      const el = entry.target
      const heading = el.tagName === 'H2'
      const siblings = [...el.parentElement.children]
      const delay = !desktop.matches || heading ? 0 : (siblings.indexOf(el) % 4) * 75
      const animation = el.animate([
        { opacity: 0, transform: `translateY(${!desktop.matches ? 12 : heading ? 18 : 34}px)`, clipPath: 'inset(0 0 6% 0)' },
        { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' },
      ], { duration: !desktop.matches ? 420 : heading ? 650 : 850, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' })
      animations.add(animation)
      animation.finished.finally(() => animations.delete(animation)).catch(() => {})
    }
  }, { threshold: 0.12 })
  targets.forEach(el => enter.observe(el))

  const story = document.querySelector('.hm-brand-story__visual')
  const inset = document.querySelector('.hm-brand-story__team')
  let visible = false
  let frame = 0
  const update = () => {
    frame = 0
    if (!inset || !story) return
    if (reduced.matches || !desktop.matches) { inset.style.removeProperty('translate'); return }
    const rect = story.getBoundingClientRect()
    const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)))
    inset.style.translate = `0 ${(0.5 - progress) * 44}px`
  }
  const schedule = () => { if (visible && !frame) frame = requestAnimationFrame(update) }
  if (story && inset) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule() }).observe(story)
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
  }
  reduced.addEventListener('change', () => {
    if (reduced.matches) animations.forEach(animation => animation.cancel())
    update()
  })
  desktop.addEventListener('change', update)
}
