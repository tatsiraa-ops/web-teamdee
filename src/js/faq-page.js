import './page.js'

/* ลิงก์ตรงรายข้อ (Wireframe FAQ ส่วน 3) · ทีมขายส่งลิงก์ให้ลูกค้าแล้วคำตอบนั้นต้องกางรออยู่เลย
   ไม่ใช่ให้ลูกค้าเลื่อนหาเอง */
const openFromHash = () => {
  const id = decodeURIComponent(location.hash.slice(1))
  if (!id) return
  const item = document.getElementById(id)
  if (!item || !item.classList.contains('hs-accordion')) return
  if (!item.classList.contains('active')) item.querySelector('.hs-accordion-toggle')?.click()
  item.scrollIntoView({ block: 'start' })
  item.querySelector('.hs-accordion-toggle')?.focus({ preventScroll: true })
}
addEventListener('load', openFromHash)
addEventListener('hashchange', openFromHash)

/* ปุ่มคัดลอกลิงก์ · ได้ URL เต็มพร้อม #ข้อ ส่งต่อในไลน์ได้ทันที */
document.querySelectorAll('[data-copy-link]').forEach((a) =>
  a.addEventListener('click', async (e) => {
    e.preventDefault()
    const url = location.origin + location.pathname + a.getAttribute('href')
    const old = a.textContent
    try {
      await navigator.clipboard.writeText(url)
      a.textContent = 'คัดลอกลิงก์แล้ว'
    } catch {
      /* เบราว์เซอร์ไม่ให้คัดลอก ใส่ลิงก์ไว้ในแถบที่อยู่แทน แล้วบอกให้รู้ ไม่เงียบ */
      history.replaceState(null, '', a.getAttribute('href'))
      a.textContent = 'ลิงก์ข้อนี้อยู่ในแถบที่อยู่ด้านบนแล้ว'
    }
    setTimeout(() => (a.textContent = old), 2400)
  }),
)
