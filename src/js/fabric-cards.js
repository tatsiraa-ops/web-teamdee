/* ผ้าพิมพ์ลาย /sublimation/ · สองแถวเลื่อน (ผ้ามาตรฐาน · ผ้าใหม่)
   ประวัติ: 185 การ์ดสะสม → 186 ทางการ → 187 สมุดตัวอย่างผ้า → 188 วงแหวน 3D → 189 ใบกลางขยาย
   → 190 อาร์ต "กระตุกเยอะในการขยาย · uiux โหล sloppy" เลือก B: ทุกใบขนาดเท่ากัน ข้อมูลครบ ไม่ยืด/ย่อ
   → 191 อาร์ต "เลื่อนแล้ววนกลับมาที่เดิมได้มั้ย แบบไม่มีสิ้นสุด และบอกจุดเริ่มหรือสิ้นสุดไว้ด้วย กันงง"
   - วนไม่สุด: JS ทำสำเนาก่อน/หลัง (aria-hidden · ลิงก์ tabindex -1) · หยุดเลื่อนในสำเนา = กระโดดกลับใบจริงใบเดียวกันทันที (ตำแหน่งตรงกัน มองไม่เห็นรอยต่อ)
   - บอกตำแหน่ง: แผ่นคั่น "จบแถว · เริ่มใหม่" ระหว่างใบสุดท้ายกับใบแรก · จุดใต้แถว (กดไปผ้านั้นทางสั้น) · ตัวนับ "4 / 8 · ชื่อผ้า"
   - ไม่คำนวณอะไรทุกเฟรม: เลื่อนแล้วแค่หาใบกลาง สลับคลาสเมื่อเปลี่ยนใบ · ไม่มี JS = รางธรรมดา ข้อมูลครบทุกใบ */
/** ใบที่จุดกลางใกล้กลางรางที่สุด */
export const centerIndex = (centers, mid) => centers.reduce((best, c, i) => (Math.abs(c - mid) < Math.abs(centers[best] - mid) ? i : best), 0)
/** scrollLeft ที่ทำให้ใบ (left, width) อยู่กลางรางกว้าง trackW */
export const scrollLeftFor = (left, width, trackW) => Math.max(0, left + width / 2 - trackW / 2)
/** ใบเริ่มต้น = กลางแถว (8 ใบ → ใบที่ 4 · 6 ใบ → ใบที่ 3) */
export const startIndex = (n) => Math.max(0, Math.floor((n - 1) / 2))
/** ตำแหน่งในราง 3 ชุด (สำเนาก่อน · จริง · สำเนาหลัง) → ใบจริงที่ตรงกัน */
export const loopHome = (v, n) => n + (((v % n) + n) % n)
/** ผ้าลำดับ k (0..n-1) ในชุดที่ใกล้ตำแหน่ง v ที่สุด */
export const nearestCopy = (k, v, n) => [k, n + k, 2 * n + k].reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a))

function sepEl(text) {
  const li = document.createElement('li')
  li.className = 'fx__sep'
  li.setAttribute('aria-hidden', 'true')
  li.innerHTML = `<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6"/><path d="M4 4v4.6h4.6"/></svg><span>${text}</span>`
  return li
}

function initRow(row, reduce) {
  const track = row.querySelector('.fx__track')
  if (!track) return
  const originals = [...track.children]
  const n = originals.length
  const behavior = reduce ? 'auto' : 'smooth'
  const names = originals.map((li) => li.querySelector('.fx__name')?.textContent.trim() || '')
  const dots = [...row.querySelectorAll('.fx__dot')]
  const count = row.querySelector('.fx__count')
  const loop = n > 2

  /* สำเนาก่อน/หลัง + แผ่นคั่นจุดวน */
  if (loop) {
    const clone = (li) => {
      const c = li.cloneNode(true)
      c.classList.add('is-clone')
      c.setAttribute('aria-hidden', 'true')
      c.querySelectorAll('a, button').forEach((el) => { el.tabIndex = -1 })
      return c
    }
    const sepText = 'จบแถว · เริ่มใหม่'
    track.prepend(...originals.map(clone), sepEl(sepText))
    track.append(sepEl(sepText), ...originals.map(clone))
  }
  const items = [...track.querySelectorAll('.fx__c')]
  const base = loop ? n : 0
  let current = -1

  let centers = []
  const measure = () => { centers = items.map((li) => li.offsetLeft + li.offsetWidth / 2) }
  const leftFor = (v) => scrollLeftFor(items[v].offsetLeft, items[v].offsetWidth, track.clientWidth)
  const jump = (left) => { track.style.scrollBehavior = 'auto'; track.scrollLeft = left; track.style.scrollBehavior = '' }

  const update = () => {
    const ci = centerIndex(centers, track.scrollLeft + track.clientWidth / 2)
    if (ci === current) return
    items[current]?.classList.remove('is-center')
    items[ci].classList.add('is-center')
    current = ci
    const k = ci % n
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === k)))
    if (count) count.textContent = `${k + 1} / ${n} · ${names[k]}`
  }
  /* หยุดเลื่อนในสำเนา → กระโดดกลับใบจริงใบเดียวกัน (ระยะเท่ากันทุกใบ จึงตรงพิกเซล) */
  const settle = () => {
    if (!loop || current < 0) return
    const home = loopHome(current, n)
    if (home === current) return
    jump(track.scrollLeft + (items[home].offsetLeft - items[current].offsetLeft))
    update()
  }
  const goTo = (v) => track.scrollTo({ left: leftFor(Math.max(0, Math.min(items.length - 1, v))), behavior })

  row.classList.add('is-js')
  measure()
  track.addEventListener('scroll', update, { passive: true })
  let t = 0
  track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(settle, 160) }, { passive: true })
  if ('onscrollend' in window) track.addEventListener('scrollend', () => { clearTimeout(t); settle() })
  addEventListener('resize', () => { measure(); const keep = current; current = -1; items.forEach((li) => li.classList.remove('is-center')); if (keep >= 0) jump(leftFor(keep)); update() })
  row.querySelector('.fx__btn--prev')?.addEventListener('click', () => goTo(current - 1))
  row.querySelector('.fx__btn--next')?.addEventListener('click', () => goTo(current + 1))
  dots.forEach((d, k) => d.addEventListener('click', () => goTo(loop ? nearestCopy(k, current, n) : k)))
  /* กดใบข้าง (ตรงที่ไม่ใช่ลิงก์) = เลื่อนมากลาง */
  track.addEventListener('click', (e) => {
    if (e.target.closest('a')) return
    const li = e.target.closest('.fx__c')
    if (li && !li.classList.contains('is-center')) goTo(items.indexOf(li))
  })
  /* เริ่มที่ใบกลางแถวของชุดจริง · ตั้งทันทีไม่เลื่อนนุ่ม */
  jump(leftFor(base + startIndex(n)))
  update()
}

export function initFabricCards(root = document) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  root.querySelectorAll('[data-fx]').forEach((row) => initRow(row, reduce))
}
