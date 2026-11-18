import { lineMessageUrl } from './contact-send.js'
/* 18 พ.ย. 2026 หน้าสกรีน: เลือกขนาดลาย (อาร์ต "เสื้อสีขาวโทนเดียว ทำกรอบ เอาโลโก้ไปใส่") · src/partials/screenShowcase.hbs
   ปุ่ม A7–A3 (ข้อมูลทุกขนาดเห็นครบบนปุ่ม) → เปลี่ยน data-size ที่เวที · CSS ย้ายกรอบและโลโก้ตามสัดส่วน ซม. บนเสื้อไซซ์ L
   ไม่มี JS = เวทีแสดง A4 ค้างไว้ ข้อมูลบนปุ่มยังอ่านได้ครบ */
export function initScreenSize(root = document) {
  for (const box of root.querySelectorAll('[data-szx]')) {
    const stage = box.querySelector('[data-szx-stage]')
    const btns = [...box.querySelectorAll('[data-szx-pick]')]
    const say = box.querySelector('[data-szx-say]')
    const w = box.querySelector('[data-szx-w]'), h = box.querySelector('[data-szx-h]')
    const pick = (b) => {
      stage.dataset.size = b.dataset.szxPick
      for (const x of btns) x.setAttribute('aria-pressed', String(x === b))
      const [cw, ch] = b.dataset.szxCm.split('×').map((x) => x.trim())
      if (w) w.textContent = `${cw} ซม.`
      if (h) h.textContent = `${ch} ซม.`
      if (say) say.textContent = `ขนาด ${b.dataset.szxPick} ${b.dataset.szxCm} ซม. บนเสื้อไซซ์ L`
    }
    for (const b of btns) b.addEventListener('click', () => pick(b))
  }
}

/* 18 พ.ย. 2026 ตารางไซซ์หน้าสกรีน (อาร์ต "เมื่อสลับเสื้อทำให้สูงเท่ากัน"): ปุ่มไซซ์ Premium 8 · Oversize 3
   จองความสูงเท่ากลุ่มที่สูงที่สุด (--sz-picks-h ใน screen.css) · วัดใหม่เมื่อเปลี่ยนขนาดจอ */
export function initEqualSizePicks(root = document) {
  const box = root.querySelector('.screen-page #size')
  if (!box) return
  const groups = [...box.querySelectorAll('.pp2-sz__picks')]
  const fit = () => {
    box.style.removeProperty('--sz-picks-h')
    const tallest = Math.max(...groups.map((g) => { const was = g.hidden; g.hidden = false; const h = g.getBoundingClientRect().height; g.hidden = was; return h }))
    box.style.setProperty('--sz-picks-h', `${Math.ceil(tallest)}px`)
  }
  fit()
  let t
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150) })
}

/* 18 พ.ย. 2026 การ์ดเสื้อ 2 ทรง (screenShowcase.hbs): กดสี → ย้อมเสื้อ (CSS --c) · ชื่อสี · ข้อความ LINE ในปุ่มขอราคาใส่สีที่เลือก */
export function initShirtColors(root = document) {
  for (const card of root.querySelectorAll('[data-scf]')) {
    const name = card.querySelector('[data-scf-name]')
    const line = card.querySelector('[data-scf-line]')
    const dots = [...card.querySelectorAll('[data-scf-color]')]
    for (const d of dots) d.addEventListener('click', () => {
      card.style.setProperty('--c', d.dataset.scfColor)
      for (const x of dots) x.setAttribute('aria-pressed', String(x === d))
      if (name) name.textContent = d.dataset.scfLabel
      if (line) line.href = lineMessageUrl(`${line.dataset.ask}\nสี: ${d.dataset.scfLabel}\nลายที่จะสกรีน / ตำแหน่ง: \nจำนวนประมาณ:  ตัว`)
    })
  }
}
