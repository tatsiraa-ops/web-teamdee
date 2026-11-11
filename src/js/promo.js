/* ป๊อปอัปโฆษณา (src/data/promo.json · เทส tests/promo.test.js)
   อาร์ต 26 ต.ค. รอบ 2: ขึ้นเร็ว (1.5 วินาที) ได้ทุกหน้า · รูป 1:1 + กากบาท + "ไม่ต้องแสดงอีก"
   ครั้งเดียวต่อการเข้าเว็บ 1 รอบ (sessionStorage) · กากบาท = ไม่ขึ้นอีกในรอบนี้ · "ไม่ต้องแสดงอีก" = ไม่ขึ้น 30 วัน */

export const PROMO_DELAY_MS = 1500
export const PROMO_NEVER_DAYS = 30
export const SESSION_KEY = 'td-promo-session'
export const NEVER_KEY = 'td-promo-never'
/* มือถือ (อาร์ตเคาะ 30 ต.ค.): ขึ้นเมื่อเลื่อนเกินครึ่งหน้า แทนการนับเวลา · รอบที่เห็นป้ายคุกกี้แล้วไม่ขึ้น (ไม่ซ้อนกล่องกันในการเข้าเว็บครั้งแรก) */
export const PROMO_SCROLL = 0.5
export const CK_SESSION_KEY = 'td-ck-session'

/* 2 พ.ย.: จอใหญ่เดิมขึ้นที่ 1.5 วิ บังหัวข้อพร้อมแถบคุกกี้ → ทุกจอรอเลื่อนเกินครึ่งหน้า */
/** จังหวะขึ้น: 'scroll' (เลื่อนเกินครึ่ง) · null = ไม่ขึ้นรอบนี้ */
export const promoTrigger = ({ cookieSession }) => (cookieSession ? null : 'scroll')

/** ผู้ใช้เลื่อนแล้ว และขอบล่างของจอเลยครึ่งเอกสาร */
export const scrolledHalf = ({ y, view, doc }) => y > 0 && y + view >= doc * PROMO_SCROLL

/** ถึงจังหวะขึ้นแล้วไหม · markTop = ตำแหน่ง FAQ บนหน้าที่มีส่วนราคา (2 พ.ย.: ครึ่งหน้าตรงกับส่วนราคาพอดี) · null = ใช้ครึ่งหน้า */
export const promoDue = ({ y, view, doc, markTop }) => (Number.isFinite(markTop) ? y + view >= markTop : scrolledHalf({ y, view, doc }))

/** วันที่แบบ YYYY-MM-DD ตามเวลาไทย (วันหมดโปรนับตามวันในไทย ไม่ใช่ UTC) */
const thDay = (d) => d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' })

/** โปรที่ใช้ได้วันนี้ · ตัวแรกที่อยู่ในช่วง (end null = ไม่มีวันหมด · active false = ปิดไว้) */
export const activePromo = (items = [], now = new Date()) => {
  const today = thDay(now)
  return items.find((p) => p.active !== false && p.start <= today && (!p.end || today <= p.end)) || null
}

/** วันที่ "ไม่ต้องแสดงอีก" หมดผล */
export const neverUntil = (now = new Date()) => new Date(now.getTime() + PROMO_NEVER_DAYS * 864e5).toISOString()

/** ควรขึ้นไหม · ขึ้นแล้วในรอบนี้ = ไม่ขึ้น · กด "ไม่ต้องแสดงอีก" ยังไม่ครบ 30 วัน = ไม่ขึ้น · ทุกหน้าขึ้นได้ */
export const shouldShowPromo = ({ sessionSeen, never, now = new Date() }) => {
  if (sessionSeen) return false
  const t = Date.parse(never)
  return !(Number.isFinite(t) && now.getTime() < t)
}
