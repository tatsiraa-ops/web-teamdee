import './page.js'
import { initLightbox } from './lightbox.js'
import { hrefWithDate } from './use-cta.js'

initLightbox('#useGrid', 'figure', 'ดูแบบเสื้อขนาดใหญ่')

/* มีวันใช้แล้ว? เลือกวันที่ → ปุ่มติดวันที่ไปกับฟอร์ม (?date=) หรือข้อความ LINE ทีมดีจะได้ตรวจคิวจากวันนั้นเลย */
const date = document.getElementById('useDate')
const btn = document.querySelector('.js-date-cta')
if (date && btn) {
  const base = btn.getAttribute('href')
  date.min = new Date().toISOString().slice(0, 10)
  date.addEventListener('change', () => btn.setAttribute('href', hrefWithDate(base, date.value)))
}
