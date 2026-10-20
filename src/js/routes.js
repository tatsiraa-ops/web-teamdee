/* URL ทุกหน้าอ่านจาก src/data/routes.json ที่เดียว
   ใช้ทั้งตอน build (vite.config.js · Handlebars helper) และในเบราว์เซอร์ (contact, search)
   key หรือ id ที่ไม่มีจะพังทันที ลิงก์เสียจะได้ไม่หลุดขึ้นเว็บ */

const META = new Set(['_note', 'lock'])

/** สร้างฟังก์ชัน url(key, id) จากตาราง · key แบบจุดได้ เช่น 'products.print' · ต่อ #หัวข้อ หรือ ?query ท้ายได้ */
export const makeUrl = (routes) => {
  const url = (key, id) => {
    if (typeof key !== 'string') throw new Error(`route key ต้องเป็นข้อความ ได้ ${key}`)
    if (/^(\/|#|https?:|mailto:|tel:)/.test(key)) return key
    const cut = key.search(/[#?]/)
    if (cut > 0) return url(key.slice(0, cut), id) + key.slice(cut)
    return lookup(routes, key, id)
  }
  return url
}

const lookup = (routes, key, id) => {
  if (id === undefined && key.includes('.')) [key, id] = key.split('.')
  const entry = META.has(key) ? undefined : routes[key]
  if (entry === undefined) throw new Error(`ไม่มี route "${key}"`)
  if (typeof entry === 'string') {
    if (!entry.includes('{id}')) return entry
    if (!id) throw new Error(`route "${key}" ต้องมี id`)
    return entry.replace('{id}', id)
  }
  if (!id) throw new Error(`route "${key}" ต้องมี id`)
  if (!(id in entry)) throw new Error(`ไม่มี route "${key}.${id}"`)
  return entry[id]
}

/** ตารางกลับด้าน URL → { kind, id } ให้ build รู้ว่าไฟล์ไหนเป็นหน้าอะไร · articleIds มาจาก articles.json */
export const pageFor = (routes, articleIds) => {
  const out = {}
  const put = (u, page) => {
    if (out[u]) throw new Error(`URL ${u} ซ้ำ: ${out[u].kind}.${out[u].id} กับ ${page.kind}.${page.id}`)
    out[u] = page
  }
  for (const [kind, entry] of Object.entries(routes)) {
    if (META.has(kind)) continue
    if (typeof entry === 'string' && entry.includes('{id}')) {
      for (const id of articleIds) put(entry.replace('{id}', id), { kind, id })
    } else if (typeof entry === 'string') {
      put(entry, { kind, id: null })
    } else {
      for (const [id, u] of Object.entries(entry)) put(u, { kind, id })
    }
  }
  return out
}
