/* ค้นหาในหน้าคำถาม /faq/ (รื้อ 26 ต.ค. "รื้อหน้านี้ต่อ") · มีเทส tests/faq-search.test.js + tests/search-intent.test.js
   ภาษาไทยพิมพ์ติดกันเป็นปกติ → เทียบแบบตัดช่องว่างทิ้งทั้งสองฝั่ง · หลายคำ = ต้องเจอทุกคำ
   คำที่คนพิมพ์ต่างจากในเว็บบ่อย (ไซส์/ไซด์/size → ไซซ์ ฯลฯ) แปลงเป็นคำในเว็บก่อนเทียบ
   คำถามแบบที่ลูกค้าพิมพ์จริง ("ส่งกี่วัน" "สกรีน 1 ตัว" "ติดตามงาน") แปลงเป็นเจตนา (ตรวจมือถือ 30 ต.ค. ข้อ 6–7)
   ตารางอยู่ที่ src/data/search-synonyms.json ใช้ร่วมกับ /search/ (site-search.js) */
import SYN from '../data/search-synonyms.json' with { type: 'json' }
import { REORDER_TEXT, TRACK_TEXT } from './use-cta.js'

const PUNCT = /[?？!.,:;%()"'“”‘’\-–—·]+/g
/* NFKC (ตัวอักษรเต็มความกว้าง ฯลฯ) · ตัวเล็ก · เลขไทย → อารบิก · สระอำแบบพิมพ์แยก (นิคหิต + อา) แปลงเป็นอำตัวเดียว */
const base = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    /* \p{Nd} แทนช่วงตัวเลขไทยในวงเล็บ [ ] (เทส seo-pages ตรวจ [ข้อความไทย] รอยืนยันใน JS ที่ build แล้ว) */
    .replace(/\p{Nd}/gu, (c) => { const n = c.codePointAt(0); return n >= 0x0e50 && n <= 0x0e59 ? String(n - 0x0e50) : c })
    .replace(/ํา/g, 'ำ')

/* ตัดช่องว่าง เครื่องหมาย ตัวเล็กหมด */
export const normFaq = (s) => base(s).replace(PUNCT, '').replace(/[\s/]+/g, '')
/* แบบเก็บช่องว่างไว้ (แยกคำ) · / , + & = เว้นวรรค */
const normSpaced = (s) => base(s).replace(PUNCT, '').replace(/[\s/,+&|]+/g, ' ').trim()

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/* คำสะกดต่าง → คำในเว็บ · รอบเดียว ยาวก่อนสั้น (oversize ไม่โดน size → ไซซ์ ข้างใน)
   ถ้าตรงนั้นเป็นคำในเว็บอยู่แล้วไม่แปลงซ้ำ (โลโก้ ไม่กลายเป็น โลโก้้) */
const SPELL_TO = new Map(SYN.spell.flatMap(({ to, from }) => from.map((f) => [normFaq(f), normFaq(to)])))
const SPELL_RE = new RegExp([...SPELL_TO.keys()].sort((a, b) => b.length - a.length).map(escRe).join('|'), 'g')
const canon = (s) => normFaq(s).replace(SPELL_RE, (m, at, all) => {
  const t = SPELL_TO.get(m)
  return all.startsWith(t, at) ? m : t
})

/* คำเรียกเจตนา (ยาวก่อนสั้นทุกเจตนา) · ยอมให้มีช่องว่างคั่นระหว่างตัวอักษร ("1 ตัว" = "1ตัว") */
const INTENTS = SYN.intents.map((i) => ({ ...i, keys: [...new Set(i.terms.map(canon))] }))
const TRIGGERS = INTENTS.flatMap((intent) => intent.triggers.map((t) => ({ intent, t: normFaq(t) })))
  .sort((a, b) => b.t.length - a.t.length)
  .map(({ intent, t }) => ({ intent, re: new RegExp([...t].map(escRe).join('\\s*'), 'g') }))
const STOP = [...SYN.stop].map(normFaq).sort((a, b) => b.length - a.length)
/* ตัดคำลงท้าย/ขึ้นต้น (ครับ ไหม ...) ที่ขอบคำเท่านั้น ไม่ตัดกลางคำ ("แนะนำ" มี "นะ" อยู่ข้างใน) */
const trimStop = (w) => {
  let x = w
  for (let again = true; again && x; ) {
    again = false
    for (const s of STOP) {
      if (x.endsWith(s)) { x = x.slice(0, -s.length); again = true }
      else if (x.startsWith(s)) { x = x.slice(s.length); again = true }
    }
  }
  return x
}

const cache = new Map()
/** แยกคำค้น → { words: คำที่ต้องเจอตรงตัว, intents: เจตนา, lits: คำเรียกเจตนาตามที่พิมพ์ (ใช้รอบตรงตัว) } */
export function parseQuery(q) {
  const key = String(q || '')
  if (cache.has(key)) return cache.get(key)
  let rest = normSpaced(key)
  const intents = []
  const lits = []
  for (const { intent, re } of TRIGGERS) {
    rest = rest.replace(re, (m) => {
      if (!intents.includes(intent)) intents.push(intent)
      lits.push(canon(m))
      return ' '
    })
  }
  const raw = rest.split(' ').filter(Boolean)
  let words = raw.map(trimStop).filter(Boolean)
  /* พิมพ์แต่คำลงท้าย (เช่น "ครับ") ก็ค้นคำนั้นตรงตัว ไม่ใช่เจอทุกข้อ */
  if (!words.length && !intents.length) words = raw
  const out = { words: [...new Set(words.map(canon).filter(Boolean))], intents, lits: [...new Set(lits.filter(Boolean))] }
  if (cache.size > 200) cache.clear()
  cache.set(key, out)
  return out
}

/* เจอตรงตัวทุกคำ (รวมคำเรียกเจตนาตามที่พิมพ์) = รอบแรก · ไม่มีข้อไหนตรงตัวเลยค่อยใช้เจตนา
   ("ภ.พ.20" เจอแค่ข้อที่มีคำนี้ · "กี่วัน" ไม่มีข้อไหนเขียนแบบนี้ → ใช้เจตนาระยะเวลา) */
export const EXACT = 1000
const part = (w, head, hay) => (head.includes(w) ? 3 : hay.includes(w) ? 1 : 0)

/** คะแนนความตรง (0 = ไม่ตรง · ≥ EXACT = ตรงตัว) · ทุกคำและทุกเจตนาต้องเจอ · เจอในหัวข้อได้คะแนนมากกว่า */
export function scoreText(q, text, title = '') {
  const { words, intents, lits } = typeof q === 'string' ? parseQuery(q) : q
  const hay = canon(text)
  const head = canon(title)
  let s = 0
  for (const w of words) {
    const n = part(w, head, hay)
    if (!n) return 0
    s += n
  }
  let exact = s
  for (const w of lits) {
    const n = part(w, head, hay)
    if (!n) { exact = -1; break }
    exact += n
  }
  if (exact >= 0) return EXACT + exact
  for (const i of intents) {
    const n = Math.max(...i.keys.map((k) => part(k, head, hay)))
    if (!n) return 0
    s += n
  }
  return s
}

/** คะแนนของทุกรายการ แล้วตัดรอบ: ถ้ามีรายการที่ตรงตัว เหลือเฉพาะที่ตรงตัว · คืน array คะแนน (0 = ไม่แสดง) */
export function scoreAll(q, texts, titles = []) {
  const p = typeof q === 'string' ? parseQuery(q) : q
  const s = texts.map((t, i) => scoreText(p, t, titles[i] || ''))
  return s.some((x) => x >= EXACT) ? s.map((x) => (x >= EXACT ? x : 0)) : s
}

/** คำถามข้อนี้ตรงกับที่พิมพ์ไหม (ตรงตัวหรือตรงเจตนา) · text = คำถาม + คำตอบ + ชื่อหมวด */
export const faqHit = (q, text) => {
  const p = parseQuery(q)
  if (!p.words.length && !p.intents.length) return true
  return scoreText(p, text) > 0
}

/** ทั้งหน้า /faq/: ข้อไหนแสดงบ้าง · มีข้อที่ตรงตัว = แสดงเฉพาะข้อนั้น (กันเจตนาดึงข้อที่ไม่เกี่ยวมาปน) */
export const faqHits = (q, texts) => {
  const p = parseQuery(q)
  if (!p.words.length && !p.intents.length) return texts.map(() => true)
  return scoreAll(p, texts).map((x) => x > 0)
}

/** เจตนาของคำค้น (id ตามตาราง) */
export const queryIntents = (q) => parseQuery(q).intents.map((i) => i.id)

/** ปุ่ม LINE ลูกค้าเดิมที่ต้องขึ้นบนสุด ('track' | 'reorder') เรียงตามเจตนาที่พิมพ์ */
export const queryActions = (q) => [...new Set(parseQuery(q).intents.flatMap((i) => i.actions || []))]

/** ข้อความที่ปุ่ม LINE พิมพ์รอไว้ · แนบคำถามข้อนั้น (หรือที่พิมพ์ค้นแล้วไม่เจอ) ไปให้ทีมขายเห็นเลย */
const ASK_MAX = 120
export const faqAskText = (q) => {
  const t = [...String(q || '').trim()].slice(0, ASK_MAX).join('')
  return t ? `สวัสดี ทีมดี สอบถามเรื่อง: ${t}\n` : 'สวัสดี ทีมดี มีคำถามเรื่องสั่งทำเสื้อ\n'
}

const ACTION_TEXT = { track: TRACK_TEXT, reorder: REORDER_TEXT }
/** ข้อความ LINE ตอนค้นแล้วไม่เจอ · ลูกค้าเดิม (ติดตามงาน / สั่งซ้ำ) ได้แบบฟอร์มของเรื่องนั้นเลย อื่นๆ แนบคำค้น */
export const askText = (q) => ACTION_TEXT[queryActions(q)[0]] || faqAskText(q)
