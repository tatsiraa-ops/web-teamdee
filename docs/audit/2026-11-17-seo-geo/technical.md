# Technical SEO Review: TEAMDEE new theme (thorough)

- **Date:** 17 Nov 2026
- **Target:** local WP preview `http://127.0.0.1:9400` (WordPress 7.1.3 Playground, theme `wp-theme/teamdee`, **no Rank Math**). Crawled anonymously: the cookie jar kept only `playground_auto_login_already_happened=1` and dropped the auto-login admin cookie, so there was no admin bar and no logged-in output.
- **Production comparison:** `https://team-dee.com` is the old Astra/Elementor site with Rank Math. It was read-only fetched (public GET only) to learn the Rank Math settings that will persist after the theme switch. Staging was not touched.
- **Scope:** all 47 routes in `build/pages.json` (plus the `404` key) at 1440×900 and 414×896 (DPR2, mobile UA), a no-JS context, raw `fetch`, 2 WP posts, 1 category, `/blog/page/2/`, ~40 variant/redirect probes, WP `robots.txt` + `wp-sitemap*.xml`, and code reading of `functions.php`, `single.php`, `templates/*`, `src/build/plugins.js`.
- **Rendering:** server-rendered (static exported HTML from Vite+Handlebars, printed by PHP), with JS enhancement only.
- **Method:** Node Playwright 1.63 (`chromium.launch({channel:'chrome', headless:true})`, no remote-debugging port, closed in `finally`). `pgrep -fl remote-debugging-port` → none after the run.
- **Artifacts (scratchpad/seo2/):** `crawl.mjs`, `crawl.json` (full extraction), `analysis.txt`, `graph.txt`, `raw/*.html` (raw responses), `links.txt`, `sm-*.txt` (sitemap URL lists).

## Overall score: 7.3 / 10 · Confidence 85%

| Category | Score | Summary |
|---|---|---|
| A · Meta & head (META) | 9/10 | All 47 routes are clean. Small issues: the 404 canonical, case variants and post pages without a plugin. |
| B · Structured data (SCHEMA) | 6/10 | JSON-LD is valid everywhere (0 parse errors). It will conflict with Rank Math's graph on production, and visible and JSON-LD breadcrumbs differ on 23 routes. |
| C · Open Graph / social (OG) | 6/10 | Complete without a plugin. With Rank Math, og:image and og:locale fall back to old-site values; 46/47 images are WebP; only the home page declares image size. |
| D · Crawlability & indexing (CRAWL) | 7/10 | Content is in the raw HTML, click depth is at most 2, the 404 page returns 404, and 301s take one hop. The Rank Math sitemap needs a page sync and there are robots-drift and case-variant gaps. |
| E · Semantic HTML & content (SEM) | 8/10 | 1 h1 and no heading skips on every page; good Thai alt text. Gallery pages are thin, there is boilerplate overlap, and some navs are unlabeled. |
| F · Technical (TECH) | 8/10 | Every page is under 500 KB (max 460 KB), there are no sync scripts, no mobile overflow and no mixed content. The LCP image on /project/ is lazy, and 2–6 render-blocking CSS files load per page. |

---

## 1. Head on every route (1440 + 414)

Evidence: `analysis.txt` § HEAD. Desktop and mobile heads were byte-identical on all 47 routes, and the raw (no-JS) head equals the rendered head, so JS changes nothing in `<head>`.

| Check | Result |
|---|---|
| `<title>` | 47/47 exactly one; 0 duplicates; indexable titles 31–64 chars; equal to `pages.json` (0 mismatches) |
| meta description | 47/47 exactly one; 0 duplicates; indexable descriptions 105–158 chars |
| canonical | 47/47 exactly one, absolute and self-referencing (`home_url(route)`). Noindex routes (/search/, /thank-you/, /polo-vs-printed-shirts/, /team-shirt-design-ideas/, /team-shirt-fabric-guide/) self-canonicalize, which is OK. |
| robots | WP `wp_robots` prints `max-image-preview:large`, plus `noindex` on the 5 noindex routes. Consistent with `pages.json`. |
| viewport / charset / lang | `width=device-width, initial-scale=1` / UTF-8 / `lang="th"` on all routes (functions.php:14-18) |
| favicon / apple-touch / theme-color | SVG favicon (200), 180×180 apple-touch PNG (200), `#FF6C00` on all routes |
| og:* / twitter:* | type, site_name, locale th_TH, url, title, description, image and image:alt on all routes; summary_large_image card. og:title = title and og:description = description on every route. og:url = `https://team-dee.com/<route>` (hard-coded; matches the canonical on production). |
| hreflang | none (correct: Thai-only site, no alternates needed) |

