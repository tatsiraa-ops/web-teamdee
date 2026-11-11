/* เก็บไซซ์ทั้งทีม ระยะแรก (audit มือถือ 30 ต.ค. ข้อ 36) · มีเทส tests/roster.test.js
   อ่านรายชื่อที่วางจากแชท LINE / Excel / Google Sheets ทีละบรรทัด → ชื่อ ไซซ์ เบอร์เสื้อ + ธงบรรทัดที่ต้องตรวจ
   - ทำงานในเครื่องล้วน (pure) ไม่มี DOM ไม่มี backend · ข้อมูลออกจากเครื่องเฉพาะตอนผู้ใช้กดส่งทาง LINE เอง
   - ไซซ์มาจาก src/data/sizing.json (หน้าเว็บพิมพ์ไว้ใน data-sizes) · DEFAULT_SIZES ต้องตรงกับไฟล์นั้น (มีเทสกันหลุด)
   - "อก 40" ไม่เดาเป็นไซซ์: ตารางวัดตัวเสื้อวางราบ แต่คนมักบอกรอบตัว ต่างกันได้ 2–4 นิ้ว → ติดธงพร้อมบอกไซซ์ที่อกตัวเสื้อตรงกัน
   - SS นับเป็น XS (ไซซ์เล็กสุดในตาราง อก 34) · XXL = 2XL ฯลฯ */
import { lineMessageUrl } from './contact-send.js'

export { LINE_CAP } from './contact-send.js'

export const DEFAULT_SIZES = [
  ['XS', 34], ['S', 36], ['M', 38], ['L', 40], ['XL', 42], ['2XL', 44], ['3XL', 46], ['4XL', 48], ['5XL', 50], ['6XL', 52], ['7XL', 54],
].map(([size, chest]) => ({ size, chest }))

/** sizing.json sizes (หรือรายการข้อความ) → [{ size, chest }] */
export const sizesFrom = (list) => (list || []).map((s) => (typeof s === 'string' ? { size: s.toUpperCase(), chest: null } : { size: String(s.size).toUpperCase(), chest: Number.isFinite(+s.chest) ? +s.chest : null }))

/* ชื่อเรียกอื่นของไซซ์ · ใช้ได้เฉพาะเมื่อไซซ์ปลายทางมีในตาราง */
const ALIAS = { SS: 'XS', XXL: '2XL', XXXL: '3XL', XXXXL: '4XL', XXXXXL: '5XL', XXXXXXL: '6XL', XXXXXXXL: '7XL' }

/** เลขไทย ตัวเต็มความกว้าง (ＸＬ ，) ช่องว่างแปลก และอักขระมองไม่เห็น → แบบธรรมดา */
export function normalize(s) {
  return String(s ?? '')
    .normalize('NFKC')
    .replace(/[﻿​-‍⁠]/g, '')
    .replace(/\p{Nd}/gu, (c) => (c >= '\u0E50' && c <= '\u0E59' ? String(c.charCodeAt(0) - 0x0E50) : c))
    .replace(/[^\S\t\n]+/g, ' ')
    .replace(/ *\t */g, '\t')
    .trim()
}

