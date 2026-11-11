import { codedDesignImage } from './design-download.js'
import { backClose } from './back-close.js'
import { createSwipePager } from './swipe-pager.js'
import '../styles/viewer.css'
import { lineUrlFor, lineMessageUrl } from './contact-send.js'
import { fullText } from './design-picks.js'
import icoLineRaw from '../partials/icoLine.hbs?raw'

/* ไอคอน LINE ชุดเดียวกับปุ่มเขียวทั้งเว็บ (ตัดคอมเมนต์ Handlebars ออก) */
const ICO_LINE = icoLineRaw.replace(/\{\{!--[\s\S]*?--\}\}\s*/g, '')
const ARROW = '<svg class="cb__arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
/* กล่องดูรูปใหญ่ ใช้ร่วมกันทั้งหน้าผลงานและหน้ารีวิว
   ทำเองไม่พึ่งไลบรารี เพราะต้องการแค่ เปิด ปิด เลื่อนซ้ายขวา และต้องคุม focus ให้ถูก
   ใช้ <dialog> เพราะได้ modal จริง กด Esc ปิดได้เอง และของข้างหลังกด Tab ไม่ถึง */

const ICON = {
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  prev: '<path d="m15 6-6 6 6 6"/>',
  next: '<path d="m9 6 6 6-6 6"/>',
}
/* ชื่อทรงจาก alt ของการ์ดแบบเสื้อ "แบบเสื้อฟุตบอล Jersey งานพิมพ์ลาย รหัส …" → "เสื้อฟุตบอล Jersey" (กล่องแบบเสื้อโหมดสว่าง 9 พ.ย.) */
export const titleOf = (alt) => (/^แบบ(.+?) (?:งาน|พิมพ์ลาย|ปัก|สกรีน|รหัส)/.exec(alt || '') || [])[1] || ''
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
  /* รูป → คำบรรยาย → ปุ่ม → ตัวนับ เรียงต่อกันตามปกติ (flex) ไม่ซ้อนด้วย absolute
     เพราะปุ่มตัดเป็น 2 แถวบนมือถือแล้วไปทับคำเตือนเรื่องสี (audit 26 ต.ค. H5)
     ปุ่มหลักคือส่งรหัสทาง LINE (จังหวะที่พร้อมทัก) · เซฟรูปเป็นลิงก์รอง
     มือถือ: ลูกศรอยู่แถวล่างคู่ตัวนับ ไม่บังรูปกับป้ายรหัส · จอใหญ่ลูกศรอยู่ข้างรูป */
  /* รื้อ 26 ต.ค. (อาร์ต "อันนี้ต่อเลย"): คอม = รูปใหญ่ซ้าย + แผงข้อมูลขวา · มือถือ = รูปบน + แผงล่าง
     แผง: ตัวนับ · รหัสตัวใหญ่ · ป้ายประเภท/การใช้งาน/สไตล์ · หมายเหตุสี · ปุ่มเขียวส่งรหัสทาง LINE · ปุ่มเลือกเก็บ (หน้าแบบเสื้อ opts.pick) · ขอราคาแบบฟอร์ม · เซฟรูป
     ลูกศรอยู่ขอบรูป · รูปที่ไม่มีรหัส (รูปงานลูกค้า) เหลือคำบรรยาย + ปุ่ม LINE */
  dlg.innerHTML = `
    <figure class="lb__fig">
      <div class="lb__stage">
        <img class="lb__img" alt="">
        <button type="button" class="lb__btn lb__prev" aria-label="รูปก่อนหน้า">${svg(ICON.prev)}</button>
        <button type="button" class="lb__btn lb__next" aria-label="รูปถัดไป">${svg(ICON.next)}</button>
      </div>
      <figcaption class="lb__cap">
        <p class="lb__count" aria-live="polite"></p>
        <span class="lb__title"></span>
        <span class="lb__code"></span>
        <span class="lb__meta"></span>
        <span class="lb__note"></span>
        <span class="lb__bar">
          <a class="cb cb--p lb__line" href="#" data-track="line" data-where="lightbox" target="_blank" rel="noopener"><span class="cb__ico" aria-hidden="true">${ICO_LINE}</span><span class="cb__t lb__line-t">ส่งคุยใน LINE</span>${ARROW}</a>
          <span class="lb__tiles">
            <button type="button" class="lb__pick lb__tile" aria-pressed="false" hidden><span class="lb__ico lb__ico--keep" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-4.2L6 21V4.5a1 1 0 0 1 1-1z"/></svg></span><span class="lb__pick-t lb__tile-t"></span></button>
            <a class="lb__quote lb__tile" href="#" aria-label="ขอราคาแบบนี้ผ่านฟอร์ม" hidden><span class="lb__ico lb__ico--price" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.6"/></svg></span><span class="lb__tile-t">ขอราคา</span></a>
            <a class="lb__save lb__tile" href="#" download aria-label="เซฟรูปพร้อมรหัสแบบ"><span class="lb__ico lb__ico--save" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg></span><span class="lb__save-t lb__tile-t">เซฟรูป</span></a>
          </span>
          <span class="lb__picked" hidden></span>
        </span>
      </figcaption>
    </figure>
    <button type="button" class="lb__btn lb__close" aria-label="ปิด">${svg(ICON.close)}</button>`
  document.body.append(dlg)

  dlg.querySelector('.lb__save').addEventListener('click', (event) => { if (event.currentTarget.getAttribute('aria-disabled') === 'true') event.preventDefault() })
  const img = dlg.querySelector('.lb__img')
  const cap = dlg.querySelector('.lb__cap')
  const count = dlg.querySelector('.lb__count')
  let items = []
  let at = 0
  let opener = null
  let imageVersion = 0
  const savedImages = new Map()

  /* นับเฉพาะรูปที่ยังไม่ถูกตัวกรองซ่อน ไม่งั้นกดลูกศรแล้วเด้งไปรูปที่หน้าจอไม่ได้แสดง */
  const visible = () => [...grid.querySelectorAll(itemSel)].filter((el) => !el.hidden)

  const show = (i) => {
    at = (i + items.length) % items.length
    const src = items[at].querySelector('img')
    /* ใช้ src ตรงๆ ไม่ใช้ currentSrc เพราะบนมือถือ currentSrc จะเป็นไฟล์เล็กจาก srcset
       กล่องดูรูปใหญ่ต้องได้ไฟล์เต็มเสมอ ไม่งั้นกดขยายแล้วยังเบลอ */
    /* กริดที่ใช้รูปย่อ (หน้า /project/) ใส่ data-full เป็นไฟล์เต็มไว้ */
    img.src = items[at].dataset.full || src.src
    img.alt = src.alt
    /* คำบรรยายตาม Wireframe: รหัส · สินค้า · การใช้งาน · สไตล์ + หมายเหตุเรื่องสี
       ภาพที่ไม่ใช่แบบเสื้อ (รูปงานจริง) ไม่มีรหัส ให้ใช้ alt แทน */
    const el = items[at]
    const code = el.dataset.code && /^TD-/.test(el.dataset.code) ? el.dataset.code : ''
    cap.querySelector('.lb__code').textContent = code
    /* 9 พ.ย. อาร์ต "ดูไม่ตัดขาดออกจากเว็บ": แบบเสื้อที่มีรหัส = กล่องขาวลอยบนหน้าเว็บ (viewer.css .lb--design) · ชื่อทรงตัวใหญ่ รหัสบรรทัดรอง */
    dlg.classList.toggle('lb--design', !!code || el.dataset.design === '1')
    cap.querySelector('.lb__title').textContent = code || el.dataset.design === '1' ? titleOf(src.alt) : ''
    /* แบบที่มีรหัส: ป้ายประเภท · การใช้งาน · สไตล์ เป็นชิป · รูปงานลูกค้า: คำบรรยายจาก alt */
    /* แบบเสื้อไม่มีรหัส (แกลเลอรีเว็บเดิม · data-design) ใช้ชิปเหมือนแบบมีรหัส · หมายเหตุบอกให้เซฟภาพแนบแชท */
    const isDesign = !!code || el.dataset.design === '1'
    const meta = cap.querySelector('.lb__meta')
    meta.classList.toggle('is-text', !isDesign)
    meta.replaceChildren(...(isDesign
      ? (el.dataset.meta || '').split(' · ').filter(Boolean).map((t) => Object.assign(document.createElement('span'), { className: 'lb__chip', textContent: t }))
      : [src.alt]))
    cap.querySelector('.lb__note').textContent = code ? 'สีที่เห็นเป็นแนวอ้างอิง ปรับสีและรายละเอียดได้ตามเทคนิคที่รองรับ' : isDesign ? 'กดเซฟรูปแล้วแนบในแชท LINE ทีมดีปรับสี โลโก้ และชื่อให้เป็นของทีมคุณ' : 'เซฟภาพนี้แล้วแนบในแชท LINE เพื่อให้ทีมดีเห็นภาพที่คุณเลือก'
    count.textContent = `${at + 1} จาก ${items.length}`
    /* ปุ่มเซฟตั้งชื่อไฟล์เป็นรหัสแบบ เพื่อให้ไฟล์ที่ลูกค้าส่งเข้าไลน์บอกได้เองว่าแบบไหน */
    const save = dlg.querySelector('.lb__save')
    const saveT = dlg.querySelector('.lb__save-t')
    const version = ++imageVersion
    const line = dlg.querySelector('.lb__line')
    if (save) {
      save.href = img.src
      const ext = (/\.(webp|png|jpe?g)(?:$|\?)/i.exec(img.src) || [, 'jpg'])[1]
      save.setAttribute('download', `TEAMDEE${code ? '-' + code : ''}.${ext}`)
      saveT.textContent = 'เซฟรูป' /* ระหว่างเตรียมภาพพร้อมรหัส ปุ่มจางและกดไม่ได้ (aria-disabled) */
      save.setAttribute('aria-disabled', String(!!code))
      if (code) {
        const source = img.src
        const key = `${code}:${source}`
        if (!savedImages.has(key)) savedImages.set(key, codedDesignImage(source, code).catch((error) => { savedImages.delete(key); throw error }))
        savedImages.get(key).then((dataUrl) => {
          if (version !== imageVersion) return
          /* ภาพพร้อมรหัสใช้เป็นไฟล์เซฟเท่านั้น · รูปในกล่องคงเป็นรูปเสื้อสะอาด (ไม่มีแถบดำ TEAMDEE | รหัส) */
          save.href = dataUrl
          save.setAttribute('download', `TEAMDEE-${code}.png`)
          save.setAttribute('aria-disabled', 'false')
          saveT.textContent = 'เซฟรูป'
        }).catch(() => {
          if (version !== imageVersion) return
          saveT.textContent = 'เซฟไม่ได้'; save.setAttribute('aria-label', `เตรียมภาพไม่สำเร็จ ใช้ปุ่มส่งรหัส ${code} ทาง LINE แทน`)
        })
      }
    }
    /* มีรหัสแบบ = เปิดแชท LINE พร้อมข้อความ "สนใจแบบเสื้อรหัส …" · ปุ่มขอราคาพารหัสไปฟอร์ม */
    if (line) {
      line.href = code ? lineUrlFor(code, dlg.dataset.lineUrl || '#') : (dlg.dataset.lineUrl.includes('/oaMessage/') ? dlg.dataset.lineUrl : lineMessageUrl(`สนใจ${src.alt}\nจากหน้า ${location.origin}${location.pathname}\nจะส่งภาพอ้างอิงนี้แนบในแชท`))
      dlg.querySelector('.lb__line-t').textContent = code ? `ส่งรหัส ${code} ทาง LINE` : isDesign ? 'ส่งแบบนี้ทาง LINE' : 'คุยเรื่องภาพนี้ทาง LINE'
    }
    const quote = dlg.querySelector('.lb__quote')
    if (quote) { quote.hidden = !code; quote.href = `${dlg.dataset.contactUrl || '/contact-us/'}?code=${encodeURIComponent(code)}&from=${encodeURIComponent(location.pathname)}` }
    drawPick()
    const solo = items.length < 2
    dlg.querySelector('.lb__prev').hidden = solo
    dlg.querySelector('.lb__next').hidden = solo
    count.hidden = solo
    pager.sync()
  }

  /* เลือกเก็บ (หน้าแบบเสื้อ · opts.pick = { has, toggle, count }) · ใช้ถาดเดียวกับปุ่มบนการ์ด */
  const pickBtn = dlg.querySelector('.lb__pick')
  const picked = dlg.querySelector('.lb__picked')
  /* รหัสหรือป้ายของรูปนี้ (ปุ่มเลือกบนการ์ด) · ภาพไม่มีรหัสในแกลเลอรีเลือกได้ด้วยป้าย "รูปที่ N" (2 พ.ย.) */
  const pickId = () => {
    const el = items[at]
    return el?.closest('.gcard, .dcard')?.querySelector('[data-pick]')?.dataset.pick || (el?.dataset.code && /^TD-/.test(el.dataset.code) ? el.dataset.code : '')
  }
  const drawPick = () => {
    const code = pickId()
    const on = !!(opts.pick && code)
    pickBtn.hidden = !on
    picked.hidden = !on || !opts.pick.count()
    if (!on) return
    const has = opts.pick.has(code)
    pickBtn.setAttribute('aria-pressed', String(has))
    pickBtn.querySelector('.lb__pick-t').textContent = has ? 'เก็บแล้ว' : 'เก็บไว้'
    picked.textContent = `เลือกไว้ ${opts.pick.count()} แบบ · ปิดกล่องนี้แล้วกดส่งรหัสทั้งหมดได้ที่ถาดด้านล่าง`
  }
  pickBtn.addEventListener('click', () => {
    const code = pickId()
    if (!code || !opts.pick) return
    const done = opts.pick.toggle(code)
    drawPick()
    if (!done) { picked.hidden = false; picked.textContent = fullText(opts.pick.count()) }
  })

  const open = (el) => {
    items = visible()
    /* รูปที่ถูกย้ายไปรางอื่น (หน้าแรกมือถือรวมผลงานเป็นรางเดียว · home-mobile.js) ใช้รูปในรางที่อยู่ตอนนี้ */
    if (!items.includes(el)) items = [...el.parentElement.querySelectorAll(`:scope > ${itemSel}`)].filter((x) => !x.hidden)
    const i = items.indexOf(el)
    if (i < 0) return
    /* ปิดแล้วโฟกัสกลับปุ่มขยายรูป (เดิมการ์ดแบบเสื้อได้ปุ่ม "เลือก" ที่อยู่ก่อน · 30 ต.ค.) */
    opener = el.querySelector('.lb-open') || el.querySelector('button') || el
    show(i)
    document.documentElement.classList.add('lb-on')
    dlg.showModal()
    dlg.querySelector('.lb__close').focus()
    back.opened()
  }

  /* ปิดผ่านฟังก์ชันเดียวทุกทาง ไม่ผูกกับ event close ของ <dialog>
     เพราะบางเบราว์เซอร์ปิดแล้วไม่ยิง close ทำให้โฟกัสค้างอยู่ในกล่องที่ปิดไปแล้ว */
  const close = () => {
    if (!dlg.open) return
    dlg.close()
    document.documentElement.classList.remove('lb-on')
    img.removeAttribute('src')
    opener?.focus()
    back.closed()
  }
  /* ปุ่มย้อนกลับมือถือปิดรูปใหญ่ ไม่ออกจากหน้า (back-close.js) */
  const back = backClose(() => dlg.open, close, dlg)

  /* ท่าทางแบบแอป (audit มือถือ 30 ต.ค. ข้อ 17 · swipe-pager.js): ลากซ้ายขวาตามนิ้ว · ปัดลงปิด · ลากขึ้นเลื่อนดูรายละเอียด
     บีบ/แตะสองครั้งซูม · ปัดไม่วนที่ปลายชุด (ยางยืด) ส่วนปุ่มกับลูกศรคีย์บอร์ดยังวนเหมือนเดิม */
  const peekSrc = (d) => {
    const el = items[at + d]
    const im = el?.querySelector('img')
    if (!im) return ''
    return el.dataset.full || im.src
  }
  const pager = createSwipePager({
    root: dlg, stage: dlg.querySelector('.lb__stage'), img, scroller: dlg,
    index: () => at, count: () => items.length, peekSrc,
    onPage: (d) => show(at + d),
    onClose: close,
  })

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

  /* ใส่ปุ่มทับรูปแต่ละใบ ใช้ปุ่มจริงเพื่อให้กด Tab ถึงและ Enter ทำงานได้เอง
     เรียกซ้ำได้ (refresh) สำหรับกริดที่สร้างการ์ดใหม่ เช่นผลค้นหา (30 ต.ค. · เดิมปุ่มหายหลัง render ใหม่) */
  const addButtons = () => { for (const el of grid.querySelectorAll(itemSel)) {
    const im = el.querySelector('img')
    if (!im || el.querySelector(':scope > .lb-open')) continue
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'lb-open'
    btn.setAttribute('aria-label', `ดูรูปใหญ่ ${im.alt}`)
    btn.addEventListener('click', () => open(el))
    el.classList.add('lb-host')
    el.append(btn)
  } }
  addButtons()
  return { refresh: addButtons }
}
