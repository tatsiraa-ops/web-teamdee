/* 17 พ.ย. 2026 รอบตรวจความปลอดภัย/โค้ด (อาร์ต "ทำ ก + ข ต่อ"):
   1) ไฟล์ข้อมูลของธีม (build/pages.json · img-manifest.json · seo-legacy.json · build/pages/*.head|body.html) เปิดตรงจากเว็บได้ → .htaccess ปิด
   2) pre_get_document_title คืน title ดิบ (WordPress ไม่ escape) → esc_html
   3) preg_replace_callback คืน null เมื่อ PCRE ล้ม (backtrack limit บนโฮสต์ร่วม) → (string) null = หน้าว่าง → ใช้ HTML เดิมแทน
   4) td_chrome อ่าน blog.body.html 109 KB + ดึงบทความ WP 60 เรื่อง ซ้ำ 2 รอบต่อหน้าบทความ (header + footer) → อ่านครั้งเดียว ไม่ดึงบทความ */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const theme = (p) => new URL(`../wp-theme/teamdee/${p}`, import.meta.url)
const php = readFileSync(theme('functions.php'), 'utf8')
const fnSrc = (name) => { const a = php.indexOf(`function ${name}(`); assert.ok(a >= 0, name); let d = 0, i = php.indexOf('{', a); for (; i < php.length; i++) { if (php[i] === '{') d++; else if (php[i] === '}' && --d === 0) break } return php.slice(a, i + 1) }

test('.htaccess ในธีมปิดไฟล์ข้อมูล .json และส่วนหน้า .head/.body.html (Apache 2.2 + 2.4)', () => {
  assert.ok(existsSync(theme('.htaccess')))
  const h = readFileSync(theme('.htaccess'), 'utf8')
  assert.match(h, /<FilesMatch "\\\.json\$">/)
  assert.match(h, /<FilesMatch "\\\.\(head\|body\)\\\.html\$">/)
  assert.equal((h.match(/Require all denied/g) || []).length, 2)
  assert.equal((h.match(/Deny from all/g) || []).length, 2)
})

test('title จากต้นแบบผ่าน esc_html ก่อนส่งให้ WordPress', () => {
  const at = php.indexOf("add_filter('pre_get_document_title'")
  const f = php.slice(at, php.indexOf("add_filter('wp_robots'", at))
  assert.match(f, /esc_html\(\$p\['title'\]\)/)
})

test('regex ล้ม (null) = ใช้ HTML เดิม ไม่ใช่หน้าว่าง', () => {
  assert.doesNotMatch(php, /\(string\) preg_replace_callback/, 'ไม่แปลง null เป็นสตริงว่าง')
  const links = fnSrc('td_portable_links')
  assert.match(links, /\?\? \$html/)
})

test('td_chrome อ่านหน้า /blog/ ครั้งเดียวต่อคำขอ และไม่ดึงบทความ WordPress', () => {
  const f = fnSrc('td_chrome')
  assert.match(f, /static \$cache/)
  assert.match(f, /td_read_part\(\$p\['slug'\], 'body', false\)/)
  assert.match(fnSrc('td_read_part'), /function td_read_part\(string \$slug, string \$part, bool \$live = true\)/)
})

