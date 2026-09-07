import './page.js'
import { initLightbox } from './lightbox.js'

/* ตัวกรองหมวดรูปลูกค้า กดชิปเดียวต่อครั้ง เก็บสถานะไว้ใน URL เหมือนหน้าผลงาน */
const bar = document.getElementById('custFilter')
const grid = document.getElementById('custGrid')
const count = document.getElementById('custCount')
const empty = document.getElementById('custEmpty')

if (bar && grid) {
  const chips = [...bar.querySelectorAll('[data-cat]')]
  const items = [...grid.children]
  const ok = new Set(chips.map((c) => c.dataset.cat))
  let cat = 'all'

  const render = () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === cat)))
    let shown = 0
    items.forEach((el) => {
      const on = cat === 'all' || el.dataset.cat === cat
      el.hidden = !on
      if (on) shown++
    })
    if (count) count.textContent = cat === 'all' ? `แสดง ${shown} ภาพ` : `พบ ${shown} ภาพในหมวดนี้`
    if (empty) empty.classList.toggle('hidden', shown > 0)
  }

  const readUrl = () => {
    const v = new URLSearchParams(location.search).get('cat')
    cat = v && ok.has(v) ? v : 'all'
    render()
  }

  const writeUrl = () => {
    const q = new URLSearchParams(location.search)
    if (cat === 'all') q.delete('cat')
    else q.set('cat', cat)
    history.pushState(null, '', location.pathname + (q.toString() ? `?${q}` : '') + location.hash)
  }

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      if (cat === c.dataset.cat) return
      cat = c.dataset.cat
      render()
      writeUrl()
    }),
  )

  window.addEventListener('popstate', readUrl)
  readUrl()
}

initLightbox('#custGrid', 'li', 'ดูรูปลูกค้าขนาดใหญ่')
