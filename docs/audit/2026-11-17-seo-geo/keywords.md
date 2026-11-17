# TEAMDEE — Thai keyword + competitor research (17 พ.ย. 2026)

Report only. No project files were edited. Sources: Google autocomplete (hl=th, gl=th) via WebFetch, ~22 seeds · WebSearch extended, ~16 queries · WebFetch of 6 competitor pages plus the live team-dee.com home page · local files `wp-theme/teamdee/build/pages.json`, `src/data/{faq,prices,lead-times,articles,seo-keywords,reviews}.json`, `src/content/*`, built pages in `wp-theme/teamdee/build/pages/`.

Total requests: about 58. Bash scraping of autocomplete was denied by the permission system, so every request went through WebFetch/WebSearch. A DuckDuckGo bot check was not attempted.

---

## 0. Method limits (read first)

- **No search volumes.** I had no keyword-volume tool. Priority below comes from three signals: (1) whether Google autocomplete offers the phrase in Thailand, (2) commercial intent, and (3) how many competitor titles target it. Treat it as a ranking of likelihood, not of measured traffic.
- **No real Google TH SERP.** Google SERP HTML did not render. Bing returned garbage, and DuckDuckGo showed a bot check. "Top 5" lists therefore come from WebSearch extended, which is US-based and only approximates the Thai Google order. Use them as "who competes", not as exact positions.
- **AI Overviews and rich results could not be observed.** WebFetch strips markup and SERP features. Every schema remark about competitors is marked "unverified".
- Google autocomplete normalises `ทำ` to `ทํา` (นิคหิต + สระอา). Google matches both forms, so no action is needed.

---

## 1. Keyword map

Legend: **AC** = appears in Google TH autocomplete · **SERP** = competitors target it in titles · ★ priority (3 = high).

### 1.1 Head / brand-level ("รับทำเสื้อทีม / สั่งทำเสื้อ / ผลิตเสื้อ")

| Query (real phrasing) | Signal | Intent | Best page | Note |
|---|---|---|---|---|
| รับทำเสื้อทีม · ทำเสื้อทีม · ทำเสื้อทีมงาน | AC | commercial | `/` | Already in the home title. Keep it. |
| รับทำเสื้อ · สั่งทำเสื้อ | AC | commercial | `/` | Autocomplete expands to พิมพ์ลาย / กีฬา / โปโล / สกรีน / วิ่ง / ยืด / บอล / แจ็คเก็ต / ช็อป. |
| รับผลิตเสื้อ · ผลิตเสื้อ | SERP | commercial | `/` + `/about-us/` | Use the verb "ผลิต" as a substitute for the "โรงงาน" intent (see 1.4). |
| โรงงานผลิตเสื้อ · โรงงานผลิตเสื้อกีฬา · …เสื้อพิมพ์ลาย · …เสื้อวิ่ง · โรงงานผลิตเสื้อผ้าใกล้ฉัน | AC | commercial (bulk/B2B) | `/sublimation/`, `/sport/`, `/custom-running-shirts/`, `/about-us/` | Cannot use the word on the site. See 1.4. |
| เสื้อทีม | AC | mostly fan jerseys (ทีมชาติ) | — | Not a buying query. Do not chase it alone; pair it with รับทำ/สั่งทำ. |

### 1.2 Products

| Query | Signal | Best page | Note |
|---|---|---|---|
| สั่งทำเสื้อพิมพ์ลาย · รับทำเสื้อพิมพ์ลาย · เสื้อพิมพ์ลาย ออกแบบเอง · เสื้อพิมพ์ลาย ราคาส่ง · เสื้อพิมพ์ลาย คอปก · เสื้อพิมพ์ลายแขนยาว | AC ★3 | `/sublimation/` | Long sleeve +30 ฿ and collar options exist in prices.json, so they can be mentioned. |
| ราคาเสื้อพิมพ์ลายต่อตัว · ราคาผลิตเสื้อซับลิเมชัน | SERP ★3 | `/sublimation/` + **upgrade `/calculations/`** | KDC ranks with a dedicated price article. |
| sublimation คืออะไร · เสื้อซับลิเมชัน | SERP ★2 | **missing article** | pimlai.in.th has a guide on this. |
| สั่งทำเสื้อโปโล · รับทำเสื้อโปโล · รับทำเสื้อโปโล พร้อมปัก · รับทำเสื้อโปโล ไม่มีขั้นต่ำ | AC ★3 | `/embroidery/` | The minimum is 10, so do not target "ไม่มีขั้นต่ำ" for polo. |
| เสื้อโปโลปักโลโก้ · เสื้อโปโลปัก · เสื้อโปโล ปักโลโก้ · เสื้อโปโล ราคา | AC ★3 | `/embroidery/` | |
| ปักโลโก้เสื้อ · ปักโลโก้ เสื้อ ราคา · ปักโลโก้ที่กระเป๋าเสื้อ · ปักโลโก้โรงเรียน · ปักโลโก้ ใกล้ฉัน | AC ★2 | `/embroidery/` (+ `/education/` for ปักโลโก้โรงเรียน) | Add an FAQ/H2 on embroidery positions and extra-position cost. Competitors list +25 ฿ per position. Owner to confirm TEAMDEE's rate. |
| สกรีนเสื้อ · สกรีนเสื้อด่วน · สกรีนเสื้อ ไม่มีขั้นต่ำ · สกรีนเสื้อด่วน รอรับได้เลย · สกรีนเสื้อกีฬา | AC ★3 | `/screen-printing/` | Starting at 1 piece is a true "ไม่มีขั้นต่ำ"-style claim. "รอรับได้เลย" (same-day) is **not** offered (3–14 days), so don't target it. |
| สั่งทำเสื้อยืด · รับทำเสื้อยืด | AC ★2 | `/screen-printing/` | Premium C32 is a T-shirt. Add "เสื้อยืดสกรีน" phrasing. |
| เสื้อวอร์ม (สั่งทำ) | seo-keywords | `/custom-printed-warmup-shirts/` | |
| เสื้อเบสบอล (สั่งทำ) | seo-keywords | `/custom-baseball-shirts/` | |
| รับทำเสื้อ jersey · เสื้อกีฬา jersey | AC ★2 | `/custom-oversize-jerseys/` | Put "Jersey" in Latin script plus "เจอร์ซีย์" in the title/H1. Both are used. |
| สั่งทำเสื้อบอล · ทำเสื้อทีมฟุตบอล · เสื้อทีมฟุตบอล | AC ★3 | **missing page** | Only `/sport/` covers it today. |
| รับทำเสื้อแจ็คเก็ต · สั่งทำเสื้อแจ็คเก็ต · รับทำเสื้อช็อป | AC | — | Not in the product list. **Owner to confirm** before any page. |

