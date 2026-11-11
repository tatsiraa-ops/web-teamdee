/* ป้ายคุกกี้แถบล่าง + หน้าตั้งค่า (partials/consentBar.hbs) · ตรรกะ consent.js
   ยังไม่เลือก = โชว์แถบ · เลือกแล้ว = ซ่อน · ลิงก์ "ตั้งค่าคุกกี้" ใน footer เปิดหน้าตั้งค่าได้ทุกเมื่อ */
import { getConsent, setConsent, needsAsk, onConsent } from './consent.js'
import { liftFor, overlapsX } from './nudge.js'

export function initConsent() {
  const bar = document.getElementById('ckBar')
  const dlg = document.getElementById('ckDialog')
  if (!bar || !dlg) return
  const an = dlg.querySelector('#ckAnalytics')
  const mk = dlg.querySelector('#ckMarketing')
  const md = dlg.querySelector('#ckMedia')
  let opener = null

  /* การ์ดซ้ายกับปุ่มขวายกขึ้นเหนือป้าย ไม่ซ่อน (อาร์ต 26 ต.ค.: เดิมซ่อนจนการ์ดหาย) · ค่า --ck-lift ใช้ใน main.css */
  /* ยกเฉพาะฝั่งที่ทับป้ายจริง (จอคอมป้ายเป็นการ์ดกลางล่าง มักไม่ทับ · มือถือป้ายเต็มความกว้าง ทับทั้งคู่) */
  const lift = () => {
    const r = bar.hidden ? null : bar.getBoundingClientRect()
    const side = (sel) => {
      const el = document.querySelector(sel)
      const e = el?.getBoundingClientRect()
      return r && e && e.width && overlapsX(r, e) ? liftFor(r, innerHeight) : 0
    }
    const s = document.documentElement.style
    s.setProperty('--ck-lift-l', `${side('.nudge')}px`)
    s.setProperty('--ck-lift-r', `${side('.fcta')}px`)
  }
  const showBar = (on) => {
    bar.hidden = !on
    document.documentElement.classList.toggle('ck-on', on)
    lift()
  }
  addEventListener('resize', lift, { passive: true })
  if ('ResizeObserver' in window) new ResizeObserver(lift).observe(bar)
  /* ปิดผ่านฟังก์ชันเดียวทุกทาง ไม่พึ่ง event close ของ <dialog> (บางเบราว์เซอร์ไม่ยิง) */
  const closeSettings = () => {
    if (!dlg.open) return
    dlg.close()
    opener?.focus?.()
    opener = null
  }
  const choose = (choice) => {
    const fromBar = bar.contains(document.activeElement)
    setConsent(choice)
    showBar(false)
    closeSettings()
    /* ปุ่มในแถบที่กดถูกซ่อน → ย้ายโฟกัสไปเนื้อหาหลัก ไม่ให้หลุดไป <body> (ตรวจโค้ด 26 ต.ค. L5) */
    if (fromBar || !document.activeElement || document.activeElement === document.body) {
      const main = document.getElementById('main')
      if (main) { if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }) }
    }
  }
  const openSettings = (from) => {
    const c = getConsent()
    an.checked = c.analytics
    mk.checked = c.marketing
    if (md) md.checked = c.media
    opener = from
    dlg.showModal()
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ck]')
    if (!b) return
    const k = b.dataset.ck
    /* 30 ต.ค.: 3 หมวด · ยอมรับทั้งหมด = ทั้ง 3 */
    if (k === 'all') choose({ analytics: true, marketing: true, media: true })
    else if (k === 'none') choose({ analytics: false, marketing: false, media: false })
    else if (k === 'save') choose({ analytics: an.checked, marketing: mk.checked, media: !!md?.checked })
    else if (k === 'open') openSettings(b)
    else if (k === 'close') closeSettings()
  })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeSettings() })
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeSettings() })

  /* เลือกจากที่อื่น (เช่น กรอบขอเล่นคลิป Facebook) ก็ซ่อนแถบด้วย */
  onConsent(() => showBar(false))
  showBar(needsAsk(getConsent()))
}
