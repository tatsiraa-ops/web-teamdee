import './page.js'
import '../styles/page-project.css' // CSS เฉพาะหน้านี้ ย้ายออกจาก main.css (30 ต.ค. รอบ 48)
import '../styles/line-cta.css' // แบนเนอร์ LINE ใช้ร่วม /designs/ + /project/
import { initCountUp } from './count-up.js'
import { AUTO, STEP, takeCount } from './photo-rail.js'
import { initLightbox } from './lightbox.js'
import { initReviewBoard } from './review-board.js'
import { fitBoard } from './board-fit.js'

/* หน้ารีวิว /project/ ตาม Wireframe v22 · ภาพลูกค้าแยก 10 กลุ่ม (28 ต.ค.)
   การ์ดกลุ่ม = แท็บ: โชว์ทีละกลุ่มในที่เดิม · ลิงก์ #rv-<กลุ่ม> เปิดกลุ่มนั้นตรงๆ · ไม่มี JS = ทุกกลุ่มเรียงต่อกัน
   แต่ละกลุ่มโชว์รูปนำ 1 + รูปเล็ก 8 · ที่เหลือเปิดดูในที่เดิม · ไลต์บ็อกซ์แยกต่อกลุ่ม นับเฉพาะรูปที่เปิดแล้ว */

const tabs = [...document.querySelectorAll('[data-rv-tab]')]
const panels = tabs.map((a) => document.getElementById(a.hash.slice(1)))
if (tabs.length > 1 && panels.every(Boolean)) {
  const row = tabs[0].closest('.pj-groups')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  /* มือถือ: แถวการ์ดเลื่อนข้าง ให้การ์ดที่เลือกอยู่ในจอ (เปิดจากลิงก์ #rv-วิ่ง ก็เห็นว่ากลุ่มไหนถูกเลือก) · แผงรูปอยู่ใต้การ์ดทันที ไม่ต้องเลื่อนหน้า */
  const reveal = (i, now) => {
    if (row.scrollWidth <= row.clientWidth) return
    const left = tabs[i].getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft - 20
    row.scrollTo({ left, behavior: now || reduce.matches ? 'auto' : 'smooth' })
  }
  const show = (i, now) => {
    panels.forEach((p, k) => { p.hidden = k !== i })
    tabs.forEach((a, k) => a.setAttribute('aria-current', String(k === i)))
    reveal(i, now)
  }
  const fromHash = () => panels.findIndex((p) => `#${p.id}` === location.hash)
  show(Math.max(0, fromHash()), true)
  tabs.forEach((a, i) => a.addEventListener('click', (e) => {
    e.preventDefault()
    show(i)
    history.replaceState(null, '', a.hash)
  }))
  addEventListener('hashchange', () => { const i = fromHash(); if (i >= 0) { show(i, true); document.getElementById('photos').scrollIntoView() } })
}

/* ไลต์บ็อกซ์ต่อกลุ่ม · เก็บไว้ refresh หลังใส่รูปจาก template (ปุ่มดูรูปใหญ่ของรูปใหม่) */
const boxes = new Map()
/* กองภาพแบนเนอร์ (รอบ 168) · กดใบไหนก็เปิดภาพใหญ่ เลื่อนดูครบ 5 ใบ */
initLightbox('#pjPile', 'li', 'ดูภาพลูกค้าขนาดใหญ่')
for (const list of document.querySelectorAll('[id^="rvC-"]')) boxes.set(list.id, initLightbox(`#${list.id}`, 'li', 'ดูภาพลูกค้าขนาดใหญ่'))

/* "ดูอีก N ภาพ" (audit มือถือ 30 ต.ค. ข้อ 27 · รอบ 167 รางภาพ): รูปที่เหลืออยู่ใน <template data-rv-tpl> ไม่อยู่ใน DOM ตั้งแต่โหลด
   ใกล้เห็นแถว = เติมเองให้ครบ AUTO รูป (อาร์ต "อย่างละ 30-40 รูป") · กดช่องท้ายราง = เพิ่มทีละ STEP แล้วเลื่อนไปรูปแรกที่เพิ่ม
   ใส่ก่อนช่องปุ่ม (ปุ่มอยู่ท้ายรางเสมอ) → refresh ไลต์บ็อกซ์ → โฟกัสรูปแรกที่เพิ่ม (เฉพาะตอนกด) → ประกาศจำนวน · หมดแล้วซ่อนช่องปุ่ม */
const live = document.getElementById('rvLive')
const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')
const railIo = 'IntersectionObserver' in window ? new IntersectionObserver((list) => { for (const en of list) if (en.isIntersecting) { railIo.unobserve(en.target); en.target.dispatchEvent(new Event('rail:near')) } }, { rootMargin: '600px 0px' }) : null
for (const btn of document.querySelectorAll('[data-rv-more]')) {
  const list = document.getElementById(btn.dataset.rvMore)
  const tpl = document.getElementById(btn.dataset.rvTpl)
  if (!list || !tpl) continue
  const slot = btn.closest('li')
  const queue = [...tpl.content.cloneNode(true).children]
  tpl.remove()
  const shown = () => list.querySelectorAll('li:not(.pj-more)').length
  const add = (n) => {
    const rest = queue.splice(0, n)
    for (const li of rest) list.insertBefore(li, slot)
    boxes.get(list.id)?.refresh()
    const left = btn.querySelector('.tabular-nums')
    if (left) left.textContent = String(queue.length)
    if (!queue.length) { btn.setAttribute('aria-expanded', 'true'); slot.hidden = true }
    list.dispatchEvent(new Event('scroll'))
    return rest
  }
  list.addEventListener('rail:near', () => add(takeCount(shown(), queue.length, AUTO)))
  if (railIo) railIo.observe(list); else add(takeCount(shown(), queue.length, AUTO))
  btn.addEventListener('click', () => {
    const rest = add(takeCount(shown(), queue.length, shown() + STEP))
    if (live) live.textContent = `เปิดเพิ่ม ${rest.length} ภาพ รวม ${shown()} ภาพในกลุ่มนี้`
    rest[0]?.scrollIntoView({ behavior: smooth(), block: 'nearest', inline: 'start' })
    rest[0]?.querySelector('.lb-open')?.focus()
  })
}

/* ปุ่มเลื่อนซ้ายขวาของราง (คอม) · ปิดปุ่มที่สุดทาง · มือถือปัดเอง */
for (const rail of document.querySelectorAll('[data-rail]')) {
  const list = rail.querySelector('ul')
  const prev = rail.querySelector('[data-rail-prev]')
  const next = rail.querySelector('[data-rail-next]')
  if (!list || !prev || !next) continue
  const sync = () => {
    const end = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4
    prev.disabled = list.scrollLeft <= 4
    next.disabled = end
    rail.classList.toggle('is-end', end)
  }
  prev.addEventListener('click', () => list.scrollBy({ left: -list.clientWidth * 0.8, behavior: smooth() }))
  next.addEventListener('click', () => list.scrollBy({ left: list.clientWidth * 0.8, behavior: smooth() }))
  list.addEventListener('scroll', sync, { passive: true })
  addEventListener('resize', sync)
  sync()
}

/* ตัวเลขหัวเรื่องวิ่งนับแบบหน้าแรก (26 ต.ค.) */
initCountUp()
/* กระดานรีวิว (รอบ 169c · ชิ้นเดียวกับหน้าแรก + แถวรายชื่อรีวิว) */
initReviewBoard()
fitBoard()
