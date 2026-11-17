# team-dee.com — SEO migration risk report (old Astra/Elementor site → TEAMDEE theme)

Date: 17 Nov 2026 · Research only: no project files changed, no git, no logins.
Requests used: ~34 curl (robots, sitemaps, HEAD checks, one homepage GET) + 14 WebSearch + 1 WebFetch ≈ 49.

Sources:
- Live production: robots.txt, /sitemap_index.xml, /post-sitemap.xml, /page-sitemap.xml, /category-sitemap.xml, HEAD checks, homepage HTML (all fetched 17 Nov 2026 05:34 UTC).
- Repo: `src/data/routes.json`, `wp-theme/teamdee/build/pages.json` (generated 17 Nov 05:26 UTC), `wp-theme/teamdee/seo-legacy.json`, `TD_RETIRED` + `/terms/` alias + slash/canonical filters in `wp-theme/teamdee/functions.php`, `src/data/legacy-posts.json`, `docs/seo/gsc-2026-11-12.md` (GSC export Art made 12 Nov), `docs/spec/teamdee-v22/URL-MIGRATION-MAP.json`.

**Important caveat on "what Google shows":** the WebSearch tool is a US-based engine, not Google Thailand. It ignores `site:` and returns poor Thai results in standard mode. Results in "extended" mode were usable but are only a proxy. The real Google numbers below come from Art's GSC export (`docs/seo/gsc-2026-11-12.md`, 19 Jun – 11 Nov 2026).

---

## 1. Production inventory (live, 17 Nov)

- `robots.txt`: `Disallow: /wp-admin/`, `Allow: /wp-admin/admin-ajax.php`, `Sitemap: https://team-dee.com/sitemap_index.xml` (Rank Math).
- `sitemap_index.xml` has 3 children: post (12 URLs), page (27 URLs), category (3 URLs) = **42 URLs**. Product/tag/author/portfolio sitemaps → 404. `/wp-sitemap.xml` → 301 (Rank Math takes over).
- Host behaviour: `www` → 301 to apex, `http` → 301 to https, `/size-chart` → 301 `/size-chart/`, `/index.php` → 301 `/`.
- Extra live URLs not in the sitemap: `/serviecs/` (301 → `/services/`), `/terms/` (301 → `/terms-conditions/`), `/category/uncategorized/` (200), `/feed/` (200), `/blog/page/2/` (200). `/author/admin/` is already 404.
- Sitemap currently lists `/thank-you/` and `/test-page/` (both return 200). These should not be indexed.

## 2. How the new theme covers old URLs

The theme is installed on the **same WordPress** (same DB, posts, uploads), so:
- 47 routes in `pages.json` (+ the 404 page) are drawn by the theme; 42 of them are indexable (titles/descriptions from `pages.json` override Rank Math for these, decision 16 Nov).
- WP Pages without a built route (`/collar-styles/`, `/privacy-policy/`, `/terms-conditions/`) render through `index.php` using `the_content()` inside the new header/footer; Rank Math title stays.
- Posts render through `single.php`; categories through `category.php`. Their Rank Math titles stay.
- `TD_RETIRED` 301s: `/pdpa/`→`/privacy-policy/`, `/production-techniques/`→`/shirt-production-techniques-guide/`, `/services/`→`/`, `/serviecs/`→`/` (one hop). The 301 only fires if the target exists (`td_target_exists`). Retired pages are dropped from the sitemap.
- `/terms/` → `/terms-conditions/` alias (only when WP 404s).
- Missing trailing slash → 301 to slash (`td_slash_url`).

## 3. URL migration table (all 42 sitemap URLs + 5 known extras)

