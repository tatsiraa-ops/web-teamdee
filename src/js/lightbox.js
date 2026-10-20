/* กล่องดูรูปใหญ่ ใช้ร่วมกันทั้งหน้าผลงานและหน้ารีวิว
   ทำเองไม่พึ่งไลบรารี เพราะต้องการแค่ เปิด ปิด เลื่อนซ้ายขวา และต้องคุม focus ให้ถูก
   ใช้ <dialog> เพราะได้ modal จริง กด Esc ปิดได้เอง และของข้างหลังกด Tab ไม่ถึง */

const ICON = {
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  prev: '<path d="m15 6-6 6 6 6"/>',
  next: '<path d="m9 6 6 6-6 6"/>',
}
const svg = (d) =>
  `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`

/**
 * @param {string} gridSel  ตัวครอบที่มีรูปทั้งหมด
 * @param {string} itemSel  แต่ละช่องรูปในนั้น
 * @param {string} label    ใช้บอก screen reader ว่ากล่องนี้คืออะไร
 */
export function initLightbox(gridSel, itemSel, label, opts = {}) {
  const grid = document.querySelector(gridSel)
  if (!grid) return

  const dlg = document.createElement('dialog')
  dlg.className = 'lb'
  dlg.setAttribute('aria-label', label)
  dlg.dataset.lineUrl = opts.lineUrl || grid.dataset.lineUrl || '#'
  dlg.innerHTML = `
    <figure class="lb__fig">
      <img class="lb__img" alt="">
      <figcaption class="lb__cap" id="lbCap">
        <span class="lb__code"></span>
        <span class="lb__meta"></span>
        <span class="lb__note"></span>
      </figcaption>
    </figure>
    <button type="button" class="lb__btn lb__close" aria-label="ปิด">${svg(ICON.close)}</button>
    <div class="lb__bar">
      <a class="btn btn-orange btn-sm lb__save" download>เซฟรูป</a>
      <a class="btn btn-sm bg-paper text-ink border-paper lb__line" target="_blank" rel="noopener">ส่งคุยใน LINE</a>
      <p class="lb__hint">มือถือกดค้างที่รูปเพื่อบันทึก · คอมคลิกขวา</p>
    </div>
    <button type="button" class="lb__btn lb__prev" aria-label="รูปก่อนหน้า">${svg(ICON.prev)}</button>
    <button type="button" class="lb__btn lb__next" aria-label="รูปถัดไป">${svg(ICON.next)}</button>
    <p class="lb__count" aria-live="polite"></p>`
  document.body.append(dlg)

  const img = dlg.querySelector('.lb__img')
  const cap = dlg.querySelector('.lb__cap')
  const count = dlg.querySelector('.lb__count')
  let items = []
  let at = 0
  let opener = null

  /* นับเฉพาะรูปที่ยังไม่ถูกตัวกรองซ่อน ไม่งั้นกดลูกศรแล้วเด้งไปรูปที่หน้าจอไม่ได้แสดง */
  const visible = () => [...grid.querySelectorAll(itemSel)].filter((el) => !el.hidden)

  const show = (i) => {
    at = (i + items.length) % items.length
    const src = items[at].querySelector('img')
    /* ใช้ src ตรงๆ ไม่ใช้ currentSrc เพราะบนมือถือ currentSrc จะเป็นไฟล์เล็กจาก srcset
       กล่องดูรูปใหญ่ต้องได้ไฟล์เต็มเสมอ ไม่งั้นกดขยายแล้วยังเบลอ */
    img.src = src.src
    img.alt = src.alt
    /* คำบรรยายตาม Wireframe: รหัส · สินค้า · การใช้งาน · สไตล์ + หมายเหตุเรื่องสี
       ภาพที่ไม่ใช่แบบเสื้อ (รูปงานจริง) ไม่มีรหัส ให้ใช้ alt แทน */
    const el = items[at]
    const code = el.dataset.code && /^TD-/.test(el.dataset.code) ? el.dataset.code : ''
    cap.querySelector('.lb__code').textContent = code
    cap.querySelector('.lb__meta').textContent = el.dataset.meta || (code ? '' : src.alt)
    cap.querySelector('.lb__note').textContent = code ? 'สีที่เห็นเป็นแนวอ้างอิง ปรับได้ [ยืนยันบริการ]' : ''
    count.textContent = `${at + 1} จาก ${items.length}`
    /* ปุ่มเซฟตั้งชื่อไฟล์เป็นรหัสแบบ เพื่อให้ไฟล์ที่ลูกค้าส่งเข้าไลน์บอกได้เองว่าแบบไหน */
    const save = dlg.querySelector('.lb__save')
    const line = dlg.querySelector('.lb__line')
    if (save) {
      save.href = img.src
      save.setAttribute('download', code ? `TEAMDEE-${code}.jpg` : 'TEAMDEE.jpg')
    }
    if (line) line.href = dlg.dataset.lineUrl || '#'
    const solo = items.length < 2
    dlg.querySelector('.lb__prev').hidden = solo
    dlg.querySelector('.lb__next').hidden = solo
  }

  const open = (el) => {
    items = visible()
    const i = items.indexOf(el)
    if (i < 0) return
    opener = el.querySelector('button') || el
    show(i)
    document.documentElement.classList.add('lb-on')
    dlg.showModal()
    dlg.querySelector('.lb__close').focus()
  }

  /* ปิดผ่านฟังก์ชันเดียวทุกทาง ไม่ผูกกับ event close ของ <dialog>
     เพราะบางเบราว์เซอร์ปิดแล้วไม่ยิง close ทำให้โฟกัสค้างอยู่ในกล่องที่ปิดไปแล้ว */
  const close = () => {
    if (!dlg.open) return
    dlg.close()
    document.documentElement.classList.remove('lb-on')
    img.removeAttribute('src')
    opener?.focus()
  }

  dlg.querySelector('.lb__close').addEventListener('click', close)
  dlg.querySelector('.lb__prev').addEventListener('click', () => show(at - 1))
  dlg.querySelector('.lb__next').addEventListener('click', () => show(at + 1))

  /* คลิกพื้นหลังนอกรูปให้ปิด แต่คลิกบนรูปห้ามปิด จะได้ดูรูปได้ไม่โดนปิดใส่ */
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close()
  })

  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1) }
    if (e.key === 'Escape') { e.preventDefault(); close() }
  })
  /* กันไว้อีกชั้น เผื่อเบราว์เซอร์ปิดเองจากปุ่ม Esc ของระบบ */
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close() })

  /* ใส่ปุ่มทับรูปแต่ละใบ ใช้ปุ่มจริงเพื่อให้กด Tab ถึงและ Enter ทำงานได้เอง */
  for (const el of grid.querySelectorAll(itemSel)) {
    const im = el.querySelector('img')
    if (!im) continue
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'lb-open'
    btn.setAttribute('aria-label', `ดูรูปใหญ่ ${im.alt}`)
    btn.addEventListener('click', () => open(el))
    el.classList.add('lb-host')
    el.append(btn)
  }
}
