/* /about-us/ รอบ 170 (9 พ.ย. อาร์ต "delicake.net/our-story/ ref … รื้อมาใหม่หมด" → รายงาน → "เจนได้หมด เอาตามที่เสนอ")
   โครงตามจังหวะหน้า Delicake: แบนเนอร์ภาพเต็ม → ผู้ก่อตั้ง+ปรัชญา → จุดเริ่มต้น → แถบตัวเลข → ช่วยคิด/จัดการ/จบงาน → 3WIN → ทีมแต่ละขั้น
   → งานเด่น FTI → งานจริงที่ระบุชื่อได้ → โลโก้ → ข้อมูลบริษัท → แชท → นัดหมาย
   ของจริงเท่านั้น: ภาพทีมงานจาก Drive "รูปภาพโรงงาน" (อาร์ตอนุญาตทั้งหมด) · ไม่เจนหน้าคนแทนผู้ก่อตั้ง/ทีม · ตัวเลขงานจากข้อมูลที่ทีมดีเผยแพร่เอง */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const html = readFileSync(new URL('../dist-wp/about-us/index.html', import.meta.url), 'utf8')
const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
const text = main.replace(/<\/?t-[a-z]+>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/&amp;/g, '&')
const pub = (p) => existsSync(new URL(`../public${p}`, import.meta.url))
const data = JSON.parse(readFileSync(new URL('../src/data/about-v2.json', import.meta.url), 'utf8'))

test('ส่วนครบตามลำดับ Delicake ที่ปรับแล้ว', () => {
  /* 170c (อาร์ต "ทั้งหน้าแบบไม่ได้เลย โหลมาก ใช้กว้างปกติกับพิเศษได้เต็มที่"): รวมผู้ก่อตั้ง+เส้นทาง+ตัวเลขเป็นเส้นเวลาเดียว (story) */
  const ids = ['ab2-hero', 'story', 'how', 'win', 'team', 'featured', 'named', 'company']
  const at = ids.map((id) => main.search(new RegExp(`(id|class)="${id}[" ]`)))
  assert.ok(at.every((n) => n >= 0), `ไม่มี ${ids.filter((_, i) => at[i] < 0)}`)
  assert.deepEqual(at, [...at].sort((a, b) => a - b))
})

test('ภาพทีมงานจริงจาก Drive · ไฟล์มีจริง · ไม่ใช้ภาพป้ายบริษัทอื่น', () => {
  const imgs = [...main.matchAll(/\/img\/about\/(ab-[a-z0-9-]+)-(?:640|960|1600)\.webp/g)].map((m) => m[1])
  /* 170e แบนเนอร์เหลือภาพเดียวตามที่อาร์ตสั่ง → ภาพจริงไม่ซ้ำทั้งหน้า 9 ภาพ (เดิมเกณฑ์ 10 ตอนแบนเนอร์มีหลายภาพ) */
  assert.ok(new Set(imgs).size >= 8, `ภาพจริง ${new Set(imgs).size}`)
  assert.doesNotMatch(main, /ab-sign/)
  for (const s of data.team.steps) for (const w of [640, 960, 1600]) assert.ok(pub(`/img/about/${s.img}-${w}.webp`), s.img)
})

test('ไอคอน 3D: 3WIN ชุดใหม่ + ช่วยคิด/จัดการ/จบงานชุดเดิม', () => {
  for (const n of ['win-buyer', 'win-wearer', 'win-seen', 'help-think', 'help-manage', 'help-finish']) assert.match(main, new RegExp(`/img/icons/${n}\\.webp`), n)
})

test('งานจริงที่ระบุชื่อ ≥ 10 งาน · ตัวเลขเฉพาะที่ทีมดีเผยแพร่เอง', () => {
  assert.ok(data.named.items.length >= 10)
  for (const it of data.named.items) assert.ok(text.includes(it.name), it.name)
  const qty = data.named.items.filter((i) => i.qty).map((i) => i.qty)
  assert.deepEqual(qty.sort(), ['กว่า 1,500 ตัว', 'กว่า 200 ตัว'].sort())
})

