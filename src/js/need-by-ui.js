import '../styles/need-by.css'
/* ช่อง "ต้องใช้เสื้อวันที่…" (ตรวจมือถือ 30 ต.ค. ข้อ 35) · ตรรกะอยู่ need-by.js (มีเทส) ไฟล์นี้แค่ผูกกับหน้า
   เลือกวัน → บอกวันยืนยันแบบ + โอนมัดจำ ใน live region แล้วต่อท้ายข้อความ LINE ของปุ่มที่ส่งมา (hero · แถบล่างมือถือ) */
import lead from '../data/lead-times.json'
import { todayLocal } from './lib.js'
import { hrefWithDate } from './use-cta.js'
import { planNeedBy, needByText } from './need-by.js'

const LINE = 'https://line.me/R/oaMessage/'
const el = (tag, cls, text) => {
  const n = document.createElement(tag)
  n.className = cls
  if (text) n.textContent = text
  return n
}

/**
 * ผูกช่องวันที่กับผลลัพธ์ + ลิงก์ LINE · คืน false ถ้าสินค้านี้ไม่มีเวลาผลิตใน lead-times.json (หน้าเดิมทำงานแบบเก่าต่อ)
 * @param {{input: HTMLInputElement, out: HTMLElement, productId: string, links: (HTMLAnchorElement|null)[], cta?: boolean}} o
 */
export function bindNeedBy({ input, out, productId, links, cta = true }) {
  if (!input || !out || !lead[productId]?.days) return false
  const items = links.filter(Boolean).map((a) => ({ a, base: a.getAttribute('href') }))
  const hint = [...out.childNodes].map((n) => n.cloneNode(true))
  input.min = todayLocal()
  const update = () => {
    const x = needByText(planNeedBy(input.value, todayLocal(), lead, productId), lead)
    const iso = x?.status === 'past' ? '' : input.value
    for (const { a, base } of items) a.setAttribute('href', hrefWithDate(base, iso, x?.note))
    out.dataset.status = x?.status || ''
    if (!x) return out.replaceChildren(...hint.map((n) => n.cloneNode(true)))
    const head = el('p', 'nb__head')
    head.append(el('span', `nb__tag nb__tag--${x.status}`, x.tag), el('span', 'nb__need', x.need))
    const kids = [head, el('p', 'nb__main', x.main)]
    if (x.basis) kids.push(el('p', 'nb__basis', x.basis))
    const line = items.find(({ a }) => a.getAttribute('href').startsWith(LINE))?.a
    if (cta && x.cta && line) {
      const a = el('a', 'nb__cta', x.cta)
      a.href = line.getAttribute('href')
      a.dataset.track = 'line'
      a.dataset.where = 'need-by'
      kids.push(a)
    }
    out.replaceChildren(...kids)
  }
  input.addEventListener('change', update)
  if (input.value) update() // กลับมาหน้าเดิม (bfcache/ฟอร์มจำค่า) ให้ผลลัพธ์ตรงกับค่าในช่อง
  return true
}

/* หน้าสินค้า: ช่องอยู่ใน ppHero.hbs (data-need-by="{{item.id}}") ทุกหน้า */
export function initNeedBy() {
  const box = document.querySelector('[data-need-by]')
  if (!box) return
  const ok = bindNeedBy({
    input: box.querySelector('input[type="date"]'),
    out: box.querySelector('[aria-live]'),
    productId: box.dataset.needBy,
    links: [document.querySelector(`[data-where="pp-hero"] a[href^="${LINE}"]`), document.querySelector('.mobilebar .mb__line')],
  })
  if (!ok) box.hidden = true
}
