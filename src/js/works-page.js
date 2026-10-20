import './page.js'
import { initLightbox } from './lightbox.js'

/* ตัวกรองแบบเดียวกันสองชุดในหน้าเดียว
   ชุดบนกรองเคสงาน ชุดล่างกรองภาพจากหน้างาน แยกกันคนละ URL param */

/** กรองรายการด้วยชิปหลายแกน แล้วเก็บสถานะไว้ใน URL */
function initFilter({ barId, gridId, countId, emptyId, resetIds, axes, label }) {
  const bar = document.getElementById(barId)
  const grid = document.getElementById(gridId)
  if (!bar || !grid) return

  const countEl = document.getElementById(countId)
  const emptyEl = document.getElementById(emptyId)
  const chips = [...bar.querySelectorAll('[data-f],[data-cat]')]
  const key = (c) => c.dataset.f || 'cat'
  const items = [...grid.children]
  const valid = Object.fromEntries(axes.map((a) => [a, new Set(chips.filter((c) => key(c) === a).map((c) => c.dataset.v || c.dataset.cat))]))
  const state = Object.fromEntries(axes.map((a) => [a, 'all']))

  const render = () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(state[key(c)] === (c.dataset.v || c.dataset.cat))))
    let shown = 0
    items.forEach((el) => {
      const on = axes.every((a) => state[a] === 'all' || (el.dataset[a] || '') === state[a])
      el.hidden = !on
      if (on) shown++
    })
    const clean = axes.every((a) => state[a] === 'all')
    if (countEl) countEl.textContent = clean ? `แสดง ${shown} ${label}` : `พบ ${shown} ${label}`
    if (emptyEl) emptyEl.classList.toggle('hidden', shown > 0)
    resetIds.forEach((id) => {
      const b = document.getElementById(id)
      if (b) b.hidden = clean
    })
  }

  const readUrl = () => {
    const p = new URLSearchParams(location.search)
    axes.forEach((a) => {
      const v = p.get(a)
      state[a] = v && valid[a].has(v) ? v : 'all'
    })
    render()
  }

  const writeUrl = () => {
    const p = new URLSearchParams(location.search)
    axes.forEach((a) => (state[a] === 'all' ? p.delete(a) : p.set(a, state[a])))
    history.pushState(null, '', location.pathname + (p.toString() ? `?${p}` : ''))
  }

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      const k = key(c)
      const v = c.dataset.v || c.dataset.cat
      if (state[k] === v) return
      state[k] = v
      render()
      writeUrl()
    }),
  )
  resetIds.forEach((id) =>
    document.getElementById(id)?.addEventListener('click', () => {
      axes.forEach((a) => (state[a] = 'all'))
      render()
      writeUrl()
    }),
  )

  addEventListener('popstate', readUrl)
  readUrl()
}

initFilter({
  barId: 'workFilter', gridId: 'workGrid', countId: 'workCount', emptyId: 'workEmpty',
  resetIds: ['workReset', 'workReset2'], axes: ['use', 'product'], label: 'งาน',
})


initLightbox('#workGrid', 'figure', 'ดูภาพงานจริงขนาดใหญ่')
