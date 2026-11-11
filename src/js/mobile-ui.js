/* มือถือทั้งเว็บ ข (30 ต.ค. อาร์ต "เน้นมือถือ ทั้งเว็บ" · หน้าสั้นลง) — ของกลางทุกหน้า เรียกจาก site-extras.js
   1. ท้ายเว็บ: ลิงก์ 3 กลุ่มพับเป็นหัวข้อกดเปิด (เดิมพับเฉพาะหน้าแรก หน้าอื่นสูง ~1,670px ที่ 375) · จอคอมคืนตำแหน่งเดิม
   2. ราง: การ์ดที่เรียงลงยาว ๆ เป็นแถวเลื่อนแนวนอน (CSS .m-rail ใน main.css มีผลเฉพาะ < 768px) + ตัวนับและปุ่มเลื่อน
   3. ตารางยาวพับเป็นปุ่มกดดู (รอบ 44) · จอคอมคืนตำแหน่งเดิม
   ไม่ตัดเนื้อหา ทุกใบยังอยู่ในหน้า */

/** ส่วนที่เป็นรางบนมือถือ · หน้ารีวิวรวม (.rvc--all) คงเป็นคอลัมน์ */
export const RAILS = [
  '.download-assets__catalog',
  '.download-assets__details',
  '.pp-work-grid',
  'ul.rvc:not(.rvc--all)',
  'ul.pp-fabrics',
  'ul.pp-photos',
  /* การ์ดรูป 3 ใบของหน้าสินค้า (ตัวเลือก · รายละเอียด) · 2 พ.ย.: เรียงลงกิน 1,500–2,300px ต่อส่วน */
  '.pp-cards',
  /* การ์ดราคาหน้ากลุ่มลูกค้า · 2 พ.ย.: 6 ใบเรียงลงยาว 2,300px (หน้างานอีเวนต์) */
  'ul.uq-grid',
  /* การ์ดบริบทงานแบบเดิม · กล่องแท็บโฉมใหม่ (up2-ctx__box ยังมีคลาส up-contexts) ไม่ใช่ราง (4 พ.ย. แท็บกับแผงเรียงข้างกันบนมือถือ) */
  '.up-contexts:not(.up2-ctx__box)',
  /* หน้าผลงาน: เรื่องราวลูกค้า 4 การ์ด ~700px เรียงลง 2,840px (ลองใช้จริง 30 ต.ค.) */
  'ol.sty',
]

/** ตารางที่พับบนมือถือ · label = ข้อความบนปุ่มกดเปิด */
export const MOBILE_FOLDS = [
  { sel: '.ptable.pp-size', label: 'ดูตารางไซซ์ (นิ้ว)' },
]

/** ใบที่ชิดขอบซ้ายของรางที่สุด (lefts = ตำแหน่งซ้ายของแต่ละใบ) · เลื่อนสุดขวาแล้วนับเป็นใบสุดท้าย */
export function railIndex(lefts, edge, atEnd) {
  if (atEnd) return lefts.length - 1
  let best = 0
  lefts.forEach((left, i) => { if (Math.abs(left - edge) < Math.abs(lefts[best] - edge)) best = i })
  return best
}

/** ใบแรกของแต่ละคอลัมน์ (รางหลายแถว ใบบน-ล่างอยู่ตำแหน่งซ้ายเดียวกัน) · lefts เรียงตามลำดับใบ */
export function railColumns(lefts) {
  const kept = []
  return lefts.flatMap((left, i) => { if (kept.some((k) => Math.abs(k - left) < 2)) return []; kept.push(left); return [i] })
}

