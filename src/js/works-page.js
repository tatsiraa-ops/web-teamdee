import './page.js'
import { initLightbox } from './lightbox.js'

/* ตัวกรองแบบเสื้อ กรองสองแกนพร้อมกัน ประเภทเสื้อ x เทคนิค
   สถานะเก็บไว้ใน URL ด้วย จะได้ก๊อปลิงก์หมวดส่งให้ลูกค้าได้ และปุ่มย้อนกลับของเบราว์เซอร์ใช้ได้จริง */
const bar = document.getElementById('designFilter')
const grid = document.getElementById('designGrid')
const count = document.getElementById('designCount')
const empty = document.getElementById('designEmpty')
const reset = document.getElementById('designReset')

if (bar && grid) {
  const chips = [...bar.querySelectorAll('[data-f]')]
  const items = [...grid.children]
  const valid = (f) => new Set(chips.filter((c) => c.dataset.f === f).map((c) => c.dataset.v))
  const ok = { garment: valid('garment'), tech: valid('tech') }
  const state = { garment: 'all', tech: 'all' }

  const render = () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(state[c.dataset.f] === c.dataset.v)))

    let shown = 0
    items.forEach((el) => {
      const on =
        (state.garment === 'all' || el.dataset.garment === state.garment) &&
        (state.tech === 'all' || el.dataset.tech === state.tech)
      el.hidden = !on
      if (on) shown++
    })

    const clean = state.garment === 'all' && state.tech === 'all'
    if (count) count.textContent = clean ? `แสดง ${shown} แบบ` : `พบ ${shown} แบบที่ตรงกับตัวกรอง`
    if (empty) empty.classList.toggle('hidden', shown > 0)
    if (reset) reset.hidden = clean
  }

  const readUrl = () => {
    const q = new URLSearchParams(location.search)
    for (const key of ['garment', 'tech']) {
      const v = q.get(key)
      state[key] = v && ok[key].has(v) ? v : 'all'
    }
    render()
  }

  const writeUrl = (push) => {
    const q = new URLSearchParams(location.search)
    for (const key of ['garment', 'tech']) {
      if (state[key] === 'all') q.delete(key)
      else q.set(key, state[key])
    }
    const url = location.pathname + (q.toString() ? `?${q}` : '') + location.hash
    history[push ? 'pushState' : 'replaceState'](null, '', url)
  }

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      if (state[c.dataset.f] === c.dataset.v) return
      state[c.dataset.f] = c.dataset.v
      render()
      writeUrl(true)
    }),
  )

  reset?.addEventListener('click', () => {
    state.garment = 'all'
    state.tech = 'all'
    render()
    writeUrl(true)
  })

  window.addEventListener('popstate', readUrl)
  readUrl()
}

initLightbox('#designGrid', 'figure', 'ดูแบบเสื้อขนาดใหญ่')