test('แผนที่หน้าติดต่อไม่ส่ง URL เต็มไปให้ Google (strict-origin-when-cross-origin)', () => {
  const html = readFileSync(new URL('../site/contact-us/index.html', import.meta.url), 'utf8')
  assert.match(html, /<iframe src="https:\/\/www\.google\.com\/maps[^>]*referrerpolicy="strict-origin-when-cross-origin"/)
})

/* /faq กับ /faq/ ตอบ 200 ทั้งคู่ (ปิด redirect_canonical ทั้งหมดบนหน้าต้นแบบ กันการเดา slug) → ไม่มี / ท้าย = 301 ไปที่มี / · ยังไม่เดา slug */
const runtime = process.env.PHP_WASM_MODULES
test('td_slash_url: เติม / ท้าย path · มีแล้ว = null · query ยังอยู่', { skip: !runtime }, async () => {
  const { pathToFileURL } = await import('node:url'); const { resolve } = await import('node:path')
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const p = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    const cases = ['https://team-dee.com/faq', 'https://team-dee.com/faq/', 'https://team-dee.com/enterprise/faq?q=a%20b', 'https://team-dee.com/']
    const r = await p.run({ code: `<?php function wp_parse_url($u,$c=-1){ return parse_url($u,$c); } ${fnSrc('td_slash_url')} echo json_encode(array_map('td_slash_url', json_decode('${JSON.stringify(cases)}')), JSON_UNESCAPED_SLASHES);` })
    assert.equal(r.errors, '')
    assert.deepEqual(JSON.parse(r.text), ['https://team-dee.com/faq/', null, 'https://team-dee.com/enterprise/faq/?q=a%20b', null])
  } finally { p.exit() }
  const f = php.slice(php.indexOf("add_filter('redirect_canonical'"), php.indexOf("add_filter('do_redirect_guess_404_permalink'"))
  assert.match(f, /td_page\(\) \? td_slash_url\(\$requested\) \?\? false : \$redirect/)
})

/* รอบตรวจ SEO: หน้าแรกไม่มี canonical ตอนไม่มีปลั๊กอิน SEO (export ตัด canonical ของต้นแบบ · WordPress พิมพ์ให้เฉพาะหน้า Page/โพสต์)
   → ธีมพิมพ์เองเฉพาะหน้าที่ธีมแสดง + ไม่มีปลั๊กอิน + WordPress ไม่ได้พิมพ์ (ไม่ใช่ singular) */
test('canonical สำรอง: ไม่มีปลั๊กอิน SEO และไม่ใช่ singular → ธีมพิมพ์เอง', () => {
  const f = php.slice(php.indexOf('function td_canonical_fallback('), php.indexOf("add_action('wp_head', 'td_canonical_fallback'"))
  assert.match(f, /td_has_seo_plugin\(\)/)
  assert.match(f, /is_singular\(\)/)
  assert.match(f, /<link rel="canonical" href="' \. esc_url\(home_url\(\$p\['route'\]\)\) \. '">/)
  assert.match(php, /add_action\('wp_head', 'td_canonical_fallback'\)/)
})

/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A2 เก็บกวาด URL แปลก (รอบตรวจ technical L1–L6):
   หน้า 404 มี canonical ชี้ /404 · /FAQ/ ตัวใหญ่ตอบ 200 หน้าเปล่า · /?p=1 ตอบ 200 (ปิด redirect_canonical ทั้งหน้าต้นแบบ)
   /?s= เปิดหน้าภาษาอังกฤษ "Archives" · sitemap ของ WP มีหน้าผู้ใช้ · หน้า archive ผู้เขียน/วันที่ index ได้ */
test('A2: canonical เฉพาะหน้าที่ index ได้ (ไม่ใช่ 404 / noindex)', () => {
  const f = php.slice(php.indexOf('function td_canonical_ok('), php.indexOf('function td_canonical_ok(') + 400)
  assert.match(f, /str_starts_with\(\$p\['route'\], '\/'\)/)
  assert.match(f, /noindex/)
  assert.match(fnSrc('td_canonical_fallback'), /td_canonical_ok\(\$p\)/)
  assert.match(fnSrc('td_fallback_seo'), /td_canonical_ok\(\$p\)/)
})
test('A2: td_case_target · path ตัวใหญ่ที่มีหน้าตัวเล็ก → ตัวเล็ก', { skip: !runtime }, async () => {
  const { pathToFileURL } = await import('node:url'); const { resolve } = await import('node:path')
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const p = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    const r = await p.run({ code: `<?php ${fnSrc('td_case_target')} $has = fn ($r) => in_array($r, ['/faq/', '/embroidery/'], true); echo json_encode([td_case_target('/FAQ/', $has), td_case_target('/Embroidery/', $has), td_case_target('/faq/', $has), td_case_target('/NOPE/', $has)]);` })
    assert.equal(r.errors, '')
    assert.deepEqual(JSON.parse(r.text), ['/faq/', '/embroidery/', null, null])
  } finally { p.exit() }
})
test('A2: ?p= / page_id ให้ WordPress redirect ตามปกติ · ?s= → /search/?q= · ปิด sitemap ผู้ใช้ · archive ผู้เขียน/วันที่ noindex', () => {
  const rc = php.slice(php.indexOf("add_filter('redirect_canonical'"), php.indexOf("add_filter('do_redirect_guess_404_permalink'"))
  assert.match(rc, /isset\(\$_GET\['p'\]\) \|\| isset\(\$_GET\['page_id'\]\)/)
  assert.match(php, /function td_search_redirect\(\)[^]*?home_url\('\/search\/'\)/)
  assert.match(php, /add_filter\('wp_sitemaps_add_provider', fn \(\$provider, \$name\) => \$name === 'users' \? false : \$provider, 10, 2\)/)
  assert.match(php, /is_author\(\) \|\| is_date\(\)/)
})