| # | Old URL | Type | New URL | Status after switch | GSC clicks (19 Jun–11 Nov) | Notes |
|---|---|---|---|---|---:|---|
| 1 | `/` | page | same | KEPT (theme) | 796 | title changes (see §5) |
| 2 | `/corporate/` | page | same | KEPT (theme) | 33 | |
| 3 | `/sport/` | page | same | KEPT (theme) | <10 | |
| 4 | `/education/` | page | same | KEPT (theme) | 108 | visible in search for school/faculty queries |
| 5 | `/size-chart/` | page | same | KEPT (theme) | **564** (114k impr., pos 5.2) | #1 organic page; title changes |
| 6 | `/sublimation/` | page | same | KEPT (theme) | 15 | |
| 7 | `/blog/` | page | same | KEPT (theme) | <10 | |
| 8 | `/sports-shirt/` | page | same | KEPT (theme gallery) | <10 | |
| 9 | `/calculations/` | page | same | KEPT (theme) | 15 | |
| 10 | `/contact-us/` | page | same | KEPT (theme) | <10 | |
| 11 | `/fabric-technology/` | page | same | KEPT (theme) | 11 | |
| 12 | `/project/` | page | same | KEPT (theme) | <10 | |
| 13 | `/screen-printing/` | page | same | KEPT (theme) | 16 | |
| 14 | `/embroidery/` | page | same | KEPT (theme) | 23 | |
| 15 | `/production-techniques/` | page | `/shirt-production-techniques-guide/` | 301 (TD_RETIRED) | <5 | target is an existing post |
| 16 | `/collar-styles/` | page | same | KEPT (old WP content in new chrome) | 24 (2,870 impr.) | **not a theme page**: check rendering |
| 17 | `/event/` | page | same | KEPT (theme) | <10 | |
| 18 | `/services/` | page | `/` | 301 (TD_RETIRED) | <5 | |
| 19 | `/about-us/` | page | same | KEPT (theme) | <10 | |
| 20 | `/educations-shirt/` | page | same | KEPT (theme gallery) | – | |
| 21 | `/event-shirts/` | page | same | KEPT (theme gallery) | – | |
| 22 | `/corporate-shirts/` | page | same | KEPT (theme gallery) | – | |
| 23 | `/thank-you/` | page | same | KEPT, noindex, out of sitemap | – | currently indexable on prod |
| 24 | `/terms-conditions/` | page | same | KEPT (old WP content) | – | |
| 25 | `/privacy-policy/` | page | same | KEPT (old WP content) | – | |
| 26 | `/pdpa/` | page | `/privacy-policy/` | 301 (TD_RETIRED) | <5 | |
| 27 | `/test-page/` | page | same | KEPT, noindex, out of sitemap | – | better: unpublish (→404) or keep noindex |
| 28–39 | 12 posts: `/choose-uniform-manufacturer-checklist/`, `/garment-production-cost-structure-bulk-order/`, `/event-sports-day-t-shirt-timeline-management/`, `/how-to-start-clothing-brand-production-guide/`, `/sports-running-shirt-fabric-guide/`, `/what-is-dft-shirt-printing-durability-guide/`, `/polo-shirt-size-chart-uniform-guide/`, `/sublimation-sportswear-designs/`, `/how-to-choose-garment-factory-checklist/`, `/polo-shirt-fabric-guide/`, `/how-to-design-sportswear-color-guide/`, `/shirt-production-techniques-guide/` | post | same | KEPT (single.php, Rank Math titles unchanged) | 17 + 15 + <5 each | all 12 are in `legacy-posts.json` |
| 40 | `/category/sportswear-sublimation/` | category | same | KEPT (category.php) | – | |
| 41 | `/category/fabric-technique/` | category | same | KEPT | – | |
| 42 | `/category/purchasing-guide/` | category | same | KEPT | – | |
| x1 | `/serviecs/` | alias | `/` | 301 (TD_RETIRED, one hop) | – | today it goes to `/services/`. Check Rank Math Redirections for a chain |
| x2 | `/terms/` | alias | `/terms-conditions/` | 301 (theme alias) | – | |
| x3 | `/size-chart` (no slash) | variant | `/size-chart/` | 301 (td_slash_url) | 0 (3 impr.) | |
| x4 | `/category/uncategorized/` | category | same | KEPT (WP) | – | not in sitemap; harmless |
| x5 | `/feed/`, `/blog/page/N/` | WP core | same | KEPT (WP) | – | |

