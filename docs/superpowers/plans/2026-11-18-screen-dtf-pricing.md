# สกรีน DTF ราคาใหม่ + เครื่องคำนวณครบ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ราคา ขั้นต่ำ วันผลิต เงื่อนไขสกรีนทั้งเว็บ = สไลด์ "ขายงานสกรีน DTF" (17 พ.ย. 2026) และเครื่องคำนวณคิดครบ (บริการ · รุ่นเสื้อ · จำนวน · ลาย 1–3 จุด · ตัว 2XL+)

**Architecture:** ข้อมูลสกรีนแบบใหม่อยู่ที่ `prices.json → products.screen` ที่เดียว (เมทริกซ์ขนาดลาย × ช่วงจำนวน) · ตรรกะคิดราคาอยู่ในโมดูลบริสุทธิ์ใหม่ `src/js/screen-price.js` (ใช้ทั้งเบราว์เซอร์และเทส) · ฟังก์ชันราคาเดิมที่อ่าน `bands` (prices.js · seo-schema.js · llms.js) อ่านผ่านตัวแปลง `bandsOf(p)` ที่สร้างแถว "เริ่ม" จากเมทริกซ์ ไม่เก็บตัวเลขซ้ำ

**Tech Stack:** Vite + Handlebars (ต้นแบบ) → export ธีม WordPress · Node test runner (`node --test`) · PHP-wasm เทสธีม

**Spec:** `docs/superpowers/specs/2026-11-18-screen-dtf-pricing-design.md` (ตารางราคา กติกา ตัวอย่าง อยู่ในนั้นครบ — ตัวเลขทุกตัวในแผนนี้คัดจากสเปก)

## Global Constraints

- ตัวเลขสกรีนทุกตัวมาจาก `products.screen` ใน prices.json · ห้ามพิมพ์ราคา/ขั้นต่ำ/วันผลิตของสกรีนซ้ำในไฟล์อื่น (ยกเว้นข้อความ FAQ ที่ต้องเป็นประโยค — ใช้ตัวเลขเดียวกับสเปก และมีเทสเทียบ)
- ชื่อเทคนิค "DTF" ทั้งเว็บ · "หลายคนเรียก DFT" ได้ 1 จุดในหน้า /screen-printing/ · ไม่แตะชื่อบทความเก่าใน `src/data/legacy-posts.json`
- ขั้นต่ำสกรีน 5 ตัว (เสื้อของคุณ 20) · คำว่า "เริ่ม 1 ตัว" / "ไม่มีขั้นต่ำ" (สกรีน) / "3–14 วัน" ต้องไม่เหลือ
- "ทุกไซซ์ราคาเดียว" ใช้กับสินค้าอื่นได้ แต่สกรีนต้องบอก 2XL ขึ้นไป +20
- ห้ามขึ้นเว็บ: HUB · มั่ง · หัวหน้าทีม · "เซลห้าม" · "ส่ง LINE HUB" · รหัสกติกา A1–A6 C7 D1–D9 F4 · บริการปริ้นฟิล์ม · ภาพจำลอง AI จากสไลด์
- ห้ามใช้คำว่า "โรงงาน" · ตัวอักษรบนพื้นส้ม #FF6C00 เป็นสีดำ · ไม่ใช้ emoji เป็นไอคอน · ไม่เพิ่ม npm package
- ตารางราคาโชว์ครบบนหน้า ไม่ซ่อนในแท็บ/ปุ่มกดเปิด
- คำสั่งเทส: `PHP_WASM_MODULES=/Users/artist/.npm/_npx/e1b613fb7936df5b/node_modules npm test` · หลังแก้ข้อมูล/แม่แบบ: `npm run build && npm run export:wp && npm run check`
- ไม่ commit/push เอง (CLAUDE.md กฎข้อ 2) — ขั้น "Commit" ในแผน = รายงานว่าพร้อม commit

## Review Focus

