/* 13 พ.ย. 2026 ส่วนตารางไซซ์หน้าปัก (อาร์ตแคปส่วนไซซ์ "ทำตรงนี้มาดีๆหน่อย")
   ที่เจอ: ปุ่ม "ผู้หญิง" กดแล้วไม่เปลี่ยน (ค่าตั้งต้นกลุ่มที่สอง = No.6 ของหน้าพิมพ์ลาย ไม่มีในไซซ์หญิง) · ภาพเสื้อเป็นแบบลูกค้า (PRANATIC)
   เส้นวัดไม่อยู่ที่ขอบเสื้อ ป้ายตัวเลขทับเสื้อ · ชาย/หญิงใช้ภาพเดียวกัน · ตารางสองใบคอลัมน์ไม่ตรงกัน
   แก้ (เฉพาะหน้าปัก · pp2.sizes.v2): เสื้อโปโลทีมดีทรงชาย/หญิงด้านหน้า เส้นวัดตามขอบเสื้อจริง เลข 1–2 ตรงกับวิธีวัด · ตารางคอลัมน์ตรงกัน
   อ่านจาก dist-wp (npm run export:wp ก่อนรัน) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fmtSize, pickDefault } from '../src/js/sizechart.js'

const read = (f) => readFileSync(f, 'utf8')
const mainOf = (p) => { const h = read(`dist-wp/${p}/index.html`); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const sizeSec = (p) => { const m = mainOf(p); const at = m.search(/<section[^>]*id="size"/); return m.slice(at, m.indexOf('</section>', at)) }
const s = sizeSec('embroidery')

test('ค่าตั้งต้นของกลุ่มไซซ์: ใช้ไซซ์ที่ขอถ้ามี · ไม่มีใช้ M · ไม่มี M ใช้ตัวแรก (ปุ่ม "ผู้หญิง" เคยกดไม่ติดเพราะหา No.6 ไม่เจอ)', () => {
  assert.equal(pickDefault(['No.2', 'No.4', 'No.6'], 'No.6'), 'No.6')
  assert.equal(pickDefault(['XS', 'S', 'M', 'L'], 'No.6'), 'M')
  assert.equal(pickDefault(['SS', 'S'], 'No.6'), 'SS')
  assert.equal(pickDefault([], 'M'), '')
  assert.equal(fmtSize(40, 'cm'), '102')
})

test('ภาพเสื้อ: โปโลทีมดีด้านหน้า ทรงชายและทรงหญิงคนละภาพ (ไม่ใช้แบบลูกค้า) · ทรงหญิงซ่อนไว้จนกว่าจะเลือก', () => {
  assert.match(s, /^<section class="pp2-sz pp2-sz--even pp2-sz--v2"/)
  const figs = [...s.matchAll(/<div class="pp2-sz__fig" data-sz-fig="(adult|kids)"( hidden)?[^>]*style="([^"]+)"[^>]*>([\s\S]*?)<\/div><!-- \/fig -->/g)]
  assert.deepEqual(figs.map((f) => [f[1], !!f[2]]), [['adult', false], ['kids', true]])
  assert.match(figs[0][4], /<img[^>]*src="[^"]*\/img\/emb-real\/polo-men-690\.webp"[^>]*alt="[^"]+"/)
  assert.match(figs[1][4], /<img[^>]*src="[^"]*\/img\/emb-real\/polo-women-617\.webp"[^>]*alt="[^"]+"/)
  for (const f of ['polo-men-440', 'polo-men-690', 'polo-women-440', 'polo-women-617']) assert.ok(existsSync(`public/img/emb-real/${f}.webp`), f)
  assert.doesNotMatch(s, /design-front\/embroider-019/, 'ไม่ใช้ภาพแบบของลูกค้าเป็นภาพวัดไซซ์')
})

test('เส้นวัดวางตามขอบเสื้อของแต่ละทรง (ค่าพิกัดอยู่ที่ภาพนั้น) · เลข 1 รอบอก 2 ความยาว ตรงกับขั้นวิธีวัด · ป้ายตัวเลขเปลี่ยนตามไซซ์', () => {
  const figs = [...s.matchAll(/<div class="pp2-sz__fig" data-sz-fig="(?:adult|kids)"(?: hidden)?[^>]*style="([^"]+)"[^>]*>([\s\S]*?)<\/div><!-- \/fig -->/g)]
  for (const [, style, body] of figs) {
    for (const v of ['--cy', '--cx1', '--cx2', '--ly1', '--ly2', '--hx', '--bx']) assert.match(style, new RegExp(`${v}:\\s*[\\d.]+%`), v)
    assert.match(body, /class="pp2-sz__ln pp2-sz__ln--w"/)
    assert.match(body, /class="pp2-sz__ln pp2-sz__ln--h"/)
    assert.match(body, /class="pp2-sz__tag pp2-sz__tag--w">\s*<i aria-hidden="true">1<\/i>[\s\S]*?data-sz-chest/)
    assert.match(body, /class="pp2-sz__tag pp2-sz__tag--h">\s*<i aria-hidden="true">2<\/i>[\s\S]*?data-sz-len/)
  }
  assert.notEqual(figs[0][1], figs[1][1], 'ทรงชายกับทรงหญิงพิกัดเส้นวัดไม่เท่ากัน')
  const how = [...s.matchAll(/<ol class="pp2-sz__how">([\s\S]*?)<\/ol>/g)][0][1]
  assert.match(how, /วัดรอบอก[\s\S]*วัดความยาว/, 'ลำดับวิธีวัด 1 รอบอก 2 ความยาว ตรงกับเลขบนภาพ')
})

test('ฝั่งควบคุม: บอกตัวเลขของไซซ์ที่เลือกไว้ข้างชื่อไซซ์ด้วย (ไม่ต้องมองหาบนภาพ) · ค่าตั้งต้น M ชาย 40 / 28', () => {
  const now = s.match(/<div class="pp2-sz__now">[\s\S]*?<\/div><!-- \/now -->/)[0]
  assert.match(now, /data-sz-name>M</)
  assert.match(now, /รอบอก[\s\S]*?data-sz-chest>40<[\s\S]*?ความยาว[\s\S]*?data-sz-len>28</)
  assert.equal([...s.matchAll(/data-sz-chest/g)].length, 3, 'รอบอก: ภาพชาย ภาพหญิง และฝั่งควบคุม')
})

test('ตาราง: ชายและหญิงคอลัมน์ตรงกันทุกไซซ์ (ตารางหญิงเว้นช่องไซซ์ที่ไม่มี) · กดช่องในตาราง = เลือกไซซ์นั้น', () => {
  const tbl = (id) => s.match(new RegExp(`<table class="pp2-sz__t[^"]*" id="${id}">([\\s\\S]*?)</table>`))[1]
  const cols = (t) => [...t.slice(t.indexOf('<thead'), t.indexOf('</thead>')).matchAll(/<t[hd](?=[\s>])[^>]*>/g)].length
  assert.equal(cols(tbl('sz-adult')), 16)
  assert.equal(cols(tbl('sz-kids')), 16, 'ตารางหญิงมีจำนวนคอลัมน์เท่าตารางชาย')
  assert.equal([...tbl('sz-kids').matchAll(/class="pp2-sz__na"/g)].length, 12, 'ช่องว่างของไซซ์ที่ไม่มีทรงหญิง 4 ไซซ์ × 3 แถว')
  const js = read('src/js/sizechart.js')
  assert.match(js, /closest\('\[data-c\]'\)/, 'กดช่องในตารางเลือกไซซ์ได้ (มือถือไม่มี hover)')
})

test('หน้าพิมพ์ลายยังใช้ส่วนไซซ์แบบเดิม (ไม่ได้เปิด v2)', () => {
  const p = sizeSec('sublimation')
  assert.match(p, /^<section class="pp2-sz" id="size"/)
  assert.doesNotMatch(p, /pp2-sz__fig|pp2-sz__tag/)
})
