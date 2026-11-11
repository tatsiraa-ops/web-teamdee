import './page.js'
import '../styles/page-search.css'
import { initLightbox } from './lightbox.js'
import { esc } from './phrases.js'
import { lineMessageUrl } from './contact-send.js'
import { askText, queryActions } from './faq-search.js'
import { searchPages, searchDesigns } from './site-search.js'
import routes from '../data/routes.json'

/* ค้นหาจากชื่อสินค้า ชื่อแบบ รหัสแบบ และคำถาม FAQ (Brief ข้อ 04 · ตรวจมือถือ 30 ต.ค. ข้อ 6–7)
   ดัชนีฝังมากับหน้าเป็น JSON ตอน build ไม่ต้องเรียก API
   คำที่ลูกค้าพิมพ์จริง ("ส่งกี่วัน" "สกรีน 1 ตัว" "ติดตามงาน") ใช้ตารางคำพ้องเดียวกับ /faq/ (src/data/search-synonyms.json)
   กติกาจาก Wireframe: พิมพ์รหัสตรงต้องเด้งแบบนั้นขึ้นก่อน
   และห้ามแสดงรายการที่ไม่เกี่ยวข้องแล้วทำเหมือนค้นพบ */

const data = JSON.parse(document.getElementById('searchIndex').textContent)
/* คำถาม FAQ (k "คำถาม" ชี้ /faq/#ข้อ) แยกแสดงเป็นคำตอบ · ที่เหลือเป็นหน้าเว็บ */
const isFaq = (p) => p.k === 'คำถาม'
const input = document.getElementById('sq')
const countEl = document.getElementById('searchCount')
const actBox = document.getElementById('searchActions')
const actRow = actBox?.querySelector('[data-sr-act-row]')
const faqBox = document.getElementById('faqResults')
const faqList = document.getElementById('faqList')
const faqAll = document.getElementById('faqAll')
const pageBox = document.getElementById('pageResults')
const pageList = document.getElementById('pageList')
const designBox = document.getElementById('designResults')
const designHits = document.getElementById('designHits')
const emptyBox = document.getElementById('searchEmpty')
const emptyTerm = document.getElementById('emptyTerm')
const ask = emptyBox?.querySelector('[data-sr-ask]')
const bub = emptyBox?.querySelector('[data-sr-bub]')
const allDesigns = document.getElementById('allDesigns')
/* ปุ่มขยายรูปของผลแบบเสื้อ ใส่ใหม่ทุกครั้งที่ render (lightbox.js refresh · 30 ต.ค.) */
let lb = null
const FAQ_MAX = 5

/* ปุ่มลูกค้าเดิม: เรื่องที่พิมพ์ขึ้นก่อนเป็นปุ่มหลัก */
const showActions = (acts) => {
  if (!actBox) return
  actBox.hidden = !acts.length
  acts.forEach((id, i) => {
    const a = actRow.querySelector(`[data-sr-act="${id}"]`)
    if (!a) return
    actRow.append(a)
    a.classList.toggle('cb--p', i === 0)
    a.classList.toggle('cb--s', i > 0)
  })
}

