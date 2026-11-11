/* หน้าหนักบนมือถือ 2 จุด (audit มือถือ 30 ต.ค. ข้อ 24 · 27)
   ข้อ 24 แกลเลอรีรายกลุ่ม: เลื่อนถึงท้ายแล้วโหลดครบทุกภาพ (/sports-shirt/ 113 ภาพ 2.3MB) → โชว์ 24 ภาพแรก ปุ่ม "ดูเพิ่มอีก N ภาพ" ทีละ 24
     ภาพทุกใบยังอยู่ใน HTML (SEO · ไม่มี JS = เห็นครบ) · JS ซ่อนการ์ดด้วย hidden (รูป lazy ที่ซ่อนไม่โหลด)
     กล่องดูรูปใหญ่ยังเลื่อนถึงภาพสุดท้าย (ซ่อน .gcard ไม่ซ่อน figure) · ที่เลือกไว้ของภาพที่ยังไม่โชว์ยังอยู่ในถาด
   ข้อ 27 /project/: รูปที่พับไว้หลังปุ่ม "ดูอีก N ภาพ" (~340 รูป) อยู่ใน DOM ตั้งแต่โหลด → ย้ายไปไว้ใน <template> แตะแล้วค่อยใส่
     ชุดแรกของทุกกลุ่ม (รูปนำ + รูปเล็ก) ยังอยู่ใน HTML ให้ Google เห็น */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')
let out = ''
const built = (route) => readFileSync(join(out, route, 'index.html'), 'utf8')
const noTpl = (h) => h.replace(/<template[\s\S]*?<\/template>/g, '').replace(/<script[\s\S]*?<\/script>/g, '')

before(() => {
  out = mkdtempSync(join(tmpdir(), 'td-paging-'))
  execSync(`npx vite build --logLevel error --outDir "${out}" --emptyOutDir`, { cwd: root, stdio: 'pipe' })
})
after(() => { if (out) rmSync(out, { recursive: true, force: true }) })

/* ---------- ข้อ 24 แกลเลอรีรายกลุ่ม ---------- */
test('แกลเลอรี: ทุกภาพอยู่ใน HTML ไม่มีการ์ดซ่อนตั้งต้น (SEO + ไม่มี JS เห็นครบ) · ปุ่มดูเพิ่มซ่อนจน JS เปิด', () => {
  const h = built('sports-shirt')
  const cards = h.match(/<div class="gcard"[^>]*>/g) || []
  assert.ok(cards.length > 48, `การ์ด ${cards.length} ใบ`)
  for (const c of cards) assert.doesNotMatch(c, /\shidden/)
  const box = h.match(/<div class="gal-more"[^>]*>/)
  assert.ok(box, 'มีกล่องปุ่มดูเพิ่ม')
  assert.match(box[0], /\shidden/, 'ไม่มี JS = ไม่เห็นปุ่ม (ภาพครบอยู่แล้ว)')
  assert.match(h, /<button class="cb cb--s gal-more__btn" type="button" id="galMore" aria-controls="galGrid">/)
  assert.match(h, /<p class="[^"]*" id="galCount" role="status" aria-live="polite">/)
  /* ช่องประกาศอยู่นอกกล่องที่ซ่อน (ประกาศได้แม้ปุ่มหายตอนโชว์ครบ) */
  assert.ok(h.indexOf('id="galCount"') < h.indexOf('<div class="gal-more"'))
})