let railSeq = 0
/** ตัวนับ + ปุ่มก่อนหน้า/ถัดไป ใต้ราง (ใช้ได้แม้คลิปในรางกินการปัด) · ซ่อนบนจอคอมด้วย CSS */
export function addRailControls(rail, className = 'm-rail-controls') {
  if ([...rail.children].filter((el) => !el.hidden).length < 2) return
  if (!rail.id) rail.id = `m-rail-${++railSeq}`
  const controls = document.createElement('div')
  controls.className = className
  /* ปุ่มลูกศรมีบริบทสำหรับโปรแกรมอ่านจอ: กลุ่มชื่อ "เลื่อนดู: <หัวข้อส่วนนั้น>" (ตรวจมือถือ 30 ต.ค.) · ไม่ใส่ role ที่ราง (ul/ol ต้องคงความเป็นรายการ) */
  const heading = rail.closest('section, article')?.querySelector('h2, h3')?.textContent.replace(/\s+/g, ' ').trim()
  controls.setAttribute('role', 'group')
  controls.setAttribute('aria-label', heading ? `เลื่อนดู: ${heading}` : 'เลื่อนดูรายการ')
  const count = document.createElement('span')
  const prev = document.createElement('button')
  const next = document.createElement('button')
  prev.type = next.type = 'button'
  prev.textContent = '←'; next.textContent = '→'
  prev.setAttribute('aria-label', 'รายการก่อนหน้า')
  next.setAttribute('aria-label', 'รายการถัดไป')
  prev.setAttribute('aria-controls', rail.id); next.setAttribute('aria-controls', rail.id)
  controls.append(count, prev, next)
  rail.after(controls)
  let current = 0
  /* ใบที่มองเห็นจริง ณ ตอนนั้น (30 ต.ค.: เดิมเก็บรายการครั้งเดียว · ใบที่ CSS ซ่อน (เลือกสีหน้าโปโลปัก) และใบที่ย้ายเข้ามาตอนหมุนจอ นับผิด) */
  const items = () => [...rail.children].filter((el) => !el.hidden && el.getClientRects().length)
  /* จุดหยุด = ใบแรกของแต่ละคอลัมน์ · ตำแหน่งวัดรวมระยะที่เลื่อนไปแล้ว จึงคงที่ระหว่างเลื่อน */
  const stops = () => { const list = items(); return railColumns(list.map((item) => item.getBoundingClientRect().left + rail.scrollLeft)).map((i) => list[i]) }
  /* ปุ่มสุดทางใช้ aria-disabled ไม่ใช้ disabled โฟกัสไม่หลุด (แบบเดียวกับ home-picker.js) */
  const off = (b, on) => b.setAttribute('aria-disabled', String(on))
  const update = () => {
    const cols = stops()
    controls.hidden = cols.length < 2
    if (cols.length < 2) return
    const edge = rail.getBoundingClientRect().left + 2
    const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 3
    current = railIndex(cols.map((item) => item.getBoundingClientRect().left), edge, atEnd)
    count.textContent = `${current + 1} / ${cols.length}`
    off(prev, current === 0); off(next, current === cols.length - 1)
  }
  const go = (direction) => {
    const cols = stops()
    const i = current + direction
    if (i < 0 || i >= cols.length) return
    rail.scrollTo({ left: rail.scrollLeft + cols[i].getBoundingClientRect().left - rail.getBoundingClientRect().left - 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1))
  rail.addEventListener('scroll', update, { passive: true })
  addEventListener('resize', update)
  /* ใบถูกเพิ่ม/ย้าย/ซ่อนด้วย class (ตัวกรองสี · หมุนจอ) → นับใหม่ */
  new MutationObserver(() => requestAnimationFrame(update)).observe(rail, { childList: true, attributes: true, attributeFilter: ['class', 'hidden'], subtree: true })
  update()
}

export function initMobileUi() {
  document.querySelectorAll(RAILS.join(',')).forEach((rail) => {
    rail.classList.add('m-rail')
    addRailControls(rail)
  })

  /* พับท้ายเว็บ (h2 → summary · ul → ตัวพับ) และตารางยาว · กลับที่เดิมเมื่อจอกว้างขึ้น */
  const mobile = matchMedia('(max-width: 767px)')
  const undo = []
  const move = (node, parent) => {
    const marker = document.createComment('mobile-position')
    node.before(marker)
    parent.append(node)
    undo.push(() => { marker.replaceWith(node) })
  }
  /* สร้าง <details> แทนที่ before แล้วย้าย head (ถ้ามี) เข้า summary · nodes เข้าตัวพับ */
  const fold = (before, className, head, nodes) => {
    const details = document.createElement('details')
    details.className = `m-fold ${className}`
    const summary = document.createElement('summary')
    const body = document.createElement('div')
    body.className = 'm-fold__body'
    details.append(summary, body)
    before.before(details)
    undo.push(() => details.remove())
    if (typeof head === 'string') summary.textContent = head
    else move(head, summary)
    nodes.forEach((node) => move(node, body))
  }
  const mount = () => {
    document.querySelectorAll('.ft__cols > nav').forEach((nav) => {
      const heading = nav.querySelector('h2')
      const list = nav.querySelector('ul')
      if (heading && list) fold(heading, 'ft__fold', heading, [list])
    })
    MOBILE_FOLDS.forEach(({ sel, label }) => {
      document.querySelectorAll(sel).forEach((node) => fold(node, 'm-fold--table', label, [node]))
    })
  }
  const sync = () => {
    while (undo.length) undo.pop()()
    if (mobile.matches) mount()
  }
  sync()
  mobile.addEventListener('change', sync)
}

/* แถบล่างมือถือหลบลงขณะปุ่ม LINE ของจอแรกยังอยู่ในจอ (critique 24 ต.ค. · CSS html.is-hero-cta)
   2 พ.ย.: เดิมผูกแค่หน้าแรก (home.js) หน้าสินค้า/หน้ากลุ่มเห็นปุ่ม LINE 2 ปุ่มซ้อนในจอแรก → ทุกแม่แบบ */
export const HERO_CTA = '[data-where="hero"], [data-where="pp-hero"], [data-where="use-hero"]'
export function initHeroBar() {
  const btn = document.querySelector(HERO_CTA)
  if (!btn || !('IntersectionObserver' in window)) return
  /* ตอนหลบ แถบล่างต้องกด Tab ไม่ถึงด้วย ไม่งั้นโฟกัสไปอยู่นอกจอ */
  const bar = document.querySelector('.mobilebar')
  new IntersectionObserver(([en]) => {
    document.documentElement.classList.toggle('is-hero-cta', en.isIntersecting)
    if (bar) bar.inert = en.isIntersecting && matchMedia('(max-width: 1023px)').matches
  }).observe(btn)
}