**Totals:** 42 sitemap URLs. 38 are kept at the same URL (2 of them noindex on purpose) and 4 get a 301. With the 5 extras, 47 known URLs are covered. **MISSING (would 404): none found.**

Not checked: attachment pages, `?p=` short links, image URLs. Uploads stay on the same WordPress, so image URLs are not expected to change. Also not checked: backlinks to URLs that are no longer in the sitemap. Export them from GSC (Links report) to be sure.

## 4. Search visibility now

### 4a. Google (GSC, 19 Jun – 11 Nov 2026): the real data
About 1,661 clicks and 154k impressions in total. Brand queries bring 325 clicks, size queries 258. Selling queries are near the bottom of page 1 or on page 2–3:
- รับผลิตเสื้อกีฬา: 483 impressions, position 8.5
- เสื้อพิมพ์ลาย: 430, position 9.5
- เสื้อโปโลพนักงานออฟฟิศ: 253, position 6.0
- เสื้อโปโลบริษัท: 216, position 30.5
- รับปักโลโก้: 100, position 9.8

### 4b. Spot check with WebSearch, 17 Nov (proxy engine, not Google TH)

| Query (as run) | Mode | team-dee.com present? | URL / title shown |
|---|---|---|---|
| `site:team-dee.com` | standard | no (engine ignores `site:`) | – |
| TEAMDEE เสื้อ | standard | no | – |
| ทีมดี เสื้อทีม นนทบุรี | standard | no | – |
| team-dee.com | standard | no | – |
| TEAMDEE ทีมดี รับผลิตเสื้อโปโล นนทบุรี | extended | **yes**, 3 URLs | `/` "โรงงานรับผลิตเสื้อ รับผลิตเสื้อโปโล ยูนิฟอร์มองค์กรครบวงจร"; `/size-chart/` "ตารางไซส์เสื้อมาตรฐาน S-5XL พร้อมวิธีวัดตัวสั่งทำเสื้อโปโล-เสื้อกีฬา"; `/education/` "รับผลิตเสื้อรุ่น เสื้อคณะ เสื้อกีฬาสี ยูนิฟอร์มโรงเรียน มหาวิทยาลัย". Snippet shows the 109/20 address and both phones |
| รับทำเสื้อทีม | extended | no | competitors: mixprint, smartpoloandtshirt, amusesilkscreen, weareiam, k2design |
| สั่งทำเสื้อโปโลปักโลโก้ นนทบุรี | extended | no | PMK Polomaker, 989 Factory, polonoentrance, polonarundy, polobkk |
| รับทำเสื้อกีฬา พิมพ์ลาย สั่งทำ (covers เสื้อพิมพ์ลาย สั่งทำ) | extended | no | PMK, newapparel1, hybridsport, poloicon, sportmighty, sabuygarment |
| เสื้อบริษัท สั่งทำ เสื้อโปโลพนักงาน | extended | no | nicefashionmarketing, somsritshirt, sahawath, smartpolouniform, PMK, derndai |
| เสื้อรุ่น เสื้อคณะ เสื้อกีฬาสี สั่งทำ | extended | **yes**, #6 of 9 | `/education/` with the old title above |
| ตารางไซส์เสื้อ 5XL อกเท่าไหร่ | extended | **yes**, #3 of 9 | `/size-chart/`. The engine quoted "5XL chest 54–56 inches" from the old page |
| เสื้อวิ่ง เสื้อแบดมินตัน สั่งทำ พิมพ์ลาย ทีม | extended | no | pimlai, pimdai, smartprintfabric, cheetah, sportmighty |
| สกรีนเสื้อ ขั้นต่ำ DFT นนทบุรี | extended | no | thanaplus, goldensport, dee-up, gustex |
| TEAMDEE ทีมดี facebook instagram … | extended | yes (site only) | `/`, `/education/`. Snippet: tel +66975495941, Nonthaburi 11000, "5000+ ทีม" |
| "team-dee.com" OR "teamdee" … shopee/lazada… | extended | yes (home only) | no marketplace listings |

