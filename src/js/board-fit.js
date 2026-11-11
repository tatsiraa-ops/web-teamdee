/* กระดานรีวิว /project/ (รอบ 169d · อาร์ต "ทำขนาดความสูงซ้ายขวามาดีๆหน่อย ทำให้มันเท่าๆกัน")
   คอม ≥1024: ทุกการ์ดรีวิวสูงเท่าการ์ดที่สูงสุด → กระดานไม่กระโดดตอนกดเลื่อน · ฝั่งซ้าย (โมเสก) ยืดตามด้วย CSS
   วัดด้วย JS เพราะกฎ [hidden] ของ preflight เป็น !important ในเลเยอร์ (CSS ซ้อนการ์ดในช่องเดียวไม่ได้) */
export const tallest = (hs) => hs.reduce((m, h) => Math.max(m, h), 0)

export function fitBoard(root = document.querySelector('.pj-rvb')) {
  const right = root?.querySelector('.hm-rvb__right')
  if (!right) return
  const fit = () => {
    right.style.removeProperty('--rvb-item-h')
    if (!matchMedia('(min-width: 1024px)').matches) return
    const items = [...right.querySelectorAll('[data-rvb-item]')]
    const hs = items.map((el) => {
      /* ใบที่ซ่อน: เปิดชั่วคราวแบบมองไม่เห็น (hidden + คลาส is-on ของ home.css) วัดแล้วคืนค่า */
      const was = el.hidden
      if (was) { el.hidden = false; el.classList.add('is-on'); el.style.visibility = 'hidden' }
      const h = el.getBoundingClientRect().height
      if (was) { el.hidden = true; el.classList.remove('is-on'); el.style.visibility = '' }
      return h
    })
    right.style.setProperty('--rvb-item-h', `${Math.ceil(tallest(hs))}px`)
  }
  fit()
  /* วัดใหม่เมื่อความกว้างคอลัมน์เปลี่ยน (ResizeObserver · บางกรณีไม่มี resize event) · ความสูงที่ตั้งเองไม่ทำให้วนซ้ำ */
  let t, w = right.clientWidth
  new ResizeObserver(() => { if (right.clientWidth === w) return; w = right.clientWidth; clearTimeout(t); t = setTimeout(fit, 120) }).observe(right)
  /* ฟอนต์ไทยโหลดทีหลัง = ข้อความตัดบรรทัดใหม่ · วัดซ้ำ */
  document.fonts?.ready.then(fit)
}
