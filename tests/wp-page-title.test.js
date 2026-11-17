/* 16 พ.ย. 2026 อาร์ตเลือกข้อ ข: title หน้าแรกบน staging เป็น "โรงงานรับผลิตเสื้อ…" (ค่าใน Rank Math ของหน้าเดิม · ขัดกติกาไม่ใช้คำว่าโรงงาน)
   → หน้าที่ธีมแสดงเอง (td_current) ใช้ title จากต้นแบบ (pages.json) ทุกหน้า ไม่ว่ามี Page ใน WordPress หรือไม่ · รวม title ตอนแชร์ (og/twitter)
   หน้าอื่น (บทความ หน้าที่ธีมไม่ได้แสดง) ใช้ค่าของ Rank Math เหมือนเดิม
   17 พ.ย. 2026 อาร์ตเลือกข้อ ก: description ของหน้าเดิม 10 หน้าบน staging ยังเป็นค่าเว็บเก่า ("โรงงาน…" · "กำลังผลิต 100,000+ ตัว/เดือน" ที่ไม่มีที่มา)
   → description (รวมตอนแชร์) ใช้ค่าจากต้นแบบแบบเดียวกับ title · canonical ยังเป็นกติกาเดิม (เฉพาะหน้าที่ไม่มี Page) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const START = '/* ---------- หน้าที่ต้นแบบมี แต่ WordPress ไม่มี Page ---------- */'

test('title จากต้นแบบทุกหน้าที่ธีมแสดง (รวม og/twitter) · หน้าอื่นใช้ Rank Math', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  const a = source.indexOf(START)
  const block = source.slice(a, source.indexOf('/* ---------- ', a + START.length))
  const code = `<?php
    $GLOBALS['F'] = [];
    function add_filter($h, $cb, $p = 10, $n = 1) { $GLOBALS['F'][$h][] = $cb; } function add_action($h, $cb, $p = 10, $n = 1) {}
    function apply($h, ...$args) { foreach ($GLOBALS['F'][$h] ?? [] as $cb) $args[0] = $cb(...$args); return $args[0]; }
    function is_admin() { return false; } function status_header($c) {} function home_url($p = '') { return 'https://team-dee.com' . $p; }
    function get_option($k) { return '1'; } function td_page($r = null) { return null; }
    function td_current() { return $GLOBALS['td_current'] ?? null; }
    ${block}
    $o = [];
    $GLOBALS['td_current'] = ['route' => '/', 'slug' => 'home', 'title' => 'รับทำเสื้อทีม โปโลปัก พิมพ์ลาย และสกรีน | TEAMDEE', 'description' => 'x'];
    $o['home_title'] = apply('rank_math/frontend/title', 'โรงงานรับผลิตเสื้อ รับผลิตเสื้อโปโล | TEAMDEE');
    $o['home_og'] = apply('rank_math/opengraph/facebook/og_title', 'โรงงานรับผลิตเสื้อ');
    $o['home_tw'] = apply('rank_math/opengraph/twitter/twitter_title', 'โรงงานรับผลิตเสื้อ');
    $o['home_desc'] = apply('rank_math/frontend/description', 'TEAMDEE โรงงานรับผลิตเสื้อ…');
    $o['home_og_desc'] = apply('rank_math/opengraph/facebook/og_description', 'โรงงาน…');
    $o['home_tw_desc'] = apply('rank_math/opengraph/twitter/twitter_description', 'โรงงาน…');
    $GLOBALS['td_current'] = null;
    $o['post_title'] = apply('rank_math/frontend/title', 'บทความ | TEAMDEE');
    $o['post_og'] = apply('rank_math/opengraph/facebook/og_title', 'บทความ');
    $o['post_desc'] = apply('rank_math/frontend/description', 'คำอธิบายบทความ');
    echo json_encode($o, JSON_UNESCAPED_UNICODE);`
  try {
    const r = await php.run({ code })
    assert.equal(r.errors, '')
    const o = JSON.parse(r.text)
    assert.equal(o.home_title, 'รับทำเสื้อทีม โปโลปัก พิมพ์ลาย และสกรีน | TEAMDEE')
    assert.equal(o.home_og, 'รับทำเสื้อทีม โปโลปัก พิมพ์ลาย และสกรีน | TEAMDEE')
    assert.equal(o.home_tw, 'รับทำเสื้อทีม โปโลปัก พิมพ์ลาย และสกรีน | TEAMDEE')
    for (const k of ['home_desc', 'home_og_desc', 'home_tw_desc']) assert.equal(o[k], 'x', `${k}: description จากต้นแบบ (ข้อ ก 17 พ.ย.)`)
    assert.equal(o.post_desc, 'คำอธิบายบทความ', 'บทความใช้ description ของ Rank Math')
    assert.equal(o.post_title, 'บทความ | TEAMDEE')
    assert.equal(o.post_og, 'บทความ')
  } finally { php.exit() }
})

test('title และ description ของทุกหน้าที่ export ไม่มีคำว่า "โรงงาน"', () => {
  const pages = JSON.parse(readFileSync(new URL('../wp-theme/teamdee/build/pages.json', import.meta.url), 'utf8')).pages
  for (const [r, p] of Object.entries(pages)) { assert.doesNotMatch(p.title || '', /โรงงาน/, r); assert.doesNotMatch(p.description || '', /โรงงาน/, r) }
})
