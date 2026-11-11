/* ลองใช้งานจริงบนมือถือ 30 ต.ค. 2026 (รอบ 46 · อาร์ต "แก้ได้เลยทั้งหมด") · กันของที่แก้แล้วกลับมา
   ปุ่มย้อนกลับ → back-close.test.js · คำพ้อง FAQ → faq-search.test.js · เลขไทย → contact-send.test.js */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RAILS } from '../src/js/mobile-ui.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')

test('HIGH: ล้างแบบที่เลือกแล้วเลิกทำได้ · ประกาศจำนวน · ปุ่ม LINE แถบล่างส่งรหัสที่เลือก', () => {
  /* ถาดย้ายเป็นชุดเดียวกับแกลเลอรี (audit มือถือ 30 ต.ค. ข้อ 11): pickTray.hbs · pick-tray.js · picks.css */
  assert.match(read('site/designs/index.html'), /\{\{> pickTray /)
  const html = read('src/partials/pickTray.hbs')
  assert.match(html, /id="dgTrayUndoBtn">เลิกทำ</)
  assert.match(html, /id="dgTrayLive" aria-live="polite"/)
  const js = read('src/js/pick-tray.js')
  assert.match(js, /undoTimer = setTimeout/)
  assert.match(js, /if \(mbLine\) mbLine\.href = picks\.length \? send : mbBase/)
  assert.match(read('src/styles/picks.css'), /\.dg-tray__clear \{ display: grid; place-items: center; width: 44px;/)
})

test('ปุ่มไป LINE เป็นเขียว + ไอคอน LINE: ป๊อปอัปโปร · หน้าขอบคุณ · เมนูมือถือ', () => {
  assert.match(read('src/partials/promoPopup.hbs'), /promo__cta--line[\s\S]*icoLine/)
  const ty = read('site/thank-you/index.html')
  assert.match(ty, /<a class="cb cb--p[^"]*" href="\{\{site\.lineUrl\}\}" data-track="line"><span class="cb__ico"/)
  assert.doesNotMatch(ty, /icoChat/)
  /* 30 ต.ค.: ปุ่ม LINE เมนูส่งข้อความตามหน้า (pageLine) */
  assert.match(read('src/partials/siteHeader.hbs'), /<a class="mct__line" href="\{\{@root\.pageLine\}\}" data-track="line" data-where="mobile-menu"><span class="mct__lico"/)
})

test('หน้าขอบคุณเปิดตรง ๆ: เส้นทางหน้าไม่ซ้ำ "ติดต่อทีมดี" · ปุ่มเด่นเหลือปุ่มเดียว', () => {
  const ty = read('site/thank-you/index.html')
  assert.match(ty, /id="tyCrumb">ยังไม่ได้ส่งข้อมูล</)
  assert.match(ty, /id="tyContact" class="btn btn-line/)
})

test('ป้ายคุกกี้มือถือกะทัดรัด · ลิงก์นโยบายจุดกด 44px', () => {
  const css = read('src/styles/main.css')
  assert.match(css, /@media \(max-width: 639px\) \{\n  \.ck \{[^}]*\}\n  \.ck__in \{[^}]*\}\n  \.ck__ico \{ display: none; \}/)
  assert.match(css, /\.ck__p a \{ display: inline-block; padding-block: 12px; margin-block: -12px; \}/)
})

test('เรื่องราวลูกค้าหน้าผลงานเป็นราง · ค้นหาครอบคำถาม FAQ และมีในเมนูมือถือ', () => {
  assert.ok(RAILS.includes('ol.sty'))
  assert.match(read('site/search/index.html'), /\{\{#each faqSearch\}\}[^\n]*"k":"คำถาม"/)
  assert.match(read('vite.config.js'), /if \(at === '\/search\/'\) base\.faqSearch =/)
  assert.match(read('src/partials/siteHeader.hbs'), /<a class="btn btn-line btn-sm gap-2" href="\{\{url 'search'\}\}">[\s\S]*?ค้นหา<\/a>/)
})

test('คำนำแกลเลอรีไม่ใช้คำที่ลูกค้าใหม่ไม่รู้ · เครื่องคำนวณบอกขั้นต่ำระหว่างพิมพ์', () => {
  const g = read('src/partials/galleryPage.hbs')
  assert.doesNotMatch(g, /คลังเดิม/)
  assert.match(g, /แบบมีรหัส \(เช่น TD-0001\)/)
  assert.match(read('src/js/calc-page.js'), /show\(\$\('qErr'\), low\)/)
})

test('รีวิว: โฟกัสแรกที่ปุ่มปิด', () => {
  assert.match(read('src/js/review-dialog.js'), /\$\('\.rvd__x'\)\.focus\(\)/)
})
