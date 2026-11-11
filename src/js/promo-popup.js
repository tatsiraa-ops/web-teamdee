/* ป๊อปอัปโฆษณา (partials/promoPopup.hbs · อาร์ต 26 ต.ค. รอบ 2) · ตรรกะ promo.js
   จอใหญ่ขึ้นหลังเปิดหน้า 1.5 วินาที · มือถือขึ้นเมื่อเลื่อนเกินครึ่งหน้า และไม่ขึ้นในรอบที่เห็นป้ายคุกกี้ (30 ต.ค.) · ได้ทุกหน้า · ครั้งเดียวต่อการเข้าเว็บ 1 รอบ · "ไม่ต้องแสดงอีก" = 30 วัน
   ไม่ขัดจังหวะ: มีกล่องอื่นเปิด · กำลังพิมพ์ฟอร์ม · กำลังดูคลิป → รอแล้วลองใหม่
   ปิดผ่านฟังก์ชันเดียวทุกทาง ไม่พึ่ง event close ของ <dialog> (บางเบราว์เซอร์ไม่ยิง · เจอแบบเดียวกับ lightbox.js) */
import { backClose } from './back-close.js'
import { activePromo, shouldShowPromo, neverUntil, PROMO_DELAY_MS, SESSION_KEY, NEVER_KEY, CK_SESSION_KEY, promoTrigger, promoDue } from './promo.js'
import { getConsent, needsAsk } from './consent.js'

const RETRY_MS = 3000
const push = (event, id) => { (window.dataLayer = window.dataLayer || []).push({ event, td_promo: id }) }
const get = (store, k) => { try { return store.getItem(k) } catch { return null } }
const put = (store, k, v) => { try { store.setItem(k, v) } catch {} }

export function initPromo() {
  const dialogs = [...document.querySelectorAll('[data-promo]')]
  if (!dialogs.length) return
  const pick = activePromo(dialogs.map((d) => ({ id: d.dataset.id, start: d.dataset.start, end: d.dataset.end || null, el: d })))
  /* รอบนี้มีป้ายคุกกี้ขึ้น → จำไว้ทั้งรอบ (ตอบป้ายแล้วก็ไม่เด้งตามบนมือถือ) */
  if (needsAsk(getConsent())) put(sessionStorage, CK_SESSION_KEY, '1')
  const narrow = matchMedia('(max-width: 767px)').matches
  const trigger = promoTrigger({ narrow, cookieSession: !!get(sessionStorage, CK_SESSION_KEY) })
  if (!pick || !trigger || !shouldShowPromo({ sessionSeen: !!get(sessionStorage, SESSION_KEY), never: get(localStorage, NEVER_KEY) })) return
  const dlg = pick.el
  /* จะขึ้นแน่แล้ว → โหลดรูปทันทีระหว่างรอ 1.5 วินาที (loading=lazy ในกล่องที่ยังซ่อนจะไม่โหลด รูปจะดำตอนเปิด) */
  for (const im of dlg.querySelectorAll("img")) im.loading = "eager"
  let opener = null
  let shown = false
  let timer

  const busy = () => {
    const a = document.activeElement
    /* เมนูมือถือเปิดอยู่ = ไม่เด้งทับ (30 ต.ค. · เมนูเป็น div ไม่ใช่ dialog) */
    return document.querySelector('dialog[open], #mobileMenu:not([hidden])') || a?.matches?.('input, textarea, select, iframe, video') || [...document.querySelectorAll('video')].some((v) => !v.paused)
  }
  const open = () => {
    if (shown || (document.querySelector('[data-hero-team]') && matchMedia('(max-width: 767px)').matches)) return
    if (busy()) { clearTimeout(timer); timer = setTimeout(open, RETRY_MS); return }
    shown = true
    opener = document.activeElement
    put(sessionStorage, SESSION_KEY, '1')
    document.documentElement.classList.add('promo-on')
    dlg.showModal()
    dlg.querySelector('[data-promo-close]').focus()
    back.opened()
    push('td_promo_view', pick.id)
  }
  const close = (how) => {
    if (!dlg.open) return
    dlg.close()
    document.documentElement.classList.remove('promo-on')
    push(how === 'never' ? 'td_promo_never' : 'td_promo_close', pick.id)
    opener?.focus?.()
    back.closed()
  }
  /* ปุ่มย้อนกลับมือถือปิดป๊อปอัป ไม่ออกจากหน้า (back-close.js) */
  const back = backClose(() => dlg.open, close, dlg)

  dlg.querySelector('[data-promo-close]').addEventListener('click', () => close())
  dlg.querySelector('[data-promo-never]').addEventListener('click', () => { put(localStorage, NEVER_KEY, neverUntil()); close('never') })
  /* กดรูปไปทัก LINE แล้วปิดไว้ ไม่ค้างตอนกลับมาที่แท็บนี้ */
  dlg.querySelector('[data-promo-go]').addEventListener('click', () => setTimeout(() => close('go'), 0))
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close() })
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close() })

  if (trigger === 'timer') timer = setTimeout(open, PROMO_DELAY_MS)
  else {
    /* ขึ้นเมื่อเลื่อนเกินครึ่งหน้า · หน้าที่มีส่วนราคารอถึง FAQ ไม่บังราคา */
    const onScroll = () => {
      const pricey = document.getElementById('price') || document.getElementById('products')
      const faq = pricey && document.getElementById('faq')
      const markTop = faq ? faq.getBoundingClientRect().top + scrollY : null
      if (!promoDue({ y: scrollY, view: innerHeight, doc: document.documentElement.scrollHeight, markTop })) return
      removeEventListener('scroll', onScroll)
      open()
    }
    addEventListener('scroll', onScroll, { passive: true })
  }
}