test('เส้นเวลา: 2018 → 19 มกราคม 2021 → วันนี้ + ตัวเลข · ไม่มีภาพหน้าคนที่เจน · ไม่มีคำ "โรงงาน"', () => {
  const f = main.slice(main.indexOf('id="story"'), main.indexOf('id="how"'))
  const t = f.replace(/<\/?t-[a-z]+>/g, '').replace(/<[^>]+>/g, ' ')
  for (const k of ['2018', '19 มกราคม 2021', 'วันนี้', 'คุณแฟ้บ', 'คุณทัช']) assert.ok(t.includes(k), k)
  assert.match(f, /data-countup/)
  assert.doesNotMatch(main, /founder-(ai|gen)/)
  assert.doesNotMatch(text, /โรงงาน/)
})

/* 170b อาร์ต (แคปแถบสารบัญ) "ลบ ทำหน้านี้ให้กระชับมากขึ้น เน้น highlight headline ข้อความแต่ละอัน" */
test('ไม่มีแถบสารบัญ · หัวข้อทุกส่วนมีคำไฮไลต์ส้ม', () => {
  assert.doesNotMatch(main, /data-toc|class="ab-toc/)
  for (const id of ['story-h', 'how-h', 'win-h', 'team-h', 'feat-h', 'named-h', 'logo-h', 'company-h']) {
    const h = main.match(new RegExp(`<h2[^>]*id="${id}"[^>]*>([\\s\\S]*?)</h2>`))
    assert.ok(h, id)
    assert.match(h[1], /class="hm-hl"/, id)
  }
})

/* 170d อาร์ต "banner ตัดบรรทัดเยอะเกิน มันแบบเดิมๆ" → 170e "ข้อความไว้กลาง เอาพื้นหลังรูปเดียวพอ ทำให้มันเฟี้ยวๆ"
   ภาพพื้นหลังภาพเดียวเต็มจอ (ภาพจริงจาก Drive) · ข้อความกลาง · "ความเป็นทีม" บนแถบส้มเอียงตัวดำ (memory photo-card-gradient-band) */
test('แบนเนอร์: ภาพพื้นหลังภาพเดียว · ข้อความกลาง · คำไฮไลต์บนแถบส้ม', () => {
  const at = main.indexOf('class="ab2-hero')
  const hero = main.slice(at, main.indexOf('</section>', at))
  assert.equal((hero.match(/<img\b/g) || []).length, 1)
  assert.match(hero, /class="ab2-hero__bg" src="\/img\/about\/ab-floor-/)
  /* 170f อาร์ต "ตัวหนังสือขาวล้วนมาได้" → ไม่มีแถบส้ม ไม่มีคำไฮไลต์ในแบนเนอร์ */
  assert.match(hero, /class="ab2-hero__big"/)
  assert.doesNotMatch(hero, /ab2-hero__bar|class="hm-hl"/)
  assert.doesNotMatch(hero, /ab2-lineup/)
})

/* 170i–k ลองเสื้อทีม → ทางการ + วัตถุ 3D → 170n อาร์ต "ภาพแรกเอาของหน้าแรกมาใช้ก็ได้" → ใช้เรื่องราว+การ์ดบริษัทชิ้นเดียวกับหน้าแรก (partial homeOriginStory)
   หัวข้อ v22 "จุดเริ่มต้นของทีมดี" อยู่กลาง · หน้าแรกเรียก partial เดียวกัน (ผลลัพธ์เหมือนเดิม) */
test('จุดเริ่มต้น: ชิ้นเรื่องราวเดียวกับหน้าแรก (ไทม์ไลน์ 4 ช่วง + การ์ดบริษัท)', () => {
  const f = main.slice(main.indexOf('id="story"'), main.indexOf('id="how"'))
  assert.equal((f.match(/class="hm-tl__step"/g) || []).length, 4)
  assert.match(f, /class="hm-origin__company"/)
  assert.doesNotMatch(f, /ab2-mile|ab2-kit/)
  const home = readFileSync(new URL('../src/partials/homeReference-teamdee-location.hbs', import.meta.url), 'utf8')
  assert.match(home, /\{\{> homeOriginStory\}\}/)
  assert.match(readFileSync(new URL('../site/about-us/index.html', import.meta.url), 'utf8'), /\{\{> homeOriginStory\}\}/)
})

/* 170o อาร์ต (แคป 3WIN) "รื้อแล้วทำใหม่ดีๆ เน้นภาพไม่เน้นตัวหนังสือ เอาแบบภาพเล่าเรื่อง" → ภาพจริง 3 ช่องต่อกันเป็นผืนเดียว · ไอคอน 3D + หัวข้อ + บรรทัดเดียว */
test('3WIN: ภาพจริง 3 ช่องเล่าเรื่อง · ตัวหนังสือสั้น', () => {
  const f = main.slice(main.indexOf('id="win"'), main.indexOf('id="team"'))
  const panels = [...f.matchAll(/<li class="ab2-tri__p">[\s\S]*?<\/li>/g)].map((m) => m[0])
  assert.equal(panels.length, 3)
  for (const p of panels) {
    assert.match(p, /<img class="ab2-tri__img" src="\/img\/[^"]+" [^>]*alt="[^"]+"/)
    assert.match(p, /\/img\/icons\/win-[a-z]+\.webp/)
    const d = p.replace(/<\/?t-[a-z]+>/g, '').match(/<p>([^<]*)<\/p>/)[1]
    assert.ok(d.length <= 48, `ยาวไป: ${d}`)
  }
  assert.doesNotMatch(f, /ab2-win__list|ab2-win__lead/)
})

/* 170p อาร์ต (แคปส่วนคลิป) "ทำดีๆหน่อย" → ตัวเล่น FB ขึ้นเอง (data-embed-auto แบบ /project/) · หัวข้อกลาง+ไฮไลต์ · การ์ด IG ทรง 9:16 ภาพจริงเป็นพื้น */
test('คลิป: ตัวเล่นขึ้นเอง · หัวข้อกลาง ไฮไลต์ · การ์ด IG ในสไตล์เดียวกัน', () => {
  const at = main.indexOf('id="clips"')
  const f = main.slice(at, main.indexOf('</section>', at))
  assert.match(f, /data-embed-auto/)
  assert.match(f, /<h2 id="clips-h"[^>]*text-center[^>]*>[\s\S]*?class="hm-hl"/)
  /* 170q อาร์ต "เอาแค่ fb ไปเอาคลิปมาได้เต็มที่ เอาให้เหมือนหน้าอื่นๆ" → เฉพาะคลิป Facebook ≥ 4 · ไม่มีการ์ด IG · ตารางคลิปแบบเดียวกับ /project/ (ไม่มีคลาสเฉพาะหน้า) */
  assert.doesNotMatch(f, /vslot--link|instagram\.com/)
  assert.ok((f.match(/<figure class="vslot vslot--fb">/g) || []).length >= 4)
  assert.doesNotMatch(main.slice(main.lastIndexOf('<section', at), at), /ab2-clips/)
})

/* 170r เส้นทาง FTI → 170s อาร์ต "เราจะไม่ใช้ตัวอย่างงาน … เจนรูปเสื้อหลายๆ ตัว แบบ 3D เฟี้ยวๆ" → "พื้นหลังสตูดีๆ ไม่รก" → เลือกแบบ 1
   ภาพเดียวเต็มจอ: เสื้อลายจริงของทีมดี 4 ตัวลอยในสตูดิโอเทาอุ่น (เจนจากไฟล์ลายจริง) · หัวข้อกลาง · ป้ายชนิดเสื้อลิงก์ไปหน้าสินค้า · บอกว่าเป็นภาพจำลองจากลายจริง */
test('ส่วนเสื้อทุกแบบ: ภาพสตูดิโอเดียว ภาพมือถือแยก · ป้ายชนิดเสื้อ 4 ลิงก์ · ไม่มีเคส FTI', () => {
  const at = main.indexOf('id="featured"')
  const f = main.slice(at, main.indexOf('</section>', at))
  assert.match(f, /<source media="\(max-width: 767px\)" srcset="\/img\/about\/ab-shirts-m-640\.webp/)
  assert.match(f, /<img class="ab2-wear__img" src="\/img\/about\/ab-shirts-1600\.webp"[^>]*alt="[^"]+"/)
  for (const w of [960, 1600, 2400]) assert.ok(pub(`/img/about/ab-shirts-${w}.webp`), w)
  for (const w of [640, 1080]) assert.ok(pub(`/img/about/ab-shirts-m-${w}.webp`), w)
  const tags = [...f.matchAll(/<li class="ab2-wear__tag"[^>]*><a href="([^"]+)"/g)].map((m) => m[1])
  assert.equal(tags.length, 4)
  assert.ok(tags.every((h) => /^\/[a-z0-9-]+\/$/.test(h)), tags.join())
  assert.match(f.replace(/<\/?t-[a-z]+>/g, ''), /ภาพจำลองจากลายเสื้อจริงของทีมดี/)
  assert.doesNotMatch(f, /FTI|ab-fabric-bg|ab2-feat__/)
})

/* 170t อาร์ต (แคปกำแพงชื่อ) "เจนพวกผังหรืออะไรก็ได้ เอาแบบเราภูมิใจ … เอารูปทั้งหมด" → ผัง 5 กลุ่มลูกค้า (ไอคอน 3D ชุดใหม่) + บอร์ดภาพจริง
   ภาพลูกค้าจริงจากรีวิว/เคสเท่านั้น (งานที่ไม่มีภาพ = ช่องตัวเลขหรือช่องไอคอน ไม่เจนภาพลูกค้า) · จำนวนกลุ่มนับจากข้อมูลจริง */
test('ทีมจริง: ผัง 5 กลุ่ม + บอร์ดภาพจริง ครบทุกงาน', () => {
  const at = main.indexOf('id="named"')
  const f = main.slice(at, main.indexOf('</section>', at))
  const groups = [...f.matchAll(/<li class="ab2-map__g"[\s\S]*?<\/li>/g)].map((m) => m[0])
  assert.equal(groups.length, 5)
  for (const g of groups) assert.match(g, /\/img\/icons\/team-[a-z]+\.webp/)
  const counts = groups.map((g) => Number(g.replace(/<\/?t-[a-z]+>/g, '').match(/(\d+) ทีม/)[1]))
  assert.equal(counts.reduce((a, b) => a + b, 0), data.named.items.length)
  /* 170u อาร์ต "เน้นๆ รูป ลดไล่สีส้มลง" → บอร์ดมีแต่ภาพจริง · งานที่ไม่มีภาพย้ายไปแถวชื่อใต้บอร์ด */
  const tiles = [...f.matchAll(/<li class="ab2-board__t[ "][\s\S]*?<\/li>/g)].map((m) => m[0])
  const withImg = data.named.items.filter((i) => i.img)
  assert.equal(tiles.length, withImg.length)
  assert.ok(tiles.length >= 12, `ภาพจริง ${tiles.length}`)
  for (const p of tiles) assert.match(p, /<img [^>]*src="\/img\/(review|case)\/[^"]+" [^>]*alt="[^"]+"/)
  assert.doesNotMatch(f, /ab2-board__t--(num|ico)/)
  const more = f.slice(f.indexOf('class="ab2-named__more"')).replace(/<[^>]+>/g, '')
  assert.ok(f.includes('class="ab2-named__more"'))
  for (const i of data.named.items.filter((x) => !x.img)) {
    assert.ok(more.includes(i.name), i.name)
    if (i.qty) assert.ok(more.includes(i.qty), i.qty)
  }
  assert.doesNotMatch(f, /class="ab2-wall"/)
})

/* 170v อาร์ต (แคปข้อมูลบริษัท) "ต่อ" → รวมข้อมูลบริษัท + นัดหมายเป็นส่วนเดียว (เดิมที่อยู่และปุ่มนัดเข้าพบซ้ำ 2 รอบ)
   ภาพหน้าออฟฟิศจริง (ชุดเดียวกับหน้าติดต่อ) · ตัดป้ายเหนือหัวข้อ หัวการ์ดซ้ำชื่อ และหมายเหตุ · ปุ่มขอเอกสารเปิดฟอร์มที่ติ๊กเอกสารให้แล้ว */
test('ข้อมูลบริษัท: ภาพออฟฟิศจริง · ข้อมูลไม่ซ้ำ · ขอเอกสารได้ทันที', () => {
  const at = main.indexOf('id="company"')
  const f = main.slice(at, main.indexOf('</section>', at))
  const t = f.replace(/<\/?t-[a-z]+>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  assert.match(f, /<img[^>]*src="\/img\/visit\/storefront-800\.webp"[^>]*alt="[^"]+"/)
  assert.doesNotMatch(f, /hm-eyebrow|ab-doc__note|ab-doc__h/)
  assert.equal((t.match(/บริษัท ดีดี ฟินิกซ์ จำกัด/g) || []).length, 1)
  assert.ok(t.includes('19 มกราคม 2021'))
  assert.match(f, /href="https:\/\/www\.google\.com\/maps\/[^"]+"/)
  assert.match(f, /href="[^"]*\/contact-us\/\?from=company-docs"/)
  for (const d of ['ใบเสนอราคา', 'หนังสือรับรองบริษัท', 'ภ.พ.20', 'ใบกำกับภาษีเต็มรูปแบบ']) assert.ok(t.includes(d), d)
  assert.doesNotMatch(main, /id="office"/)
  assert.equal((main.match(/data-where="about-(company|office)"/g) || []).length, 1)
})

/* 170w อาร์ต "ทำให้ทั้งหน้านี้กระชับขึ้นหน่อย" → ตัดคำโปรยใต้หัวข้อที่ซ้ำหัวข้อ (ช่วยคิด/ทีมงาน) · คำอธิบายการ์ดสั้นลง
   ระยะห่างส่วนเท่าหน้าแรก (56px เดสก์ท็อป) ตรวจด้วยภาพหน้าจอ */
test('กระชับ: หัวข้อช่วยคิด/ทีมงานไม่มีคำโปรย · คำอธิบายการ์ดไม่เกิน 50 ตัวอักษร', () => {
  for (const cls of ['ab2-how__head', 'ab2-team__head']) {
    const h = main.match(new RegExp(`<header class="${cls}">([\\s\\S]*?)</header>`))
    assert.ok(h, cls)
    assert.doesNotMatch(h[1], /<p[ >]/, cls)
  }
  for (const it of data.how.items) assert.ok(it.d.length <= 50, `${it.t}: ${it.d.length}`)
})

/* 170x อาร์ต (แคปกล่องปิดหน้า) → เลือก "รื้อใหม่เน้นรูป": ภาพลูกค้าจริงเต็มกล่อง · หัวข้อ + ปุ่ม LINE ปุ่มเดียว (ข้อความพิมพ์รอไว้เดิม)
   ตัดแชทจำลอง · หน้าแรกยังใช้ ctaBox เดิม · ลิงก์ฝากข้อมูลเหลือเป็นลิงก์ตัวหนังสือ */
test('กล่องปิดหน้า: ภาพลูกค้าจริงเต็มกล่อง · ปุ่ม LINE ปุ่มเดียว · ไม่มีแชทจำลอง', () => {
  const at = main.indexOf('id="cta"')
  assert.ok(at > main.indexOf('id="company"'))
  const f = main.slice(at, main.indexOf('</section>', at))
  assert.match(f, /<img[^>]*src="\/img\/review\/rv[0-9]+\.webp"[^>]*alt="[^"]+"/)
  assert.equal((f.match(/class="cb cb--p"/g) || []).length, 1)
  assert.equal((f.match(/class="cb /g) || []).length, 1)
  assert.match(f, /data-where="cta-about"/)
  assert.match(f, /href="https:\/\/line\.me\/[^"]*"/)
  assert.match(f, /href="[^"]*\/contact-us\/\?from=%2Fabout-us%2F"/)
  assert.doesNotMatch(f, /logo-team\.ai|cta-chat|ctab__chat/)
})
