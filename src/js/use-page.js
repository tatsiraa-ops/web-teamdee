import { todayLocal } from './lib.js'
import './download-assets.js'
import './page.js'
import '../styles/v22-sections.css'
import '../styles/use-page.css'
import { initCountUp } from './count-up.js'
import { initLightbox } from './lightbox.js'
import { initToc } from './about-toc.js'
import { hrefWithDate } from './use-cta.js'
import { bindNeedBy } from './need-by-ui.js'
import { initReviewBoard } from './review-board.js'
import { addRailControls } from './mobile-ui.js'

initLightbox('#useGrid', 'figure', 'ดูแบบเสื้อขนาดใหญ่')
initLightbox('#usePhotos', 'figure', 'ภาพลูกค้าใส่เสื้อทีม')
initLightbox('#up2RvWall', 'figure', 'ภาพลูกค้าใส่เสื้อทีม')
for (const id of ['designs', 'real']) initLightbox(`#homeWorks-${id}`, 'figure', 'ดูผลงานขนาดใหญ่')
/* ผลงาน: แถวละหลายรูปเป็นรางเลื่อน · ปุ่มลูกศร + ตัวนับ ทุกขนาดจอ (4 พ.ย. อาร์ต "เอาแบบหลายๆรูปได้") */
document.querySelectorAll('#real-work :is(.up2-show--3d, .up2-show--real) .hm-show__line5').forEach((rail) => addRailControls(rail, 'up2-show-ctl'))
/* บริบทงาน: แท็บใต้หัวข้อ + แผงรูปลูกค้าจริง (11 พ.ย. · เดิมโชว์รูมไดโอรามา 4 พ.ย.)
   ชั้นวางภาพจิ๋ว = แท็บ WAI-ARIA: คลิก / ลูกศรซ้ายขวา / Home / End · ไม่เปิดตอนชี้เมาส์ ("ลูกเล่นเยอะไป")
   ไม่ใช้ tabs.js เพราะใส่คลาส chip ให้ปุ่ม (ปุ่มที่นี่เป็นภาพจิ๋ว) */
document.querySelectorAll('[data-ctx-gal]').forEach((room) => {
  const tabs = [...room.querySelectorAll('[role="tab"]')]
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')))
  const count = room.querySelector('.up2-ctx__count')
  let cur = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'))
  const select = (i, focus) => {
    cur = i
    if (count) count.textContent = `${i + 1} / ${tabs.length}`
    tabs.forEach((t, k) => {
      const on = k === i
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
      panels[k].hidden = !on
    })
    // ภาพจิ๋วที่เลือกเลื่อนเข้ามาในราง (มือถือ) โดยไม่เลื่อนทั้งหน้า
    const shelf = tabs[i].parentElement
    const at = tabs[i].getBoundingClientRect().left - shelf.getBoundingClientRect().left + shelf.scrollLeft
    if (shelf.scrollWidth > shelf.clientWidth) shelf.scrollTo({ left: at - (shelf.clientWidth - tabs[i].offsetWidth) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    if (focus) tabs[i].focus()
  }
  /* 11 พ.ย. ‹ › ใต้แผง (วนรอบ) + ตัวนับ "1 / 6" */
  room.querySelectorAll('[data-ctx-step]').forEach((b) => b.addEventListener('click', () => select((cur + Number(b.dataset.ctxStep) + tabs.length) % tabs.length, false)))
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i, false))
    t.addEventListener('keydown', (e) => {
      const last = tabs.length - 1
      const go = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key]
      if (go === undefined) return
      e.preventDefault()
      select(go, true)
    })
  })
})
/* กระดานรีวิวหน้าแรก (โฉมใหม่ use-v2) */
initReviewBoard()

/* ภาพลูกค้าเกิน 12 ภาพพับไว้ (v22 "ดูภาพลูกค้าเพิ่มเติม") */
const morePhotos = document.querySelector('[data-more-photos]')
morePhotos?.addEventListener('click', () => {
  const open = morePhotos.getAttribute('aria-expanded') !== 'true'
  const list = document.getElementById('usePhotos')
  const extra = [...list.querySelectorAll('[data-extra]')]
  for (const li of extra) li.hidden = !open
  /* มือถือรูปอยู่บนราง: ภาพที่เพิ่มไปต่อท้ายรางจนมองไม่เห็นว่าเปลี่ยน · เปิดแล้วเป็นกริด (2 พ.ย.) */
  list.classList.toggle('is-open', open)
  if (open) extra[0]?.querySelector('.lb-open')?.focus()
  morePhotos.setAttribute('aria-expanded', String(open))
  morePhotos.textContent = open ? 'แสดงภาพน้อยลง' : 'ดูภาพลูกค้าเพิ่มเติม'
})

/* มีวันใช้แล้ว? เลือกวันที่ → ปุ่มติดวันที่ไปกับฟอร์ม (?date=) หรือข้อความ LINE ทีมดีจะได้ตรวจคิวจากวันนั้นเลย */
const date = document.getElementById('useDate')
const btn = document.querySelector('.js-date-cta')
if (date && btn) {
  const base = btn.getAttribute('href')
  date.min = todayLocal()
  /* + บอกวันยืนยันแบบของสินค้าตัวแรกที่มีราคาในหน้า (ข้อ 35) · ต่อท้ายทั้งปุ่มนี้และ LINE แถบล่าง · ไม่มีข้อมูลสินค้า = แบบเดิม */
  const planned = bindNeedBy({ input: date, out: document.getElementById('useDateOut'), productId: date.dataset.needBy, links: [btn, document.querySelector('.mobilebar .mb__line')], cta: false })
  if (!planned) date.addEventListener('change', () => btn.setAttribute('href', hrefWithDate(base, date.value)))
}

initCountUp()
initToc()
