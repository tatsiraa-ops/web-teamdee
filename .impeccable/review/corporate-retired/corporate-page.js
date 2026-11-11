import './page.js'

const views = {
  front: { image: '/img/case/fti-front.webp', alt: 'ด้านหน้าเสื้อจริง FTI Outing 2026 บนหุ่น', title: 'โลโก้และชื่องาน อยู่ด้วยกันอย่างพอดี', description: 'โลโก้ FTI ที่อก จับคู่กับชื่อ OUTING 2026 และปกสีครีมที่รับกับลายบนตัวเสื้อ', label: 'เสื้อจริงหลังผลิต', count: '01 / 03' },
  back: { image: '/img/case/fti-back.webp', alt: 'ด้านหลังเสื้อ FTI พร้อมข้อความ Together We Thrive', title: 'ข้อความของทีม ที่มองเห็นจากด้านหลัง', description: 'Together We Thrive วางเหนือแนวลายสีแดง ให้ข้อความประจำทีมอยู่ในภาพกิจกรรมไปด้วย', label: 'รายละเอียดด้านหลัง', count: '02 / 03' },
  team: { image: '/img/case/fti-team.webp', alt: 'ทีม FTI สวมเสื้อพิมพ์ลายในกิจกรรม Outing 2026', title: 'เมื่อทุกคนอยู่ในเสื้อลายเดียวกัน', description: 'จากเสื้อหนึ่งตัว สู่ภาพรวมของทีม FTI ในวัน Outing 2026 — ภาพจากการใช้งานจริง', label: 'ภาพลูกค้าใช้งานจริง', count: '03 / 03' },
}
const image = document.getElementById('co-view-image')
const buttons = [...document.querySelectorAll('[data-co-view]')]
for (const button of buttons) button.addEventListener('click', () => {
  const view = views[button.dataset.coView]
  if (!view || !image || button.getAttribute('aria-pressed') === 'true') return
  for (const option of buttons) option.setAttribute('aria-pressed', String(option === button))
  image.src = view.image
  image.alt = view.alt
  image.classList.remove('co-image-enter')
  requestAnimationFrame(() => image.classList.add('co-image-enter'))
  for (const key of ['title', 'description', 'label', 'count']) document.getElementById(`co-view-${key}`).textContent = view[key]
})