Queries asked for but not run separately (folded into the combined queries above to stay within the request budget): เสื้อกีฬาสี, เสื้อคณะ, เสื้อแบดมินตัน สั่งทำ, เสื้อวิ่ง สั่งทำ, สกรีนเสื้อ ขั้นต่ำ, เสื้อโปโลปัก นนทบุรี.

**Current titles and descriptions as shown:** the old Rank Math titles. The homepage title is still "โรงงานรับผลิตเสื้อ รับผลิตเสื้อโปโล ยูนิฟอร์มองค์กรครบวงจร | TEAMDEE", and its description repeats that word twice. Fetched live on 17 Nov.

## 5. Preservation check: what changes at switch-over

The URL for every page that gets clicks stays the same. Every title on the 22 old theme-drawn pages changes, because `td_page_title()` uses the `pages.json` title and overrides both Rank Math and the "null = keep old" plan in `seo-legacy.json`.

| URL | Old title (live / seo-legacy `old`) | New title (pages.json) | Risk |
|---|---|---|---|
| `/` | โรงงานรับผลิตเสื้อ รับผลิตเสื้อโปโล ยูนิฟอร์มองค์กรครบวงจร \| TEAMDEE | รับทำเสื้อทีม โปโลปัก พิมพ์ลาย และสกรีน \| TEAMDEE | Low–med. Most clicks are brand queries. Loses "รับผลิตเสื้อโปโล / ยูนิฟอร์มองค์กร" in the title, but the H1 and body cover them |
| `/size-chart/` | ตารางไซส์เสื้อมาตรฐาน S-5XL พร้อมวิธีวัดตัวสั่งทำเสื้อโปโล-เสื้อกีฬา | ตารางไซส์เสื้อมาตรฐาน โปโล เสื้อกีฬา พร้อมวิธีวัด | **Medium–high**. Biggest page. Drops "S-5XL" while "5xl อกเท่าไหร่" brings 572 impressions at position 2.7. Make sure the new body still answers "5XL chest = X". The H1 now uses "ไซส์" (the GSC note about "ไซซ์" is outdated for the H1, but check the body text) |
| `/education/` | รับผลิตเสื้อรุ่น เสื้อคณะ เสื้อกีฬาสี ยูนิฟอร์มโรงเรียน มหาวิทยาลัย | สั่งทำเสื้อโรงเรียน / เสื้อกีฬาสี / เสื้อครู | **Medium**. Loses "เสื้อรุ่น / เสื้อคณะ / มหาวิทยาลัย", which are the queries where it ranks now. Those topics move to the new `/custom-class-shirts/` and `/custom-university-shirts/` pages, so add strong internal links from `/education/` |
| `/corporate/` | รับผลิตเสื้อโปโลบริษัท ยูนิฟอร์มองค์กร สั่งทำเสื้อโปโล | รับทำเสื้อบริษัท / เสื้อพนักงาน พร้อมโลโก้ | Low (position 12) |
| `/embroidery/` | รับปักเสื้อโปโล ปักโลโก้บริษัท ยูนิฟอร์มพนักงานพรีเมียม | รับทำเสื้อโปโลปัก สำหรับบริษัทและหน่วยงาน | Low |
| `/sublimation/` | รับผลิตเสื้อพิมพ์ลาย Sublimation เสื้อกีฬา เสื้อทีม ไม่จำกัดสี | รับทำเสื้อพิมพ์ลาย / เสื้อโปโลพิมพ์ลาย | Low–med. Loses "เสื้อกีฬา" (the queries รับผลิตเสื้อกีฬา at position 8.5 and เสื้อพิมพ์ลาย at 9.5 land somewhere) |
| `/screen-printing/` | รับสกรีนเสื้อ DFT / DTF งานสกรีนดิจิทัล คมชัด ไม่จำกัดสี | รับทำเสื้อสกรีน สำหรับบริษัท ทีมงาน และกิจกรรม | Low. Drops "DFT/DTF" from the title |
| `/sport/` | รับผลิตและออกแบบเสื้อกีฬาพิมพ์ลาย เสื้อฟุตบอล เสื้อวิ่ง | รับทำเสื้อกีฬา / เสื้อทีม พร้อมชื่อ เบอร์ และโลโก้ | Low |
| `/event/` | รับผลิตเสื้อกิจกรรม เสื้อวิ่งมาราธอน เสื้ออีเวนต์ พิมพ์ลาย | สั่งทำเสื้ออีเวนต์ / เสื้อกิจกรรม / เสื้อ Outing | Low |
| `/project/` | ผลงานผลิตเสื้อโปโล เสื้อยูนิฟอร์มองค์กร และเสื้อกีฬา | ผลงานลูกค้าทีมดี / ภาพลูกค้าใส่เสื้อจริง | Low |
| `/fabric-technology/` | ชนิดเนื้อผ้าเสื้อกีฬา ยูนิฟอร์มองค์กร ผ้าไมโครสปอร์ต พรีเมียม | วิธีเลือกผ้าสำหรับเสื้อทีมและยูนิฟอร์ม | Low |
| `/calculations/` | คำนวณราคาผลิตเสื้อโปโล และยูนิฟอร์มองค์กรออนไลน์ | คำนวณราคาเสื้อทีมเบื้องต้น · คำนวณงบผลิตเสื้อ | Low |
| `/about-us/` | เกี่ยวกับเรา TEAMDEE \| โรงงานรับผลิต… ประสบการณ์ 10 ปี | รู้จักทีมดี บริการรับทำเสื้อทีมในนนทบุรี | Low |
| `/contact-us/`, `/blog/`, galleries (4) | generic "– TEAMDEE" titles | descriptive Thai titles | Low (improvement) |
| `/collar-styles/`, `/privacy-policy/`, `/terms-conditions/`, 12 posts, 3 categories | Rank Math | unchanged (Rank Math) | Title risk is low, but see the rendering risk for `/collar-styles/` |

