# Changelog

รูปแบบตาม [Keep a Changelog](https://keepachangelog.com/) · เวอร์ชันตาม [SemVer](https://semver.org/) · สร้างจาก conventional commits

## v0.4.10 — 2026-11-17

แก้จากการตรวจ staging หลัง v0.4.9: ข้อความ LINE ในบทความขึ้นบรรทัดถูกต้อง · หน้าบทความไม่โหลด Elementor (error elementorFrontendConfig หาย) · หน้า Elementor เดิมอย่าง /collar-styles/ เต็มความกว้างแบบเว็บจริง

### Fixes

- **article:** keep the LINE message line breaks, no Elementor assets on non-Elementor posts (5652738)
- **wp-theme:** full-width layout for legacy Elementor pages like the live site (9bfa8f9)

## v0.4.9 — 2026-11-17

คง /size-chart/ และ /collar-styles/ ไว้กัน SEO เก่าหลุด · ปรับหน้าบทความ: วันที่ไทย หมวด เวลาอ่าน สารบัญสั้นลง ตารางอ่านง่าย กล่องถามทาง LINE กลางบทความ ป๊อปอัปไม่เด้งกลางเนื้อหา

### Features

- **article:** Thai dates, category and reading time, shorter contents, lighter tables, quiet LINE prompt (d12c745)

### Fixes

- **seo:** keep the ranking /size-chart/ title and H1, single H1 on legacy Elementor pages (b5a1148)

## v0.4.8 — 2026-11-17

แก้จากการตรวจ staging หลัง v0.4.7: หน้าธีมไม่มี Article/ผู้เขียน (en-US) ของ Rank Math แล้ว · /?p= ที่ไม่มีอยู่จริงได้ 404 (เดิม 200 เป็นหน้าแรก)

### Fixes

- **wp-theme:** drop Rank Math Article/Person on theme pages, let WordPress answer ?p= / ?page_id= (bb6dd27)

## v0.4.7 — 2026-11-17

หน้าที่ธีมแสดงเองไม่โหลดสคริปต์ Elementor แล้ว (staging ขึ้น error "elementorFrontendConfig is not defined") · บทความและหน้าอื่นไม่แตะ

### Fixes

- **wp-theme:** keep Elementor scripts off pages the theme renders itself (3c1003d)

## v0.4.6 — 2026-11-17

แก้ตามผลตรวจโค้ดของ v0.4.5 ครบทุกจุด: schema ธุรกิจเก่าไม่กลับมาแม้ Rank Math โดนตัดหมด · SVG quote เดี่ยวไม่ทำ build พัง · ราคาสกรีนใน llms.txt บอกรุ่นเสื้อ · ลดโค้ดซ้ำใน schema

### Fixes

- code-review follow-ups (JSON-LD fallback, SVG quotes, llms screen labels, schema dedupe) (c061f59)

## v0.4.5 — 2026-11-17

ชุด SEO/GEO A1–A12 (llms.txt · ธุรกิจเดียว /#business ทุกหน้า · Product schema · รูปแชร์รายหน้า 41 รูป · redirect/canonical) · หน้ากลุ่มลูกค้าและ /sublimation/ โชว์ทั้งหมดไม่ต้องกด · แยก CSS หน้าแรก/หน้าสินค้า · SVG sprite · แก้บั๊กและ a11y จากรอบตรวจ

### Features

- **seo:** SEO/GEO plan A1–A12 — llms.txt, business + product schema, per-page share images (5cd2a06)
- **ui:** show all work contexts and fabrics, plus bug, a11y and breadcrumb fixes (4d11b85)

### Performance

- split home-only and product-base CSS, resize 15 icons (c5f619d)

### Tests

- guards for SEO/GEO, CSS split, SVG sprite, show-all and a11y fixes (b4c3b8c)

### Docs

- SEO/GEO audit 17 Nov 2026 (reports + plan) and content drafts (a373ea6)

## v0.4.4 — 2026-11-17

ถอดป้ายภาพจำลอง/ภาพประกอบทั้งเว็บ (อาร์ตสั่ง) · แก้จุดจากการตรวจทั้งเว็บ: คอนทราสต์ แถบเลื่อนกด Tab ถึงได้ popup ไม่แย่งโฟกัส รูปแถวแรกโหลดทันที preload ฟอนต์ละติน ล็อกลำดับ CSS

### Features

- **content:** remove "ภาพจำลอง" and "ภาพประกอบ" labels from images site-wide (d877d34)

### Fixes

- **a11y:** raise text contrast, make scrollers keyboard-reachable, stop the promo popup stealing focus (8ae7857)

### Performance

- load first-row images eagerly, preload the Latin font and fix the stylesheet order (b3eeb84)

## v0.4.3 — 2026-11-16

title ของทุกหน้าที่ธีมแสดงมาจากต้นแบบ (หน้าแรกบน staging เคยเป็น "โรงงานรับผลิตเสื้อ…" จาก Rank Math) รวม title ตอนแชร์ลิงก์ · บทความใช้ Rank Math เหมือนเดิม

### Fixes

- **wp-theme:** use the prototype title on every page the theme renders (a05b7f7)

## v0.4.2 — 2026-11-16

ลิงก์ในหน้าบน staging (WordPress ในโฟลเดอร์ย่อย /enterprise/) พาไปเว็บเก่า → ธีมเติม path โฟลเดอร์ย่อยหน้าลิงก์เอง · เว็บที่รากโดเมน HTML เหมือนเดิมทุกตัวอักษร

### Fixes

- **wp-theme:** insert the sub-folder path with a callback, not a replacement string (34043da)
- **wp-theme:** point internal links at the sub-folder when WordPress is not at the domain root (1ffb28a)

## v0.4.1 — 2026-11-16

หน้าแรกบน staging พื้นดำ ตัวหนังสือหาย (CSS หน้า Elementor เดิมทับธีม) → หน้าที่ธีมแสดงเองไม่โหลด CSS ของ Elementor · เลขเวอร์ชันในธีมตรงกับ Release

### Fixes

- **wp-theme:** keep Elementor CSS off pages the theme renders itself (43e0c3f)

### Chores

- **wp-theme:** show the release version in the theme header (29604fe)

## v0.4.0 — 2026-11-16

รูปย้ายออกจากธีมไป wp-content/uploads/teamdee/img (zip ธีมจาก 201MB เหลือ ~1.5MB) · ตัวตรวจข้อมูล npm run check · จัดโครงโค้ด (vite.config.js แยกเป็น src/build · หนึ่งหน้าหนึ่งไฟล์เนื้อหา src/content) หน้าเว็บเหมือนเดิมทุกตัวอักษร

**ติดตั้ง:** วางชุดรูป (teamdee-images-full-v0.4.0.zip) ใน wp-content/uploads/ ก่อน แล้วค่อยลงธีม · staging วางรูปแล้ว 16 พ.ย.

### Features

- **scripts:** add npm run check to report data mistakes in Thai (414c13f)
- **wp-theme:** serve site images from wp-content/uploads instead of the theme (6338ca8)

### Refactoring

- **build:** split vite.config.js into src/build and give each page one content file (eb28afc)
- **data:** move history notes out of the data files into docs/data-notes.md (8215b4d)

## v0.3.1 — 2026-11-16

หน้า /sublimation/ แสดงรีวิวครบทุกราย · รูปขั้นตรวจตัวอย่างไม่มีชื่อแบรนด์ · คำอธิบายหน้าร้านค้ามีร้านอาหารและคาเฟ่

### Fixes

- **sublimation:** show every review and drop brand text from the sample photo (534fdcb)
- **seo:** mention restaurants and cafes in the staff-shirt page description (24920c7)

## v0.3.0 — 2026-11-16

รีวิวคลังเดียวทุกหน้า · ผังเสื้อหน้า-หลังหน้า /embroidery/ · ขั้นตอนพิมพ์ลายมีตรวจตัวอย่าง · ธีมไฟล์แนบใน GitHub Release

### Features

- **sublimation:** add a sample check step to the print order steps (235b48c)
- **pages:** one review pool, single-row reviews, shirt diagrams and one check section (a874a2a)
- **seo:** give /corporate/ a full meta description (2259c79)

### Fixes

- **event:** replace event hero image with the Motor Expo staff scene (07ff5b7)

## v0.2.0 — 2026-11-16

รุ่นแรกที่ติด tag: เว็บ TEAMDEE โฉมใหม่ (Vite + Handlebars → ธีม WordPress `teamdee`) ตั้งแต่ 4 ก.ย. 2026 ถึง commit นี้ · ธีมไฟล์แนบใน GitHub Release

### Features

- **viewer:** open customer photos in the white review dialog and make the review mosaic clickable (34c048f)
- **wp-theme:** show WordPress posts on the home page and /blog/ as they are published (23ce732)
- **use:** rebuild all 10 customer-type pages on the new layout (12b4b7f)
- **embroidery:** per-fabric price tables, polo options and size picker fixes (2cd08e1)
- **size-chart:** restore real size tables with a size finder and FAQ (7a76926)
- **embroidery:** rebuild /embroidery/ with polo guide, fabric picker and order steps (1f55904)
- **use:** rebuild shop, organization and education pages on corporate layout (5fbd8bb)
- redesign product, use and project pages (rounds 43-201) (d872069)
- **about:** redesign about page as a long-read story (e09c6ef)
- **home:** rework homepage sections after full audit (c7c3c6f)
- **data:** apply confirmed prices, lead times and policy answers (29b16c2)
- **home:** homepage per v22 with buyer and audit fixes (80b09cf)
- **v22:** rebuild sitemap and pages to Wireframe v22 (d3bfc5c)
- **img:** add images for v22 pages and homepage (d364ae0)
- floating contact, SEO pass and build fixes before v22 (28f9161)
- ผังเว็บและหน้าแรกตาม Wireframe v4 (6e348fb)
- **wp:** export ต้นแบบลงธีม WordPress และสัญญาณวัดผลแอด (7b8c704)
- **home:** หน้าแรกแบบทีม ดัดแปลงจากแบบ Figma Present 2026 (3a708d0)
- ย้ายเว็บไปโครง Wireframe v2 พร้อม hero แบบเลื่อนและเครื่องคิดราคา (2ef2901)
- **assets:** เพิ่มรูปงานจริง โลโก้ลูกค้า แบบเสื้อ และไอคอนเว็บ (a901cd2)
- **pages:** เพิ่มหน้าเว็บอีก 33 หน้า (729d3fc)
- เพิ่มหน้าแรก (c5670d9)
- **js:** เพิ่มเมนู เครื่องคิดราคา ตัวกรอง และกล่องดูรูปใหญ่ (4c6ef45)
- **data:** แยกเนื้อหาเว็บออกมาเป็น JSON (6f83ad2)
- **ui:** เพิ่ม design tokens และ partials ที่ใช้ร่วมกันทุกหน้า (3e0069b)

### Bug Fixes

- **float-cta:** keep the online dot off the LINE icon on desktop (f7755ed)
- **thai-break:** keep named entities in paragraphs from double-escaping (908867f)
- **wp-theme:** render posts and categories with the theme templates over Elementor Pro (ba83948)
- **wp-theme:** work from any install folder and keep SEO on routes without a WP Page (9796afe)
- **embroidery:** keep fabric names and quantity headers inside columns at 1280–1439px (fa2fdf4)
- apply audit fixes and confirmed business facts across all pages (ab626eb)

### Performance

- **img:** add webp versions of jpg photos for faster pages (e5252a6)

### Style

- unify text-and-arrow links into one style site-wide (58fa3ea)

### Documentation

- log rounds 223 onward in PLAN.md (b9003d8)
- log rounds 202–222, add Search Console report and embroidery spec (b134051)
- add audits, proposals, plans and design notes from rounds 43-201 (162e12c)
- **audit:** add main-pages and homepage deep audit reports (b524c42)
- log homepage and about rounds, ignore drive exports (0e898ef)
- add v22 spec, plan, content parity and audit notes (96433b0)
- เพิ่ม PLAN.md บันทึกเหตุผลที่รื้อและทิศทางที่เลือก (d5828ce)

### Chores

- remove unapproved privacy policy and terms drafts (e0826c8)
- **wp:** ตั้ง WordPress ในเครื่องและโครงธีม TEAMDEE (54706ff)
- ตั้งค่าโปรเจกต์ Vite + Tailwind 4 + Preline (d198a97)

### Other

- Revise website proposal from full WordPress export audit (dfa5b87)
- Add website restructure proposal for team-dee.com (7d30971)

### Security

- อัปเดต dev dependencies ที่ npm audit แจ้ง (vite 7.3.8 · handlebars 4.7.10 · source-map-js 1.2.2) · ใช้ตอน build เท่านั้น · ไฟล์ธีมที่ build ได้เหมือนเดิมทุกไฟล์ (เทียบ hash 147 ไฟล์)
