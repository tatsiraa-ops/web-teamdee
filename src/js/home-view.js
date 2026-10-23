/* ประกอบข้อมูลหน้าแรกตาม Wireframe v22 (src/data/home.json) · กติกาเดียวกับ product-view.js / use-view.js · มีเทส tests/home-view.test.js
   - เว็บจริง: ตัดข้อความ / การ์ด / คำถามที่ยังมี [วงเล็บ] ทิ้ง (prunePending) · ส่วนที่ไม่เหลือของจริงซ่อนทั้งส่วน
   - ต้นแบบ: เก็บไว้ทั้งหมด ติดป้ายรอข้อมูล
   - บทความล่าสุดบนเว็บจริง (latestPosts) มาแทนช่องข่าวสารที่ยังไม่มีของจริงในส่วนคู่มือและข่าวสาร */
import { prunePending } from './prune.js'

export function homeView(h, { forWp, latestPosts = [], years }) {
  const v0 = forWp ? prunePending(h) : h
  /* "{years} ปี" = ปีนี้ลบปีก่อตั้ง (site.foundedYear) คิดตอน build */
  const v = { ...v0, stats: { ...v0.stats, items: v0.stats.items.map((x) => ({ ...x, n: String(x.n).replace('{years}', years ?? '') })) } }
  /* ส่วนที่มีของจริงหรือยัง · ดูจากข้อมูลก่อนตัด เพื่อให้ต้นแบบกับเว็บจริงตัดสินแบบเดียวกัน */
  const real = {
    /* รีวิว: ข้อความรีวิวจริง หรือเคสจริงจากภาพ (reviews.case · 23 ต.ค.) */
    reviews: h.reviews.items.some((r) => r.text) || !!h.reviews.case?.steps?.length,
    videos: h.videos.items.some((x) => typeof x === 'object' && x.url),
    aboutPhotos: h.about.cards.some((c) => c.img),
    logos: !!(h.logos.show && h.logos.approved),
    benefits: v.benefits.items.length > 0,
    /* สถิติโชว์เมื่อยืนยันแล้วอย่างน้อย 2 ตัว (ตัวเดียวดูโหว่ง) · ตัวที่ยังรอยืนยันถูกตัด */
    stats: v.stats.items.length >= 2,
    payment: v.payment.items.length > 0,
    care: v.care.items.length > 0,
  }
  const show = Object.fromEntries(Object.entries(real).map(([k, ok]) => [k, ok || !forWp]))
  if (!h.logos.show) show.logos = false

  /* คู่มือและข่าวสาร: เว็บจริงใช้การ์ดที่มีของจริง + บทความล่าสุด ให้ครบ 3 ใบ */
  const realNews = v.news.items.filter((n) => !n.ph)
  const news = forWp ? [...realNews, ...latestPosts.map((p) => ({ title: p.title, copy: p.dateTh, href: p.url, img: p.img, legacy: true }))].slice(0, 3) : v.news.items
  show.news = news.length >= 2 || !forWp

  return { ...v, real, show, news: { ...v.news, items: news } }
}