test('แกลเลอรี JS: 24 ภาพแรก · ดูเพิ่มทีละ 24 · ซ่อนที่ .gcard ไม่ใช่ figure · ประกาศจำนวน · โฟกัสภาพแรกที่เพิ่งเปิด · จำ ?n=', () => {
  const js = read('src/js/gallery-page.js')
  assert.match(js, /const PAGE = 24\b/)
  assert.match(js, /ดูเพิ่มอีก \$\{/)
  assert.match(js, /\.hidden = i >= shown/)
  assert.doesNotMatch(js, /figure[^\n]*\.hidden =/, 'figure ต้องไม่ถูกซ่อน กล่องรูปใหญ่จึงเลื่อนถึงภาพสุดท้าย')
  assert.match(js, /const lb = initLightbox\('#galGrid', 'figure', '[^']+', \{ pick:/)
  assert.match(js, /lb\?\.refresh\(\)/)
  assert.match(js, /\.lb-open'\)\?\.focus\(/)
  assert.match(js, /galCount/)
  assert.match(js, /history\.replaceState\(/)
  /* ที่เลือกไว้: ถาดผูกปุ่มทุกใบรวมที่ยังซ่อน ต้องเรียกก่อนแบ่งหน้า (ไม่แก้ pick-tray.js) */
  assert.ok(js.indexOf('initPickTray(') < js.indexOf('const PAGE'), 'ถาดเลือกเริ่มก่อน')
})

test('แกลเลอรี: ปุ่มดูเพิ่มสูงอย่างน้อย 44px · หัวข้องานจริงซ่อนตามการ์ดถัดไป', () => {
  const main = read('src/styles/main.css')
  const minH = Number((main.match(/^\.cb \{[^}]*min-height: (\d+)px/m) || [])[1])
  assert.ok(minH >= 44, `.cb min-height ${minH}`)
  const css = read('src/styles/picks.css')
  assert.match(css, /\.gal-more__btn \{[^}]*min-height: (4[4-9]|[5-9]\d)px/)
  assert.match(read('src/js/gallery-page.js'), /col-span-full/)
})

/* ---------- ข้อ 27 /project/ ---------- */
test('/project/: รูปที่พับไว้อยู่ใน <template> · ไม่มี <li hidden> · ปุ่มชี้ template ของกลุ่ม', () => {
  const h = built('project')
  assert.doesNotMatch(h, /<li data-full="[^"]*" hidden>/)
  const tpls = h.match(/<template id="rvT-[a-z0-9-]+">[\s\S]*?<\/template>/g) || []
  const btns = [...h.matchAll(/data-rv-more="rvC-([a-z0-9-]+)" data-rv-tpl="rvT-([a-z0-9-]+)"/g)]
  assert.ok(btns.length >= 3, `ปุ่ม ${btns.length}`)
  assert.equal(tpls.length, btns.length)
  for (const [, c, t] of btns) assert.equal(c, t)
  const inTpl = tpls.reduce((s, t) => s + (t.match(/<img\b/g) || []).length, 0)
  assert.ok(inTpl >= 300, `รูปใน template ${inTpl}`)
  for (const t of tpls) assert.match(t, /<li data-full="[^"]+"><img src="[^"]+" alt="[^"]+" width="320" height="320" loading="lazy" decoding="async">/)
  /* ปุ่มบอกจำนวนตรงกับรูปใน template */
  for (const [, c] of btns) {
    const t = tpls.find((x) => x.startsWith(`<template id="rvT-${c}">`))
    const n = (t.match(/<li\b/g) || []).length
    assert.match(h, new RegExp(`data-rv-tpl="rvT-${c}"[^>]*>ดูอีก <span class="tabular-nums">${n}</span> ภาพ`))
  }
})

test('/project/: ชุดแรกของทุกกลุ่มยังอยู่ใน HTML · DOM ตอนโหลดเล็กลง (รูปนอก template ≤ 200 · แท็ก < 2,600)', () => {
  const h = built('project')
  const lists = h.match(/<ul class="rv-grp mt-5" id="rvC-[^"]+"[\s\S]*?<\/ul>/g) || []
  assert.ok(lists.length >= 5, `กลุ่ม ${lists.length}`)
  for (const l of lists) {
    assert.match(l, /<li class="rv-grp__lead" data-full="[^"]+"><img /, 'มีรูปนำ')
    assert.ok((l.match(/<img\b/g) || []).length >= 4, 'มีรูปเล็กด้วย')
  }
  const live = noTpl(h)
  assert.ok((live.match(/<img\b/g) || []).length <= 200, `รูปนอก template ${(live.match(/<img\b/g) || []).length}`)
  assert.ok((live.match(/<[a-z][a-z0-9-]*/gi) || []).length < 2600, `แท็กนอก template ${(live.match(/<[a-z][a-z0-9-]*/gi) || []).length}`)
})

test('/project/ JS: กดดูเพิ่ม = ใส่จาก template · refresh กล่องรูปใหญ่ · โฟกัสรูปแรกที่เพิ่ม · ประกาศจำนวน', () => {
  const js = read('src/js/works-page.js')
  assert.match(js, /\.content\.cloneNode\(true\)/)
  assert.match(js, /\.refresh\(\)/)
  assert.match(js, /\.lb-open'\)\?\.focus\(\)/)
  assert.match(js, /aria-live|rvLive/)
  assert.doesNotMatch(js, /filter\(\(li\) => li\.hidden\)/, 'ไม่หา <li hidden> แล้ว')
})
