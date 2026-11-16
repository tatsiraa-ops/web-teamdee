/* ข้อมูลของแต่ละหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e) · pageContext(pagePath) คืนข้อมูลที่เทมเพลตของหน้านั้นใช้
   ส่วนที่ทุกหน้าใช้ร่วม (base) อยู่ที่นี่ · ส่วนเฉพาะประเภทหน้าอยู่ใน src/build/pages/<ประเภท>.js */
import { pageFor } from '../../src/js/routes.js'
import { faqSchema, businessSchema, ldJson } from '../../src/js/seo-schema.js'
import { videosFor, videoView, videoSchema } from '../../src/js/video-view.js'
import { lineMessageUrl, pageLineText, REORDER_TEXT, TRACK_TEXT } from '../../src/js/use-cta.js'
import { faqAskText } from '../../src/js/faq-search.js'
import { prunePending } from '../../src/js/prune.js'
import { designDetail } from '../../src/js/design-page.js'
import { priceLine } from '../../src/js/prices.js'
import { siteDir, forWp, json, routes, url } from './shared.js'
import { loadData } from './data.js'
import { productsPage } from './pages/products.js'
import { usesPage } from './pages/uses.js'
import { casesPage } from './pages/cases.js'
import { projectsPage } from './pages/projects.js'
import { galleriesPage } from './pages/galleries.js'
import { designsPage } from './pages/designs.js'
import { postsPage } from './pages/posts.js'
import { articlesPage } from './pages/articles.js'
import { guidesPage } from './pages/guides.js'
import { ppV2 } from './content.js'

