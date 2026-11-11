import { picksMessage, togglePick, readPicks, pickText, shortLabel, fullText, PICK_KEY } from './design-picks.js'
import { lineMessageUrl } from './contact-send.js'

/* ถาดเลือกหลายแบบ ชุดเดียวใช้ทั้ง /designs/ และแกลเลอรีรายกลุ่ม 10 หน้า (audit มือถือ 30 ต.ค. ข้อ 11 · ย้ายมาจาก designs-page.js)
   markup: src/partials/pickTray.hbs · CSS: src/styles/picks.css · ตรรกะล้วน (ข้อความ LINE / จำค่า) อยู่ design-picks.js มีเทส
   ปุ่มเลือกบนการ์ด = [data-pick="<รหัสหรือป้าย>"] · ข้อความปุ่ม [data-pick-t] · การ์ด = closest(cardSel) มี data-thumb
   ที่เลือกจำในเครื่องนี้ (PICK_KEY เดียว) ข้ามหน้า: ครูเลือกจาก /sports-shirt/ 2 แบบ ไป /designs/ อีก 1 แล้วส่งทีเดียว
   catalog = รหัสครบทุกแบบ (เฉพาะ /designs/) ใช้ตัดรหัสที่ถูกลบไปแล้ว · แกลเลอรีส่ง null */
export function initPickTray({ grid, cardSel, catalog = null }) {
  const tray = document.getElementById('dgTray')
  if (!grid || !tray) return null
  const $ = (id) => document.getElementById(id)
  const lineBase = grid.dataset.lineUrl || $('dgTraySend').getAttribute('href')
  const cards = new Map()
  for (const b of grid.querySelectorAll('[data-pick]')) cards.set(b.dataset.pick, { b, card: b.closest(cardSel) || b })
  let picks = readPicks((k) => localStorage.getItem(k), catalog)
  const save = () => { try { localStorage.setItem(PICK_KEY, JSON.stringify(picks)) } catch {} }
  /* อีกแท็บเลือกเพิ่ม = ถาดแท็บนี้ตามทัน */
  addEventListener('storage', (e) => { if (e.key === PICK_KEY) { picks = readPicks((k) => localStorage.getItem(k), catalog); drawTray() } })
  /* ล้างแล้วเลิกทำได้ · ปุ่ม LINE แถบล่างส่งแบบที่เลือกด้วย · ประกาศจำนวน (ลองใช้จริง 30 ต.ค. รอบ 46) */
  const undoBox = $('dgTrayUndo')
  const live = $('dgTrayLive')
  const mbLine = document.querySelector('.mobilebar .mb__line')
  const mbBase = mbLine?.getAttribute('href')
  let undo = null
  let undoTimer = 0
  const say = (t) => { if (live) live.textContent = t }
  const endUndo = () => { clearTimeout(undoTimer); undo = null; undoBox.hidden = true; tray.classList.remove('is-undo') }
  /* เลือก/เอาออก 1 แบบ (การ์ดและรูปใหญ่ใช้ร่วมกัน) · ครบ 10 แบบบอกว่าเต็ม (30 ต.ค.) */
  const toggle = (id) => {
    if (undo) endUndo()
    const before = picks
    picks = togglePick(picks, id)
    save()
    drawTray()
    const full = picks === before
    const fullBox = $('dgTrayFull')
    fullBox.hidden = !full
    if (full) {
      fullBox.textContent = fullText(before.length)
      say(fullBox.textContent)
    } else say(picks.length ? `เลือกไว้ ${picks.length} แบบ` : 'ยังไม่ได้เลือกแบบ')
    return !full
  }
  /* แถบเลิกทำ: นับถอยหลัง 10 วิ เฉพาะตอนผู้ใช้ไม่ได้แตะ/โฟกัสถาด · ไม่ซ่อนขณะโฟกัสอยู่ในถาด โฟกัสไม่หลุด
     (ตรวจละเอียด 30 ต.ค. · WCAG 2.2.1 · เดิม 6 วินาทีตายตัว ปุ่มที่โฟกัสอยู่หายไปเลย) */
  const UNDO_MS = 10000
  const undoLater = () => {
    clearTimeout(undoTimer)
    undoTimer = setTimeout(() => {
      if (tray.matches(':hover') || tray.contains(document.activeElement)) return
      endUndo()
      drawTray()
    }, UNDO_MS)
  }
  tray.addEventListener('focusin', () => { if (undo) clearTimeout(undoTimer) })
  tray.addEventListener('pointerenter', () => { if (undo) clearTimeout(undoTimer) })
  tray.addEventListener('focusout', (e) => { if (undo && !tray.contains(e.relatedTarget)) undoLater() })
  tray.addEventListener('pointerleave', () => { if (undo && !tray.contains(document.activeElement)) undoLater() })
  /* รายการในถาด: ภาพไม่มีรหัสย่อเหลือ "รูปที่ N จาก /หน้า/" (ข้อความในแชทมีชื่อไฟล์ครบ) */
  const short = shortLabel
  const drawTray = () => {
    for (const [id, { b, card }] of cards) {
      const on = picks.includes(id)
      card.classList.toggle('is-picked', on)
      b.setAttribute('aria-pressed', String(on))
      const t = b.querySelector('[data-pick-t]')
      if (t) t.textContent = pickText(on)
    }
    tray.hidden = !picks.length && !undo
    /* has-tray: แถบล่างมือถือซ่อนปุ่ม LINE เขียว (ปุ่มส่งในถาดแทน · ไม่ซ้อนสองปุ่ม · audit ข้อ 11/14) */
    document.documentElement.classList.toggle('dg-tray-on', !tray.hidden)
    document.documentElement.classList.toggle('has-tray', !tray.hidden)
    $('dgTrayN').textContent = String(picks.length)
    $('dgTrayCodes').textContent = picks.map(short).join(' · ')
    /* รูปย่อเฉพาะแบบที่อยู่ในหน้านี้ (ที่เลือกจากหน้าอื่นไม่มีรูปในหน้า · จอมือถือซ่อนรูปย่ออยู่แล้ว) */
    $('dgTrayThumbs').replaceChildren(...picks.filter((id) => cards.get(id)?.card.dataset.thumb).slice(-4)
      .map((id) => Object.assign(document.createElement('img'), { src: cards.get(id).card.dataset.thumb, alt: '', width: 72, height: 48 })))
    const send = picks.length ? lineMessageUrl(picksMessage(picks)) : lineBase
    $('dgTraySend').href = send
    if (mbLine) mbLine.href = picks.length ? send : mbBase
  }
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]')
    if (!b) return
    toggle(b.dataset.pick)
  })
  $('dgTrayClear').addEventListener('click', () => {
    undo = picks
    picks = []
    save()
    tray.classList.add('is-undo')
    $('dgTrayUndoT').textContent = `ล้าง ${undo.length} แบบแล้ว`
    undoBox.hidden = false
    drawTray()
    $('dgTrayUndoBtn').focus()
    say(`ล้าง ${undo.length} แบบแล้ว กดเลิกทำได้`)
    undoLater()
  })
  $('dgTrayUndoBtn').addEventListener('click', () => {
    if (!undo) return
    picks = undo
    endUndo()
    save()
    drawTray()
    $('dgTraySend').focus()
    say(`คืน ${picks.length} แบบแล้ว`)
  })
  drawTray()
  /* ให้กล่องดูรูปใหญ่ (lightbox opts.pick) ใช้รายการเดียวกับการ์ด */
  return { has: (id) => picks.includes(id), toggle, count: () => picks.length }
}
