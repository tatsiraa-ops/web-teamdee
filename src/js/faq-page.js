import './page.js'
import { faqHits, askText } from './faq-search.js'
import { lineMessageUrl } from './contact-send.js'
import { activeIndex } from './about-toc.js'

/* หน้าคำถาม /faq/ (รื้อ 26 ต.ค.) · ค้นหาสด · เมนูหมวดไฮไลต์ตามที่อ่าน · ลิงก์ตรงรายข้อ · คัดลอกลิงก์ */
const items = [...document.querySelectorAll('[data-fq-item]')]
const secs = [...document.querySelectorAll('[data-fq-sec]')]
const input = document.querySelector('[data-fq-q]')
const clearBtn = document.querySelector('[data-fq-clear]')
const status = document.querySelector('[data-fq-status]')
const empty = document.querySelector('[data-fq-empty]')
const ask = document.querySelector('[data-fq-ask]')
const bub = document.querySelector('[data-fq-bub]')
const catLinks = [...document.querySelectorAll('[data-fq-cat]')]
const total = items.length
const allText = status?.innerHTML

/* ข้อความค้นของแต่ละข้อ = คำถาม + คำตอบ + ชื่อหมวด · เก็บคำถามเดิมไว้ทำไฮไลต์ */
items.forEach((d) => {
  const t = d.querySelector('[data-fq-t]')
  d._q = t.textContent
  /* เก็บ HTML เดิมไว้คืนตอนไม่ได้ค้น (มีแท็กตัดบรรทัดไทย t-* · 30 ต.ค. เดิมค้นครั้งแรกแล้วหายถาวร) */
  d._qHtml = t.innerHTML
  d._hay = `${d._q} ${d.querySelector('.fq-q__a p')?.textContent || ''} ${d.dataset.cat || ''}`
})

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
/* ไฮไลต์คำที่พิมพ์ในคำถาม (เฉพาะคำที่อยู่ตรงตัว · คำพ้องอย่าง ไซส์→ไซซ์ เจอแต่ไม่ไฮไลต์) */
const mark = (text, q) => {
  const words = q.trim().split(/\s+/).filter((w) => w.length > 1 && text.toLowerCase().includes(w.toLowerCase()))
  if (!words.length) return esc(text)
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return text.split(re).map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join('')
}

const apply = (raw) => {
  const q = raw.trim()
  let shown = 0
  /* ตรงตัวก่อน ไม่มีข้อไหนตรงตัวค่อยใช้เจตนา ("กี่วัน" → ข้อระยะผลิต) · ตาราง src/data/search-synonyms.json */
  const hits = faqHits(q, items.map((d) => d._hay))
  items.forEach((d, i) => {
    const hit = hits[i]
    d.hidden = !hit
    d.querySelector('[data-fq-t]').innerHTML = q ? mark(d._q, q) : d._qHtml
    if (hit) shown++
  })
  secs.forEach((s) => {
    const n = s.querySelectorAll('[data-fq-item]:not([hidden])').length
    s.hidden = !n
    const cn = s.querySelector('.fq-cat__n')
    if (cn) cn.textContent = `${n} ข้อ`
    const link = catLinks.find((a) => a.dataset.fqCat === s.id)
    if (link) {
      link.querySelector('[data-fq-n]').textContent = n
      link.classList.toggle('is-none', !n)
    }
  })
  /* เจอไม่กี่ข้อ = กางให้อ่านเลย */
  if (q && shown <= 3) items.forEach((d) => { if (!d.hidden) d.open = true })
  if (clearBtn) clearBtn.hidden = !q
  if (status) status.innerHTML = q ? (shown ? `เจอ <b class="tabular-nums">${shown}</b> คำถามจาก “${esc(q)}”` : `ไม่เจอคำถามที่ตรงกับ “${esc(q)}”`) : allText
  if (empty) empty.hidden = !q || shown > 0
  if (q && !shown) {
    /* ลูกค้าเดิม ("ติดตามงาน" "สั่งซ้ำ") ได้ข้อความแบบฟอร์มของเรื่องนั้นเลย อื่นๆ แนบคำค้น */
    if (ask) ask.href = lineMessageUrl(askText(q))
    if (bub) { bub.textContent = askText(q).trim(); bub.style.whiteSpace = 'pre-line' }
  }
  document.documentElement.classList.toggle('fq-searching', !!q)
}

let t
input?.addEventListener('input', () => {
  clearTimeout(t)
  t = setTimeout(() => {
    apply(input.value)
    const u = new URL(location.href)
    if (input.value.trim()) u.searchParams.set('q', input.value.trim())
    else u.searchParams.delete('q')
    u.hash = ''
    history.replaceState(null, '', u)
  }, 120)
})
/* ล้างคำค้นทันที (ไม่รอ 120ms) · ลิงก์คำถามยอดฮิต/หมวด เรียกก่อนเลื่อน จึงต้องเห็นข้อนั้นแล้ว (30 ต.ค.) */
const clearSearch = (focus) => {
  clearTimeout(t)
  input.value = ''
  apply('')
  const u = new URL(location.href)
  u.searchParams.delete('q')
  history.replaceState(null, '', u)
  if (focus) input.focus()
}
const reset = () => clearSearch(true)
/* Enter ในช่องค้นหาไม่โหลดหน้าใหม่ (เว็บจริงตัด onsubmit ในแท็ก · 30 ต.ค.) */
document.querySelector('[data-fq-form]')?.addEventListener('submit', (e) => e.preventDefault())
clearBtn?.addEventListener('click', reset)
document.querySelector('[data-fq-reset]')?.addEventListener('click', reset)
input?.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.value) { e.preventDefault(); reset() } })
/* กด / ที่ไหนก็ได้ = ไปช่องค้นหา */
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.target.closest?.('input, textarea, select, [contenteditable]') || document.querySelector('dialog[open]')) return
  e.preventDefault()
  input?.focus()
})
const q0 = new URLSearchParams(location.search).get('q')
if (q0 && input) { input.value = q0; apply(q0) }

