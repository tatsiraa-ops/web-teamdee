/* 16 พ.ย. 2026 audit: Vite สลับลำดับ <link rel="stylesheet"> ใน head เองทุก build · มีกฎชนกัน 88 จุดใน 39 หน้า (ความเจาะจงเท่ากัน ค่าไม่เท่ากัน)
   ถ้าลำดับสลับ หน้าตาเปลี่ยนเอง (ฟอร์มติดต่อเสียกรอบ แถวรีวิวห่าง 32px ฯลฯ) → ล็อกลำดับ: CSS กลาง → CSS ชิ้นส่วนที่ใช้หลายหน้า → CSS ของหน้า (ชนะท้ายสุด)
   ในกลุ่มเรียงตามชื่อ · plugins.js cssOrder */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { orderStylesheets } from '../src/build/plugins.js'

const L = (n) => `<link rel="stylesheet" crossorigin href="/assets/${n}-AbCdEfGh.css">`
test('orderStylesheets: กลาง → ชิ้นส่วน → หน้า · ในกลุ่มเรียงตามชื่อ · ส่วนอื่นของ head ไม่แตะ', () => {
  const head = `<head>\n<meta charset="utf-8">\n${L('contact-us')}\n${L('line-cta')}\n<script type="module" src="/a.js"></script>\n${L('site-extras')}\n${L('review-wall')}\n</head>`
  const out = orderStylesheets(head)
  const names = [...out.matchAll(/assets\/([a-z-]+)-AbCdEfGh\.css/g)].map((m) => m[1])
  assert.deepEqual(names, ['site-extras', 'line-cta', 'review-wall', 'contact-us'])
  assert.match(out, /<meta charset="utf-8">/); assert.match(out, /<script type="module" src="\/a\.js"><\/script>/)
  assert.equal(orderStylesheets(out), out, 'รันซ้ำได้ผลเดิม')
  assert.equal(orderStylesheets('<head></head>'), '<head></head>')
})
test('ชื่อ chunk CSS กลางสลับเป็น nav-* ได้ (Vite ตั้งชื่อเอง) ก็ยังอยู่หน้าสุด', () => {
  const out = orderStylesheets(`${L('product-page')}${L('need-by-ui')}${L('nav')}`)
  assert.deepEqual([...out.matchAll(/assets\/([a-z-]+)-AbCdEfGh/g)].map((m) => m[1]), ['nav', 'need-by-ui', 'product-page'])
})
const dir = new URL('../wp-theme/teamdee/build/pages/', import.meta.url)
test('ทุกหน้าที่ export: CSS กลางตัวแรก · CSS ชิ้นส่วนก่อน CSS ของหน้า', { skip: !existsSync(dir) }, () => {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.head.html'))) {
    const names = [...readFileSync(new URL(f, dir), 'utf8').matchAll(/<link rel="stylesheet"[^>]*assets\/([a-z-]+?)-[A-Za-z0-9_-]{8}\.css/g)].map((m) => m[1])
    if (!names.length) continue
    assert.ok(['site-extras', 'nav'].includes(names[0]), `${f}: ${names}`)
    const ordered = [...orderStylesheets(names.map(L).join('\n')).matchAll(/assets\/([a-z-]+)-AbCdEfGh/g)].map((m) => m[1])
    assert.deepEqual(names, ordered, `${f}: ${names}`)
  }
})

/* 17 พ.ย. 2026 รอบตรวจความเร็ว: กฎเฉพาะหน้าแรกแยกจาก home.css (โหลดทุกหน้า) ไป home-page.css (โหลดเฉพาะหน้าแรก)
   เดิมกฎพวกนี้อยู่ในไฟล์กลาง → ต้องมาต่อจาก CSS กลางทันที ก่อน CSS ชิ้นส่วน (review-wall ฯลฯ) ลำดับชนะกันจึงใกล้เดิมที่สุด */
test('home-page.css อยู่ต่อจาก CSS กลาง ก่อน CSS ชิ้นส่วน', () => {
  const out = orderStylesheets(`${L('review-wall')}${L('home-page')}${L('site-extras')}`)
  assert.deepEqual([...out.matchAll(/assets\/([a-z-]+)-AbCdEfGh/g)].map((m) => m[1]), ['site-extras', 'home-page', 'review-wall'])
  /* Vite ตั้งชื่อ CSS ของ entry หน้าแรกเป็น main-*.css */
  const out2 = orderStylesheets(`${L('review-wall')}${L('main')}${L('site-extras')}`)
  assert.deepEqual([...out2.matchAll(/assets\/([a-z-]+)-AbCdEfGh/g)].map((m) => m[1]), ['site-extras', 'main', 'review-wall'])
})
test('home-page.css โหลดเฉพาะหน้าแรก', () => {
  assert.match(readFileSync(new URL('../site/index.html', import.meta.url), 'utf8'), /<link rel="stylesheet" href="\/src\/styles\/home-page\.css" data-page-css>/)
  assert.doesNotMatch(readFileSync(new URL('../src/partials/head.hbs', import.meta.url), 'utf8'), /home-page\.css/)
})
