import './page.js'
import { blogMatches } from './blog-model.js'
import { initArticleReader } from './article-reader.js'

/* หน้าบทความแนวนิตยสาร (27 ต.ค.) · พิมพ์ค้นหา = ซ่อนนิตยสาร โชว์กริดผลลัพธ์ · ล้างคำ = กลับเป็นนิตยสาร · คำค้นอยู่ใน ?q= (ส่งต่อได้) */
initArticleReader()
const form = document.getElementById('artSearch')
const grid = document.getElementById('artGrid')
if (form && grid) {
  const query = document.getElementById('artQuery')
  const count = document.getElementById('artCount')
  const empty = document.getElementById('artEmpty')
  const reset = document.getElementById('artReset')
  const mag = document.getElementById('artMag')
  const results = document.getElementById('article-library')
  const items = [...grid.children].map((el) => ({ el, title: el.dataset.title, excerpt: el.dataset.excerpt, cat: el.dataset.cat, catName: el.dataset.catName, topics: el.dataset.topics.split(' ') }))
  let timer
  const render = (q) => {
    const on = !!q
    let shown = 0
    items.forEach((item) => { const hit = blogMatches(item, { q }); item.el.hidden = !hit; if (hit) shown++ })
    mag.hidden = on
    results.hidden = !on
    reset.hidden = !on
    count.textContent = on ? `พบ ${shown} จาก ${items.length} เรื่อง สำหรับ “${q}”` : ''
    empty.hidden = !on || shown > 0
  }
  const writeUrl = (q) => {
    const u = new URL(location.href)
    if (q) u.searchParams.set('q', q)
    else u.searchParams.delete('q')
    history.replaceState(null, '', u.pathname + u.search + u.hash)
  }
  const run = () => { const q = query.value.trim(); render(q); writeUrl(q) }
  query.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 160) })
  form.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(timer); run(); results.scrollIntoView({ block: 'start', behavior: 'instant' }) })
  const clear = () => { clearTimeout(timer); query.value = ''; run(); query.focus({ preventScroll: true }) }
  reset.addEventListener('click', clear)
  document.querySelector('[data-art-clear]')?.addEventListener('click', clear)
  query.addEventListener('keydown', (e) => { if (e.key === 'Escape' && query.value) { e.preventDefault(); clear() } })
  const q0 = new URLSearchParams(location.search).get('q') || ''
  if (q0) { query.value = q0; render(q0) }
}
