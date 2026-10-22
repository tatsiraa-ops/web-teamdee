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