### 1.3 Customer groups

| Query | Signal | Best page |
|---|---|---|
| เสื้อบริษัท · เสื้อบริษัท โปโล · เสื้อบริษัทสวยๆ · เสื้อพนักงานบริษัท · เสื้อพนักงานออฟฟิศ | AC ★3 | `/corporate/` (สวยๆ → `/corporate-shirts/` gallery) |
| ยูนิฟอร์มพนักงาน · ยูนิฟอร์มพนักงานออฟฟิศ · ยูนิฟอร์มพนักงานโรงแรม | AC ★3 | `/corporate/` |
| เสื้อพนักงานร้านอาหาร · ชุดพนักงานร้านกาแฟ · เสื้อพนักงานคาเฟ่ | SERP ★2 | `/custom-staff-shirts/` |
| เสื้อพนักงาน (alone) | AC | Retail-brand noise (เซเว่น / CJ / โลตัส). Low value. |
| เสื้อหน่วยงาน · เสื้อราชการ | — ★2 | `/custom-organization-shirts/` |
| เสื้อกีฬาสี · เสื้อกีฬาสี + สี (เขียว / แดง / ม่วง / ฟ้า / เหลือง / ชมพู / ส้ม) · สั่งทำเสื้อกีฬาสี | AC ★3 | `/education/` + `/educations-shirt/` (colour filter) |
| เสื้อรุ่น · เสื้อรุ่นสวยๆ · เสื้อรุ่นโรงเรียน · เสื้อรุ่นคอปก · เสื้อรุ่นโปโล · เสื้อรุ่นแขนยาว · เสื้อรุ่น ภาษาอังกฤษ | AC ★3 | `/custom-class-shirts/` (สวยๆ → `/class-shirt-designs/`) |
| เสื้อคณะ · เสื้อคณะวิศวะ / บริหารธุรกิจ / วิทยาศาสตร์ / ครุศาสตร์ / นิติศาสตร์ · เสื้อคณะสี | AC ★2 | `/custom-university-shirts/` + `/university-shirt-designs/` |
| สั่งทำเสื้อวิ่ง · รับทำเสื้อวิ่ง · เสื้องานวิ่ง · ผ้าเสื้อวิ่ง | AC ★2 | `/custom-running-shirts/` |
| เสื้อแบด · เสื้อแบดมินตัน · เสื้อก๊วนแบด | AC ★2 | `/custom-badminton-shirts/` | Autocomplete is dominated by Yonex/Victor retail, so always pair it with สั่งทำ / ก๊วน / พิมพ์ลาย. |
| สั่งทำเสื้อกีฬา · รับทำเสื้อกีฬา · เสื้อกีฬา ใกล้ฉัน | AC ★3 | `/sport/` |
| เสื้อกิจกรรม · เสื้ออีเวนต์ · เสื้อ outing | ★2 | `/event/` |

### 1.4 How to target "โรงงาน" intent without the word

Fact found: the **live** team-dee.com home page uses "โรงงาน" in its title ("โรงงานรับผลิตเสื้อ รับผลิตเสื้อโปโล ยูนิฟอร์มองค์กรครบวงจร"), in the H1 ("โรงงานผลิตเสื้อ…") and in one H2 ("ราคาตรงจากโรงงาน"). The new theme removes the word, so **rankings on "โรงงานผลิตเสื้อ…" queries are likely to drop after launch**. Accept some of that loss. To keep the intent:

