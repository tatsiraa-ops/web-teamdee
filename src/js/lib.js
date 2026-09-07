import pricing from '../data/pricing.json'
import site from '../data/site.json'

export const TH_MONTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
export const today = () => new Date()

export const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x }
export const workToCal = (n) => Math.round((n / 5) * 7)
export const fmtShort = (d) => `${d.getDate()} ${TH_MONTH[d.getMonth()]} ${String(d.getFullYear() + 543).slice(2)}`
export const fmtFull = (d) => `${d.getDate()} ${TH_MONTH[d.getMonth()]} ${d.getFullYear() + 543}`
export const baht = (n) => Number(n).toLocaleString('en-US')

/** ระยะจากวันเริ่มบรีฟถึงวันใส่จริง (วันปฏิทิน) */
export const leadDays = () =>
  pricing.lead.design + pricing.lead.confirm + workToCal(site.produceDaysMax) + pricing.lead.ship + pricing.lead.buffer

/** ระยะจากวันยืนยันแบบถึงวันใส่จริง */
export const confirmLead = () =>
  workToCal(site.produceDaysMax) + pricing.lead.ship + pricing.lead.buffer

export const tierFor = (qty) => pricing.tiers.find((t) => qty <= t.max) ?? pricing.tiers.at(-1)
export const unitPrice = (qty, collar) => { const t = tierFor(qty); return collar ? t.collar : t.round }

/** ไทม์ไลน์ย้อนกลับจากวันงาน */
export const timeline = (eventDate) => {
  const ev = eventDate
  const brief = addDays(ev, -leadDays())
  const confirm = addDays(ev, -confirmLead())
  const design = addDays(ev, -(confirmLead() + pricing.lead.confirm))
  const ship = addDays(ev, -pricing.lead.buffer)
  return { brief, design, confirm, ship, event: ev }
}

export const qs = (k) => new URLSearchParams(location.search).get(k)
