import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
before(() => execSync('npx vite build --logLevel error', { stdio: 'pipe' }))
/* ถอดแท็กตัดบรรทัดไทย (src/js/thai-break.js) ที่อยู่กลางคำ ก่อนเทียบข้อความ */
const readHtml = (f) => readFileSync(f, 'utf8').replace(/<\/?t-(?:nw|p|g)>/g, '')
test('direct thank-you HTML does not assert a successful submission', () => {
 const html = readHtml('dist/thank-you/index.html')
 assert.match(html, /ยังไม่มีข้อมูลยืนยันการส่งฟอร์ม/)
 assert.doesNotMatch(html, /ทีมดีได้รับข้อมูลของคุณแล้ว/)
 assert.match(html, /id="tyContact"/)
})
test('global search indexes all published CMS articles with valid URLs, not draft posts', () => {
 const html = readHtml('dist/search/index.html')
 const data = JSON.parse(html.match(/id="searchIndex"[^>]*>([\s\S]*?)<\/script>/)[1])
 const expected = JSON.parse(readFileSync('src/data/legacy-posts.json', 'utf8')).items
 const articles = data.pages.filter(p => p.k === 'บทความ')
 assert.equal(articles.length, expected.length)
 for (const p of expected) assert.ok(articles.some(a => a.u === p.url && a.t === p.title))
})
test('designs product-options link points to an existing section', () => {
 /* 6 พ.ย. อาร์ต "ภาพแรกลบ": หมายเหตุใต้ตาราง (ที่มีลิงก์ #options) ถูกลบ · ลิงก์ไปหน้าพิมพ์ลายที่ยังมี ต้องชี้ section ที่มีจริง */
 const designs = readHtml('dist/designs/index.html')
 const sub = readHtml('dist/sublimation/index.html')
 for (const [, id] of designs.matchAll(/href="\/sublimation\/#([\w-]+)"/g)) assert.match(sub, new RegExp(`id="${id}"`), `#${id} มีจริง`)
 assert.match(sub, /id="options"/)
 assert.doesNotMatch(designs, /\/sublimation\/#spec/)
})

test('confirmed submission restores success copy and only tracks once', async () => {
 const { runInNewContext } = await import('node:vm')
 const { readThanksFlag, thanksFlag } = await import('../src/js/contact-send.js')
 const source = readFileSync('src/js/thanks-page.js','utf8').replace(/^import .*$/gm,'')
 const ids = ['tyHeading','tyCrumb','tyLead','tyContact','wait-h','tyTel','tyTelNum']
 const nodes = Object.fromEntries(ids.map(id=>[id,{textContent:'',hidden:false}]))
 let stored = thanksFlag({tel:'0812345678',from:'test'})
 let events = 0
 const context = {document:{getElementById:id=>nodes[id]},sessionStorage:{getItem:()=>stored,setItem:(k,v)=>{stored=v}},readThanksFlag,trackEvent:()=>{events++}}
 runInNewContext(source,context)
 assert.equal(nodes.tyHeading.textContent,'ทีมดีได้รับข้อมูลของคุณแล้ว')
 assert.equal(nodes.tyContact.hidden,true)
 assert.equal(events,1)
 runInNewContext(source,{...context})
 assert.equal(events,1)
})
