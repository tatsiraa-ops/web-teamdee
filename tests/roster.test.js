/* เก็บไซซ์ทั้งทีม ระยะแรก (audit มือถือ 30 ต.ค. ข้อ 36) · ตัวอ่านรายชื่อที่วางจาก LINE / Excel / Google Sheets
   ทำงานในเครื่องล้วน ไม่มี backend · src/js/roster.js */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseRoster, normalize, issueText, lineSummaryText, LINE_CAP, rosterTable, rosterCsv, TEMPLATE, DEFAULT_SIZES, sizesFrom, rosterLineUrl } from '../src/js/roster.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const sizing = JSON.parse(read('src/data/sizing.json'))
const SIZES = sizesFrom(sizing.sizes)
const parse = (t) => parseRoster(t, { sizes: SIZES })
const one = (t) => parse(t).rows[0]
const codes = (r) => r.issues.map((i) => i.code)
const countOf = (res) => Object.fromEntries(res.counts.map((c) => [c.size, c.n]))

test('ไซซ์ตั้งต้นตรงกับ src/data/sizing.json (ลำดับเดียวกัน)', () => {
  assert.deepEqual(DEFAULT_SIZES.map((s) => s.size), sizing.sizes.map((s) => s.size))
  assert.deepEqual(SIZES.map((s) => s.size), sizing.sizes.map((s) => s.size))
  assert.equal(SIZES.find((s) => s.size === 'L').chest, 40)
})

test('normalize: เลขไทย ตัวเต็มความกว้าง ช่องว่างแปลก และอักขระมองไม่เห็น', () => {
  assert.equal(normalize('สมชาย ๑๐'), 'สมชาย 10')
  assert.equal(normalize('ＸＬ　１２'), 'XL 12')
  assert.equal(normalize('﻿สมชาย​ L '), 'สมชาย L')
  assert.equal(normalize('สมชาย，L，10'), 'สมชาย,L,10')
})

test('รูปแบบบรรทัดจริง: ชื่อ ไซซ์ / คอมมา / แท็บ / เบอร์นำหน้า', () => {
  assert.deepEqual(pick(one('สมชาย L')), { name: 'สมชาย', size: 'L', number: '' })
  assert.deepEqual(pick(one('สมชาย, L, 10')), { name: 'สมชาย', size: 'L', number: '10' })
  assert.deepEqual(pick(one('สมชาย ใจดี\tXL\t7')), { name: 'สมชาย ใจดี', size: 'XL', number: '7' })
  assert.deepEqual(pick(one('10 สมชาย XL')), { name: 'สมชาย', size: 'XL', number: '10' })
  assert.deepEqual(pick(one('สมหญิง รักดี m')), { name: 'สมหญิง รักดี', size: 'M', number: '' })
  assert.deepEqual(pick(one('L สมศรี')), { name: 'สมศรี', size: 'L', number: '' })
})

function pick(r) { return { name: r.name, size: r.size, number: r.number } }

test('ไซซ์หลายแบบ: XXL = 2XL · xxxl = 3XL · 5xl · SS = XS · ติดคำว่าไซส์/size', () => {
  assert.equal(one('ก XXL').size, '2XL')
  assert.equal(one('ก xxxl').size, '3XL')
  assert.equal(one('ก 4XL').size, '4XL')
  assert.equal(one('ก 5xl').size, '5XL')
  assert.equal(one('ก SS').size, 'XS')
  assert.equal(one('ก SS').alias, 'SS')
  assert.equal(one('มานี ไซส์ L').size, 'L')
  assert.equal(one('มานี ไซซ์L').size, 'L')
  assert.equal(one('มานี size: xl').size, 'XL')
  assert.equal(one('มานี (L)').size, 'L')
  assert.equal(one('มานี L.').size, 'L')
  assert.equal(one('มานี ไซส์ L').name, 'มานี')
})

test('เลขไทยและตัวเต็มความกว้างในบรรทัด', () => {
  assert.deepEqual(pick(one('สมชาย Ｌ ๑๐')), { name: 'สมชาย', size: 'L', number: '10' })
  assert.deepEqual(pick(one('๗ ปิติ ２ＸＬ')), { name: 'ปิติ', size: '2XL', number: '7' })
})

