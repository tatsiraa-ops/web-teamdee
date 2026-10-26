/* กริด "ผลงานจริง" หน้าแรก · รวมรูปผลงาน (works.json) กับภาพลูกค้าใส่จริง (customers.json)
   แทน 2 แถวเลื่อนเดิมที่ตัดการ์ดขาดขอบและใช้รูปซ้ำกัน (อาร์ตเคาะ 23 ต.ค. 2026) · ใช้ตอน build ใน vite.config.js และตัวกรองใน home-picker.js
   24 ต.ค.: ชื่องานและเรื่องเล่าใน works.json แต่งขึ้น (ไม่ตรงกับรูป) → ลบทิ้ง · การ์ดผลงานเหลือแค่หมวดกับคำบรรยายตามที่เห็นในรูป ไม่ลิงก์ไปเรื่องเล่า */

export const CATS = [
  { id: '', name: 'ทั้งหมด' },
  { id: 'corporate', name: 'องค์กร' },
  { id: 'school', name: 'โรงเรียน / มหาวิทยาลัย' },
  { id: 'sports', name: 'กีฬา' },
  { id: 'event', name: 'อีเวนต์' },
]

/* หมวดของรูปผลงาน (works.cat) ใช้ชุดเดียวกับภาพลูกค้า · ดูจากรูปทีละรูป · รูปที่ยังไม่รู้หมวด (cat ว่าง) ขึ้นแค่แท็บทั้งหมด */
export function buildRealGrid(works = [], customers = [], { perCat = 4 } = {}) {
  const cases = works.filter((w) => w.img).map((w) => ({ img: w.img, alt: w.alt, meta: w.catName || '', cat: w.cat || '' }))
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