- จำนวนตรงขอบช่วง (20/21 · 50/51 · 100/101 · 300/301 · 500/501 · 1000/1001) ต้องตกช่วงถูก → เทสใน Task 2
- จุดเพิ่มตอน 5–20 ตัว ใช้ช่อง 20–50 (ไม่ใช่ undefined/0) → เทสใน Task 2
- ลูกค้ากรอกลายเล็กก่อนลายใหญ่ (เช่น A7 แล้ว A3) → ลายใหญ่สุดต้องเป็นจุดแรกเสมอ → เทสใน Task 2
- จำนวนตัว 2XL+ มากกว่าจำนวนทั้งหมด / Oversize กับ 2XL+ (ห้ามบวก +20) → เทสใน Task 2
- ลิงก์เดิม `/calculations/?kind=screen-oversize&qty=30` ต้องเปิดแล้วได้ Oversize 30 ตัว ไม่ว่าง/ไม่พัง → เทสใน Task 4

---

### Task 1: ข้อมูลสกรีนแบบใหม่ใน prices.json + lead-times

**Files:**
- Modify: `src/data/prices.json` (products.screen ทั้งก้อน · `source.screen` → สไลด์ 17 พ.ย.)
- Modify: `src/data/lead-times.json` (screen)
- Test: `tests/screen-data-1118.test.js` (ใหม่)

