# หน้างานปัก /embroidery/ โฉมใหม่ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยน /embroidery/ (product id `polo`) เป็นโครง pp-v2 แบบ /sublimation/ และลงข้อมูลไดรฟ์ "Info ปัก" ครบทุกชิ้น

**Architecture:** หน้าสินค้าโฉมใหม่ขับด้วย `src/data/pp-v2.json[id]` (แต่ละส่วนมีคีย์ = แสดง · ไม่มี = ไม่แสดง · `lean: true` = จบที่ FAQ) ประกอบใน `vite.config.js` บล็อก `pp2:` แล้ว render ใน `src/partials/productPage.hbs` · ข้อมูลโปโลจากไดรฟ์ (สเปกมาตรฐาน ผ้า สี ไซซ์) เก็บไฟล์ใหม่ `src/data/polo.json` ที่เดียว · ราคายังอยู่ `prices.json products.polo` (ไม่ย้าย)

**Tech Stack:** Vite + Handlebars → WordPress theme (`npm run build && npm run export:wp`) · node:test (`npm test`) · cwebp/dwebp · Magnific GPT 2.5 (hero)

**Spec:** `docs/superpowers/specs/2026-11-11-embroidery-page-design.md`

## Global Constraints

- ทุกตัวเลข/รหัสสี/ชื่อผ้ามาจากภาพในไดรฟ์ "Info ปัก" · ช่อง "-" ในไดรฟ์ (เนื้อผ้า แอ็นดูแรนซ์ · ดรายเทค) = `null` แสดง "สอบถามทีมงาน"
- ภาพ 3D 13–20.png = งานลูกค้าจริง (อาร์ตยืนยัน 11 พ.ย.) · ครอปแถบติดต่อท้ายภาพและโลโก้มุมออก
- ห้าม "โรงงาน" · ห้ามเคลมนอกข้อมูล · ห้าม emoji ไอคอน · ตัวหนังสือบน #FF6C00 ทึบ = ดำ · ภาพเจนมี "ภาพจำลอง" ถ้าเป็นฉากสมมติ
- ลำดับส่วนเท่ากับ /sublimation/ · ตัดส่วนที่มีแค่หน้าปักเดิม (`lean: true`)
- ไม่ commit/push จนอาร์ตสั่ง (CLAUDE.md กฎข้อ 2) — ขั้น "Commit" ในแผนนี้ = รายงานพร้อม commit
- ตรวจ 320 / 414 / 800 / 1440 ก่อนบอกเสร็จ

## Review Focus

1. ผ้าที่ไม่มีข้อมูลเนื้อผ้า (null) ต้องไม่แสดง "null"/ช่องว่าง → เทสใน Task 1 + Task 5
2. ปิด JS: แผงผ้าทุกผ้าต้องอ่านได้ครบ (ไม่ซ่อนด้วย CSS ตั้งต้น) → Task 5
3. ลิงก์จากหน้าอื่นที่ชี้ `/embroidery/#price` `#work` `#detail` `#production` `#clips` `#uses` `#wrap` ต้องไม่ตาย → Task 8
4. ชื่อผ้าต้องตรงกันทุกที่ (polo.json id = prices.json polo.cols id) → Task 1
5. ชาร์ตสีบนมือถือ 320px ต้องไม่ล้นจอ และรหัสสีอ่านได้ → Task 5 (ตรวจภาพ)

---

### Task 1: ข้อมูลโปโลจากไดรฟ์ `src/data/polo.json`

**Files:** Create `src/data/polo.json` · Test `tests/polo-data.test.js`

**Interfaces — Produces:** `polo.json` =
`{ source, spec: [{k, t, s}] ×6, minQty: 10, fabrics: [{ id, name, en, comp|null, gsm, feel, plus, use, note, tagline, tags: [4], colors: [{code, hex}] }] ×6, sizes: { men: [[size, chest, length]], women: [...], menNote, womenNote, tol, measure: [{t, d}] } }`
· fabric id ∈ `juti tc tricot pique endurance drytech` (ตรง `prices.json products.polo.cols[].id`)

