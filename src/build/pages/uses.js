/* ข้อมูลเฉพาะหน้ากลุ่มลูกค้า 10 หน้า (/corporate/ /event/ ฯลฯ) (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e)
   คืนข้อมูลของหน้า หรือไม่คืน (undefined) = ใช้ข้อมูลกลาง base ต่อ */
/* ข้อมูลของแต่ละหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e) · pageContext(pagePath) คืนข้อมูลที่เทมเพลตของหน้านั้นใช้
   ส่วนที่ทุกหน้าใช้ร่วม (base) อยู่ที่นี่ · ส่วนเฉพาะประเภทหน้าอยู่ใน src/build/pages/<ประเภท>.js */
import { resolve } from 'node:path'
import { existsSync, readdirSync } from 'node:fs'
import { faqSchema, ldJson } from '../../../src/js/seo-schema.js'
import { useView, fullRows, h1Split } from '../../../src/js/use-view.js'
import { useCta, lineMessageUrl } from '../../../src/js/use-cta.js'
import { planReviews, topUpWall, PICK as REVIEW_PICK_POOL } from '../../../src/js/review-pool.js'
import { gallerySelection } from '../../../src/js/gallery-selection.js'
import { galleryFor } from '../../../src/js/media-library.js'
import { priceLine, useQuote } from '../../../src/js/prices.js'
import { sp, root, forWp, json, reviewItems, pickReviews, REVIEW_USE, srcsetOf, url, designsFor, mediaLib, downloadAssetsFor } from '../shared.js'
import { usePages, useV2 } from '../content.js'

