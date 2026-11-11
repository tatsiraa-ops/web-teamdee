/* คลิปจาก IG ทีมดี (src/data/videos.json) · ใช้ตอน build ใน vite.config.js · เทส tests/videos.test.js
   ไม่ฝัง Instagram: สคริปต์ Meta หนัก + คุกกี้ติดตาม + Google ให้คะแนนคลิปกับ instagram.com ไม่ใช่เว็บเรา
   → ใช้ไฟล์ต้นฉบับบนเว็บเอง โหลดเมื่อกดเล่น (src/js/video-slot.js) + VideoObject */

const pending = (s) => /\[[^\]]*\]/.test(String(s ?? ''))

/** ขึ้นเว็บจริงได้ไหม: มีไฟล์ รูปปก ความยาว วันที่โพสต์ (uploadDate ของ Google) · ลูกค้ายินยอม · เพลงใช้นอก IG ได้ · ไม่มีข้อความรอยืนยัน */
export const videoReady = (v) =>
  Boolean(v.file && v.poster && v.duration && v.date && v.consent === true && v.music === 'ok') &&
  ![v.title, v.summary, v.qty, v.customer].some(pending)

/** 75 → PT1M15S */
export const isoDuration = (sec) => {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `PT${m ? `${m}M` : ''}${s || !m ? `${s}S` : ''}`
}

/** 75 → 1:15 สำหรับแสดงบนปุ่มเล่น */
export const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`

/** VideoObject ตามช่องที่ Google ใช้ทำผลค้นหาแบบวิดีโอ · ยังไม่พร้อม = null */
export function videoSchema(v, baseUrl = '') {
  if (!videoReady(v)) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.summary,
    thumbnailUrl: [baseUrl + v.poster],
    contentUrl: baseUrl + v.file,
    uploadDate: v.date,
    duration: isoDuration(v.duration),
  }
}

/** ลิงก์ไปดูคลิปบนเพจทีมดี · Facebook ก่อน (คนดูเยอะกว่า) แล้วค่อย IG */
const postLink = (v) => (v.links?.fb ? { link: v.links.fb, linkName: 'Facebook' } : v.links?.ig ? { link: v.links.ig, linkName: 'Instagram' } : null)

/** ตัวเล่นของ Facebook (video plugin) · ขึ้นในหน้าเลย โหลดเมื่อเลื่อนมาใกล้ (videoSlot.hbs loading=lazy · อาร์ตขอ 26 ต.ค.) */
const fbEmbed = (url) => `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`

/** play = เล่นบนเว็บเรา · embed = เล่นผ่านตัวเล่น Facebook ในหน้าเรา (อาร์ตเลือก 26 ต.ค.)
    link = การ์ดพาไปดูบน IG (ตัวเล่น IG หนักและคุมขนาดไม่ได้) · wait = ยังไม่มีอะไรให้ดู */
const modeOf = (v) => (videoReady(v) ? 'play' : v.links?.fb ? 'embed' : postLink(v) ? 'link' : 'wait')

/** คลิปที่วางในจุดนี้ (key ของ routes เช่น 'products.polo') · เว็บจริงเอาเฉพาะที่ดูได้ (play · embed · link) */
export const videosFor = (list, place, { forWp = false } = {}) =>
  list.filter((v) => (v.places || []).includes(place) && (!forWp || modeOf(v) !== 'wait'))

/** ข้อมูลที่แม่แบบใช้ · mode + ลิงก์เพจ + ความยาวแบบอ่านง่าย (ไฟล์จริงก่อน ไม่มีใช้ความยาวที่เห็นบนเพจ) */
export const videoView = (v) => {
  const sec = v.duration || v.durationPosted
  const mode = modeOf(v)
  return { ...v, ...postLink(v), mode, ...(mode === 'embed' ? { embedSrc: fbEmbed(v.links.fb) } : {}), ready: videoReady(v), clock: sec ? clock(sec) : '' }
}
