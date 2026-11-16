# Changelog

รูปแบบตาม [Keep a Changelog](https://keepachangelog.com/) · เวอร์ชันตาม [SemVer](https://semver.org/) · สร้างจาก conventional commits

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