/* คำนำหน้าไซซ์ ("ไซส์ L" "size: XL") · ต้องขึ้นต้นคำ ไม่กินกลางคำ ("ฟรีไซส์" คงไว้) */
const SIZE_WORD = /(^|[\s,;|(\t])(?:ไซ้?(?:ซ|ส|ด)์?|size)\s*[:：]?\s*(?=[0-9A-Za-z])/gi
/* เบอร์เสื้อที่บอกชัด → #10 */
const NUMBER_WORD = /(^|[\s,;|(\t])(?:เบอร์|หมายเลข|no\.?|#)\s*[:：.]?\s*(\d{1,3})(?!\d)/gi
/* รอบอก */
const CHEST = /(^|[\s,;|(\t])(?:รอบอก|อก)\s*[:：]?\s*(\d{2,3})(?:\s*(?:นิ้ว|"|in(?:ch(?:es)?)?\.?))?(?=$|[\s,;|)\t])/i
/* เลขลำดับรายการ / bullet หน้าบรรทัด (1. 2) - •) ไม่ใช่เบอร์เสื้อ */
const LIST_MARK = /^(?:\d{1,3}[.)](?!\d)|[-–•*·▪●])\s*/
/* หน้าตาเหมือนไซซ์ แต่ไม่มีในตาราง (XLL 8XL LL) */
const SIZE_LIKE = /^\d{0,2}[XSML]{1,8}$/

/* ยอดรวมต่อไซซ์ ไม่ใช่รายชื่อ: "L = 3" "XL x 2" "M: 4 ตัว" · จำนวนตัวในบรรทัด: "S 5 ตัว" (2 พ.ย.: เดิมอ่าน 5 เป็นเบอร์เสื้อ "ตัว" เป็นชื่อ) */
const COUNT_SEP = /^(\S+?)\s*[=:x×*]\s*(\d{1,4})(?:\s*ตัว)?$/i
const QTY = /(^|[\s,;|(\t])(\d{1,4})\s*ตัว(?=$|[\s,;|)\t])/
/* "2 XL" เว้นวรรค: ไซซ์ 2XL หรือเบอร์ 2 ไซซ์ XL · ไม่เดา */
const SPACED_XL = /(?:^|[\s,;|\t])([2-7]) +xl(?=$|[\s,;|\t])/i

const clean = (t) => String(t).replace(/^[("'[]+|[)"'\].,:;!]+$/g, '')

function sizeOf(token, known) {
  const t = clean(token).toUpperCase()
  if (!t || /^\d+$/.test(t)) return null
  if (known.has(t)) return { size: t, alias: '' }
  const a = ALIAS[t]
  if (a && known.has(a)) return { size: a, alias: t }
  if (SIZE_LIKE.test(t)) return { unknown: t }
  return null
}

/* แยกช่อง CSV แบบมีเครื่องหมายคำพูด ("ใจดี, สมชาย",L,10) */
function splitCsv(line, sep) {
  const out = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ } else if (c === '"') q = false
      else cur += c
    } else if (c === '"' && !cur.trim()) q = true
    else if (sep.test(c)) { out.push(cur.trim()); cur = '' } else cur += c
  }
  out.push(cur.trim())
  return out
}

const isHeader = (line) => /ชื่อ|name/i.test(line) && /ไซ(?:ซ|ส|ด)์|size/i.test(line)

/** อ่านบรรทัดเดียว (ยังไม่เช็กซ้ำ) · คืน null = ข้ามบรรทัด (ว่าง / หัวตาราง / แถวตัวอย่างของแม่แบบ) */
function parseLine(raw, known, chestMap) {
  let s = normalize(raw)
  if (!s || /^[\s,;|\t]*$/.test(s)) return null
  if (/^"?ตัวอย่าง/.test(s)) return null
  s = s.replace(LIST_MARK, '')
  s = s.replace(COUNT_SEP, (m, a, n) => (sizeOf(a, known)?.size ? `${a} ${n} ตัว` : m))
  let qty = ''
  s = s.replace(QTY, (m, pre, n) => { qty = n; return `${pre} ` })
  const spaced = (SPACED_XL.exec(s) || [])[1]
  let chest = ''
  s = s.replace(CHEST, (m, pre, v) => { chest = v; return pre + ' ' })
  const header = isHeader(s)
  s = s.replace(SIZE_WORD, '$1').replace(NUMBER_WORD, '$1 #$2 ')

  const sizes = []
  const unknown = []
  const explicit = []
  const bare = []
  const nameParts = []
  const extra = []
  const take = (tok, inField) => {
    const t = tok.trim()
    if (!t) return
    let m = t.match(/^#(\d{1,3})$/)
    if (m) return void explicit.push(m[1])
    if (/^\d{1,3}$/.test(t)) return void bare.push(t)
    if (/^\d{4,}$/.test(t)) return void extra.push(t)
    const z = sizeOf(t, known)
    if (z && z.size) return void sizes.push(z)
    if (z && z.unknown) return void unknown.push(z.unknown)
    if (inField) {
      if (!nameParts.length) nameParts.push(t)
      else extra.push(t)
    } else nameParts.push(t)
  }

  if (/[\t,;|]/.test(s)) {
    const sep = s.includes('\t') ? /\t/ : /[,;|]/
    const fields = splitCsv(s, sep)
    /* ช่องที่ทั้งช่องเป็นไซซ์/เบอร์ อ่านเป็นไซซ์/เบอร์ · ช่องที่ไม่ใช่: ช่องแรก = ชื่อ ที่เหลือ = หมายเหตุ */
    const tech = (p) => /^#?\d{1,3}$/.test(p) || sizeOf(p, known)
    for (const f of fields) {
      const parts = f.split(' ').filter(Boolean)
      if (parts.length > 0 && parts.every(tech)) { parts.forEach((p) => take(p, true)); continue }
      /* ไซซ์/เบอร์ติดท้ายช่องชื่อ ("สมชาย L, เบอร์ 10") · เฉพาะช่องชื่อ ช่องหมายเหตุคงเดิม · ตรวจแค่ท้ายช่อง ชื่อ "Tom S Smith" ไม่โดน */
      const tail = []
      if (!nameParts.length) while (parts.length > 1 && tech(parts[parts.length - 1])) tail.unshift(parts.pop())
      take(parts.join(' ').replace(/ #(\d{1,3}) ?/g, ' เบอร์ $1 ').trim(), true)
      tail.forEach((p) => take(p, true))
    }
  } else {
    s.split(' ').forEach((t) => take(t, false))
  }
  if (header && !sizes.length) return null

  const issues = []
  let size = ''
  let alias = ''
  const distinct = [...new Set([...sizes.map((z) => z.size), ...unknown])]
  if (distinct.length > 1) issues.push({ code: 'size-multi', values: distinct })
  else if (spaced && sizes[0]?.size === 'XL' && known.has(`${spaced}XL`)) {
    bare.splice(bare.indexOf(spaced), 1)
    issues.push({ code: 'size-spaced', value: spaced })
  } else if (sizes.length) ({ size, alias } = sizes[0])
  else if (unknown.length) issues.push({ code: 'size-unknown', value: unknown[0] })
  else if (chest) issues.push({ code: 'chest', value: chest, hint: chestMap.get(+chest) || '' })
  else issues.push({ code: 'size-missing' })

  let number = ''
  const nums = explicit.length ? explicit : bare
  if (nums.length === 1) number = nums[0]
  else if (nums.length > 1) issues.push({ code: 'number-multi', values: nums })

  const name = nameParts.join(' ').replace(/\s+/g, ' ').trim()
  if (qty && size && !name) return { name, size: '', alias: '', number: '', extra, issues: [{ code: 'count-line', value: size, n: qty }] }
  if (qty) issues.push({ code: 'qty-line', value: qty })
  if (!name) issues.push({ code: 'name-empty' })
  return { name, size, alias, number, extra, issues }
}

/** อ่านรายชื่อทั้งก้อน → { rows, counts, total, people, unsized, flagged }
    rows[i] = { line (เลขบรรทัดที่วาง), raw, name, size, alias, number, extra[], issues[] }
    counts = ไซซ์ที่มีคน เรียงตามตาราง · total = เสื้อที่รู้ไซซ์แล้ว */
export function parseRoster(text, { sizes = DEFAULT_SIZES } = {}) {
  const list = sizesFrom(sizes)
  const known = new Set(list.map((s) => s.size))
  const chestMap = new Map(list.filter((s) => s.chest).map((s) => [s.chest, s.size]))
  const rows = []
  String(text ?? '').split(/\r\n|\r|\n/).forEach((raw, i) => {
    const r = parseLine(raw, known, chestMap)
    if (r) rows.push({ line: i + 1, raw: raw.trim(), ...r })
  })

  /* ซ้ำ: ชื่อ (ไม่สนตัวพิมพ์/ช่องว่าง) และเบอร์ · ติดธงทุกบรรทัดที่ซ้ำ บอกบรรทัดคู่ */
  const dup = (key, code, value) => {
    const groups = new Map()
    for (const r of rows) { const k = key(r); if (k) groups.set(k, [...(groups.get(k) || []), r]) }
    for (const g of groups.values()) {
      if (g.length < 2) continue
      for (const r of g) r.issues.push({ code, value: value(r), lines: g.filter((o) => o !== r).map((o) => o.line) })
    }
  }
  dup((r) => r.name.toLowerCase(), 'name-dup', (r) => r.name)
  dup((r) => r.number, 'number-dup', (r) => r.number)

  const counts = list.map((s) => ({ size: s.size, n: rows.filter((r) => r.size === s.size).length })).filter((c) => c.n)
  return {
    rows,
    counts,
    total: counts.reduce((a, c) => a + c.n, 0),
    people: rows.length,
    unsized: rows.filter((r) => !r.size).length,
    flagged: rows.filter((r) => r.issues.length),
  }
}

/** เหตุผลของธงเป็นภาษาคน · ref = วิธีอ้างแถวคู่ที่ซ้ำ (บนจอ = เลขบรรทัดในช่อง · ตาราง/CSV = เลขลำดับ) */
const byLine = (lines) => `บรรทัด ${lines.join(', ')}`
export function issueText(i, ref = byLine) {
  switch (i.code) {
    case 'size-unknown': return `ไซซ์ ${i.value} ไม่มีในตาราง`
    case 'size-missing': return 'ไม่พบไซซ์'
    case 'size-multi': return `เจอหลายไซซ์ (${i.values.join(', ')}) ใส่ไซซ์เดียว`
    case 'chest': return `ระบุเป็นรอบอก ${i.value} นิ้ว ยังไม่ใช่ไซซ์${i.hint ? ` (ตัวเสื้อไซซ์ ${i.hint} อก ${i.value} นิ้ว)` : ''} เทียบตารางแล้วใส่ไซซ์`
    case 'name-empty': return 'ไม่มีชื่อ'
    case 'name-dup': return `ชื่อซ้ำกับ${ref(i.lines)}`
    case 'number-dup': return `เบอร์ ${i.value} ซ้ำกับ${ref(i.lines)}`
    case 'size-spaced': return `"${i.value} XL" ถ้าเป็นไซซ์พิมพ์ ${i.value}XL ถ้าเป็นเบอร์พิมพ์ XL #${i.value}`
    case 'count-line': return `บรรทัดนี้เป็นยอดรวม (${i.value} ${i.n} ตัว) ไม่ใช่รายชื่อ ใส่ชื่อทีละคน`
    case 'qty-line': return `ระบุ ${i.value} ตัว แยกเป็นบรรทัดละคน`
    case 'number-multi': return `เจอตัวเลขหลายตัว (${i.values.join(', ')}) ใส่เบอร์เสื้อแบบ #10`
    default: return 'ต้องตรวจ'
  }
}

export const countsText = (res) => res.counts.map((c) => `${c.size} ${c.n}`).join(' · ')

export const LINE_LATER = 'รายชื่อเต็มจะวางตามในข้อความถัดไป'

/** ข้อความตั้งต้นในแชท LINE · ข้อความอยู่ใน URL จึงมีแค่ยอดต่อไซซ์ ไม่มีชื่อคน (อาร์ตเคาะ 2 พ.ย. · กติกาเดียวกับ contact-send.js lineSummary)
    รายชื่อเต็มผู้ใช้คัดลอกไปวางในแชทเอง (ปุ่ม "คัดลอกรายชื่อทั้งหมด") */
export function lineSummaryText(res) {
  const head = ['สวัสดี ทีมดี ส่งสรุปไซซ์ทีม', `รวม ${res.total} ตัว`]
  if (res.counts.length) head.push(countsText(res))
  if (res.unsized) head.push(`ยังไม่มีไซซ์ ${res.unsized} คน`)
  if (res.flagged.length) head.push(`ต้องตรวจอีก ${res.flagged.length} บรรทัด`)
  return head.concat('', LINE_LATER).join('\n')
}

export const rosterLineUrl = (res) => lineMessageUrl(lineSummaryText(res))

const table = (res) => {
  const order = new Map(res.rows.map((r, i) => [r.line, i + 1]))
  const ref = (lines) => `ลำดับ ${lines.map((n) => order.get(n)).join(', ')}`
  const note = (r) => [...r.extra, ...r.issues.map((i) => issueText(i, ref))].join(' · ')
  return [['ลำดับ', 'ชื่อ', 'ไซซ์', 'เบอร์', 'หมายเหตุ'], ...res.rows.map((r, i) => [String(i + 1), r.name, r.size || '?', r.number, note(r)])]
}

/** ตารางคั่นแท็บ · วางลง Excel/Sheets แล้วเป็นคอลัมน์ วางในแชทก็อ่านได้ */
export const rosterTable = (res) => table(res).map((cols) => cols.map((c) => noFormula(c).replace(/[\t\n]/g, ' ')).join('\t')).join('\n')

/* ช่องที่ขึ้นต้นด้วย = + - @ Excel อ่านเป็นสูตร → ใส่ ' นำหน้า */
const noFormula = (v) => { const c = String(v ?? ''); return /^[=+\-@]/.test(c) ? `'${c}` : c }
const csvCell = (v) => {
  const c = noFormula(v)
  return /[",\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c
}

/** CSV มี BOM ให้ Excel อ่านไทยถูก · ขึ้นบรรทัดแบบ \r\n */
export const rosterCsv = (res) => '﻿' + table(res).map((cols) => cols.map(csvCell).join(',')).join('\r\n')

/** แม่แบบให้แก้ต่อ · โชว์หลายรูปแบบที่อ่านได้ */
export const TEMPLATE = [
  'สมชาย ใจดี L 10',
  'สมหญิง รักเรียน, M, 7',
  '9 มานี มีนา S',
  'ปิติ มานะ ไซส์ XL',
  'ชูใจ ใจงาม 2XL #23',
  'วีระ กล้าหาญ 3XL',
].join('\n')
