/* /project/ ภาพลูกค้าสวมเสื้อ · การ์ดป้ายกลุ่ม (11 พ.ย. 2026 อาร์ต "เอาตัวเลขออก และทำ cta ดีๆหน่อย เอาแบบเพื่อกดไปดูหน้าของกลุ่มนั้นๆต่อ")
   ไม่มีจำนวนภาพ · ปุ่มการ์ดเข้มชิดล่าง: รูปลูกค้าจริงของกลุ่ม 3 วง + วงลูกศรส้ม + "ไปหน้าเสื้อ<กลุ่ม>" */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const html = readFileSync('dist-wp/project/index.html', 'utf8')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const text = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

/* 11 พ.ย. รอบ 2 อาร์ต "ทำดีๆหน่อย พื้นที่ว่างเหลือเยอะ ไปคิดมา" → การ์ดเป็นโปสเตอร์รูปจริงของกลุ่ม (รูปที่ยังไม่โชว์ในราง)
   แถบส้มล่าง: ลูกค้ากลุ่ม · ชื่อ · คำบรรยายกลุ่ม (home.json uses.cards[].sub) · ปุ่มขาว "ไปหน้าเสื้อ<กลุ่ม>" · ไม่มีจำนวนภาพ */
test('การ์ดกลุ่ม: โปสเตอร์ภาพบรรยากาศกลุ่ม + ป้ายภาพจำลอง · คำบรรยายกลุ่ม · ปุ่มไปหน้ากลุ่ม · ไม่มีจำนวนภาพ', () => {
  const H = JSON.parse(readFileSync('src/data/home.json', 'utf8')).uses.cards
  const grps = [...html.matchAll(/<div class="pj-grp" id="rv-([a-z]+)" data-rv-panel>([\s\S]*?)<\/ul>/g)]
  assert.equal(grps.length, 10, '10 กลุ่ม')
  for (const [, cat, g] of grps) {
    const side = g.match(/<div class="rv-grp__head pj-grp__side" style="--poster:url\(([^)]+)\);--poster-at:\d+%">([\s\S]*?)<\/div>/)
    assert.ok(side, `${cat}: การ์ดมีรูปโปสเตอร์`)
    assert.ok(pub(side[1]), `${cat}: ${side[1]}`)
    /* 11 พ.ย. รอบ 3 อาร์ต "เอาเป็นรูปแบบฟิวๆของประเภทนั้นๆ ที่ๆเคยเจนมา" → ภาพบรรยากาศกลุ่มชุด uses-row (ภาพเดียวกับการ์ดกลุ่มหน้าแรก)
       เป็นภาพจำลอง (AI) อยู่ในส่วนรูปลูกค้าจริง → ต้องมีป้าย "ภาพจำลอง" ให้เห็น ห้ามทำให้เข้าใจว่าเป็นลูกค้า */
    assert.equal(side[1], `/img/uses-row/${cat}-960.webp`, `${cat}: ภาพบรรยากาศกลุ่มที่เคยเจน`)
    const s2 = side[2]
    assert.match(s2, /<span class="pj-grp__sim">(<t-nw>)?ภาพจำลอง(<\/t-nw>)?<\/span>/, `${cat}: ป้ายภาพจำลอง`)
    assert.doesNotMatch(s2, /pj-grp__n|pj-grp__faces|\d+\s*(<[^>]+>\s*)*ภาพ/, `${cat}: ไม่มีจำนวนภาพ`)
    const sub = s2.match(/<p class="pj-grp__sub">([\s\S]*?)<\/p>/); assert.ok(sub, `${cat}: คำบรรยายกลุ่ม`)
    assert.equal(text(sub[1]), H[cat].sub)
    const a = s2.match(/<a class="pj-grp__go" href="(\/[a-z-]+\/)"><span class="pj-grp__gt">([\s\S]*?)<\/span><span class="pj-grp__arw" aria-hidden="true"><svg/)
    assert.ok(a, `${cat}: ปุ่มไปหน้ากลุ่ม`); assert.match(text(a[2]), /^ไปหน้าเสื้อ/)
  }
  const css = readFileSync('src/styles/page-project.css', 'utf8')
  assert.match(css, /@media \(min-width: 1024px\) \{[^@]*\.pj-grp__side \{[^}]*var\(--poster\)/, 'คอมเป็นโปสเตอร์รูป')
  assert.match(css, /\.pj-grp__sim \{[^}]*position: absolute/, 'ป้ายภาพจำลองบนโปสเตอร์')
  assert.match(css, /\.pj-grp__go \{[^}]*min-height: 44px/, 'กดง่าย'); assert.match(css, /\.pj-grp__go:focus-visible \{[^}]*outline:/)
  assert.doesNotMatch(css, /\.pj-grp__n\b|\.pj-grp__faces/, 'ลบ CSS จำนวนภาพ/รูปวงกลม')
})

test('รูปทุกรูปในส่วนภาพลูกค้า (รางที่เห็น + ที่ซ่อนใน template) มีไฟล์จริง', () => {
  const sec = html.slice(html.indexOf('<section id="photos"'), html.indexOf('</section>', html.indexOf('<section id="photos"')))
  const srcs = [...sec.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1])
  assert.ok(srcs.length > 50)
  const missing = srcs.filter((s0) => !pub(s0))
  assert.deepEqual(missing, [], 'ไม่มีรูปเสีย')
})