const render = (raw) => {
  const q = raw.trim()

  if (!q) {
    countEl.textContent = 'พิมพ์คำที่ต้องการค้นหา เช่น ชื่อสินค้า ชื่อแบบ รหัสแบบ หรือคำถามอย่าง "ส่งกี่วัน"'
    showActions([])
    faqBox.classList.add('hidden')
    pageBox.classList.add('hidden')
    designBox.classList.add('hidden')
    emptyBox.hidden = true
    return
  }

  const acts = queryActions(q)
  const hits = searchPages(q, data.pages, routes)
  const faqs = hits.filter(isFaq)
  const pages = hits.filter((p) => !isFaq(p))
  const designs = searchDesigns(q, data.designs)

  const total = faqs.length + pages.length + designs.length
  countEl.textContent = total ? `พบ ${total} รายการสำหรับ “${q}”` : acts.length ? `ทางลัดสำหรับลูกค้าเดิม “${q}”` : ''
  showActions(acts)

  faqList.innerHTML = faqs
    .slice(0, FAQ_MAX)
    .map(
      (p) => `<li><a class="sr-faq" href="${esc(p.u)}">
        <span class="sr-faq__q">${esc(p.t)}</span>
        <span class="sr-faq__a">${esc(p.d)}</span>
        <span class="sr-faq__go">อ่านคำตอบเต็ม<span class="arw" aria-hidden="true">&rarr;</span></span>
      </a></li>`,
    )
    .join('')
  faqBox.classList.toggle('hidden', faqs.length === 0)
  /* หน้า /faq/ อ่าน ?q= แล้วกรองให้เลย */
  if (faqAll) {
    faqAll.href = `${routes.faq}?q=${encodeURIComponent(q)}`
    faqAll.firstChild.textContent = faqs.length > FAQ_MAX ? `ดูทั้ง ${faqs.length} ข้อในหน้าคำถาม` : 'ดูในหน้าคำถาม'
  }

  pageList.innerHTML = pages
    .map(
      (p) => `<li><a class="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-4 min-h-tap group" href="${esc(p.u)}">
        <span class="t-xs shrink-0 w-[88px]">${esc(p.k)}</span>
        <span class="text-[19px] font-bold group-hover:underline decoration-orange decoration-2 underline-offset-4">${esc(p.t)}</span>
        <span class="t-sm basis-full sm:basis-auto">${esc(p.d)}</span>
      </a></li>`,
    )
    .join('')
  pageBox.classList.toggle('hidden', pages.length === 0)

  designHits.innerHTML = designs
    .slice(0, 12)
    .map(
      (d) => `<figure class="relative overflow-hidden rounded-card bg-paper border border-line aspect-[3/2]" data-code="${esc(d.c)}" data-meta="${esc(d.m)}">
        <img src="${esc(d.img)}" srcset="${esc(d.s)} 540w, ${esc(d.img)} 1080w" sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
             width="1080" height="720" loading="lazy" decoding="async"
             alt="แบบ${esc(d.g)}งาน${esc(d.t)} รหัส ${esc(d.c)} ด้านหน้าและด้านหลัง" class="w-full h-full object-contain">
        <figcaption class="absolute left-2 bottom-2 rounded-md bg-paper border border-line px-2 py-0.5 text-[14px] font-bold tabular-nums">${esc(d.c)}</figcaption>
      </figure>`,
    )
    .join('')
  designBox.classList.toggle('hidden', designs.length === 0)
  lb?.refresh()
  if (allDesigns) allDesigns.href = `${routes.designs}?q=${encodeURIComponent(q)}`

  /* ไม่พบ: ส่งคำค้นให้ทีมดีทาง LINE (ข้อความพิมพ์รอไว้) แบบเดียวกับ /faq/ */
  emptyTerm.textContent = `“${q}”`
  emptyBox.hidden = total > 0 || acts.length > 0
  if (!total && ask) ask.href = lineMessageUrl(askText(q))
  if (!total && bub) bub.textContent = askText(q).trim()
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
document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault()
  render(input.value)
  sync(true)
})
/* ย้อนกลับ: render ใหม่เฉพาะเมื่อคำค้นเปลี่ยน · ปิดรูปใหญ่/เมนูก็ยิง popstate (back-close.js) แต่ URL เดิม (30 ต.ค.) */
addEventListener('popstate', () => {
  const q = new URLSearchParams(location.search).get('q') || ''
  if (q === input.value) return
  input.value = q
  render(input.value)
})

input.value = new URLSearchParams(location.search).get('q') || ''
render(input.value)

lb = initLightbox('#designHits', 'figure', 'ดูแบบเสื้อขนาดใหญ่')