test('เบอร์เสื้อ: #10 · เบอร์ 10 · No.10 · ไม่เอาเบอร์โทรเป็นเบอร์เสื้อ', () => {
  assert.equal(one('ชูใจ L #10').number, '10')
  assert.equal(one('ชูใจ L เบอร์ 9').number, '9')
  assert.equal(one('ชูใจ เบอร์๙ L').number, '9')
  assert.equal(one('ชูใจ L No.23').number, '23')
  assert.equal(one('ชูใจ L 00').number, '00')
  const r = one('ชูใจ L 0812345678')
  assert.equal(r.number, '')
  assert.equal(r.size, 'L')
})

test('เลขลำดับรายการ (1. / 2) / - / •) ไม่ใช่เบอร์เสื้อ', () => {
  assert.deepEqual(pick(one('1. สมชาย L')), { name: 'สมชาย', size: 'L', number: '' })
  assert.deepEqual(pick(one('12) สมชาย M 5')), { name: 'สมชาย', size: 'M', number: '5' })
  assert.deepEqual(pick(one('- สมชาย S')), { name: 'สมชาย', size: 'S', number: '' })
  assert.deepEqual(pick(one('• สมชาย S')), { name: 'สมชาย', size: 'S', number: '' })
})

test('ไฟล์แม่แบบ CSV ของเว็บ: ข้ามหัวตาราง แถวตัวอย่าง และแถวว่าง · ช่องที่เหลือเป็นหมายเหตุ', () => {
  const csv = read('public/files/teamdee-size-template.csv')
  const res = parse(csv)
  assert.equal(res.rows.length, 0)
  const r = one('สมชาย ใจดี,L,SOMCHAI,10,ขอแขนยาว')
  assert.deepEqual(pick(r), { name: 'สมชาย ใจดี', size: 'L', number: '10' })
  assert.deepEqual(r.extra, ['SOMCHAI', 'ขอแขนยาว'])
  /* CSV ที่มีเครื่องหมายคำพูด */
  assert.deepEqual(pick(one('"ใจดี, สมชาย",XL,8')), { name: 'ใจดี, สมชาย', size: 'XL', number: '8' })
})

test('บรรทัดว่างไม่นับ · เลขบรรทัดตรงกับที่วาง', () => {
  const res = parse('\n\nสมชาย L\n   \nมานี M\n')
  assert.equal(res.rows.length, 2)
  assert.deepEqual(res.rows.map((r) => r.line), [3, 5])
})

test('ไซซ์ที่ไม่รู้จัก · ไม่มีไซซ์ · มีหลายไซซ์ → ติดธง ไม่นับเข้าไซซ์ไหน', () => {
  assert.deepEqual(codes(one('ก XLL')), ['size-unknown'])
  assert.equal(one('ก XLL').issues[0].value, 'XLL')
  assert.deepEqual(codes(one('ก 8XL')), ['size-unknown'])
  assert.deepEqual(codes(one('ก ฟรีไซส์')), ['size-missing'])
  assert.deepEqual(codes(one('ก ใหญ่')), ['size-missing'])
  assert.deepEqual(codes(one('ก, กลาง, 10')), ['size-missing'])
  assert.deepEqual(codes(one('ก M L')), ['size-multi'])
  const res = parse('ก XLL\nข L')
  assert.deepEqual(countOf(res), { L: 1 })
  assert.equal(res.total, 1)
  assert.equal(res.unsized, 1)
})