1. **Use the verb, not the noun.** Put "รับผลิตเสื้อ", "ผลิตเสื้อทีม" and "สั่งผลิต" in H1/H2/descriptions. Google treats "โรงงานผลิตเสื้อ" and "รับผลิตเสื้อ" as near-synonyms because the commercial intent is the same. Competitor titles mix both.
2. **Show the production signals that searchers of "โรงงาน" want:**
   - real production photos (Art has the Drive folder of SSB production photos)
   - the machine and process steps
   - daily capacity, **if the owner confirms a number**
   - in-house QC and the photo-before-packing step (FAQ)
   - "ราคาจากผู้ผลิตโดยตรง" — **only if true**; owner to confirm whether TEAMDEE/SSB runs its own production
   
   Put these in an `/about-us/` section titled e.g. "ขั้นตอนผลิตและตรวจงาน".
3. **Bulk-buyer cues** that "โรงงาน" searchers look for, all already true in the data:
   - price tiers up to 2,001+ pieces
   - full tax invoice (ใบกำกับภาษีเต็มรูป)
   - credit card and billing (วางบิล)
   - delivery to multiple branches (ส่งแยกหลายสาขา)
   - procurement documents (เอกสารจัดซื้อ)
4. **Off-site.** Google Business Profile can carry a manufacturer-type category even though the site never says "โรงงาน". This is an owner decision.
5. **Article for the "เลือกโรงงาน" intent** without the word: "เลือกผู้ผลิตเสื้อทีมยังไง 8 ข้อที่ควรถามก่อนโอนมัดจำ". KDC ranks a page for this intent (`/lueak-rongngan-tham-suea/`).

### 1.5 Guides and questions

| Query | Signal | Best page |
|---|---|---|
| ตารางไซส์เสื้อ · ตารางไซส์เสื้อมาตรฐาน · ตารางไซส์เสื้อกีฬา · ตารางไซส์เสื้อเด็ก · ตารางไซส์เสื้อ ผู้ชาย | AC ★3 | `/size-chart/`. Use these exact phrases in the H2s and keep the size charts as HTML tables, not images. |
| ผ้าเสื้อกีฬา · ผ้าเสื้อกีฬาคือผ้าอะไร · ผ้าเสื้อโปโล · ผ้าเสื้อวิ่ง · ผ้าเสื้อบอล | AC ★3 | `/fabric-technology/`. The **live page already ranks** for "ผ้าเสื้อกีฬา…ไมโคร ดรายเทค รังผึ้ง". |
| ผ้าไมโครคืออะไร · ผ้ารังผึ้ง vs ไมโคร · Dry Tech คืออะไร | SERP ★2 | `/fabric-technology/` (H2s) or articles |
| สั่งทำเสื้อ กี่วัน · ต้องสั่งล่วงหน้ากี่วัน | SERP ★2 | blog `when-to-start` + `/faq/` |
| ขั้นตอนสั่งทำเสื้อ · มัดจำ | SERP ★2 | `/printed-shirt-order-guide/`, `/embroidered-polo-order-guide/` |
| ปัก กับ สกรีน ต่างกันยังไง · ปักคอม สกรีน DTF ต่างกัน | SERP ★2 | `/polo-vs-printed-shirts/` + blog `print-vs-embroidery`. Watch for cannibalisation between them. |
| เตรียมไฟล์โลโก้ · ไฟล์สกรีนเสื้อ | ★1 | `/artwork-preparation-guide/` |
| คำนวณราคาเสื้อ | ★2 | `/calculations/` |
| วิธีซักเสื้อพิมพ์ลาย · ดูแลเสื้อโปโล | SERP (12tees) ★1 | **missing** |

### 1.6 Local

| Query | Signal | Best page |
|---|---|---|
| สกรีนเสื้อ นนทบุรี · เสื้อพิมพ์ลาย นนทบุรี | AC ★2 | `/contact-us/` + `/about-us/` + Google Business Profile |
| สกรีนเสื้อใกล้ฉัน · เสื้อพิมพ์ลายใกล้ฉัน · ปักโลโก้ใกล้ฉัน · โรงงานผลิตเสื้อผ้าใกล้ฉัน | AC ★2 | Won mainly by the Map Pack / GBP, not by pages. The site needs a consistent NAP plus LocalBusiness schema (already present on home). |
| รับทำเสื้อ + กรุงเทพ | — | Do **not** build province doorway pages like KDC does. At most, one honest "พื้นที่ให้บริการ" paragraph on contact: นนทบุรี, กรุงเทพ, ปทุมธานี, ส่งฟรีทั่วไทย. |

---

## 2. SERP competitor analysis (approximate — see section 0)

