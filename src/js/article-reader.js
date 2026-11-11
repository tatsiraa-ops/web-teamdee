import { createHeadingId } from './article-heading-id.js'

/** Progressive enhancement: native links/details still work without this module. */
export function initArticleReader() {
  document.querySelectorAll('.td-reader').forEach((reader) => {
    if (reader.dataset.readerReady) return
    const content = reader.querySelector('[data-reader-content]')
    const nav = reader.querySelector('[data-reader-toc]')
    if (!content || !nav) return
    reader.dataset.readerReady = 'true'
    const headings = [...content.querySelectorAll('h2, h3')]
      .filter((heading) => heading.textContent.trim() && !heading.closest('[data-reader-exclude]'))
    if (!headings.length) {
      const toc = nav.closest('.td-reader__toc')
      if (toc) toc.hidden = true
      return
    }
    const toc = nav.closest('.td-reader__toc')
    if (toc) toc.hidden = false

    const occupied = new Set([...document.querySelectorAll('[id]')].map((el) => el.id))
    const list = document.createElement('ol')
    const links = headings.map((heading) => {
      if (!heading.id) heading.id = createHeadingId(heading.textContent, occupied)
      const item = document.createElement('li')
      if (heading.tagName === 'H3') item.className = 'td-reader__toc-sub'
      const link = document.createElement('a')
      link.href = `#${encodeURIComponent(heading.id)}`
      link.textContent = heading.textContent.trim()
      item.append(link)
      list.append(item)
      return link
    })
    nav.replaceChildren(list)

    let active = -1
    const update = () => {
      // Read the current geometry: late-loading CMS images can move headings.
      const line = Math.min(180, innerHeight * 0.25)
      let current = 0
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= line) current = index
      })
      if (current === active) return
      active = current
      links.forEach((link, index) => {
        if (index === current) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      })
    }
    let queued = false
    const schedule = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => { queued = false; update() })
    }
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule, { passive: true })
    addEventListener('hashchange', schedule)
    content.addEventListener('load', schedule, true)
    if (document.fonts?.ready) document.fonts.ready.then(schedule)
    update()
  })
}
