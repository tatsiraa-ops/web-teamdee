import './page.js'
import { initLightbox } from './lightbox.js'
import routes from '../data/routes.json'

/* ค้นหาพื้นฐานจากชื่อสินค้า ชื่อแบบ และรหัสแบบ (Brief ข้อ 04)
   ดัชนีฝังมากับหน้าเป็น JSON ตอน build ไม่ต้องเรียก API
   กติกาจาก Wireframe: พิมพ์รหัสตรงต้องเด้งแบบนั้นขึ้นก่อน
   และห้ามแสดงรายการที่ไม่เกี่ยวข้องแล้วทำเหมือนค้นพบ */

const data = JSON.parse(document.getElementById('searchIndex').textContent)
const input = document.getElementById('sq')
const countEl = document.getElementById('searchCount')
const pageBox = document.getElementById('pageResults')
const pageList = document.getElementById('pageList')
const designBox = document.getElementById('designResults')
const designHits = document.getElementById('designHits')
const emptyBox = document.getElementById('searchEmpty')
const emptyTerm = document.getElementById('emptyTerm')
const allDesigns = document.getElementById('allDesigns')

const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '')
const isCode = (q) => /^td-?\d{1,4}$/i.test(q.trim())

const render = (raw) => {
  const q = raw.trim()
  const n = norm(q)

  if (!n) {
    countEl.textContent = 'พิมพ์คำที่ต้องการค้นหา เช่น ชื่อสินค้า ชื่อแบบ หรือรหัสแบบ'
    pageBox.classList.add('hidden')
    designBox.classList.add('hidden')
    emptyBox.classList.add('hidden')
    return
  }

  const pages = data.pages.filter((p) => norm(p.t).includes(n) || norm(p.d).includes(n) || norm(p.k).includes(n))

  let designs = data.designs.filter(
    (d) => norm(d.c).includes(n) || norm(d.g).includes(n) || norm(d.t).includes(n) || norm(d.col).includes(n),
  )
  /* พิมพ์รหัสมาตรงๆ ให้แบบนั้นมาก่อนเสมอ ไม่ให้จมอยู่กลางรายการ */
  if (isCode(q)) {
    const exact = data.designs.filter((d) => norm(d.c) === n)
    designs = [...exact, ...designs.filter((d) => !exact.includes(d))]
  }

  const total = pages.length + designs.length
  countEl.textContent = total ? `พบ ${total} รายการสำหรับ “${q}”` : ''

  pageList.innerHTML = pages
    .map(
      (p) => `<li><a class="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-4 min-h-tap group" href="${p.u}">
        <span class="t-xs shrink-0 w-[88px]">${p.k}</span>
        <span class="text-[19px] font-bold group-hover:underline decoration-orange decoration-2 underline-offset-4">${p.t}</span>
        <span class="t-sm basis-full sm:basis-auto">${p.d}</span>
      </a></li>`,
    )
    .join('')
  pageBox.classList.toggle('hidden', pages.length === 0)

  designHits.innerHTML = designs
    .slice(0, 12)
    .map(
      (d) => `<figure class="overflow-hidden rounded-card bg-paper border border-line aspect-[3/2]" data-code="${d.c}" data-meta="${d.m}">
        <img src="${d.img}" srcset="${d.s} 540w, ${d.img} 1080w" sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
             width="1080" height="720" loading="lazy" decoding="async"
             alt="แบบ${d.g}งาน${d.t} รหัส ${d.c} ด้านหน้าและด้านหลัง" class="w-full h-full object-contain">
      </figure>`,
    )
    .join('')
  designBox.classList.toggle('hidden', designs.length === 0)
  if (allDesigns) allDesigns.href = `${routes.designs}?q=${encodeURIComponent(q)}`

  emptyTerm.textContent = `“${q}”`
  emptyBox.classList.toggle('hidden', total > 0)

  /* เก็บคำที่ไม่พบไว้ดูทีหลังว่าลูกค้าหาอะไรแล้วไม่เจอ (Wireframe ส่วนที่ 3)
     เก็บในเครื่องผู้ใช้เท่านั้น ยังไม่ส่งออกไปไหนจนกว่าจะต่อระบบวัดผล */
  if (!total) {
    try {
      const miss = JSON.parse(localStorage.getItem('td-miss') || '[]')
      miss.push({ q, at: Date.now() })
      localStorage.setItem('td-miss', JSON.stringify(miss.slice(-50)))
    } catch {
      /* โหมดส่วนตัวหรือปิดที่เก็บข้อมูล ไม่ต้องทำอะไร */
    }
  }
}

const sync = (push) => {
  const q = input.value.trim()
  const p = new URLSearchParams(location.search)
  if (q) p.set('q', q)
  else p.delete('q')
  history[push ? 'pushState' : 'replaceState'](null, '', location.pathname + (p.toString() ? `?${p}` : ''))
}

let timer
input.addEventListener('input', () => {
  render(input.value)
  clearTimeout(timer)
  timer = setTimeout(() => sync(false), 400)
})
document.getElementById('searchForm').addEventListener('submit', () => {
  render(input.value)
  sync(true)
})
addEventListener('popstate', () => {
  input.value = new URLSearchParams(location.search).get('q') || ''
  render(input.value)
})

input.value = new URLSearchParams(location.search).get('q') || ''
render(input.value)

initLightbox('#designHits', 'figure', 'ดูแบบเสื้อขนาดใหญ่')