test('รอบอก "อก 40" ไม่เดาเป็นไซซ์ (รอบตัวคนกับตัวเสื้อต่างกัน) ติดธงพร้อมบอกไซซ์ที่อกตัวเสื้อตรงกัน', () => {
  const r = one('สมชาย อก 40')
  assert.equal(r.size, '')
  assert.equal(r.name, 'สมชาย')
  assert.deepEqual(codes(r), ['chest'])
  assert.equal(r.issues[0].value, '40')
  assert.equal(r.issues[0].hint, 'L')
  assert.match(issueText(r.issues[0]), /อก 40/)
  assert.match(issueText(r.issues[0]), /L/)
  assert.equal(one('สมชาย รอบอก ๔๓ นิ้ว').issues[0].hint, '')
  /* มีไซซ์ด้วย = ใช้ไซซ์ ไม่ติดธง */
  const both = one('สมชาย L อก 40')
  assert.equal(both.size, 'L')
  assert.deepEqual(codes(both), [])
})

test('ไม่มีชื่อ → ติดธงแต่ยังนับเสื้อ', () => {
  const r = one('L 10')
  assert.deepEqual(pick(r), { name: '', size: 'L', number: '10' })
  assert.deepEqual(codes(r), ['name-empty'])
  assert.equal(parse('L 10').total, 1)
})

test('เบอร์ซ้ำ / ชื่อซ้ำ → ติดธงทุกบรรทัดที่ซ้ำ พร้อมบอกบรรทัดคู่', () => {
  const res = parse('สมชาย L 10\nมานี M 10\nสมชาย  XL\nปิติ S 7')
  const [a, b, c, d] = res.rows
  assert.deepEqual(codes(a).sort(), ['name-dup', 'number-dup'])
  assert.deepEqual(codes(b), ['number-dup'])
  assert.deepEqual(b.issues[0].lines, [1])
  assert.deepEqual(codes(c), ['name-dup'])
  assert.deepEqual(c.issues[0].lines, [1])
  assert.deepEqual(codes(d), [])
  assert.equal(res.flagged.length, 3)
  assert.match(issueText(b.issues[0]), /เบอร์ 10 ซ้ำกับบรรทัด 1/)
  /* ชื่อซ้ำไม่สนตัวพิมพ์เล็กใหญ่ */
  assert.deepEqual(codes(parse('Tom L\ntom M').rows[1]), ['name-dup'])
})

test('สรุป: นับต่อไซซ์ตามลำดับตาราง รวมทั้งหมด', () => {
  const res = parse('ก XL\nข S\nค xl\nง 2XL\nจ M\nฉ XXL\nช S')
  assert.deepEqual(res.counts, [{ size: 'S', n: 2 }, { size: 'M', n: 1 }, { size: 'XL', n: 2 }, { size: '2XL', n: 2 }])
  assert.equal(res.total, 7)
  assert.equal(res.people, 7)
  assert.equal(res.flagged.length, 0)
})

test('รายชื่อจริงที่ยุ่ง 12 บรรทัด', () => {
  const messy = [
    'ชื่อ ไซซ์ เบอร์',
    '1. สมชาย L',
    'สมหญิง, m, 7',
    'ปิติ\tXL\t10',
    '10 มานี XXL',
    'ชูใจ ไซส์ S',
    'วีระ อก 42',
    'ทองดี ๓XL #๙',
    'สมชาย M',
    'L',
    'ประยุทธ XLL',
    'ดวงใจ ＸＬ 23',
  ].join('\n')
  const res = parse(messy)
  assert.equal(res.people, 11)
  assert.deepEqual(countOf(res), { S: 1, M: 2, L: 2, XL: 2, '2XL': 1, '3XL': 1 })
  assert.equal(res.total, 9)
  const flags = Object.fromEntries(res.flagged.map((r) => [r.line, codes(r).sort().join('+')]))
  assert.deepEqual(flags, { 2: 'name-dup', 4: 'number-dup', 5: 'number-dup', 7: 'chest', 9: 'name-dup', 10: 'name-empty', 11: 'size-unknown' })
})

test('ข้อความ LINE: นับต่อไซซ์ + รวม · ไม่มีชื่อคนใน URL แม้รายชื่อสั้น (2 พ.ย. อาร์ตเคาะ)', () => {
  const res = parse('สมชาย L 10\nมานี M\nปิติ L')
  const text = lineSummaryText(res)
  assert.match(text, /รวม 3 ตัว/)
  assert.match(text, /M 1 · L 2/)
  assert.doesNotMatch(text, /สมชาย|มานี|ปิติ/)
  assert.match(text, /รายชื่อเต็มจะวางตามในข้อความถัดไป/)
  assert.doesNotMatch(decodeURIComponent(rosterLineUrl(res)), /สมชาย/)
})

