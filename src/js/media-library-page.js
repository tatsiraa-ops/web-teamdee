import './page.js'
import lib from '../data/media-library.json'
import { filterMedia } from './media-library.js'

/* หน้า /ui/media/ คลังรูปกลาง (30 ต.ค.) · กรองชนิด กลุ่ม สินค้า รูปซ้ำ ค้นจาก path/คำบรรยาย · คัดลอก path ไปใช้
   ตัวกรองอยู่ใน URL (?kind=customer&group=running) ส่งลิงก์ให้กันได้ · แสดงทีละ 48 รูป */
const PAGE = 48
const $ = (s) => document.querySelector(s)
const form = $('#mdForm')
const grid = $('#mdGrid')
const more = $('#mdMore')
const countEl = $('#mdCount')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`)
const ICO_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'

/* ตัวเลือกในดรอปดาวน์ พร้อมจำนวน (นับรูปที่ไม่ซ้ำ) */
const live = lib.items.filter((m) => !m.dupOf)
const fill = (name, entries) => {
  const sel = form.elements[name]
  for (const [v, label] of entries) sel.append(new Option(label, v))
}
const n = (fn) => live.filter(fn).length
fill('kind', Object.entries(lib.kinds).filter(([k]) => lib.stats.byKind[k]).map(([k, t]) => [k, `${t} (${lib.stats.byKind[k]})`]))
fill('group', [...Object.entries(lib.groupNames).map(([k, t]) => [k, `${t} (${n((m) => m.groups.includes(k))})`]), ['none', `ยังไม่มีแท็กกลุ่ม (${n((m) => !m.groups.length)})`]])
fill('product', [...Object.entries(lib.productNames).map(([k, t]) => [k, `${t} (${n((m) => m.product.includes(k))})`]), ['none', `ยังไม่มีแท็กสินค้า (${n((m) => !m.product.length)})`]])

const s = lib.stats
$('#mdStats').innerHTML = [
  ['รูปทั้งหมด', `${s.images.toLocaleString('en-US')} รูป`],
  ['ไฟล์จริง (รวมไฟล์ย่อ)', `${s.files.toLocaleString('en-US')} ไฟล์`],
  ['ขนาดไฟล์หลักรวม', kb(s.bytes)],
  ['รูปซ้ำ', `${s.duplicates} รูป (${s.dupGroups} ชุด)`],
  ['ยังไม่มีแท็ก', `${s.untagged} รูป`],
].map(([k, v]) => `<div><dt class="t-xs">${k}</dt><dd class="font-bold text-ink text-[18px]">${v}</dd></div>`).join('')

/* รูปย่อในกริด: ไฟล์ย่อเล็กสุดที่กว้างพอ (≥ 300px) ไม่งั้นไฟล์หลัก */
const thumbOf = (m) => (m.variants.find((v) => v.w >= 300) || (m.w <= 760 ? null : m.variants.at(-1)) || { path: m.path }).path
const nameOf = (map, id) => map[id] || id

const card = (m) => `<li class="md-card">
  <a class="md-thumb" href="${esc(m.path)}" target="_blank" rel="noopener" aria-label="เปิดรูปเต็ม ${esc(m.path)}"><img src="${esc(thumbOf(m))}" alt="${esc(m.alt || m.occ || '')}" loading="lazy" decoding="async" width="${m.w}" height="${m.h}"></a>
  <div class="md-body">
    <p class="md-path">${esc(m.path)}</p>
    <p class="md-tags"><span class="md-tag md-tag--kind">${esc(nameOf(lib.kinds, m.kind))}</span>${m.code ? `<span class="md-tag md-tag--code">${esc(m.code)}</span>` : ''}${m.sameAs ? `<span class="md-tag md-tag--code">แบบเดียวกับ ${esc(m.sameAs)}</span>` : ''}${m.dupOf ? `<span class="md-tag md-tag--dup">ซ้ำกับ ${esc(m.dupOf.split('/').slice(-2).join('/'))}</span>` : ''}</p>
    <p class="tabular-nums">${m.w} × ${m.h} px · ${kb(m.bytes)} · ${esc(m.formats.join(' + '))}${m.variants.length ? ` · ย่อ ${m.variants.map((v) => v.w).join(' / ')}` : ''}</p>
    ${m.groups.length || m.product.length ? `<p class="md-tags">${m.groups.map((g) => `<span class="md-tag">${esc(nameOf(lib.groupNames, g))}</span>`).join('')}${m.product.map((p) => `<span class="md-tag">${esc(nameOf(lib.productNames, p))}</span>`).join('')}</p>` : '<p class="t-xs">ยังไม่มีแท็กกลุ่มหรือสินค้า</p>'}
    ${m.alt || m.occ ? `<p>${esc(m.alt || m.occ)}</p>` : ''}
    <div class="md-row">
      <button class="md-copy" type="button" data-copy="${esc(m.path)}">${ICO_COPY}<span>คัดลอก path</span></button>
      ${m.variants.map((v) => `<button class="md-copy" type="button" data-copy="${esc(v.path)}" aria-label="คัดลอก path ไฟล์ย่อ ${v.w}px">${v.w}</button>`).join('')}
    </div>
    <details class="md-used"><summary>ใช้ใน ${m.usedOn.length} หน้า · อ้างถึงใน ${m.refs.length} ไฟล์</summary>
      ${m.usedOn.length ? `<ul>${m.usedOn.map((u) => `<li><a href="${esc(u)}">${esc(u)}</a></li>`).join('')}</ul>` : '<p>ยังไม่มีหน้าที่ใช้ (ตาม build ล่าสุด)</p>'}
      ${m.refs.length ? `<ul class="mt-2">${m.refs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
      ${m.sources.length ? `<p class="t-xs mt-2">แท็กจาก: ${esc(m.sources.join(', '))}</p>` : ''}
    </details>
  </div>
</li>`

let rows = []
let shown = 0
const state = () => {
  const f = new FormData(form)
  return { q: f.get('q') || '', kind: f.get('kind') || '', group: f.get('group') || '', product: f.get('product') || '', dup: f.get('dup') === 'on' }
}
const renderMore = () => {
  grid.insertAdjacentHTML('beforeend', rows.slice(shown, shown + PAGE).map(card).join(''))
  shown = Math.min(rows.length, shown + PAGE)
  more.hidden = shown >= rows.length
  more.textContent = `แสดงเพิ่ม (เหลือ ${rows.length - shown} รูป)`
}
const run = () => {
  const st = state()
  rows = filterMedia(lib.items, st)
  shown = 0
  grid.innerHTML = ''
  countEl.textContent = rows.length ? `พบ ${rows.length.toLocaleString('en-US')} รูป` : 'ไม่พบรูปตามตัวกรองนี้ ลองล้างคำค้นหรือเลือกทุกชนิด'
  renderMore()
  const p = new URLSearchParams(Object.entries(st).filter(([, v]) => v).map(([k, v]) => [k, v === true ? '1' : v]))
  history.replaceState(null, '', `${location.pathname}${p.size ? `?${p}` : ''}`)
}

/* ตัวกรองจาก URL */
const params = new URLSearchParams(location.search)
for (const k of ['q', 'kind', 'group', 'product']) if (params.get(k)) form.elements[k].value = params.get(k)
form.elements.dup.checked = params.get('dup') === '1'

let t
form.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 120) })
form.addEventListener('change', run)
more.addEventListener('click', renderMore)

/* คัดลอก path · clipboard API ไม่ได้ (http ที่ไม่ใช่ localhost) ใช้ textarea ชั่วคราว */
const copy = async (text) => {
  try { await navigator.clipboard.writeText(text); return true } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text })
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.append(ta); ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}
const liveMsg = Object.assign(document.createElement('p'), { className: 'sr-only' })
liveMsg.setAttribute('aria-live', 'polite')
document.body.append(liveMsg)
grid.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]')
  if (!b) return
  const ok = await copy(b.dataset.copy)
  const label = b.querySelector('span') || b
  const was = label.textContent
  b.toggleAttribute('data-done', ok)
  label.textContent = ok ? 'คัดลอกแล้ว' : 'คัดลอกไม่ได้'
  liveMsg.textContent = ok ? `คัดลอก ${b.dataset.copy} แล้ว` : 'คัดลอกไม่ได้'
  setTimeout(() => { label.textContent = was; b.removeAttribute('data-done') }, 1600)
})

run()