/* 11 พ.ย. อาร์ต "ย้ายอันนี้มาไว้ระหว่างสองอันนี้": โลโก้ "แบรนด์และทีมที่ไว้วางใจทีมดี" อยู่ระหว่างกระดานรีวิว (#reviews) กับคลิปลูกค้า (#clips) */
test('/project/ โลโก้ลูกค้าอยู่ระหว่างรีวิวกับคลิป', () => {
  const at = (s) => html.indexOf(s)
  const logos = at('aria-labelledby="brands-h"')
  assert.ok(logos > 0, 'มีส่วนโลโก้')
  assert.ok(at('id="reviews"') < logos && logos < at('id="clips"'), 'อยู่ต่อจากรีวิว ก่อนคลิป')
  assert.ok(at('id="photos"') > at('id="clips"'), 'ภาพลูกค้ายังตามหลังคลิป')
  const seg = html.slice(logos, at('id="clips"'))
  assert.equal((seg.match(/<section/g) || []).length, (seg.match(/<\/section>/g) || []).length, 'ส่วนโลโก้ปิดแท็กก่อนถึงคลิป (ไม่ห่อส่วนอื่น)')
})

/* 11 พ.ย. อาร์ต "ไม่ต้องบอกจำนวน" (การ์ดทางลัดหัวหน้า) · เรียงการ์ดตามลำดับส่วนในหน้า (โลโก้ย้ายมาต่อจากรีวิว) */
test('/project/ การ์ดทางลัด: ไม่มีจำนวน · เรียงตามลำดับส่วนในหน้า', () => {
  const row = html.slice(html.indexOf('<ul class="pj-jt-row"'), html.indexOf('</ul>', html.indexOf('<ul class="pj-jt-row"')))
  assert.doesNotMatch(row, /pj-jt__n/, 'ไม่มีบรรทัดจำนวน')
  assert.doesNotMatch(text(row), /\d/, 'ไม่มีตัวเลข')
  const hrefs = [...row.matchAll(/class="pj-jt" href="#([a-z-]+)"/g)].map((m) => m[1])
  const pos = hrefs.map((h) => html.indexOf(h === 'brands-h' ? 'aria-labelledby="brands-h"' : `id="${h}"`, html.indexOf('</ul>', html.indexOf('<ul class="pj-jt-row"'))))
  assert.ok(pos.every((p) => p > 0), hrefs.join())
  assert.deepEqual(pos, [...pos].sort((a, b) => a - b), `เรียงตามหน้า: ${hrefs.join(' → ')}`)
})