export function usesPage({ data, base, at, page, kind, id, rel, sizeCharts, pagePath }) {
          const item = data.uses.find((x) => x.id === id)
          /* หน้ากลุ่มลูกค้าตาม Wireframe v22 (22 ต.ค. 2026) · ของจริงเลือกให้ตรงกลุ่มเท่านั้น ไม่ยืมรูปกลุ่มอื่นมาแทน
             แบบเสื้อ: แท็กการใช้งาน (use) หรือทรง (garment) · ผลงาน: works.use เติมด้วยภาพกลุ่มนี้ · ภาพลูกค้า: customers.photoGroup */
          /* บริษัท หน่วยงาน ร้านค้า: แบบโปโลขึ้นก่อน (agent ลูกค้า 22 ต.ค.: หน้าบริษัทเปิดมาเจอเสื้อฟุตบอล) */
          const POLO_FIRST = new Set(['corp', 'gov', 'shop'])
          const coded = designsFor(data.designs, id)
          const useDesigns = POLO_FIRST.has(id) ? [...coded.filter((d) => d.garment === 'polo'), ...coded.filter((d) => d.garment !== 'polo')] : coded
          /* แบบจากแกลเลอรีเดิมบนเว็บจริง (live-gallery.json) เติมให้ครบ 6 · ลิงก์ดูทั้งหมดไปหน้าแกลเลอรีของกลุ่ม */
          const live = (json('live-gallery.json').groups[id]?.items || []).map((x, i) => ({ img: x.img, imgSmall: srcsetOf(x.img, 540, 540, 1080), square: true, alt: `แบบ${item.name}ที่ทีมดีออกแบบ ${i + 1} ด้านหน้าและด้านหลัง` }))
          /* งานที่ตรงหน้าย่อยกว่า (alsoUse เช่น แบดมินตัน วิ่ง คณะ) ขึ้นก่อนงานของกลุ่มหลัก */
          const useWorks = [...data.works.filter((w) => (w.alsoUse || []).includes(id)), ...data.works.filter((w) => w.use === id)].slice(0, 3)
          const cs = json('customers.json')
          const has = (key) => { try { url(key); return true } catch { return false } }
          /* ภาพจริงของการ์ดบริบทงาน (ตามลำดับการ์ดใน use-pages.json · null = ยังไม่มีภาพ) · เลือกจากภาพลูกค้าบนเว็บจริงทีละรูป */
          const CTX = {
            corp: [['/img/customer/co03.webp', 'ทีมโรงพยาบาลใส่เสื้อโปโลที่ทีมดีทำ'], ['/img/review/rv384-480.webp', 'พนักงานรีสอร์ทริมน้ำใส่เสื้อโปโลที่ทีมดีทำ'], ['/img/customer/lc265.webp', 'ทีมธุรกิจเกษตรโชว์ลายหลังเสื้อที่ทีมดีทำ']],
            gov: [['/img/customer/co16.webp', 'เจ้าหน้าที่หน่วยงานรัฐใส่เสื้อที่ทีมดีทำ'], ['/img/customer/co17.webp', 'ทีมหน่วยทหารใส่เสื้อทีมกิจกรรมที่ทีมดีทำ'], ['/img/customer/ev13.webp', 'ทีมงานโครงการใส่เสื้อที่ทีมดีทำในวันงาน']],
          }
          const contextPhotos = (CTX[id] || []).map((x) => (x ? { img: x[0], alt: x[1] } : null))
          /* /corporate/ ใช้รูปบริษัทจริงตาม photoGroup เหมือนทุกกลุ่ม (อาร์ตเคาะ 2 พ.ย. · เดิมรูปโปโลจาก /embroidery/ ปนภาพ รพ.สต. กับทหาร) */
          /* ภาพจริงตามกลุ่ม (อาร์ตเคาะ 2 พ.ย.): photoGroup ของหน้านี้เท่านั้น ไม่ยืมกลุ่มอื่น · q สูงก่อน · ไม่เอา q ต่ำกว่า 2 · occ ซ้ำเอาภาพแรก · ไม่ซ้ำภาพ hero และการ์ดบริบท
             ส่วนเสื้อจริงเติมให้ครบ 3 ใบ (คำบรรยาย = occ ไม่แต่งโจทย์/สเปก) · ส่วนภาพลูกค้าใช้ภาพที่เหลือ ไม่ซ้ำกัน */
          /* โฉมใหม่ทีละส่วน (อาร์ต 3 พ.ย. "ทำแบบหน้าแรก" · src/data/use-v2.json · เริ่มที่ /corporate/) · แท็บบริบทใช้รูปลูกค้าจริง คำบรรยาย = occ */
          const v2 = useV2()[id] || null
          const v2Photo = (k) => {
            /* 13 พ.ย. แท็บที่ใช้ภาพถ่ายเสื้อจริงจากคลัง Packshot ใส่เป็น { img, small, alt } ตรงๆ (ไม่ใช่รหัสรูปลูกค้า) */
            if (k && typeof k === 'object') { for (const f of [k.img, k.small]) if (!existsSync(resolve(root, 'public' + f))) throw new Error(`use-v2.json: ไม่มีรูป ${f}`); return { ...k, cap: k.alt } }
            const c = cs.find((x) => x.img === `/img/customer/${k}.webp`)
            if (c) return { img: c.img, small: c.imgSmall || c.img, alt: c.occ, cap: c.occ }
            const ctx = contextPhotos.find((x) => x?.img.includes(`/${k}`))
            if (ctx) return { img: `/img/review/${k}.webp`, small: ctx.img, alt: ctx.alt, cap: ctx.alt }
            throw new Error(`use-v2.json: ไม่มีรูป ${k}`)
          }
          if (v2?.pain?.photo) v2.pain.photo = v2Photo(v2.pain.photo)
          /* 16 พ.ย. 2026 คลังรีวิวเดียว (src/js/review-pool.js · อาร์ต "การ์ดรีวิว + คำรีวิวในแท็บ เอารวมกัน คนละประเภทลูกค้าไม่เป็นไร เอาให้ครบๆ")
             ทุกแท็บมีคำรีวิว · รีวิวจริงทุกรายขึ้นหน้านี้ (แท็บ + การ์ด) ไม่ซ้ำกัน · หน้าที่ยังไม่มีส่วนรีวิว (คณะ เสื้อรุ่น) แถวรูป = รูปหลักของรีวิวบนการ์ด */
          const rvPlan = v2?.contexts ? planReviews(id, json('reviews.json').items, v2.contexts.tabs) : null
          if (rvPlan) {
            v2.contexts.tabs = rvPlan.tabs
            if (!v2.reviews) v2.reviews = { tags: [], wall: [] }
            /* แถวรูปบนสุด 10 รูป (2 แถวเต็ม) · รูปที่จัดไว้ใน use-v2.json ก่อน แล้ววนหยิบรูปที่ 1 ของทุกรีวิวบนการ์ด รูปที่ 2 … (ไม่ซ้ำ) · กดรูป = กล่องรีวิวรายนั้น */
            v2.reviews.wall = topUpWall(v2.reviews.wall, rvPlan.board, mediaLib().items)
          }
          /* กำแพงรูปรีวิว: รูปหลักรีวิว (img/review) หรือรูปลูกค้าจริง (customers.json · alt = occ) · สัดส่วนจริงจาก use-v2.json */
          if (v2?.reviews) v2.reviews.wall = v2.reviews.wall.map((w) => {
            const k = w.img
            const base = k.startsWith('rv') ? { img: `/img/review/${k}.webp`, small: `/img/review/${k}-480.webp`, alt: '' } : (({ img, small, alt }) => ({ img, small, alt }))(v2Photo(k))
            /* ความกว้างไฟล์ย่อจากชื่อไฟล์ (-320 / -480) · ใช้ใน srcset ทุกช่อง (4 พ.ย. ช่องรูปลูกค้าเดิมโหลดไฟล์เต็มจนช่องว่าง) */
            return { ...w, ...base, sw: Number(/-(\d+)\.webp$/.exec(base.small)?.[1] || 480), r: (w.w / w.h).toFixed(3) }
          })
          /* 4 พ.ย. แท็บบริบทงานไม่มีรูปลูกค้าแล้ว (อาร์ต "ไม่เอารูปลูกค้าจริง") · มี photos เมื่อไหร่ค่อยแปลง */
          if (v2?.contexts) v2.contexts.tabs = v2.contexts.tabs.map((t) => (t.photos ? { ...t, photos: t.photos.map((k, i) => ({ ...v2Photo(k), ...(t.captions ? { cap: t.captions[i] } : {}) })) } : t))
          /* 11 พ.ย. ปุ่มดูรีวิวท้ายส่วน: รูปวงกลม = รูปจริงรูปแรกของ 3 แท็บแรก (ไม่ซ้ำคลังรีวิวในหน้า) */
          if (v2?.contexts) v2.contexts.faces = v2.contexts.tabs.slice(0, 3).map((t) => t.photos?.[0]?.small).filter(Boolean)
          /* 11 พ.ย. แท็บบริบทงาน: รีวิวที่ตรงงาน (reviews.json · คำจริง ตัด "… " หน้าคำ) · รหัสผิด = build พัง */
          if (v2?.contexts) v2.contexts.tabs = v2.contexts.tabs.map((t) => { if (!t.review) return t; const r = reviewItems().find((x) => x.id === t.review); if (!r) throw new Error(`use-v2.json contexts ${t.id}: ไม่มีรีวิว ${t.review}`); return { ...t, review: { quote: r.quote.replace(/^…\s*/, ''), who: r.who || r.kind } } })
          /* 4 พ.ย. "ทำให้ดีกว่าเดิม uiux": ปุ่ม LINE ต่อสถานการณ์ (ข้อความบอกทีมขายว่าสนใจงานไหน) + ชื่อสถานการณ์ถัดไป */
          if (v2?.contexts) v2.contexts.tabs = v2.contexts.tabs.map((t, i, all) => ({ ...t, line: lineMessageUrl(`สวัสดี ทีมดี ${item.name} — สนใจเสื้อสำหรับ${t.name}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: \n(จากหน้า ${url('uses', id)})`), next: all[i + 1]?.name || '', nextScene: all[i + 1]?.scene || '' }))
          const onPage = new Set([item.img, ...contextPhotos.map((x) => x?.img), ...(v2?.contexts?.tabs || []).flatMap((t) => (t.photos || []).map((x) => x.img)), v2?.pain?.photo?.img, ...(v2?.reviews?.wall || []).map((w) => w.img)])
          const occSeen = new Set()
          const groupPhotos = cs.filter((c) => c.photoGroup === id && c.q >= 2 && c.occ && !onPage.has(c.img)).sort((a, b) => b.q - a.q).filter((c) => !occSeen.has(c.occ) && occSeen.add(c.occ))
          /* ปุ่ม "สนใจงานแนวนี้" บอกทีมขายว่างานใบไหน (2 พ.ย.) */
          const workLine = (alt) => lineMessageUrl(`สวัสดี ทีมดี สนใจงานแนวนี้: ${alt}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: \n(จากหน้า ${url('uses', id)})`)
          const workCards = [...useWorks, ...groupPhotos.slice(0, Math.max(0, 3 - useWorks.length)).map((c) => ({ img: c.img, alt: c.occ }))].map((w) => ({ ...w, line: workLine(w.alt) }))
          const usePhotos = groupPhotos.filter((c) => !workCards.some((w) => w.img === c.img)).slice(0, 24)
          /* ภาพประกอบส่วน "ทำไมทีมดี" (2 พ.ย. รอบ 64): รูปถัดจาก 24 รูปที่แสดง ไม่ซ้ำกับรูปอื่นบนหน้า · กลุ่มที่รูปไม่ถึงไม่มีภาพ */
          const benefitPhoto = groupPhotos.filter((c) => !workCards.some((w) => w.img === c.img))[24] || null
          /* รีวิวตรงกลุ่ม (อาร์ตเคาะ 2 พ.ย.): ร้านค้า รีสอร์ท · หน่วยงาน โรงพยาบาลกับ NT · รุ่นและคณะยังไม่มีรีวิวตรงกลุ่ม = ซ่อน · วิ่ง กลุ่มนักวิ่งขึ้นก่อน · ที่เหลือตาม REVIEW_USE */
          /* 14 พ.ย. หน้าเสื้อกีฬาโฉมใหม่: ทีมว่ายน้ำ + ทีมฟุตบอลบริษัท (np-connect) + ชมรมแบด · ไม่ใช้ runners (ของหน้าวิ่ง) */
          const REVIEW_PICK = REVIEW_PICK_POOL /* 16 พ.ย. ย้ายไป src/js/review-pool.js (ที่เดียว) */
          const useReviews = REVIEW_PICK[id] ? REVIEW_PICK[id].map((rid) => reviewItems().find((r) => r.id === rid)) : pickReviews(REVIEW_USE[id], 3, true)
          /* ภาพที่ขึ้นในกล่อง "จากภาพแบบ สู่เสื้อจริง" แล้วไม่ซ้ำในแบบเสื้อ (2 พ.ย.: 3d-082 brand-064) */
          const inProof = new Set(downloadAssetsFor('use', id, data.designs)?.proofs.flatMap((p) => [p.design?.img, p.real?.img]))
          /* แบบไม่ถึง 6 ใบ เติมภาพแบบจากคลังของกลุ่ม (2 พ.ย.: หน้าเสื้อรุ่นเดิมขึ้นใบเดียวทั้งที่มี 13 รายการ) */
          const galleryRefs = galleryFor(mediaLib(), { group: id, shortName: item.shortName, coded: gallerySelection(data.designs, id, designsFor(data.designs, id)).items }).items.filter((g) => g.square)
          /* กลุ่มที่แบบของตัวเองไม่ถึง 3 ใบ เติมแบบมีรหัสทรงเบสบอลและเจอร์ซีย์ (ทุกแบบปรับสีและลายให้กลุ่มนี้ได้) */
          const extraCoded = data.designs.filter((d) => ['baseball', 'football'].includes(d.garment))
          const firstShown = [...useDesigns, ...live, ...galleryRefs].filter((d, i, all) => !inProof.has(d.img) && all.findIndex((x) => x.img === d.img) === i)
          const filled = firstShown.length < 3 ? [...firstShown, ...extraCoded.filter((d) => !firstShown.some((x) => x.img === d.img))] : firstShown
          /* กริดแบบ 3 คอลัมน์บนจอคอม: 4–5 ใบเหลือแถวขาด ตัดเหลือเต็มแถว (แบบทั้งหมดอยู่หน้า /designs/) */
          const useShown = filled.slice(0, fullRows(filled.length, 3, 6))
          const up = useView(usePages()[id], { designs: useShown, works: workCards, photos: usePhotos, contextPhotos, reviews: useReviews, benefitPhoto }, { forWp, has, drop: v2?.drop })
          up.v2 = v2
          /* รีวิวโฉมใหม่: การ์ดรีวิวเฉพาะกลุ่มองค์กร (แบบกระดานหน้าแรก) + กำแพงรูปจากแกลเลอรีรีวิว */
          if (v2?.reviews) {
            /* 16 พ.ย. การ์ด = รีวิวที่ไม่อยู่ในแท็บ (review-pool.js) · own ของหน้าก่อน แล้วรีวิวกลุ่มอื่น */
            const rvAllUse = reviewItems()
            const board = rvPlan ? rvPlan.board : []
            const ownN = board.filter((b) => b.own).length
            v2.reviews.items = board.map((b) => { const r = rvAllUse.find((x) => x.id === b.id); return { ...r, own: b.own, mono: [...(r.who || r.kind)].find((c) => !'เแโใไ'.includes(c)) } })
            /* แถวเดียวมีลูกศร (partial reviewRow · อาร์ต 16 พ.ย. "เอารวมมาในแถวเดียวพอ มีลูกศรให้กดเลื่อน") */
            for (const w of v2.reviews.wall) if (w.review) { const r = rvAllUse.find((x) => x.id === w.review); w.who = r.who || r.kind; w.alt = `งานจริงจากรีวิว ${w.who}` }
            /* หน้าที่ไม่มีรีวิวของกลุ่มตัวเอง: หัวข้อกลาง ไม่อ้างว่าเป็นรีวิวของกลุ่มนี้ */
            if (!ownN) {
              up.reviews = { ...up.reviews, h: 'รีวิวจากลูกค้าที่สั่งทำเสื้อกับทีมดี' }
              v2.copy = { ...v2.copy, reviews: 'ที่สั่งทำเสื้อกับทีมดี', reviewsLabel: 'รีวิวจากลูกค้าทีมดี', reviewsSub: 'คำพูดจริงจากแชทลูกค้ากลุ่มอื่นของทีมดี กดรูปเพื่อดูงานทั้งชุด' }
            }
          }
          /* ผลงานโฉมใหม่: โชว์รูมหน้าแรก · แถวที่มี from = รูปบนหุ่นชุดหน้าแรก (home-work-showcase.json byType) */
          /* 11 พ.ย. คลังรีวิว (อาร์ต "เพิ่มคลังรีวิวตรงนี้"): use-v2.json reviewWall · รูปลูกค้ากลุ่มนี้จากคลังกลาง ไม่ซ้ำรูปที่หน้านี้ใช้แล้ว · น้อยกว่า 12 รูป = build พัง */
          if (v2?.reviewWall) {
            const inReviews = JSON.stringify(v2.reviews || {}) /* รูปในการ์ด/แกลเลอรีรีวิว */
            /* exclude = ชื่อไฟล์ที่ไม่เอาเข้าคลัง (รูปมุมซ้ำ หรืองานเดียวกับรูปในส่วนรีวิวที่อยู่ติดกัน · 13 พ.ย.) */
            const skip = new Set(v2.reviewWall.exclude || [])
            const fresh = (x) => !onPage.has(x.img) && !inReviews.includes(x.img.replace(/\.webp$/, '')) && !skip.has(x.img.split('/').pop().replace(/\.webp$/, ''))
            let items = (data.reviewWall[v2.reviewWall.from === 'primary' ? 'primary' : 'groups'][id] || []).filter(fresh)
            /* fill = กลุ่มที่เติมต่อท้ายเมื่อรูปกลุ่มนี้ไม่พอ (ร้านค้า → พนักงานบริษัท · หัวข้อต้องบอกทั้งสองกลุ่ม) */
            if (v2.reviewWall.fill) items = [...items, ...(data.reviewWall.groups[v2.reviewWall.fill] || []).filter((x) => fresh(x) && !items.some((y) => y.img === x.img))].slice(0, 30)
            if (items.length < 12) throw new Error(`use-v2.json ${id}.reviewWall: รูปไม่พอ (${items.length})`)
            v2.reviewWall = { ...v2.reviewWall, items }
          }
          /* 12 พ.ย. โลโก้ตามกลุ่ม (อาร์ต "1-4 มาก่อน" ข้อ 3): แถวแรก = โลโก้ของกลุ่มนี้ (use-v2.json logoFirst) แถวสอง = ที่เหลือ · โลโก้ชุดเดิมที่อาร์ตอนุมัติ 22 ต.ค. ไม่เพิ่มใหม่ */
          if (v2?.logoFirst && json('home.json').logos.show) {
            const fit = readdirSync(resolve(root, 'public/img/client-fit')).filter((f) => /\.(png|svg|webp)$/.test(f)).sort()
            const names = json('client-logos.json'), key = (f) => f.replace(/\.\w+$/, ''), view = (f) => ({ img: `/img/client-fit/${f}`, alt: names[key(f)] || '' })
            const first = v2.logoFirst.ids.map((c) => { const f = fit.find((x) => key(x) === c); if (!f) throw new Error(`use-v2.json ${id}.logoFirst: ไม่มีโลโก้ ${c}`); return f })
            v2.logoRows = [first.map(view), fit.filter((f) => !first.includes(f)).map(view)]
          }
          /* 13 พ.ย. หัวข้อ hero: คำหลัก + บรรทัดรองสีส้ม (use-v2.json hero.h1Main) · ข้อความ H1 เดิม */
          if (v2?.hero?.h1Main) { const sp = h1Split(up.hero.h1, v2.hero.h1Main); if (!sp) throw new Error(`use-v2.json ${id}.hero.h1Main ไม่ตรงต้น H1`); up.hero.h1p = sp }
          /* 13 พ.ย. ส่วนตรวจตัวอย่าง → ตรวจก่อนแพ็ก → จัดส่ง (อาร์ต "เอาแค่ส่วน C") · ข้อเท็จจริงจากคู่มือโปโลปัก (polo.json guide) ที่เดียว ไม่พิมพ์ซ้ำ · หัวการ์ด/รูปจาก use-v2.json _check */
          if (v2?.check) {
            const c = useV2()._check, g = json('polo.json').guide
            /* 16 พ.ย.: "ช่วงจำนวน · ตัวอย่างที่ได้ · ตรวจอะไร" → หัวตัวหนาสั้น + บรรทัดรองเล็ก (กล่องแคบไม่ตัด 3 บรรทัด) */
            const tier = (t) => { const [when, what, ...more] = t.split(' · '); return { when, what, more: more.join(' · ') } }
            const pic = (x) => ({ ...x, img: `${x.img}-1280.webp`, small: `${x.img}-640.webp` })
            for (const k of ['sample', 'qa', 'ship']) for (const f of [`${c[k].img}-1280.webp`, `${c[k].img}-640.webp`]) if (!existsSync(resolve(root, 'public' + f))) throw new Error(`use-v2.json _check: ไม่มีรูป ${f}`)
            v2.check = {
              ...v2.check, note: c.note, cta: c.cta, claim: g.delivery.claim,
              line: lineMessageUrl(`สวัสดี ทีมดี ${c.brief}\nจำนวนประมาณ:  ตัว\n(จากหน้า ${url('uses', id)})`),
              /* 16 พ.ย. 2026 อาร์ต "ไม่ต้องแยก ปักกับพิมพ์ลาย รวมมาได้เลย": ตัวอย่าง 2 ระดับ · สิ่งที่ตรวจ · ตรวจก่อนแพ็ก เขียนรวมใน use-v2.json _check · มัดจำ/ส่ง/เคลม จากคู่มือเหมือนเดิม */
              sample: { ...pic(c.sample), tiers: c.sample.tiers.map(tier), checks: c.sample.checks, pay: g.sample.pay.split(' · ') },
              qa: { ...pic(c.qa), items: c.qa.items },
              ship: { ...pic(c.ship), ways: g.delivery.ways, notes: g.delivery.note.split(' · ') },
            }
          }
          /* 13 พ.ย. แถวที่มีทั้ง items และ from = รูปของกลุ่มนี้ขึ้นก่อน แล้วตามด้วยชุดกลาง (ภาพถ่ายเสื้อจริงจากคลัง Packshot) */
          if (v2?.showroom) v2.showroom = v2.showroom.rows.map((r) => ({ ...r, items: [...(r.items || []), ...(r.from ? json('home-work-showcase.json').byType[r.from] : [])] }))
          /* บริการของเรา (โฉมใหม่): การ์ดสินค้าเดิม + รูปบริการตามสินค้า */
          if (v2?.products) v2.products.cards = up.products.cards.map((c) => ({ ...c, photo: v2.products.photos[c.to.split('.')[1]] }))
          /* ปุ่ม v22 เปิด LINE พร้อมเรื่องที่ v22 ส่งให้ทีมขาย */
          const withLine = (a) => a && { ...a, line: lineMessageUrl(`สวัสดี ทีมดี ${a.brief}\nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: \n(จากหน้า ${url('uses', id)})`) }
          up.plan.asks = (up.plan.asks || []).map(withLine)
          /* ภาพลูกค้า 6 คอลัมน์: เริ่มแสดงเต็มแถว ที่เหลืออยู่หลังปุ่มดูเพิ่ม */
          if (up.photos) up.photos.shown = fullRows(up.photos.items.length, 6, 12)
          up.team.ask = withLine(up.team.ask)
          up.photos.ask = withLine(up.photos.ask)
          if (up.contexts?.ask) up.contexts.ask = withLine(up.contexts.ask)
          /* ส่วน 06 เป็นใบราคาย่อ (audit use-02) · แถวตามการ์ดสินค้าของกลุ่ม ราคาจาก prices.json · สินค้าที่ยังไม่มีราคาเปิด LINE พร้อมข้อความตั้งต้น */
          const productName = (pid) => data.allProducts.find((x) => x.id === pid)?.name || ''
          /* hero (audit use-03): ราคาบรรทัดเดียวของสินค้าตัวแรกในใบราคาย่อที่มีตารางราคา · รูปจริงมีไฟล์ -320 คู่กัน */
          const P = json('prices.json')
          const firstPriced = up.products.cards.map((c) => c.to.split('.')[1]).find((pid) => priceLine(P, pid))
          /* + วันผลิตของสินค้าเดียวกัน (ตรวจมือถือ 30 ต.ค.: hero หน้ากลุ่มบอกแค่ขั้นต่ำ วันผลิตไปอยู่จอที่ 12) */
          up.hero.price = firstPriced ? { pid: firstPriced, name: productName(firstPriced), line: priceLine(P, firstPriced), moq: `ขั้นต่ำ ${P.minQty} ตัว · ผลิต ${json('lead-times.json')[firstPriced]?.days || ''}`.replace(/ · ผลิต $/, '') } : null
          /* แถบสรุปใต้ hero (2 พ.ย. รอบ 64): แยกตัวเลขราคาให้เด่น "220 บาท/ตัว (ผ้าจูติ 10–50 ตัว)" → 220 · บาท/ตัว · ผ้าจูติ 10–50 ตัว */
          if (up.hero.price) { const pm = /^([\d,]+) (\S+)(?: \((.*)\))?$/.exec(up.hero.price.line); if (pm) Object.assign(up.hero.price, { num: pm[1], unit: pm[2], cond: pm[3] || '' }) }
          /* ข้อเท็จจริงบรรทัดเล็กใต้ปุ่ม hero 3 ข้อ · "ขั้นต่ำ" ซ้ำกับบรรทัดราคาจึงตัด */
          up.hero.factLine = up.hero.facts.filter((f) => !(up.hero.price && f.startsWith('ขั้นต่ำ'))).slice(0, 3)
          /* การ์ดเสื้อจริง: ลิงก์สินค้าของงานนั้น · ไม่มีข้อมูลสินค้า (ภาพลูกค้า) ใช้สินค้าตัวแรกของกลุ่มในใบราคาย่อ */
          up.work.real = up.work.real.map((w) => { const pid = (has(`products.${w.product}`) && w.product) || firstPriced; return { ...w, productHref: pid && url('products', pid), productName: pid && productName(pid) } })
          up.hero.srcset = srcsetOf(item.img, 320, 320, item.img?.startsWith('/img/real/') ? 760 : 640)
          up.products.quote = useQuote(json('prices.json'), up.products.cards, json('lead-times.json'), { askHref: (pid) => lineMessageUrl(`ขอราคา${productName(pid)} สำหรับ${item.shortName} จำนวนประมาณ ... ตัว`) })
          return {
            ...base,
            item,
            up,
            downloadAssets: downloadAssetsFor('use', id, data.designs),
            /* เลขเดียวกับหน้าแกลเลอรี (2 พ.ย.: เดิมนับคนละชุด 109 กับ 125) */
            useDesignsAll: galleryFor(mediaLib(), { group: id, shortName: item.shortName, coded: gallerySelection(data.designs, id, designsFor(data.designs, id)).items }).items.length,
            /* กลุ่มที่ยังไม่มีแบบ (เสื้อรุ่น คณะ ร้านค้า) ไม่พาไปแกลเลอรีว่าง ไปหน้าแบบเสื้อรวมแทน (audit 26 ต.ค.) */
            designsHref: useDesigns.length + live.length ? url('galleries', id) : url('designs'),
            cta: useCta(item, data.site, url('contact')),
            priceAsk: useCta(item, data.site, url('contact')).primary.href,
            useLd: (() => { const s = faqSchema(up.faq.items); return s && ldJson(s) })(),
          }
}
