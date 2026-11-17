/* 17 พ.ย. 2026 อาร์ตเลือกข้อ 6ก: หน้าแรกฝัง SVG 303 อันแต่มีแค่ 27 แบบ (ไอคอนขยายซ้ำ 188 ครั้ง)
   → ตอน build: SVG ที่ซ้ำกันในหน้าเดียวกันเก็บครั้งเดียวใน sprite ต้น <body> · แต่ละจุดเหลือ <svg width height class aria><use href="#i…"/></svg>
   ไม่แตะ SVG ที่ข้างในมี class/id/style/<title>/<defs> (CSS/JS เข้าไม่ถึงข้างใน <use>) หรือ SVG ที่ CSS เจาะข้างใน (.th-mark .th-arc .g-lab) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { svgSprite } from '../src/build/plugins.js'

const ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12h14"/></svg>'
const page = (body) => `<!doctype html><html><head></head><body class="x">${body}</body></html>`

/* viewBox ต้องอยู่ที่จุดใช้ด้วย: SVG ที่ CSS กำหนดแค่ความกว้าง ใช้สัดส่วนจาก viewBox ตัวนอก (ไม่มี = สูง 150px ทุกหน้าสูงขึ้น 168–192px · เจอตอนเทียบภาพ 17 พ.ย.) */
test('SVG ที่ซ้ำ ≥2 ครั้ง → sprite ต้น body + <use> · ขนาด/viewBox/aria ยังอยู่ที่จุดใช้', () => {
  const out = svgSprite(page(`<a>${ICON}</a><b>${ICON}</b><i>${ICON.replace('16', '20').replace('16', '20')}</i>`))
  assert.match(out, /<body class="x"><svg hidden aria-hidden="true" style="display:none"><symbol id="i1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2\.4"><path d="M5 12h14"\/><\/symbol><\/svg>/)
  assert.equal((out.match(/<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><use href="#i1"\/><\/svg>/g) || []).length, 2)
  assert.match(out, /<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><use href="#i1"\/><\/svg>/, 'ขนาดต่างกัน ใช้ symbol เดียวกัน')
})

test('ไม่แตะ: ใช้ครั้งเดียว · ข้างในมี class/id · มี title · class ที่ CSS เจาะข้างใน', () => {
  const once = page(`<a>${ICON}</a>`)
  assert.equal(svgSprite(once), once)
  const inner = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="hm-faq__v" d="M1 1"/></svg>'
  assert.equal(svgSprite(page(inner + inner)), page(inner + inner))
  const titled = '<svg viewBox="0 0 24 24" role="img"><title>x</title><path d="M1 1"/></svg>'
  assert.equal(svgSprite(page(titled + titled)), page(titled + titled))
  const mark = '<svg class="th-mark" viewBox="0 0 24 24"><path d="M1 1"/></svg>'
  assert.equal(svgSprite(page(mark + mark)), page(mark + mark))
})

test('class / role / focusable ที่ตัว svg ยังอยู่ · รันซ้ำได้ผลเดิม', () => {
  const s = '<svg class="arw" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg>'
  const out = svgSprite(page(s + s))
  assert.equal((out.match(/<svg class="arw" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i1"\/><\/svg>/g) || []).length, 2)
  assert.equal(svgSprite(out), out)
})

/* viewBox ที่ไม่เริ่ม 0 (ไอคอน LINE "48 48 224 224"): ตัวนอกต้องเป็น "0 0 224 224" (สัดส่วนเดิม) · symbol คง viewBox เดิม
   ไม่งั้นเลื่อนซ้ำสองชั้น ไอคอนเยื้องออกนอกกรอบ (เจอตอนเทียบภาพ 17 พ.ย.) */
test('viewBox ไม่เริ่ม 0: จุดใช้ 0 0 W H · symbol คง viewBox เดิม', () => {
  const line = '<svg viewBox="48 48 224 224" width="24" height="24" aria-hidden="true"><path fill="#fff" d="M60 60h100"/></svg>'
  const out = svgSprite(page(line + line))
  assert.match(out, /<symbol id="i1" viewBox="48 48 224 224"><path fill="#fff" d="M60 60h100"\/><\/symbol>/)
  assert.equal((out.match(/<svg viewBox="0 0 224 224" width="24" height="24" aria-hidden="true"><use href="#i1"\/><\/svg>/g) || []).length, 2)
})

/* เจอตอนเทียบภาพ 17 พ.ย.: เส้นประเชื่อมขั้นตอน /embroidery/ (CSS ".pp2-stb__path path") กลายเป็นรูปทึบดำ
   เพราะข้างใน <use> CSS เข้าไม่ถึง → ทุก selector ใน CSS ที่เจาะถึง path/circle/rect/line/g ต้องมี class ที่ svgSprite ไม่แตะ */
test('ทุก selector ที่เจาะรูปทรงข้างใน SVG อยู่ในรายการที่ sprite ไม่แตะ', async () => {
  const { readdirSync, readFileSync } = await import('node:fs')
  const { SVG_SKIP_CLASS } = await import('../src/build/plugins.js')
  const dir = new URL('../src/styles/', import.meta.url)
  const miss = new Set()
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.css'))) {
    const css = readFileSync(new URL(f, dir), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    const top = (list) => { const out = []; let d = 0, cur = ''; for (const ch of list) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = '' } else cur += ch } out.push(cur); return out }
    for (const m of css.matchAll(/([^{}]+)\{/g)) for (const sel of top(m[1])) {
      const s = sel.trim()
      if (!/(^|[\s>+~(])(path|circle|rect|line|polyline|polygon|ellipse|g)(?=$|[\s:\[.,)])/.test(s)) continue
      /* lb__ico / dz__lines: JS สร้างตอนเปิดหน้า sprite ตอน build ไม่แตะ */
      if (!SVG_SKIP_CLASS.test(s) && !/\.(lb__ico|dz__lines)\b/.test(s)) miss.add(`${f}: ${s}`)
    }
  }
  assert.deepEqual([...miss], [])
})

/* 17 พ.ย. 2026 code review: เดิมอ่านแค่ค่าใน "…" · viewBox='…' หรือ viewBox ไม่มีค่า → .trim() ของ undefined → build ทั้งเว็บพัง */
test("SVG ที่ใช้ quote เดี่ยว ทำ sprite ได้ · viewBox ไม่มีค่า = ข้าม ไม่พัง", () => {
  const sq = "<svg width='16' height='16' viewBox='0 0 24 24' aria-hidden='true'><path d='M5 12h14'/></svg>"
  const out = svgSprite(page(sq + sq))
  assert.match(out, /<symbol id="i1" viewBox="0 0 24 24"><path d='M5 12h14'\/><\/symbol>/)
  assert.equal((out.match(/<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><use href="#i1"\/><\/svg>/g) || []).length, 2)
  const bad = '<svg viewBox aria-hidden="true"><path d="M1 1"/></svg>'
  assert.equal(svgSprite(page(bad + bad)), page(bad + bad))
})
