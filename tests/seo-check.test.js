import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inspectPage } from '../scripts/seo-check.mjs'

const page = (head, body) => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`

test('head มีสคริปต์ที่เขียนคำว่า <body ก็ยังอ่าน title / description / canonical ได้', () => {
  const p = inspectPage(page('<script>var s="<body>"</script><title>หน้า</title><meta name="description" content="คำอธิบาย"><link rel="canonical" href="/">', '<h1>หัว</h1>'))
  assert.equal(p.title, 'หน้า')
  assert.equal(p.desc, 'คำอธิบาย')
  assert.equal(p.canonical, true)
})

test('alt แบบเครื่องหมายคำพูดเดี่ยว / ไม่มีค่า นับว่ามี · data-alt ไม่นับ', () => {
  const p = inspectPage(page('', `<img src="a" alt='x'><img src="b" alt><img src="c" alt=""><img src="d" data-alt="x">`))
  assert.equal(p.imgNoAlt.length, 1)
  assert.match(p.imgNoAlt[0], /src="d"/)
})

test('H1 ในคอมเมนต์ / template / script ไม่นับ', () => {
  const p = inspectPage(page('', '<!-- <h1>เก่า</h1> --><template><h1>t</h1></template><h1>จริง</h1>'))
  assert.deepEqual(p.h1, ['จริง'])
})

test('ลิงก์ไม่มี href / href ว่าง / javascript: ถูกจับ', () => {
  const p = inspectPage(page('', '<a href="/x">ok</a><a>1</a><a href="">2</a><a href="javascript:void 0">3</a>'))
  assert.equal(p.badLinks.length, 3)
})

test('รูปที่ src ว่างถูกจับ · data-src (โหลดทีหลัง) ไม่นับ', () => {
  const p = inspectPage(page('', '<img src="" alt="a"><img alt="b"><img data-src="/x.webp" alt=""><img src="/y.webp" alt="">'))
  assert.equal(p.imgNoSrc.length, 2)
})
