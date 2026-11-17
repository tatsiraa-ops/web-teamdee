/* 16 พ.ย. 2026 อาร์ตถาม "จะอัพเดทบทความใหม่ๆยังไง" → "ทำข้อ 1 เลย"
   ปัญหา: หน้าแรก (การ์ดบทความ 4 เรื่อง) และ /blog/ ฝังรายการบทความตอน build จาก legacy-posts.json
   บทความที่ลงในหลังบ้าน WordPress หลังเปิดเว็บจะไม่ขึ้นสองที่นี้จนกว่าจะอัปโหลดธีมใหม่
   แก้: ธีมใส่บทความจริงจาก WordPress ตอนเปิดหน้า (td_posts_live) ด้วย HTML ชุดเดิม
   - หน้าแรก: 4 เรื่องล่าสุดจาก WordPress
   - /blog/: หน้านิตยสาร 12 เรื่องเดิมคงไว้ · เรื่องที่ยังไม่อยู่ในหน้า = ส่วน "ใหม่ล่าสุด" ใต้เรื่องปก + ชิปหัวข้อ + ผลค้นหา
     + จำนวนเรื่อง/วันที่ล่าสุดบนหัวหน้า + ตัวเลขหมวดตาม WordPress
   เทสใช้ HTML ที่ export จริง (wp-theme/teamdee/build/pages) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const runtime = process.env.PHP_WASM_MODULES
const root = new URL('../wp-theme/teamdee/', import.meta.url)
const source = readFileSync(new URL('functions.php', root), 'utf8')
const START = '/* ---------- บทความจริงจาก WordPress บนหน้าแรกและ /blog/ ---------- */'
const page = (s) => new URL(`build/pages/${s}.body.html`, root)
const built = existsSync(page('home')) && existsSync(page('blog'))

