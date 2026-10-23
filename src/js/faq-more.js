/* FAQ หน้าแรกบนมือถือ: แสดง 6 ข้อแรก กดดูที่เหลือ (อาร์ตเคาะ 23 ต.ค. ข้อ B) · ข้อที่ซ่อนยังอยู่ใน HTML ให้ FAQPage schema ตรงกับหน้า */
export const faqMoreLabel = (n, open) => (open ? 'ย่อคำถามกลับ' : `ดูอีก ${n} คำถาม`)

export function initFaqMore() {
  const btn = document.querySelector('[data-faq-more]')
  const list = btn && document.getElementById(btn.getAttribute('aria-controls'))
  if (!list) return
  const n = list.querySelectorAll('.hm-faq-more').length
  if (!n) { btn.hidden = true; return }
  list.classList.add('is-ready')
  const set = (open) => {
    list.classList.toggle('is-all', open)
    btn.setAttribute('aria-expanded', String(open))
    btn.textContent = faqMoreLabel(n, open)
  }
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true'
    /* ย่อกลับ: ข้อด้านบนหายไปหลายร้อย px · เลื่อนจอตามให้ปุ่มอยู่ที่เดิมใต้นิ้ว ไม่ให้หน้ากระโดด (agent มือถือ 23 ต.ค.) */
    const before = btn.getBoundingClientRect().top
    set(open)
    if (!open) window.scrollBy(0, btn.getBoundingClientRect().top - before)
    /* เปิดแล้วพาโฟกัสไปข้อแรกที่เพิ่งโผล่ คนใช้คีย์บอร์ดไม่ต้องไล่ Tab ใหม่ */
    if (open) list.querySelector('.hm-faq-more .hs-accordion-toggle')?.focus()
  })
  set(false)
}