| # | Head query | Main competitors seen | Winning page type |
|---|---|---|---|
| 1 | รับทำเสื้อทีม / สั่งทำเสื้อทีม ราคา | sabuygarment.com, pimlai.in.th, pmkpolomaker.com, premiums.co.th, fastwork.co, tiger-made, 12tees | Category/service landing page with a price hook in the title |
| 2 | สั่งทำเสื้อพิมพ์ลาย ราคาต่อตัว | kdc-x.com (×4 URLs), derndai.com, pimlai.in.th, ho-shi.com, virgo-sport | Price-table article plus category page |
| 3 | เสื้อโปโลปักโลโก้ ราคา ขั้นต่ำ | phap-pim142, goodthinkdesign, pimdai, polozy, smartpolouniform, pmkpolomaker, premiums, 12tees, mixprint | Product category page (polo) with fabric list and price table |
| 4 | สั่งทำเสื้อกีฬาสี | sabuygarment, **team-dee.com/education/** (live), theprintshopping, finixsports.com, pimlai articles, schoolshop | Category pages plus blog articles |
| 5 | สั่งทำเสื้อรุ่น / เสื้อคณะ | pmkpolomaker, **team-dee.com/education/**, nicefashionmarketing, sabuy, polomaker, priceza (price comparison) | Category pages; priceza for "ราคา" |
| 6 | เสื้อบริษัท / ยูนิฟอร์มพนักงาน ราคา | ninefivewearing, sspgarment, sahawath ×2, mixprint, fastwork, pmkpolomaker, polomaker, working-uniforms | Uniform category pages with price ranges per fabric |
| 7 | สกรีนเสื้อ นนทบุรี | goldensport (local landing), pmkpolomaker (Muang Thong branch page), LnwShop shops, iGetWeb sites | Local landing pages and LnwShop catalogues |
| 8 | สั่งทำเสื้อวิ่ง | sabuygarment, tarathaisilk, kdc-x, touch-printing, sahawath, hybridsport, pmk, pimlai, smartprintfabric | Category pages |
| 9 | สั่งทำเสื้อแบด / ก๊วนแบด | sportmighty (gallery item), snamsup, tarathaisilk, ideamark (Nonthaburi), touch-printing, pimlai, kdcsport, **Facebook page (Atom)** | Gallery pages, small shops, Facebook |
| 10 | โรงงานผลิตเสื้อกีฬา/พิมพ์ลาย นนทบุรี | **Facebook pages** (Compass Sublimation, FinixSports, BK SPORT), shopper-house, iGetWeb, virgo-sport | Facebook pages and local shops dominate |
| 11 | ผ้าเสื้อกีฬา ผ้าอะไรดี | **team-dee.com/fabric-technology/** (live), thanaplus, smartpolouniform, smartpoloandtshirt, maytaporn, polonext, somsritshirt | Blog guides from manufacturers |
| 12 | ปัก vs สกรีน แบบไหนดี | mixprint, alaknitting, ppkarnpak, 3pgarment, thanaplus | Blog comparison articles |
| 13 | ใช้เวลากี่วัน / ขั้นตอน / มัดจำ | pimlai, pmk, 12tees, smartpolouniform, smartsublimationshirt (FAQ post), kdc-x (how-to) | FAQ posts and how-to guides |
| 14 | เสื้อพนักงานร้านกาแฟ ร้านอาหาร | Facebook (embroidery shop), smartpolouniform, kdc-x, siamzion (×3 articles), punwarin, lovelooklike | Articles plus ready-made uniform shops |

### 2.1 Patterns that win

- **Title formula.** `[รับทำ/รับผลิต + product] + [hook: ราคาเริ่มต้น X / ขั้นต่ำ N ตัว / ออกแบบฟรี / ไม่มีขั้นต่ำ / ราคาโรงงาน 2026] | Brand`. Examples:
  - "รับทำเสื้อพิมพ์ลาย ราคาโรงงาน ขั้นต่ำ 5 ตัว | PIMLAI"
  - "รับผลิตเสื้อพิมพ์ลาย ชุดกีฬา ออกแบบฟรี ราคาเริ่มต้นตัวละ 139"
  - "ราคาเสื้อพิมพ์ลายต่อตัว เริ่ม 1 ตัว | KDC SPORT"
  
  TEAMDEE's new titles have **no number hook at all**, even though it has true numbers.
- **Price transparency is normal now.** pimlai, kdc and 12tees publish quantity tiers. Many prices **exclude VAT** (KDC, 12tees, SSP), and several add shipping. TEAMDEE is **VAT-inclusive, ships free nationwide, and charges the same price for every size**. That is a real differentiator, and it is not yet in any title or description except `/calculations/`.
- **Minimums seen.**
  - 1 piece: KDC, Mixprint, Hybrid
  - 5 pieces: pimlai
  - 10 pieces: sabuy, phap-pim, b-look
  - 20 pieces: PMK, ideamark
  - 30 pieces: 12tees polo
  - 50 pieces: 12tees T-shirt, Tara
  
  TEAMDEE's 10 (1 for screen) is mid-market. Say it plainly.
- **Lead time seen.**
  - 7–15 days: pimlai, KDC, PMK custom
  - 20–25 working days: 12tees polo
  - Rush 3–5 days: KDC charges +20–30%; PMK only for ready-made shirts
  
  TEAMDEE quotes 10–15 days for polo and 15–20 for print, counted from design approval, with **rush from 7 days at no surcharge**. Its print lead time looks slower than the advertised 7–15. Counter by explaining "นับจากวันยืนยันแบบ" and the rush-without-surcharge option. Don't shorten the numbers.
- **Trust signals seen.**
  - KDC: Google reviews 5.0 from 8 reviews
  - sabuy: 3 named testimonials with stars, client case "BYD 15,000 pcs"
  - PMK: ISO 9001, DBD mark, "40,000+ organisations"
  - 12tees: logo wall, "~10,000 customers"
  
  TEAMDEE has real customer photos and chat reviews. Keep them real. **Do not mark them up as AggregateRating.** Google treats self-collected reviews about your own business as ineligible for review stars.
- **Long single category pages win.** 12tees's polo page holds a fabric table (11 fabrics), a price table, a calculator, a size chart, embroidery vs screen, care, use-by-industry and an FAQ. TEAMDEE's `/embroidery/` and `/sublimation/` are already comparable in scope (about 70k bytes each). The gap is the hook in the title/description and a few topics (care, extra positions, sample).
- **Facebook pages win local and niche queries** (Nonthaburi sublimation, badminton). A maintained Facebook page plus GBP with the same name, address and phone helps more than another site page.
- **FinixSports appears** in the กีฬาสี and lead-time SERPs (finixsports.com and its Facebook page). TEAMDEE invoices as บริษัท ดีดี ฟินิกซ์ จำกัด. **Owner to confirm** whether FinixSports is the same company. If it is, the two sites compete on the same queries, so decide which domain owns which topics and avoid duplicate copy. finixsports.com did not resolve (DNS) when fetched today.

### 2.2 Schema, rich results and AI Overviews

- Competitor JSON-LD could **not be verified**, because WebFetch strips markup.
- TEAMDEE's built pages already have static JSON-LD:
  - FAQPage and BreadcrumbList on product, group and FAQ pages
  - LocalBusiness with GeoCoordinates on home
  - `/fabric-technology/` has only BreadcrumbList
- FAQPage no longer produces rich results for commercial sites (Google restricted this in 2023). It is harmless and may still help AI answers.
- Worth adding:
  - `Product` or `Service` with `offers` as an AggregateOffer (lowPrice/highPrice in THB from prices.json) on the 6 product pages
  - `Organization` (legal name ดีดี ฟินิกซ์, logo, sameAs to LINE OA and Facebook)
  - `ItemList`/`ImageObject` on the galleries
- AI Overviews: **not observable** with the tools available. Informational queries ("ผ้าเสื้อกีฬาคือผ้าอะไร", "sublimation คืออะไร", "ปัก vs สกรีน") are the type most likely to show them. The new site's fact-dense FAQ answers suit them.

---

## 3. Content gaps

### 3.1 Questions competitors answer — TEAMDEE coverage check

| Topic | Competitors | TEAMDEE now | Gap? |
|---|---|---|---|
| Price per piece by quantity | pimlai, KDC, 12tees | Yes (prices.json: polo, print, baseball, jersey, screen) | No. Surface it in titles and descriptions. |
| VAT in or out | KDC/12tees exclude | Included, plus full tax invoice | No. Advertise it. |
| Lead time by technique | most | Yes (lead-times.json) | No |
| Lead time **by quantity** | KDC (rush), few others | No | Small gap. **Owner data needed.** |
| Fabric comparison | pimlai (11, compare tool), 12tees (11 with prices), sabuy | Polo 6 fabrics with prices; `/fabric-technology/` | Partial. No side-by-side table of polo fabrics on one guide page. |
| Size chart | 12tees (S–4XL), pimlai (kids–10XL), sabuy (image) | Yes, SS–7XL, kids, polo to 11XL | No. TEAMDEE is stronger here. |
| Care / washing | 12tees, pimlai FAQ | Only the screen FAQ "ควรดูแลเสื้อสกรีนอย่างไร" | **Gap** |
| Payment terms | PMK (50% + card), pimlai vague | Yes: 50% deposit, card, billing | No |
| Tax invoice / procurement docs | PMK, pimlai | Yes (FAQ plus gov-docs article) | No |
| Sample policy | PMK: free sample shirt at 200+ pcs; 12tees: sample step | Free fabric swatch; sample shirt "ตามเงื่อนไขของงาน" | **Vague.** Owner to define when a sample shirt is free. |
| Design files | pimlai, sabuy (CMYK) | Yes (`/artwork-preparation-guide/`) | No |
| Minimum order | all | Yes | No |
| Extra embroidery position price | 12tees (+25 ฿) | "ราคาขึ้นกับฝีเข็ม" | Gap. Owner to confirm a rate or range. |
| Guarantee window | 12tees 60 days, PMK 30 days | 7-day claim; reorder within 30 days at the same price | Shorter. Don't change the policy for SEO; just state it clearly. |
| Football shirt page | many | none | **Gap** |
| Sublimation explainer | pimlai, KDC | none | **Gap** |

### 3.2 Thin or overlapping pages (from built HTML; visible text size including the ~8–9k-byte nav/footer baseline)

- `/team-shirt-fabric-guide/` (~2.9k chars of text) overlaps `/fabric-technology/` and blog `pick-fabric`. The intro sentence is rendered twice. Its description is template-like ("ข้อมูล… เพื่อเลือกแบบและวางรายละเอียดการสั่งทำกับทีมดี").
  - **Option A:** merge it into `/fabric-technology/` with a 301.
  - **Option B:** refocus it on "ผ้าเสื้อกีฬากลางแจ้ง vs ในอาคาร" with real fabric specs.
- `/team-shirt-design-ideas/` (~2.7k chars) has the same duplicated intro and a templated description. Expand it with real examples by group, e.g. กีฬาสี colour sets and เสื้อรุ่น styles, linking to galleries.
- Design galleries `/class-shirt-designs/`, `/running-shirt-designs/`, `/organization-shirt-designs/`, `/university-shirt-designs/`, `/staff-shirt-designs/` and `/badminton-shirt-designs/` are the thinnest pages (~12–13k bytes total). Add 2–3 short paragraphs, 3–4 FAQs and descriptive alt text on real designs. Galleries are fine thin-ish, but they must not be near-duplicates of each other.
- Cannibalisation pairs to watch:
  - `/polo-vs-printed-shirts/` ↔ blog `print-vs-embroidery`
  - `/fabric-technology/` ↔ `/team-shirt-fabric-guide/` ↔ blog `pick-fabric`
  - `/education/` ↔ `/custom-class-shirts/` ↔ `/custom-university-shirts/`. The live `/education/` title currently covers เสื้อรุ่น and เสื้อคณะ too. After launch, make `/education/` link prominently to the two dedicated pages with exact anchors.

### 3.3 Ranked gaps and new pages or articles

| Rank | Item | Target query | Intent | Effort | Notes |
|---|---|---|---|---|---|
| 1 | Add a number hook to titles and descriptions of money pages (section 4) | head queries | commercial | **S** (copy only) | Biggest gain for least work |
| 2 | New page `/custom-football-shirts/` "สั่งทำเสื้อฟุตบอล / เสื้อบอลทีม" | สั่งทำเสื้อบอล · ทำเสื้อทีมฟุตบอล | commercial | **M** | Reuse the `/sport/` content model and real football customer photos (reviews include company football teams). Needs a gallery filter. |
| 3 | Upgrade `/calculations/` into "ตารางราคา + เครื่องคำนวณ": static HTML tables of all products from prices.json above or below the calculator | ราคาเสื้อพิมพ์ลายต่อตัว · ราคาเสื้อทีม · เสื้อโปโลปัก ราคา | commercial investigation | **S–M** | Data is ready. Avoids a new thin page. |
| 4 | `/about-us/` "ขั้นตอนผลิตและตรวจงาน" section with real production photos, plus Organization schema | รับผลิตเสื้อ · (โรงงานผลิตเสื้อ intent) | trust/commercial | **S–M** | **Owner to confirm** production claims and any capacity numbers |
| 5 | Merge or expand the thin guides (3.2) | ผ้าเสื้อกีฬา · ไอเดียเสื้อรุ่น / กีฬาสี | info | **S** each | Keep the `/fabric-technology/` URL; it ranks on the live site |
| 6 | Product/Service + AggregateOffer schema on the 6 product pages | price queries | — | **S** | Prices from prices.json only |
| 7 | Article: "เสื้อพิมพ์ลายซับลิเมชันคืออะไร ต่างจากสกรีนและ DFT ยังไง" | sublimation คืออะไร | info | **S** | |
| 8 | Article: "ผ้าเสื้อโปโลแบบไหนดี เทียบจูติ TC ทรีคอต ปีเก้ ดรายเทค" | ผ้าเสื้อโปโล · เสื้อบริษัท โปโล | info → commercial | **S–M** | Use only verified fabric specs from polo.json and the swatches |
| 9 | Article: "วิธีซักและดูแลเสื้อพิมพ์ลาย เสื้อโปโลปัก และเสื้อสกรีน ให้ใส่ได้นาน" | วิธีซักเสื้อพิมพ์ลาย | info | **S** | Owner or production to confirm care rules |
| 10 | Article: "เลือกผู้ผลิตเสื้อทีมยังไง 8 ข้อที่ควรถามก่อนโอนมัดจำ" | เลือกโรงงานทำเสื้อ (intent) | commercial investigation | **S** | Never use "โรงงาน" in the copy |
| 11 | Article: "ไอเดียเสื้อกีฬาสี แยก 4 สีให้ภาพหมู่สวย พร้อมแบบจริง" | เสื้อกีฬาสี + สี | info → gallery | **S** | Link `/educations-shirt/` with a colour filter |
| 12 | Article: "เสื้อรุ่นแบบไหนดี คอกลม คอปก โปโล หรือเบสบอล" | เสื้อรุ่นคอปก · เสื้อรุ่นโปโล · เสื้อรุ่นแขนยาว | info → commercial | **S** | |
| 13 | Article: "เสื้อพนักงานคาเฟ่และร้านอาหาร เลือกผ้า สี และตำแหน่งปักโลโก้" | ชุดพนักงานร้านกาแฟ · เสื้อพนักงานร้านอาหาร | info → `/custom-staff-shirts/` | **S** | |
| 14 | Article: "สั่งทำเสื้อจำนวนน้อย 1–10 ตัว เลือกเทคนิคไหนคุ้ม" | สกรีนเสื้อ ไม่มีขั้นต่ำ · รับทำเสื้อโปโล ไม่มีขั้นต่ำ | commercial | **S** | Honest: screen from 1 piece, others from 10 |
| 15 | Article: "สั่งเสื้องานวิ่งสำหรับผู้จัด วางแผนไซซ์และวันแจกยังไง" | เสื้องานวิ่ง · สั่งทำเสื้อวิ่ง | info → commercial | **S** | |
| 16 | Lead time by quantity table on `/faq/` and the order guides | สั่งทำเสื้อ กี่วัน | info | **S** after data | **Owner data needed** |
| 17 | Sample-shirt policy stated precisely | เสื้อตัวอย่าง ก่อนผลิต | trust | **S** | **Owner decision** |
| 18 | Local: a consistent NAP line on contact/about, a "พื้นที่ให้บริการ" paragraph, GBP and Facebook kept in sync | สกรีนเสื้อ นนทบุรี · ใกล้ฉัน | local | **S** | No province doorway pages |
| 19 | Jacket / ช็อป shirt pages | รับทำเสื้อแจ็คเก็ต · เสื้อช็อป | commercial | — | **Only if the owner confirms they are offered** |

---

## 4. Title and description suggestions (money pages)

Rules applied:
- Lengths are counted in Unicode code points, including " | TEAMDEE" (Thai combining marks count). Titles ≤60, descriptions 70–160. Google truncates by pixel width, so Thai text that is ≤60 code points normally fits.
- Every number comes from `prices.json`, `lead-times.json`, `faq.json` or the existing page descriptions. Items marked ⚠ need owner confirmation.

| Page | Current title (len) | Proposed title (len) | Proposed description (len) | Why |
|---|---|---|---|---|
| `/` | รับทำเสื้อทีม โปโลปัก พิมพ์ลาย และสกรีน \| TEAMDEE (49) | **รับทำเสื้อทีม เสื้อบริษัท โปโลปัก พิมพ์ลาย สกรีน \| TEAMDEE** (58) | รับทำและผลิตเสื้อทีมครบในที่เดียว โปโลปักโลโก้ เสื้อพิมพ์ลาย สกรีน เริ่ม 10 ตัว (สกรีนเริ่ม 1 ตัว) ราคารวม VAT ส่งฟรีทั่วไทย ดูแบบ 3D ก่อนผลิต ออฟฟิศนนทบุรี (156) | Adds "เสื้อบริษัท" (high AC). The description carries "ผลิต", the minimum, VAT and free shipping, and the local term. |
| `/embroidery/` | รับทำเสื้อโปโลปัก สำหรับบริษัทและหน่วยงาน \| TEAMDEE (51) | **เสื้อโปโลปักโลโก้ สั่งทำเริ่ม 10 ตัว ราคารวม VAT \| TEAMDEE** (58) | สั่งทำเสื้อโปโลปักโลโก้ ราคารวมปัก 1 จุดที่อก เลือกผ้า 6 ชนิด เช่น จูติ TC ปีเก้ ดรายเทค ดูราคาตามจำนวน 10–50 ตัวเริ่ม 220 บาท รวม VAT ผลิตประมาณ 10–15 วัน (155) | Matches the AC phrase "เสื้อโปโลปักโลโก้". Puts a number hook where competitors put theirs. |
| `/sublimation/` | รับทำเสื้อพิมพ์ลาย / เสื้อโปโลพิมพ์ลาย \| TEAMDEE (48) | **รับทำเสื้อพิมพ์ลาย ซับลิเมชัน เริ่ม 10 ตัว \| TEAMDEE** (52) | เสื้อพิมพ์ลายทั้งตัว คอกลม คอวี คอปก ไม่จำกัดสี ใส่ชื่อและเบอร์รายคนไม่คิดเพิ่ม 10–20 ตัวเริ่ม 279 บาท คอปก 329 บาท ราคารวม VAT ผลิตประมาณ 15–20 วัน (148) | The current description has no numbers at all, while KDC and pimlai lead with price. Optional: keep "เสื้อโปโลพิมพ์ลาย" in the H1 if Art wants that phrase. |
| `/screen-printing/` | รับทำเสื้อสกรีน สำหรับบริษัท ทีมงาน และกิจกรรม \| TEAMDEE (56) | **สกรีนเสื้อ DFT เริ่ม 1 ตัว ราคารวม VAT ส่งฟรี \| TEAMDEE** (55) | สกรีนเสื้อยืด DFT สั่งได้ตั้งแต่ 1 ตัว เลือก Premium C32 หรือ Oversize C20 ราคารวมสกรีน 1 จุดและ VAT ส่งฟรีทั่วไทย ผลิต 3–14 วันตามขนาดงาน (138) | Matches the AC phrases "สกรีนเสื้อ" and "ไม่มีขั้นต่ำ" intent with a true claim. Add "นนทบุรี" only if walk-in pickup is offered ⚠. |
| `/corporate/` | รับทำเสื้อบริษัท / เสื้อพนักงาน พร้อมโลโก้ \| TEAMDEE (52) | **รับทำเสื้อบริษัท ยูนิฟอร์มพนักงาน ปักโลโก้ \| TEAMDEE** (52) | รับทำเสื้อบริษัทและยูนิฟอร์มพนักงาน โปโลปักหรือเสื้อพิมพ์ลาย วางสีองค์กรและโลโก้ ออกใบเสนอราคาและใบกำกับภาษีเต็มรูป สั่งเพิ่มสำหรับพนักงานใหม่ได้ ⚠ (145) | "ยูนิฟอร์มพนักงาน" is in AC. Art fixed this title on 22 Oct (seo-keywords.json note), so this change is **optional**. ⚠ Confirm the FAQ answer on adding new staff later. |
| `/education/` | สั่งทำเสื้อโรงเรียน / เสื้อกีฬาสี / เสื้อครู \| TEAMDEE (54) | **สั่งทำเสื้อกีฬาสี เสื้อโรงเรียน เสื้อครู \| TEAMDEE** (50) | สั่งทำเสื้อกีฬาสีและเสื้อทีมโรงเรียน แยกหลายสีในล็อตเดียว วางตราโรงเรียน ชื่อสี และจำนวนแยกไซซ์ มีไซซ์เด็ก ออกใบกำกับภาษีสำหรับเบิกโรงเรียนได้ (142) | Leads with the higher-demand "เสื้อกีฬาสี". The facts come from the FAQ (one lot with several colours, tax invoice) and the size chart (kids' sizes). |
| `/fabric-technology/` | วิธีเลือกผ้าสำหรับเสื้อทีมและยูนิฟอร์ม \| TEAMDEE (48) | **ผ้าเสื้อกีฬาและยูนิฟอร์ม แบบไหนดี เทียบทุกชนิด \| TEAMDEE** (56) | ผ้าเสื้อกีฬาและยูนิฟอร์มแบบไหนดี เทียบผ้าไมโครเรียบ รังผึ้ง ดรายเทค และผ้าอื่นตามงานที่ใส่ ทั้งระบายอากาศ ความทน และงานพิมพ์ ขอชิ้นผ้าตัวอย่างฟรีได้ (148) | The live page ranks for "ผ้าเสื้อกีฬา…". The new title drops that phrase, so this protects existing equity. |

Shorter fixes (titles currently over 60):

| Page | Current length | Proposed | New length |
|---|---|---|---|
| `/custom-staff-shirts/` | 64 | เสื้อพนักงานร้านอาหาร คาเฟ่ ร้านค้า ปักโลโก้ \| TEAMDEE | 54 |
| `/custom-running-shirts/` | 62 | สั่งทำเสื้อวิ่ง เสื้องานวิ่ง พิมพ์ลาย \| TEAMDEE | 47 |
| `/polo-vs-printed-shirts/` | 64 | โปโลปัก vs เสื้อพิมพ์ลาย แบบไหนเหมาะกับพนักงาน \| TEAMDEE | 56 |
| `/event-shirts/` | 64 | แบบเสื้ออีเวนต์ เสื้อกิจกรรม Outing พิมพ์ลาย \| TEAMDEE | 54 |
| `/badminton-shirt-designs/` | 62 | แบบเสื้อแบดมินตัน เสื้อก๊วนแบด พิมพ์ลาย \| TEAMDEE | 49 |

Optional:
- `/size-chart/` → "ตารางไซส์เสื้อโปโล เสื้อกีฬา ผู้ใหญ่และเด็ก | TEAMDEE" (53). Matches the AC phrases "ตารางไซส์เสื้อกีฬา/เด็ก".
- `/custom-baseball-shirts/` → "สั่งทำเสื้อเบสบอล เสื้อรุ่น ชมรม เริ่ม 10 ตัว | TEAMDEE" (55).

Templated descriptions to rewrite (not money pages, low effort):
- `/team-shirt-design-ideas/`
- `/team-shirt-fabric-guide/`
- `/thank-you/`

No change recommended (already aligned, gain unclear):
- `/custom-class-shirts/`
- `/custom-university-shirts/`
- `/custom-badminton-shirts/`
- `/sport/`
- `/calculations/`
- `/contact-us/`
- `/about-us/`

---

## 5. Caveats and open owner questions

1. Search volumes and true Google TH positions were not measured. Before committing effort to items 2–19, verify in **Google Search Console**: Art has GSC access since 12 Nov. Export queries for the live site to see which pages already earn impressions, especially `/`, `/education/` and `/fabric-technology/`.
2. AI Overviews, rich results and competitor schema are unverified.
3. ⚠ The owner must confirm:
   - production claims for the "โรงงาน" substitute copy (own production line, capacity)
   - the relationship between FinixSports and ดีดี ฟินิกซ์
   - the extra embroidery position rate
   - when a sample shirt is free
   - lead time by quantity
   - care instructions
   - whether jackets or ช็อป shirts are offered
   - walk-in pickup in Nonthaburi
   - the FAQ answer on adding new staff later
4. Competitor prices and minimums come from their own pages and may be outdated. Several pages contradict themselves (PMK's minimum 20 vs 100–200; Tara's 30 vs 50). Use them only as market context, never in TEAMDEE copy.
5. The launch will change the home title away from "โรงงาน". Expect some ranking movement on โรงงาน queries. Track it in GSC for 4–8 weeks after launch.

## Sources (main)
- pimlai.in.th · kdc-x.com/rakha-suea-phim-lai/ · pmkpolomaker.com/polo-made-to-order/ · 12tees.com/th/products/polo · sabuygarment.com (sublimation page) · team-dee.com (live home)
- Search result sets: sahawath.com, sspgarment.com, mixprint.com, polomaker.com, smartpolouniform.com, tarathaisilk.co.th, goldensport.co.th, ideamark.co.th, sportmighty.com, thanaplus.com, alaknitting.com, siamzion.com, priceza.com, yellowpages.co.th
- Google autocomplete TH: suggestqueries.google.com (client=firefox, hl=th, gl=th)
