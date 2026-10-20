import './page.js'
import { initLightbox } from './lightbox.js'

/* แกลเลอรีแบบเสื้อ · ค้นหา + กรอง 4 แกน + โหลดเพิ่ม
   สถานะทั้งหมดเก็บใน URL เพื่อให้ทีมขายก๊อปลิงก์ส่งลูกค้าได้ตรงชุดที่กรองไว้
   และตอนปิดรูปใหญ่กลับมา ตัวกรองกับตำแหน่งเลื่อนต้องอยู่ที่เดิม (Brief ข้อ 06) */

const AXES = ['product', 'use', 'style', 'color']
const PAGE = 12

const grid = document.getElementById('designGrid')
const bar = document.getElementById('designFilter')
const count = document.getElementById('designCount')
const empty = document.getElementById('designEmpty')
const moreBtn = document.getElementById('designMore')
const input = document.getElementById('dq')

if (grid && bar) {
  const items = [...grid.children].map((el) => ({
    el,
    tags: Object.fromEntries(AXES.map((a) => [a, (el.dataset[a] || '').trim().split(/\s+/).filter(Boolean)])),
    text: (el.dataset.text || '').toLowerCase(),
  }))
  const chips = [...bar.querySelectorAll('[data-f]')]
  const valid = Object.fromEntries(
    AXES.map((a) => [a, new Set(chips.filter((c) => c.dataset.f === a).map((c) => c.dataset.v))]),
  )

  const state = Object.fromEntries(AXES.map((a) => [a, 'all']))
  let q = ''
  let shown = PAGE

  const matches = (it) => {
    if (q && !it.text.includes(q)) return false
    return AXES.every((a) => state[a] === 'all' || it.tags[a].includes(state[a]))
  }

  const render = () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(state[c.dataset.f] === c.dataset.v)))

    const hits = items.filter(matches)
    items.forEach((it) => (it.el.hidden = true))
    hits.slice(0, shown).forEach((it) => (it.el.hidden = false))

    const clean = AXES.every((a) => state[a] === 'all') && !q
    if (count) {
      count.textContent = hits.length === 0
        ? 'ไม่พบแบบที่ตรงกับที่เลือก'
        : clean
          ? `แสดง ${Math.min(shown, hits.length)} จาก ${hits.length} แบบ`
          : `พบ ${hits.length} แบบ แสดง ${Math.min(shown, hits.length)} แบบ`
    }
    if (empty) empty.classList.toggle('hidden', hits.length > 0)
    if (moreBtn) moreBtn.hidden = hits.length <= shown
    const reset = document.getElementById('designReset')
    if (reset) reset.hidden = clean
  }

  const readUrl = () => {
    const p = new URLSearchParams(location.search)
    AXES.forEach((a) => {
      const v = p.get(a)
      state[a] = v && valid[a].has(v) ? v : 'all'
    })
    q = (p.get('q') || '').trim().toLowerCase()
    if (input) input.value = p.get('q') || ''
    shown = Math.max(PAGE, Number(p.get('n')) || PAGE)
    render()
  }

  const writeUrl = (push) => {
    const p = new URLSearchParams(location.search)
    AXES.forEach((a) => (state[a] === 'all' ? p.delete(a) : p.set(a, state[a])))
    if (q) p.set('q', q)
    else p.delete('q')
    if (shown > PAGE) p.set('n', String(shown))
    else p.delete('n')
    const url = location.pathname + (p.toString() ? `?${p}` : '')
    history[push ? 'pushState' : 'replaceState'](null, '', url)
  }

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      if (state[c.dataset.f] === c.dataset.v) return
      state[c.dataset.f] = c.dataset.v
      shown = PAGE
      render()
      writeUrl(true)
    }),
  )

  const clearAll = () => {
    AXES.forEach((a) => (state[a] = 'all'))
    q = ''
    if (input) input.value = ''
    shown = PAGE
    render()
    writeUrl(true)
  }
  document.getElementById('designReset')?.addEventListener('click', clearAll)
  document.getElementById('designReset2')?.addEventListener('click', clearAll)

  moreBtn?.addEventListener('click', () => {
    shown += PAGE
    render()
    writeUrl(false)
  })

  /* ค้นหาแบบพิมพ์ไปกรองไป ไม่ต้องกดปุ่ม แต่ไม่เขียน URL ทุกตัวอักษร
     กันไม่ให้ประวัติเบราว์เซอร์เต็มไปด้วยคำค้นครึ่งคำ */
  let timer
  const onType = () => {
    q = input.value.trim().toLowerCase()
    shown = PAGE
    render()
    clearTimeout(timer)
    timer = setTimeout(() => writeUrl(false), 400)
  }
  input?.addEventListener('input', onType)
  document.getElementById('designSearch')?.addEventListener('submit', () => {
    onType()
    writeUrl(true)
  })

  addEventListener('popstate', readUrl)
  readUrl()
}

initLightbox('#designGrid', 'figure', 'ดูแบบเสื้อขนาดใหญ่')
