/* จัดตัดบรรทัดภาษาไทยทั้งเว็บตอน build (มือถือ 30 ต.ค. 2026 อาร์ต "เน้นมือถือ ทั้งเว็บ" · ทาง ก)
   เบราว์เซอร์ตัดคำไทยด้วยพจนานุกรม ICU ซึ่งหักผิดบางคำ (ราย|ละเอียด · เจ|อร์|ซีย์ · สีห|รือ) และปล่อยคำสั้นตกบรรทัดเดียว (…ได้|ไหม?)
   ทำที่ HTML ที่ออกจริง หน้าไหนก็ได้ผลเท่ากัน ไม่ต้องตามแก้ทีละ template · ตัวหนังสือไม่เปลี่ยนสักตัว แค่ห่อแท็ก
   ใช้แท็กของเราเอง (t-nw · t-p · t-g) ไม่ใช้ span เพราะ CSS เดิมมี "summary span { display:none }" ฯลฯ จะโดนลูกหลง
   - t-nw  ห้ามตัดข้างใน (white-space: nowrap)
   - t-p   วลีในหัวข้อ · มือถือเป็น inline-block ให้ตัดบรรทัดที่เว้นวรรคก่อน (แบบเดียวกับ {{{ph}}} หน้าแรก)
   - t-g   ห่อทั้งก้อน ให้กล่อง flex (ปุ่มคำถาม) เห็นเป็นชิ้นเดียว ไม่แตกเป็นหลายคอลัมน์ */
import { phraseWords, esc } from './phrases.js'

/* คำที่ ICU หักผิด (เช็กด้วย Intl.Segmenter('th') ใน Node ตัวเดียวกับ Chrome) · ยาวก่อนสั้น */
const WORDS = ['รายละเอียด', 'ใช้งาน', 'พิมพ์ลาย', 'เจอร์ซีย์', 'ซับลิเมชั่น', 'โอเวอร์ไซซ์', 'คอลเลกชัน', 'องค์ประกอบ', 'ใบเสนอราคา', 'ใบกำกับภาษี', 'หนังสือรับรอง',
  'ทุ่งศรีอุดม', 'เจ้าหน้าที่', 'ภาพจำลอง', 'แจ็กเก็ต', 'ลายพราง', 'ดรายเทค', 'ออเดอร์', 'ยืนยัน', 'เตรียม', 'สีหรือ', 'ของก๊วน', 'ก๊วน', 'ทีมดี']
const GLUE = new RegExp(WORDS.sort((a, b) => b.length - a.length).join('|'), 'g')
/* "ต่าง ๆ" เขียนแบบมีเว้นวรรค ไม้ยมกตกไปขึ้นบรรทัดใหม่ตัวเดียว · ติดกับคำหน้า */
/* 11 พ.ย. อาร์ต "ตัดบรรทัดแปลกๆ": เดิมนับ 8 ตัวอักษรก่อน ๆ → "จำ<t-nw>นวนคร่าว ๆ" ผ่ากลางคำ · ใช้ตัวแยกคำ ติดเฉพาะคำเต็มคำสุดท้าย */
export const glue = (s) => s.replace(GLUE, '<t-nw>$&</t-nw>').replace(/([\u0E00-\u0E7F]+) ๆ((?: [\u0E00-\u0E7F]{1,5}[?!])?)/g, (m, run, q) => {
  const ws = [...seg.segment(run)].map((x) => x.segment)
  const last = ws.pop()
  return `${ws.join('')}<t-nw>${last} ๆ${q}</t-nw>`
})
const words = (raw) => phraseWords(raw.replace(/ ๆ/g, '\u00a0ๆ'))

const RAW = new Set(['script', 'style', 'textarea', 'title'])
const SKIP = new Set(['head', 'script', 'style', 'title', 'textarea', 'option', 'select', 'svg', 'pre', 'code', 'noscript', 'template'])
const HEAD = new Set(['h1', 'h2', 'h3', 'h4', 'summary', 'button', 'label', 'th', 'dt', 'b', 'strong'])
const INLINE = new Set(['span', 'em', 'i', 'small', 'abbr', 'time', 'mark', 'u', 's', 'sup', 'sub', 't-g', 't-p', 't-nw'])
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])
/* ข้อความที่จัดเองไว้แล้ว ({{{ph}}} · whitespace-nowrap) ไม่ยุ่ง */
const DONE = /\b(inline-block|whitespace-nowrap|sr-only)\b/
/* ถอดได้เฉพาะ entity ที่ esc() สร้างกลับคืนได้ ไม่งั้น &nbsp; จะกลายเป็น &amp;nbsp; */
const ODD_ENTITY = /&(?!amp;|lt;|gt;|quot;)/
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')

