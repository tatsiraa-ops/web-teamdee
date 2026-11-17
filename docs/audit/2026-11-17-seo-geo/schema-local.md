# TEAMDEE: structured data, rich results and local SEO audit (new theme)

Date: 17 Nov 2026 · Mode: report only. No project files were edited, git was not used, and nothing was logged into.
Evidence lives in the scratchpad: `html/` (48 local pages), `analysis.json` (every JSON-LD block, parsed), `og.tsv`, `live/` (3 public pages from team-dee.com: home, /embroidery/, /sports-running-shirt-fabric-guide/).

## 0. Method

- Fetched all 47 routes from `wp-theme/teamdee/build/pages.json` (404 excluded), plus the WP post `/sports-running-shirt-fabric-guide/`, from `http://127.0.0.1:9400` with a cookie jar. Every request returned 200.
- Pulled every `<script type="application/ld+json">` block and ran `JSON.parse` on it. **All blocks parse; there are 0 JSON syntax errors.**
- Compared each page's visible `nav.crumb2` / `td-reader__crumb` with its BreadcrumbList.
- Checked every FAQPage question and answer against the visible text: **154/154 found on the page.**
- Requested each og:image on the local preview and measured it with `sips`: 39 unique URLs, all 200.
- Made public read-only GETs of 3 live team-dee.com pages to see what Rank Math outputs today.
- Ran about 17 web searches and fetches, mostly against Google Search Central (FAQ, LocalBusiness, Organization, Product snippet, Article, Breadcrumb) and Rank Math KB/support.

## 1. What the new theme outputs (local, no Rank Math)

| Page group | Routes | JSON-LD |
|---|---|---|
| Home `/` | 1 | LocalBusiness (`/#business`) + FAQPage (11 Q). Both in `<head>` |
| `/about-us/` | 1 | LocalBusiness, identical to home (same `@id`, same data) |
| Product pages (embroidery, sublimation, screen-printing, baseball, oversize jerseys, warmup) | 6 | FAQPage + BreadcrumbList (body) |
| Use pages (corporate, education, event, sport, custom-badminton/class/organization/running/staff/university) | 10 | FAQPage + BreadcrumbList |
| Gallery pages (`*-shirt-designs`, corporate-shirts, educations-shirt, event-shirts, sports-shirt) | 9 | BreadcrumbList |
| `/designs/` | 1 | BreadcrumbList + ItemList (113 items, name + image) |
| Guides (artwork-prep, delivery, embroidered-polo, printed-shirt, screen-printing order guides, fabric-technology) | 6 | BreadcrumbList |
| `/faq/`, `/size-chart/`, `/calculations/` | 3 | FAQPage (32 / 6 / 3 Q) + BreadcrumbList |
| Theme articles (polo-vs-printed, team-shirt-design-ideas, team-shirt-fabric-guide, team-shirt-order-checklist) | 4 | BreadcrumbList only. Article is suppressed because `articleDraft: true` is always set in `context.js`, and all 4 pages are `noindex` |
| `/blog/`, `/contact-us/`, `/project/`, `/search/`, `/thank-you/` | 5 | **none** |
| WP post (`single.php`) | n | **none** locally. On production Rank Math outputs BlogPosting |
| VideoObject | 0 | No item in `videos.json` passes `videoReady()` (all lack `file` and `poster`), so none is output. That is correct behaviour |

## 2. Validity per type (schema.org + Google, Nov 2026)

