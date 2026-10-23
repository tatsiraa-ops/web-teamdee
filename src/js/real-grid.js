/* กริด "ผลงานจริง" หน้าแรก · รวมเคสผลงาน (works.json มีชื่องาน) กับภาพลูกค้าใส่จริง (customers.json)
   แทน 2 แถวเลื่อนเดิมที่ตัดการ์ดขาดขอบและใช้รูปซ้ำกัน (อาร์ตเคาะ 23 ต.ค. 2026) · ใช้ตอน build ใน vite.config.js และตัวกรองใน home-picker.js */

export const CATS = [
  { id: '', name: 'ทั้งหมด' },
  { id: 'corporate', name: 'องค์กร' },
  { id: 'school', name: 'โรงเรียน / มหาวิทยาลัย' },
  { id: 'sports', name: 'กีฬา' },
  { id: 'event', name: 'อีเวนต์' },
]

/* กลุ่มของเคสผลงาน → หมวดเดียวกับภาพลูกค้า */
const GROUP = { corp: 'corporate', gov: 'corporate', shop: 'corporate', booth: 'event', activity: 'event', team: 'sports', edu: 'school' }

export function buildRealGrid(works = [], customers = [], { perCat = 4 } = {}) {
  const cases = works.filter((w) => w.img).map((w) => ({ img: w.img, title: w.title, meta: w.groupName, cat: GROUP[w.group] || 'corporate', href: w.id }))
  const byCat = {}
  for (const c of customers) (byCat[c.cat] ||= []).push(c)
  /* ภาพลูกค้าสลับหมวด ไม่ให้หมวดเดียวกองติดกัน */
  const photos = []
  for (let i = 0; i < perCat; i++) for (const cat of CATS.slice(1)) {
    const c = byCat[cat.id]?.[i]
    if (c) photos.push({ img: c.img, imgSmall: c.imgSmall, meta: c.catName, cat: c.cat })
  }
  const items = [...cases, ...photos]
  const cats = CATS.map((c) => ({ ...c, n: c.id ? items.filter((x) => x.cat === c.id).length : items.length })).filter((c) => c.n > 0)
  return { items, cats }
}

/** ลำดับรายการที่โชว์ตามหมวดที่เลือก ('' = ทั้งหมด) ไม่เกิน limit */
export const visibleIndexes = (cats, cat, limit) => cats.map((c, i) => (!cat || c === cat ? i : -1)).filter((i) => i >= 0).slice(0, limit)