test('ข้อความ LINE: รายชื่อยาวก็ส่งแค่ยอด ไม่เกินเพดาน', () => {
  const many = Array.from({ length: 60 }, (_, i) => `สมาชิกทีมคนที่${i + 1} ${['S', 'M', 'L', 'XL'][i % 4]} ${i + 1}`).join('\n')
  const res = parse(many)
  const text = lineSummaryText(res)
  assert.ok(encodeURIComponent(text).length <= LINE_CAP, `${encodeURIComponent(text).length}`)
  assert.match(text, /รวม 60 ตัว/)
  assert.match(text, /S 15 · M 15 · L 15 · XL 15/)
  assert.doesNotMatch(text, /สมาชิกทีม/)
})

test('ข้อความ LINE: บอกจำนวนบรรทัดที่ยังต้องตรวจ · URL ชี้ oaMessage ของทีมดี', () => {
  const res = parse('ก L\nข XLL')
  const text = lineSummaryText(res)
  assert.match(text, /ยังไม่มีไซซ์ 1 คน/)
  assert.match(text, /ต้องตรวจอีก 1 บรรทัด/)
  const url = rosterLineUrl(res)
  assert.ok(url.startsWith('https://line.me/R/oaMessage/@teamdee/?'))
  assert.equal(decodeURIComponent(url.split('?')[1]), text)
})

test('ข้อความ LINE ตอนยังไม่มีรายชื่อ ไม่พัง', () => {
  assert.match(lineSummaryText(parse('')), /รวม 0 ตัว/)
})

test('คอมมาคั่นแล้วไซซ์/เบอร์ติดท้ายช่องชื่อ: "สมชาย L, เบอร์ 10" อ่านครบ', () => {
  assert.deepEqual(pick(one('สมชาย L, เบอร์ 10')), { name: 'สมชาย', size: 'L', number: '10' })
  assert.deepEqual(pick(one('สมชาย #7, L')), { name: 'สมชาย', size: 'L', number: '7' })
})

test('คอมมาคั่นแล้วมี 2 ไซซ์: "บี L,M" ติดธง ไม่เลือกเอง', () => {
  assert.deepEqual(codes(one('บี L,M')), ['size-multi'])
  assert.equal(one('บี L,M').name, 'บี')
})

test('ชื่อที่มีตัวอักษรเหมือนไซซ์กลางชื่อ ไม่โดนตัด', () => {
  assert.equal(one('Tom S Smith, L').name, 'Tom S Smith')
  assert.equal(one('Tom S Smith, L').size, 'L')
})

test('"สมาน 2 XL": ไซซ์ 2XL หรือเบอร์ 2 ไซซ์ XL ไม่เดา ติดธงและยังไม่นับ', () => {
  const r = one('สมาน 2 XL')
  assert.equal(r.size, '')
  assert.equal(r.number, '')
  assert.deepEqual(codes(r), ['size-spaced'])
  assert.match(issueText(r.issues[0]), /2XL/)
  /* เลขอยู่คนละตำแหน่ง = เบอร์เสื้อตามเดิม */
  assert.deepEqual(pick(one('10 สมชาย XL')), { name: 'สมชาย', size: 'XL', number: '10' })
  assert.deepEqual(pick(one('สมาน 10 XL')), { name: 'สมาน', size: 'XL', number: '10' })
})

test('บรรทัดยอดรวม "S 5 ตัว" "L = 3" ไม่ใช่รายชื่อ ติดธงและไม่นับ', () => {
  for (const line of ['S 5 ตัว', 'L = 3', 'XL x 2', 'M: 4 ตัว']) {
    const r = one(line)
    assert.equal(r.size, '', line)
    assert.equal(r.name, '', line)
    assert.deepEqual(codes(r), ['count-line'], line)
  }
  assert.match(issueText(one('S 5 ตัว').issues[0]), /S 5 ตัว/)
})

