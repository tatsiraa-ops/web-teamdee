/* helper ของเทมเพลต Handlebars (แยกจาก vite.config.js · 16 พ.ย. 2026 B1d) · {{eq}} {{ph}} {{hl}} {{url}} {{media}} ฯลฯ */
import { parseStat } from '../../src/js/count-up.js'
import { phrases, chunks } from '../../src/js/phrases.js'
import { root, json, url, mediaFor } from './shared.js'

export const helpers = {
        eq: (a, b) => a === b,
        /* ชื่อแรกของชื่อที่มีหลายชื่อ ("เสื้อแบดมินตัน / เสื้อแบด / …") ใช้ใน breadcrumb ไม่ให้อ่านเป็นหลายชั้น */
        firstName: (s) => String(s || '').split(' / ')[0],
        baht: (n) => Number(n).toLocaleString('en-US'),
        lt: (a, b) => Number(a) < Number(b),
        /* (or rows @root.reviewWall.rows) ค่าแรกที่มี · partial ที่รับพารามิเตอร์แล้วมีค่าเริ่มต้น (คลังรีวิว 10 พ.ย.) */
        or: (...a) => a.slice(0, -1).find((x) => x != null && x !== '' && !(Array.isArray(x) && !x.length)),
        inc: (n) => Number(n) + 1,
        /* {{#each (array "a" "b")}} รายการคงที่ในเทมเพลต (ต้นแบบหลายทาง 4 พ.ย.) */
        array: (...a) => a.slice(0, -1),
        /* (concat (url 'contact') "?p=" item.id) ต่อข้อความ · ตัวท้ายคือ options ของ Handlebars ตัดทิ้ง */
        concat: (...a) => a.slice(0, -1).join(''),
        /* {{{ph หัวข้อ}}} ห่อวลีไทยไม่ให้หักกลาง (src/js/phrases.js) */
        ph: (t) => phrases(t),
        /* {{{hl หัวข้อ "ท้ายวลี"}}} ท้ายวลีเป็นสีส้ม .hm-hl (อาร์ต 3 พ.ย. แบบ "ที่ไว้วางใจทีมดี") · ข้อความต้องลงท้ายด้วยวลีนั้น ไม่งั้นแสดงปกติ */
        /* {{{hl หัวข้อ วลีท้ายสีส้ม [ขึ้นบรรทัดหลังคำนี้]}}} · ตัวที่ 3 (11 พ.ย. อาร์ต "ยังไม่แน่ใจว่า / เสื้อแบบไหนเหมาะกับทีม?") บังคับ <br> หลังคำนั้น ข้อความไม่เปลี่ยน */
        hl: (t, tail, brk) => {
          const s = String(t ?? '')
          if (typeof tail !== 'string' || !tail || !s.endsWith(tail)) return phrases(s)
          const head = s.slice(0, -tail.length)
          const h = head.trim()
          const lead = typeof brk === 'string' && brk && h.startsWith(brk) && h.length > brk.length ? `${phrases(brk)}<br>${phrases(h.slice(brk.length).trim())}` : phrases(h)
          return `${h ? lead + (/\s$/.test(head) ? ' ' : '<wbr>') : ''}<span class="hm-hl">${phrases(tail)}</span>`
        },
        /* {{{dots บรรทัด}}} ตัดบรรทัดเฉพาะที่ " · " (src/js/phrases.js chunks) */
        dots: (t) => chunks(t),
        /* ลิงก์แผนที่ · ช่องว่างและภาษาไทยใน query ต้อง encode */
        enc: (t) => encodeURIComponent(String(t ?? '')),
        /* {{{json list}}} ข้อมูลให้ JS ในหน้า (กล่องดูรูปรีวิว) · กัน </script> */
        json: (x) => JSON.stringify(x ?? null).replace(/</g, '\\u003c'),
        /* {{#with (stat this.n)}} แยกตัวเลข/+/หน่วย ให้สถิติหน้าแรกวิ่งนับได้ (src/js/count-up.js) */
        stat: (t) => parseStat(t),
        /* {{url 'contact'}} · {{url 'products' this.id}} · {{url 'guides.size'}} — ลิงก์ภายในทุกตัวต้องผ่านตัวนี้ */
        url: (key, id) => url(key, typeof id === 'string' ? id : undefined),
        /* {{#each (media group="sport" kind="customer,work" limit=6)}} ดึงรูปจากคลังกลาง (30 ต.ค.) · kind/product คั่นด้วยจุลภาค */
        media: (options) => {
          const h = { ...options.hash }
          for (const k of ['kind', 'product']) if (typeof h[k] === 'string') h[k] = h[k].split(',').map((s) => s.trim())
          return mediaFor(h)
        },
}
