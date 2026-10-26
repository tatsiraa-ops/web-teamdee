import './page.js'
import { initCountUp } from './count-up.js'
import { initLightbox } from './lightbox.js'
import { initTabs } from './tabs.js'
import { shownFor } from './tag-filter.js'

initLightbox('#prodGrid', 'figure', 'ดูแบบเสื้อขนาดใหญ่')
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
