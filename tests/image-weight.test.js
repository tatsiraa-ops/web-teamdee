/* 17 พ.ย. 2026 audit ความเร็ว: รูปส่งไฟล์ใหญ่เกินช่องที่แสดง
   - up2Contexts รูปลูกค้า (ช่อง 183px บนมือถือ) ใช้ 1x/2x → จอ DPR2 ได้ไฟล์ 1200px (~112 KB) แทน -480 (~23 KB) · /sport/ หนัก 1.4 MB จากส่วนนี้ส่วนเดียว
   - ผ้า /sublimation/ sizes 76vw → 629px > 600w จึงได้ไฟล์ 1200 ทุกใบ */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const part = (n) => readFileSync(new URL(`../src/partials/${n}.hbs`, import.meta.url), 'utf8')

test('รูปลูกค้าใน up2Contexts ใช้ srcset แบบความกว้าง + sizes ตามช่องจริง', () => {
  const pp = part('up2Contexts').match(/<figure class="up2-ctx__ph[^]*?<\/figure>/)[0]
  assert.match(pp, /srcset="\{\{this\.small\}\} 480w, \{\{this\.img\}\} 1200w"/)
  assert.match(pp, /sizes="\(min-width: 1024px\) 302px, \(min-width: 768px\) 347px, 45vw"/)
  assert.ok(!/ 2x"/.test(pp), 'ไม่ใช้ 1x/2x')
})

/* 17 พ.ย. โชว์ทั้งหมด: ตาราง 4/3 คอลัมน์ (≥1100) · 2 คอลัมน์ (640–1099) · มือถือรูปจิ๋ว 116px ข้างชื่อผ้า */
test('ผ้า /sublimation/ sizes ตามช่องในตาราง', () => {
  assert.match(part('pp2Fabric'), /sizes="\(min-width: 1100px\) 440px, \(min-width: 640px\) 46vw, 116px"/)
})

/* /project/ กองภาพหัวหน้า: ไฟล์ 1200px 5 ใบไม่มี srcset (มี -480 แล้ว) · 2 ใบซ่อนบนมือถือแต่ยังโหลด · fetchpriority อยู่ใบแรก แต่ภาพ LCP จริงบนมือถือคือใบที่ 3 (ล่างสุด ไม่ถูกบัง) */
test('กองภาพ /project/: srcset 480/1200 + sizes · 3 ใบที่เห็นบนมือถือ priority สูง · ใบ 4–5 lazy', () => {
  const html = readFileSync(new URL('../site/project/index.html', import.meta.url), 'utf8')
  const pile = html.match(/<ul class="pj-pile__list"[^]*?<\/ul>/)[0]
  assert.match(pile, /srcset="\{\{this\.small\}\} 480w, \{\{this\.img\}\} 1200w" sizes="\(min-width: 1024px\) 420px, 56vw"/)
  assert.match(pile, /\{\{#if \(lt @index 3\)\}\} fetchpriority="high"\{\{else\}\} loading="lazy"\{\{\/if\}\}/)
  const js = readFileSync(new URL('../src/build/pages/projects.js', import.meta.url), 'utf8')
  assert.match(js, /small: x\.imgSmall \|\| x\.img/)
})

/* หน้าแรก การ์ดกลุ่มลูกค้า: แสดง 299px บนจอ 414 (72vw) แต่ sizes บอก 80vw → จอ DPR2 ได้ไฟล์ 960 แทน 640 (12 รูป ~1.26 MB) */
test('การ์ดกลุ่มลูกค้าหน้าแรก sizes มือถือ 72vw (ได้ไฟล์ 640)', () => {
  const html = readFileSync(new URL('../site/index.html', import.meta.url), 'utf8')
  assert.match(html, /srcset="\{\{this\.imgSmall\}\} 640w, \{\{this\.img\}\} 960w" sizes="\(min-width:1024px\) 31vw, \(min-width:768px\) 45vw, 72vw"/)
})
