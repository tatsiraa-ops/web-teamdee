/* ตารางราคาหลายผ้าบนมือถือ (mobile UX audit 30 ต.ค. ข้อ 10 · โปโลปัก /embroidery/)
   เดิม: ตาราง 597px ในกล่อง 299px ที่ 375 · ต้องปัดซ้ายขวาเทียบผ้าเองใต้แถบติดจอบนล่าง
   ใหม่: [data-price-compare="<รหัสสินค้า>"] ที่ตารางมี ≥3 คอลัมน์ราคา → เพิ่มตัวเลือกช่วงจำนวน (radio) + ตาราง 2 คอลัมน์ ผ้า | บาท/ตัว
   CSS (price-table.css) โชว์แบบใหม่เฉพาะจอ <768 · จอใหญ่ตารางเต็มเหมือนเดิม · ไม่มี JS = ตารางเต็มเลื่อนได้เหมือนเดิม
   ตัวเลขจาก prices.json ผ่าน bandCompare() (src/js/prices.js) · HTML จาก price-compare-view.js (มีเทส) */
import '../styles/price-table.css'
import prices from '../data/prices.json'
import { bandCompare } from './prices.js'
import { compareCaption, compareMarkup, compareRows, pickBand } from './price-compare-view.js'

export function initPriceCompare(root = document) {
  root.querySelectorAll('[data-price-compare]').forEach((host) => {
    const id = host.dataset.priceCompare
    const view = bandCompare(prices, id)
    if (!view || host.querySelector('.pcmp')) return
    const box = document.createElement('div')
    box.className = 'pcmp'
    box.innerHTML = compareMarkup(view, { name: `pcmp-${id}` })
    host.prepend(box)
    host.classList.add('is-pcmp')
    const caption = box.querySelector('caption')
    const body = box.querySelector('tbody')
    const live = box.querySelector('.pcmp__live')
    box.addEventListener('change', (e) => {
      if (e.target.type !== 'radio') return
      const band = pickBand(view, e.target.value)
      caption.innerHTML = compareCaption(band)
      body.innerHTML = compareRows(band)
      live.textContent = band.status
    })
  })
}
