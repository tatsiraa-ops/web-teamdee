/* ข้อมูลเฉพาะหน้าสินค้า (/sublimation/ /embroidery/ /screen-printing/ ฯลฯ) (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e)
   คืนข้อมูลของหน้า หรือไม่คืน (undefined) = ใช้ข้อมูลกลาง base ต่อ */
/* ข้อมูลของแต่ละหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e) · pageContext(pagePath) คืนข้อมูลที่เทมเพลตของหน้านั้นใช้
   ส่วนที่ทุกหน้าใช้ร่วม (base) อยู่ที่นี่ · ส่วนเฉพาะประเภทหน้าอยู่ใน src/build/pages/<ประเภท>.js */
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { faqSchema, productSchema, ldJson } from '../../../src/js/seo-schema.js'
import { videosFor, videoView } from '../../../src/js/video-view.js'
import { productView } from '../../../src/js/product-view.js'
import { lineMessageUrl } from '../../../src/js/use-cta.js'
import { iconFor, FABRIC_ICONS, USE_ICON } from '../../../src/js/fabric-icons.js'
import { poolFor, topUpWall } from '../../../src/js/review-pool.js'
import { fabricRanges, productPrice, heroPrice, priceSummary } from '../../../src/js/prices.js'
import { sp, root, forWp, json, POLO_CORP_PHOTOS, reviewItems, HERO_PHOTO, REVIEW_PRODUCT, srcsetOf, url, mediaLib, downloadAssetsFor } from '../shared.js'
import { ppV2, productPages } from '../content.js'

