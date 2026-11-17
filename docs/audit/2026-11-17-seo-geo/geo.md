# GEO Review Report: TEAMDEE

**Date:** 17 Nov 2026
**URL (production):** https://team-dee.com. This is still the OLD WordPress site with Rank Math.
**URL (new theme preview):** http://127.0.0.1:9400 (WP Playground, anonymous view, no Rank Math installed)
**Product type:** Thai custom team-shirt maker (embroidered polo, full sublimation print, DFT screen) · บริษัท ดีดี ฟินิกซ์ จำกัด · Nonthaburi
**Depth:** thorough (all 6 categories + live retrieval tests + off-site + blog)
**Method notes:** The Shiplight MCP was not available. I used Playwright (system Chrome, headless, closed in try/finally, no `--remote-debugging-port`), curl, WebSearch and WebFetch. I made about 45 public read-only requests to production and the web. I did not log in, and I used the Playground's anonymous cookie only (`playground_auto_login_already_happened=1`, no auth cookie). Raw evidence is in `scratchpad/seo2/geo-raw/` (render-diff.json, raw_*.html, posts/*.html, robots, headers).

**Target AI queries tested:** แนะนำร้านรับทำเสื้อโปโลปักโลโก้ นนทบุรี · สั่งทำเสื้อทีมขั้นต่ำกี่ตัว · เสื้อพิมพ์ลายทั้งตัวราคาเท่าไหร่ · best custom team shirt maker Thailand · รับทำเสื้อกีฬาสี · รับทำเสื้อโปโล ปักโลโก้ ขั้นต่ำ 10 ตัว ราคา รวม VAT · รับทำเสื้อพิมพ์ลายทั้งตัว sublimation ราคาต่อตัว ขั้นต่ำ · plus 6 brand/entity queries.

## Overall GEO score

- **Today (production):** 3.5/10 · confidence 75%
- **After the new theme launches, with no further fixes:** about 5.5/10