/* ลิงก์ตรงรายข้อ · ทีมขายส่งลิงก์ให้ลูกค้าแล้วคำตอบต้องกางรออยู่เลย */
const openId = (id, focus) => {
  const d = document.getElementById(id)
  if (!d || !d.matches('[data-fq-item]')) return false
  if (d.hidden) clearSearch(false)
  d.open = true
  d.scrollIntoView({ block: 'start' })
  if (focus) d.querySelector('summary')?.focus({ preventScroll: true })
  d.classList.remove('is-flash')
  void d.offsetWidth
  d.classList.add('is-flash')
  return true
}
const fromHash = () => { let id = ''; try { id = decodeURIComponent(location.hash.slice(1)) } catch { /* #%E0 จากลิงก์เสีย */ } if (id) openId(id, true) }
addEventListener('load', fromHash)
addEventListener('hashchange', fromHash)

/* กางข้อไหน = ใส่ #ข้อ ในแถบที่อยู่ (ส่งต่อได้) โดยไม่เลื่อนหน้า */
items.forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) history.replaceState(null, '', `${location.pathname}${location.search}#${d.id}`)
}))

/* คำถามยอดฮิต / เมนูหมวด: ถ้ากำลังค้นอยู่ ล้างก่อนแล้วค่อยพาไป */
document.querySelectorAll('[data-fq-jump], [data-fq-cat]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.hash.slice(1)
  if (input?.value) clearSearch(false)
  if (a.matches('[data-fq-jump]')) { e.preventDefault(); openId(id, true); history.replaceState(null, '', `#${id}`) }
}))

/* ปุ่มคัดลอกลิงก์ · URL เต็มพร้อม #ข้อ */
document.querySelectorAll('[data-copy-link]').forEach((a) =>
  a.addEventListener('click', async (e) => {
    e.preventDefault()
    const url = location.origin + location.pathname + a.dataset.href
    const label = a.querySelector('[data-copy-t]')
    const old = label.textContent
    try {
      await navigator.clipboard.writeText(url)
      label.textContent = 'คัดลอกลิงก์แล้ว'
    } catch {
      /* เบราว์เซอร์ไม่ให้คัดลอก ใส่ลิงก์ไว้ในแถบที่อยู่แทน แล้วบอกให้รู้ ไม่เงียบ */
      history.replaceState(null, '', a.dataset.href)
      label.textContent = 'ลิงก์อยู่ในแถบที่อยู่ด้านบนแล้ว'
    }
    const st = document.getElementById('fqCopyStatus')
    if (st) st.textContent = label.textContent
    a.classList.add('is-done')
    setTimeout(() => { label.textContent = old; a.classList.remove('is-done') }, 2400)
  }),
)

/* เมนูหมวด: ไฮไลต์หมวดที่อ่านอยู่ · มือถือเลื่อนแถบให้เห็นหมวดนั้น */
const side = document.querySelector('[data-fq-side]')
if (side && secs.length) {
  const row = side.querySelector('.fq-nav ul')
  let last = -2
  let queued = false
  const draw = () => {
    queued = false
    const mobile = innerWidth < 1024
    const line = scrollY + (mobile ? side.getBoundingClientRect().bottom : (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-b')) || 80)) + Math.min(160, innerHeight * 0.2)
    const vis = secs.filter((s) => !s.hidden)
    const i = activeIndex(vis.map((s) => s.getBoundingClientRect().top + scrollY), line)
    const id = vis[i]?.id
    side.classList.toggle('is-stuck', mobile && side.getBoundingClientRect().top <= (parseFloat(getComputedStyle(side).top) || 0) + 1)
    if (id === last) return
    last = id
    catLinks.forEach((a) => (a.dataset.fqCat === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')))
    const on = catLinks.find((a) => a.dataset.fqCat === id)
    if (mobile && on && row) {
      const r = on.getBoundingClientRect()
      const box = row.getBoundingClientRect()
      if (r.left < box.left + 8 || r.right > box.right - 8) row.scrollTo({ left: row.scrollLeft + r.left - box.left - 16, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
  }
  const ask2 = () => { if (!queued) { queued = true; requestAnimationFrame(draw) } }
  addEventListener('scroll', ask2, { passive: true })
  addEventListener('resize', ask2)
  input?.addEventListener('input', () => setTimeout(() => { last = -2; draw() }, 140))
  draw()
}
