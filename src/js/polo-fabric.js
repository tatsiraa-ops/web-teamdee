/* 11 พ.ย. 2026 หน้างานปัก: ผ้า + สี + ราคา (pp2PoloFabric.hbs)
   12 พ.ย. รอบ 217: ตัวเลือกผ้าสองฝั่ง · กดหัวแถวผ้า (data-pick) = แถวไฮไลต์ + แผงรายละเอียดฝั่งขวาเปลี่ยน · มือถือมีชิปช่วงจำนวน (data-band)
   ไม่มี JS = ทุกแผงเรียงลงมาครบ · กดวงสี = เลือกสีเดียวต่อผ้า → ข้อความ LINE ขอตัวอย่างใส่ชื่อผ้าและรหัสสี (ไม่มีข้อมูลส่วนตัวใน URL) */
import { lineMessageUrl } from './contact-send.js'

export const askText = (fabric, code) => `ขอตัวอย่าง${fabric}\nสีที่สนใจ: ${code || ''}\nจำนวนที่จะสั่งประมาณ:  ตัว`

export function initPoloFabric(root = document) {
  const box = root.querySelector('[data-pf2]')
  if (!box) return
  const picks = [...box.querySelectorAll('[data-pick]')]
  const panels = [...box.querySelectorAll('.pf4__panel')]
  const rows = [...box.querySelectorAll('.pf4__t tbody tr')]
  const table = box.querySelector('.pf4__t')
  const chips = [...box.querySelectorAll('[data-band]')].filter((x) => x.tagName === 'BUTTON')
  const show = (id) => {
    for (const b of picks) b.setAttribute('aria-pressed', String(b.dataset.pick === id))
    for (const p of panels) p.hidden = p.dataset.fab !== id
    for (const r of rows) r.classList.toggle('is-sel', r.dataset.f === id)
  }
  /* มือถือ: ชิปช่วงจำนวน → ตารางเหลือคอลัมน์ราคาช่วงนั้น (CSS อ่าน .is-band) */
  const band = (i) => {
    for (const c of chips) c.setAttribute('aria-pressed', String(c.dataset.band === String(i)))
    for (const c of box.querySelectorAll('.pf4__t [data-b]')) c.classList.toggle('is-band', c.dataset.b === String(i))
    if (table) table.dataset.band = i
  }
  show(panels[0]?.dataset.fab)
  band(0)
  box.classList.add('is-js')
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]')
    if (b) return show(b.dataset.pick)
    const c = e.target.closest('button[data-band]')
    if (c) return band(c.dataset.band)
    const tr = e.target.closest('.pf4__t tbody tr') /* กดตรงไหนของแถวก็เลือกผ้า (ปุ่มในหัวแถวไว้ให้คีย์บอร์ด) */
    if (tr) show(tr.dataset.f)
  })
  for (const p of panels) {
    const picked = p.querySelector('[data-picked]'), ask = p.querySelector('[data-ask]')
    p.addEventListener('click', (e) => {
      const b = e.target.closest('.pf2__c')
      if (!b) return
      const on = b.getAttribute('aria-pressed') !== 'true'
      for (const x of p.querySelectorAll('.pf2__c')) x.setAttribute('aria-pressed', 'false')
      b.setAttribute('aria-pressed', String(on))
      const code = on ? b.dataset.code : ''
      picked.innerHTML = code ? `สีที่เลือก <b>${code}</b> · ส่งรหัสนี้ให้ทีมดีได้เลย` : ''
      ask.href = lineMessageUrl(askText(p.dataset.name, code))
    })
  }
}