| Category | Score | Main reason |
|---|---|---|
| 1. AI crawler access (TECH) | 8/10 | All major AI bots get 200. No llms.txt. Bytespider gets 403 at nginx. |
| 2. Rendering without JS (TECH-04) | 8.5/10 new · 6/10 prod | New theme: prices, MOQ, lead times, FAQ answers, size tables and all 113 design codes are in the raw HTML. Prod: count-up stats show "0+" in the raw HTML. |
| 3. Entity clarity (ENTITY + schema) | 4/10 | NAP is consistent inside the new theme. But a conflicting entity is live on prod (name "TEAMDEE STUDIO", address 109/20, @id /#organization) and will collide with the theme's /#business. LocalBusiness appears on only 2 pages. No Service/Offer schema. |
| 4. Citation-worthiness of content (CITE/STRUCT) | 6/10 new · 4/10 prod | Strong price tables (VAT, bands) on /embroidery/, /screen-printing/ and baseball/jersey pages. /sublimation/ and the homepage have no price. No "last updated" dates. The hero copy is vague. |
| 5. Current AI visibility (TEST) | 1/10 | TEAMDEE appeared in 0 of 13 searches. Competitors are cited instead. |
| 6. Off-site authority (AUTH) | 2/10 | The only third-party hit is a Creden company-registry record. No Wikidata, no Pantip, and no Google Business Profile surfaced. |
| 7. Blog / articles | 3/10 | Author shown as "admin" or "Teamdee". Unsourced statistics. One MOQ claim contradicts the site. About 140 uses of "โรงงาน". |

---

## Phase 3: Analysis

### 1. AI crawler access

**Production robots.txt** (fetched 17 Nov, 200, 116 B):
```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Sitemap: https://team-dee.com/sitemap_index.xml
```
- No bot-specific rules. GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, Bytespider and Meta-ExternalAgent are all allowed by robots.txt.
- **UA tests against production:**

  | User agent | Request | Result |
  |---|---|---|
  | GPTBot | `/` | 200 (358 KB) |
  | ClaudeBot | `/` | 200 |
  | PerplexityBot | `/` | 200 |
  | OAI-SearchBot | `/` | 200 |
  | CCBot | `/robots.txt` | 200 |
  | meta-externalagent | `/robots.txt` | 200 |
  | Claude-SearchBot | `/robots.txt` | 200 |
  | ChatGPT-User | `/robots.txt` | 200 |
  | **Bytespider** | `/` | **403** |

  The Bytespider 403 is an nginx error page dated 19 May 2026. That points to a server-level UA block on Hostatom, not WordPress. It is reasonable (Bytespider ignores robots.txt), but it is undocumented. Ask who set it.
- No Cloudflare or WAF headers appeared (`server: nginx` only). This matches the memory note that Cloudflare is not active yet.
- **New theme.** The local WP has no Rank Math, so WP core serves this robots.txt:
  ```
  User-agent: *
  Disallow: /wp-admin/
  Allow: /wp-admin/admin-ajax.php
  Sitemap: http://127.0.0.1:9400/wp-sitemap.xml
  ```
  On production Rank Math will keep serving its own virtual robots.txt and `sitemap_index.xml`. Nothing in the theme filters `robots_txt`, so after launch the output will match today's production. That is fine for AI. Rank Math does not add AI-bot rules by default (based on the current prod output). `src/build/plugins.js` `seoFiles` applies only to the static prototype.
- **llms.txt / llms-full.txt:** 404 on production (WP 404 HTML) and 404 on local. Neither exists.
- The production sitemap includes `/thank-you/` and `/test-page/`. That is low-value noise for crawlers (SEO hygiene).

**Should llms.txt exist?** Yes, as a cheap, low-risk step. No major engine has confirmed it uses llms.txt for ranking. Its value is a clean, fact-dense Markdown summary that an agent fetching the site (ChatGPT-User, Claude, Perplexity on demand) can read in one request. Build it only from confirmed facts. See the draft below.

### 2. Rendering without JavaScript (new theme, 8 routes)

The Playwright comparison has three columns:
- **Raw:** curl HTML with script, style and template removed.
- **No-JS:** a browser render with JavaScript disabled.
- **JS:** a full render, measured with `innerText`.

| Route | Raw text chars | No-JS visible | JS visible | `<template>` | Tables (raw/JS) | `<details>` (raw/JS) | JSON-LD |
|---|---|---|---|---|---|---|---|
| / | 17,221 | 10,899 | 7,893 | 0 | 0/0 | 14/14 | LocalBusiness, FAQPage(11) |
| /embroidery/ | 18,476 | 13,741 | 12,815 | 0 | 8/8 | 16/16 | FAQPage(7), BreadcrumbList |
| /sublimation/ | 17,924 | 14,211 | 12,856 | 0 | 2/2 | 10/10 | FAQPage(7), BreadcrumbList |
| /faq/ | 12,071 | 3,134 | 3,137 | 0 | 0/0 | 35/35 | FAQPage(32), BreadcrumbList |
| /calculations/ | 5,380 | 2,555 | 2,503 | 0 | 1/1 | 4/4 | FAQPage(3), BreadcrumbList |
| /size-chart/ | 9,699 | 6,110 | 5,994 | 0 | 4/4 | 9/9 | FAQPage(6), BreadcrumbList |
| /designs/ | 8,769 | 6,234 | 3,525 | 0 | 0/0 | 3/7 | ItemList(113), BreadcrumbList |
| /about-us/ | 7,528 | 5,139 | 4,211 | 0 | 0/0 | 3/3 | LocalBusiness |

Raw text is always larger than the visible text. Collapsed `<details>` answers and sr-only values are in the HTML even when they are not on screen. That is the right direction for crawlers.

**Is each fact server-side?**

| Fact | Server-side? | Evidence |
|---|---|---|
| Prices | **Yes where they exist.** | /embroidery/: 6 `<table>` price ladders (220→170 … 390→300). /screen-printing/: 290→220 บาท/ตัว plus extra-point costs. /custom-baseball-shirts/ and /custom-oversize-jerseys/: 359…. /calculations/: all start prices ("โปโลปัก 220 บาท/ตัว · พิมพ์ลาย คอกลม/คอวี 279 · คอปก 329 · เบสบอล 359"). **Gap:** /sublimation/ shows no per-shirt price at all (only "มัดจำค่าออกแบบ 500 บาท"), even though `prices.json` has the print ladder. `print.json` still holds `"ราคาเริ่มต้น [รอยืนยัน] บาท / ตัว"`. The homepage also has no price. |
| Minimum order | Yes | Raw HTML on /embroidery/ ("ขั้นต่ำ 10 ตัว"), /faq/ ("เริ่มสั่งผลิตได้ตั้งแต่ 10 ตัว (เสื้อสกรีนเริ่ม 1 ตัว)"), /screen-printing/ ("ไม่มีขั้นต่ำ เริ่มสั่งได้ 1 ตัว") and home. It is inside a closed `<details>`, so it is not on screen, but it is in the HTML. |
| Lead times | Yes | "ผลิต 10–15 วัน" (embroidery), "15–20 วัน" (sublimation, baseball, jersey), "3–14 วัน" (screen). /faq/ has the full rule: count from the day after design approval, add 5–7 days in Oct–Jan, rush minimum 7 days with no rush fee. |
| FAQ answers | Yes | All `<details>` bodies are in the raw HTML. FAQPage JSON-LD matches. Items still marked `[รอยืนยัน]` are filtered out of the schema (seo-schema.js `pending()`), and none are visible as text. |
| Fabric specs | Yes | Fabric cards on /embroidery/ (e.g. "~160 แกรม · Polyester 100%"). /sublimation/ has "ผ้าพิมพ์ลาย 14 ชนิด" sections. |
| Size tables | Yes | Real `<table>` with inches on product pages. /size-chart/ has inches plus cm (SS–7XL, No.4–No.8, men XS–11XL, women XS–7XL). |
| Count-up stats | Yes (new) / **No (prod)** | The new theme puts the real value in an sr-only span ("8 ปี", "2,800+ องค์กร", "10,000+ งาน"). Production raw HTML reads "**0** + Years Experience **0** + Projects Completed **0** + Pieces Produced", so a crawler sees zeros on the live site today. |
| Design catalogue | Yes | All 113 TD codes are in the raw HTML (not only the first 40 shown on screen). ItemList(113) is present. |
| Hidden in `<template>` / JSON | Minor | There is no `<template>` on any audited route. `<script type="application/json" data-rv-json>` (19 KB of review data) appears on home and /sublimation/, and `#designFacets` (1.7 KB) on /designs/. That data is not needed by crawlers. If the review wall builds review text only from that JSON, those quotes are invisible without JS. I have not verified this further, and it is low impact. |
| JS-only | Calculator result | The calculator's total ("ยอดรวมประมาณ 6,600 บาท สำหรับ 30 ตัว") and the date stamp are computed in the browser. That is fine, because the price table under it is in the HTML. |

**Verdict:** the new theme is in good shape on this point. It is server-rendered and crawlable, and the facts are in the HTML. The gaps are missing content, not rendering problems.

### 3. Entity clarity

**What a machine can learn today (production):** the Rank Math graph names the business **"TEAMDEE STUDIO - โรงงานรับผลิตเสื้อ และเสื้อโปโลยูนิฟอร์ม"**:
- @type `LocalBusiness+Organization`, @id `https://team-dee.com/#organization`
- streetAddress **"109/20 ถนนเลี่ยงเมืองนนทบุรี ตำบลตลาดขวัญ"**
- telephone +66975495941
- sameAs: Facebook and LINE only
- no legalName, no foundingDate

Other production signals:
- `<html lang="en-US">` on Thai content.
- Meta description: "TEAMDEE โรงงานรับผลิตเสื้อและโรงงานผลิตเสื้อมาตรฐานสากล…".

**What the new theme says (raw HTML, every page footer):**
- "บริษัท ดีดี ฟินิกซ์ จำกัด · 264 ถนนเลี่ยงเมืองนนท์ ตำบลตลาดขวัญ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000 · ทุกวัน 8:30–21:00 น. · 097-549-5941 / 086-416-6449".
- I checked 12 routes: address 264 appears on all of them, 109/20 on none, and the legal name in every footer.
- /about-us/ adds "จดทะเบียน 19 มกราคม 2021", "ดูแลงานเสื้อทีมตั้งแต่ปี 2018", and the documents available (หนังสือรับรอง, ภ.พ.20, ใบกำกับภาษีเต็มรูป). This is excellent, verifiable entity data.
- `lang="th"`.

**Crisp answers? (new theme)**

| Question | Answered? | Where |
|---|---|---|
| Who (brand, legal name, founded, location, contact) | Yes, but spread across sections | /about-us/ "ข้อมูลบริษัทที่ตรวจสอบได้" plus the footer. There is no single definitional sentence such as "TEAMDEE คือ…" anywhere. |
| Service area | Weak | Only "ส่งฟรีทั่วประเทศ" in FAQ/product copy. Schema says `areaServed: "TH"`. |
| What it makes | Yes | H1s and product pages (polo embroidery, full print, DFT screen, baseball, jersey, warm-up). |
| Minimum order | Yes | 10 ตัว, or 1 ตัว for screen. |
| Price ranges | Partly | Polo, screen, baseball and jersey: yes. Full-print sublimation (the biggest category): **no** on its own page; only on /calculations/. |
| Turnaround | Yes | 10–15 / 15–20 / 3–14 days, plus the counting rule. |

**Schema coverage (new theme)**

| Schema | Where | Status |
|---|---|---|
| LocalBusiness `@id /#business` | `/` and `/about-us/` only (`src/build/context.js:80-81`) | Missing on the other 46 routes. Includes legalName, foundingDate, geo, hasMap, sameAs (LINE, FB, IG), and openingHours "Mo-Su 08:30-21:00". |
| Organization / WebSite | None | — |
| Service / Product / Offer | None | The price tables have no machine-readable form. |
| FAQPage | home, product pages, use pages, /faq/(32), /size-chart/, /calculations/ | Good |
| BreadcrumbList | Most inner pages | Good |
| ItemList | /designs/ (113) | Good |
| VideoObject | Pages with ready videos | Good |
| Article / BlogPosting | Not in the theme | `single.php` prints a date but **no author** and no schema. It relies on Rank Math in production (today Rank Math outputs BlogPosting with author "admin" or "Teamdee"). |

**sameAs:** the theme lists LINE, facebook.com/teamdee and instagram.com/teamdee_. Missing: the Google Business Profile / Maps CID URL, and any registry URL.

**The @id collision (important):** `seo-schema.js` says "@id ให้ Google รวมเป็นธุรกิจเดียวกับ schema ที่ปลั๊กอิน SEO ใส่", meaning it expects to merge with the SEO plugin's entity. But Rank Math uses **`/#organization`**, not `/#business`.
- `functions.php` has no `rank_math/json_ld` filter.
- So after launch the homepage will very likely emit **two business entities**: Rank Math's "TEAMDEE STUDIO - โรงงาน…" at 109/20, and the theme's "TEAMDEE / บริษัท ดีดี ฟินิกซ์ จำกัด" at 264.
- The Google Business Profile pin also still points to 109/20 (`site.json mapUrlNote`).

**Wikidata / Wikipedia:** none found.

**Google Business Profile:** not surfaced by any search. I could not verify it directly; that needs a Maps browser session. `site.json` confirms a GBP exists, with its pin on 109/20.

**Registry (external):** Creden lists บริษัท ดีดี ฟินิกซ์ จำกัด, juristic ID 0125564002147, registered capital 1,000,000 บาท. The "0125" prefix means Nonthaburi registration and 2564 BE = 2021. That corroborates the "19 มกราคม 2021" on /about-us/. This is a useful sameAs/identifier candidate, but the owner should confirm before it is published.

### 4. Citation-worthiness of content

**Strengths (new theme):**
- Price ladders with units, quantity bands and "รวม VAT".
- Lead-time rules with explicit conditions.
- Size tables in inches and cm.
- A 32-question FAQ grouped into 7 H2s.
- Question-shaped H2/H3s on product pages ("ทำไมต้องสั่งทำเสื้อพิมพ์ลายกับทีมดี?", "สั่งเสื้อโปโลปักขั้นต่ำ กี่ตัว?").
- A comparison guide route exists (/polo-vs-printed-shirts/).
- Company facts with a registration date.

**Weaknesses:**
- The homepage lead after the H1 is the tagline "เสื้อทีมที่ทุกคนภูมิใจจะใส่". It contains no definitional sentence, price, MOQ or turnaround.
- /sublimation/ has no price, and its first H2 block is adjectives ("สีซึมในเนื้อผ้า ลายไปได้ทั้งตัว").
- No "last updated" date on any price table. The competitor 12tees shows one on its polo price table, which is part of why it is cited.
- The embroidery price tables all carry the same caption, "ราคาต่อตัว บาท · รวม VAT". The fabric name appears only in the preceding H3, so a retrieval chunk can lose which fabric a row belongs to.
- Use pages such as /sports-shirt/ contain **no** MOQ, price or lead time in the raw HTML. /custom-class-shirts/ has lead times but no price.
- The FAQ answer "ราคาขึ้นกับอะไร" contains no numbers.
- Numbers are inconsistent across sources: new pages say "2,800+ องค์กร / 10,000+ งาน", production says "5000+ ทีม", and `site.json` proof says "5,000+ / 500,000+ (รอยืนยัน)".
- There are no sources or outbound references on the product pages.

**Vague copy that AI will skip** (examples):
- "เสื้อทีมที่ทุกคนภูมิใจจะใส่" (home)
- "ทีมดี เข้าใจคนสั่งเสื้อบริษัท" (home H2)
- "คนสั่งมั่นใจ คนใส่ภูมิใจ คนเห็นจดจำ" (about H2)
- "ออกแบบสีและลายสำหรับทีมคุณ" (sublimation H1 tail)

#### Proposed answer-block rewrites (only facts already in the repo)

These are for copy edits in `src/content/*` and `src/data/*`. They contain no "โรงงาน" and no invented numbers. ⚠ marks items that need owner confirmation.

**R1. Homepage: definitional lead (first paragraph under the H1)**
> TEAMDEE (ทีมดี) รับออกแบบและผลิตเสื้อทีม เสื้อบริษัท เสื้อโปโลปักโลโก้ เสื้อพิมพ์ลายทั้งตัว และเสื้อสกรีน DFT ดำเนินการโดย บริษัท ดีดี ฟินิกซ์ จำกัด (จดทะเบียน 19 มกราคม 2021) ที่ 264 ถนนเลี่ยงเมืองนนท์ ตำบลตลาดขวัญ อำเภอเมืองนนทบุรี นนทบุรี ดูแลงานเสื้อทีมมาตั้งแต่ปี 2018 · สั่งขั้นต่ำ 10 ตัว (เสื้อสกรีนเริ่ม 1 ตัว) · ราคารวม VAT 7% · ส่งฟรีทั่วประเทศ · เปิดทุกวัน 8:30–21:00 น.

Sources: site.json, about-us copy, faq.json, prices.json.

**R2. /sublimation/: price answer block (new, directly under the first H2)**
> **เสื้อพิมพ์ลายทั้งตัวราคาเท่าไหร่?** คอกลม/คอวี 279 บาท/ตัว ที่ 10–20 ตัว ลดเป็น 230 (21–50), 210 (51–100), 180 (101–199) และ 160 บาท/ตัว ที่ 200 ตัวขึ้นไป · คอปก/คอวีปก/คอปกคางหมู 329 → 280 → 260 → 230 → 210 บาท · ราคารวม VAT 7% · ทุกไซซ์ราคาเดียว · ส่งฟรีทั่วไทย · เพิ่มแขนยาว +30 · ทรง Oversize +40 · กระเป๋าอก +20 บาท/ตัว · ขั้นต่ำ 10 ตัว · ผลิต 15–20 วันนับจากวันถัดจากยืนยันแบบ

Source: prices.json `products.print`, `options`, `included`; lead-times.json.
⚠ `print.json` still says "ราคาเริ่มต้น [รอยืนยัน]". prices.json says the ladder came from the old site calculator and Art approved it on 23 Oct. Confirm that this ladder is the public sublimation price before publishing.

**R3. /embroidery/: one-paragraph summary above the 6 tables, and fabric names in each `<caption>`**
> **เสื้อโปโลปักโลโก้ราคาเท่าไหร่?** ราคาต่อตัวรวม VAT และรวมปักโลโก้ 1 จุดที่หน้าอก: ผ้าจูติ 220 บาท (10–50 ตัว) ถึง 170 บาท (2,001 ตัวขึ้นไป) · TC Lacoste / ทรีคอต / ปีเก้ 260 → 190 บาท · Endurance 350 → 250 บาท · ดรายเทค 390 → 300 บาท · ทุกไซซ์ราคาเดียว · ขั้นต่ำ 10 ตัว · ผลิต 10–15 วัน

Change each caption to, for example, "ราคาเสื้อโปโลปัก ผ้าจูติ · บาท/ตัว · รวม VAT". Add "อัปเดตราคา: <date>" under the tables. ⚠ Art supplies the date.

**R4. /faq/: "ราคาขึ้นกับอะไร" (add numbers in the first sentence)**
> ราคาเริ่มต้นต่อตัว (รวม VAT ที่จำนวนขั้นต่ำ): โปโลปัก 220 บาท · พิมพ์ลายคอกลม/คอวี 279 บาท · พิมพ์ลายคอปก 329 บาท · เบสบอล/เจอร์ซีย์ Oversize 359 บาท · สกรีน DFT 290 บาท (Premium C32, 1–20 ตัว) ราคาต่อตัวลดลงเมื่อสั่งมากขึ้น และขึ้นกับอีก 3 อย่าง: ชนิดผ้า ตำแหน่งงาน และออปชันที่เพิ่ม (งานด่วนไม่มีค่าเร่ง) ดูตารางเต็มที่ /calculations/

Source: /calculations/ copy, prices.json. ⚠ This depends on R2's confirmation for 279/329.

**R5. /about-us/ (and reuse in llms.txt): "TEAMDEE คือใคร" fact box as a `<dl>`**
> ชื่อแบรนด์: TEAMDEE (ทีมดี) · ผู้ดำเนินการ: บริษัท ดีดี ฟินิกซ์ จำกัด · จดทะเบียน: 19 มกราคม 2021 · เริ่มทำเสื้อทีม: 2018 · สำนักงานใหญ่: 264 ถนนเลี่ยงเมืองนนท์ ต.ตลาดขวัญ อ.เมืองนนทบุรี จ.นนทบุรี 11000 · โทร 097-549-5941 / 086-416-6449 · LINE @teamdee · เวลาทำการ: ทุกวัน 8:30–21:00 น. (เข้าพบตามนัด) · บริการ: โปโลปักโลโก้ เสื้อพิมพ์ลายทั้งตัว เสื้อสกรีน DFT เสื้อเบสบอล เจอร์ซีย์ Oversize เสื้อวอร์ม · ขั้นต่ำ 10 ตัว (สกรีน 1 ตัว) · ชำระ: มัดจำ 50% · โอน / PromptPay / บัตร / วางบิล · เอกสาร: ใบเสนอราคา หนังสือรับรองบริษัท ภ.พ.20 ใบกำกับภาษีเต็มรูป

⚠ Confirm with the owner whether to add the juristic ID 0125564002147 (public on Creden).

**R6 (bonus). /sports-shirt/ and other use pages: add one fact line under the H1**
> เสื้อกีฬาพิมพ์ลาย ใส่ชื่อ-เบอร์รายคนได้ · ขั้นต่ำ 10 ตัว · ผลิต 15–20 วัน · ราคาเริ่ม 279 บาท/ตัว รวม VAT (⚠ same confirmation as R2)

### 5. Current AI visibility (retrieval simulation)

**Limitation:** the WebSearch tool uses a US-region index, so Thai coverage is thinner than Google TH. These results show what a retrieval-based assistant using a similar index would see. **I have no direct evidence of what ChatGPT, Gemini or Perplexity answer.**

| Query | TEAMDEE cited? | Who appeared instead | Why they get picked |
|---|---|---|---|
| แนะนำร้านรับทำเสื้อโปโลปักโลโก้ นนทบุรี | No | yellowpages.co.th listings; a Google Business listing (Lam Luk Ka, Pathum Thani, 4.3★ from 6 reviews); thanaplus | Directory and GBP entries with location data |
| สั่งทำเสื้อทีมขั้นต่ำกี่ตัว | No | A LINE OA shop ("ไม่มีขั้นต่ำ / 10 ตัว"); foreign MOQ guides | A literal MOQ sentence |
| เสื้อพิมพ์ลายทั้งตัวราคาเท่าไหร่ | No | A LINE showcase with per-colour prices; foreign AOP sites | Explicit prices in text |
| best custom team shirt maker Thailand | No | sourceready.com, NTCC directory (Stork Print), chinaimportal list, Yokkao | English-language directories and listicles |
| รับทำเสื้อกีฬาสี | No | yellowpages.co.th; foreign teamwear | Directory entry |
| รับทำเสื้อโปโล ปักโลโก้ ขั้นต่ำ 10 ตัว ราคา รวม VAT (extended) | No | polozy.com, 12tees.com, mixprint.com, goodthinkdesign.com, abcpolo.com, poloicon.com, fastwork | Plain-text MOQ, price per piece with quantity, a VAT statement and a "last updated" date (12tees: "ขั้นต่ำ 30 ตัว", "ยังไม่รวม VAT 7%", "20–25 วันทำการ", update 27 Oct 2026) |
| รับทำเสื้อพิมพ์ลายทั้งตัว sublimation ราคาต่อตัว ขั้นต่ำ (extended) | No | pimlai.in.th (guide plus homepage "ขั้นต่ำ 5 ตัว"), kdc-x.com (cost article), goldensport.co.th, ho-shi.com | Price ladders (e.g. 250/230/220/210/190/160), guide pages titled "ฉบับสมบูรณ์ 2026" |
| TEAMDEE เสื้อทีม นนทบุรี / "team-dee.com" / "TEAMDEE STUDIO" / facebook.com/teamdee / TEAMDEE ตลาดขวัญ Google Maps / wikidata TEAMDEE | No | Unrelated "Team…" entities | The brand is not indexed or associated |
| ดีดี ฟินิกซ์ จำกัด นนทบุรี | Registry only | data.creden.co | Government registry mirror |

**Gap analysis:**
- The competitors that get cited publish exactly the facts TEAMDEE's new theme already has: price per piece by quantity, MOQ, VAT and lead time.
- TEAMDEE's polo ladder (220 บาท incl. VAT at 10–50) is directly comparable to 12tees (248 excl. VAT at 200).
- Today production does not state these facts cleanly. It shows "0+" stats and "โรงงาน" copy. The index does not even associate the brand name with the domain.

### 6. Off-site authority signals

| Signal | Found? |
|---|---|
| Google Maps / GBP reviews | Not surfaced by search (cannot verify without a Maps session). The GBP pin is wrong (109/20). |
| Facebook page reviews | Not surfaced. facebook.com/teamdee was not indexed in results. |
| Pantip / forums | None found |
| News / PR | None found |
| Directories (Yellow Pages TH, NTCC, sourceready, etc.) | TEAMDEE is not listed in the ones that surfaced. Competitors are. |
| Marketplaces (Shopee/Lazada/Fastwork) | None found for TEAMDEE |
| Wikidata / Wikipedia | None |
| Company registry | Creden (data.creden.co/company/general/0125564002147) |

On-site, the new theme has real customer photos, client logos (e.g. Daikin on /custom-class-shirts/), and named organisations on /about-us/ (e.g. "สภ.ปลายบาง และ สภ.บางกรวย"). These are good experience signals, but AI weighs third-party corroboration, which is almost absent.

### 7. Blog / legacy articles (12 posts on production)

I parsed all 12 from production raw HTML and read 2 through WebFetch (the size-chart guide timed out on WebFetch but was parsed through curl).

| Post | Chars | H2 | Tables | "โรงงาน" (page/body) | Author (schema) | Published / modified |
|---|---|---|---|---|---|---|
| choose-uniform-manufacturer-checklist | 9.8k | 3 | 0 | 18/16 | Teamdee | 8 Sep / 19 Oct |
| event-sports-day-t-shirt-timeline-management | 17.7k | 6 | 1 | 41/38 | admin | 5 Oct |
| garment-production-cost-structure-bulk-order | 17.6k | 5 | 2 | 29/28 | admin | 5 Oct |
| how-to-choose-garment-factory-checklist | 8.2k | 3 | 0 | 41/27 | Teamdee | 8 Sep |
| how-to-design-sportswear-color-guide | 8.0k | 3 | 0 | 5/4 | Teamdee | 8 Sep |
| how-to-start-clothing-brand-production-guide | 18.0k | 5 | 2 | 18/17 | admin | 5 Oct |
| polo-shirt-fabric-guide | 10.1k | 6 | 0 | 7/6 | Teamdee | 8 Sep |
| polo-shirt-size-chart-uniform-guide | 12.8k | 5 | 2 | 7/6 | admin | 5 Oct |
| shirt-production-techniques-guide | 9.6k | 4 | 1 | 2/1 | Teamdee | 8 Sep |
| sports-running-shirt-fabric-guide | 12.9k | 5 | 1 | 1/0 | admin | 5 Oct |
| sublimation-sportswear-designs | 8.6k | 4 | 0 | 4/3 | Teamdee | 8 Sep |
| what-is-dft-shirt-printing-durability-guide | 17.6k | 7 | 1 | 2/1 | admin | 5 Oct |

"Body" counts include the header chrome "TEAMDEE - โรงงานผลิตเสื้อผ้าครบวงจร". There are about **147 uses** of "โรงงาน" in the bodies, concentrated in 5 posts: event-sports-day (38), garment-cost (28), how-to-choose-garment-factory (27; the slug itself contains "factory"), how-to-start-clothing-brand (17) and choose-uniform-manufacturer (16).

**Assessment as citable sources:**
- **Author:** "admin" or "Teamdee", with no name, role or bio. The theme's `single.php` shows no author. E-E-A-T is weak.
- **Dates:** a published date is present (2 batches: 8 Sep and 5 Oct 2026). Only one post shows a meaningful modified date.
- **Depth:** 8–18k chars and some comparison tables (DFT vs DTG vs screen). The structure is decent: H2s and a few question-style headings.
- **Originality and sourcing (main problem):** the prose is generic, AI-flavoured industry copy ("สมการต้นทุนมาตรฐานสากล", "ระดับอุตสาหกรรม"). It makes precise but **unsourced** numerical claims:
  - "ค่าเนื้อผ้า 55%–70%" in the cost post
  - "50–60 รอบซัก", "35–45 cycles", "30% color loss within 20 washes"
  - "ผ่านรอบทดสอบครบ 10 รอบ"

  Those last claims cite AATCC TM61-2A but give no lab, sample size or method. The size guide links to store.astm.org. That is a source, but not one applied to TEAMDEE data. AI models may cite this content once, but it is a liability: unverifiable claims under the brand name.
- **Contradiction:** the DFT post says "ขั้นต่ำ 10 ตัว", while the site, FAQ and /screen-printing/ say "สกรีน DFT ไม่มีขั้นต่ำ เริ่ม 1 ตัว". The post itself also says DFT suits "1–300 ตัว". AI retrieval may surface the wrong MOQ.
- **First-hand experience:** almost none (no TEAMDEE order examples, photos of their own work, or their own measurements). The new site has far better first-hand material (real customer photos, real machine footage, price tables) than the blog.

---

## Phase 4: Findings (ranked)

| # | Severity | Finding | Evidence | Conf. | Fix | Owner |
|---|---|---|---|---|---|---|
| 1 | HIGH | Two conflicting business entities after launch (Rank Math "TEAMDEE STUDIO - โรงงาน…" @id /#organization at 109/20 vs theme TEAMDEE / ดีดี ฟินิกซ์ @id /#business at 264). The GBP pin also points to 109/20. | Prod JSON-LD (curl, GPTBot UA). seo-schema.js `@id abs('/#business')`. No `rank_math/json_ld` filter in functions.php. site.json mapUrlNote | 85% | Rank Math > Titles & Meta > Local SEO: set name "TEAMDEE", legal name, address 264, phones, hours, logo and social profiles. **And** in the theme, either change @id to `/#organization` or add a `rank_math/json_ld` filter that removes Rank Math's Organization node when the theme prints its own. พี่ทัช fixes the GBP pin to 264. | Art (Rank Math) + theme code + พี่ทัช (GBP) |
| 2 | HIGH | TEAMDEE is invisible in AI retrieval. It was not cited in any of 13 queries, and even brand and domain queries return nothing. | WebSearch results above | 75% (the index is US-region) | Launch the new theme. Do findings 3, 5 and 6. Register in Google Search Console and Bing Webmaster (Bing feeds ChatGPT and Copilot search). Submit the sitemap to both. | Art |
| 3 | HIGH | /sublimation/ (the main product) and the homepage state no per-shirt price. Competitors with explicit ladders are cited for "เสื้อพิมพ์ลายราคาเท่าไหร่". | Raw HTML: 0 occurrences of 279/329/359 on /sublimation/. prices.json has the print ladder. print.json `[รอยืนยัน]` | 90% | Confirm the price, then render the print price table (as on /embroidery/) plus answer block R2. Add a price line to the homepage (R1/R4). | Art confirms → theme/content change |
| 4 | HIGH | Off-site corroboration is almost zero: no Wikidata, no directory listings, no forum mentions, and GBP not surfaced. | Searches; only the Creden registry was found | 80% | Create or verify GBP (correct pin, categories, photos, ask real customers for reviews; no fake reviews). Add Yellow Pages TH and other Thai B2B directory listings with identical NAP. Create a Wikidata item (instance of: business; country TH; HQ Nonthaburi; inception 2021; official website; with the registry as reference). Add the GBP URL and Wikidata URL to sameAs. | Art / พี่ทัช (off-site) + theme (sameAs) |
| 5 | HIGH | Legacy blog posts are weak citation sources with brand risk. Author "admin"; unsourced statistics; DFT MOQ contradiction (10 vs 1); about 147 "โรงงาน". | posts/*.html parse; WebFetch of the DFT post | 90% | Edit the 12 posts in WP. Remove or reword "โรงงาน" (start with the 5 heaviest). Fix the DFT MOQ to "เริ่ม 1 ตัว". Delete or qualify unsourced percentages and wash-cycle numbers unless TEAMDEE can show its own test. Create a real author profile (name, role, years) ⚠ owner decides who. Add TEAMDEE's own photos and examples. | Art (WP content) |
| 6 | MEDIUM | No llms.txt or llms-full.txt. | 404 on prod and local | 95% | Ship /llms.txt (draft below) as a static file in the theme with a rewrite rule, or upload it to the web root. Keep it in sync with site.json and prices.json. | Theme code (preferred) or Art (file upload; Hostatom access unknown) |
| 7 | MEDIUM | LocalBusiness only on `/` and `/about-us/`. No WebSite schema. No Service/Offer for priced products. Blog posts have no theme Article schema and no visible author. | context.js:80-81. Raw JSON-LD per route. single.php | 85% | Emit a slim Organization reference (`{"@id": ".../#organization"}`) sitewide. Add `Service` + `Offer`/`AggregateOffer` (lowPrice/highPrice, priceCurrency THB, eligibleQuantity) on product pages from prices.json. Add a BlogPosting fallback with author in single.php when there is no SEO plugin. | Theme code |
| 8 | MEDIUM | The homepage and product heroes lead with taglines, not facts. There is no "TEAMDEE คือ…" sentence anywhere. | Raw text after the H1 on /, /custom-class-shirts/, /sublimation/ | 80% | Add R1 under the home H1 and R5 on /about-us/. | Content (src/data) |
| 9 | MEDIUM | Use pages (/sports-shirt/, /custom-class-shirts/, …) lack MOQ, price or lead time. Queries like "รับทำเสื้อกีฬาสี" land on pages with no answer. | Raw grep: /sports-shirt/ has 0 MOQ, 0 lead, 0 price | 85% | Add one fact line per use page (R6) from prices.json and lead-times.json. | Theme/content |
| 10 | MEDIUM | Price tables have no "updated" date, and the 6 embroidery tables share an identical generic caption. | Raw table captions | 75% | Put the fabric name in `<caption>`. Show "อัปเดตราคา <date>" sourced from prices.json (new field). | Theme code + Art (date) |
| 11 | MEDIUM | Claimed numbers conflict across sources (2,800+ องค์กร / 10,000+ งาน vs 5,000+ ทีม on prod vs proof candidates 5,000+ / 500,000+). | Raw pages; prod homepage; site.json proof | 75% | Owner picks one verified set and uses it everywhere (site, GBP, Facebook "about", llms.txt). | Art + พี่ทัช |
| 12 | MEDIUM | Production raw HTML says "0+ Years Experience, 0+ Projects Completed, 0+ Pieces Produced", so a crawler reads zeros today. | b_GPTBot.html | 90% | Fixed by the new theme (sr-only values). Prioritise the launch. | Launch |
| 13 | LOW | Bytespider receives a 403 from nginx (hosting-level), while CCBot and Meta are allowed. | h_Bytespider.txt | 90% | Decide policy deliberately. Optionally add explicit robots rules for training-only bots if the owner wants to opt out of training while staying in AI search (keep OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot and Googlebot allowed). | Art / host |
| 14 | LOW | Production `lang="en-US"` on Thai pages. The sitemap lists /thank-you/ and /test-page/. | Prod HTML, page-sitemap.xml | 95% | The new theme already uses `lang="th"`. In Rank Math, noindex /thank-you/ and delete /test-page/. | Art |
| 15 | INFO | A FAQ item uses the word "ภาพจำลอง" ("ภาพจำลองแบบเสื้อต่างจากเสื้อตัวอย่างไหม"). It is not an image label, but Art removed that wording site-wide on 16 Nov. | faq.json | 70% | Art decides whether to reword it to "ภาพ 3D". | Art |

Things that work and need no change: robots.txt for AI bots; server-side prices, MOQ, lead times, FAQ and size tables in the new theme; all 113 design codes in the HTML; FAQPage, BreadcrumbList, ItemList and VideoObject schema; NAP consistency inside the new theme; legal name and registration date on /about-us/.

---

## Proposed llms.txt (all facts taken from the repo; ⚠ = confirm before publishing)

```markdown
# TEAMDEE (ทีมดี)

> TEAMDEE รับออกแบบและผลิตเสื้อทีม เสื้อบริษัท เสื้อโปโลปักโลโก้ เสื้อพิมพ์ลายทั้งตัว และเสื้อสกรีน DFT ดำเนินการโดย บริษัท ดีดี ฟินิกซ์ จำกัด (จดทะเบียน 19 มกราคม 2021) นนทบุรี ประเทศไทย · ดูแลงานเสื้อทีมตั้งแต่ปี 2018 · ส่งฟรีทั่วประเทศ

## ข้อมูลบริษัท
- ชื่อแบรนด์: TEAMDEE (ทีมดี) · ผู้ดำเนินการ: บริษัท ดีดี ฟินิกซ์ จำกัด
- ที่อยู่: 264 ถนนเลี่ยงเมืองนนท์ ตำบลตลาดขวัญ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000 (เข้าพบตามนัด)
- โทร: 097-549-5941 · สำรอง 086-416-6449 · LINE: https://line.me/R/ti/p/@teamdee
- เวลาทำการ: ทุกวัน 08:30–21:00 น.
- Facebook: https://www.facebook.com/teamdee · Instagram: https://www.instagram.com/teamdee_
- เอกสารที่ขอได้: ใบเสนอราคา, หนังสือรับรองบริษัท, ภ.พ.20, ใบกำกับภาษีเต็มรูปแบบ, ใบส่งของ

## เงื่อนไขหลัก
- สั่งขั้นต่ำ 10 ตัว · เสื้อสกรีน DFT เริ่ม 1 ตัว
- ราคารวม VAT 7% · ทุกไซซ์ราคาเดียว · ส่งฟรีทั่วประเทศ
- ชำระ: มัดจำ 50% · โอน / PromptPay / บัตร Visa, Mastercard / วางบิล
- ระยะผลิต (นับจากวันถัดจากยืนยันแบบ): งานปัก 10–15 วัน · พิมพ์ลายทั้งตัว 15–20 วัน · สกรีน DFT 3–14 วัน · ต.ค.–ม.ค. เผื่อเพิ่ม 5–7 วัน · งานด่วนเร็วสุด 7 วัน ไม่มีค่าเร่ง
- ขึ้นแบบ 3D ให้ดูก่อนผลิตทุกงาน · ขอชิ้นผ้าตัวอย่างได้ไม่มีค่าใช้จ่าย
- เคลมงานผลิตฟรี แจ้งภายใน 7 วันหลังรับสินค้า · สั่งเพิ่มแบบเดิม ราคาเดิม ภายใน 30 วัน

## ราคาเริ่มต้นต่อตัว (รวม VAT ที่จำนวนขั้นต่ำ)
- โปโลปักโลโก้ (รวมปัก 1 จุดหน้าอก): ผ้าจูติ 220 · TC/ทรีคอต/ปีเก้ 260 · Endurance 350 · ดรายเทค 390 บาท (ลดตามจำนวน ถึง 170–300 บาทที่ 2,001 ตัวขึ้นไป)
- เสื้อพิมพ์ลายทั้งตัว: คอกลม/คอวี 279 · คอปก 329 บาท (10–20 ตัว) ถึง 160 / 210 บาทที่ 200 ตัวขึ้นไป ⚠
- เสื้อเบสบอล / เจอร์ซีย์ Oversize: 359 บาท (10–20 ตัว) ถึง 230 บาท (501–999 ตัว)
- เสื้อสกรีน DFT (รวมสกรีน 1 จุด): Premium C32 290 · Oversize C20 320 บาท (1–20 ตัว) ถึง 220 / 250 บาท (301–500 ตัว)
- ออปชัน: แขนยาว +30 · ทรง Oversize +40 · กระเป๋าอก +20 บาท/ตัว

## หน้าหลัก
- [เสื้อโปโลปักโลโก้](https://team-dee.com/embroidery/): ผ้า 6 ชนิด ตารางราคา ตารางไซซ์ XS–11XL
- [เสื้อพิมพ์ลายทั้งตัว](https://team-dee.com/sublimation/): ผ้า 14 ชนิด คอ 13 ทรง ขั้นตอน 6 ขั้น
- [เสื้อสกรีน DFT](https://team-dee.com/screen-printing/): ไม่มีขั้นต่ำ ราคาตามจำนวนและจุดสกรีน
- [เสื้อเบสบอล](https://team-dee.com/custom-baseball-shirts/) · [เจอร์ซีย์ Oversize](https://team-dee.com/custom-oversize-jerseys/) · [เสื้อวอร์ม](https://team-dee.com/custom-printed-warmup-shirts/)
- [คำนวณราคาเบื้องต้น](https://team-dee.com/calculations/)
- [ตารางไซส์เสื้อ](https://team-dee.com/size-chart/): นิ้วและเซนติเมตร
- [คำถามที่พบบ่อย](https://team-dee.com/faq/): 32 ข้อ
- [แบบเสื้อพร้อมรหัส TD](https://team-dee.com/designs/): 113 แบบ
- [รู้จักทีมดี](https://team-dee.com/about-us/) · [ติดต่อ](https://team-dee.com/contact-us/)

## ตามกลุ่มลูกค้า
- [เสื้อบริษัท / องค์กร](https://team-dee.com/corporate/) · [สถานศึกษา](https://team-dee.com/education/) · [กีฬา](https://team-dee.com/sport/) · [อีเวนต์](https://team-dee.com/event/)

## คู่มือ
- [เลือกผ้าเสื้อทีม](https://team-dee.com/team-shirt-fabric-guide/) · [โปโลปัก vs เสื้อพิมพ์ลาย](https://team-dee.com/polo-vs-printed-shirts/) · [เช็กลิสต์ก่อนสั่ง](https://team-dee.com/team-shirt-order-checklist/) · [เตรียมไฟล์งาน](https://team-dee.com/artwork-preparation-guide/)
```

Notes:
- Publish only after the new theme is live, because these URLs and prices describe the new site.
- Generate the file from `site.json`, `prices.json` and `lead-times.json` at build time so it cannot drift.
- The "เคลม 7 วัน / สั่งเพิ่ม 30 วัน" lines come from the homepage guarantee copy; the owner should confirm they are public policy.
- Prices: the screen-printing page shows a 51–100 band at 260 and 301–500 at 220. That matches prices.json Premium.

---

## Phase 5: Action plan

### Quick wins (≤ 1 day each)

| # | Action | Who |
|---|---|---|
| Q1 | Rank Math Local SEO: name "TEAMDEE", legal name, address 264, phones, hours, logo, social profiles (LINE/FB/IG). Remove "STUDIO - โรงงาน…" from the org name. | Art (WP admin) |
| Q2 | Theme: align the LocalBusiness @id with Rank Math (`/#organization`), or filter out Rank Math's org node. Emit the Organization reference on every page. | Theme code |
| Q3 | Add a /llms.txt generated from site.json, prices.json and lead-times.json (draft above). | Theme code |
| Q4 | Home definitional lead (R1) and /about-us/ fact box (R5). | Content change (src/data) |
| Q5 | Fix the DFT post MOQ (10 → "เริ่ม 1 ตัว") and remove "โรงงาน" from the 5 heaviest posts. | Art (WP posts) |
| Q6 | Fix the GBP pin to 264 and add the GBP URL to sameAs. | พี่ทัช (GBP) → theme (sameAs) |
| Q7 | Add Bing Webmaster Tools and submit the sitemap. GSC is already obtained. | Art |
| Q8 | In Rank Math, noindex /thank-you/ and delete /test-page/. | Art |

### Bigger work (1–3 weeks)

| # | Action | Who |
|---|---|---|
| B1 | Confirm the sublimation price, then add a price table and answer block on /sublimation/ (R2), a FAQ price line (R4) and use-page fact lines (R6). | Art confirms → theme/content |
| B2 | Service + Offer/AggregateOffer schema per product from prices.json (THB, VAT-inclusive note, eligibleQuantity bands). Captions with fabric names. A price "updated" date. | Theme code |
| B3 | BlogPosting fallback plus a visible author in single.php. Create a real author profile in WP ⚠ owner names the person. | Theme code + Art |
| B4 | Rewrite the 12 legacy posts: remove unsourced statistics or replace them with TEAMDEE's own observations, add their own photos and order examples, add question-style H2s with a direct first-sentence answer, add "อัปเดต" dates. Remove "โรงงาน". | Art |
| B5 | Off-site: verified GBP with real customer reviews (ask customers; never write reviews), Yellow Pages TH and other Thai B2B directory listings with identical NAP, a Wikidata item referencing the registry, and Facebook "About" text matching the site. | Art / พี่ทัช |
| B6 | Pick one verified set of proof numbers (customers, projects, pieces) and use it everywhere. | Art + พี่ทัช |
| B7 | Re-run the 13-query retrieval test 4–6 weeks after launch, plus Perplexity and Google AI Overview checks in a real browser session. | Art (or a follow-up audit) |

### Regression tests (YAML, to save later as `shiplight/tests/geo-review.test.yaml`; not written into the repo per the read-only rule)

```yaml
- name: tech-01-llms-txt-present
  severity: medium
  steps:
    - URL: /llms.txt
    - js: |
        const r = await page.request.get('/llms.txt');
        if (r.status() !== 200) throw new Error('llms.txt missing');
        const t = await r.text();
        if (!t.startsWith('# TEAMDEE')) throw new Error('llms.txt must start with # TEAMDEE');
        if (/โรงงาน|ภาพจำลอง/.test(t)) throw new Error('banned word in llms.txt');
- name: tech-06-ai-crawlers-allowed
  severity: high
  steps:
    - js: |
        const t = await (await page.request.get('/robots.txt')).text();
        for (const b of ['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','PerplexityBot','Google-Extended']) {
          if (new RegExp(`User-agent:\\s*${b}[\\s\\S]*?Disallow:\\s*/\\s*$`, 'mi').test(t)) throw new Error(`${b} blocked`);
        }
- name: entity-01-single-business-node
  severity: high
  steps:
    - URL: /
    - js: |
        const nodes = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .flatMap(s => { const j = JSON.parse(s.textContent); return j['@graph'] || [j]; })
          .filter(n => [].concat(n['@type']).some(t => /LocalBusiness|Organization/.test(t)) && n.address);
        if (nodes.length !== 1) throw new Error(`expected 1 business node with address, got ${nodes.length}`);
        if (!/^264 /.test(nodes[0].address.streetAddress)) throw new Error('address must be 264');
- name: cite-02-ssr-core-facts
  severity: high
  steps:
    - js: |
        for (const [path, re] of [['/embroidery/', /220/], ['/sublimation/', /279/], ['/faq/', /10 ตัว/], ['/size-chart/', /รอบอก/]]) {
          const html = await (await page.request.get(path)).text();
          if (!re.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) throw new Error(`${path} missing ${re} in raw HTML`);
        }
```

---

## What I verified vs could not verify

**Verified (with output):**
- Production robots.txt, the llms.txt 404s, and UA responses for 9 bots (Bytespider 403).
- Production JSON-LD (TEAMDEE STUDIO, 109/20, /#organization).
- Production count-up zeros and `lang="en-US"`.
- Production sitemap content.
- Local robots.txt and wp-sitemap.
- Raw vs no-JS vs JS text on 8 routes (Playwright), plus raw greps on 7 more routes.
- JSON-LD types per route.
- NAP consistency across 12 local routes.
- All 113 design codes server-side.
- All 12 legacy posts (author, dates, "โรงงาน" count, schema). 2 posts read in detail.
- 13 web searches.
- A competitor page structure (12tees).
- The Creden registry record.

**Not verified:**
- Actual ChatGPT, Gemini, Perplexity or Copilot answers. I had no access to them, and WebSearch is US-region, so this is a proxy only.
- The Google Business Profile listing, its reviews and its rating. This needs a Maps browser session.
- Facebook page reviews (login wall).
- What Rank Math will output on top of the new theme. This is inferred from current prod output plus theme code, at 85%.
- Who set the Bytespider nginx block.
- Whether the review wall's quote text is rendered only from `data-rv-json` (low impact).
- Whether the print price ladder and the 7-day/30-day policies are approved for public use (owner confirmation needed).

skill ที่ใช้: review (references/geo.md + report-format.md) · ข้าม: Shiplight MCP (ไม่มีในเครื่อง ใช้ Playwright/curl/WebSearch แทน), webapp-testing (ใช้ Playwright script โดยตรงตามที่สั่ง)