Old pages whose content is retired (`/services/`, `/pdpa/`, `/production-techniques/`) each got fewer than 5 clicks, so their 301s are low risk.

## 6. Off-site signals and NAP

| Source | Name | Address | Phone | Hours | Notes |
|---|---|---|---|---|---|
| **New site** (`src/data/site.json` + `seo-schema.js`) | TEAMDEE / legalName บริษัท ดีดี ฟินิกซ์ จำกัด | **264** ถนนเลี่ยงเมืองนนท์ ต.ตลาดขวัญ อ.เมืองนนทบุรี 11000 (geo 13.8501, 100.5002) | 097-549-5941 / 086-416-6449 | Mo–Su 08:30–21:00 | social: facebook.com/teamdee, instagram.com/teamdee_, LINE @teamdee. `mapUrlNote`: the GBP pin points to 109/20, so a search link is used until พี่ทัช fixes GBP |
| **Old live site** (17 Nov) | TEAMDEE; Rank Math schema Person+Organization "TEAMDEE STUDIO" | **109/20** ถนนเลี่ยงเมืองนนทบุรี ต.ตลาดขวัญ (appears 3×) | 097-549-5941, 086-416-6449 | not stated in HTML | Facebook + LINE links, no Instagram link |
| Facebook page `facebook.com/teamdee` | "Teamdee ผลิตและออกแบบเสื้อทีมครบวงจร \| Nonthaburi" | not visible (login wall) | not visible | – | name is consistent |
| Instagram `teamdee_` | not verified (not fetched) | – | – | – | – |
| Google Business Profile / Maps | not found via the proxy search | pin at 109/20 according to the repo note | – | – | **unverified**: category and review count not visible |
| JobThai (company 341883) | บริษัท ดีดี ฟินิกซ์ จำกัด | 109/20 ถ.เลี่ยงเมืองนนทบุรี ต.ตลาดขวัญ | – | – | |
| JobBKK (company 220112) | บริษัท ดีดี ฟินิกซ์ จำกัด | **79/177** หมู่บ้านศุภาลัยวิลล์ ม.3 ต.ศาลากลาง อ.บางกรวย | **02-514-7474** | **Mon–Sat 8:30–18:00** | conflicts with the new site on address, phone and hours |
| Matchlink.asia | DD Phoenix Co., Ltd. | 264 ถ.เลี่ยงเมืองนนท์ ต.ตลาดขวัญ | – | – | |
| dataforthai / company directory | บริษัท ดีดี ฟินิกซ์ จำกัด, reg. 0125564002147, registered 19 Jan 2021, capital 1M | (Nonthaburi) | – | – | |
| Shopee / Lazada / Yellow Pages / Lemon8 | no TEAMDEE listing found | – | – | – | |
| Backlinks visible via search | none found besides job and company directories | | | | use the GSC Links report |

