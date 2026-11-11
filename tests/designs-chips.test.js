/* หน้า /designs/ รอบ 150 (6 พ.ย. บอร์ด "หน้าแบบเสื้อ" + "ต่อเลย"): ตัดหัวราคา/ตัวเลข 91 และการ์ด "เลือกดูตามกลุ่มลูกค้า"
   → หัว "แบบเสื้อที่ใช่ สำหรับทีมคุณ" + ชิปกลุ่มลูกค้าเป็นตัวกรองบนหน้า (ลิงก์ ?use= / ?garment= ใช้ได้แม้ไม่มี JS) + แถบปรึกษา LINE ท้ายตาราง */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { chipApply, chipActive } from '../src/js/design-filter.js'

const main = () => { const h = readFileSync('dist-wp/designs/index.html', 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const text = (h) => h.replace(/<\/?t-(?:g|nw)>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

test('chipApply: ชิปกลุ่ม = ตั้ง use · ชิปทรง (แบด/วิ่ง) = ตั้ง garment และล้าง use · ทั้งหมด = ล้างทั้งคู่', () => {
  const s = { work: 'print', garment: 'polo', use: 'all', style: 'all', color: 'all' }
  assert.deepEqual(chipApply(s, { axis: 'use', val: 'corp' }), { ...s, use: 'corp' })
  assert.deepEqual(chipApply({ ...s, use: 'corp' }, { axis: 'garment', val: 'badminton' }), { ...s, use: 'all', garment: 'badminton' })
  assert.deepEqual(chipApply({ ...s, use: 'corp', garment: 'badminton' }, { axis: '' }), { ...s, use: 'all', garment: 'all' })
  assert.equal(s.use, 'all', 'ไม่แก้ state เดิม')
})

test('chipActive: ชิปที่ตรงกับตัวกรองตอนนี้ · ไม่ตรงชิปไหน = ทั้งหมด', () => {
  const chips = [{ axis: '', val: '' }, { axis: 'use', val: 'corp' }, { axis: 'garment', val: 'badminton' }]
  const base = { garment: 'all', use: 'all' }
  assert.equal(chipActive(base, chips), 0)
  assert.equal(chipActive({ ...base, use: 'corp' }, chips), 1)
  assert.equal(chipActive({ ...base, garment: 'badminton' }, chips), 2)
  assert.equal(chipActive({ ...base, garment: 'polo' }, chips), 0, 'ทรงอื่นจากตัวกรองทรง ไม่ใช่ชิป → ทั้งหมด')
  assert.equal(chipActive({ use: 'gov', garment: 'all' }, chips), -1, 'กลุ่มที่ไม่มีชิป = ไม่ไฮไลต์')
})

test('/designs/: หัว "แบบเสื้อที่ใช่ สำหรับทีมคุณ" · ไม่มีราคา/ตัวเลขใหญ่ · ไม่มีการ์ดกลุ่ม · ชิป 11 อัน · แถบปรึกษา LINE', () => {
  const m = main()
  assert.equal(text(m.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]).replace(/\s+/g, ''), 'แบบเสื้อที่ใช่สำหรับทีมคุณ')
  assert.equal(text(m.match(/<h1[^>]*>[\s\S]*?<span class="hm-hl">([\s\S]*?)<\/span><\/h1>/)[1]).replace(/\s+/g, ''), 'สำหรับทีมคุณ', 'คำเน้นสีส้ม')
  assert.match(text(m), /เลือกแบบที่ชอบ ปรับสี โลโก้ และข้อความให้เป็นทีมคุณ/)
  assert.doesNotMatch(m, /dg-hero__stat|hp--line|grp-cards|grpCards-h|crumb2/, 'ตัดตัวเลข 91 · แถวราคา · การ์ดกลุ่มลูกค้า · breadcrumb บนจอ (อาร์ต "ภาพสองเอาออก")')
  assert.match(m, /<h2 class="sr-only" id="grpChips-h">เลือกดูตามกลุ่มลูกค้า<\/h2>/, 'H2 ผัง v22 ซ่อนไว้')
  const chips = [...m.matchAll(/<a class="dg-chip"([^>]*)>([\s\S]*?)<\/a>/g)].map((c) => ({ attrs: c[1], t: text(c[2]).trim() }))
  assert.deepEqual(chips.map((c) => c.t), ['ทั้งหมด', 'บริษัท', 'กีฬา', 'รุ่น / ชมรม', 'คณะ / มหาวิทยาลัย', 'โรงเรียน', 'อีเวนต์ / กิจกรรม', 'ร้านค้า', 'หน่วยงาน', 'แบดมินตัน', 'วิ่ง'])
  assert.match(chips[0].attrs, /href="\/designs\/"[^>]*aria-current="true"/, 'ทั้งหมดเลือกไว้ตอนเปิด')
  assert.match(chips[1].attrs, /href="\/designs\/\?use=corp"[^>]*data-axis="use" data-val="corp"/)
  assert.match(chips[9].attrs, /href="\/designs\/\?garment=badminton"[^>]*data-axis="garment" data-val="badminton"/, 'แบดมินตันกรองตามทรงเสื้อ (แบบในคลังไม่ได้ติดกลุ่มแบด)')
  assert.match(chips[10].attrs, /\?garment=running"/)
  assert.ok(m.indexOf('dg-chips') < m.indexOf('id="dgCat-h"'), 'ชิปอยู่เหนือหัวข้อค้นหาและกรอง')
  assert.doesNotMatch(m, /dg-ask|class="cx cx--/, 'แถบเล็ก + กล่องแชทเดิมแทนด้วยแบนเนอร์ LINE (รอบ 151)')
})

test('/designs/ รอบ 151 (อาร์ต "ต่อลงมาขอ cta แบบนี้ ทำให้ดีกว่าเดิม"): แบนเนอร์ "แชทผ่าน LINE" ต่อจากตาราง · ข้อความ HTML · แชทในมือถือ = ข้อความที่พิมพ์รอไว้จริง · ไม่มีรูปพนักงาน/ชื่อแบรนด์อื่น', () => {
  const m = main()
  const lc = m.match(/<section class="lc"[^>]*>([\s\S]*?)<\/section>/)
  assert.ok(lc, 'มีแบนเนอร์'); const b = lc[1]
  assert.ok(m.indexOf('class="lc"') > m.indexOf('id="designMore"'), 'ต่อจากตารางแบบ')
  assert.equal(text(b.match(/<p class="lc__title">([\s\S]*?)<\/p>/)[1]).trim(), 'แชทผ่าน LINE', 'ตัวใหญ่บนจอ')
  assert.match(lc[0], /<h2 class="sr-only" id="lc-h">ยังไม่เจอแบบที่ชอบ\? ส่งภาพอ้างอิงมาคุยได้<\/h2>/, 'H2 ผัง v22')
  assert.match(text(b), /ตอบภายใน 5 นาที/, 'คำเดียวกับทั้งเว็บ (home.json reply)')
  /* อาร์ต "หนาไป ทำดีๆ ครีเอทๆหน่อย": แถบบาง · เหตุผลรวมเป็นประโยคเดียว · ปุ่มเม็ดยา (ไม่เต็มกว้าง) · ฟองแชทลอยล้นขอบ */
  assert.match(text(b.match(/<p class="lc__sub">([\s\S]*?)<\/p>/)[1]), /ส่งรหัสแบบ[\s\S]*ขอราคา[\s\S]*สั่งผลิต/, 'เหตุผลรวมประโยคเดียว')
  assert.doesNotMatch(b, /lc__pt|dock-line/, 'ไม่มีรายการไอคอน 3 ข้อ · ไม่มี LINE 3D')
  /* รอบ 155 อาร์ต "cta ทำดีๆหน่อย ไปเจนอะไรมาได้เต็มที่": มือถือ 3D เจน (จอว่าง ไม่มีตัวอักษร) + แชท HTML บนจอ */
  const ph = b.match(/<img class="lc__phimg" src="(\/img\/line-cta\/phone-3d-\d+\.webp)"[^>]*alt=""/)
  assert.ok(ph && existsSync(new URL(`../public${ph[1]}`, import.meta.url)), 'ภาพมือถือ 3D')
  const go = b.match(/<a class="lc__go" href="(https:\/\/[^"]+)"[^>]*data-track="line" data-where="designs-line"[^>]*>([\s\S]*?)<\/a>/)
  assert.ok(go, 'ปุ่มใหญ่ไป LINE'); assert.match(text(go[2]), /เริ่มแชทเลย/)
  const chat = b.match(/<div class="lc__chat" aria-hidden="true">([\s\S]*?)<\/div><!-- \/chat -->/)
  assert.ok(chat, 'ฟองแชทเป็นภาพประกอบ ซ่อนจากโปรแกรมอ่านจอ')
  const sent = decodeURIComponent(go[1].split('text=')[1] || go[1].split('?')[1] || '')
  for (const ln of [...chat[1].matchAll(/<span class="lc__ln">([\s\S]*?)<\/span>/g)].map((x) => text(x[1]).trim().replace(/:\s*$/, ''))) assert.ok(sent.includes(ln.replace(/\s*ตัว$/, '')), `ข้อความในแชท "${ln}" = ที่ปุ่มพิมพ์รอไว้จริง`)
  assert.match(chat[1], /<img src="\/img\/[^"]+" [^>]*>[\s\S]*TD-\d{4}/, 'แนบภาพแบบพร้อมรหัสจริง')
  assert.doesNotMatch(b, /Tumtook|Noon|avatar|sale-/i, 'ไม่ลอกชื่อ/รูปพนักงานจากบอร์ดอ้างอิง')
  assert.match(b, /href="\/contact[\w-]*\/\?from=%2Fdesigns%2F"/, 'ทางเลือกฝากข้อมูลยังอยู่')
})

test('/designs/ ตาราง (อาร์ต "พวกรูปให้แสดงมาซัก 10 แถว"): pageSize = คอลัมน์ × 10 · ใต้ตารางมีแถบความคืบหน้า + ปุ่มบอกจำนวนที่จะเพิ่ม · หมายเหตุเป็นตัวเล็กกลาง', async () => {
  const { pageSize, moreLabel } = await import('../src/js/design-filter.js')
  assert.equal(pageSize(4), 40); assert.equal(pageSize(2), 20); assert.equal(pageSize(3), 30)
  assert.equal(pageSize(0), 40, 'อ่านคอลัมน์ไม่ได้ = 40'); assert.equal(pageSize(NaN), 40)
  assert.equal(moreLabel(40, 91, 40), 'ดูแบบเพิ่มอีก 40 แบบ'); assert.equal(moreLabel(80, 91, 40), 'ดูแบบเพิ่มอีก 11 แบบ')
  const m = main()
  const more = m.match(/<div class="dz-more">([\s\S]*?)<\/div><!-- \/more -->/)
  assert.ok(more, 'ส่วนโหลดเพิ่ม')
  const total = JSON.parse(readFileSync('src/data/designs.json', 'utf8')).length
  assert.match(more[1], new RegExp(`<div class="dz-prog"[^>]*role="progressbar"[^>]*aria-valuemax="${total}"`), `แถบความคืบหน้า (${total} แบบ = คลังทั้งหมด)`)
  assert.match(more[1], /id="designMore"/)
  assert.doesNotMatch(m, /dz-fine|class="t-xs max-w-\[70ch\] mt-10"/, 'อาร์ต "ภาพแรกลบ": ไม่มีหมายเหตุใต้ตาราง')
})

test('/designs/ CTA รอบ 156 (อาร์ต "ยังไม่โดนอะ"): เสื้อลายจริง 5 ตัว (ภาพตัวหน้า + รหัสจริงจากคลัง) ลอยเข้าหามือถือ · เห็นว่าเป็นทีมดี', () => {
  const b = main().match(/<section class="lc"[^>]*>([\s\S]*?)<\/section>/)[1]
  const fly = [...b.matchAll(/<li class="lc__fly lc__fly--\d"><img src="([^"]+)"[^>]*alt=""[^>]*><b>(TD-\d{4})<\/b><\/li>/g)]
  assert.equal(fly.length, 5, 'เสื้อลอย 5 ตัว')
  const designs = JSON.parse(readFileSync('src/data/designs.json', 'utf8'))
  for (const [, src, code] of fly) {
    assert.match(src, /^\/img\/design-front\/[\w-]+-720\.webp$/); assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
    const d = designs.find((x) => x.code === code); assert.ok(d, `${code} มีในคลัง`)
    assert.equal(src, `/img/design-front/${d.img.split('/').pop().replace(/\.\w+$/, '')}-720.webp`, `${code} ภาพตรงรหัส`)
  }
  assert.match(b, /<ul class="lc__flies" aria-hidden="true">/, 'ภาพประกอบ ซ่อนจากโปรแกรมอ่านจอ')
})

test('/designs/ การ์ด (อาร์ต "ทำรูปให้มันเต็มๆหน่อย"): ภาพที่ไม่ใช่ 3:2 ใช้ภาพตัด design-thumb (เสื้อเต็มการ์ด) · กดดูใหญ่ = ไฟล์เต็ม · ไม่มี board-thumb ย่อจัตุรัส', () => {
  const m = main()
  const cards = [...m.matchAll(/<div class="dcard" data-code="(TD-\d{4})"[^>]*data-full="([^"]+)"[^>]*>[\s\S]*?<img src="([^"]+)"/g)]
  assert.equal(cards.length, JSON.parse(readFileSync('src/data/designs.json', 'utf8')).length, 'ทุกการ์ดมี data-full')
  const thumbs = cards.filter((c) => c[3].startsWith('/img/design-thumb/'))
  const designs = JSON.parse(readFileSync('src/data/designs.json', 'utf8'))
  const notWide = designs.filter((d) => d.width && Math.abs(d.width / d.height - 1.5) > 0.05)
  for (const d of notWide) assert.ok(thumbs.some((c) => c[1] === d.code), `${d.code} (${d.width}×${d.height}) ใช้ภาพตัด`)
  assert.ok(thumbs.length >= notWide.length, `ภาพตัด ${thumbs.length} ใบ`)
  for (const [, code, full, src] of thumbs) {
    assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src)
    assert.equal(src.replace('/img/design-thumb/', '').replace(/-(540|1080)\.webp$/, ''), full.split('/').pop().replace(/\.\w+$/, ''), `${code} ภาพตัดตรงไฟล์เต็ม`)
  }
  assert.ok(cards.some((c) => c[1] === 'TD-0123' && c[3].startsWith('/img/design-thumb/embroider-')), 'บอร์ดงานปักใช้ภาพตัด')
  assert.doesNotMatch(m, /dcard__fig board-thumb/, 'ไม่ย่อบอร์ดใส่จัตุรัสแล้ว')
})

test('/designs/ เบสบอล (อาร์ต 6 พ.ย. "ทำไมภาพแตกจัง รื้อตรงนี้เอารูปใหม่ๆไป" + "ตรงไหนมี taround ทำเป็นของ teamdee ให้หมด"): ชุดใหม่ 32 แบบ ภาพคมจากไฟล์ต้นฉบับ ไม่มีภาพเล็กแตก', () => {
  const designs = JSON.parse(readFileSync('src/data/designs.json', 'utf8'))
  const ta = designs.filter((d) => d.garment === 'baseball' && d.img.startsWith('/img/design/ta-'))
  assert.equal(ta.length, 32, 'ใช้ครบ 32 แบบ')
  assert.equal(new Set(ta.map((d) => d.code)).size, 32, 'รหัสไม่ซ้ำ')
  for (const d of ta) {
    assert.equal(d.img, `/img/design/ta-${d.code.slice(3)}.webp`, `${d.code} ชื่อไฟล์ตรงรหัส`)
    assert.ok(d.width >= 1536 && d.height >= 1024, `${d.code} ภาพใหญ่พอ`)
    for (const f of [d.img, d.imgSmall]) assert.ok(existsSync(new URL(`../public${f}`, import.meta.url)), f)
    assert.ok(d.color, `${d.code} มีสี`)
    assert.ok(existsSync(new URL(`../public/img/design-front/ta-${d.code.slice(3)}-720.webp`, import.meta.url)), `${d.code} มีภาพตัดตัวหน้า (ราง /sublimation/)`)
  }
  assert.ok(!designs.some((d) => d.garment === 'baseball' && /loose-/.test(d.img)), 'ไม่เหลือภาพเบสบอลเล็กแตก (loose-*)')
  assert.ok(!designs.some((d) => d.code === 'TD-0499'), 'TD-0499 (ภาพซูมซ้ำ) ถอดออก')
  assert.doesNotMatch(JSON.stringify(designs), /t\s?around/i, 'ไม่มีชื่อแบรนด์อื่นในข้อมูล')
})

test('/designs/ เบสบอล: พื้นหลังขาวล้วน (อาร์ต "เอาพื้นหลังขาวล้วน") · ขอบซ้าย/ขวาไม่มีแขนเสื้อตัวข้างเคียง (อาร์ต "ขอบๆรูปมีแขนเสื้อติดมา")', async () => {
  const { execFileSync } = await import('node:child_process')
  const files = JSON.parse(readFileSync('src/data/designs.json', 'utf8')).filter((d) => d.img.startsWith('/img/design/ta-') || /\/3d-\d+\.webp$/.test(d.img)).map((d) => 'public' + d.img) /* + แบบ 3D TD-0267–0283 เดิมพื้นดำ (อาร์ต "อันนี้ด้วย") */
  /* อ่านพิกเซลด้วย PIL (โปรเจกต์ไม่มีตัวถอด webp ฝั่ง node) · แถบขอบซ้าย/ขวา 20px ต้องขาว (แขนตัวข้างเคียงเดิมกว้าง 46px · แขนเสื้อตัวเองในภาพ 3D อยู่ห่างขอบ 40px) (≥244 ทุกช่องสี) */
  const py = `import sys,json\nfrom PIL import Image\nbad=[]\nfor f in sys.argv[1:]:\n im=Image.open(f).convert('RGB'); W,H=im.size; p=im.load()\n for x in list(range(0,20,4))+list(range(W-20,W,4)):\n  for y in range(0,H,8):\n   if min(p[x,y])<244: bad.append([f,x,y]); break\nprint(json.dumps(bad[:5]))`
  const bad = JSON.parse(execFileSync('python3', ['-c', py, ...files], { encoding: 'utf8' }))
  assert.ok(files.length >= 41, `ตรวจ ${files.length} ภาพ`)
  assert.deepEqual(bad, [], 'ขอบภาพขาวล้วน')
})
