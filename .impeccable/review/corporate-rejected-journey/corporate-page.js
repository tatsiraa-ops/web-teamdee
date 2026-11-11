import './page.js'

const views = {
  design: { image: '/img/case/fti-3d.webp', alt: 'แบบจำลองเสื้อ FTI ก่อนผลิต ด้านหน้าและหลัง', title: 'เห็นภาพรวม ก่อนเป็นเสื้อตัวจริง', description: 'แบบจำลองแสดงสี ลาย โลโก้ และข้อความ ทั้งด้านหน้าและด้านหลังของเสื้อ FTI', label: 'แบบจำลองก่อนผลิต', count: '01 / 04' },
  front: { image: '/img/case/fti-front.webp', alt: 'ด้านหน้าเสื้อจริง FTI Outing 2026 บนหุ่น', title: 'โลโก้และชื่องาน อยู่ด้วยกันอย่างพอดี', description: 'โลโก้ FTI ที่อก จับคู่กับชื่อ OUTING 2026 และปกสีครีมที่รับกับลายบนตัวเสื้อ', label: 'เสื้อจริงหลังผลิต', count: '02 / 04' },
  back: { image: '/img/case/fti-back.webp', alt: 'ด้านหลังเสื้อ FTI พร้อมข้อความ Together We Thrive', title: 'ข้อความของทีม ที่มองเห็นจากด้านหลัง', description: 'Together We Thrive วางเหนือแนวลายสีแดง ให้ข้อความประจำทีมอยู่ในภาพกิจกรรมไปด้วย', label: 'รายละเอียดด้านหลัง', count: '03 / 04' },
  team: { image: '/img/case/fti-team.webp', alt: 'ทีม FTI สวมเสื้อพิมพ์ลายในกิจกรรม Outing 2026', title: 'เมื่อทุกคนอยู่ในเสื้อลายเดียวกัน', description: 'จากเสื้อหนึ่งตัว สู่ภาพรวมของทีม FTI ในวัน Outing 2026 — ภาพจากการใช้งานจริง', label: 'ภาพลูกค้าใช้งานจริง', count: '04 / 04' },
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

// Share the existing saved-design collection with /designs/.
import designs from '../data/designs.json'
import { PICK_KEY, MAX_PICKS, readPicks, togglePick, picksMessage } from './design-picks.js'
import { lineMessageUrl } from './contact-send.js'
let picks = readPicks((key) => localStorage.getItem(key), designs.map(d => d.code))
const pickButtons = [...document.querySelectorAll('[data-co-pick]')]
function drawPicks() {
  for (const button of pickButtons) {
    const selected = picks.includes(button.dataset.coPick)
    button.setAttribute('aria-pressed', String(selected))
    button.textContent = selected ? '✓ เก็บแล้ว' : '+ เก็บแบบนี้'
  }
  document.getElementById('co-pick-count').textContent = picks.length ? `เก็บไว้ ${picks.length} แบบ` : 'ยังไม่ได้เลือกแบบ'
  document.getElementById('co-pick-codes').textContent = picks.length ? picks.join(' · ') : 'เก็บแบบที่ชอบไว้ แล้วส่งให้ทีมดีดูพร้อมกัน'
  const send = document.getElementById('co-pick-send')
  send.textContent = picks.length ? 'ส่งแบบที่เลือกทาง LINE ↗' : 'ให้ทีมดีช่วยเลือก'
  send.href = picks.length ? lineMessageUrl('ต้องการทำเสื้อบริษัท\n' + picksMessage(picks)) : '/contact-us/?u=corp&from=corporate-designs'
  document.getElementById('co-pick-clear').hidden = !picks.length
}
function savePicks() { try { localStorage.setItem(PICK_KEY, JSON.stringify(picks)) } catch {} drawPicks() }
for (const button of pickButtons) button.addEventListener('click', () => {
  if (picks.length >= MAX_PICKS && !picks.includes(button.dataset.coPick)) {
    document.getElementById('co-pick-count').textContent = 'เก็บครบ 10 แบบแล้ว เอาบางแบบออกก่อนเลือกเพิ่ม'
    return
  }
  picks = togglePick(picks, button.dataset.coPick)
  savePicks()
})
document.getElementById('co-pick-clear')?.addEventListener('click', () => { picks = []; savePicks() })
if (pickButtons.length) drawPicks()
const dialog = document.getElementById('co-design-dialog')
for (const button of document.querySelectorAll('[data-co-preview]')) button.addEventListener('click', () => {
  document.getElementById('co-dialog-title').textContent = button.dataset.coCode
  const image = document.getElementById('co-dialog-image')
  image.src = button.dataset.coPreview
  image.alt = button.dataset.coCode
  dialog.querySelector(':scope > p').textContent = button.dataset.coCode.startsWith('TD-') ? 'ภาพแบบเสื้อพิมพ์ลาย · สี โลโก้ และข้อความปรับตามโจทย์บริษัทได้' : 'ภาพลูกค้าองค์กรสวมเสื้อทีมดี'
  dialog.showModal()
})
document.getElementById('co-dialog-close')?.addEventListener('click', () => dialog.close())
dialog?.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close() } })
