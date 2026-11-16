/* ข้อมูลเฉพาะหน้าแบบเสื้อ (/designs/) (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e)
   คืนข้อมูลของหน้า หรือไม่คืน (undefined) = ใช้ข้อมูลกลาง base ต่อ */
/* ข้อมูลของแต่ละหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e) · pageContext(pagePath) คืนข้อมูลที่เทมเพลตของหน้านั้นใช้
   ส่วนที่ทุกหน้าใช้ร่วม (base) อยู่ที่นี่ · ส่วนเฉพาะประเภทหน้าอยู่ใน src/build/pages/<ประเภท>.js */
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { designListSchema, ldJson } from '../../../src/js/seo-schema.js'
import { gallerySelection } from '../../../src/js/gallery-selection.js'
import { root, json, lineFly, url, designsFor } from '../shared.js'

export function designsPage({ data, base, at, page, kind, id, rel, sizeCharts, pagePath }) {
          const dp = json('design-pages.json').index
          const has = (key) => { try { url(key); return true } catch { return false } }
          const liveN = (g) => json('live-gallery.json').groups[g]?.items.length || 0
          /* ทางเข้าแกลเลอรีรายกลุ่ม (ส่วน "เลือกแบบตามงานที่ใช้") แบบการ์ด · เฉพาะกลุ่มที่มีแบบ (ไม่พาไปหน้าว่าง) · ชื่อสั้นจาก uses.json */
          const useById = Object.fromEntries(json('uses.json').map((u) => [u.id, u]))
          const small = (img) => { const s = img?.replace(/(\.\w+)$/, '-320$1'); return s && existsSync(resolve(root, 'public' + s)) ? s : img }
          /* รูปการ์ด = แบบเสื้อ 3D ที่มีรหัสของกลุ่มนั้น (อาร์ตเคาะ 26 ต.ค.) · ไม่ใช้แบบซ้ำกับการ์ดก่อนหน้า */
          const usedCard = new Set()
          const pills = dp.pills.filter((l) => has(l.to)).map((l) => {
            const id = l.to.split('.')[1]
            const u = useById[id] || {}
            const own = gallerySelection(data.designs, id, designsFor(data.designs, id)).items
            const d = own.find((x) => !usedCard.has(x.code)) || own[0]
            if (d) usedCard.add(d.code)
            return { ...l, id, short: u.shortName || l.t, photo: d?.imgSmall || small(u.img), n: own.length + liveN(id), codedN: own.length, referenceN: liveN(id) }
          }).filter((l) => l.n > 0)
          /* ชิปกลุ่มลูกค้า (รอบ 150): ลิงก์ ?use= ใช้ได้แม้ไม่มี JS · แบด/วิ่ง ไม่มีแบบติดกลุ่ม → กรองตามทรงเสื้อ (garment) · ชิปที่กรองแล้วไม่มีแบบ = build พัง */
          const byGarment = { badminton: 'badminton', running: 'running' }
          const home = url('designs')
          const chips = [{ t: dp.chipsAll, href: home, axis: '', val: '' }, ...pills.map((l) => {
            const axis = byGarment[l.id] ? 'garment' : 'use', val = byGarment[l.id] || l.id
            if (!data.designs.some((x) => (axis === 'use' ? (x.use || []).includes(val) : x.garment === val))) throw new Error(`design-pages.json: ชิป ${l.id} ไม่มีแบบ`)
            return { t: l.short, href: `${home}?${axis}=${val}`, axis, val }
          })]
          /* แบนเนอร์ LINE (รอบ 151): แนบภาพแบบจริงในแชทตัวอย่าง · ข้อความในแชท = บรรทัดที่ปุ่มพิมพ์รอไว้ (designsCtaLine) · "ตอบภายใน 5 นาที" คำเดียวกับ home.json */
          const att = data.designs.find((x) => x.code === 'TD-0004') || data.designs[0]
          const designsLine = { h2: data.designsCta.title, h: 'แชทผ่าน LINE', live: 'ตอบภายใน 5 นาที', sub: 'ส่งรหัสแบบที่เลือก ขอราคา หรือสั่งผลิต จบได้ในแชทเดียว', cta: 'เริ่มแชทเลย', alt: 'หรือฝากข้อมูลให้ติดต่อกลับ',
            msg: data.designsCta.msg.slice(0, 3), design: { img: att.imgSmall || att.img, code: att.code },
            /* รอบ 156 "ยังไม่โดน": เสื้อลายจริงลอยเข้าหามือถือ (lineFly) */
            fly: lineFly(data.designs) }
          return { ...base, dp: { ...dp, pills, chips }, designsLine, designsLd: ldJson(designListSchema(data.designs, data.site.baseUrl)) }
}
