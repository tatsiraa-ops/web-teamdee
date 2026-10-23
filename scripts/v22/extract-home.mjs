/* ดึงข้อความหน้าแรก Wireframe v22 ทั้งหน้าตามลำดับบล็อก (innerText เก็บการขึ้นบรรทัด) → docs/spec/teamdee-v22/extracted/home-text.json
   ใช้คู่กับ extract-pages.mjs (ตัวนั้นเก็บได้แค่ section.wf-section) · รัน: node scripts/v22/extract-home.mjs */
import { writeFileSync } from 'node:fs'
import { launchChrome } from '../lib/chrome.mjs'
const { send, ev, sleep, close } = await launchChrome()
try {
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'file:///Users/artist/Documents/TEAMDEE%20WEB/docs/spec/teamdee-v22/TEAMDEE-Full-Website-Wireframe.html#home' })
  await sleep(1800)
  const out = await ev(`(()=>{
    const main=document.querySelector('main')||document.body
    const blocks=[...main.children].filter(e=>e.offsetParent!==null&&e.innerText.trim())
    return blocks.map((b,i)=>({i, tag:b.tagName.toLowerCase(), id:b.id||'', cls:b.className||'', text:b.innerText.replace(/\\n{3,}/g,'\\n\\n').trim(),
      faq:[...b.querySelectorAll('details')].map(d=>({q:d.querySelector('summary')?.innerText.trim(), a:[...d.childNodes].filter(n=>n.nodeName!=='SUMMARY').map(n=>n.textContent).join(' ').replace(/\\s+/g,' ').trim()}))}))
  })()`)
  writeFileSync('/Users/artist/Documents/TEAMDEE WEB/docs/spec/teamdee-v22/extracted/home-text.json', JSON.stringify({ _note: 'ข้อความหน้าแรก v22 ตามลำดับบล็อก · ดึงด้วย scripts/v22/extract-home.mjs 22 ต.ค. 2026 · ข้อมูลดิบ', blocks: out }, null, 1))
  console.log(out.length, out.map((b) => b.id || b.cls.slice(0, 20)).join(' | '))
} finally { await close() }