export function pageContext(pagePath) {
        const data = loadData()
        /* เว็บจริง: FAQ ทุกชุดและคู่มือ ตัดข้อที่ยังรอยืนยัน [วงเล็บ] (รอบ 5 · 22 ต.ค. 2026) · ต้นแบบเก็บไว้ให้เห็น */
        if (forWp) {
          data.faq = prunePending(data.faq)
          data.guides = prunePending(data.guides)
          data.allGuides = prunePending(data.allGuides)
        }
        /* หาว่าไฟล์นี้คือหน้าอะไรจาก URL ของมันเอง ตารางอยู่ที่ routes.json */
        const rel = pagePath.replace(/\\/g, '/').replace(siteDir.replace(/\\/g, '/'), '')
        const at = ('/' + rel.replace(/^\//, '')).replace(/index\.html$/, '')
        const page = pageFor(routes, data.articles.items.map((a) => a.id))[at] || { kind: null, id: null }
        /* 12 พ.ย. หน้า /size-chart/ (Search Console: คนค้น "ไซส์เสื้อ" มากที่สุด) · ตารางจากข้อมูลที่ยืนยันแล้วที่เดียว ไม่พิมพ์ตัวเลขซ้ำ
           เสื้อพิมพ์ลาย = pp-v2.json print.sizes (กราฟิกทางการ LINE OA · ตรงกับเว็บจริง) · โปโลปัก = polo.json (คู่มือ 9 พ.ย.) · tests/size-chart-page.test.js */
        const sizeCharts = at === '/size-chart/' ? (() => {
          const pr = ppV2().print.sizes, po = json('polo.json').sizes
          const rows = (list) => list.map(([size, chest, length]) => ({ size, chest, length, chestCm: Math.round(chest * 2.54), lengthCm: Math.round(length * 2.54) }))
          return [
            { id: 'print', name: 'เสื้อพิมพ์ลาย · เสื้อกีฬา · เสื้อกิจกรรม', fit: 'ทรงเดียว ใส่ได้ทั้งชายและหญิง', to: url('products', 'print'), toLabel: 'ดูเสื้อพิมพ์ลาย', tol: pr.tol,
              groups: [{ label: 'ผู้ใหญ่', short: 'พิมพ์ลาย ผู้ใหญ่', range: `${pr.adult[0][0]}–${pr.adult.at(-1)[0]}`, rows: rows(pr.adult) }, { label: 'เด็ก', short: 'พิมพ์ลาย เด็ก', range: `${pr.kids[0][0]}–${pr.kids.at(-1)[0]}`, rows: rows(pr.kids) }] },
            { id: 'polo', name: 'เสื้อโปโลปัก', fit: 'ทรงชายตรง · ทรงหญิงเข้ารูป', to: url('products', 'polo'), toLabel: 'ดูเสื้อโปโลปัก', tol: po.tol,
              groups: [{ label: 'ผู้ชาย', short: 'โปโล ชาย', range: `${po.men[0][0]}–${po.men.at(-1)[0]}`, rows: rows(po.men) }, { label: 'ผู้หญิง', short: 'โปโล หญิง', range: `${po.women[0][0]}–${po.women.at(-1)[0]}`, rows: rows(po.women) }] },
          ]
        })() : null
        const base = { ...data, page, wp: forWp, articleHref: at, articleDraft: true, sizeCharts, sizeDraftHidden: forWp && data.sizing.status !== 'approved' }
        /* ปุ่ม LINE ส่วนกลาง (แถบล่าง · เมนู · hero · ปุ่มลอย · ท้ายเว็บ) ส่งข้อความตามหน้า + ทางเข้าลูกค้าเดิม (ตรวจมือถือ 30 ต.ค.) */
        {
          const named = (file) => { const j = json(file); return Object.fromEntries((Array.isArray(j) ? j : j.items || []).map((x) => [x.id, x.name])) }
          base.pageLine = lineMessageUrl(pageLineText(page, { products: named('products.json'), uses: named('uses.json') }, at))
          base.reorderLine = lineMessageUrl(REORDER_TEXT)
          base.trackLine = lineMessageUrl(TRACK_TEXT)
          /* ขอเอกสารบริษัท: หน้าแรก + หน้ากลุ่มโฉมใหม่ที่ใช้การ์ดบริษัทของหน้าแรก (up2Team.hbs) */
          base.homeDocsLine = lineMessageUrl('สวัสดี ทีมดี ขอเอกสารบริษัทสำหรับจัดซื้อ\nเอกสารที่ต้องการ (ภ.พ.20 / หนังสือรับรอง / อื่นๆ): \nชื่อหน่วยงาน: ')
          if (at === '/') {
            base.homePayLine = lineMessageUrl('สวัสดี ทีมดี สอบถามการชำระเงิน / วางบิล\nชื่อหน่วยงาน: \nวิธีที่สะดวก (โอน / PromptPay / บัตร / วางบิล): \nเอกสารที่ต้องใช้: ')
          }
          /* หน้าติดต่อรอบ 170b (ทาง ก. ตามบอร์ด): การ์ด LINE กระชับ · จอมือถือในการ์ด = บรรทัดที่ปุ่มพิมพ์รอไว้จริง (contactLineUrl)
             "ตอบภายใน 5 นาที" ผูกกับ LINE เท่านั้น (audit 2.4) */
          if (at === '/contact-us/') {
            const msg = [{ t: 'สวัสดี ทีมดี สนใจทำเสื้อทีม' }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }, { t: 'อยากได้รับวันที่', q: true }]
            base.contactLineUrl = lineMessageUrl(msg.map((m) => (m.q ? `${m.t}: ${m.unit ? ` ${m.unit}` : ''}` : m.t)).join('\n'))
            base.contactLineMsg = msg.slice(0, 3)
          }
        }
        /* ป๊อปอัปเข้าเว็บครั้งแรก (promo.json) · ลิงก์ปุ่มคิดตอน build · เลือกโปรตามวันที่ทำในเบราว์เซอร์ (promo-popup.js) */
        base.promos = json('promo.json').items.filter((p) => p.active !== false).map((p) => ({ ...p, ctaLine: p.cta.to === 'line', ctaHref: p.cta.to === 'line' ? (p.cta.message ? lineMessageUrl(p.cta.message) : data.site.lineUrl) : url(p.cta.to), cta2Href: p.cta2 && url(p.cta2.to) }))
        /* คลิปทีมดี (videos.json · PLAN.md "คลิปลูกค้าจาก IG") วางตามจุด = key ของ routes · เว็บจริงเอาเฉพาะคลิปที่พร้อม
           caseHref: หน้าเคสยังไม่ขึ้น WordPress (ต้องสร้างหน้าใน WP ก่อน) → เว็บจริงไม่ลิงก์ */
        {
          const place = page.kind && page.id ? `${page.kind}.${page.id}` : page.kind
          const caseOf = (v) => (v.places || []).find((x) => x.startsWith('cases.'))?.slice(6)
          base.vids = place ? videosFor(data.videos, place, { forWp }).map((v) => ({ ...videoView(v), caseHref: !forWp && caseOf(v) && place !== `cases.${caseOf(v)}` ? url('cases', caseOf(v)) : null })) : []
          base.videoLd = base.vids.filter((v) => v.ready).map((v) => ldJson(videoSchema(v, data.site.baseUrl)))
        }
        /* หน้าแรก: ข้อมูลธุรกิจ + FAQ ให้ Google อ่าน (SEO เสื้อโปโล / ยูนิฟอร์ม 21 ต.ค. 2026) */
        if (at === '/') base.homeLd = [businessSchema(data.site), faqSchema(json('home.json').faq.items)].filter(Boolean).map(ldJson)
        /* เครื่องคำนวณ: FAQ ราคาให้ Google อ่าน (audit calc-11) · เว็บจริงใช้ FAQ ที่ตัดข้อรอยืนยันแล้ว */
        /* /designs/ (ตรวจมือถือ 30 ต.ค.): หน้าแบบเสื้อไม่มีราคาเลย · แบบทั้งหมดเป็นเสื้อพิมพ์ลาย → ราคาเริ่ม ขั้นต่ำ วันผลิต ของพิมพ์ลาย */
        if (at === '/designs/') {
          const P = json('prices.json')
          base.dgFacts = { price: priceLine(P, 'print'), moq: `ขั้นต่ำ ${P.minQty} ตัว`, days: `ผลิต ${json('lead-times.json').print.days}` }
        }
        /* 12 พ.ย. /size-chart/: FAQPage จากคำถามในหน้า (XL / 5XL อกเท่าไหร่ ฯลฯ · คำที่คนค้นจริงใน Search Console) */
        if (at === '/size-chart/') base.sizeLd = (() => { const f = (json('guide-pages.json').size.sections || []).find((x) => x.kind === 'faq'); const s = f && faqSchema(f.items); return s && ldJson(s) })()
        if (at === '/calculations/') base.calcLd = (() => { const s = faqSchema(data.faq.calc); return s && ldJson(s) })()
        /* /faq/: FAQPage จากคำถามทุกหมวด (ตัดข้อที่ซ้ำกับ "คำถามสำคัญ" ให้เหลือข้อเดียว) · audit 26 ต.ค. */
        if (at === '/faq/') base.faqLd = (() => {
          const seen = new Set()
          const items = [...(data.faq.home || []), ...(data.faq.full || []).flatMap((c) => c.items)].filter(([q]) => { const k = q.replace(/[?\s]/g, ''); if (seen.has(k)) return false; seen.add(k); return true })
          const s = faqSchema(items)
          return s && ldJson(s)
        })()
        /* /faq/ รื้อ 26 ต.ค.: หมวด + ไอคอน + ลิงก์ LINE รายข้อ (แนบคำถามข้อนั้น) · คำถามยอดฮิต = ชุดหน้าแรก ชี้ไปข้อเดียวกันในหมวด */
        if (at === '/faq/') {
          const ICO = { start: 'icoSpark', design: 'icoPen', spec: 'icoRuler', price: 'icoTag', produce: 'icoClock', after: 'icoTruck', company: 'icoShield' }
          const cats = (data.faq.full || []).map((c) => ({ ...c, ico: ICO[c.id] || 'icoChat', n: c.items.length, qs: c.items.map(([q, a], i) => ({ q, a, id: `${c.id}-${i}`, line: lineMessageUrl(faqAskText(q)) })) }))
          const all = cats.flatMap((c) => c.qs)
          base.fq = { cats, total: all.length, popular: (data.faq.home || []).map(([q]) => all.find((x) => x.q === q)).filter(Boolean) }
        }
        /* /search/: ค้นคำถาม FAQ ได้ด้วย (ลองใช้จริง 30 ต.ค.: "ใบกำกับภาษี" เจอแค่บทความเก่า ไม่เจอข้อ FAQ) · id เดียวกับหน้า /faq/ */
        if (at === '/search/') base.faqSearch = (data.faq.full || []).flatMap((c) => c.items.map(([q, a], i) => ({ q, a, id: `${c.id}-${i}` })))
        const { kind, id } = page
        const ctx = { data, base, at, page, kind, id, rel, sizeCharts, pagePath }
        /* แม่แบบหน้าแบบเสื้อ (v22 /design-[รหัส]/) · ต้นแบบเท่านั้น ตัวอย่างใช้แบบแรกในคลัง */
        if (at.startsWith('/design-preview/')) {
          const code = at.split('/')[2]?.toUpperCase()
          const d = data.designs.find(d => d.code === code)
          if (!d) throw new Error(`Unknown preview design: ${code}`)
          return { ...base, designItem: designDetail(d, { uses: data.uses, contactHref: url('contact') }) }
        }
        if (at === '/design-sample/') return { ...base, designItem: designDetail(data.designs[0], { uses: data.uses, contactHref: url('contact') }) }
        if (kind === 'products') { const r = productsPage(ctx); if (r !== undefined) return r }
        if (kind === 'uses') { const r = usesPage(ctx); if (r !== undefined) return r }
        if (kind === 'cases') { const r = casesPage(ctx); if (r !== undefined) return r }
        if (kind === 'projects') { const r = projectsPage(ctx); if (r !== undefined) return r }
        if (kind === 'galleries') { const r = galleriesPage(ctx); if (r !== undefined) return r }
        if (kind === 'designs') { const r = designsPage(ctx); if (r !== undefined) return r }
        if (kind === 'posts') { const r = postsPage(ctx); if (r !== undefined) return r }
        if (kind === 'articles') { const r = articlesPage(ctx); if (r !== undefined) return r }
        if (kind === 'guides') { const r = guidesPage(ctx); if (r !== undefined) return r }
        return base
}
