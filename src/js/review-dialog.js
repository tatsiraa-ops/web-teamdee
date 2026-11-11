/* กล่องดูรูปรีวิว (27 ต.ค. อาร์ต "กดรีวิวเพื่อดูอีกหลายๆรูปได้") · ข้อมูลจาก <script data-rv-json> ในหน้า (reviewCards / reviewMarquee)
   คอม: รูปใหญ่ซ้าย + คำรีวิว ชื่อ ปุ่ม LINE ขวา · มือถือ: รูปบน แผงล่าง · ลูกศร/ปัดซ้ายขวา/ปุ่มลูกศรคีย์บอร์ด เปลี่ยนรูป · แถบรูปย่อกดได้
   ปิด: ปุ่มปิด / Esc / กดพื้นหลัง / ปัดลง · โฟกัสกลับไปที่การ์ดที่กด (dialog เดิมของเบราว์เซอร์)
   ท่าทาง (audit มือถือ 30 ต.ค. ข้อ 17): ใช้ swipe-pager.js ตัวเดียวกับ lightbox · ลากตามนิ้ว · บีบ/แตะสองครั้งซูมรูปแชทได้ */
import icoLineRaw from '../partials/icoLine.hbs?raw'
import { backClose } from './back-close.js'
import { createSwipePager } from './swipe-pager.js'
import '../styles/viewer.css'

const ICO_LINE = icoLineRaw.replace(/\{\{!--[\s\S]*?--\}\}\s*/g, '')
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const svg = (d) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`

export function initReviewDialog() {
  const data = new Map()
  document.querySelectorAll('script[data-rv-json]').forEach((s) => {
    try { for (const r of JSON.parse(s.textContent)) data.set(r.id, r) } catch { /* ข้อมูลเสีย = การ์ดยังอ่านได้ แค่เปิดกล่องไม่ได้ */ }
  })
  if (!data.size) return

  const dlg = document.createElement('dialog')
  dlg.className = 'rvd'
  dlg.setAttribute('aria-labelledby', 'rvdWho')
  dlg.innerHTML = `
    <div class="rvd__in">
      <div class="rvd__stage">
        <img class="rvd__img" alt="">
        <button type="button" class="rvd__nav rvd__prev" aria-label="รูปก่อนหน้า">${svg('m15 6-6 6 6 6')}</button>
        <button type="button" class="rvd__nav rvd__next" aria-label="รูปถัดไป">${svg('m9 6 6 6-6 6')}</button>
        <p class="rvd__count tabular-nums" aria-live="polite"></p>
      </div>
      <div class="rvd__side">
        <ul class="rvd__thumbs" aria-label="รูปทั้งหมด"></ul>
        <blockquote class="rvd__q"><p></p></blockquote>
        <p class="rvd__who"><b id="rvdWho"></b><small></small></p>
        <div class="rvd__btns">
          <a class="cb cb--p rvd__line" href="#" data-track="line" data-where="review-dialog"><span class="cb__ico" aria-hidden="true">${ICO_LINE}</span><span class="cb__t">อยากได้เสื้อแบบนี้</span></a>
        </div>
        <p class="rvd__note">รูปและข้อความจากแชทลูกค้า ลงเว็บตามที่ลูกค้าอนุญาต</p>
      </div>
      <button type="button" class="rvd__x" aria-label="ปิด">${svg('M18 6 6 18M6 6l12 12')}</button>
    </div>`
  document.body.append(dlg)
  const $ = (s) => dlg.querySelector(s)
  const img = $('.rvd__img')
  const thumbs = $('.rvd__thumbs')
  let r = null
  let at = 0

  const pics = () => (r?.gallery?.length ? r.gallery : r?.img ? [{ img: r.img, imgSmall: r.imgSmall }] : [])
  const show = (i) => {
    const g = pics()
    const one = g.length < 2
    $('.rvd__prev').hidden = one
    $('.rvd__next').hidden = one
    dlg.classList.toggle('is-noimg', !g.length)
    if (!g.length) { $('.rvd__count').textContent = ''; return }
    at = (i + g.length) % g.length
    img.src = g[at].img
    img.alt = `${r.who || r.kind} ใส่เสื้อที่ทีมดีผลิต รูปที่ ${at + 1}`
    $('.rvd__count').textContent = one ? '' : `${at + 1} / ${g.length}`
    thumbs.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', String(k === at)))
    pager.sync()
  }

  const open = (id, from) => {
    r = data.get(id)
    if (!r) return
    const g = r.gallery?.length ? r.gallery : []
    thumbs.hidden = g.length < 2
    thumbs.innerHTML = g.map((x, k) => `<li><button type="button" data-k="${k}" aria-label="รูปที่ ${k + 1}"><img src="${esc(x.imgSmall)}" alt="" width="120" height="80" loading="lazy"></button></li>`).join('')
    $('.rvd__q p').textContent = r.quote
    $('#rvdWho').textContent = r.who || r.kind
    $('.rvd__who small').textContent = r.who ? `${r.kind} · รีวิวจากแชทจริง` : 'รีวิวจากแชทจริง'
    $('.rvd__line').href = r.line || '#'
    show(0)
    dlg.showModal()
    dlg._from = from
    /* โฟกัสแรกที่ปุ่มปิด (เดิมเบราว์เซอร์เลือก "รูปก่อนหน้า" ทั้งที่อยู่รูปแรก) */
    $('.rvd__x').focus()
    back.opened()
  }
  /* ปุ่มย้อนกลับมือถือปิดรีวิว ไม่ออกจากหน้า (back-close.js) */
  const back = backClose(() => dlg.open, () => dlg.close(), dlg)

  thumbs.addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (b) show(Number(b.dataset.k)) })
  $('.rvd__prev').addEventListener('click', () => show(at - 1))
  $('.rvd__next').addEventListener('click', () => show(at + 1))
  $('.rvd__x').addEventListener('click', () => dlg.close())
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close() })
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1) }
  })
  /* ปัด/ซูมบนรูป · มือถือ: ทั้งกล่องเลื่อนได้ (viewer.css) ลากรูปขึ้น = เลื่อนไปอ่านรีวิว */
  const pager = createSwipePager({
    root: dlg, stage: $('.rvd__stage'), img, scroller: $('.rvd__in'),
    index: () => at, count: () => pics().length,
    peekSrc: (d) => pics()[at + d]?.img || '',
    onPage: (d) => show(at + d),
    onClose: () => dlg.close(),
  })
  dlg.addEventListener('close', () => { img.removeAttribute('src'); dlg._from?.focus?.({ preventScroll: true }); back.closed() })

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rv-open]')
    if (!b) return
    e.preventDefault()
    open(b.dataset.rvOpen, b.closest('[aria-hidden="true"]') ? null : b)
  })
}
