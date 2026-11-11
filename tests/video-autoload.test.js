import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { autoStart } from '../src/js/video-slot.js'

/* 3 พ.ย. อาร์ต "ให้คลิปแสดงมาเลย เอาแค่สามคลิป" · กล่องคลิปหน้าแรก (data-embed-auto): ยินยอมสื่อแล้ว = ตัวเล่นขึ้นเอง ไม่ต้องกด
   ยังไม่ยินยอม = ยังขออนุญาตตาม PDPA · ที่อื่น (ไม่มี data-embed-auto) คงกดเล่นทีละตัวตามที่อาร์ตอนุญาต 30 ต.ค. */
test('ตัวเล่นขึ้นเองเฉพาะกล่องที่ตั้ง auto และยินยอมสื่อแล้ว', () => {
  assert.equal(autoStart({ media: true }, true), true)
  assert.equal(autoStart({ media: false }, true), false)
  assert.equal(autoStart({ media: true }, false), false)
})

test('หน้าแรกเหลือ 3 คลิป ตั้ง auto · ไม่มีกล่อง "ดูคลิปรีวิวเพิ่มเติม"', () => {
  const html = readFileSync(new URL('../dist-wp/index.html', import.meta.url), 'utf8')
  const sec = html.slice(html.indexOf('id="home-clips"'), html.indexOf('</section>', html.indexOf('id="home-clips"')))
  assert.match(sec, /<ul class="vgrid mt-8" data-embed-auto>/)
  assert.equal((sec.match(/<figure class="vslot/g) || []).length, 3)
  assert.doesNotMatch(sec, /hm-customer-proof__more|ดูคลิปรีวิวเพิ่มเติม/)
})

/* 3 พ.ย. อาร์ต "ไม่ต้องสน pdpa แล้ว เอาระบบ cookie ออก เดะค่อยใส่" · สวิตช์ site.json cookieConsent=false (ต้องเปิดคืนก่อนขึ้นเว็บจริง)
   ปิด = ไม่มีแถบคุกกี้ · ตัวเล่น FB ถือว่าอนุญาต (กดเล่นได้เลย/หน้าแรกขึ้นเอง) · GA/โฆษณาคง denied ตามค่าเริ่มต้นของ GTM */
test('ปิดระบบคุกกี้ชั่วคราว: ไม่มีแถบคุกกี้ · มี meta บอกปิด · ตัวเล่นคลิปถือว่าอนุญาต', async () => {
  const site = JSON.parse(readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8'))
  assert.equal(site.cookieConsent, false)
  const html = readFileSync(new URL('../dist-wp/index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(html, /id="ckBar"|id="ckDialog"/)
  assert.match(html, /<meta name="td-consent" content="off">/)
  const { consentWhenOff } = await import('../src/js/consent.js')
  assert.deepEqual(consentWhenOff(), { asked: true, analytics: false, marketing: false, media: true })
})

/* 9 พ.ย. อาร์ต "แสดงมาเลย" (แคปกล่องดำ "เล่นคลิป" บน /project/) · คลิปลูกค้าบนหน้าผลงานขึ้นตัวเล่นเองแบบหน้าแรก */
test('/project/ คลิปลูกค้าตั้ง auto ทุกตัว', () => {
  const html = readFileSync(new URL('../dist-wp/project/index.html', import.meta.url), 'utf8')
  const at = html.indexOf('id="clips"')
  const sec = html.slice(at, html.indexOf('</section>', at))
  assert.match(sec, /<ul class="vgrid mt-8" data-embed-auto>/)
  assert.ok((sec.match(/<figure class="vslot/g) || []).length >= 1)
})