/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A3: ค่า robots ใน Rank Math ของหน้าที่ sync ไปตอนยัง noindex (เช่น หน้าเช็กลิสต์) ค้างอยู่
   เดิมตัวกรองบังคับ index ใช้เฉพาะหน้าที่ยังไม่มี Page (td_fallback) → ใช้กับทุกหน้าที่ธีมแสดง · ต้นแบบ noindex / staging ปิด index ยังคงเดิม */
test('A3: บังคับ index ตามต้นแบบกับทุกหน้าที่ธีมแสดง ไม่ใช่เฉพาะหน้าที่ยังไม่มี Page', () => {
  const at = php.indexOf("add_filter('rank_math/frontend/robots', function ($robots) {\n\t$p = td_current();")
  assert.ok(at > 0)
  const f = php.slice(at, php.indexOf('}, 5);', at))
  assert.doesNotMatch(f, /td_fallback/)
  assert.match(f, /get_option\('blog_public'\) === '0'/)
  assert.match(f, /str_contains\(\$p\['robots'\] \?\? '', 'noindex'\)/)
})

/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A9: มี Rank Math → ธีมตัดแท็ก og:/twitter: ของตัวเองทิ้งทั้งหมด (กันซ้ำ) แล้ว Rank Math ใช้รูปเว็บเก่า/โลโก้ + locale en_US
   → ส่งรูปแชร์รายหน้าของธีม (JPG 1200×630) และ locale th_TH ให้ Rank Math ผ่าน filter · แท็กยังออกชุดเดียว (ของ Rank Math) */
test('A9: td_og_from_head ดึง og:image จาก head ของหน้า', { skip: !runtime }, async () => {
  const { pathToFileURL } = await import('node:url'); const { resolve } = await import('node:path')
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const p = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    const r = await p.run({ code: `<?php ${fnSrc('td_og_from_head')} echo json_encode([td_og_from_head("<meta property=\\"og:title\\" content=\\"x\\">\\n<meta property=\\"og:image\\" content=\\"https://team-dee.com/img/og/sport.jpg\\">"), td_og_from_head('<title>x</title>')], JSON_UNESCAPED_SLASHES);` })
    assert.equal(r.errors, '')
    assert.deepEqual(JSON.parse(r.text), ['https://team-dee.com/img/og/sport.jpg', null])
  } finally { p.exit() }
})
test('A9: filter รูปแชร์ facebook + twitter และ locale ของ Rank Math บนหน้าที่ธีมแสดง', () => {
  assert.match(php, /add_filter\('rank_math\/opengraph\/facebook\/image', fn \(\$v\) => td_page_og_image\(\) \?\? \$v\)/)
  assert.match(php, /add_filter\('rank_math\/opengraph\/twitter\/image', fn \(\$v\) => td_page_og_image\(\) \?\? \$v\)/)
  assert.match(php, /add_filter\('rank_math\/opengraph\/facebook\/og_locale', fn \(\$v\) => td_current\(\) \? 'th_TH' : \$v\)/)
})