const seg = new Intl.Segmenter('th', { granularity: 'word' })
const PUNCT = /^[?!.…,)"'”]+$/

/* 11 พ.ย. หัวข้อไม่มีเว้นวรรค ("ยังไม่แน่ใจว่าเสื้อแบบไหน" ตัด "…ว่าเสื้อ | แบบไหน"): แบ่งที่คำเชื่อมใกล้กลางที่สุด แต่ละครึ่งห้ามตัด
   แบ่งหลัง ว่า และ หรือ เพื่อ แต่ · แบ่งก่อน ที่ ให้ สำหรับ เมื่อ · ทั้งข้อความ ≥ 12 ตัว · แต่ละครึ่ง 4–20 ตัว · ไม่เข้าเงื่อนไข = null (ใช้วิธีเดิม) */
const AFTER = new Set(['ว่า', 'และ', 'หรือ', 'เพื่อ', 'แต่'])
const BEFORE = new Set(['ที่', 'ให้', 'สำหรับ', 'เมื่อ'])
export const clauseSplit = (raw) => {
  if (raw.length < 12 || raw.includes(' ') || !/[฀-๿]/.test(raw)) return null
  const ws = [...seg.segment(raw)].map((x) => x.segment)
  let best = null
  for (let i = 0; i < ws.length - 1; i++) {
    if (!AFTER.has(ws[i]) && !BEFORE.has(ws[i + 1])) continue
    const a = ws.slice(0, i + 1).join(''), b = ws.slice(i + 1).join('')
    if (a.length < 4 || b.length < 4 || a.length > 20 || b.length > 20) continue
    if (!best || Math.abs(a.length - b.length) < Math.abs(best[0].length - best[1].length)) best = [a, b]
  }
  return best
}
const clauseHtml = ([a, b]) => `<t-nw>${esc(a)}</t-nw><t-nw>${esc(b)}</t-nw>`

/* 11 พ.ย. ย่อหน้า: วลีหลังเว้นวรรคสุดท้าย (≤ 26 ตัว · ไทย) ห้ามผ่า "…ยังไม่มีแบบก็ | เริ่มคุยได้" → ขึ้นบรรทัดใหม่ทั้งวลี */
const PARA = new Set(['p', 'li', 'dd', 'figcaption', 'blockquote'])
const paraText = (text) => {
  const raw = unesc(text)
  const at = raw.lastIndexOf(' ')
  const last = raw.slice(at + 1)
  if (at < 1 || last.length > 26 || !/^[฀-๿]/.test(last) || /^ๆ/.test(last)) return glue(text)
  return `${glue(esc(raw.slice(0, at)))} <t-nw>${glue(esc(last))}</t-nw>`
}

/* วลีสุดท้ายของคำถาม: คำท้ายสั้น (≤ 3 ตัว เช่น ไหม ไหน วัน ดี) ติดกับคำก่อนหน้า */
const tail = (w) => {
  const parts = [...seg.segment(w)].map((x) => x.segment)
  let end = parts.length
  while (end > 0 && PUNCT.test(parts[end - 1])) end--
  if (end < 2 || parts[end - 1].length > 3 || !/[฀-๿]/.test(parts[end - 1])) return null
  const head = parts.slice(0, end - 2).join('')
  return head ? [head, parts.slice(end - 2).join('')] : null
}

const headText = (text, limit) => {
  const raw = unesc(text)
  if (raw.length > limit) return glue(text)
  const ws = words(raw)
  const cs = ws.length < 2 && clauseSplit(raw)
  if (cs) return `<t-g>${clauseHtml(cs)}</t-g>`
  const last = tail(ws[ws.length - 1])
  if (ws.length < 2 && !last) return glue(text)
  const ps = ws.map((w, i) => {
    const t = i === ws.length - 1 && last ? `${glue(esc(last[0]))}<t-nw>${esc(last[1])}</t-nw>` : glue(esc(w))
    return ws.length > 1 ? `<t-p>${t}</t-p>` : t
  })
  return `<t-g>${ps.join(' ')}</t-g>`
}

