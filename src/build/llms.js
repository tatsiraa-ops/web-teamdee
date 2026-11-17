/* /llms.txt (17 พ.ย. 2026 แผน SEO/GEO ข้อ A1 · tests/llms-txt.test.js)
   ไฟล์สรุปให้ AI (ChatGPT · Perplexity · Claude · Gemini) อ่านข้อมูลบริษัท เงื่อนไข ราคาเริ่มต้น วันผลิต และหน้าหลักได้ในไฟล์เดียว
   สร้างตอน export จากข้อมูลจริงเท่านั้น (site.json · prices.json · lead-times.json · pages.json) · แก้ข้อมูลที่ไฟล์ต้นทางแล้ว export ใหม่
   ไม่มีราคาพิมพ์ลาย (อาร์ต 17 พ.ย. 2026 ไม่ใส่ราคาบน /sublimation/) */

const clean = (s) => String(s ?? '').replace(/[ ⁠]+/g, ' ').replace(/\s+/g, ' ').trim()
const bandsOf = (p) => (p?.bands || []).filter((b) => b.price && Object.values(b.price).some((v) => typeof v === 'number'))
const first = (p) => bandsOf(p)[0]

/** ราคาเริ่มต้น (ช่วงจำนวนแรก) ของแต่ละสินค้าที่เปิดราคาได้ */
function priceLines(prices) {
  const P = prices.products || {}
  const out = []
  const polo = first(P.polo)
  if (polo) {
    const names = Object.fromEntries((P.polo.cols || []).map((c) => [c.id, c.chip || c.name]))
    out.push(`- โปโลปักโลโก้ (${polo.min}–${polo.max} ตัว · ${P.polo.include?.short || ''}): ${Object.entries(polo.price).map(([k, v]) => `${names[k] || k} ${v}`).join(' · ')} บาท/ตัว`)
  }
  const screen = first(P.screen)
  if (screen) out.push(`- สกรีน DFT เริ่ม ${screen.min} ตัว: ${Object.values(screen.price).filter(Number).join(' / ')} บาท/ตัว (${screen.min}–${screen.max} ตัว)`)
  for (const [id, name] of [['baseball', 'เสื้อเบสบอล'], ['jersey', 'เสื้อเจอร์ซีย์ทรงโอเวอร์ไซส์']]) {
    const b = first(P[id])
    if (b) out.push(`- ${name}: ${Object.values(b.price).filter(Number)[0]} บาท/ตัว (${b.min}–${b.max} ตัว) · ราคาลดตามจำนวน`)
  }
  return out
}

export function llmsText({ site, prices, lead, pages }) {
  const base = site.baseUrl
  const L = []
  L.push(`# ${site.brand} (ทีมดี)`, '')
  L.push(`> รับออกแบบและผลิตเสื้อทีม เสื้อบริษัท เสื้อโปโลปักโลโก้ เสื้อพิมพ์ลายทั้งตัว และสกรีนเสื้อ DFT · บริษัท ดีดี ฟินิกซ์ จำกัด · นนทบุรี · ดูแลงานเสื้อทีมตั้งแต่ปี ${site.foundedYear} · ${site.clients} องค์กร · ${site.projects} งาน`, '')
  L.push('## ข้อมูลบริษัท')
  L.push(`- ชื่อ: ${site.brand} (ทีมดี) · นิติบุคคล: บริษัท ดีดี ฟินิกซ์ จำกัด`)
  L.push(`- ที่อยู่: ${clean(site.address)}`)
  L.push(`- โทร: ${site.phonePrimary}${site.phoneSecondary ? ` / ${site.phoneSecondary}` : ''} · LINE: @teamdee (${site.lineUrl})`)
  L.push(`- เวลาทำการ: ${clean(site.hours)}`)
  L.push(`- เว็บไซต์: ${base}/ · ${(site.social || []).join(' · ')}`, '')
  L.push('## เงื่อนไขหลัก')
  L.push(`- ขั้นต่ำ ${prices.minQty} ตัว (สกรีน DFT เริ่ม 1 ตัว) · ราคา${prices.vatIncluded ? 'รวม VAT 7%' : ''} · ทุกไซซ์ราคาเดียว`)
  if (site.payLine) L.push(`- ชำระเงิน: ${clean(site.payLine)}`)
  L.push(`- ผลิต: ${['polo', 'print', 'screen'].map((k) => lead[k] && `${lead[k].tech} ${lead[k].days}`).filter(Boolean).join(' · ')} (${lead.start})`)
  L.push(`- ${lead.rush} · ${lead.season}`, '')
  L.push('## ราคาเริ่มต้นต่อตัว (บาท รวม VAT)')
  L.push(...priceLines(prices))
  L.push('- เสื้อพิมพ์ลายทั้งตัว: แจ้งราคาตามแบบและจำนวน ทักทาง LINE', '')
  L.push('## หน้าหลัก')
  for (const [route, p] of Object.entries(pages)) {
    if (!route.startsWith('/') || /noindex/.test(p.robots || '') || !p.title) continue
    L.push(`- [${clean(p.title.replace(/\s*\|\s*TEAMDEE\s*$/, ''))}](${base}${route}): ${clean(p.description)}`)
  }
  return L.join('\n') + '\n'
}
