/* ข้อมูลเฉพาะหน้าผลงาน (/project/) (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e)
   คืนข้อมูลของหน้า หรือไม่คืน (undefined) = ใช้ข้อมูลกลาง base ต่อ */
/* ข้อมูลของแต่ละหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e) · pageContext(pagePath) คืนข้อมูลที่เทมเพลตของหน้านั้นใช้
   ส่วนที่ทุกหน้าใช้ร่วม (base) อยู่ที่นี่ · ส่วนเฉพาะประเภทหน้าอยู่ใน src/build/pages/<ประเภท>.js */
import { resolve } from 'node:path'
import { existsSync, readdirSync } from 'node:fs'
import { pending } from '../../../src/js/product-view.js'
import { root, forWp, json, lineFly, reviewItems, url } from '../shared.js'

export function projectsPage({ data, base, at, page, kind, id, rel, sizeCharts, pagePath }) {
          const wk = json('works-page.json')
          const has = (key) => { try { url(key); return true } catch { return false } }
          /* ภาพลูกค้าสลับหมวด ไม่ให้หมวดเดียวกองติดกัน */
          const byCat = {}
          for (const c of json('customers.json')) (byCat[c.cat] ||= []).push(c)
          const mixed = []
          for (let i = 0; mixed.length < 24 && Object.values(byCat).some((l) => l[i]); i++) for (const l of Object.values(byCat)) if (l[i] && mixed.length < 24) mixed.push(l[i])
          /* โลโก้ลูกค้า: ใช้ชุดเดียวกับหน้าแรก (อาร์ตอนุมัติ 22 ต.ค. · home.json logos.approved) · สถิติตัดตัวที่ยังรอยืนยันบนเว็บจริง */
          const lg = json('home.json').logos
          const logos = lg.show && lg.approved ? readdirSync(resolve(root, 'public/img/client')).filter((f) => /\.(png|svg|webp)$/.test(f)).sort().map((f) => ({ img: `/img/client/${f}`, alt: json('client-logos.json')[f.replace(/\.\w+$/, '')] || '' })) : []
          const stats = wk.brands.stats.filter((x) => !forWp || !pending(x.n))
          const brands = { ...wk.brands, logos, stats, show: !forWp || logos.length > 0 || stats.length >= 2 }
          /* ภาพลูกค้าสวมเสื้อ แยก 10 กลุ่มลูกค้าตาม v22 (28 ต.ค. อาร์ต "เติมให้ครบ แยกตาม v22") · ลำดับและชื่อเดียวกับเมนู "เสื้อสำหรับทีมคุณ"
             รูปมาจาก works.json + customers.json (photoGroup = กลุ่มของรูป · occ = โอกาสใช้งานตามที่เห็นในรูป · q = คุณภาพ 3 ดีสุด ขึ้นก่อน)
             กลุ่มที่ยังไม่มีรูปไม่แสดง · การ์ดกลุ่มเป็นแท็บ (works-page.js) ไม่มี JS = เรียงทุกกลุ่มต่อกัน */
          /* 11 พ.ย. รูปเล็กต้องมีไฟล์จริง (เดิมเดา -320.jpg เสมอ · รูปจาก download-designs มีแค่ -540.webp → รูปเสียในราง) */
          const smallOf = (img) => ['-320.jpg', '-320.webp', '-540.webp'].map((x) => img.replace(/\.(jpg|webp)$/, x)).find((f) => existsSync(resolve(root, 'public' + f))) || img
          const pool = [...data.works.map((w) => ({ ...w, imgSmall: smallOf(w.img) })), ...json('customers.json')].filter((x) => x.photoGroup)
          const groups = data.uses.map((u) => {
            const items = pool.filter((x) => x.photoGroup === u.id).sort((a, b) => (b.q ?? 2) - (a.q ?? 2)).map((x) => ({ img: x.img, imgSmall: x.imgSmall, occ: x.occ, alt: `${x.occ || 'ทีมลูกค้าใส่เสื้อ'} · ลูกค้ากลุ่ม${u.shortName}ของทีมดี` }))
            /* เหลือไม่เกิน 3 รูป โชว์ทั้งหมดเลย ไม่ทำปุ่ม "ดูอีก 1 ภาพ" */
            /* รอบ 166 (อาร์ต "แสดงลูกค้ามาทุกกลุ่มเลย แถวละกลุ่ม"): ทุกกลุ่มเรียงลงมา กลุ่มละแถว · ชุดแรก 5 รูป + ช่องที่ 6 = การ์ด "ดูอีก N ภาพ" (งบ DOM มือถือ gallery-paging ≤ 200 รูป) · ≤ 6 รูปโชว์หมด */
            const cut = items.length <= 6 ? items.length : 5
            return { cat: u.id, name: u.shortName, icon: { corp: 'use-corp', shop: 'use-fashion', gov: 'use-uniform', edu: 'help-think', class: 'use-team', faculty: 'use-flags', sport: 'use-sport', badminton: 'use-badminton', running: 'use-run', event: 'use-event' }[u.id], n: items.length, href: url('uses', u.id), useName: u.shortName, items, lead: items[0], thumbs: items.slice(1, cut), rest: items.slice(cut), /* 11 พ.ย. การ์ดโปสเตอร์: รูปแรกที่ยังไม่โชว์ในราง · คำบรรยายกลุ่มจากการ์ดกลุ่มหน้าแรก */ poster: `/img/uses-row/${u.id}-960.webp`, posterAt: { corp: '20%' }[u.id] || '50%', /* รอบ 3: ภาพบรรยากาศกลุ่มที่เคยเจน (ป้ายภาพจำลอง) */ sub: json('home.json').uses.cards[u.id]?.sub || '' }
          }).filter((g) => g.n)
          const rv = { groups, total: groups.reduce((s, g) => s + g.n, 0) }
          /* แบนเนอร์ (9 พ.ย. อาร์ตเลือกแบบ ค "กองภาพบนโต๊ะ แบบภาพส่งงาน"): ภาพลูกค้าจริง 5 ใบ คนละกลุ่ม สีสด แนวนอน (คัดจาก customers.json q=3)
             ใบแรก = บนสุดของกอง · ป้ายบนขอบภาพ = ชื่อกลุ่มลูกค้าตามเมนู · ไม่มีในคลัง = build พัง */
          const heroPile = ['lc314', 'lc271', 'lc203', 'lc276', 'lc37'].map((id) => {
            const x = json('customers.json').find((c) => c.img === `/img/customer/${id}.webp`)
            const u = x && data.uses.find((y) => y.id === x.photoGroup)
            if (!u) throw new Error(`heroPile: ไม่มีภาพ ${id} หรือกลุ่มลูกค้า`)
            return { img: x.img, small: x.imgSmall || x.img, tag: u.shortName, alt: `${x.occ || 'ทีมลูกค้าใส่เสื้อ'} · ลูกค้ากลุ่ม${u.shortName}ของทีมดี` }
          })
          /* รีวิว 2 แถวเลื่อน (อาร์ต 27 ต.ค. "เอาแบบสองแถวเลื่อนๆ กดดูหลายรูป") · แถวบนเลขคู่ แถวล่างเลขคี่
             รีวิวที่เป็นเรื่องราวแล้วไม่วิ่งซ้ำในแถว (28 ต.ค. คนเห็นคำพูดเดิมสองรอบ) · allReviews ยังครบ ให้กล่องดูรูปเปิดได้ทุกราย */
          const allR = reviewItems()
          const stories = json('reviews.json').stories.map((s) => ({ ...s, r: allR.find((x) => x.id === s.review) })).filter((s) => s.r)
          const inStory = new Set(stories.map((s) => s.r.id))
          const rowR = allR.filter((r) => !inStory.has(r.id))
          const reviewRows = [rowR.filter((_, i) => i % 2 === 0), rowR.filter((_, i) => i % 2 === 1)]
          /* รอบ 169 (9 พ.ย. อาร์ต "เสียงจากผู้สั่งฯ + เรื่องราวจากทีมลูกค้า เอามารวมกัน ไม่เอาเลื่อนๆ · กว้างพิเศษ")
             169c (อาร์ตแคปกระดานรีวิวหน้าแรก "ชอบแบบนี้อะ ทำให้มันดีกว่าอันนี้"): กระดานเดียวกับหน้าแรก (hm-rvb) รีวิวครบทุกราย
             เรื่องเด่นขึ้นก่อน (มีหัวเรื่อง ข้อเท็จจริง ไอคอน 3D Magnific 9 พ.ย.) ตามด้วยรีวิวอื่น · ไม่มีไอคอนของเรื่อง = build พัง */
          const storyIcon = { 'outing-fabric': 'trip', 'hr-outing': 'stage', 'school-sportsday': 'flag', 'krungthai-badminton': 'badminton' }
          const pjBoard = [...stories.map((st) => {
            if (!storyIcon[st.review]) throw new Error(`pjBoard: เรื่อง ${st.review} ไม่มีไอคอน`)
            return { ...st.r, story: { title: st.title, facts: st.facts, icon: `/img/icons/story-${storyIcon[st.review]}.webp` } }
          }), ...rowR].map((r) => ({ ...r, total: r.gallery?.length || (r.img ? 1 : 0), useName: { corp: 'องค์กร / บริษัท', sport: 'ทีมกีฬา', event: 'อีเวนต์ / งานบุญ', school: 'โรงเรียน' }[r.use] || '', mono: [...(r.who || r.kind)].find((c) => !'เแโใไ'.includes(c)),
            /* รูปวงกลม (การ์ด + แถวรายชื่อ) = พื้นหลัง CSS ไฟล์ -480-160 · ไม่นับงบรูปมือถือ (gallery-paging ≤ 200) · ไม่มีไฟล์ = build พัง */
            thumb: r.imgSmall ? (() => { const t = r.imgSmall.replace(/-480\.webp$/, '-480-160.webp'); if (!existsSync(resolve(root, 'public' + t))) throw new Error(`pjBoard: ไม่มี ${t}`); return t })() : '' }))
          /* รอบ 164 (อาร์ตแคปกล่องปิดเดิม "ต่อเลย"): แบนเนอร์ LINE ชุดเดียวกับ /designs/ (lineCta) · ข้อความในแชท = บรรทัดที่ปุ่มพิมพ์รอไว้ (reviewsCtaLine) */
          const att = data.designs.find((x) => x.code === 'TD-0004') || data.designs[0]
          const projectLine = { h2: data.reviewsCta.title, h: 'แชทผ่าน LINE', live: 'ตอบภายใน 5 นาที', sub: 'เล่างาน จำนวน และวันที่อยากได้รับเสื้อ ทีมดีช่วยเลือกแนวทางให้', cta: 'เริ่มแชทเลย', alt: 'หรือฝากข้อมูลให้ติดต่อกลับ',
            msg: data.reviewsCta.msg.slice(0, 3), design: { img: att.imgSmall || att.img, code: att.code }, fly: lineFly(data.designs) }
          return { ...base, projectLine, allReviews: allR, reviewRows, stories, pjBoard, wk: { ...wk, brands, rv, heroPile, contact: { ...wk.contact, links: wk.contact.links.filter((l) => has(l.to)) } } }
}