- [ ] เขียนเทส: 6 ผ้า id ตรง prices.json · ผ้าละ ≥ 15 สี รหัสไม่ซ้ำในผ้าเดียว hex รูปแบบ `#rrggbb` · `endurance.comp === null && drytech.comp === null` · gsm = juti 145 · tc 220 · tricot 160 · pique 160 · endurance 210 · drytech 180 · ไซซ์ชาย 11 แถว XS–7XL (M = 40/28 · 7XL = 56/34) · หญิง 11 แถว (M = 36/26 · 7XL = 52/30) · spec มีคำ "6–6.5 นิ้ว" "3 เม็ด" "2 นิ้ว" "0.5 นิ้ว" · ราคา prices.json polo แถว 10–50 = juti 220 tc 260 tricot 260 pique 260 endurance 350 drytech 390 และ 2,001+ = 170 190 190 190 250 300
- [ ] รันเทส → FAIL (ไม่มีไฟล์)
- [ ] ถอดข้อมูลจากภาพ (ซูมทีละแผ่นที่ความละเอียดเต็ม scratchpad `emb/src`): ผ้า 6 แผ่น · แผ่นรวมชนิดผ้า (tags) · ตารางไซซ์ TD_02/03/04 (เทียบ 3 แผ่นว่าตรงกัน) · สีแต่ละวง: อ่าน hex จากกลางวงด้วย ffmpeg crop 1px
- [ ] รันเทส → PASS

### Task 2: ภาพงานปัก 3D จากไดรฟ์ + hero

**Files:** Create `public/img/emb-3d/{tdwhite,tdblack,pcm,decolgen,alfredo,scg,bluering,tbs}-{1200,760,480}.webp` · `public/img/pp-hero/polo-{2304,1280,800,m-768,m-480}.webp` · Test `tests/embroidery-v2.test.js`

- [ ] เทส: ไฟล์ภาพครบทุกขนาด · ภาพ 3D ขอบล่างไม่มีแถบติดต่อ (ตรวจด้วยตาเท่านั้น จดใน `_note`)
- [ ] ครอป 13–20.png: ตัดแถบล่าง (~y > 92%) + โลโก้มุมซ้ายบน → จตุรัส → cwebp q80
- [ ] เจน hero ตามสูตรหน้าบริษัท (corp-2304 อ้างอิง · 2304×800 · นายแบบนางแบบใส่โปโลทีมดี · เสื้อปักที่ยืนยัน 4 ตัวลอยเริ่ม ≥ 46%) + มือถือ 3:4
- [ ] เทส PASS

### Task 3: เปิด pp-v2 `polo` — hero · จุดเด่น · แบบเสื้อ 3D · ทำไมทีมดี · รีวิว · ออกแบบ · ขั้นตอน · คลังรีวิว · ชำระเงิน · FAQ

**Files:** Modify `src/data/pp-v2.json` (คีย์ `polo`) · `vite.config.js` บล็อก `pp2:` (แถวแบบเสื้อรับ `items` ตรง) · `src/partials/pp2Designs.hbs` · Test `tests/embroidery-v2.test.js`

**Interfaces:** `pp-v2.polo.designs.rows[]` = `{ t, garments }` (ดึงจาก designs.json เดิม) หรือ `{ t, items: [{img, small, caption, alt}] }` (ภาพตรง)

- [ ] เทส: `dist-wp/embroidery/index.html` ลำดับ section id เท่ากับ /sublimation/ (band-hero · pp2-hl · pp2-dz · pp2-pf · reviews · customize · fabric · options · size · real-shirts · order · *-review-wall · faq) · ไม่มี section `production` `clips` `uses` `wrap` `price` `detail` `work` · จุดเด่นมี 6 ข้อจาก polo.json spec · แถวแบบ 3D แรกมีภาพ emb-3d 8 ภาพ alt มีชื่อแบรนด์
- [ ] FAIL → เขียนข้อมูล polo (ข้อความงานปักจากข้อมูลเว็บเดิม product-pages.json polo · ไม่แต่งเคลม) · reviews คัดรีวิวที่รูปเห็นโปโลปัก · `lean: true`
- [ ] PASS · build + export