**og:image audit** (local files, `sips`; all 47 return 200 on the preview):
- 46 of 47 are `.webp`. Only the home page uses `og/home.jpg` (1200×630). This contradicts the intent in `src/build/plugins.js:66-67`, which says og:image stays JPG for share apps. `firstImg` (plugins.js:36) is already the `.webp` src.
- `og:image:width` and `og:image:height` are emitted only when `td-og-image` is declared (plugins.js:55), which is the home page only.
- The 11 use/product heroes are 1280×444 (2.88:1), so Facebook and LINE centre-crop them. /custom-baseball-shirts/ (810×1080) and /custom-oversize-jerseys/ (811×1080) are portrait. /blog/ and /faq/ use 760×760.
- `design/d05.webp` is shared by 7 pages (artwork guide, delivery guide, event-shirts, organization designs, screen-printing guide, size-chart, search).
- `og:image:alt` repeats the page title rather than describing the image.

## 2. Crawlability

### robots.txt and sitemaps (local, WP core, no Rank Math)
```
User-agent: *  Disallow: /wp-admin/  Allow: /wp-admin/admin-ajax.php
Sitemap: http://127.0.0.1:9400/wp-sitemap.xml          (/sitemap.xml → 301 → wp-sitemap.xml)
wp-sitemap index: posts-post-1 (11), posts-page-1 (62), taxonomies-category-1 (3), users-1 (1)
```
- All 42 indexable routes are in the page sitemap, and none of the noindex routes are. The `wp_sitemaps_posts_query_args` filter (functions.php:449-456) works.
- **Junk in the sitemap:** `/author/admin/` (users provider not disabled), `/category/uncategorized/`, `/hello-world/`, `/sample-page/`, a WP-default "Privacy Policy" stub, plus 20 stale local Pages from pre-v22 slugs (/about/, /contact/, /projects/, /guide-artwork/ … /solutions/). All 20 return 200 with the index.php placeholder "หน้านี้ยังไม่มีเนื้อหาที่พร้อมแสดง…" and are indexable.
  - These stale pages are **local-DB only**: production returns 404 or an RM 301 for them (/about/ → /about-us/, /contact/ → /contact-us/, /sports/ → an article, others 404).
- **Production (Rank Math, persists after the switch):** `sitemap_index.xml` covers post, page and category sitemaps. The current page-sitemap has 26 URLs, including /thank-you/, /test-page/, /pdpa/, /services/ and /production-techniques/. After install, the theme filter `rank_math/sitemap/entry` (functions.php:445-448) removes the noindex routes and the TD_RETIRED routes, which is correct.
  - **But** Rank Math lists only real WP posts. Theme routes served via `td_fallback` (no WP Page; e.g. /faq/ is 404 on production today) are **absent from the sitemap** until Tools › หน้าจากต้นแบบ › "สร้างหน้าที่ยังไม่มี" runs (functions.php:793-824). See finding H3.