| Type | Pages | JSON valid | schema.org valid | Google rich result possible? | Verdict |
|---|---|---|---|---|---|
| LocalBusiness | 2 | Yes | Yes | No visual rich result. It feeds local/knowledge understanding | Good base, but fix address (ตำบล dropped), hours format, logo, priceRange and geo source (see F3–F6) |
| FAQPage | 20 | Yes | Yes | **No.** Google: "This feature will no longer appear in Google Search starting May 7, 2026"; docs removed 15 Jun 2026 | Keep (harmless, matches visible text, still useful to Bing and AI engines) but put in no further effort |
| BreadcrumbList | 39 | Yes | Yes | Yes (desktop per Google doc) | Valid, but 21 pages differ in some way from the visible crumb (F9) and Rank Math will duplicate it (F2) |
| ItemList (`/designs/`) | 1 | Yes | Yes (ListItem.image is a Thing property) | No. Google's ItemList carousel needs `url` per item and only supports certain content types | Harmless (~19.6 KB). Optional to drop |
| Article (theme) | 0 | n/a | n/a | n/a | Template exists but is off. When it is turned on it lacks `author`, `datePublished`, `dateModified` and `@id` (F12) |
| BlogPosting (Rank Math, live) | posts | Yes | Yes | Yes (Article) | `author.name` = "admin", which is weak E-E-A-T; the author URL slug looks like a login username (F11) |
| VideoObject | 0 | n/a | n/a | When a video is ready: `name`, `thumbnailUrl` and `uploadDate` are required | `videoSchema()` is fine. Add `+07:00` to `uploadDate` (date-only falls back to Googlebot's timezone) and optionally `embedUrl` |
| Product / AggregateOffer | 0 | n/a | n/a | Product snippet yes. Merchant listing no (nothing can be bought on the page) | Opportunity on 5 priced product pages (F14) |
| WebSite | 0 (theme) | n/a | n/a | Site names | Rank Math provides it. Its name ("TEAMDEE STUDIO") and `inLanguage` en-US are wrong (F2) |

## 3. Findings, ranked

### F1. HIGH: three conflicting business entities at launch (confidence 90%)
Evidence from live `https://team-dee.com/` today:
- Rank Math graph: `@type ["Person","Organization"]`, `@id https://team-dee.com/#person`, name **"TEAMDEE STUDIO"**, logo 150×150 webp, `inLanguage en-US`. WebSite `/#website` also has name "TEAMDEE STUDIO" plus a SearchAction.
- A second `<head>` block without the `rank-math-schema` class (source unknown: a header-code plugin, the old theme, or a page-level snippet): `LocalBusiness+Organization`, `@id /#organization`, address **109/20 ถนนเลี่ยงเมืองนนทบุรี**, `addressLocality "Nonthaburi"`, hours **09:00–17:00 with Thursday missing**, `priceRange "$$"`, and a long name that includes a word the brand avoids.
- The new theme adds `LocalBusiness /#business`: name "TEAMDEE", address **264 ถนนเลี่ยงเมืองนนท์**, hours **Mo-Su 08:30-21:00**.

After launch, Rank Math's graph will still print on every theme page, because the theme does not filter `rank_math/json_ld`. If the second block comes from a plugin, it stays too. The result is three `@id`s with different names, addresses and hours. Google may treat them as separate entities or simply distrust the NAP.

Fix: see section 4.

### F2. HIGH: Rank Math will duplicate breadcrumbs and WebSite/WebPage data (85%)
On live /embroidery/, Rank Math prints `BreadcrumbList` `["Home","เสื้อปัก"]`, with "Home" in English and an old title. The theme prints its own `หน้าแรก > เสื้อโปโลปัก`. Two different trails will appear on the same URL. In addition, the WebSite `potentialAction` SearchAction has been obsolete since Google retired the sitelinks search box (21 Nov 2024). It is harmless but noise. Rank Math also reports `inLanguage en-US` and `og:locale en_US` on live, because WP Site Language is English.

### F3. HIGH: `geo` in the new schema is the old map pin, not a verified 264 location (match evidence 100%; "wrong location" unknown)
`site.json` geo `13.8501346, 100.5001791` matches exactly (7 decimals) the place coordinates of the old short link `maps.app.goo.gl/C9dzb3kN3oQQLARu6`. That link resolves to a Google Maps place named **"FinixSports ผลิตและออกแบบเสื้อกีฬาพิมพ์ลาย"**, which `site.json mapUrlNote` describes as the pin for 109/20. The theme states the address is 264 but uses that pin's coordinates. If 264 and 109/20 are not the same spot, the geo is wrong.
Fix: Art or พี่ทัช confirms the real entrance location → use coordinates from the corrected GBP pin, at least 5 decimals. Until then, either omit `geo` or keep it only once confirmed.

### F4. HIGH: opening hours conflict (confidence 95% that the sources disagree)
- Site: "ทุกวัน 8:30–21:00 น."
- Live schema: 09:00–17:00, no Thursday.
- GBP: not verified.

Decide whether 8:30–21:00 is the walk-in hours or the LINE/phone hours. If walk-in hours differ, schema `openingHoursSpecification` and GBP hours should carry the walk-in hours, and the chat hours go on a `contactPoint.hoursAvailable`.

### F5. MEDIUM: Thai address loses the ตำบล (100%)
`thaiAddress()` captures ตำบล in group 2 and never uses it, so the output is `streetAddress "264 ถนนเลี่ยงเมืองนนท์"` and ตลาดขวัญ is lost.
Fix (in `seo-schema.js`):
```json
"address": {
  "@type": "PostalAddress",
  "streetAddress": "264 ถนนเลี่ยงเมืองนนท์ ตำบลตลาดขวัญ",
  "addressLocality": "อำเภอเมืองนนทบุรี",
  "addressRegion": "นนทบุรี",
  "postalCode": "11000",
  "addressCountry": "TH"
}
```
Thai convention: house number, ซอย and ถนน go with ตำบล/แขวง in `streetAddress`; อำเภอ/เขต goes in `addressLocality`; จังหวัด goes in `addressRegion`. Use the same Thai form in GBP and in Rank Math Local SEO.

### F6. MEDIUM: LocalBusiness field quality
- `openingHours: "Mo-Su 08:30-21:00"` is valid schema.org text, but Google documents `openingHoursSpecification`. Use:
  ```json
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "08:30", "closes": "21:00"
  }]
  ```
  This applies only after F4 is resolved.
- `priceRange` is missing. Google: plain text, under 100 characters, a range or currency signs. From `prices.json` (VAT included, minimum 10 pieces) the bands run from 160 to 390 THB per piece, so `"priceRange": "฿160–390 ต่อตัว"` is truthful. Warm-up has no prices and add-ons cost extra, so `"฿฿"` is the cautious alternative.
- `logo` is an SVG (`teamdee-stacked.svg`, 1354×555 viewBox, `fill="currentColor"`). Google requires at least 112×112, a format Google Images supports, and that it "looks how you intend on a purely white background". SVG with currentColor renders black. Use a square PNG of at least 512 px as `logo` in an `ImageObject` with width and height (70% confidence this makes a difference).
- `image` = `banner-expert.jpg` (1920×900, exists). Add one or two real storefront or team photos.
- Add `alternateName: ["ทีมดี"]` and `contactPoint`, but only for roles that are confirmed. Example shape (the 086 role must be confirmed first):
  ```json
  "contactPoint": [{"@type":"ContactPoint","telephone":"+66975495941","contactType":"sales","areaServed":"TH","availableLanguage":["th"]}]
  ```
- Add `taxID` (the 13-digit company number), but only if Art supplies it from the DBD or ภ.พ.20 document. Do not invent it.
- `areaServed: "TH"` is valid. `{"@type":"Country","name":"Thailand"}` is clearer.
- `hasMap` points to a search URL, not the place. Replace it with the place URL once the GBP pin is fixed (as site.json already plans).
- Do not add `aggregateRating` or `review`. `reviews.json` has 13 real quotes with no star values, and Google says LocalBusiness/Organization reviews the business controls (self-serving) are not eligible for review stars (since Sept 2019). Inventing ratings would break the review snippet guidelines and risk a manual action.

### F7. HIGH: OG images are lost at launch (85%)
`functions.php` line 481: when an SEO plugin is present, the theme strips its own `og:*` and `twitter:*` tags, and nothing filters Rank Math's image. Live Rank Math today uses the site default `teamdee-LOGO-03-1024x731.jpg` (1024×731, a logo), `og:locale en_US`, and `og:site_name "TEAMDEE STUDIO"`. Every page in the new theme would therefore share a logo image unless each WP Page has a Rank Math social image set.
Fix: theme filters on `rank_math/opengraph/facebook/image` and `rank_math/opengraph/twitter/image` (exact hook names to be confirmed against the installed Rank Math version; they may be named `og_image` / `twitter_image`), returning the build's per-page image. Alternatively, keep the theme's tags and disable Rank Math's OG output for theme routes (`rank_math/opengraph/facebook` and `.../twitter` return false). In addition, set WP **Settings > General > Site Language = ภาษาไทย**, which fixes en_US/en-US and the English post dates ("October 5, 2026" shows on the local post page).

### F8. LOW–MEDIUM: OG quality on the new theme (local)
- og:image: 48/48 pages have one and 39 unique URLs resolve 200 locally. The URLs point to `https://team-dee.com/wp-content/uploads/teamdee/...`, so the images must be installed before launch (memory: C1 image zip first).
- Size: only home declares and actually is 1200×630 JPG. 43/48 pages use **WebP**. Facebook handles WebP in practice, but LINE support is not documented (LINE's FAQ example uses PNG), and LINE matters most for TEAMDEE. Use JPG for og:image. The comment in `plugins.js` says "og:image ยังเป็น JPG", but `firstImg` picks the `.webp` the page uses.
- Ratios: 10 use pages use `*-1280.webp` at 1280×444 (2.9:1), which gets cropped hard in a 1.91:1 card. `/blog/` and others use 760×760 squares (small, cropped). `honeycomb.jpg` is 700×700.
- `og:image:alt` = page title on every page. It should describe the image.
- `og:image:width/height` is present on home only.
- `og:type` = website on all 47 theme pages. That is fine for these pages; Rank Math sets `article` for posts.
- `og:locale th_TH` ✓ and `twitter:card summary_large_image` ✓ on all theme pages.
- Recommendation: generate a 1200×630 JPG per page group (product, use, guide) from real photos. Never AI-drawn shirts, and never a "ภาพจำลอง" label.

### F9. MEDIUM–LOW: visible breadcrumb vs BreadcrumbList
Google does not require an exact match but recommends a trail that represents a typical user path. The `item` URL is required on every element except the last; the theme complies. Mismatches found:

| Pages | Visible | Schema | Fix |
|---|---|---|---|
| 6 product pages (embroidery, sublimation, screen-printing, baseball, oversize, warmup) | หน้าแรก / **สินค้าและบริการ** (plain text, not a link) / X | หน้าแรก / X | Either remove "สินค้าและบริการ" from the visible trail, or give it a hub URL and add it to the schema. Schema cannot carry an element with no URL |
| 10 use pages | หน้าแรก / เสื้อแบดมินตัน | หน้าแรก / เสื้อแบดมินตัน / เสื้อแบด / เสื้อก๊วนแบด | Use the short visible label as `name` |
| 9 gallery pages | หน้าแรก / แบบเสื้อ / เสื้อแบดมินตัน | … / แบบเสื้อแบดมินตัน / … พิมพ์ลาย | Use the short visible label |
| Guides | middle element "คู่มือและบทความ" → /blog/ | same | /blog/'s own crumb and the article crumbs call /blog/ "บทความและไอเดีย". Pick one name for /blog/ |
| `/about-us/`, `/contact-us/`, `/blog/`, `/project/` | visible crumb | **no schema** | Add a BreadcrumbList |
| `/designs/` | **no visible crumb** | schema present | Add a visible crumb, or accept |
| WP posts | หน้าแรก / บทความและไอเดีย / {category} (no current item) | Rank Math: Home / {category} / {title} | Translate Rank Math "Home" to หน้าแรก (Rank Math > General > Breadcrumbs > Homepage label) and include /blog/ |

The pages that match exactly are calculations, corporate, organization, staff, sport, delivery, embroidered-polo, fabric-technology, faq, screen-printing-order-guide, size-chart and 2 theme articles. Several other "DIFF" results came only from `<t-nw>` word-break tags, not from real differences.

### F10. MEDIUM: leftover page-level schema on live (80%)
Live /embroidery/ carries a separate `Service` (`provider` = the 109/20 LocalBusiness, `areaServed` Nonthaburi/Bangkok/Thailand, OfferCatalog with no prices) and a `HowTo`. Google stopped showing HowTo rich results in 2023. If these are stored in Rank Math post meta or in a code-snippet plugin, they survive the theme switch and re-introduce the old address. Find the source before launch (Rank Math > Schema tab on each page, plus any header/footer code plugin) and delete them.

### F11. MEDIUM: post authorship (E-E-A-T)
Live BlogPosting: `author.name "admin"`, whose author URL slug looks like a WordPress login name. That is weak for trust and makes it easy to enumerate usernames.
Fix (Art in WP): Users > Profile → set Nickname/Display name to a real person (for example the writer's real name and role) or "ทีมงาน TEAMDEE". Add a short bio. Then either change the author slug or disable author archives in Rank Math (Titles & Meta > Authors), in which case Rank Math uses the site as author. Legacy posts with no clear author: set `author` to the Organization `@id`:
```json
"author": {"@type":"Organization","@id":"https://team-dee.com/#business","name":"TEAMDEE","url":"https://team-dee.com/about-us/"}
```

### F12. LOW: theme Article template (for when articles go live)
`articlePage.hbs` Article has no `author`, `datePublished` or `dateModified` (Google recommends dates with a timezone, e.g. `2026-10-05T18:13:21+07:00`), a single image (Google recommends 16:9, 4:3 and 1:1 at 50K pixels or more), and `publisher` without `@id`. These 4 pages are `noindex` today, so nothing breaks. Before switching `articleDraft` off, use:
```json
{"@context":"https://schema.org","@type":"Article","@id":"https://team-dee.com/<slug>/#article",
 "headline":"…","description":"…","image":["…16x9.jpg","…4x3.jpg","…1x1.jpg"],
 "datePublished":"2026-..T..+07:00","dateModified":"2026-..T..+07:00",
 "author":{"@type":"Person","name":"<real name>","url":"https://team-dee.com/about-us/"},
 "publisher":{"@id":"https://team-dee.com/#business"},
 "mainEntityOfPage":"https://team-dee.com/<slug>/","inLanguage":"th"}
```
Guide pages (fabric-technology, order guides, size-chart) could also carry Article with real dates. That is optional.

### F13. INFO: FAQPage, keep or drop?
Confirmed on Google's FAQ doc changelog: FAQ rich results stopped appearing on 7 May 2026 for all sites (in Aug 2023 they had been limited to government and health sites), and the docs were removed on 15 Jun 2026. Unused structured data does not hurt. Every FAQ answer on the site matches visible text (154/154). Verdict: **keep it** (cheap, accurate, and Bing and AI answer engines read Q&A structure), but expect no Google SERP feature and add no FAQ markup just for SEO. The FAQ report in Search Console is also going away.

### F14. OPPORTUNITY: Product + AggregateOffer on priced product pages (60% that Google shows a price snippet)
Google's Product snippet doc: rich results "only support pages that focus on a single product (or multiple variants of the same product)". One of `offers`, `review` or `aggregateRating` is required. AggregateOffer requires `lowPrice` and `priceCurrency`, with `highPrice` and `offerCount` recommended.
- /embroidery/ is one garment, an embroidered polo, whose variants are 6 fabrics with quantity bands. The visible table shows 170–390 THB. **That qualifies as a product snippet.** Merchant listings do not apply because there is no add-to-cart. Shipping and return markup are therefore not needed (they are merchant-listing fields, set at Organization level via `hasMerchantReturnPolicy` if ever used).
- Data from `prices.json` (VAT included): polo 170–390 · print 160–329 · baseball 230–359 · jersey (oversize) 230–359 · screen 220–320 (from 1 piece) · warmup has no prices, so add nothing there.
- Shape for /embroidery/ (prices must stay generated from `prices.json` so they never drift from the visible table):
```json
{"@context":"https://schema.org","@type":"Product","@id":"https://team-dee.com/embroidery/#product",
 "name":"เสื้อโปโลปักโลโก้ สั่งทำ","description":"…(same as page intro)…",
 "image":["https://team-dee.com/wp-content/uploads/teamdee/img/mockup/polo-embroidery-scg.jpg"],
 "brand":{"@type":"Brand","name":"TEAMDEE"},
 "offers":{"@type":"AggregateOffer","priceCurrency":"THB","lowPrice":"170","highPrice":"390",
   "eligibleQuantity":{"@type":"QuantitativeValue","minValue":10,"unitText":"ตัว"},
   "availability":"https://schema.org/MadeToOrder",
   "seller":{"@id":"https://team-dee.com/#business"}}}
```
Check `MadeToOrder` in the Rich Results Test. If it is flagged, omit `availability`.
- Service + OfferCatalog (what live uses today) is valid schema.org but has **no Google rich result**. It only describes the service. Do not use both on the same page for the same thing. Product is the better fit for a garment with a price table.
- Do not add `aggregateRating` from `reviews.json`: there are no star values, and these are general business testimonials, not product reviews.

### F15. LOW: ItemList on /designs/
113 items with `name` + `image` and no `url` (there are no per-design pages on WP). It produces no rich result. It is fine to keep. If per-design pages ship later, add `url`.

### F16. LOW: VideoObject readiness
`videoSchema()` emits name, description, thumbnailUrl, contentUrl, uploadDate and duration, which covers the required and recommended fields. Change `uploadDate` to include `T00:00:00+07:00`. Facebook-embedded clips are not your own watch page and are not candidates. Nothing is output today, which is correct.

## 4. Rank Math conflict strategy (proposal, not applied)

Goal: **one business entity, `https://team-dee.com/#business`, one breadcrumb trail per URL, and Rank Math kept for WP posts and archives.**

A. Rank Math settings (Art, WP admin):
1. Titles & Meta > Local SEO: Organization (not Person). Name **TEAMDEE**, alternate name **ทีมดี**, logo = square PNG, phone +66975495941, address as in F5, hours as decided in F4, and the same geo as GBP.
2. Titles & Meta > Homepage/Global: Website name **TEAMDEE** (not "TEAMDEE STUDIO", unless that is the official GBP name; whatever you pick must be the same everywhere).
3. WP Settings > General > Site Language: **ภาษาไทย**. This fixes `inLanguage`, `og:locale` and post dates.
4. Breadcrumbs: set the Homepage label to **หน้าแรก**.
5. Delete any page-level schema on theme pages (the Schema tab on /embroidery/ etc.) and find and remove the hand-written LocalBusiness block (109/20) in whichever header-code plugin or old-theme option holds it.
6. Social: set the default OG image to a 1200×630 JPG, not the logo.

B. Theme filter (code shape only; confirm the `$data` keys by dumping them on staging first; 70% confidence in the key names `publisher`, `WebSite`, `WebPage`, `BreadcrumbList`, `richSnippet` and `schema-*`):
```php
add_filter('rank_math/json_ld', function ($data, $jsonld) {
    $biz = home_url('/#business');
    // 1) one business node: replace Rank Math's Organization/Person with the theme's business data (same @id everywhere)
    $data['publisher'] = td_business_schema();          // PHP port of businessSchema(), or read build JSON
    // 2) repoint every reference (#person / #organization) to /#business
    array_walk_recursive($data, function (&$v, $k) use ($biz) {
        if ($k === '@id' && is_string($v) && preg_match('~/#(person|organization)$~', $v)) $v = $biz;
    });
    // 3) WebSite: brand name, Thai, drop obsolete SearchAction
    if (isset($data['WebSite'])) {
        $data['WebSite']['name'] = 'TEAMDEE';
        $data['WebSite']['alternateName'] = 'ทีมดี';
        $data['WebSite']['inLanguage'] = 'th';
        unset($data['WebSite']['potentialAction']);
    }
    // 4) theme routes: the theme prints its own BreadcrumbList/FAQ/etc. → drop Rank Math's crumb and any leftover per-page schema
    if (function_exists('td_current') && td_current()) {
        unset($data['BreadcrumbList']);
        foreach (array_keys($data) as $k) if (str_starts_with((string) $k, 'schema-')) unset($data[$k]);
    }
    return $data;
}, 99, 2);
```
Then stop printing the standalone LocalBusiness from `homeLd`/`businessLd` when `td_has_seo_plugin()` is true, or keep it. Identical data under the same `@id` merges cleanly, but one source is easier to keep right. Do **not** return an empty array: that removes all Rank Math schema, including on posts.

C. OG: filter Rank Math's image hooks (F7) to return the per-page build image, or disable Rank Math OG on theme routes and keep the theme tags. Either way, verify with the Facebook Sharing Debugger and a LINE chat preview after launch.

D. Verify on staging: Rich Results Test and validator.schema.org on `/`, `/embroidery/`, one use page, one guide and one post. Expect exactly one LocalBusiness `@id`, one BreadcrumbList, and no SearchAction.

## 5. Local SEO readiness

### NAP consistency
| Source | Name | Address | Phone | Hours |
|---|---|---|---|---|
| site.json / footer / contact / about (new theme) | TEAMDEE · บริษัท ดีดี ฟินิกซ์ จำกัด | 264 ถนนเลี่ยงเมืองนนท์ ตำบลตลาดขวัญ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000 | 097-549-5941, 086-416-6449 | ทุกวัน 8:30–21:00 |
| New schema | TEAMDEE | 264 … (ตำบล dropped) | +66975495941 | Mo-Su 08:30-21:00 |
| Contact map iframe and every "ดูแผนที่" link (all pages) | n/a | address-search query for 264, **not the place** | n/a | n/a |
| Live Rank Math + extra block | TEAMDEE STUDIO (+ long name) | **109/20** ถนนเลี่ยงเมืองนนทบุรี, "Nonthaburi" | +66975495941 | **09–17, no Thursday** |
| Old GBP pin (maps short link) | **"FinixSports ผลิตและออกแบบเสื้อกีฬาพิมพ์ลาย"** | coordinates = schema geo | not verified | not verified |

The new theme is internally consistent. The off-site sources are not.

### Google Business Profile
- WebSearch (US index) returned nothing for "TEAMDEE นนทบุรี", "ทีมดี เสื้อทีม นนทบุรี", "TEAMDEE STUDIO Nonthaburi" or "FinixSports …". **I could not verify a TEAMDEE GBP, its category, hours or reviews.**
- The only hard evidence is the old short link, which resolves to a Maps place named "FinixSports …" (place ID ends in `…fb8179af`). site.json says พี่ทัช must fix the pin. Art should check, logged in himself, whether TEAMDEE has its own verified profile or whether that FinixSports listing is the one being used.

### Location page
`/contact-us/` already has the address text, an embedded map, hours, both phones, LINE and the legal name. That is good. Gaps:
- Switch the map to the GBP place embed once the pin is right.
- State the visit policy clearly (walk-in vs appointment; confirm with พี่ทัช before writing it).
- Add a one-line service-area statement: the site already says it ships nationwide in 1–3 days, so something like "รับงานทั่วประเทศ จัดส่งทุกจังหวัด · สำนักงานอยู่นนทบุรี".
- Add BreadcrumbList and `ContactPage` schema that points to `{"@id":"https://team-dee.com/#business"}`.

A separate location landing page is not needed for one location.

### GBP actions for Art (only real data)
1. Claim or verify the TEAMDEE profile and fix the pin to the real entrance (264). If the FinixSports listing is a different brand, keep it separate. Do not merge brands.
2. Business name exactly as on signage (TEAMDEE / ทีมดี), with no keyword stuffing.
3. Categories: pick from GBP's own list. Likely candidates are a custom T-shirt store, clothing manufacturer, embroidery service or screen printer type. Choose one primary that matches the main revenue line and add 2–4 secondary. Confirm in GBP's dropdown, since the exact category names in Thai may differ.
4. Hours = the walk-in hours decided in F4. Add special hours for public holidays.
5. Products: polo embroidery, sublimation print, screen, baseball, jersey, each with the price range from prices.json, a real photo and a link to the page.
6. Services list plus a service area (Nonthaburi, Bangkok, nationwide shipping), if GBP allows that with a visible address.
7. Photos: real production, team and storefront photos only (Drive "รูปภาพโรงงาน" folder), no AI images, and no "ภาพจำลอง" labels. Upload regularly.
8. Posts: one or two a month (new case, promo, how-to). Link each with UTM.
9. Q&A: seed real questions from `/faq/` (MOQ 10, 15–20 day production, 50% deposit, tax invoice).
10. Reviews: send a GBP review link after delivery (LINE message template). Reply to every review. Never pay for or gate reviews.
11. Website link = `https://team-dee.com/?utm_source=gbp` (or the bare URL). Phone = 097-549-5941.

## 6. E-E-A-T signals

| Signal | Status |
|---|---|
| Company facts on /about-us/ | ✓ legal name บริษัท ดีดี ฟินิกซ์ จำกัด, "จดทะเบียนบริษัท 19 มกราคม 2021", "ดูแลงานเสื้อทีมตั้งแต่ปี 2018", address, ภ.พ.20 on request |
| Real team and production photos | ✓ per data-notes (real photos from Drive, no generated faces) |
| Policies | ✓ `/privacy-policy/` and `/terms-conditions/` linked in the footer (200 locally; privacy 200 live). ✗ no cookie policy, and `cookieConsent=false` must be set to true before launch (PDPA) |
| Contact transparency | ✓ address, two phones, LINE, hours, map, legal name in footer |
| Article authorship | ✗ live posts are by "admin" (F11). Theme articles have no author (F12) |
| Schema backing | `foundingDate 2018` ✓, `legalName` ✓. `taxID` (if supplied) and `sameAs` (LINE, FB, IG) ✓. Consider adding the DBD company page URL to `sameAs` if Art confirms it is public |

## 7. Verified vs not verified

Verified (with output):
- 48 local pages fetched, all 200. Every JSON-LD block parses.
- Types per page as tabled.
- 154/154 FAQ items visible.
- Breadcrumb comparison per page.
- og:image on 48/48 pages; 39 unique images resolve 200 locally, with measured dimensions.
- Theme strips OG and keeps JSON-LD when an SEO plugin is present (functions.php lines 472–485).
- Live Rank Math output on 3 pages.
- Old map link resolves to the "FinixSports" place at exactly the schema geo.
- Google docs: FAQ deprecation (7 May 2026), LocalBusiness and Organization properties, Product snippet requirements, Article and Breadcrumb guidance.

Not verified:
- Whether a TEAMDEE GBP exists, and its category, hours or reviews (search index blind to Thai Maps; did not log in).
- Whether 264 and 109/20 are the same building.
- The source of the non-Rank-Math LocalBusiness block on live.
- Exact Rank Math `$data` keys and OG filter names in the installed version.
- LINE support for WebP og:image.
- Rich Results Test (no browser test run).
- What Rank Math will output for theme pages after the theme switch (inferred from live).

## Sources
- Google FAQPage doc and changelog: https://developers.google.com/search/docs/appearance/structured-data/faqpage
- Google LocalBusiness: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Google Organization: https://developers.google.com/search/docs/appearance/structured-data/organization
- Google Product snippet: https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Google Article: https://developers.google.com/search/docs/appearance/structured-data/article
- Google Breadcrumb: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Self-serving reviews (Google, 2019): https://webmasters.googleblog.com/2019/09/making-review-rich-results-more-helpful.html
- Sitelinks search box retired: https://www.seroundtable.com/google-sitelinks-search-box-going-away-38284.html
- Rank Math, remove Organization schema (`rank_math/json_ld`): https://rankmath.com/kb/remove-organization-schema/
- WebP og:image: https://www.ctrl.blog/entry/webp-ogp/ · LINE FAQ: https://developers.line.biz/en/faq/tags/line-app/
