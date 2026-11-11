/* ช่องคลิป (partials/videoSlot.hbs) · ไฟล์คลิปของเรา: กดรูปปกแล้วค่อยโหลดวิดีโอ หน้าเว็บไม่ต้องโหลดตั้งแต่แรก
   ไม่เล่นเอง ไม่ปิดเสียงเอง · ใส่ซับไทยถ้ามี (คนเปิดเสียงไม่ได้ก็ตามเรื่องได้) */
import { getConsent, setConsent, onConsent, needsAsk } from './consent.js'

/* ตัวเล่น Facebook (videoSlot.hbs mode embed) · ใส่ src เมื่อยินยอมหมวดสื่อจากภายนอก (media) เท่านั้น
   30 ต.ค.: แยกจากหมวดโฆษณา (marketing) · เล่นคลิปไม่เปิดคุกกี้โฆษณาทั้งเว็บอีกแล้ว */
/* 30 ต.ค. (อาร์ตอนุญาต): ยินยอมแล้วก็ยังไม่โหลดตัวเล่นทุกตัว · แต่ละช่องเป็นปุ่ม "เล่นคลิป" กดแล้วค่อยโหลดตัวนั้น
   (ตัวเล่น FB ตัวละ ~0.5–1MB JS · หน้าแรก/ผลงานมี 4 ตัว) */
const start = (f) => {
  if (f.getAttribute('src') !== f.dataset.src) f.src = f.dataset.src
  f.dataset.started = '1'
  f.tabIndex = 0
  f.parentElement.classList.remove('is-gated', 'is-ready')
  const gate = f.parentElement.querySelector('.vslot__gate')
  if (gate) gate.hidden = true
}
/* 3 พ.ย. (อาร์ต "ให้คลิปแสดงมาเลย เอาแค่สามคลิป"): กล่องที่ตั้ง data-embed-auto (หน้าแรก 3 คลิป) ยินยอมสื่อแล้ว = ตัวเล่นขึ้นเอง
   (iframe loading=lazy โหลดเมื่อเลื่อนมาใกล้) · ยังไม่ยินยอม = ขออนุญาตก่อนตาม PDPA เหมือนเดิม */
export const autoStart = (c, auto) => !!(c?.media && auto)

const applyEmbeds = (c, root = document) => {
  for (const f of root.querySelectorAll('.vslot__frame iframe[data-src]')) {
    const box = f.parentElement
    const gate = box.querySelector('.vslot__gate')
    if (c.media && f.dataset.started) continue
    if (autoStart(c, !!f.closest('[data-embed-auto]'))) { start(f); continue }
    /* ยังไม่ยินยอม = กรอบเตี้ยพร้อมคำอธิบาย · ยินยอมแล้ว = กรอบเตี้ยปุ่มเล่นอย่างเดียว · กดเล่นแล้วค่อยเป็น 9:16 */
    box.classList.add('is-gated')
    box.classList.toggle('is-ready', !!c.media)
    /* ยังไม่โหลด: iframe ว่างไม่ให้กด Tab ไปถึง */
    f.tabIndex = -1
    /* ถอนความยินยอม = ปิดตัวเล่นทันที ไม่ปล่อยค้างหลังกรอบ (ตรวจโค้ด 26 ต.ค. M2) */
    if (!c.media) { delete f.dataset.started; if (f.getAttribute('src') && f.getAttribute('src') !== 'about:blank') f.src = 'about:blank' }
    if (gate) gate.hidden = false
    const btn = gate?.querySelector('[data-allow-media]')
    if (btn) btn.textContent = c.media ? 'เล่นคลิป' : 'ยอมรับตัวเล่น Facebook และเล่นคลิป'
  }
}

export function initVideoSlots(root = document) {
  applyEmbeds(getConsent(), root)
  onConsent((c) => applyEmbeds(c, root))
  /* กดเล่นในกรอบขออนุญาต = ยินยอมหมวดสื่ออย่างเดียว (คงวัดผล/โฆษณาตามที่เลือกไว้)
     ยังไม่เคยตอบป้ายคุกกี้ = เล่นคลิปที่กดครั้งนี้อย่างเดียว ไม่บันทึก (เดิมบันทึกวัดผล/โฆษณาเป็น "ไม่" แทนผู้ใช้ ป้ายเลยไม่ถามอีก · รีวิว 30 ต.ค.) */
  root.addEventListener('click', (e) => {
    const allow = e.target.closest('[data-allow-media]')
    if (!allow) return
    const frame = allow.closest('.vslot__frame')
    const c = getConsent()
    if (!c.media && !needsAsk(c)) setConsent({ analytics: c.analytics, marketing: c.marketing, media: true })
    /* โหลดเฉพาะช่องที่กด · ปุ่มที่กดถูกซ่อน → ย้ายโฟกัสไปตัวเล่น ไม่ให้หลุดไป <body> */
    const f = frame?.querySelector('iframe[data-src]')
    if (f) { start(f); f.focus() }
  })
  for (const btn of root.querySelectorAll('.vslot__play')) {
    btn.addEventListener('click', () => {
      const v = document.createElement('video')
      Object.assign(v, { controls: true, playsInline: true, preload: 'auto', poster: btn.dataset.poster })
      v.className = 'vslot__video'
      v.setAttribute('aria-label', btn.getAttribute('aria-label').replace(/^เล่นคลิป /, 'คลิป '))
      const src = document.createElement('source')
      src.src = btn.dataset.video
      src.type = 'video/mp4'
      v.append(src)
      if (btn.dataset.captions) {
        const t = document.createElement('track')
        Object.assign(t, { kind: 'captions', srclang: 'th', label: 'ไทย', src: btn.dataset.captions, default: true })
        v.append(t)
      }
      btn.replaceWith(v)
      v.focus()
      v.play().catch(() => {})
    })
  }
}
