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
/* บริบทงาน: 17 พ.ย. 2026 อาร์ต "เปลี่ยนเป็นโชว์ทั้งหมด" → เลิกแท็บ ทุกงานเรียงลงมา แถบภาพจิ๋วเป็นลิงก์ # (ไม่ต้องใช้ JS) */
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