test('functions.php มีบล็อกใส่บทความจริงจาก WordPress และเรียกจาก td_read_part', () => {
  assert.ok(source.includes(START), 'มีบล็อก')
  assert.match(source, /td_posts_live\(\$slug, \$html/, 'td_read_part ส่ง slug + html ให้ td_posts_live')
})

const post = (n, o = {}) => ({
  url: `/new-post-${n}/`, title: `บทความใหม่ ${n}`, img: `https://team-dee.com/wp-content/uploads/n${n}-1024x512.webp`,
  srcset: `https://team-dee.com/wp-content/uploads/n${n}-300x150.webp 300w`, cat: 'purchasing-guide', catName: 'คู่มือจัดซื้อ & สั่งผลิต',
  date: `2026-12-0${n}`, dateTh: `${n} ธ.ค. 2026`, excerpt: `สรุปเรื่อง ${n}`, ...o,
})
const LEGACY = JSON.parse(readFileSync(new URL('../src/data/legacy-posts.json', import.meta.url), 'utf8')).items
  .map((p) => ({ url: p.url, title: p.title, img: p.img, srcset: p.srcset, cat: p.cat, catName: '', date: p.date, dateTh: p.dateTh, excerpt: p.excerpt }))
  .sort((a, b) => b.date.localeCompare(a.date))

async function run(cases) {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  const a = source.indexOf(START)
  const block = a < 0 ? '' : source.slice(a, source.indexOf('/* ---------- ', a + START.length))
  const stubs = `
    function esc_html($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
    function esc_attr($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
    function esc_url($s) { return (string) $s; }
    $GLOBALS['A'] = [];
    function add_action($h, $cb, $p = 10, $n = 1) { $GLOBALS['A'][$h][] = $cb; }
    function do_action($h, ...$a) { $GLOBALS['done'][] = [$h, ...$a]; }
    function home_url($p = '') { return 'https://team-dee.com' . $p; }
  `
  await php.writeFile('/in.json', JSON.stringify(cases))
  for (const s of ['home', 'blog']) await php.writeFile(`/${s}.html`, readFileSync(page(s), 'utf8'))
  const code = `<?php ${stubs} ${block}
    $out = [];
    foreach (json_decode(file_get_contents('/in.json'), true) as $k => $c) $out[$k] = td_posts_live($c['slug'], file_get_contents('/' . $c['slug'] . '.html'), $c['posts'], $c['counts'] ?? []);
    if (!empty($GLOBALS['A']['transition_post_status'])) {
      $p = (object) ['post_type' => 'post'];
      foreach ($GLOBALS['A']['transition_post_status'] as $cb) { $cb('publish', 'draft', $p); $cb('draft', 'draft', $p); $cb('publish', 'draft', (object) ['post_type' => 'page']); }
    }
    $out['purged'] = $GLOBALS['done'] ?? [];
    echo json_encode($out, JSON_UNESCAPED_UNICODE);`
  try {
    const r = await php.run({ code })
    assert.equal(r.errors, '')
    return JSON.parse(r.text)
  } finally { php.exit() }
}

const between = (s, a, b) => { const i = s.indexOf(a); return i < 0 ? '' : s.slice(i, s.indexOf(b, i)) }
const blogFile = () => readFileSync(page('blog'), 'utf8')
const homeFile = () => readFileSync(page('home'), 'utf8')

test('หน้าแรก: การ์ดบทความ = 4 เรื่องล่าสุดจาก WordPress · ไม่มีโพสต์ = HTML เดิม', { skip: !runtime || !built }, async () => {
  const o = await run({
    five: { slug: 'home', posts: [post(5), post(4), post(3), post(2), post(1)] },
    none: { slug: 'home', posts: [] },
    xss: { slug: 'home', posts: [post(1, { title: '<script>x</script> & "q"' })] },
  })
  const list = between(o.five, '<ul class="hm-posts">', '</ul>')
  assert.equal((list.match(/<li>/g) || []).length, 4)
  assert.deepEqual([...list.matchAll(/class="hm-post" href="([^"]+)"/g)].map((m) => m[1]), ['/new-post-5/', '/new-post-4/', '/new-post-3/', '/new-post-2/'])
  assert.match(list, /<span class="hm-post__cat">คู่มือจัดซื้อ &amp; สั่งผลิต<\/span><span class="hm-post__t">บทความใหม่ 5<\/span><time datetime="2026-12-05">5 ธ.ค. 2026<\/time>/)
  assert.match(list, /<img src="https:\/\/team-dee.com\/wp-content\/uploads\/n5-1024x512.webp" srcset="[^"]+" sizes="\(min-width: 1280px\) 300px, \(min-width: 768px\) 24vw, 80vw" alt="" width="1024" height="512" loading="lazy" decoding="async">/)
  assert.ok(o.five.includes('ดูบทความทั้งหมด'), 'ส่วนอื่นของหน้าอยู่ครบ')
  assert.equal(o.none, homeFile(), 'ไม่มีโพสต์ = HTML เดิมทุกตัวอักษร')
  assert.ok(!o.xss.includes('<script>x</script>') && o.xss.includes('&lt;script&gt;x&lt;/script&gt; &amp; &quot;q&quot;'), 'ชื่อบทความถูก escape')
})

/* 17 พ.ย. 2026 audit: หน้าแรกโชว์ "Hello world!" (Uncategorized) และการ์ดกล่องเทาไม่มีรูป
   → หน้าแรกเอาเฉพาะเรื่องที่มีรูปปกและมีหมวดจริง · ไม่ครบ 4 = เติมการ์ดเดิมจากตอน build (ไม่ซ้ำลิงก์) · /blog/ ก็ไม่เอา Uncategorized */
test('หน้าแรก: ข้ามเรื่อง Uncategorized และเรื่องไม่มีรูปปก · ไม่ครบ 4 เติมการ์ดเดิม', { skip: !runtime || !built }, async () => {
  const orig = [...between(homeFile(), '<ul class="hm-posts">', '</ul>').matchAll(/class="hm-post" href="([^"]+)"/g)].map((m) => m[1])
  const o = await run({
    mixed: { slug: 'home', posts: [post(5, { cat: 'uncategorized', catName: 'Uncategorized', title: 'Hello world!' }), post(4, { img: '', srcset: '' }), post(3), post(2)] },
    junk: { slug: 'home', posts: [post(5, { cat: 'uncategorized' }), post(4, { img: '' })] },
    blog: { slug: 'blog', posts: [post(2, { cat: 'uncategorized', title: 'Hello world!' })] },
  })
  const list = between(o.mixed, '<ul class="hm-posts">', '</ul>')
  const hrefs = [...list.matchAll(/class="hm-post" href="([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(hrefs, ['/new-post-3/', '/new-post-2/', ...orig.slice(0, 2)])
  assert.ok(!list.includes('Hello world') && !list.includes('/new-post-4/'))
  assert.equal(o.junk, homeFile(), 'ไม่มีเรื่องที่ใช้ได้ = HTML เดิมทุกตัวอักษร')
  assert.equal(o.blog, readFileSync(page('blog'), 'utf8'), '/blog/ ไม่ใส่เรื่อง Uncategorized')
})

test('/blog/: บทความเดิมครบ = HTML เดิม · มีเรื่องใหม่ = ส่วน "ใหม่ล่าสุด" + ชิป + ผลค้นหา + จำนวน/วันที่ + ตัวเลขหมวด', { skip: !runtime || !built }, async () => {
  const o = await run({
    same: { slug: 'blog', posts: LEGACY, counts: { 'purchasing-guide': 8, 'fabric-technique': 3, 'sportswear-sublimation': 1 } },
    fresh: { slug: 'blog', posts: [post(2), post(1, { cat: 'fabric-technique', catName: 'เจาะลึกเนื้อผ้า & เทคนิคผลิต', img: '' }), ...LEGACY], counts: { 'purchasing-guide': 9, 'fabric-technique': 4, 'sportswear-sublimation': 1 } },
  })
  assert.equal(o.same, blogFile(), 'มีแค่ 12 เรื่องเดิม = หน้าเดิมทุกตัวอักษร')
  const b = o.fresh
  assert.match(b, /<p class="mz-head__meta">14 เรื่อง · อัปเดตล่าสุด 2 ธ.ค. 2026<\/p>/)
  assert.match(b, /<ul class="mz-topics" aria-label="ไปที่หัวข้อ"><li style="--i:0"><a href="#t-latest">ใหม่ล่าสุด<b class="tabular-nums">2<\/b><\/a><\/li>/)
  /* ส่วนใหม่อยู่หลังเรื่องปก ก่อนหัวข้อเดิม · การ์ดแบบเดียวกับผลค้นหา */
  const latest = between(b, '<section class="mz-sec mz-sec--latest"', '</section>')
  assert.ok(b.indexOf('class="mz-cover"') < b.indexOf('mz-sec--latest') && b.indexOf('mz-sec--latest') < b.indexOf('<div class="mz-sections">'))
  assert.match(latest, /id="t-latest" aria-labelledby="t-latest-h"/)
  assert.match(latest, /<h2 id="t-latest-h">ใหม่ล่าสุด<\/h2><span class="tabular-nums">2 เรื่อง<\/span>/)
  assert.deepEqual([...latest.matchAll(/<a class="mz-card" href="([^"]+)"/g)].map((m) => m[1]), ['/new-post-2/', '/new-post-1/'])
  assert.ok(!/<img src=""/.test(latest), 'เรื่องไม่มีรูปปก ไม่ใส่ <img> ว่าง')
  /* ผลค้นหา: เรื่องใหม่ขึ้นก่อน ค้นจากชื่อ/สรุป/หมวดได้ */
  const grid = between(b, 'id="artGrid">', '</div>')
  assert.match(grid, /^id="artGrid"><a class="mz-card" href="\/new-post-2\/" data-cat="purchasing-guide" data-topics="" data-title="บทความใหม่ 2" data-excerpt="สรุปเรื่อง 2" data-cat-name="คู่มือจัดซื้อ &amp; สั่งผลิต">/)
  assert.equal((grid.match(/class="mz-card"/g) || []).length, 14)
  /* ตัวเลขหมวดตาม WordPress */
  const arch = between(b, '<nav class="mz-archives"', '</nav>')
  assert.deepEqual([...arch.matchAll(/<b class="tabular-nums">(\d+)<\/b>/g)].map((m) => +m[1]), [9, 4, 1])
  assert.ok(b.includes('class="mz-sec mz-sec--wide" id="t-planning"'), 'หัวข้อเดิมไม่เปลี่ยน')
})

test('เผยแพร่/แก้บทความ → สั่ง LiteSpeed ล้างแคชหน้าแรกและ /blog/ · หน้า (Page) และร่างไม่สั่ง', { skip: !runtime || !built }, async () => {
  const o = await run({})
  assert.deepEqual(o.purged, [['litespeed_purge_url', 'https://team-dee.com/'], ['litespeed_purge_url', 'https://team-dee.com/blog/']])
})
