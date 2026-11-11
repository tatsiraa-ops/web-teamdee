/* คลังรูปกลาง (30 ต.ค.) · ข้อมูล src/data/media-library.json (สร้างด้วย scripts/media-library.mjs)
   ตัวเลือกรูปชุดเดียว ใช้ทั้งตอน build (vite.config.js mediaFor / galleryFor) และหน้า /ui/media/ (filterMedia)
   ไม่มีโค้ดที่ต้องใช้ fs · ทดสอบใน tests/media-library.test.js */

/* id กลุ่มลูกค้าตาม uses.json */
export const GROUPS = ['corp', 'shop', 'gov', 'edu', 'class', 'faculty', 'sport', 'badminton', 'running', 'event']
/* ภาพคนใส่เสื้อจริง (ลูกค้า · ชุดหน้าแรก · ชุดผลงาน) */
export const REAL_KINDS = ['customer', 'real', 'work']
/* ภาพแบบที่ไม่มีรหัส TD แต่ข้อมูลบอกกลุ่มไว้ (เสื้อ 3D · แกลเลอรีเว็บเดิม) */
export const REF_KINDS = ['mockup3d', 'gallery']

const list = (x) => (x == null || x === '' ? null : [].concat(x))
const itemsOf = (lib) => (Array.isArray(lib) ? lib : lib?.items || [])

/** เลือกรูปจากคลัง · กลุ่มตรงจากแหล่งหลัก (primary) ขึ้นก่อน → ลำดับชนิดตามที่ขอ → คุณภาพ q → ลำดับในคลัง
 *  รูปที่เนื้อไฟล์ซ้ำกัน (dupOf) เหลือใบเดียวในผลลัพธ์ · ใบซ้ำที่ตัวหลักไม่ได้ถูกเลือก (เช่น อยู่คนละกลุ่ม) ยังใช้ได้ */
export function mediaFor(lib, { group, kind, product, limit = Infinity, exclude = [], primaryOnly = false } = {}) {
  const kinds = list(kind)
  const products = list(product)
  const skip = new Set(exclude)
  const rank = (m) => (group && (m.primary || []).includes(group) ? 0 : 1)
  const seen = new Set(skip) // ใบซ้ำของรูปที่ตัดออกก็ตัดด้วย
  return itemsOf(lib)
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => !skip.has(m.path)
      && (!kinds || kinds.includes(m.kind))
      && (!products || (m.product || []).some((p) => products.includes(p)))
      && (!group || (m.groups || []).includes(group))
      && (!primaryOnly || rank(m) === 0))
    .sort((a, b) => rank(a.m) - rank(b.m)
      || (kinds ? kinds.indexOf(a.m.kind) - kinds.indexOf(b.m.kind) : 0)
      || (b.m.q ?? 0) - (a.m.q ?? 0)
      || a.i - b.i)
    .filter(({ m }) => { const k = m.dupOf || m.path; if (seen.has(k)) return false; seen.add(k); return true })
    .slice(0, limit)
    .map(({ m }) => m)
}

/** แกลเลอรีแบบเสื้อรายกลุ่ม: แบบ TD (coded) → ภาพแบบอ้างอิงของกลุ่ม → งานจริงของลูกค้ากลุ่มนี้
 *  referenceN = ภาพที่ไม่มีรหัสทั้งหมด (ตรงกับบรรทัด "อีก N ภาพเป็นงานที่เคยทำ") · realFirst = จุดวางหัวข้องานจริง */
export function galleryFor(lib, { group, shortName = '', coded = [], realLimit = 12 } = {}) {
  const used = new Set(coded.map((d) => d.img))
  const codes = new Set(coded.map((d) => d.code))
  /* เสื้อ 3D ที่เป็นแบบเดียวกับแบบมีรหัสในหน้านี้ (sameAs) ไม่ใส่ซ้ำ */
  const refs = mediaFor(lib, { group, kind: REF_KINDS, primaryOnly: true, exclude: [...used] }).filter((m) => !codes.has(m.sameAs)).map((m) => ({
    img: m.path, square: true, w: m.w, h: m.h, alt: m.alt || `แบบเสื้อกลุ่ม${shortName}ที่ทีมดีออกแบบ`,
  }))
  for (const r of refs) used.add(r.img)
  const real = mediaFor(lib, { group, kind: REAL_KINDS, limit: realLimit, exclude: [...used] }).map((m, i) => ({
    img: m.path, real: true, realFirst: i === 0, w: m.w, h: m.h,
    alt: `${m.occ || m.alt || 'ทีมลูกค้าใส่เสื้อที่ทีมดีผลิต'} · งานจริงของลูกค้ากลุ่ม${shortName}`,
  }))
  return { items: [...coded, ...refs, ...real], codedN: coded.length, referenceN: refs.length + real.length, realN: real.length }
}

/** ตัวกรองหน้า /ui/media/ · group 'none' = รูปที่ยังไม่มีแท็กกลุ่ม · dup = เฉพาะรูปที่ซ้ำไฟล์อื่น */
export function filterMedia(items, { kind, group, product, q, dup } = {}) {
  const words = String(q || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
  return items.filter((m) => (!kind || m.kind === kind)
    && (!group || (group === 'none' ? !(m.groups || []).length : (m.groups || []).includes(group)))
    && (!product || (product === 'none' ? !(m.product || []).length : (m.product || []).includes(product)))
    && (!dup || !!m.dupOf)
    && words.every((w) => [m.path, m.alt, m.occ, m.code, m.sameAs].filter(Boolean).join(' ').toLowerCase().includes(w)))
}
