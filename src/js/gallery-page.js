import './page.js'
import '../styles/picks.css' // ถาดเลือกแบบ ชุดเดียวกับ /designs/ (audit มือถือ 30 ต.ค. ข้อ 11)
import { initLightbox } from './lightbox.js'
import { initPickTray } from './pick-tray.js'
import { imageLabel, fileOf } from './design-picks.js'

/* แกลเลอรีแบบเสื้อรายกลุ่ม (v22) · กดขยาย · กด "เลือก" ได้หลายภาพ แล้วส่งทุกภาพทาง LINE ครั้งเดียว
   แบบมีรหัส = รหัส TD · ภาพไม่มีรหัส = "รูปที่ N จาก /หน้า/ (ไฟล์)" ให้ฝ่ายขายหาภาพเจอ · ที่เลือกจำข้ามหน้า */
const grid = document.getElementById('galGrid')
if (grid) {
  for (const b of grid.querySelectorAll('[data-pick-n]')) {
    const img = b.closest('.gcard')?.querySelector('img')
    b.dataset.pick = imageLabel({ n: b.dataset.pickN, page: location.pathname, file: fileOf(img?.getAttribute('src')) })
  }
}
/* ถาดผูกปุ่มเลือกทุกใบ รวมใบที่ยังซ่อนอยู่ด้านล่าง → ที่เลือกไว้ของภาพที่ยังไม่โชว์ยังติ๊กถูกและส่งได้ */
const pick = initPickTray({ grid, cardSel: '.gcard', catalog: null })
/* ตัวดูรูปใหญ่: แบบมีรหัสเลือกเก็บจากในกล่องได้ด้วย (ภาพไม่มีรหัสเลือกจากปุ่มใต้รูป)
   นับ figure ที่ไม่ได้ซ่อน · การแบ่งหน้าซ่อนที่ .gcard ไม่แตะ figure → เลื่อนดูได้ครบถึงภาพสุดท้ายแม้ยังไม่กดดูเพิ่ม */
const lb = initLightbox('#galGrid', 'figure', 'ดูแบบเสื้อขนาดใหญ่', { pick: pick || undefined })

/* โชว์ทีละ 24 ภาพ (audit มือถือ 30 ต.ค. ข้อ 24 · เดิมเลื่อนถึงท้ายแล้วโหลดครบ 113 ภาพ ~2.2MB) · แบบเดียวกับปุ่มโหลดเพิ่มใน /designs/
   รูป lazy ในการ์ดที่ซ่อน (display:none) ไม่โหลด · ไม่มี JS = เห็นครบ · จำจำนวนที่เปิดไว้ใน ?n= (ก๊อปลิงก์ / กลับมาหน้าเดิม) */
const PAGE = 24
const cards = grid ? [...grid.querySelectorAll(':scope > .gcard')] : []
const moreBox = document.querySelector('.gal-more')
const moreBtn = document.getElementById('galMore')
const countEl = document.getElementById('galCount')
if (cards.length > PAGE && moreBox && moreBtn) {
  const total = cards.length
  const asked = Number(new URLSearchParams(location.search).get('n')) || 0
  let shown = Math.min(total, Math.max(PAGE, Math.ceil(asked / PAGE) * PAGE))
  /* หัวข้อ "งานจริงของลูกค้า" คั่นกลางกริด (col-span-full) โชว์พร้อมการ์ดใบถัดไป */
  const heads = [...grid.children].filter((el) => el.classList.contains('col-span-full'))
  const nextCard = (el) => { let n = el.nextElementSibling; while (n && !n.classList.contains('gcard')) n = n.nextElementSibling; return n }
  const render = () => {
    cards.forEach((c, i) => { c.hidden = i >= shown })
    for (const hd of heads) hd.hidden = !!nextCard(hd)?.hidden
    const rest = total - shown
    moreBox.hidden = rest <= 0
    moreBtn.textContent = `ดูเพิ่มอีก ${Math.min(PAGE, rest)} ภาพ`
    if (countEl) countEl.textContent = rest > 0 ? `แสดง ${shown} จาก ${total} ภาพ` : `แสดงครบ ${total} ภาพ`
  }
  const writeUrl = () => {
    const p = new URLSearchParams(location.search)
    if (shown > PAGE) p.set('n', String(shown))
    else p.delete('n')
    history.replaceState(history.state, '', location.pathname + (p.toString() ? `?${p}` : '') + location.hash)
  }
  moreBtn.addEventListener('click', () => {
    const first = cards[shown]
    shown = Math.min(total, shown + PAGE)
    render()
    writeUrl()
    lb?.refresh()
    /* โฟกัสภาพแรกที่เพิ่งเปิด (ปุ่มดูรูปใหญ่) · จำนวนใหม่ประกาศผ่าน #galCount */
    first?.querySelector('.lb-open')?.focus()
  })
  render()
}
