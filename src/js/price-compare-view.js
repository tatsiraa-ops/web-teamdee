/* ตัวเลือกช่วงจำนวน + ตารางราคา 2 คอลัมน์ บนมือถือ (mobile UX audit 30 ต.ค. ข้อ 10) · HTML ล้วน ไม่แตะ DOM (tests/price-compare.test.js)
   ข้อมูล view มาจาก bandCompare(prices.json) ใน src/js/prices.js · ไฟล์นี้ไม่มีตัวเลขราคา
   ทำไมเลือก "ช่วงจำนวน" ไม่ใช่ "ผ้า": คนที่รู้จำนวน (ฝ่ายบุคคลสั่ง 80 ตัว) อยากเทียบผ้า → กด 1 ครั้งเห็นครบ 6 ผ้า
   ถ้าเลือกผ้าต้องกด 6 ครั้งแล้วจำเลขเอง · ใช้ radio แทนช่องพิมพ์จำนวน: ไม่เด้งคีย์บอร์ดบังจอ ไม่มีค่าผิด และป้ายบอกช่วงที่ราคาใช้ได้ตรงๆ */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** ช่วงตามรหัส (bandId) · ไม่มี = ช่วงแรก (ขั้นต่ำ) */
export const pickBand = (view, id) => view.bands.find((b) => b.id === id) || view.bands[0]

/** caption แยกวลีตาม " · " ห่อ inline-block ไม่ให้ "รวม VAT 7%" ขาดกลางวลีบนจอแคบ */
export const compareCaption = (band) => band.caption.split(' · ').map((x) => `<span class="pcmp__nb">${esc(x)}</span>`).join(' · ')

/** แถวของตาราง: ชื่อผ้าเป็นหัวแถว ราคาเป็นช่องข้อมูล */
export const compareRows = (band) => band.rows.map((r) => `<tr><th scope="row">${esc(r.name)}</th><td>${esc(r.text)}</td></tr>`).join('')

/** กล่องทั้งหมด · name = ชื่อกลุ่ม radio (ไม่ซ้ำในหน้า) · ช่วงแรกถูกเลือกไว้ */
export const compareMarkup = (view, { name }) => {
  const first = view.bands[0]
  const opts = view.bands
    .map((b, i) => `<label class="pcmp__opt"><input type="radio" name="${esc(name)}" value="${esc(b.id)}"${i === 0 ? ' checked' : ''}><span>${esc(b.label)}</span></label>`)
    .join('')
  return `<fieldset class="pcmp__pick">
<legend class="pcmp__legend">สั่งกี่ตัว · เลือกช่วงจำนวน</legend>
<div class="pcmp__opts">${opts}</div>
</fieldset>
<div class="ptable pcmp__box"><table>
<caption>${compareCaption(first)}</caption>
<thead><tr><th scope="col">ผ้า</th><th scope="col">บาท/ตัว</th></tr></thead>
<tbody>${compareRows(first)}</tbody>
</table></div>
<p class="pcmp__live" aria-live="polite"></p>`
}
