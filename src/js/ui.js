import '../styles/main.css'
// โหลดเฉพาะปลั๊กอินที่ใช้จริง แทนการ import ทั้งไลบรารี
import 'preline/plugins/accordion'
import 'preline/plugins/dropdown'
import 'preline/plugins/tabs'
import { initNav } from './nav.js'

initNav()

/* ชิปตัวอย่างใน design kit */
for (const chip of document.querySelectorAll('.chip')) {
  chip.addEventListener('click', () => {
    chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true')
  })
}

/* ไฮไลต์หัวข้อในสารบัญตามตำแหน่งที่เลื่อนอยู่ */
const links = [...document.querySelectorAll('.kit-toc a')]
if (links.length) {
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]))
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const a = byId.get(e.target.id)
        if (!a) continue
        a.style.color = e.isIntersecting ? 'var(--color-ink)' : ''
        a.style.borderLeftColor = e.isIntersecting ? 'var(--color-orange)' : ''
        a.style.fontWeight = e.isIntersecting ? '700' : ''
      }
    },
    { rootMargin: '-110px 0px -70% 0px' }
  )
  for (const s of document.querySelectorAll('.kit-sec')) io.observe(s)
}
