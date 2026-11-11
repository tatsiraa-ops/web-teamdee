import { initFabricCards } from './fabric-cards.js'
import { initTypeCollars } from './type-collars.js'
import './download-assets.js'
import '../styles/v22-sections.css'
/* หน้าสินค้า 6 หน้า · product-page.css (แกลเลอรีลูกค้า · รูปในการ์ด) โหลดใน head ของหน้า */
import './page.js'
import { initCountUp } from './count-up.js'
import { initLightbox } from './lightbox.js'
import { addRailControls } from './mobile-ui.js'
import { initTabs } from './tabs.js'
import { shownFor } from './tag-filter.js'
import { initToc } from './about-toc.js'
import { initNeedBy } from './need-by-ui.js'
import { initPriceCompare } from './price-compare.js'
import { initReviewBoard } from './review-board.js'
import { initCustomize } from './customize.js'
import { initSizeChart } from './sizechart.js'

/* สารบัญติดใต้หัวเว็บ (26 ต.ค.) · ไฮไลต์ส่วนที่อ่าน + แถบอ่านถึงไหน */
initToc()
/* ต้องใช้เสื้อวันที่… → ยืนยันแบบภายในวันไหน ใต้ปุ่ม hero (ตรวจมือถือ 30 ต.ค. ข้อ 35) */
initNeedBy()
/* ตารางราคาหลายผ้าบนมือถือ: เลือกช่วงจำนวนแล้วเห็นราคาทุกผ้า (audit มือถือ 30 ต.ค. ข้อ 10) */
initPriceCompare()
/* การ์ดสะสมผ้า (รอบ 185): เอียง/ฟอยล์ · พลิก · แจกการ์ด · สำรับมือถือ */
initFabricCards()
/* แผงเลือกเสื้อ (196c): กดทรง → บอกคอที่ทำได้ + ราคาทรง */
initTypeCollars()

initLightbox('#screenGallery', 'figure', 'ดูรายละเอียดงานสกรีน')
initLightbox('#prodGrid', 'figure', 'ดูแบบเสื้อขนาดใหญ่')
/* แบบเสื้อ 3D หน้าโฉมใหม่ (pp2Designs.hbs) · ทุกแถวเป็นชุดเดียว ลูกศรเลื่อนข้ามแถวได้ · ปุ่มเลื่อนราง */
initLightbox('#pp2Designs', 'figure', 'ดูแบบเสื้อขนาดใหญ่')
initLightbox('#pp2RealGrid', 'figure', 'ดูเสื้อจริงขนาดใหญ่')
/* import แบบคงที่ (5 พ.ย.: dynamic import บน WordPress หา CSS preload ผิดที่ /assets/ → ราง/ปุ่มไม่ขึ้น) */
document.querySelectorAll('.pp2-dz__rail').forEach((r) => addRailControls(r, 'pp2-dz-ctl'))
/* การ์ดขั้นตอนเป็นรางบนมือถือ · ปุ่มเลื่อน/ตัวนับซ่อนเองเมื่อเห็นครบ (จอใหญ่เป็นกริด 3×2) */
document.querySelectorAll('.pp2-pf__steps, .pp2-pf__bento').forEach((r) => addRailControls(r, 'pp2-dz-ctl'))
/* คลิป 6: จอใหญ่เห็นทีละ 4 → มีปุ่มเลื่อนทุกขนาดจอ (ซ่อนเองเมื่อเห็นครบ) */
document.querySelectorAll('.pp2-pf__vgrid').forEach((r) => addRailControls(r, 'pp2-dz-ctl pp2-pf-vctl'))
document.querySelectorAll('[data-tabs]').forEach(initTabs)

/* แท็กทรงเสื้อ · เก็บใน ?tag= ให้ลิงก์จากการ์ดในส่วน 2b และลิงก์ที่ทีมขายส่งเปิดมาเจอตรงกัน */
const bar = document.getElementById('prodTags')
const grid = document.getElementById('prodGrid')
if (bar && grid) {
  const max = Number(bar.dataset.show) || 6
  const items = [...grid.children]
  const garments = items.map((el) => el.dataset.garment)
  const chips = [...bar.querySelectorAll('[data-tag]')]

  const count = document.getElementById('prodCount')
  const all = document.getElementById('prodAll')
  const allBase = all?.getAttribute('href')

  /* บอกตรงๆ ว่าโชว์กี่แบบจากทั้งหมด ชิปเขียน 21 แต่ตารางโชว์ 6 ไม่งั้นคนคิดว่าแบบหาย
     ลิงก์ "ดูทั้งหมด" พาไปแกลเลอรีพร้อมคำค้นของแท็กนั้น */
  const render = (tag) => {
    const shown = shownFor(garments, tag, max)
    items.forEach((el, i) => (el.hidden = !shown[i]))
    const chip = chips.find((c) => c.dataset.tag === tag) || chips.find((c) => c.dataset.tag === 'all')
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)))
    const total = chip.dataset.tag === 'all' ? garments.length : garments.filter((g) => g === chip.dataset.tag).length
    const n = shown.filter(Boolean).length
    if (count) count.textContent = n < total ? `แสดง ${n} จาก ${total} แบบ · ดูครบในแกลเลอรี` : `แสดงครบ ${total} แบบ`
    if (all && allBase) all.href = chip.dataset.q ? `${allBase}&q=${encodeURIComponent(chip.dataset.q)}` : allBase
  }
  const fromUrl = () => render(new URLSearchParams(location.search).get('tag') || 'all')

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      const p = new URLSearchParams(location.search)
      if (c.dataset.tag === 'all') p.delete('tag')
      else p.set('tag', c.dataset.tag)
      history.pushState(null, '', location.pathname + (p.toString() ? `?${p}` : '') + '#ex')
      render(c.dataset.tag)
    }),
  )
  addEventListener('popstate', fromUrl)
  fromUrl()
}

initCountUp()

/* รีวิวลูกค้าเสื้อพิมพ์ลาย (pp2Reviews): กระดานรีวิวทีละราย + กำแพงรูป (กดรูป = กล่องรีวิว review-dialog.js ใน page.js) */
initReviewBoard()

/* ปรับได้ทุกส่วน (pp2Custom): ห้องลองปรับ + เมนูตัวเลือก + ส่งสิ่งที่เลือกทาง LINE */
initCustomize()
initSizeChart()
