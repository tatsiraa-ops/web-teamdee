/* สัญญาณวัดผลแอด 4 อย่าง (ตกลงกับอาร์ต 20 ต.ค. 2026) ส่งเข้า window.dataLayer ให้ GTM
   กดไลน์ · กดโทร · ส่งฟอร์ม · ใช้เครื่องคำนวณราคาจนเห็นผล
   ไม่มี GTM ก็ไม่พัง แค่ push เข้า array เฉยๆ · GA4 / Meta Pixel / Google Ads ไปตั้งใน GTM เอง ไม่ต้องแก้ธีม */

export const KINDS = ['line', 'phone', 'form', 'calc']
const EVENTS = { line: 'td_line_click', phone: 'td_phone_click', form: 'td_form_submit', calc: 'td_calc_result' }
export const eventFor = (kind) => EVENTS[kind] ?? null

const LINE_HOST = /^https?:\/\/(?:[a-z0-9-]+\.)*(?:line\.me|lin\.ee)(?:[/?#]|$)/i

/** ลิงก์นี้นับเป็นอะไร · data-track มาก่อน (ใช้ตอนลิงก์ไลน์จริงยังเป็น #) แต่ต้องเป็นชื่อที่รู้จัก */
export const classifyLink = ({ href = '', track } = {}) => {
  if (track) return KINDS.includes(track) ? track : null
  if (/^tel:/i.test(href)) return 'phone'
  if (LINE_HOST.test(href)) return 'line'
  return null
}

const push = (kind, extra = {}) => {
  const event = eventFor(kind)
  if (!event) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, td_page: location.pathname, ...extra })
}

export function initTracking() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href], [data-track]')
    if (!a) return
    const kind = classifyLink({ href: a.getAttribute('href') || '', track: a.dataset.track })
    if (kind === 'line' || kind === 'phone') {
      push(kind, { td_link: a.getAttribute('href') || '', td_where: a.closest('[aria-labelledby], header, footer, nav')?.id || a.closest('header, footer, nav')?.tagName.toLowerCase() || '' })
    }
  }, { capture: true })

  /* ฟอร์ม · Contact Form 7 ส่งสำเร็จจะยิง wpcf7mailsent (นับตอนส่งได้จริง ไม่นับตอนกดแล้ว error)
     ฟอร์มอื่นนับตอน submit · ไม่นับช่องค้นหา */
  let cf7 = false
  document.addEventListener('wpcf7mailsent', () => { cf7 = true; push('form', { td_form: 'cf7' }) })
  document.addEventListener('submit', (e) => {
    const f = e.target
    if (cf7 || f.matches('[role="search"], .wpcf7-form, #homePick')) return
    push('form', { td_form: f.id || f.getAttribute('name') || '' })
  }, { capture: true })

  /* เครื่องคำนวณราคา · calc-page.js ยิง td:calc หลังผู้ใช้เปลี่ยนตัวเลือกแล้วเห็นผล · นับครั้งเดียวต่อการเปิดหน้า */
  let calcSent = false
  document.addEventListener('td:calc', (e) => {
    if (calcSent) return
    calcSent = true
    push('calc', e.detail || {})
  })
}