/* ลิงก์: วลีสั้น (≤ 18 ตัว) ห้ามตัดเลย เช่น "ภาพจาก|คลังเดิม" · "ข้อความ|รีวิว" */
const linkText = (text) => {
  const raw = unesc(text)
  if (raw.length > 40) return glue(text)
  const out = words(raw).map((w) => (w.length <= 18 && /[฀-๿]/.test(w) ? `<t-nw>${esc(w)}</t-nw>` : glue(esc(w)))).join(' ')
  return out
}

/* วลีที่ {{{ph}}} ห่อไว้แล้วในหัวข้อ: ไม่ห่อวลีซ้ำ แต่ยังติดคำท้ายสั้นกับคำก่อนหน้า */
const doneText = (text) => {
  const raw = unesc(text)
  const cs = clauseSplit(raw)
  if (cs) return clauseHtml(cs)
  const last = !raw.includes(' ') && raw.length <= 70 && tail(raw)
  return last ? `${glue(esc(last[0]))}<t-nw>${esc(last[1])}</t-nw>` : glue(text)
}

const mode = (stack) => {
  let done = false
  for (let i = stack.length - 1; i >= 0; i--) {
    const el = stack[i]
    if (DONE.test(el.cls)) { if (!/inline-block/.test(el.cls)) return 'glue'; done = true; continue }
    if (HEAD.has(el.tag)) return done ? 'done' : el.tag === 'b' || el.tag === 'strong' ? 'short' : 'head'
    if (el.tag === 'a') return done ? 'glue' : 'link'
    if (!INLINE.has(el.tag)) return 'glue'
  }
  return 'glue'
}

const TOKEN = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^\s/>]*(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+|</g

export const thaiBreaks = (html) => {
  const stack = []
  let out = ''
  for (const [tok] of html.matchAll(TOKEN)) {
    if (tok[0] === '<' && tok.length > 1 && tok[1] !== '!') {
      const close = tok[1] === '/'
      const tag = tok.slice(close ? 2 : 1).match(/^[^\s/>]+/)[0].toLowerCase()
      /* อยู่ใน script/style/textarea/title: รับเฉพาะแท็กปิดของตัวเอง ที่เหลือเป็นข้อความดิบ (30 ต.ค. · "</div>" ในสตริง JS เคยตัด stack) */
      const top = stack[stack.length - 1]?.tag
      if (top && RAW.has(top) && !(close && tag === top)) { out += tok; continue }
      if (close) {
        const at = stack.map((e) => e.tag).lastIndexOf(tag)
        if (at >= 0) stack.length = at
      } else if (!VOID.has(tag) && !tok.endsWith('/>')) {
        stack.push({ tag, cls: (tok.match(/\sclass="([^"]*)"/) || [, ''])[1] })
      }
      out += tok
      continue
    }
    if (tok[0] === '<' || !tok.trim() || !/[฀-๿]/.test(tok) || stack.some((e) => SKIP.has(e.tag))) { out += tok; continue }
    const lead = tok.match(/^\s*/)[0]
    const trail = tok.match(/\s*$/)[0]
    const text = tok.slice(lead.length, tok.length - trail.length)
    const m = ODD_ENTITY.test(text) ? 'glue' : mode(stack)
    const para = m === 'glue' && PARA.has(stack[stack.length - 1]?.tag)
    const body = m === 'head' ? headText(text, 70) : m === 'short' ? headText(text, 40) : m === 'done' ? doneText(text) : m === 'link' ? linkText(text) : para ? paraText(text) : glue(text)
    /* ข้อความที่แทรกแท็กแล้วกลายเป็นหลายชิ้น ห่อ t-g ทั้งก้อน: ในกล่อง flex (ลิงก์ pp-more · ปุ่มคำถาม) ชิ้นเดียวเท่าข้อความเดิม */
    const one = body === text || body.startsWith('<t-g>') || (body.startsWith('<t-') && body.split('<t-').length === 2 && body.endsWith('>'))
    out += lead + (one ? body : `<t-g>${body}</t-g>`) + trail
  }
  return out
}