test('มีชื่อแต่บอกจำนวนตัว: ใช้ไซซ์ แต่เตือนให้แยกบรรทัด ชื่อไม่มีคำว่า "ตัว"', () => {
  const r = one('สมชาย L 2 ตัว')
  assert.deepEqual(pick(r), { name: 'สมชาย', size: 'L', number: '' })
  assert.deepEqual(codes(r), ['qty-line'])
})

test('ตารางคัดลอก: ช่องขึ้นต้นด้วย = + - @ ใส่ \' กันสูตร (ตรงกับ CSV)', () => {
  assert.equal(rosterTable(parse('=SUM(A1) M')).split('\n')[1], "1\t'=SUM(A1)\tM\t\t")
})

test('ตารางสำหรับคัดลอก: คั่นแท็บ วางลง Excel/Sheets แล้วเป็นคอลัมน์', () => {
  const res = parse('สมชาย L 10\nมานี XLL\nปิติ\tM\t\tแขนยาว')
  const t = rosterTable(res).split('\n')
  assert.equal(t[0], 'ลำดับ\tชื่อ\tไซซ์\tเบอร์\tหมายเหตุ')
  assert.equal(t[1], '1\tสมชาย\tL\t10\t')
  assert.equal(t[2], '2\tมานี\t?\t\tไซซ์ XLL ไม่มีในตาราง')
  assert.equal(t[3], '3\tปิติ\tM\t\tแขนยาว')
})

test('CSV: มี BOM ให้ Excel อ่านไทยถูก · ใส่เครื่องหมายคำพูดเมื่อจำเป็น · กันสูตร Excel', () => {
  const res = parse('"ใจดี, สมชาย",L,10\n=SUM(A1) M\nมานี "ตัวเล็ก" S')
  const csv = rosterCsv(res)
  assert.ok(csv.startsWith('﻿'))
  const lines = csv.slice(1).split('\r\n')
  assert.equal(lines[0], 'ลำดับ,ชื่อ,ไซซ์,เบอร์,หมายเหตุ')
  assert.equal(lines[1], '1,"ใจดี, สมชาย",L,10,')
  assert.equal(lines[2], "2,'=SUM(A1),M,,")
  assert.equal(lines[3], '3,"มานี ""ตัวเล็ก""",S,,')
})

test('แม่แบบ: อ่านได้ครบทุกบรรทัด และโชว์หลายรูปแบบ', () => {
  const res = parse(TEMPLATE)
  assert.ok(res.people >= 5)
  assert.equal(res.unsized, 0)
  assert.ok(TEMPLATE.includes('\t') || TEMPLATE.includes(','))
})

test('sizes เป็นข้อความล้วนก็ได้ (ไม่มีรอบอก)', () => {
  const res = parseRoster('ก L\nข SS', { sizes: ['S', 'M', 'L'] })
  assert.deepEqual(countOf(res), { L: 1 })
  assert.deepEqual(codes(res.rows[1]), ['size-unknown'])
})

test('ตาราง/CSV: ธงซ้ำอ้างเลขลำดับในตาราง ไม่ใช่เลขบรรทัดในช่องที่วาง (มีหัวตาราง/บรรทัดว่างคั่น)', () => {
  const res = parse('ชื่อ ไซซ์\n\nสมชาย L 10\nมานี M 10')
  const t = rosterTable(res).split('\n')
  assert.equal(t[1], '1\tสมชาย\tL\t10\tเบอร์ 10 ซ้ำกับลำดับ 2')
  assert.equal(t[2], '2\tมานี\tM\t10\tเบอร์ 10 ซ้ำกับลำดับ 1')
  assert.match(rosterCsv(res), /ชื่อ|เบอร์ 10 ซ้ำกับลำดับ 2/)
  /* บนหน้าจอยังอ้างเลขบรรทัดในช่อง */
  assert.match(issueText(res.rows[0].issues[0]), /ซ้ำกับบรรทัด 4/)
})