/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A10: Rank Math บนเว็บจริงใส่ธุรกิจของตัวเอง (#person "TEAMDEE STUDIO" · #organization ที่อยู่เก่า 09–17)
   + BreadcrumbList "Home" + schema เก่ารายหน้า (Service/HowTo) + en-US → ชนกับ LocalBusiness /#business และ breadcrumb ของธีม
   td_rm_jsonld: หน้าธีม = ตัดธุรกิจ/breadcrumb/schema รายหน้าของ Rank Math ทิ้ง · ทุกหน้า = ชี้ผู้เผยแพร่ไป /#business · WebSite ชื่อ TEAMDEE ภาษาไทย ไม่มี SearchAction */
test('A10: td_rm_jsonld จัด graph ของ Rank Math ให้เหลือธุรกิจเดียว', { skip: !runtime }, async () => {
  const { pathToFileURL } = await import('node:url'); const { resolve } = await import('node:path')
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const p = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  const B = 'https://team-dee.com'
  const data = {
    publisher: { '@type': ['Person', 'Organization'], '@id': `${B}/#person`, name: 'TEAMDEE STUDIO - โรงงานรับผลิตเสื้อ', address: { streetAddress: '109/20' } },
    WebSite: { '@type': 'WebSite', '@id': `${B}/#website`, name: 'TEAMDEE STUDIO', inLanguage: 'en-US', publisher: { '@id': `${B}/#person` }, potentialAction: { '@type': 'SearchAction' } },
    WebPage: { '@type': 'WebPage', '@id': `${B}/embroidery/#webpage`, inLanguage: 'en-US', isPartOf: { '@id': `${B}/#website` }, about: { '@id': `${B}/#organization` } },
    BreadcrumbList: { '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home' }] },
    'schema-123': { '@type': 'Service', provider: { '@id': `${B}/#organization` } },
    org: { '@type': 'Organization', '@id': `${B}/#organization`, name: 'TEAMDEE', address: { streetAddress: '109/20' } },
    richSnippet: { '@type': 'BlogPosting', publisher: { '@id': `${B}/#person` }, author: { '@id': `${B}/author/admin/` } },
  }
  try {
    const run = async (theme) => JSON.parse((await p.run({ code: `<?php ${fnSrc('td_rm_ref')} ${fnSrc('td_rm_jsonld')} echo json_encode(td_rm_jsonld(json_decode(${JSON.stringify(JSON.stringify(data))}, true), ${theme ? 'true' : 'false'}, '${B}'), JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);` })).text)
    const t = await run(true)
    assert.deepEqual(Object.keys(t).sort(), ['WebPage', 'WebSite', 'richSnippet'], 'หน้าธีม: ไม่มีธุรกิจ/breadcrumb/schema รายหน้าของ Rank Math')
    assert.equal(t.WebSite.name, 'TEAMDEE'); assert.equal(t.WebSite.alternateName, 'ทีมดี'); assert.equal(t.WebSite.inLanguage, 'th')
    assert.equal(t.WebSite.potentialAction, undefined)
    assert.deepEqual(t.WebSite.publisher, { '@id': `${B}/#business` })
    assert.equal(t.WebPage.inLanguage, 'th'); assert.deepEqual(t.WebPage.about, { '@id': `${B}/#business` })
    assert.deepEqual(t.richSnippet.publisher, { '@id': `${B}/#business` })
    const post = await run(false)
    assert.ok(post.BreadcrumbList && post['schema-123'], 'บทความ: breadcrumb + schema รายหน้าของ Rank Math คงไว้')
    assert.equal(post.publisher.name, 'TEAMDEE'); assert.equal(post.publisher['@id'], `${B}/#business`); assert.equal(post.publisher['@type'], 'Organization')
    assert.equal(post.org, undefined, 'องค์กรซ้ำ (#organization) ตัดทิ้ง')
    assert.deepEqual(post['schema-123'].provider, { '@id': `${B}/#business` })
    assert.doesNotMatch(JSON.stringify(post), /โรงงาน|TEAMDEE STUDIO/)
  } finally { p.exit() }
})
test('A10: ใส่ filter rank_math/json_ld · หน้าธีม = td_current()', () => {
  assert.match(php, /add_filter\('rank_math\/json_ld', fn \(\$data\) => is_array\(\$data\) \? td_rm_jsonld\(\$data, \(bool\) td_current\(\), untrailingslashit\(home_url\(\)\)\) : \$data, 99\)/)
})