**Finding:** the address on the new site (264) does not match the old site, the GBP pin or JobThai (109/20), or JobBKK (79/177, Bang Kruai). Hours also differ (daily to 21:00 vs Mon–Sat to 18:00). For local queries ("…นนทบุรี", Maps pack), Google cross-checks the site's NAP against GBP, so this mismatch is the main off-site risk at switch-over.

## 7. Launch risks, ranked

1. **NAP mismatch (264 vs 109/20 vs 79/177; hours).** Decide the one true customer-facing address and hours. Update GBP first (พี่ทัช owns it), then make the site, schema and Facebook match exactly. If GBP cannot be changed before launch, decide whether the site should show the same address as GBP until it is fixed. Ask the job boards to update their listings later.
2. **`/size-chart/` title and content drift.** It is 34% of clicks and 74% of impressions. Keep the URL (done). Consider putting the size range back in the title (e.g. "S–7XL" if the new chart covers it). Make sure the body has clear chest numbers per size for "5XL / XL อกเท่าไหร่" and uses the "ไซส์" spelling people search. Compare its position in GSC daily for the first 2 weeks.
3. **New pages missing from the XML sitemap.** Rank Math only lists real WP Pages. The 27 new routes (`/faq/`, `/custom-*/`, guides, galleries, new posts) exist only as theme fallbacks until **Tools → หน้าจากต้นแบบ → sync** creates them. Run the sync, then check that `page-sitemap.xml` lists the 42 indexable theme routes plus `/collar-styles/`, `/privacy-policy/` and `/terms-conditions/`, and leaves out `/thank-you/`, `/test-page/`, `/search/`, the 3 noindex posts and the retired URLs.
4. **`/collar-styles/` rendering.** It ranks (2,870 impressions) but is not a theme page: old Elementor content shows inside the new header/footer. The theme comments say some old pages embed the old header and footer in their content. Check it on staging (double menu, broken layout, needs the Elementor plugin active). If it is broken, build it as a theme page at the **same URL**, not a 301.
5. **Redirect chains and conflicts.** Today `/serviecs/`→`/services/` and `/terms/`→`/terms-conditions/` come from WordPress or Rank Math. After the switch, a Rank Math Redirections entry could run before the theme and create `/serviecs/`→`/services/`→`/`. Export Rank Math → Redirections, then test each old URL with `curl -I` after launch: there should be exactly one hop.
6. **Losing `/education/` rankings for เสื้อรุ่น/เสื้อคณะ.** The new title narrows to schools. Link prominently from `/education/` to `/custom-class-shirts/` and `/custom-university-shirts/`, and consider adding "เสื้อรุ่น / เสื้อคณะ" back to the title or description.
7. **Rank Math global settings.** Check that "Discourage search engines" (`blog_public`) is OFF on prod. Check that Rank Math's schema type and name ("TEAMDEE STUDIO", Person+Organization) do not clash with the theme's Organization/LocalBusiness JSON-LD: decide which one outputs schema. Also check the homepage title/description inside Rank Math (still the old wording, though the theme overrides it), the OpenGraph image, and that Rank Math sitemap settings include Pages, Posts and Categories.
8. **Analytics drop that is not real.** The old site loads GA4 directly and also through GTM (`G-SMGGJ8873Q` + `GTM-5ZR6H92X`). The new site uses GTM only, so sessions may look lower after the switch. Judge SEO by GSC clicks, not GA4.
9. **`/thank-you/` and `/test-page/` are indexable on prod today.** The theme sets them noindex and removes them from the sitemap. Optionally unpublish `/test-page/`.
10. **Speed and cache.** nginx with no page cache. Cloudflare is deferred (memory note). A slower TTFB after the theme swap would hurt CWV. Measure TTFB/LCP on the live URL right after launch.

