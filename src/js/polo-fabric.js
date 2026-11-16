import { lineMessageUrl } from './contact-send.js'

export const askText = (fabric, code, quantity = '') => `ขอตัวอย่าง${fabric}\nสีที่สนใจ: ${code || ''}\nจำนวนที่จะสั่งประมาณ: ${quantity} ตัว`
export const quoteText = (fabric, code) => `ขอใบเสนอราคาเสื้อโปโลปัก\nผ้าที่เลือก: ${fabric}\nสีที่สนใจ: ${code || 'ขอคำแนะนำเรื่องสี'}\nจำนวน:  ตัว\nปักโลโก้ 1 จุดที่อก`

export function initPoloFabric(root = document) {
  const box = root.querySelector('[data-pf2]')
  if (!box) return
  const panels = [...box.querySelectorAll('.pf4__panel')]
  const update = () => {
    for (const panel of panels) {
      const code = panel.querySelector('.pf2__c[aria-pressed="true"]')?.dataset.code || ''
      panel.querySelector('[data-picked]').textContent = code ? `สีที่เลือก: ${code}` : ''
      panel.querySelector('[data-ask]').href = lineMessageUrl(askText(panel.dataset.name, code))
      panel.querySelector('[data-quote]').href = lineMessageUrl(quoteText(panel.dataset.name, code))
      panel.querySelector('[data-quote-label]').textContent = 'ขอราคาทาง LINE'
    }
  }
  box.addEventListener('click', e => {
    const swatch = e.target.closest('.pf2__c')
    if (!swatch) return
    const panel = swatch.closest('.pf4__panel')
    const on = swatch.getAttribute('aria-pressed') !== 'true'
    for (const b of panel.querySelectorAll('.pf2__c')) b.setAttribute('aria-pressed', 'false')
    swatch.setAttribute('aria-pressed', String(on))
    update()
  })
  update()
}