export function productsPage({ data, base, at, page, kind, id, rel, sizeCharts, pagePath }) {
          const item = data.allProducts.find((x) => x.id === id)
          const tech = data.techniques[item.technique]
          /* ผ้าตามเทคนิค ดึงจากรายการผ้ากลางก่อน แล้วต่อด้วยรายการที่ยังรอยืนยัน ไม่ใช้ผ้าชุดเดียวกันทุกเทคนิค */
          const fabrics = [
            ...tech.fabricNames.map((n) => data.sizing.fabrics.find((f) => f.name === n)).filter(Boolean),
            ...tech.fabrics,
          ]
          /* โปโลปัก: ผ้า 6 ชนิดตามตารางราคา (อาร์ต 2 พ.ย.) · ชื่อและช่วงราคาจาก prices.json · รูปผิวผ้ามีเฉพาะดรายเทค */
          const poloFabrics = () => { const P = json('prices.json'); const pic = { drytech: data.sizing.fabrics.find((f) => f.name === 'ผ้าดรายเทค')?.img }; return fabricRanges(P, 'polo').map((f) => ({ name: f.name, use: `${f.min}–${f.max} บาท/ตัว ตามจำนวน · ${P.products.polo.include.short}`, img: pic[f.id] })) }
          /* ข้อมูลสินค้าเองบอกว่าผ้ายังไม่ยืนยัน (วอร์ม "ผ้าและทรงยังรอยืนยัน" · เบสบอล "[ยืนยันผ้า…]") → product-view.js ซ่อนรายการบนเว็บจริง */
          const fabricsPending = /ผ้า[^·]*รอยืนยัน|\[ยืนยันผ้า/.test(item.spec?.fabricNote || '')
          /* v22: คลังแบบกราฟิกเป็นของงานพิมพ์ลายเท่านั้น · โปโลปักกับสกรีนไม่แสดงแกลเลอรีแบบ */
          /* รูปในการ์ดตัวเลือก/รายละเอียดไม่ซ้ำในกริดแบบ (2 พ.ย.) */
          const cardImgs = new Set([...productPages()[id].options.cards, ...productPages()[id].detail.cards].map((c) => c.img))
          const designsOf = (data.designs.filter((r) => (r.product || []).includes(id))).filter((d) => !cardImgs.has(d.img))
          const productTags = (item.tags || [])
            .map((t) => {
              const of = designsOf.filter((r) => r.garment === t.garment)
              return { ...t, n: of.length, sample: of[0] }
            })
            .filter((t) => t.n > 0)
          const productDesigns = item.tags ? designsOf : designsOf.slice(0, 6)
          const briefLine = (brief, page) => lineMessageUrl(`สวัสดี ทีมดี ${brief}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: \n(จากหน้า ${page})`)
          const productWorks = data.works.filter((w) => w.product === id).slice(0, 3).map((w) => ({ ...w, line: briefLine(`สนใจงานแนวนี้: ${w.alt}`, url('products', id)) }))
          /* หน้าสินค้าตาม Wireframe v22 (22 ต.ค. 2026) · ข้อความจาก product-pages.json + ข้อมูลจริงที่มีอยู่ */
          const has = (key) => { try { url(key); return true } catch { return false } }
          /* รูปลูกค้าองค์กรจริงที่ใส่โปโล (customers.json · ดูด้วยตา 27 ต.ค.) · คำบรรยาย = สิ่งที่เห็น ไม่ระบุชื่อองค์กร ไม่บอกว่าปักหรือพิมพ์ */
          const photos = id !== 'polo' ? [] : POLO_CORP_PHOTOS.map(([c, d], i) => ({ img: `/img/customer/${c}.webp`, d, line: lineMessageUrl(`สนใจทำเสื้อโปโลปัก แบบในรูปลูกค้าองค์กรบนหน้าโปโลปัก (รูปที่ ${i + 1}: ${d})\nจำนวนประมาณ:  ตัว\nใช้วันที่: `) }))
          /* งานปักจริงของลูกค้า (ไฟล์ _drive/td-embroidery · อาร์ตอนุญาต 2 พ.ย.) เป็นภาพ 3D ไม่ใช่รูปถ่าย → ติดป้ายตรงๆ · เลือกงานที่ชื่อระบุว่าปัก และไม่ซ้ำแบบในหน้า */
          const jobs = id !== 'polo' ? [] : ['TD-0133', 'TD-0132', 'TD-0127'].map((code) => ({ code, img: json('designs.json').find((d) => d.code === code).img }))
          const pp = productView(productPages()[id], { works: productWorks, photos, jobs, designs: productDesigns, tags: productTags, fabrics: id === 'polo' ? poloFabrics() : fabrics, fabricsPending, spec: item.spec, sizes: data.sizing.sizes, price: productPrice(json('prices.json'), id, { calcUrl: url('calculations') }) }, { forWp, has })
          pp.options.cards = pp.options.cards.map((c) => ({ ...c, line: briefLine(c.brief, url('products', id)) }))
          return {
            ...base,
            item,
            /* 17 พ.ย. 2026 A5: Product + ช่วงราคา (head.hbs) · พิมพ์ลาย/วอร์ม = ไม่มี */
            offerLd: ((s) => s && ldJson(s))(productSchema(item, json('prices.json'), data.site, at, page?.description)),
            promos: id === 'screen' ? [] : base.promos,
            screenColors: id === 'screen' ? [{name:'ขาว',hex:'#fafafa'},{name:'ดำ',hex:'#202020'},{name:'กรม',hex:'#242c40'},{name:'เบจ',hex:'#c5b598'},{name:'ครีม',hex:'#eee4cc'},{name:'เทา',hex:'#969892'},{name:'ช็อกโกแลต (น้ำตาล)',hex:'#4d3c30'}] : [],
            screenExtras: id === 'screen' ? [{size:'7 × 10',price:25},{size:'10 × 15',price:30},{size:'15 × 20',price:35},{size:'20 × 30',price:45},{size:'30 × 40',price:55}] : [],
            pp,
            /* หน้าสินค้าโฉมใหม่ (อาร์ต 5 พ.ย. · pp-v2.json) · ไม่มีคีย์ = hero เดิม */
            pp2: (() => {
              const v = ppV2()[id]
              if (!v) return null
              /* ทำไมต้องสั่งกับทีมดี (5 พ.ย. ทาง ก): คลิปจริงจาก videos.json ตาม id · เว็บจริงไม่เอาคลิปที่ยังรอ (wait) */
              const vid = (vidId) => { const x = data.videos.find((y) => y.id === vidId); return x && (!forWp || videosFor([x], (x.places || [])[0], { forWp }).length) ? videoView(x) : null }
              const proof = v.proof ? { ...v.proof, clipsV: v.proof.clips.map(vid).filter(Boolean) } : null
    /* รีวิวโฉมใหม่ (5 พ.ย. ใช้ up2Reviews ของ /corporate/) · กำแพงรูปรีวิว img/review + การ์ดตามลำดับใน pp-v2.json */
    const rvAll = reviewItems()
    /* 16 พ.ย. 2026 อาร์ต "ภาพสองรีวิวตรงหน้าปักน้อยๆ": หน้าที่ fill (งานปัก) เติมแถวรูปให้ครบ 10 จากรีวิวบนการ์ดตามลำดับ (topUpWall · กติกาเดียวกับหน้ากลุ่มลูกค้า) */
    const rvIds = v.reviews ? [...v.reviews.items, ...(!v.reviews.fill ? [] : poolFor({ polo: 'corp', print: 'sport', screen: 'event', warmup: 'edu', baseball: 'sport', jersey: 'sport' }[id] || 'corp', json('reviews.json').items).map((r) => r.id).filter((rid) => !v.reviews.items.includes(rid)))] : []
    const rvWall = v.reviews ? (v.reviews.fill ? topUpWall(v.reviews.wall, rvIds.map((rid) => rvAll.find((x) => x.id === rid)).filter(Boolean), mediaLib().items) : v.reviews.wall) : []
    const reviews = v.reviews ? { ...v.reviews,
      wall: rvWall.map((w) => { const r = rvAll.find((x) => x.id === w.review); return { ...w, img: `/img/review/${w.img}.webp`, small: `/img/review/${w.img}-480.webp`, sw: 480, r: (w.w / w.h).toFixed(3), who: r.who || r.kind, alt: `งานจริงจากรีวิว ${r.who || r.kind}` } }),
      /* 16 พ.ย. 2026 คลังรีวิวเดียว (อาร์ต "แก้ตรงภาพแรกด้วย" = หน้างานปัก): reviews.fill → รีวิวที่เลือกไว้ก่อน แล้วรีวิวที่เหลือทุกราย เรียงตามกลุ่มใกล้ (review-pool.js) · ไม่ fill = เฉพาะที่เลือก (หน้าพิมพ์ลาย) */
      rowLabel: v.reviews.fill ? 'รีวิวจากแชทลูกค้าจริง' : v.reviews.label || 'รีวิวจากลูกค้าเสื้อพิมพ์ลาย',
      items: rvIds.map((rid) => { const r = rvAll.find((x) => x.id === rid); if (!r) throw new Error(`pp-v2.json reviews: ไม่มีรีวิว ${rid}`); return { ...r, mono: [...(r.who || r.kind)].find((c) => !'เแโใไ'.includes(c)) } }) } : null
              /* เนื้อผ้า (6 พ.ย.): "เหมาะกับ" ดึงจาก sizing.json ที่เดียว (ข้อมูลเดียวกับส่วนผ้าเดิม) · ไม่มีชื่อผ้าในคลัง = build พัง */
              const fabric = v.fabric ? { ...v.fabric, sampleAsk: lineMessageUrl(`ขอตัวอย่างผ้า${sp(item.name)}\nผ้าที่สนใจ: \nจำนวนที่จะสั่งประมาณ:  ตัว`), guide: url('guides.fabric'), items: v.fabric.items.map((f) => { const s = f.use ? { use: f.use } : data.sizing.fabrics.find((x) => x.name === (f.sz || f.t)); if (!s) throw new Error(`pp-v2.json fabric: ไม่มี ${f.sz || f.t} ใน sizing.json`); const pf = json('prices.json').products.print.fabrics?.find((x) => x.id === f.k); if (!pf) throw new Error(`pp-v2.json fabric: ไม่มี ${f.k} ใน prices.json print.fabrics`); return { ...f, use: s.use, gsm: pf.gsm, tagsI: f.tags.map((t) => ({ t, icon: iconFor(t) })), ask: lineMessageUrl(`ขอตัวอย่าง${f.t}\nใช้ทำเสื้ออะไร: \nจำนวนที่จะสั่งประมาณ:  ตัว`) } }), icons: Object.entries(FABRIC_ICONS).map(([id, d]) => ({ id, d })) } : null
              /* รอบ 143: "เหมาะกับ" เป็นไอคอน 3D (use-*.webp · Magnific 6 พ.ย.) · คำจาก sizing.json ตัด "เสื้อ"/"ทั่วไป" ให้สั้น · คำที่ไม่มีไอคอน = build พัง */
              if (fabric) {
                const useIcon = { 'กิจกรรม': 'event', 'ทีม': 'team', 'องค์กร': 'corp', 'วิ่ง': 'run', 'แบดมินตัน': 'badminton', 'กีฬา': 'sport', 'ออกกำลังกาย': 'sport', 'ยูนิฟอร์ม': 'uniform', 'ทำงาน': 'work', 'ช่าง': 'craft', 'แฟชั่น': 'fashion', 'หน่วยงาน': 'corp' }
                fabric.items = fabric.items.map((f) => ({ ...f, uses: f.use.split(/\s+/).map((w) => { const t = w.replace(/^(เสื้อ|ชุด)/, '').replace(/ทั่วไป$/, ''); if (!useIcon[t]) throw new Error(`pp-v2.json fabric: ไม่มีไอคอนสำหรับ "${w}"`); return { t, icon: `/img/icons/use-${useIcon[t]}.webp`, line: USE_ICON[t] } }) }))
                /* รอบ 189 อาร์ต "แยกระหว่างใหม่กับเก่าเป็นสองแถว" · ช่วงแกรมคำนวณจากข้อมูล (prices.json) ไม่พิมพ์เอง */
                const gsmT = (xs) => { const g = xs.map((x) => x.gsm); const lo = Math.min(...g), hi = Math.max(...g); return lo === hi ? `${lo} แกรม` : `${lo}–${hi} แกรม` }
                const std = fabric.items.filter((f) => !f.new), fresh = fabric.items.filter((f) => f.new)
                fabric.groups = [{ id: 'std', h: `ผ้ามาตรฐาน ${std.length} ชนิด`, meta: `${gsmT(std)} · มีเสื้อจริงจากงานลูกค้า`, items: std }, { id: 'new', h: `ผ้าใหม่ ${fresh.length} ชนิด`, meta: gsmT(fresh), items: fresh }].filter((g) => g.items.length)
              }
              /* 11 พ.ย. หน้างานปัก: ข้อมูลโปโลจากไดรฟ์ "Info ปัก" ที่เดียว (src/data/polo.json · tests/polo-data.test.js) · ราคาจาก prices.json products.polo */
              const P = json('polo.json')
              const poloPr = json('prices.json').products.polo
              const bandLabel = (b) => b.max ? `${b.min.toLocaleString('en-US')}–${b.max.toLocaleString('en-US')}` : `${b.min.toLocaleString('en-US')} ขึ้นไป`
              /* 12 พ.ย. รอบ 213/216: บอร์ดราคาทุกผ้า × ทุกช่วงจำนวน (pp2PoloFabric.hbs) · ลำดับคอลัมน์ = prices.json cols = polo.json fabrics (เทส) */
              const poloMatrix = v.poloFabric ? { rows: poloPr.bands.map((b) => ({ label: bandLabel(b), /* sh = ป้ายย่อหัวคอลัมน์บนมือถือ "10+" (ตารางราคาเห็นครบทุกช่วง · 13 พ.ย.) */ sh: `${bandLabel(b).split(/[–\s]/)[0]}+`, cells: poloPr.cols.map((c) => ({ id: c.id, price: b.price[c.id] })) })) } : null
              const poloUseIcons = {
                'เสื้อกิจกรรม': 'use-flags', 'เสื้อกิจกรรม / อีเวนต์': 'use-flags', 'กีฬาสี': 'use-sport', 'งานอีเวนต์': 'use-event', 'ยูนิฟอร์มจำนวนมาก': 'use-uniform',
                'เสื้อบริษัท': 'use-corp', 'ยูนิฟอร์มออฟฟิศ': 'use-uniform', 'งานที่ต้องการทรงชัด': 'use-fashion',
                'ฝ่ายต้อนรับ': 'use-team', 'บัญชี': 'use-work', 'การเงิน': 'use-work', 'บัญชี / การเงิน': 'use-work', 'หน่วยงานที่เน้นลุคภูมิฐาน': 'use-corp',
                'งานกลางแจ้ง/กิจกรรม': 'use-flags', 'งานออนไซต์ที่ขยับตัวบ่อย': 'use-craft',
                'ยูนิฟอร์มผู้บริหาร': 'use-work', 'เสื้อองค์กรบริษัทใหญ่': 'use-corp', 'เน้นภาพลักษณ์': 'use-fashion',
                'ทีมภาคสนาม': 'use-craft', 'เสื้อองค์กร': 'use-corp', 'งานกลางแจ้งที่ใช้งานหนัก': 'use-craft',
              }
              const poloUseGroups = {
                juti: ['เสื้อกิจกรรม / อีเวนต์', 'กีฬาสี', 'ยูนิฟอร์มจำนวนมาก'],
                tricot: ['ยูนิฟอร์มออฟฟิศ', 'ฝ่ายต้อนรับ', 'บัญชี / การเงิน'],
              }
              const poloFabric = v.poloFabric ? { ...v.poloFabric, matrix: poloMatrix, minQty: P.minQty, fabrics: P.fabrics.map((f) => {
                if (!poloPr.cols.some((c) => c.id === f.id)) throw new Error(`polo.json: ผ้า ${f.id} ไม่มีใน prices.json products.polo`)
                const prices = poloPr.bands.map((b) => ({ label: bandLabel(b), price: b.price[f.id] }))
                if (prices.some((x) => typeof x.price !== 'number')) throw new Error(`prices.json polo: ราคา ${f.id} ไม่ครบ`)
                return { ...f, img: `/img/emb-fabric/${f.id}`, useTags: (poloUseGroups[f.id] || f.use.split(/\s+/).filter(Boolean)).map(label => ({ label, icon: `/img/icons/${poloUseIcons[label] || 'use-team'}.webp` })), hero: existsSync(resolve(root, `public/img/emb-fabric/${f.id}-1120.webp`)) ? `/img/emb-fabric/${f.id}-1120.webp` : `/img/emb-fabric/${f.id}-560.webp`, prices, from: Math.min(...prices.map((x) => x.price)), main: f.colors.filter((c) => !c.base), base: f.colors.filter((c) => c.base),
                  ask: lineMessageUrl(`ขอตัวอย่าง${f.name}\nสีที่สนใจ: \nจำนวนที่จะสั่งประมาณ:  ตัว`) }
              }) } : null
              const poloSpecVisuals = {
                logo: { art: '/img/icons/dz-logo.webp' },
                collar: { art: '/img/emb-guide/col-1.webp', detail: true },
                sleeve: { art: '/img/emb-guide/slv-1.webp', detail: true },
                shoulder: { measure: '0.5' },
                button: { art: '/img/icons/dz-option.webp' },
                slit: { measure: '2' },
              }
              const poloSpec = v.poloSpec ? { ...v.poloSpec, spec: P.spec.map(item => ({ ...item, ...poloSpecVisuals[item.k] })), minQty: P.minQty,
                /* 12 พ.ย. รอบ 213: ปุ่มเดียวท้ายส่วน · ข้อความตั้งต้นมีช่องให้กรอกแบบที่เลือกครบ 5 กลุ่ม */
                ask: lineMessageUrl(`สนใจเสื้อโปโลปัก\nปก: \nสาบ: \nปลายแขน: \nกระเป๋า: \nตัดต่อ: \nจำนวนประมาณ:  ตัว`),
                /* 12 พ.ย. คู่มือสั่งเสื้อโปโลปัก TEAMDEE (polo.json guide): ตำแหน่งปัก + รายละเอียดเสื้อ 5 กลุ่ม · ภาพครอปจากคู่มือ public/img/emb-guide */
                guide: P.guide ? (() => {
                  const g = P.guide, dim = (img) => img.startsWith('pkt-') ? [270, 235] : img === 'pos-6' ? [670, 364] /* 13 พ.ย. ภาพงานปักจริงแทนแพตช์ที่มีเบอร์โทรลูกค้า */ : img.startsWith('pos-') ? [334, 207] : [335, 300]
                  const pic = (x) => { const src = `/img/emb-guide/${x.img}.webp`; if (!existsSync(resolve(root, 'public' + src))) throw new Error(`polo.json guide: ไม่มีภาพ ${src}`); const [w, h] = dim(x.img); return { ...x, src, w, h } }
                  return { ...g, positions: g.positions.map((position) => ({ ...pic(position), size: position.s.startsWith('กว้างไม่เกิน ') ? position.s.replace('กว้างไม่เกิน ', '') : null, special: position.img === 'pos-6' })), specialAsk: lineMessageUrl('สนใจงานปักพิเศษ\nแบบหรือโลโก้: \nตำแหน่งและขนาดที่ต้องการ: \nจำนวนเสื้อ:  ตัว'), groups: g.groups.map((grp) => ({ ...grp, items: grp.items.map(pic) })),
                    /* 16 พ.ย. 2026 ผังเสื้อ TEAMDEE หน้า-หลัง + เส้นชี้ (partial shirtCallouts · อาร์ต "เอาเป็นตัวเสื้อหน้าหลัง แบบมีเส้นชี้ไปแต่ละจุด")
                       x/y = % ของภาพ shirt-fb (หน้าซ้าย · หลังขวา) · ป้ายซ้ายชี้เสื้อด้านหน้า ป้ายขวาชี้ด้านหลัง (เส้นไม่ข้ามตัวเสื้ออีกตัว)
                       รอบ 3 (อาร์ต "เอารูปใหญ่ๆ"): ภาพตัดพื้นโปร่งใส + ครอปชิดตัวเสื้อ (2286×1362 จากต้นฉบับ 2528×1696) · พิกัดคำนวณใหม่จากจุดเดิม */
                    shirt: (() => {
                      const POS = [[32.2, 30.2, 'l'], [16.7, 30.2, 'l'], [5.6, 41.3, 'l'], [76.4, 9.8, 'r'], [76.4, 35.7, 'r']]
                      const PART = { col: [18.4, 14.4, 'l'], plk: [24.2, 24.6, 'l'], pkt: [32.2, 30.2, 'l'], slv: [97.4, 42.3, 'r'], cut: [88.6, 70.9, 'r'] }
                      const regular = g.positions.filter((x) => x.img !== 'pos-6')
                      if (regular.length !== POS.length) throw new Error('polo.json guide: ตำแหน่งปักไม่ตรงผังเสื้อ (5 จุด)')
                      return {
                        img: '/img/emb-guide/shirt-fb',
                        pos: regular.map((x, i) => ({ n: `0${i + 1}`, t: x.t, s: x.s, x: POS[i][0], y: POS[i][1], side: POS[i][2], thumb: `/img/emb-guide/${x.img}.webp`, thumbAlt: x.alt || `งานปักตำแหน่ง${x.t}` })),
                        parts: g.groups.map((grp, i) => { const c = PART[grp.k]; if (!c) throw new Error(`polo.json guide: กลุ่ม ${grp.k} ไม่มีจุดบนผังเสื้อ`); return { n: `0${i + 1}`, t: grp.t, s: `${grp.items.length} แบบ`, x: c[0], y: c[1], side: c[2], href: `#grp-${grp.k}` } }),
                      }
                    })() }
                })() : null } : null
              const vSizes = v.sizes && v.sizes.from === 'polo.json' ? { ...v.sizes, adult: P.sizes.men, kids: P.sizes.women, tol: P.sizes.tol, measure: P.sizes.measure, noteA: P.sizes.menNote, noteB: P.sizes.womenNote } : v.sizes
              /* ตารางไซซ์ (6 พ.ย.): ทรงที่ยังไม่มีตาราง → ปุ่ม LINE ขอตารางของทรงนั้น (ข้อความตั้งต้นมีแค่ชื่อทรง) */
              /* 13 พ.ย. ส่วนไซซ์ v2 (หน้าปัก): ภาพเสื้อแยกทรง + ค่าตั้งต้นของแต่ละทรง (M) · padB = ช่องว่างให้ตารางกลุ่มที่สองคอลัมน์ตรงกับกลุ่มแรก */
              const szDef = (rows) => rows.find((r) => r[0] === 'M') || rows[0]
              const sizes = vSizes ? { labA: 'ผู้ใหญ่', labB: 'เด็ก', ...vSizes, figs: (vSizes.figs || []).map((g) => ({ ...g, def: szDef(g.g === 'kids' ? vSizes.kids : vSizes.adult) })), padB: vSizes.v2 ? Array.from({ length: Math.max(0, vSizes.adult.length - vSizes.kids.length) }, () => 1) : [], def: vSizes.adult.find((r) => r[0] === 'M'), others: (vSizes.others || []).map((o) => ({ ...o, ask: lineMessageUrl(`ขอตารางไซซ์${o.name}\nจำนวนประมาณ:  ตัว`) })) } : null
              /* เสื้อจริงใส่หุ่น (6 พ.ย.): คำบรรยายจาก home-work-showcase · แบบ 3D ก่อนผลิตจาก download-designs proofs · รหัสจาก designs.json (ไม่มีในคลัง = ไม่ใส่รหัส) */
              const real = v.real ? (() => {
                const man = json('home-work-showcase.json').mannequin, proofs = json('download-designs.json').proofs
                const base = (s) => s.split('/').pop().replace(/(-540)?\.webp$/, '')
                const items = v.real.order.map((k) => {
                  const m = man.find((x) => base(x.img) === k) || (v.real.extra?.[k] && { img: `/img/real-even/${k}.webp`, ...v.real.extra[k] }); if (!m) throw new Error(`pp-v2.json real: ไม่มี ${k} ใน home-work-showcase / real.extra`)
                  const pr = proofs.find((x) => base(x.real.img) === k)
                  const d = pr && data.designs.find((x) => base(x.img) === base(pr.design.img))
                  /* 6 พ.ย.: ใช้ภาพครอปให้เสื้อเท่ากัน (public/img/real-even) · ไม่มีไฟล์ = build พัง · ไม่โชว์แบบ 3D แล้ว (รหัสยังส่งเข้า lightbox) */
                  const even = `/img/real-even/${k}`; if (!existsSync(resolve(root, `public${even}-540.webp`))) throw new Error(`pp-v2.json real: ไม่มีภาพครอป ${even}`)
                  return { img: `${even}.webp`, small: `${even}-540.webp`, caption: m.caption, alt: m.alt, code: d ? d.code : null }
                })
                /* 196f ปุ่มไปต่อ: รูปจริงวงกลม 3 วง · แบบเสื้อ = ภาพตัวหน้าแบบจริงของสินค้านี้ + จำนวนแบบ (นับแบบเดียวกับหน้า /designs/) · งานจริง = เสื้อจริงบนหุ่น 3 ตัวแรก */
                const mine = data.designs.filter((x) => (x.product || []).includes(id))
                const fronts = mine.map((x) => `/img/design-front/${x.img.split('/').pop().replace(/\.\w+$/, '')}-720.webp`).filter((f) => existsSync(resolve(root, 'public' + f))).slice(0, 3)
                const links = (v.real.links || []).map((l) => l.href.startsWith('/designs/') ? { ...l, faces: fronts, sub: `${mine.length} แบบ ปรับสี โลโก้ และชื่อทีมได้` } : l.href.startsWith('/project/') ? { ...l, faces: items.slice(0, 3).map((x) => x.small), sub: 'เสื้อที่ทีมดีผลิตให้ลูกค้า' } : l)
                for (const l of links) if (!l.faces || l.faces.length !== 3) throw new Error(`pp-v2.json real.links: ไม่มีรูป 3 วงสำหรับ ${l.href}`)
                return { ...v.real, items, links }
              })() : null
              /* ขั้นตอนแบบ B (ชั่วคราว): เส้นทางระหว่างขั้น 1→2 … 4→5 · ตั๋วชำระเงินตาม pay.at */
              const steps = v.steps ? { ...v.steps, links: v.steps.items.slice(0, -1).map((_, i) => { const at = `${i + 1}-${i + 2}`; return { at, flip: i % 2 === 1, pay: v.steps.items.map((s) => s.pay).find((p) => p && p.at === at) || null } }) } : null
              /* คอเสื้อ (รอบ 145): การ์ดถามทรงคอ → LINE ข้อความตั้งต้น */
              /* คอเสื้อ: การ์ดถามทรงคอ → LINE · 196e อาร์ต "ไม่ต้องแสดงราคา" → จัดตามตระกูลคอ (fams) ไม่มีกลุ่มตามราคา */
              const collars = v.collars ? { ...v.collars, total: v.collars.fams.reduce((n, f) => n + f.items.length, 0), ask: lineMessageUrl(`ขอปรึกษาทรงคอ${sp(item.name)}\nทรงที่สนใจ: \nจำนวนประมาณ:  ตัว`) } : null
              /* 196c ทรง → คอที่ทำได้ (cols: all · รายการคีย์ · null = ยังไม่ระบุ) · คีย์คอผิด = build พัง · 196e ไม่แสดงราคา */
              const types = v.types && v.collars ? (() => {
                const names = new Set(v.collars.fams.flatMap((f) => f.items).map((c) => c.k))
                return { ...v.types, types: v.types.types.map((t) => {
                  const list = Array.isArray(t.cols) ? t.cols : null
                  for (const k of list || []) if (!names.has(k)) throw new Error(`pp-v2.json types ${t.k}: ไม่มีคอ ${k}`)
                  return { ...t, cols: t.cols === 'all' ? 'all' : (list || []).join(' '), go: !t.href.startsWith('#') }
                }) }
              })() : v.types
              /* 11 พ.ย. คลังรีวิว (อาร์ต "เพิ่มคลังรีวิว"): รูปลูกค้าคละทุกกลุ่มจากคลังกลาง ไม่ซ้ำรูปที่ส่วนอื่นของหน้านี้ใช้ · น้อยกว่า 24 = build พัง */
              const reviewWall = v.reviewWall ? (() => {
                const usedHere = JSON.stringify({ v, proof, reviews, real, steps })
                /* 13 พ.ย. ตรวจหน้าปัก: reviewWall.first = กลุ่มที่ขึ้นก่อน (หน้าปัก = corp ตรงกับคนสั่งโปโล) แล้วตามด้วยรูปคละกลุ่มเดิม ไม่ซ้ำ */
                const lead = v.reviewWall.first ? (data.reviewWall.groups[v.reviewWall.first] || []) : []
                if (v.reviewWall.first && lead.length < 12) throw new Error(`pp-v2.json reviewWall.first: กลุ่ม ${v.reviewWall.first} รูปไม่พอ (${lead.length})`)
                const seen = new Set()
                const items = [...lead, ...data.reviewWall.items].filter((x) => !usedHere.includes(x.img.replace(/\.webp$/, '')) && !seen.has(x.img) && seen.add(x.img)).slice(0, 60)
                if (items.length < 24) throw new Error(`pp-v2.json reviewWall: รูปไม่พอ (${items.length})`)
                return { ...v.reviewWall, items }
              })() : null
              if (!v.designs) return { ...v, proof, reviews, fabric, sizes, real, steps, collars, types, reviewWall, poloFabric, poloSpec }
              /* แบบเสื้อ 3D (5 พ.ย.): แถวตามทรงจาก productDesigns (มีรหัส + meta ให้ lightbox) · แถวละ ≤ 8 · ไม่ซ้ำ */
              const used = new Set()
              /* 11 พ.ย. หน้างานปัก: แถวภาพตรง (r.items · ภาพ 3D งานลูกค้าจริงจากไดรฟ์ "Info ปัก") · ไม่มีลิงก์ดูทั้งหมด · ภาพไม่มีไฟล์ = build พัง */
              const direct = (r) => ({ ...r, total: r.items.length, all: null, items: r.items.map((x) => { for (const w of [480, 760, 1200]) if (!existsSync(resolve(root, `public${x.pic}-${w}.webp`))) throw new Error(`pp-v2.json designs: ไม่มีภาพ ${x.pic}-${w}.webp`); return { ...x, img: `${x.pic}-1200.webp`, code: '', meta: x.caption } }) })
              const rows = v.designs.rows.map((r) => r.items ? direct(r) : ({ ...r, total: data.designs.filter((d) => (d.product || []).includes(id) && r.garments.includes(d.garment)).length, /* นับจากคลังเต็มแบบเดียวกับหน้า /designs/ (ตัวเลขต้องตรงกับที่หน้าแบบเสื้อแสดง) */ all: `${url('designs')}?product=${id}${r.garments.length === 1 ? `&garment=${r.garments[0]}` : ''}`, items: designsOf.filter( /* 12 พ.ย. ใช้คลังเต็มของสินค้า (productDesigns ตัดเหลือ 6 แบบแรกเมื่อสินค้าไม่มีแท็ก → หน้าปักได้แค่ 6 ใบ ปนใบแบบหน้า+หลัง) */(d) => r.garments.includes(d.garment) && !used.has(d.code) && !(v.designs.skip || []).includes(d.code)).map((d) => { const f = `/img/design-front/${d.img.split('/').pop().replace(/\.\w+$/, '')}-720.webp`; return { ...d, front: existsSync(resolve(root, 'public' + f)) ? f : null } }).sort((a, b) => (b.front ? 1 : 0) - (a.front ? 1 : 0)) /* 11 พ.ย. แบบที่มีภาพตัวหน้าขึ้นก่อน (หน้าปัก: ใบแบบเต็มหน้า+หลังไม่เข้าชุดการ์ดจัตุรัส) */.slice(0, 8).map((d) => { used.add(d.code); return d }) })).filter((r) => r.items.length >= 3) /* 6 พ.ย. "เอาแค่ด้านหน้าเสื้อ": ภาพคู่ใช้ไฟล์ตัดตัวหน้า (scripts/design-fronts.py) */
              return { ...v, proof, reviews, fabric, sizes, real, steps, collars, types, reviewWall, poloFabric, poloSpec, designs: { ...v.designs, rows } }
            })(),
            downloadAssets: downloadAssetsFor('product', id, data.designs),
            priceStrip: priceSummary(json('prices.json'), id),
            pageReviews: REVIEW_PRODUCT[id].map((rid) => reviewItems().find((r) => r.id === rid)),
            /* ภาพขั้นตอนผลิต: ยังไม่มี · รูปเครื่องพิมพ์ / เครื่องปัก / เครื่อง DFT เดิมพิสูจน์ที่มาไม่ได้ และทำให้ดูเหมือนทีมดีมีโรงงานเอง
               (อาร์ตเคาะ 24 ต.ค. ให้เอาออกทุกที่ · tests/clean-rules.test.js) · ได้ภาพในโรงงานพาร์ตเนอร์ที่ได้รับอนุญาตแล้วค่อยใส่ พร้อมคำบรรยายว่าเป็นพาร์ตเนอร์ */
            productionPhoto: null,
            /* ปุ่ม LINE ใน hero / กล่องราคา / ส่วนปิด พร้อมชื่อสินค้า (audit P5) */
            priceAsk: lineMessageUrl(`สวัสดี ทีมดี ขอราคา${sp(item.name)}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: `),
            /* กล่องชวนขอราคา: LINE พิมพ์แม่แบบ 3 ข้อที่ต้องส่งไว้ให้กรอก (audit P5) · ไม่มีชื่อหรือเบอร์ลูกค้าใน URL */
            quoteLine: lineMessageUrl([`ขอราคา${sp(item.name)}`, ...(pp.quote.send || []).map((x) => `- ${x}: `)].join('\n')),
            /* สารบัญเรียงตามส่วนในหน้า = hero.toc ของ v22 (อาร์ตเคาะ 2 พ.ย.) · หน้าสกรีนใช้ส่วนของตัวเอง (screenShowcase) จึงไม่กรองตาม productView
               กล่องกลางหน้า + ส่วนปิด = แชท (ctaBox) · ขั้นต่อไปท้ายส่วน = LINE พิมพ์ข้อความตามเรื่องนั้น */
            ppToc: id === 'screen' ? productPages().screen.toc : pp.toc,
            ppQuoteCta: {
              title: pp.quote.h,
              lead: pp.quote.p,
              send: { label: 'ส่ง 3 อย่างนี้ ทีมดีแจ้งราคาได้', items: pp.quote.send || [] },
              msg: [{ t: `ขอราคา${sp(item.name)}` }, ...(pp.quote.send || []).map((x) => ({ t: x, q: true }))],
              attach: [{ file: 'logo-team.ai', kind: 'ไฟล์โลโก้' }, ...(item.img && item.imgKind === 'real' ? [{ img: item.img }] : [])],
              note: 'ข้อความนี้พิมพ์รอไว้ในแชท · แนบโลโก้เป็นไฟล์หรือรูปถ่ายก็ได้',
            },
            ppEndCta: {
              title: pp.contact.h,
              lead: pp.contact.p,
              send: { label: 'บอกทีมดี 3 อย่าง', items: ['ใช้เสื้อกับงานอะไร', 'จำนวนประมาณกี่ตัว', 'อยากได้รับเสื้อวันไหน'] },
              msg: [{ t: `สวัสดี ทีมดี สนใจ${sp(item.name)}` }, { t: 'ใช้กับงาน', q: true }, { t: 'จำนวนประมาณ', q: true, unit: 'ตัว' }, { t: 'อยากได้รับวันที่', q: true }],
              attach: [{ file: 'logo-team.ai', kind: 'ไฟล์โลโก้' }],
              note: 'ข้อความนี้พิมพ์รอไว้ในแชท · ยังไม่มีแบบก็เริ่มคุยได้',
            },
            ppEndLine: lineMessageUrl(`สวัสดี ทีมดี สนใจ${sp(item.name)}\nใช้กับงาน: \nจำนวนประมาณ:  ตัว\nอยากได้รับวันที่: `),
            /* โปโลปัก: ยังไม่มีรูปงานจริงที่ยืนยันว่าปัก → รูปหลักใช้รูปลูกค้าองค์กรจริงแทนภาพจำลอง · บรรยายแค่สิ่งที่เห็น */
            heroPhoto: { polo: { img: '/img/customer/co13.webp', alt: 'ทีมลูกค้าองค์กรใส่เสื้อโปโลสีน้ำเงิน ถ่ายรวมกลุ่มในอาคาร', tag: 'ภาพลูกค้าองค์กรจริงของทีมดี' }, ...HERO_PHOTO }[id] || null,
            ppNextLine: {
              fabric: lineMessageUrl(`ขอตัวอย่างผ้า${sp(item.name)}\nผ้าที่สนใจ: \nจำนวนที่จะสั่งประมาณ:  ตัว`),
              logo: lineMessageUrl(`ส่งโลโก้ให้ทีมดีช่วยดู (${item.name})\nจุดที่อยากวางโลโก้: \nขนาดโดยประมาณ: `),
              ask: lineMessageUrl(`สอบถามเรื่อง${sp(item.name)}: `),
              queue: lineMessageUrl(`สวัสดี ทีมดี ขอเช็กคิวตามวันใช้เสื้อ\nประเภทเสื้อ: ${sp(item.name)}\nจำนวน:  ตัว\nต้องใช้วันที่: \nแบบที่มี: `),
            },
            /* จอแรกมือถือ (audit P2): ราคาแถวเดียวพร้อมจำนวน · วอร์มยังไม่มีราคา (ปุ่ม LINE ขอราคาอยู่ข้างล่างแล้ว) ไม่โชว์แถวนี้ */
            heroPrice: (() => { const P = json('prices.json'); const h = heroPrice(P, id); return h && (h.sub || P.products[id]?.byDesign) ? h : null })(),
            heroSrcset: srcsetOf(item.img, 540, 540, 1080),
            tech: { ...tech, fabrics },
            parentItem: item.parent ? data.allProducts.find((x) => x.id === item.parent) : null,
            childProducts: data.products.filter((x) => x.parent === id),
            /* แท็กในหน้า (เสื้อวิ่ง / ฟุตบอล) ต้องมีแบบให้กรองได้จริง ไม่งั้นไม่โชว์ */
            productTags,
            productLd: (() => { const s = faqSchema(pp.faq.items); return s && ldJson(s) })(),
            productDesigns,
            relatedProducts: data.products.filter((x) => x.id !== id && x.id !== item.parent && x.parent !== id),
            relatedUses: data.uses.filter((u) => (u.recommend || []).some((r) => r.id === id)),
            productWorks,
            /* คู่มือตามเทคนิค (v4: เสื้อวอร์มใช้คู่มือพิมพ์ลายร่วม) */
            guideId: data.allGuides.some((g) => g.id === id) ? id : ({ sublimation: 'print', embroidery: 'polo', screen: 'screen' })[item.technique] || 'print',
          }
}
