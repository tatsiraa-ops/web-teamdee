/* คลิปจาก IG @teamdee_ (อาร์ตเลือกทำ ก ข ค · 26 ต.ค. 2026 · PLAN.md "คลิปลูกค้าจาก IG")
   คลิปขึ้นเว็บจริงได้เมื่อครบ: ไฟล์ต้นฉบับ รูปปก ความยาว ลูกค้ายินยอม เพลงใช้นอก IG ได้ · ไม่แต่งคำพูดลูกค้า */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { videoReady, videoSchema, isoDuration, videosFor, videoView } from '../src/js/video-view.js'

const data = JSON.parse(readFileSync(new URL('../src/data/videos.json', import.meta.url), 'utf8'))
const full = { id: 'x', title: 'เบื้องหลังเสื้อทีม', summary: 'สรุป', date: '2026-10-25', file: '/video/x.mp4', poster: '/video/x.webp', duration: 75, consent: true, music: 'ok' }

test('คลิปพร้อมขึ้นเว็บเมื่อครบทุกข้อ · ขาดข้อเดียว = ยังไม่พร้อม', () => {
  assert.equal(videoReady(full), true)
  for (const k of ['file', 'poster', 'duration', 'date']) assert.equal(videoReady({ ...full, [k]: null }), false, k)
  assert.equal(videoReady({ ...full, consent: false }), false)
  assert.equal(videoReady({ ...full, music: 'ig-library' }), false)
  /* ข้อความที่ยังรอยืนยัน [วงเล็บ] ห้ามหลุดขึ้นเว็บ */
  assert.equal(videoReady({ ...full, summary: 'เสื้อ [1,551 หรือ 1,500] ตัว' }), false)
})

test('ความยาวคลิปเป็นรูปแบบ ISO 8601 ที่ Google อ่านได้', () => {
  assert.equal(isoDuration(75), 'PT1M15S')
  assert.equal(isoDuration(42), 'PT42S')
  assert.equal(isoDuration(120), 'PT2M')
})

test('VideoObject มีช่องที่ Google ต้องใช้ · URL เต็ม · ยังไม่พร้อม = null', () => {
  const s = videoSchema(full, 'https://team-dee.com')
  assert.equal(s['@type'], 'VideoObject')
  assert.equal(s.name, 'เบื้องหลังเสื้อทีม')
  assert.equal(s.description, 'สรุป')
  assert.deepEqual(s.thumbnailUrl, ['https://team-dee.com/video/x.webp'])
  assert.equal(s.contentUrl, 'https://team-dee.com/video/x.mp4')
  assert.equal(s.uploadDate, '2026-10-25')
  assert.equal(s.duration, 'PT1M15S')
  assert.equal(videoSchema({ ...full, file: null }, 'https://team-dee.com'), null)
})

test('เลือกคลิปตามที่วาง · เว็บจริงเอาคลิปที่เล่นบนเว็บได้ หรือมีลิงก์ไปดูบนเพจ (อาร์ต 26 ต.ค.) · ไม่มีทั้งสองอย่าง = ไม่ขึ้น', () => {
  const list = [
    { ...full, id: 'a', places: ['products.polo'] },
    { ...full, id: 'b', places: ['about'], file: null, links: { fb: 'https://www.facebook.com/teamdee/videos/1/' } },
    { ...full, id: 'c', places: ['about'], file: null },
  ]
  assert.deepEqual(videosFor(list, 'products.polo').map((v) => v.id), ['a'])
  assert.deepEqual(videosFor(list, 'about').map((v) => v.id), ['b', 'c'])
  assert.deepEqual(videosFor(list, 'about', { forWp: true }).map((v) => v.id), ['b'])
})

test('โหมดช่องคลิป: มีไฟล์ครบ = เล่นบนเว็บ (play) · มีโพสต์ FB = เล่นผ่าน Facebook (embed) · มีแค่ IG = การ์ดลิงก์ (link) · ไม่มี = รอ', () => {
  assert.equal(videoView(full).mode, 'play')
  const fb = videoView({ ...full, file: null, duration: null, durationPosted: 52, links: { ig: 'https://www.instagram.com/teamdee_/reel/x/', fb: 'https://www.facebook.com/teamdee/videos/1/' } })
  /* อาร์ต 26 ต.ค.: มีโพสต์บน Facebook = ตัวเล่นของ Facebook ขึ้นในหน้าเรา (ไม่เล่นเอง) */
  assert.equal(fb.mode, 'embed')
  assert.equal(fb.link, 'https://www.facebook.com/teamdee/videos/1/')
  assert.equal(fb.linkName, 'Facebook')
  assert.equal(fb.embedSrc, 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent('https://www.facebook.com/teamdee/videos/1/') + '&show_text=false')
  assert.equal(fb.clock, '0:52')
  const ig = videoView({ ...full, file: null, links: { ig: 'https://www.instagram.com/teamdee_/reel/x/' } })
  assert.equal(ig.linkName, 'Instagram')
  /* มีแค่ IG = การ์ดลิงก์ (ตัวเล่น IG หนักและคุมขนาดไม่ได้) */
  assert.equal(ig.mode, 'link')
  assert.equal(ig.embedSrc, undefined)
  assert.equal(videoView({ ...full, file: null }).mode, 'wait')
  /* ลิงก์ไปเพจไม่ใช่วิดีโอบนเว็บเรา → ไม่ใส่ VideoObject */
  assert.equal(videoSchema({ ...full, file: null, links: fb.links }, 'https://team-dee.com'), null)
})

test('ข้อมูลคลิปจริง: ไม่มีคลิปไหนพร้อมจนกว่าอาร์ตส่งไฟล์และยืนยัน · ทุกคลิปมีลิงก์ที่โพสต์ (IG/FB) · วันที่ไม่รู้ = null ไม่เดา', () => {
  assert.ok(data.items.length >= 8)
  const ig = /^https:\/\/www\.instagram\.com\/teamdee_\/reel\/[\w-]+\/$/
  const fb = /^https:\/\/www\.facebook\.com\/teamdee\/videos\/\d+\/$/
  for (const v of data.items) {
    assert.ok(v.links?.ig || v.links?.fb, v.id)
    if (v.links.ig) assert.match(v.links.ig, ig, v.id)
    if (v.links.fb) assert.match(v.links.fb, fb, v.id)
    assert.ok(v.date === null || /^\d{4}-\d{2}-\d{2}$/.test(v.date), v.id)
    assert.ok(v.places?.length, v.id)
  }
  /* ตอนนี้ยังไม่มีไฟล์ต้นฉบับ → ยังไม่พร้อมทุกคลิป (เทสนี้จะแดงเมื่อเติมไฟล์ครบ ให้แก้เป็นรายการที่พร้อมจริง) */
  assert.deepEqual(data.items.filter(videoReady).map((v) => v.id), [])
})