## 8. Launch-day checklist (this migration)

**Before (T-3 to T-1)**
- Export from GSC (Performance, last 16 months, Web):
  - Pages tab (all rows)
  - Queries tab (all rows)
  - Queries × page for the top 20 pages (filter by page)
  - Countries/Devices
  - Links report (top linked pages, top linking sites)
  - Page indexing report (indexed vs not-indexed URL list)
  - Sitemaps status
- Full backup of the old site: DB dump + `wp-content` (themes/astra, plugins, uploads) + nginx config. Note the active theme and plugin list. Keep it for at least 3 months.
- Export from Rank Math: Redirections list, global Titles & Meta settings, the per-post SEO table (Tools → Import/Export → settings JSON).
- Save today's crawl as the baseline: the sitemap XML files saved next to this report (`/private/tmp/claude-501/-Users-artist-Documents-TEAMDEE-WEB/69d59e37-0e19-48b1-a37c-1e14d2e1518d/scratchpad/seo2/*-sitemap.xml`; scratchpad may be cleared, so copy them somewhere durable); also save HTML titles if possible.
- Decide the NAP (risk 1) and run "หน้าจากต้นแบบ → sync" on staging, then check the sitemap there.

**Switch (T-0)**
- Activate the theme. Do not change permalinks. Do not delete old Pages/Posts.
- Confirm `blog_public` = 1 and that no `noindex` sits on indexable pages (view-source spot check: `/`, `/size-chart/`, `/education/`, `/embroidery/`, one post).
- `curl -I` all 47 URLs from §3. Expect 200 for KEPT, a single 301 for redirects, and 404 for nothing.
- Check `sitemap_index.xml` → page/post/category sitemaps. It should contain new routes and no retired or noindex URLs. Then in GSC → Sitemaps, re-submit `https://team-dee.com/sitemap_index.xml`.
- GSC URL Inspection → "Request indexing" for `/`, `/size-chart/`, `/education/`, `/embroidery/`, `/sublimation/`, `/corporate/`, `/screen-printing/`, `/sport/`, `/custom-class-shirts/`, `/custom-university-shirts/`.
- Rich Results Test on `/` and `/size-chart/`: Organization/LocalBusiness schema, one per page, NAP matches GBP.
- Purge any cache (LiteSpeed/Cloudflare if added later).

**After (T+1 to T+28)**
- Daily for 2 weeks: GSC Performance, comparing the 7 days before and after, by page for `/size-chart/`, `/`, `/education/`.
- GSC Page indexing: watch for new "Not found (404)", "Redirect error", "Duplicate without user-selected canonical", "Excluded by noindex".
- Expect some position wobble for 1–3 weeks. Act only if a top page drops more than 30% in clicks for 7 days and the cause is a page or content change. Do not revert the theme for small moves.
- Update GBP website link and categories if needed. Post an update on GBP and Facebook (fresh signals).

## 9. Verified vs not verified

**Verified (this session, with output):**
- Production robots.txt and the 42 sitemap URLs (fetched 17 Nov)
- Current HTTP status of 20 sample URLs, plus the www/http behaviour
- Old homepage title, description, robots, canonical, schema name, NAP strings
- Repo route coverage: every old URL maps to a kept route, an existing WP page or post, or a TD_RETIRED 301. No MISSING.
- New titles from `pages.json`; `site.json` NAP
- Third-party listings returned by the search tool (JobThai, JobBKK, Matchlink, dataforthai)
- Facebook page name

**Not verified:**
- Real Google TH rankings (the search tool is not Google). Rely on the GSC export of 12 Nov.
- GBP: listing, category, reviews count
- Instagram `teamdee_` profile
- How `/collar-styles/` actually renders in the new theme
- Rank Math Redirections entries on prod
- Whether the "sync pages" tool has been run on prod
- Attachment and image URL indexing
- Full backlink profile
- Post-switch behaviour in general (nothing deployed)
