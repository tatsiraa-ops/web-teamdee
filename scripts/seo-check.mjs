/* อ่านค่า SEO จาก HTML หนึ่งหน้า · ใช้ใน tests/seo-pages.test.js · ไม่มี dependency */

/** หน้าภายในที่ไม่ขึ้นเว็บจริง · export-wp ข้าม และเทส SEO ไม่ตรวจ */
export const INTERNAL_PAGES = new Set(['/ui/', '/hero-storyboard/', '/design-sample/'])

/** หน้านี้ส่งขึ้นธีม WordPress ไหม · บทความร่างใต้ /blog/…/ อยู่แค่ในต้นแบบ
    v22: ใช้ 12 บทความเดิมจาก CMS ถ้าส่งขึ้นไป ธีมจะเปิด URL ใหม่ที่เนื้อหาเราเขียนเอง */
/** หน้าเดิมบนเว็บจริงที่ v22 ไม่มีต้นแบบ · เก็บเนื้อหาเดิมจาก CMS ไว้ (START-HERE v22) · ธีมห้ามเอาหน้าร่างไปทับ */
/* หน้าที่เว็บจริงมีเนื้อหาใน CMS อยู่แล้ว และของเรายังไม่พร้อมแทน → ไม่ export ให้ WordPress ใช้หน้าเดิม
   privacy / terms: ร่างของเรายังไม่ผ่านการตรวจทางกฎหมาย (22 ต.ค. 2026)
   /calculations/ เอาออกจากรายการแล้ว (อาร์ต 24 ต.ค. "คำนวณราคาเอาตามในเว็บของเรา") → ธีมแสดงเครื่องคำนวณของเราแทนหน้าเดิม */
export const CMS_PAGES = new Set(['/collar-styles/', '/privacy-policy/', '/terms-conditions/'])

/* หน้าเคสจากคลิปใต้ /project/…/ (videos.json · 26 ต.ค.) อยู่แค่ในต้นแบบ จนกว่าคลิปพร้อมและสร้างหน้าใน WordPress แล้ว */
export const isExported = (route) => !INTERNAL_PAGES.has(route) && !route.startsWith('/design-preview/') && !route.startsWith('/ui/') && !CMS_PAGES.has(route) && !/^\/blog\/.+\//.test(route) && !/^\/project\/.+\//.test(route)
/* แท็กตัดบรรทัดไทย (t-nw · t-p · t-g จาก src/js/thai-break.js) อยู่กลางคำ ถอดทิ้งโดยไม่เว้นวรรค */
const text = (s) => s.replace(/<\/?t-(?:nw|p|g)>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
/* ค่า attribute ทั้งแบบ "..." '...' ไม่มีเครื่องหมายคำพูด และแบบไม่มีค่า (alt เฉยๆ = ข้อความว่าง) · ไม่มี attribute = undefined */
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+)))?(?=[\\s/>])`, 'i'))
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : undefined
}
const short = (tag) => tag.replace(/\s+/g, ' ').slice(0, 90)

export function inspectPage(html) {
  const end = html.search(/<\/head>/i)
  const head = end < 0 ? html : html.slice(0, end)
  /* ตัด <template> กับ <script> ออกก่อนนับ · โค้ดฝั่ง JS ไม่ใช่สิ่งที่ Google เห็นตอนแรก */
  const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<template[\s\S]*?<\/template>/gi, '')
  const tags = (name) => body.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || []
  const heads = (n) => (body.match(new RegExp(`<h${n}\\b[\\s\\S]*?</h${n}>`, 'gi')) || []).map(text)
  const ldErrors = []
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]) } catch (e) { ldErrors.push(`JSON-LD อ่านไม่ได้: ${String(e.message).slice(0, 60)}`) }
  }
  return {
    title: text((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1]),
    desc: attr((head.match(/<meta[^>]+name="description"[^>]*>/i) || [''])[0], 'content') || '',
    canonical: !!head.match(/<link[^>]+rel="canonical"/i),
    noindex: /<meta[^>]+name="robots"[^>]+noindex/i.test(head),
    h1: heads(1),
    h2: heads(2),
    imgNoAlt: tags('img').filter((t) => attr(t, 'alt') === undefined).map(short),
    imgNoSrc: tags('img').filter((t) => !attr(t, 'src') && !attr(t, 'data-src')).map(short),
    badLinks: tags('a').filter((t) => { const h = attr(t, 'href'); return h === undefined || h === '' || /^javascript:/i.test(h) }).map(short),
    ldErrors,
    hasAccordion: body.includes('hs-accordion-toggle'),
  }
}