**Interfaces — Produces:** `products.screen` รูปแบบ
```json
{ "tech": "DTF", "minQty": 5, "maxQty": 1000, "box": "steps",
  "cols": [{ "id": "premium", "name": "Premium C32" }, { "id": "oversize", "name": "Oversize C20" }],
  "sizes": [{ "id": "A7", "cm": "7 × 10", "use": "อกซ้าย · แขน · คอหลัง" }, …A6 "10 × 15" "โลโก้กลางอก", A5 "15 × 20" "กลางอก", A4 "20 × 30" "หน้าอก · หลัง", A3 "30 × 40" "เต็มหลัง · เต็มหน้า"],
  "own":      { "bands": [[5,20],[21,50],[51,100],[101,300],[301,500],[501,1000]], "first": { "A7": [220,190,170,155,150,145], … } },
  "extra":    { "bands": [[20,50],[51,100],[101,300],[301,500],[501,1000]], "price": { "A7": [25,20,20,15,15], … }, "maxSpots": 3 },
  "customer": { "minQty": 20, "bands": [[20,50],…], "first": { "A7": [35,30,25,20,18], … } },
  "shirts": [ { "id": "premium", "name": "Premium Cotton C32 Comb", "fit": "ทรงปกติ", "code": "TPC121", "add": 0, "bigAdd": 20, "bigFrom": "2XL",
                "colors": [["ดำ","#202020"],["ขาว","#fafafa"],["กรม","#242c40"],["ครีม","#eee4cc"],["เบจ","#c5b598"],["ควันบุหรี่","#969892"],["ช็อกโกแลต","#4d3c30"],["ฟ้า","#bcd6ee","สอบถามสต็อก"]],
                "sizes": [["S",38,26],["M",40,27],["L",42,28],["XL",44,29],["2XL",46,30],["3XL",48,31],["4XL",50,32],["5XL",52,33]], "sizeNote": "4XL–5XL มีเฉพาะดำ / ขาว · ดำ / ขาว มีถึง 7XL สอบถามได้" },
              { "id": "oversize", "name": "Oversize Cotton C20 Comb", "fit": "ไหล่ตก ทรงหลวม", "code": "TOV121", "add": 30, "bigAdd": 0,
                "colors": [["ดำ","#202020"],["ขาว","#fafafa"]], "sizes": [["S",42,28],["L",46,30.5],["2XL",52,32]] } ],
  "shipping": { "upTo": 20, "fee": 50 }, "freeDesignFrom": 21, "deposit": 300, "payFullBelow": 3000,
  "sampleFreeFrom": 100, "fileFix": 100, "nameAdd": 10, "quoteDays": 15,
  "lead": [[1,50,"1–2 วัน"],[51,100,"3–5 วัน"],[101,300,"7 วัน"]], "leadMore": "300 ตัวขึ้นไป แจ้งวันตามงาน",
  "rush": "งานด่วนรับถึง 100 ตัว ภายใน 2 วันทำการ ไม่บวกค่าด่วน",
  "calc": [{ "kind": "screen", "name": "เสื้อสกรีน DTF" }], "calcSub": "เลือกขนาดลาย 1–3 จุด", "include": { "short": "รวมสกรีน 1 จุด", "long": "รวมสกรีน 1 จุด · จุดเพิ่มคิดตามขนาดลาย สูงสุด 3 จุด" },
  "included": ["VAT 7% + ใบกำกับเต็มรูป", "สกรีน 1 จุด", "ส่งฟรีตั้งแต่ 21 ตัว", "2XL ขึ้นไป +20 บาท/ตัว"], "ask": "ทักทีมดีประเมิน" }
```
(สีเดิมของเว็บใช้ hex ชุดเดิม · ฟ้าใหม่ใช้ #bcd6ee) · `lead-times.json → screen`: `{ "tech": "งานสกรีน DTF", "days": "1–7 วัน", "more": "1–50 ตัว 1–2 วัน · 51–100 ตัว 3–5 วัน · 101–300 ตัว 7 วัน · 300 ตัวขึ้นไปแจ้งตามงาน" }`

- [ ] **Step 1: เขียนเทส `screen-data-1118.test.js`** — เทียบทุกแถวของ 3 เมทริกซ์กับตารางในสเปก (คัดตัวเลขลงเทสตรงๆ) · `minQty===5` · `customer.minQty===20` · ทุกเมทริกซ์ยาวเท่าจำนวนช่วง · ช่วงไม่ซ้อน/ไม่เว้น · `shirts[0].colors.length===8` · `shirts[1].add===30` · `lead-times.screen.days==='1–7 วัน'` · ไม่มีคำว่า HUB/มั่ง/DFT ใน products.screen
- [ ] **Step 2: รันให้พัง** `node --test tests/screen-data-1118.test.js` → FAIL
- [ ] **Step 3: ใส่ข้อมูลตาม Interfaces** (ลบ `bands`/`notes`/`calc` เดิมของ screen)
- [ ] **Step 4: รันให้ผ่าน** (เทสเดิมที่พังจากการลบ bands แก้ใน Task 3 — จดรายชื่อไว้)
- [ ] **Step 5: รายงานพร้อม commit** `feat(screen): DTF price matrices from the 17 Nov 2026 sales deck`

### Task 2: เครื่องคิดราคาสกรีน `src/js/screen-price.js`

**Files:** Create `src/js/screen-price.js` · Test `tests/screen-price-1118.test.js`

**Interfaces — Produces:**
- `bandIndex(bands: [number, number][], qty: number) → number` (−1 = นอกช่วง)
- `screenQuote(S, { service: 'own'|'customer', shirt: 'premium'|'oversize', qty: number, spots: ('A7'|'A6'|'A5'|'A4'|'A3')[], big: number }) → { ok, reason?: 'belowMin'|'aboveMax'|'tooManySpots'|'noSpot', min?, unit, total, lines: {label, per, amount}[], spots: string[] /*เรียงใหญ่→เล็ก*/, shipping, lead, pay: { deposit, atProduction, beforeShip, full } }`
- `screenLead(S, qty) → string` · `screenPay(S, total) → { deposit, atProduction, beforeShip, full }`
- `screenFrom(S, col) → number[]` (ราคาจุดแรกต่ำสุดของแต่ละช่วง own · col oversize = +add) — ใช้ใน Task 3

กติกา: เรียง spots ใหญ่→เล็กตามลำดับ `sizes` · จุดแรกจาก `own.first`/`customer.first` ตามช่วงของ qty · จุดเพิ่มจาก `extra.price` ช่วงของ qty (qty < 20 ใช้ช่องแรก) · unit = first + Σextra + shirt.add (own เท่านั้น) · total = unit×qty + big×shirt.bigAdd (own) + (service own && qty ≤ shipping.upTo ? fee : 0) · `big` ตัดที่ 0..qty · pay: total < payFullBelow → full=total, deposit 300 รวมอยู่ใน full; ไม่งั้น atProduction = round(total/2) − 300, beforeShip = total − round(total/2)

- [ ] **Step 1: เขียนเทส** — ตัวอย่าง 11 แถวในสเปกตรงทุกตัว (เช่น `screenQuote(S,{service:'own',shirt:'premium',qty:35,spots:['A4'],big:3}).total === 7410` · `qty:120 spots:['A7','A3','A7'] → unit 240, total 28800, spots ['A3','A7','A7']` · `customer qty:15 → ok:false reason:'belowMin' min:20` · `own qty:20 A4 → 4450` · `own qty:21 A4 → 4410` · `screenPay(S,7410) → {deposit:300, atProduction:3405, beforeShip:3705}`) + Review Focus: ขอบช่วงทุกคู่ (`bandIndex` 20→0, 21→1, …, 1000→5, 1001→−1) · `qty:10 spots:['A4','A7']` จุดเพิ่ม = 25 · `oversize big:5` ไม่บวก +20 · `big:99 qty:30` นับแค่ 30 · `spots: 4 จุด → tooManySpots` · `qty:1001 → aboveMax` · `screenLead(S,50)==='1–2 วัน'`, `(S,51)==='3–5 วัน'`, `(S,301)` = leadMore
- [ ] **Step 2: รันให้พัง** → FAIL (module not found)
- [ ] **Step 3: เขียน `screen-price.js`** ตาม Interfaces/กติกา (ไม่อ่าน DOM · ไม่ import อะไรนอกจาก helper format ถ้าจำเป็น)
- [ ] **Step 4: รันให้ผ่าน**
- [ ] **Step 5: รายงานพร้อม commit** `feat(screen): price engine for DTF matrices, extra spots, oversize and big sizes`

### Task 3: ฟังก์ชันราคาเดิมอ่านข้อมูลใหม่ (prices.js · seo-schema.js · llms.js)

**Files:** Modify `src/js/prices.js` · `src/js/seo-schema.js` · `src/build/llms.js` · Tests: `tests/prices.test.js` `tests/estimate.test.js` (ส่วนที่ไม่ใช่สกรีนคงเดิม) `tests/price-compare.test.js` `tests/confidence.test.js` `tests/seo-schema.test.js` `tests/llms-txt.test.js`

**Interfaces:**
- Consumes: `screenFrom(S, col)` (Task 2)
- Produces: `bandsOf(p) → {min,max,price}[]` (export จาก prices.js · สกรีน = own.bands + price {premium: screenFrom(S,'premium')[i], oversize: screenFrom(S,'oversize')[i]} · สินค้าอื่น = p.bands) · ฟังก์ชันเดิมทุกตัวในไฟล์ที่อ่าน `p.bands` เปลี่ยนเป็น `bandsOf(p)`

ค่าที่ต้องได้ (จากสเปก): heroPrice/priceFact สกรีน = "220 บาท/ตัว (5–20 ตัว)" · box "220 → 145" · useQuote foot ใช้ "เสื้อสกรีนเริ่ม 5 ตัว" (อ่าน `products.screen.minQty`) · `productSchema` สกรีน `lowPrice 145, highPrice 245, eligibleQuantity.minValue 5` (คอลัมน์ premium เท่านั้น · จุดแรก) · `priceRangeOf` ใช้ราคาจุดแรก premium ของสกรีน · llms บรรทัดสกรีน: `- สกรีน DTF เริ่ม 5 ตัว: Premium C32 220 · Oversize C20 250 บาท/ตัว (5–20 ตัว · รวมสกรีน 1 จุด · ลาย A7–A4)` และบรรทัดเงื่อนไข `(สกรีน DTF เริ่ม 5 ตัว)` · "ทุกไซซ์ราคาเดียว (สกรีน 2XL ขึ้นไป +20)"

- [ ] **Step 1: แก้เทสเดิมให้เป็นตัวเลขใหม่ก่อน** (290→220, 1→5, 1–20→5–20, "฿170–390" → ค่าที่ priceRangeOf ใหม่ได้ ซึ่งคำนวณจากข้อมูลจริง: min ของทุกสินค้าที่ไม่ใช่ print/warmup) และเพิ่มเทส `bandsOf(screen)` 6 แถว `[220,190,170,155,150,145]` / oversize `[250,220,200,185,180,175]`
- [ ] **Step 2: รันให้พัง**
- [ ] **Step 3: ทำ `bandsOf` + แทนที่การอ่าน bands · llms.js อ่าน `products.screen.minQty` แทนเลข 1 ที่พิมพ์ไว้**
- [ ] **Step 4: รันเทสทั้งชุด** ผ่านทั้งหมด ยกเว้นเทสเครื่องคำนวณสกรีน (Task 4)
- [ ] **Step 5: รายงานพร้อม commit** `refactor(prices): read screen prices through bandsOf`

### Task 4: เครื่องคำนวณ /calculations/

**Files:** Modify `src/js/estimate.js` `src/js/prices.js (calcKinds, calcPricing)` `src/js/calc-page.js` `site/calculations/index.html` `src/styles/page-calculations.css` · Test `tests/estimate.test.js` (ส่วนสกรีน) + `tests/calc-screen-1118.test.js`

**Interfaces:**
- Consumes: `screenQuote`, `screenLead`, `screenPay` (Task 2)
- Produces: kind เดียว `{ id: 'screen', screen: S, minQty: 5, from: 220 }` จาก `calcKinds` · `estimate(K, { kind:'screen', qty, shirt, service, spots, big })` คืนรูปแบบเดิม (`ok, unit, total, belowMin, qty, kind`) + `screen: screenQuote(...)` · `readCalcQuery` อ่าน `?kind=screen&qty=&svc=own|customer&shirt=premium|oversize&spots=A3,A7&big=3` และแปลง `kind=screen-oversize` → `{kind:'screen', shirt:'oversize'}` · `calcSearch` เขียนพารามิเตอร์ชุดเดียวกัน · `lineText`/`fromText`/`shareText` สกรีนมีบรรทัด: บริการ · เสื้อ · จำนวน · ลายแต่ละจุด (ขนาด + ซม.) · ตัว 2XL+ · ราคาต่อตัว · ค่าส่ง · ยอดรวม · วันผลิต
- UI (ในการ์ดเครื่องคิดเดิม เมื่อเลือกการ์ด "เสื้อสกรีน DTF"): แผง `[data-screen]` มี radio บริการ 2 ตัว · radio เสื้อ 2 ตัว (ซ่อนเมื่อบริการ = เสื้อของคุณ) · จุดลาย 1–3 แถว (select ขนาด A7–A3 พร้อมซม. + ปุ่มลบ · ปุ่ม "เพิ่มจุด" ซ่อนเมื่อครบ 3) · ช่องตัวเลข "ไซซ์ 2XL ขึ้นไป กี่ตัว" (เฉพาะ C32) · ใบประเมินแสดง lines แตกรายการ + วันผลิต + แผนชำระ · ทุก input มี label · แป้นพิมพ์ใช้ได้ · ขั้นต่ำเปลี่ยนตามบริการ (5/20)
- ตาราง "ราคาต่อตัวตามจำนวน" (priceTable): แถวสกรีนเป็น "เริ่ม 220 บาท/ตัว · ดูตารางเต็มที่หน้าเสื้อสกรีน" (ลิงก์)

- [ ] **Step 1: เขียนเทส** `estimate` ด้วย 3 ตัวอย่างจากสเปก (35 ตัว A4 big 3 → total 7410 · oversize 30 A7 → unit 220 · customer 40 A4+A7 → 3400) · `readCalcQuery(K,'?kind=screen-oversize&qty=30')` → `{kind:'screen', shirt:'oversize', qty:30}` · `readCalcQuery(K,'?kind=screen&svc=customer&qty=10')` → qty null (ต่ำกว่า 20) · `calcSearch` round-trip · `lineText` มี "ลายจุดที่ 1: A3 (30 × 40 ซม.)" และ "ค่าส่ง 50 บาท" เมื่อ 20 ตัว · เทส HTML ที่ build แล้ว (`dist`/export) ว่ามี `[data-screen]` · label ทุก input · ไม่มีคำว่า DFT
- [ ] **Step 2: รันให้พัง**
- [ ] **Step 3: ทำตาม Interfaces** (ตรรกะคิดราคาอยู่ใน screen-price.js เท่านั้น · calc-page.js แค่อ่าน/เขียนฟอร์ม)
- [ ] **Step 4: เทสผ่าน + build + เปิด local WP `/calculations/?kind=screen` ลองกรอก 3 ตัวอย่าง ยอดตรง · ถ่ายจอ 1440 / 768 / 414**
- [ ] **Step 5: รายงานพร้อม commit** `feat(calc): full DTF screen calculator (service, shirt, 1–3 print sizes, big sizes)`

### Task 5: หน้า /screen-printing/

**Files:** Modify `src/content/product/screen.json` · `src/partials/screenShowcase.hbs` · `src/build/pages/products.js` (ลบ `screenColors`/`screenExtras` ที่พิมพ์ไว้ · ส่ง `screen: products.screen` + `screenTables` ที่สร้างจากเมทริกซ์) · `site/screen-printing/index.html` (title/meta) · Create `src/partials/screenPrice.hbs` `src/partials/screenCustomer.hbs` `src/partials/screenSizes.hbs` (กรอบลาย A7–A3 เป็น SVG เส้น) · `src/styles/product-page.css` (หรือไฟล์ที่ส่วนสกรีนใช้อยู่) · Test `tests/screen-page-1118.test.js`

**Interfaces — Consumes:** `products.screen` (Task 1) · `screenQuote` สำหรับตัวอย่าง 2 ตัวอย่างบนหน้า (คำนวณตอน build ไม่พิมพ์ตัวเลขเอง)

เนื้อหา (ตามสเปกหัวข้อ "หน้า /screen-printing/"):
- title `รับทำเสื้อสกรีน DTF เริ่ม 5 ตัว ราคารวม VAT | TEAMDEE` · description: `สั่งทำเสื้อสกรีน DTF เริ่ม 5 ตัว ราคาเริ่ม 145–245 บาท/ตัว รวม VAT เลือกเสื้อ Cotton C32 8 สี หรือ Oversize เลือกขนาดลาย A7–A3 ได้ 3 จุด หรือส่งเสื้อของคุณมาสกรีน` (ตรวจความยาวด้วย npm run check)
- hero lead: เอ่ย "DTF (หลายคนเรียก DFT)" 1 ครั้ง
- ส่วนราคา (#price): ตาราง 3 ตาราง (หัวคอลัมน์ = ช่วงจำนวน · แถว = ขนาดลาย + ซม.) · วิธีคิด 3 ขั้น · ตัวอย่าง "80 ตัว หน้า A4 + หลัง A4 = 225 บาท/ตัว · 18,000" และ "120 ตัว หลัง A3 + อก A7 + แขน A7 = 240 · 28,800" · หมายเหตุ Oversize +30 / 2XL+ +20 / 5–20 ตัว ค่าส่ง 50 · ปุ่มไปเครื่องคำนวณ `?kind=screen`
- ส่วนเสื้อ: 2 รุ่น สี (ฟ้า = "สอบถามสต็อก") ตารางไซซ์ (2XL+ เน้นว่า +20 · 4XL–5XL ดำ/ขาว) · Oversize +30
- ส่วนขนาดลาย 5 ขนาด (SVG เส้นเสื้อ + กรอบ) + "ลายเกินกรอบใช้ราคาขนาดถัดไป"
- ส่วนใหม่ #own-shirt "สกรีนบนเสื้อของคุณ": ราคา (ตาราง) · ขั้นต่ำ 20 · ผ้าที่รับ / ได้แต่ระวัง / ไม่รับ · ส่งรูปป้ายเสื้อถ้าไม่แน่ใจ · ค่าส่งไป–กลับ · เคลมเสื้อเสียจากการผลิต
- วันผลิต · ขั้นตอนชำระ (มัดจำ 300 → 50% → ก่อนส่ง · ต่ำกว่า 3,000 จ่ายเต็ม · ยืนราคา 15 วันทำการ) · ไฟล์ที่รับ (+100 แก้ไฟล์) · ยืนยันด้วยรูปฟิล์มจริง · ตัวอย่างฟรี 100 ตัวขึ้นไป · FAQ ปรับตัวเลข (และ FAQPage schema ตาม)
- กติกาเพิ่มเติม (ส่วนราคาหรือ FAQ): ลายเดิมต่างขนาดรวมจำนวนได้ คิดราคาตามขนาด · ลายต่างกันไม่รวมจำนวน · ใส่ชื่อไม่ซ้ำ +10 บาท/ชื่อ · สั่งซ้ำลายเดิมใน 30 วันได้เรทเดิม (ขั้นต่ำ 5) · เพิ่มจำนวนได้ในราคาช่วงเดิม ลดไม่ได้ · เคลมลายหลุดจากการผลิต แจ้งใน 7 วันพร้อมรูป · ไม่รับ: ซิลค์สกรีน เลเซอร์ งาน 3D · เกิน 3 จุด / ตำแหน่งพิเศษ / เกิน 1,000 ตัว / ลายเกิน A3 = ทักทีมดีประเมิน (ตอบใน 1 วันทำการ)
- ใช้ส่วนประกอบเดิมของหน้า (หัวส่วน · การ์ด · ตาราง) · ภาพจริงที่หน้ามีอยู่แล้วเท่านั้น

- [ ] **Step 1: เขียนเทส** บน `wp-theme/teamdee/build/pages/screen-printing.body.html` + `pages.json`: title ตรง · ตัวเลขในตาราง = เมทริกซ์ (อ่าน prices.json มาเทียบ ไม่พิมพ์ซ้ำในเทส) · มีตัวอย่าง 18,000 และ 28,800 · มี `id="own-shirt"` · DFT ปรากฏ 1 ครั้ง · ไม่มี "เริ่ม 1 ตัว" "ไม่มีขั้นต่ำ" "3–14" "ทุกไซซ์ราคาเดียว" "HUB" "มั่ง" "โรงงาน" · ไม่มี `<details` ครอบตารางราคา · H1 เดียว
- [ ] **Step 2: รันให้พัง** (หลัง `npm run build && npm run export:wp`)
- [ ] **Step 3: ทำ** ตามเนื้อหาข้างบน
- [ ] **Step 4: เทสผ่าน · check ผ่าน · ถ่ายจอ 1440 / 768 / 414 ไม่ล้นจอ ตารางมือถือเลื่อนข้างพร้อมเงาบอกขอบ (คลาสเดียวกับตารางบทความ หรือ wrapper ที่หน้าสินค้าใช้อยู่)**
- [ ] **Step 5: รายงานพร้อม commit** `feat(screen-page): DTF price tables, shirts, print sizes and own-shirt service`

### Task 6: ข้อความทั้งเว็บ + DFT→DTF + ส่วนที่อ่านวันผลิต

**Files:** `src/data/faq.json` (5, 13, 199, 299, 371, screen[]) · `src/data/home.json` (126, 487, 491, 519) · `src/partials/homeReference-faq.hbs` · `site/about-us/index.html:168` · `site/contact-us/index.html:196-197` (ข้อความ "เสื้อสกรีนเริ่ม 5 ตัว" · input min คงเป็น 1 เพราะใช้กับทุกสินค้า) · `src/content/use/*.json` (การ์ด "เริ่ม 1 ตัว" → อ่านค่า/เขียน "เริ่ม 5 ตัว") · `src/data/guides.json` + `src/data/guide-pages.json` (screen: ราคา 290 → ตามเมทริกซ์ · "1 ตัว" → 5 · ตอบคำถามเสื้อลูกค้าแทน placeholder [ยืนยัน…]) · `src/partials/guideProcessStudio.hbs` (C32 8 สี) · `src/build/data.js` (การ์ดบริการหน้าแรก) · `src/data/products.json` `src/data/techniques.json` `src/data/sizing.json` `src/data/search-synonyms.json` (DTF หลัก · ค้น "dft" ยังเจอหน้าสกรีน) · `src/partials/footer.hbs` `src/partials/usePage.hbs` · `site/index.html` `site/screen-printing-order-guide/index.html` meta · `src/js/need-by.js` (สกรีนใช้วันสูงสุด 7) · `scripts/v22/*.mjs` (ส่วนสกรีน: ลบค่าที่พิมพ์ไว้ หรือหยุดเขียนทับ screen — ใส่คอมเมนต์อ้างสเปก) · ไฟล์อื่นที่มีคำว่า DFT ตามรายการใน agent map (ยกเว้น legacy-posts.json)
**Test:** `tests/screen-copy-1118.test.js` (ใหม่) + แก้เทสเดิมที่ล็อกข้อความเก่า (home-reference, geo-copy-1117, titles-1117, security-pdpa, business-facts, lead-times, need-by, search-intent, faq-search, home-board)

- [ ] **Step 1: เขียนเทส** สแกน `src/` `site/` `scripts/` (ไม่รวม legacy-posts.json และคอมเมนต์) ว่าไม่มี: "DFT" (ยกเว้น 1 จุดบนหน้าสกรีน + search-synonyms) · "สกรีน… 1 ตัว" · "เริ่มสั่งได้ 1 ตัว" · "3–14 วัน" · และ export ทั้งเว็บ (`wp-theme/teamdee/build/pages/*.html` + llms.txt) ไม่มี HUB/มั่ง · faq คำตอบสกรีนมี "5 ตัว" "2XL ขึ้นไป +20" · คู่มือสกรีนไม่มี "[ยืนยัน" · ค้น "dft" และ "dtf" ได้หน้าสกรีนอันดับแรก · need-by สกรีนใช้ 7 วัน
- [ ] **Step 2: รันให้พัง**
- [ ] **Step 3: แก้ทุกไฟล์ในรายการ** (ข้อความใช้ตัวเลขจากสเปกเท่านั้น)
- [ ] **Step 4: เทสทั้งชุดผ่าน + build + export + check · grep ซ้ำด้วยมือ `grep -rn "DFT" src site scripts` เหลือตามที่อนุญาต**
- [ ] **Step 5: รายงานพร้อม commit** `fix(copy): DTF naming, 5-piece minimum and new lead times site-wide`

### Task 7: ตรวจรวมก่อนส่ง

- [ ] เทสทั้งชุด + `npm run check` + `npm run build && npm run export:wp`
- [ ] ถ่ายจอ /screen-printing/ · /calculations/?kind=screen · หน้าแรก (การ์ดบริการ + FAQ) · /screen-printing-order-guide/ ทั้ง 3 ขนาด · ตรวจ `better-interface` สั้นๆ เฉพาะส่วนใหม่ (label ฟอร์ม · คอนทราสต์ · ตารางมือถือ)
- [ ] เครื่องคำนวณในเบราว์เซอร์จริง: กรอกตัวอย่าง 11 ตัวอย่างของสเปก ยอดตรงทุกตัว
- [ ] og image /screen-printing/ ยังใช้ได้ · llms.txt บรรทัดสกรีนถูก · JSON-LD Product 145–245 ขั้นต่ำ 5
- [ ] รายงานอาร์ต: สิ่งที่เปลี่ยน + หลักฐาน + พร้อม commit/ออกเวอร์ชัน
