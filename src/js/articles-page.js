import './page.js'

/* ตัวกรองหมวดบทความ · กดชิปเดียวต่อครั้ง เก็บสถานะไว้ใน URL */
const bar = document.getElementById('artFilter')
const grid = document.getElementById('artGrid')
const count = document.getElementById('artCount')
const empty = document.getElementById('artEmpty')

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
    if (count) count.textContent = cat === 'all' ? `แสดง ${shown} เรื่อง` : `พบ ${shown} เรื่องในหมวดนี้`
    if (empty) empty.classList.toggle('hidden', shown > 0)
  }

  const readUrl = () => {
    const v = new URLSearchParams(location.search).get('cat')
    cat = v && ok.has(v) ? v : 'all'
    render()
  }

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      if (cat === c.dataset.cat) return
      cat = c.dataset.cat
      render()
      const p = new URLSearchParams(location.search)
      if (cat === 'all') p.delete('cat')
      else p.set('cat', cat)
      history.pushState(null, '', location.pathname + (p.toString() ? `?${p}` : ''))
    }),
  )

  addEventListener('popstate', readUrl)
  readUrl()
}
