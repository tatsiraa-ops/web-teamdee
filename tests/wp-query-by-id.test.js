/* 17 พ.ย. 2026 ตรวจ staging: /?p=999999 (โพสต์ที่ไม่มี) ตอบ 200 เป็นหน้าแรก = หน้าซ้ำที่ Google เก็บได้ไม่สิ้นสุด
   สาเหตุ: route ของ /?p= คือ "/" → td_page() เจอหน้าแรก → pre_handle_404 กัน 404 + template_include แสดงหน้าแรก
   แก้: คำขอที่ระบุเลขของ WordPress (?p= ?page_id= ?attachment_id=) ไม่ใช่หน้าของต้นแบบ → WordPress จัดการเอง (มี = redirect ไป URL จริง · ไม่มี = 404) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const fnSrc = (name) => { const a = source.indexOf(`function ${name}(`); assert.ok(a >= 0, name); let depth = 0, i = source.indexOf('{', a); for (; i < source.length; i++) { if (source[i] === '{') depth++; else if (source[i] === '}' && --depth === 0) break } return source.slice(a, i + 1) }

test('td_asks_wp_object: ?p= ?page_id= ?attachment_id= ที่มีค่า = ขอของ WordPress · utm / q / s / ว่าง ไม่นับ', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  const cases = [[{ p: '999999' }, true], [{ page_id: '5' }, true], [{ attachment_id: '3' }, true], [{ p: '' }, false], [{}, false],
    [{ utm_source: 'line', q: 'โปโล' }, false], [{ s: 'x' }, false], [{ p: ['1'] }, false]]
  try {
    const r = await php.run({ code: `<?php ${fnSrc('td_asks_wp_object')} echo json_encode(array_map(fn ($c) => td_asks_wp_object($c), json_decode('${JSON.stringify(cases.map((c) => c[0]))}', true)));` })
    assert.equal(r.errors, '')
    assert.deepEqual(JSON.parse(r.text), cases.map((c) => c[1]))
  } finally { php.exit() }
})

test('td_page() ของคำขอปัจจุบัน: ขอของ WordPress ด้วยเลข = ไม่ใช่หน้าต้นแบบ (หน้าแรกไม่กลืน /?p=)', () => {
  assert.match(fnSrc('td_page'), /if \(\$route === null && td_asks_wp_object\(\$_GET\)\) return null;/)
})