### Variants and redirects (curl, anonymous)
| Request | Result |
|---|---|
| `/faq`, `/embroidery`, `/sports-running-shirt-fabric-guide` | 301 → trailing slash (1 hop). Good. |
| `/FAQ/`, `/EMBROIDERY/`, `/Embroidery/` | **200**, rendering the *WP Page placeholder* via index.php (69 KB, h1 "คำถามที่พบบ่อย", body "หน้านี้ยังไม่มีเนื้อหา…"). The canonical points to the lowercase URL. Production `/EMBROIDERY/` is also 200. |
| `/Faq` | 301 → `/Faq/` → 200 placeholder |
| `/faq/?utm_source=x`, `/designs/?x=1`, `/custom-class-shirts/?page=2` | 200, canonical to the clean URL. OK. |
| `/?p=1` | 200, renders "Hello world!" (no canonical redirect, because functions.php:393-395 returns `false` for any request whose path is a theme route; `/` is one) |
| `/?s=polo` | 200 noindex, title "Search Results for…", h1 **"Archives"** (index.php:18 uses `get_the_archive_title()`) |
| `/?author=1`, `/author/admin/`, `/2026/` | 200 indexable WP archives ("Author: admin", "Year: 2026") |
| `/page/2/` | 200, title "TEAMDEE (ในเครื่อง) – Page 2", no canonical |
| `/blog/page/2/` | 200 placeholder ("หน้านี้ยังไม่มีเนื้อหา…"), canonical → /blog/ |
| `/does-not-exist/`, `/custom-class-shirts/xyz/`, `/blog/xyz/`, `/404` | **404** + noindex, theme 404 page, but `canonical = http://127.0.0.1:9400/404` |
| `/pdpa/` → /privacy-policy/, `/services/` and `/serviecs/` → /, `/production-techniques/` → /shirt-production-techniques-guide/ | 301, 1 hop |
| Production `http://www.team-dee.com/` | 301 → https://www → 301 → apex (2 hops; server-level) |

### Raw HTML compared with rendered HTML (key pages)
Main-text token diff between the no-JS DOM and the rendered DOM (`analysis.txt` § Raw):
- **/** (32.6k chars raw), **/embroidery/** (35.4k), **/sublimation/** (35.1k), **/designs/**, **/faq/** and **/calculations/** all have their content server-side.
- The only JS-only text is UI chrome: carousel counters `3←→`, "เปิดอยู่" status pills, gallery "แสดง 24 จาก … ดูเพิ่มอีก" and filter counts.
- **FAQ:** /faq/ has 35 `<details>` with all answers in the raw HTML (8,666 chars). FAQPage JSON-LD has 32 Q&A, server-side.
- **Prices:** the /embroidery/ per-fabric tier tables (220/210/195/190/180/170) and the /screen-printing/ tables (290→220, plus additional-print-point prices) are in the raw HTML.
- **Exception:** the /calculations/ quantity-tier list ("10–50 220 · 51–200 210 · 201–500 195 …"), the option add-ons and the estimate summary are **JS-built**. In the raw HTML they are placeholders ("ราคาต่อตัว– … ยอดรวม–").
- **Count-up:** the raw HTML carries the final stats (8 ปี / 2,800+ / 10,000+). The rendered snapshot shows "0" mid-animation, but the sr-only text keeps the real numbers. Harmless.
- **Gallery pages:** all 24+ items are present raw. JS hides the extras visually, which is good for crawling.
- **Links:** rendered pages add only `#` buttons and LINE deep links. No internal page link exists only in JS.

## 3. Internal linking (BFS over raw-HTML links from /)
Full table in `graph.txt`.
- **Click depth:** every indexable route is at depth **1 or 2**. Depth 1 means it is in the header, footer or home main area. The 10 gallery pages, /polo-vs-printed-shirts/, /team-shirt-design-ideas/ and /team-shirt-fabric-guide/ are at depth 2. /thank-you/ is unreached (fine, noindex).
- **Weak pages:** each gallery page gets only **2 inbound pages** (its use page plus /designs/). /corporate-shirts/ gets 3. None are in the header or footer.
- **/team-shirt-order-checklist/:** now has 14 inbound pages, from the use pages plus the articles.
- **Nav coverage:** the header has 31 unique targets and the footer 21. Routes in neither: the 10 galleries, the 3 noindex articles, /search/ and /thank-you/.
- **Anchor text:** 0 generic anchors ("ดูเพิ่ม", "อ่านต่อ", "คลิกที่นี่" …), 0 empty internal links and 0 internal nofollow. Anchors are descriptive, e.g. "ดูรายละเอียดแบบเสื้อแบด →", "สั่งทำเสื้อโปโลปัก". The single "ดูแบบเสื้อ" is acceptable.
- **Non-theme targets linked sitewide:** `/collar-styles/` (51 pages), `/privacy-policy/` (51) and `/terms-conditions/` (51). These are WP content pages rendered by `index.php`. Locally they are empty placeholders; on production they are legacy pages (200). Verify how they render on staging (L5).
- **Broken locally (404), 200 on production:** /what-is-dft-shirt-printing-durability-guide/ (linked from / and /blog/), /sublimation-sportswear-designs/, /category/sportswear-sublimation/. This is a local DB gap only.
- **Breadcrumbs:** visible on 45/47 (missing on / (correct) and /designs/). Inconsistent depth: use pages read "หน้าแรก / เสื้อบริษัท", product pages read "หน้าแรก / สินค้าและบริการ / เสื้อโปโลปัก" (the middle crumb has no hub page), and galleries read "หน้าแรก / แบบเสื้อ / …". See also B.

