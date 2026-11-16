import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRewrite } from '../scripts/wp-rewrite.mjs'

const rw = makeRewrite({ themeUrl: '/wp-content/themes/teamdee/build', baseUrl: 'https://team-dee.com' })
const T = '/wp-content/themes/teamdee/build'

test('path ไฟล์ที่ขึ้นต้นด้วย / ชี้เข้าธีม · ลิงก์หน้าไม่แตะ', () => {
  assert.equal(rw('<img src="/img/a.webp">'), `<img src="${T}/img/a.webp">`)
  assert.equal(rw('srcset="/img/a.webp 1x, /img/b.webp 2x"'), `srcset="${T}/img/a.webp 1x, ${T}/img/b.webp 2x"`)
  assert.equal(rw('url(/assets/x.css)'), `url(${T}/assets/x.css)`)
  assert.equal(rw('<a href="/sublimation/">'), '<a href="/sublimation/">')
  assert.equal(rw('<link rel="icon" href="/favicon.svg">'), `<link rel="icon" href="${T}/favicon.svg">`)
})

test('URL เต็มของไฟล์ (og:image · JSON-LD · โลโก้) ชี้เข้าธีม', () => {
  assert.equal(rw('"https://team-dee.com/img/a.jpg"'), `"https://team-dee.com${T}/img/a.jpg"`)
  assert.equal(rw('"logo":"https://team-dee.com/apple-touch-icon.png"'), `"logo":"https://team-dee.com${T}/apple-touch-icon.png"`)
  assert.equal(rw('"https://team-dee.com/logo/x.svg"'), `"https://team-dee.com${T}/logo/x.svg"`)
})

test('URL เต็มของหน้า (canonical · og:url) ไม่แตะ และไม่แปลงซ้ำ', () => {
  assert.equal(rw('<link rel="canonical" href="https://team-dee.com/corporate/">'), '<link rel="canonical" href="https://team-dee.com/corporate/">')
  const once = rw('"https://team-dee.com/img/a.jpg" src="/img/b.webp"')
  assert.equal(rw(once), once)
})

/* 16 พ.ย. 2026 C1 ระยะ 1 (อาร์ต "เริ่มเตรียมบนเครื่องไว้ก่อนเลย"): รูปย้ายออกจากธีมไปโฟลเดอร์ wp-content/uploads/teamdee/img
   ธีมเหลือ ~10MB อัปโหลดผ่านหลังบ้านได้ · รูปวางครั้งเดียว ต่อไปส่งเฉพาะรูปใหม่ · assets โลโก้ ไฟล์ดาวน์โหลด ยังอยู่ในธีม */
const I = '/wp-content/uploads/teamdee/img'
const rwImg = makeRewrite({ themeUrl: T, imgUrl: I, baseUrl: 'https://team-dee.com' })
test('รูป (/img/) ชี้โฟลเดอร์ uploads · ไฟล์อื่นยังชี้ธีม', () => {
  assert.equal(rwImg('<img src="/img/a.webp">'), `<img src="${I}/a.webp">`)
  assert.equal(rwImg('srcset="/img/a.webp 1x, /img/b.webp 2x"'), `srcset="${I}/a.webp 1x, ${I}/b.webp 2x"`)
  assert.equal(rwImg('"https://team-dee.com/img/a.jpg"'), `"https://team-dee.com${I}/a.jpg"`)
  assert.equal(rwImg('url(/assets/x.css)'), `url(${T}/assets/x.css)`)
  assert.equal(rwImg('"/logo/x.svg" "/files/a.csv"'), `"${T}/logo/x.svg" "${T}/files/a.csv"`)
  assert.equal(rwImg('<link rel="icon" href="/favicon.svg">'), `<link rel="icon" href="${T}/favicon.svg">`)
  const once = rwImg('"https://team-dee.com/img/a.jpg" src="/img/b.webp"')
  assert.equal(rwImg(once), once, 'รันซ้ำได้ผลเท่าเดิม')
})
