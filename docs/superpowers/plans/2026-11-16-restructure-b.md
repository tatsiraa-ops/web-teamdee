# จัดโครงโค้ดใหม่ (ชุด B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มหน้าใหม่และแก้หน้าเดิมได้ง่ายขึ้น โดยหน้าเว็บที่ build ออกมาเหมือนเดิมทุกตัวอักษร

**Architecture:** แยก `vite.config.js` (1,520 บรรทัด) เป็นโมดูลใน `src/build/` แล้วแยกเนื้อหาออกเป็นไฟล์ละหน้า (B2) ปรับเทสข้อความให้อ่านค่าจากข้อมูล (B3) และเพิ่มคำสั่งสร้างหน้าใหม่ (B4) ทุกขั้นต้องผ่านด่านเทียบผล build

**Tech Stack:** Vite 7 + vite-plugin-handlebars, Node 24 `node --test`, export ไปธีม WordPress

**Spec:** ข้อเสนอชุด B ในแชท 16 พ.ย. 2026 อาร์ตสั่งให้ทำ ("B1–B4 จัดโครงใหม่ … หน้าเว็บต้องออกมาเหมือนเดิมทุกตัวอักษร")

## Global Constraints

- ผล build ทั้ง `dist` (ต้นแบบ) และ `dist-wp` (เว็บจริง) ต้องตรงกับ baseline ทุกไฟล์ ยกเว้นเวลาที่ฝังใน `pages.json` และ `sitemap` (ถ้ามี)
- ใช้ความกว้างเดิม ข้อความเดิม และ URL เดิม ห้ามเปลี่ยนสิ่งที่คนเห็น
- ห้าม commit เอง (กฎ CLAUDE.md ข้อ 2) ทุกช่วงจบที่ "พร้อม commit"
- เทสทั้งชุดต้องเขียว: `PHP_WASM_MODULES=… npm test`

## Review Focus

1. **ตัวแปรที่ branch ใช้แต่ไม่ได้ส่งเข้าไป:** ฟังก์ชันที่ย้ายออกอ้างตัวแปรจาก closure เดิม ด่านเทียบผล build จะจับได้ ถ้าโค้ดไม่ throw
2. **ลำดับ key ใน object ที่ส่งเข้าเทมเพลต:** ลำดับเปลี่ยนแล้ว `{{json}}` ออกมาต่างกัน ด่านเทียบผล build จับได้
3. **path `root`:** โมดูลใน `src/build/` ต้องคำนวณ root ของโปรเจกต์ให้ถูก (`../..`)
4. **โหมด `forWp`:** ต้องเทียบผลทั้งสอง target ทุกขั้น
5. **ไฟล์เนื้อหาใหม่ (B2):** `npm run check` ต้องตรวจไฟล์ใหม่ได้ด้วย

---

### ด่านเทียบผล build (ใช้ทุก Task)

`scripts/compare-build.mjs`:
- `--save`: build ทั้ง `dist` และ `dist-wp` แล้วเก็บไว้ที่ `.build-baseline/` (gitignored)
- ไม่ใส่ flag: build ใหม่แล้วเทียบทีละไฟล์ บอกไฟล์ที่ต่าง แล้ว exit 1

### Task B1: แตก vite.config.js

**Files:** สร้าง `src/build/shared.js`, `data.js`, `plugins.js`, `helpers.js`, `pages/*.js` · แก้ `vite.config.js`

- [ ] B1a ตัวช่วยและค่าคงที่ (บรรทัด 1–110, 732–772) → `src/build/shared.js` แล้วผ่านด่านเทียบผล
- [ ] B1b `loadData` / `withMeta` → `src/build/data.js` แล้วผ่านด่านเทียบผล
- [ ] B1c ปลั๊กอิน build (seoTags, webpImages, thaiLines, fontPreload, seoFiles, input) → `src/build/plugins.js` แล้วผ่านด่านเทียบผล
- [ ] B1d helper ของ Handlebars → `src/build/helpers.js` แล้วผ่านด่านเทียบผล
- [ ] B1e branch ต่อประเภทหน้า → `src/build/pages/<kind>.js` ตัวละ `export function build({ data, base, at, page, kind, id })` คืน context หรือ `null` แล้วผ่านด่านเทียบผล
- [ ] เทสทั้งชุดเขียว

### Task B2: หนึ่งหน้าหนึ่งไฟล์เนื้อหา

- [ ] หน้ากลุ่มลูกค้า: รวม `use-pages.json[id]` กับ `use-v2.json[id]` → `src/content/use/<id>.json` ที่มีช่อง `page` (เดิม use-pages) และ `v2` (เดิม use-v2) · ตัวโหลดประกอบกลับเป็นโครงเดิม · `_check` และค่ากลางย้ายไป `src/content/use/_shared.json`
- [ ] หน้าสินค้า: รวม `product-pages.json[id]` กับ `pp-v2.json[id]` → `src/content/product/<id>.json` แบบเดียวกัน
- [ ] โค้ดและเทสที่อ่านไฟล์เดิมเปลี่ยนไปใช้ตัวโหลดกลาง `src/build/content.js` (`useContent()`, `productContent()` คืนโครงเดิม)
- [ ] `npm run check` ตรวจ `src/content/**`
- [ ] ผ่านด่านเทียบผล + เทสเขียว

### Task B3: เทสไม่ผูกคำตายตัว

- [ ] หาเทสที่ assert ข้อความไทยตรงตัวซึ่งมีอยู่แล้วในไฟล์เนื้อหา → เปลี่ยนเป็นอ่านค่าจากไฟล์เนื้อหาแล้วเทียบกับหน้าที่ build
- [ ] เก็บเทสกติกาไว้ตามเดิม (โครงหน้า รูปครบ ลิงก์ ความยาว meta คอนทราสต์ ไม่มีคำว่าโรงงาน ฯลฯ)
- [ ] ลองเปลี่ยนคำในไฟล์เนื้อหาแล้วเทสต้องไม่ตก (ทดลองแล้วย้อนกลับ)

### Task B4: คำสั่งสร้างหน้าใหม่

- [ ] `npm run new:page -- use <id> <slug>`: คัดลอกไฟล์เนื้อหาตั้งต้นจากหน้าต้นแบบ (corp) เพิ่ม route ใน `routes.json` สร้าง `site/<slug>/index.html` และเทสพื้นฐาน
- [ ] มีเทสของสคริปต์ (สร้างในโฟลเดอร์ชั่วคราว) + ลองสร้างจริงแล้วลบ