## 4. Semantic HTML
- **Headings:** exactly 1 h1 on all 47 routes and the 2 posts, at desktop and at 414. The first heading is h1 everywhere. **0 level skips** across all pages.
- **Landmarks:** 1 `main`, 1 page `footer` and a labelled main nav ("เมนูหลัก", "เมนูมือถือ", "เส้นทางหน้า") on every page. **3 `<nav>` without aria-label** on every page (footer columns).
- **Tables:** real `<table>` with `<th>` and `<caption>` on product, guide and size-chart pages. The table on /polo-vs-printed-shirts/ has no caption. The 8-row spec table in the WP post /sports-running-shirt-fabric-guide/ has 0 `<th>` (CMS content).
- **Lists:** ul/ol/dl used throughout (e.g. 51 `ul` on /sublimation/).
- **Images:** 0 missing `alt` attributes on all pages. Alts are Thai and descriptive (median 57 chars on home), e.g. "ภาพ 3D เสื้อโปโลสีกรมแขนขาว ปักโลโก้ SCG สีแดงที่อก…". English alts are only customer brand names (Kubota, Daikin…), which is correct.
  - Empty alts are mostly icons (decorative, fine) plus **24 customer review photos on / and 12 on /project/**.
  - On / the same alt repeats up to 26 times ("แบบเสื้อคณะ งานพิมพ์ลายที่ทีมดีออกแบบ ด้านหน้าและด้านหลัง").
- **LCP elements:** heroes use `fetchpriority="high"` and no lazy-loading on every use and product page, at both widths.
  - **Exception:** on /project/ at 1440 the LCP is `img/customer/lc37-480.webp` with `loading="lazy"`.
  - Gallery pages use an eager image without fetchpriority (fine).
  - /blog/'s LCP is an absolute production URL (`https://team-dee.com/wp-content/uploads/2026/10/Artboard-4@2x-768x384.png`), from build-time legacy posts.

## 5. URL structure
- All slugs are lowercase English kebab-case with trailing slashes. There are no IDs or hashes.
- Naming is mixed: `custom-*-shirts` for use pages, `*-shirt-designs` for galleries, but `educations-shirt`, `sports-shirt` and `corporate-shirts` are legacy slugs kept for equity (in the production sitemap). This is acceptable; renaming would cost redirects.
- **hreflang:** not needed (Thai only, one domain).
- `og:locale th_TH` is correct without a plugin. With Rank Math it becomes `en_US` (H1).

## 6. Technical
- **HTML size (raw bytes):** / 460 KB, /project/ 427 KB, /sublimation/ 347 KB, /embroidery/ 335 KB, /designs/ 310 KB, use pages ~220–237 KB, others 52–155 KB. **No page exceeds 500 KB.**
  - On /, the inline review JSON is 19 KB, inline SVG 36 KB, `srcset` attributes 45 KB and class attributes 34 KB. The text-to-HTML ratio is about 4%, normal for this design.
- **Render-blocking:** 0 sync `<script>` in head; all app JS is `type="module"`, which is deferred. There are 2–6 blocking stylesheets per page. `site-extras` and `review-wall` CSS load on **every** page, including ones with no review wall (/faq/, /thank-you/). Fonts are preloaded (Thai and Latin woff2).
- **Mobile:** viewport present; `scrollWidth − clientWidth = 0` at 414 on all 47 routes; one h1 at mobile.
- **404:** real HTTP 404 plus noindex plus the theme 404 page. The only issue is the `/404` canonical (L1).
- **Mixed content:** 0 `http://` sub-resources (other than the local host).
- **TTFB (local Playground):** about 310–360 ms.
- **WP article pages** (`single.php`, `td_chrome`), checked on /sports-running-shirt-fabric-guide/ and /polo-shirt-fabric-guide/:
  - 200, 1 h1, visible breadcrumb "หน้าแรก / บทความและไอเดีย / <category>", self canonical (WP core), `lang="th"`, related-posts h2, end CTA.
  - `td_cms_asset_head` (functions.php:459-470) correctly strips the /blog/ hub title, meta, canonical and JSON-LD.
  - **Without Rank Math (local):** no meta description, no og:/twitter:, no Article or BreadcrumbList JSON-LD, title 113 chars with the "– TEAMDEE (ในเครื่อง)" suffix. The TOC anchors are JS-built.
  - Production Rank Math will supply description, OG and Article schema; its breadcrumb schema will differ from the visible one ("Home" > post, with no /blog/ level).
  - Category archive (/category/fabric-technique/): no description and no canonical without a plugin.

## 7. WordPress + Rank Math interplay (code reading + production observation)

What production Rank Math outputs today (it keeps doing so after the theme switch):
- `og:locale en_US`, `og:image https://team-dee.com/wp-content/uploads/2026/06/Teamdee-ปัก.jpg` on /embroidery/.
- JSON-LD `@graph` with `["Person","Organization"]` `@id #person` "TEAMDEE STUDIO", `WebSite` (publisher #person, `inLanguage en-US`, SearchAction `?s=`), `WebPage`, and `BreadcrumbList` "Home" > "เสื้อปัก".
- Robots `index, follow, max-snippet:-1…`.
- Sitemap index with post, page and category sitemaps.

| Area | Theme behaviour with Rank Math active | Risk |
|---|---|---|
| Title | `rank_math/frontend/title` → pages.json title (functions.php:322); `pre_get_document_title` is skipped (402-406) | OK |
| Description | `rank_math/frontend/description` → pages.json (331); theme meta is skipped (476) | OK |
| og/twitter title+desc | filtered (323-324, 332-333) | OK |
| **og:image / og:image:alt / width / height / og:locale / twitter:image** | **Theme deletes ALL its own `og:*` and `twitter:*` lines** (481), so Rank Math's image is used: the old featured image, the RM default image, or the first image in the legacy Elementor `post_content` still in the DB. `og:locale` becomes en_US. Pages created by `td_sync_pages` have no thumbnail, so they get the RM default image. | **H1** |
| **JSON-LD** | The exported head and body (479-482) print LocalBusiness `#business`, BreadcrumbList and FAQPage unconditionally. **No `rank_math/json_ld` filter.** Result: two business entities ("TEAMDEE STUDIO" Person/Organization `#person` against "TEAMDEE" LocalBusiness `#business`), two BreadcrumbLists per page ("Home…" against "หน้าแรก…"), `inLanguage en-US`, WebSite publisher pointing at a Person. | **H2** |
| Canonical | `rank_math/frontend/canonical` overridden only for `td_fallback` routes (310-315, 334); otherwise RM uses the Page permalink, which is the same URL | OK |
| Robots | priority-5 filter forces index only when `td_fallback` (343-349); priority-10 forces noindex for noindex routes (441-444). **Routes that have a WP Page use the stored `rank_math_robots`,** which `td_sync_pages` writes once at creation (818) and never updates. A page synced while it was noindex (e.g. /team-shirt-order-checklist/ before today) stays noindex. | **H3b** |
| Sitemap | `rank_math/sitemap/entry` removes noindex, TD_NOINDEX_SLUGS and retired routes (445-448). RM enumerates posts only, so **fallback routes are missing** until pages are synced. `lastmod` = the stub Page's `post_modified`, which never changes when the theme updates. | **H3a**, L |
| Breadcrumbs | The theme renders its own visible breadcrumbs; RM's breadcrumb schema is enabled on production (see JSON-LD) | H2 |
| 404 handling | `pre_handle_404` (300-307) prevents RM from classifying fallback routes as 404 (fix of 16 Nov) | OK |
| Search | RM WebSite SearchAction targets `/?s=`, which renders index.php ("Search Results for…", h1 "Archives") instead of the theme /search/ | L |
| Icons | Production has a WP Site Icon (`/favicon.ico` → `cropped-teamdee-LOGO-20-2-32x32.png`), so `wp_site_icon()` adds icon and apple-touch links next to the theme's | L |
| Retired URLs | template_redirect 301 (992-999) runs at priority 8, before RM Redirections. RM's existing redirects (/about/, /contact/, /sports/) remain. | OK |

---

## Findings (ranked)

| # | Sev | Finding | Evidence | Conf | Fix |
|---|---|---|---|---|---|
| H1 | HIGH | With Rank Math, page share images fall back to old-site images and og:locale becomes en_US | functions.php:481 strips every `og:`/`twitter:` line; production /embroidery/ `og:image …/2026/06/Teamdee-ปัก.jpg`, `og:locale en_US` | 85% | Strip only title, description, url, type and site_name lines. Keep the theme's `og:image*`, `og:locale` and `twitter:image`, and switch off RM's for `td_current()` pages, e.g. `add_action('rank_math/head', …)` that removes RM's opengraph image output, or filters `rank_math/opengraph/facebook/og_image*` and `…/twitter/twitter_image` returning ''. Verify on staging with the FB Sharing Debugger. |
| H2 | HIGH | Duplicate or conflicting JSON-LD once Rank Math is active: 2 business entities, 2 BreadcrumbLists, inLanguage en-US | functions.php:479-482 (no `rank_math/json_ld` filter); production graph `#person` "TEAMDEE STUDIO" + BreadcrumbList "Home" | 85% | Add `add_filter('rank_math/json_ld', …)` for `td_current()` pages: drop RM `BreadcrumbList` and Person/Organization, point `WebSite.publisher` to `https://team-dee.com/#business`, set `inLanguage` to `th`. Alternatively change RM Knowledge Graph to Organization "TEAMDEE" and disable RM breadcrumbs. |
| H3a | HIGH (launch step) | Theme routes without a WP Page are missing from the RM sitemap | RM sitemap = WP posts; production page-sitemap has 26 URLs against 42 indexable routes; production /faq/ is 404 today; functions.php:793-824 | 80% | Run "สร้างหน้าที่ยังไม่มี" immediately after activation (it is in the launch-plan at 08:15). Then confirm the page-sitemap contains all 42 routes. |
| H3b | MEDIUM | Robots drift: Pages keep the `rank_math_robots` from when they were created; force-index applies only to fallback routes | functions.php:818 (written once), 343-349 (`td_fallback` only) | 65% | Apply the priority-5 index override to every `td_current()` route without noindex, or have the sync tool update `rank_math_robots` on existing pages. Re-check /team-shirt-order-checklist/ on staging. |
| M1 | MEDIUM | og:image is WebP on 46/47 pages, has dimensions only on home, uses a 2.88:1 or portrait ratio on 13 pages, and d05.webp is shared by 7 pages | plugins.js:36, 55, 66-67; sips table in §1 | 75% (LINE WebP support 60%) | Generate a 1200×630 JPG per key route (as for home) and declare it via `td-og-image`, at least for use and product pages and /designs/. |
| M2 | MEDIUM | Visible breadcrumb and BreadcrumbList disagree on 23 routes; /designs/ has JSON-LD but no visible breadcrumb | product pages show "สินค้าและบริการ" missing from JSON-LD; gallery crumb names differ; `analysis` breadcrumb diff | 90% | Generate both from one source. Either drop the unlinked "สินค้าและบริการ" crumb or create a hub, and add a visible crumb to /designs/. |
| M3 | MEDIUM | Thin indexable gallery pages | /class-shirt-designs/ shows 1 design (1,819 chars), running 3, staff 4, badminton 5, organization 5, university 6; 2 inbound pages each | 70% | Use a minimum-designs threshold for indexing (the original intent of the `noindex` comment at functions.php:420), or add unique intro, FAQ and links until there are enough designs. |
| M4 | MEDIUM | /project/ desktop LCP image is lazy-loaded | LCP `img/customer/lc37-480.webp loading=lazy` at 1440 (mobile picks a different, eager image) | 85% | Make the first visible row on /project/ eager, and give the first item `fetchpriority=high` at desktop widths too. |
| L1 | LOW | The 404 page canonical points to `/404` | `curl /does-not-exist/` → `<link rel="canonical" href="…/404">`; functions.php:336-341 | 95% | Skip `td_canonical_fallback` when `$p['route']==='404'` or when robots is noindex. |
| L2 | LOW | Mixed-case theme URLs return 200 with the empty WP placeholder | `/FAQ/`, `/EMBROIDERY/` → 200, 69 KB, "หน้านี้ยังไม่มีเนื้อหา…" (canonical lowercase) | 95% | 301 to `strtolower(path)` when the lowercase form is a pages.json route (in `td_request_route` or `template_redirect`). |
| L3 | LOW | Canonical redirects are disabled on theme routes, including `/` query URLs | functions.php:393-395 returns `false`; `/?p=1` gives 200 "Hello world!" | 90% | Return `$redirect` when the query has `p`, `page_id` or `cat`; disable only the slug-guess redirect. |
| L4 | LOW | WP core sitemap and archives expose users, uncategorized, hello-world and date archives (no-plugin fallback) | `wp-sitemap-users-1.xml` → /author/admin/; /2026/ and /?author=1 → 200 indexable | 95% (local) | `add_filter('wp_sitemaps_add_provider', …)` to remove `users`; noindex author and date archives; delete Hello world and Sample Page. Production RM settings cover this, so check RM › Sitemap › Authors = off. |
| L5 | LOW | Sitewide links to /collar-styles/, /privacy-policy/ and /terms-conditions/ go to legacy WP content pages rendered by index.php | 51 inbound pages each; production 200; local placeholder | 55% | On staging, confirm these render cleanly (no nested old header or footer, Thai title and description in RM). /collar-styles/ had 2,870 GSC impressions (docs/seo/gsc-2026-11-12.md:14). |
| L6 | LOW | RM SearchAction `?s=` lands on an English WP search page | `/?s=polo` → "Search Results for…", h1 "Archives" (index.php:18) | 80% | 301 `?s=` to `/search/?q=`, or disable RM's sitelinks searchbox. |
| L7 | LOW | /calculations/ quantity-tier prices exist only after JS | raw: "ราคาต่อตัว– …"; rendered "10–50 220 · 51–200 210…" | 90% | Server-render the default tier list (polo, 10–50) into the HTML. |
| L8 | LOW | Boilerplate share: use pages have 60–66% overlapping text | 40-char shingles: /custom-university-shirts/~/sport/ 0.66, /corporate/~/project/ 0.65, /custom-organization-shirts/~/custom-staff-shirts/ 0.63 | 65% | Keep shared walls, but cut their size on use pages and expand use-specific copy. |
| L9 | LOW | Render-blocking CSS: 2–6 files per page; review-wall CSS on pages without a review wall | head `<link rel=stylesheet>` list in `analysis.txt` | 70% | Load the review-wall CSS only on pages that render it; consider inlining critical CSS for the hero. |
| L10 | LOW | Alt gaps: 24 review photos on / and 12 on /project/ have `alt=""`; 26 identical alts on home | `analysis` images | 70% | Write short real alts for customer photos (team or customer name and shirt type); add the design code to repeated design alts. |
| L11 | LOW | 3 unlabeled `<nav>` per page (footer) | landmarks list | 90% | Add aria-labels (or use `<div>` if they are not navigation). |
| L12 | LOW | Paginated `/page/2/` and `/blog/page/2/` return thin 200 pages | `/blog/page/2/` placeholder with canonical /blog/; `/page/2/` with no canonical | 90% | 404 or 301 these for exported routes; not linked anywhere today. |
| L13 | LOW | `http://www` → https://www → apex is 2 hops (server) | curl production | 95% | Redirect `http://www` straight to `https://team-dee.com/` (Hostatom/.htaccess). |
| I1 | INFO | Post pages without a plugin have no description, OG or Article schema, and a 113-char title | /sports-running-shirt-fabric-guide/ | 95% | Covered by RM on production; nothing to do if RM stays. |
| I2 | INFO | Prototype `dist/sitemap.xml` lastmod = build date for all 52; includes 9 prototype `/blog/*/` URLs absent in WP and /collar-styles/ | `dist/sitemap.xml` | 95% | It is not shipped to WP; optionally drop lastmod or use file mtime. |
| I3 | INFO | FAQPage on 20 routes (Google shows FAQ rich results only for gov/health sites); ItemList on /designs/ items have no `url` | JSON-LD table | 80% | Keep (harmless). Add `url` per ListItem if pursuing carousel eligibility. |
| I4 | INFO | /sublimation/ shows no per-shirt price (raw or rendered); /embroidery/ and /screen-printing/ do; /calculations/ says พิมพ์ลาย 279 บาท/ตัว | text search on crawl | 70% | Content decision. |
| I5 | INFO | One `<figcaption>` on /printed-shirt-order-guide/ starts with the word "ภาพจำลองแบบเสื้อ · ใช้ดูภา…"; other uses are process wording (mockup compared with sample) | raw HTML grep | 90% | Confirm it is intended after the 16 Nov removal. |

## Verified OK (today's fixes and other passes)
- Titles and descriptions are unique on all 47 routes and equal `pages.json`. Indexable descriptions are 105–158 chars and titles 31–64 chars.
- Exactly 1 h1 per page (47 routes + 2 posts + category) at 1440 and 414; 0 heading-level skips.
- Home canonical fallback: one absolute self canonical on `/` (functions.php:336-341). Every route has exactly one canonical.
- /team-shirt-order-checklist/: no noindex, in the WP sitemap, 14 inbound pages, BreadcrumbList present.
- /designs/ links all 10 gallery pages; they are at depth 2 from /.
- The build sitemap (`dist/sitemap.xml`) excludes every noindex route and includes all 42 indexable routes (rendered-HTML based).
- /about-us/ LocalBusiness is identical to the home one (`@id https://team-dee.com/#business`). `sameAs` has LINE, Facebook and Instagram.
- "โรงงาน" appears in no theme page; only the WP post /polo-shirt-fabric-guide/ contains it.
- JSON-LD parses on all pages (0 invalid).
- No sync head scripts; no mixed content; no horizontal overflow at 414; all pages under 500 KB.
- Real 404 status for unknown slugs and nested unknowns; trailing-slash 301 in one hop; retired URLs 301 in one hop; query-param URLs canonicalize to the clean URL.
- Content (FAQ answers, embroidery and screen price tables, gallery items, guides) is present in the raw HTML without JS.
- 0 generic or empty internal anchors; 0 internal nofollow.
- `lang="th"`, UTF-8, viewport, theme-color, SVG favicon and apple-touch on all routes. hreflang is not needed.
- `td_cms_asset_head` keeps blog-hub SEO tags off article pages.
- Exported pages dequeue Elementor and block CSS (no old-site CSS bleeding).

## Regression checks (YAML sketch)
```yaml
- name: head-unique-and-single
  steps: [for each route in pages.json: assert 1 title, 1 description, 1 canonical == origin+route, lang=th]
- name: no-canonical-on-404
  steps: [GET /does-not-exist-xyz/ → status 404, assert no link[rel=canonical] or not ending /404]
- name: rankmath-og-image-is-theme
  env: staging-with-rankmath
  steps: [GET /embroidery/, assert og:image contains /uploads/teamdee/img/, og:locale == th_TH]
- name: single-business-entity
  env: staging-with-rankmath
  steps: [GET /, count JSON-LD nodes with @type Organization|LocalBusiness|Person == 1, BreadcrumbList count <= 1]
- name: sitemap-covers-routes
  env: staging-with-rankmath
  steps: [fetch page-sitemap.xml, assert every indexable pages.json route present, none of noindex routes]
- name: case-variant-redirect
  steps: [GET /FAQ/ → 301 /faq/]
```