### Task 4: ทรงและคอ (แบบมาตรฐาน + ตัวเลือกที่เห็นในงานจริง)

**Files:** Create `src/partials/pp2PoloSpec.hbs` · Modify `productPage.hbs` (แทน pp2Types เมื่อ `pp2.poloSpec`) · CSS `src/styles/product-page.css`

- [ ] เทส: section `options` มีสเปก 6 ข้อจาก polo.json + ตัวเลือก (คอซิป · ขลิบ · กระเป๋า · ต่อสี) แต่ละข้อลิงก์ภาพ emb-3d ที่เห็นจริง
- [ ] FAIL → ทำ → PASS

### Task 5: ผ้า + สี + ราคา (แผงเดียว)

**Files:** Create `src/partials/pp2PoloFabric.hbs` · `src/js/polo-fabric.js` · CSS ใน `product-page.css` · Modify `vite.config.js` (ประกอบ fabrics + ราคาจาก prices.json + LINE ask) · Test `tests/polo-fabric.test.js`

**Interfaces:** ข้อมูลที่ partial ได้: `pp2.poloFabric = { h, p, fabrics: [{...polo.json fabric, prices: [{label, price}], ask}] }` · ปุ่มเลือกผ้า `button[role=tab][data-fab=id]` · แผง `[role=tabpanel][data-fab=id]`

- [ ] เทส: 6 แท็บ · แผงละ 6 ราคาตรง prices.json · วงสีจำนวนเท่า polo.json พร้อมรหัสเป็นข้อความ · comp null → "สอบถามทีมงาน" · ไม่มีคำ "null"/"undefined" · ลิงก์ LINE มีชื่อผ้า · HTML ตั้งต้นไม่มี `hidden` บนแผง (ซ่อนด้วย JS ตอนโหลดเท่านั้น)
- [ ] FAIL → ทำ (frontend-design/impeccable · ลิงก์ลูกศรวงกลมกลาง) → PASS
- [ ] ตรวจภาพ 320/414/800/1440 · คีย์บอร์ดเลื่อนแท็บด้วยลูกศร

### Task 6: ไซซ์โปโล ชาย/หญิง

**Files:** Modify `src/partials/pp2Sizes.hbs` (รับ `tables: [{t, note, rows}]` แทน adult/kids เมื่อมี) · `vite.config.js` (polo sizes จาก polo.json)

- [ ] เทส: section `size` หน้า /embroidery/ มี 2 ตาราง "ผู้ชาย" "ผู้หญิง" ค่าจาก polo.json · หน้า /sublimation/ ตารางเดิมไม่เปลี่ยน (เทียบ snapshot ค่า M 40/27)
- [ ] FAIL → ทำ → PASS

### Task 7: เสื้อจริงจากออเดอร์ลูกค้า (โปโลปัก)

**Files:** Modify `src/data/pp-v2.json polo.real` · ภาพ `public/img/real-even/` ถ้าต้องครอปเพิ่ม

- [ ] คัดรูปถ่ายโปโลปักจริง (home-work-showcase mannequin + customers.json) ตรวจด้วยตาว่าเป็นงานปัก · เทส: ทุกรูปมีไฟล์ · alt มี "ปัก"
- [ ] ทำ → PASS

### Task 8: เก็บกวาด + ตรวจทั้งหน้า

**Files:** Modify ลิงก์ที่ชี้ anchor เก่าของ /embroidery/ (grep `embroidery/#` และ `url 'products' 'polo'` + `#`) · tests เดิมที่อ้างส่วนเก่า (`v22-structure` ฯลฯ) · `PLAN.md`

- [ ] เทส: ทุก `href` ใน dist-wp ที่ชี้ `/embroidery/#x` มี `id="x"` ในหน้า
- [ ] FAIL → แก้ลิงก์ → PASS · `npm test` ทั้งชุดเขียว
- [ ] ตรวจภาพ 320/414/800/1440 ทั้งหน้า (ล้นจอ · ซ้ำ · หัวข้อทับ hero) · better-interface + accessibility
- [ ] PLAN.md บันทึกรอบ · pgrep · รายงานพร้อม commit
