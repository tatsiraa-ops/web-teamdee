const clamp = n => Math.min(1, Math.max(0, n))
const ease = n => n * n * (3 - 2 * n)

// One persistent composition: five images move into three use categories.
export function initPrintStory(smoothScroll) {
  const track = document.querySelector('[data-print-track]')
  if (!track) return
  const root = track.closest('.ps')
  const stage = track.querySelector('.ps-stage')
  const intro = track.querySelector('[data-print-intro]')
  const heading = track.querySelector('[data-print-group]')
  const links = track.querySelector('[data-print-links]')
  const button = track.querySelector('[data-print-arrange]')
  const header = document.querySelector('[data-header]')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let enabled = false, queued = false, start = 0, distance = 1, previous = -1

  function update() {
    queued = false
    if (!enabled || document.documentElement.dataset.heroMode === 'classic') return
    const p = clamp((scrollY - start) / distance)
    if (p === previous) return
    previous = p
    const t = ease(clamp((p - .12) / .64))
    root.style.setProperty('--arrange', t.toFixed(4))
    root.style.setProperty('--intro-opacity', (1 - clamp(t / .4)).toFixed(3))
    root.style.setProperty('--group-opacity', clamp((t - .6) / .4).toFixed(3))
    const grouped = t > .8
    intro.inert = t > .4
    intro.setAttribute('aria-hidden', String(t > .4))
    links.inert = !grouped
    links.setAttribute('aria-hidden', String(!grouped))
    heading.setAttribute('aria-hidden', String(!grouped))
    if (root.dataset.arranged !== String(grouped)) {
      root.dataset.arranged = String(grouped)
      button.innerHTML = grouped ? 'กลับไปภาพรวม <span>↑</span>' : 'ดูเสื้อที่เข้ากับงานของคุณ <span>↓</span>'
    }
  }
  function request() {
    if (!queued) { queued = true; requestAnimationFrame(update) }
  }
  function measure() {
    const height = header?.getBoundingClientRect().height || 77
    root.style.setProperty('--ps-header', height + 'px')
    enabled = !reduced.matches && innerWidth >= 1000 && innerHeight - height >= 570
    root.classList.toggle('is-enhanced', enabled)
    start = scrollY + track.getBoundingClientRect().top - height
    distance = Math.max(1, track.offsetHeight - stage.offsetHeight)
    previous = -1
    if (!enabled) {
      intro.inert = links.inert = false
      intro.removeAttribute('aria-hidden')
      links.removeAttribute('aria-hidden')
      heading.removeAttribute('aria-hidden')
    }
    request()
  }
  button.addEventListener('click', () => {
    const top = start + (root.dataset.arranged === 'true' ? 0 : .86) * distance
    if (smoothScroll) smoothScroll.scrollTo(top, { duration: 1.1, lerp: undefined })
    else window.scrollTo({ top, behavior: 'smooth' })
  })
  addEventListener('scroll', request, { passive: true })
  addEventListener('resize', measure)
  reduced.addEventListener('change', measure)
  if (header) new ResizeObserver(measure).observe(header)
  new MutationObserver(measure).observe(document.documentElement, { attributes: true, attributeFilter: ['data-hero-mode'] })
  document.fonts.ready.then(measure)
  measure()
}
