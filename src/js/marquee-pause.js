/* ปุ่มหยุดแถวโลโก้/รูปที่เลื่อนเอง (ตรวจละเอียด 30 ต.ค. · WCAG 2.2.2 ระดับ A: ของที่เคลื่อนเองเกิน 5 วิ ต้องหยุดได้)
   แถบโลโก้หน้าแรกไม่มีปุ่ม (data-marquee-nobtn · อาร์ต 3 พ.ย.) หยุดตอนโฟกัสคีย์บอร์ดแทน
   แถวยังเลื่อนเองตามเดิม (มติ 23 ต.ค. ไม่หยุดตอนชี้) · เพิ่มแค่ปุ่ม หน้าตาเดียวกับปุ่มหยุดแถวรีวิว */
export function initMarqueePause() {
  document.querySelectorAll('[data-marquee]:not([data-marquee-nobtn])').forEach((m) => {
    const wrap = document.createElement('div')
    wrap.className = 'wrap mq-ctl'
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'rvm__pause'
    btn.setAttribute('aria-pressed', 'false')
    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path class="rvm__pi" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/><path class="rvm__pl" d="M8 5.5v13l11-6.5z"/></svg><span>หยุดเลื่อน</span>'
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true'
      btn.setAttribute('aria-pressed', String(on))
      btn.dataset.on = String(on)
      btn.querySelector('span').textContent = on ? 'เลื่อนต่อ' : 'หยุดเลื่อน'
      m.classList.toggle('is-paused', on)
    })
    wrap.append(btn)
    m.after(wrap)
  })
}
