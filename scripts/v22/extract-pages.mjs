/* ดึงเนื้อหาหน้าจาก Wireframe v22 (สินค้า 6 · กลุ่มลูกค้า 10 · แบบเสื้อ 11 · รีวิว · คู่มือ บทความ และหน้าข้อมูล) ด้วย headless Chrome → docs/spec/teamdee-v22/extracted/{products,uses,designs,works}.json
   รัน: node scripts/v22/extract-pages.mjs (ต้องมี Google Chrome) · ไฟล์ wireframe เป็นข้อมูล ไม่มีสคริปต์ภายนอก */
import { writeFileSync } from 'node:fs'
import { launchChrome } from '../lib/chrome.mjs'
const { send, ev, sleep, close } = await launchChrome()
try {
await send('Page.enable')
const F = 'file:///Users/artist/Documents/TEAMDEE%20WEB/docs/spec/teamdee-v22/TEAMDEE-Full-Website-Wireframe.html'
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
for (const [NAME, IDS] of Object.entries({products: ['polo', 'printed', 'screen', 'warmup', 'baseball', 'oversize'], uses: ['business', 'shop', 'organization', 'education', 'class', 'faculty', 'sport', 'badminton', 'running', 'activity'], designs: ['designs', 'designs-business', 'designs-shop', 'designs-organization', 'designs-education', 'designs-class', 'designs-faculty', 'designs-sport', 'designs-badminton', 'designs-running', 'designs-activity'], works: ['works'], home: ['home'], info: ['guide-print', 'guide-screen', 'guide-embroider', 'guide-fabric', 'guide-size', 'guide-files', 'guide-delivery', 'articles', 'article', 'article-fabric', 'article-design', 'article-checklist', 'faq', 'about', 'contact', 'search', 'not-found', 'privacy']})) {
let out = { _note: 'ดึงจาก TEAMDEE-Full-Website-Wireframe.html v22 ด้วย headless Chrome (22 ต.ค. 2026) · ข้อมูลดิบ ห้ามแก้มือ · ตัวแปลงอยู่ที่ scripts/v22-product-pages.mjs' }
for (const id of IDS) {
  await send('Page.navigate', { url: F + '#' + id }); await sleep(1500)
  out[id] = await ev(`(()=>{const T=e=>e?e.textContent.replace(/\\s+/g,' ').trim():'';
   const own=(el,sel)=>[...el.querySelectorAll(sel)];
   const ph=(el)=>{const p=el.querySelector('.ph'); if(!p) return null; const s=p.querySelector('small'); return {t:T(p.firstChild&&p.firstChild.nodeType===3?{textContent:p.firstChild.textContent}:p).replace(T(s),'').trim(), small:T(s)}};
   const hero=document.querySelector('.wf-hero');
   const res={hero:{kicker:T(hero.querySelector('.wf-kicker')), h1:T(hero.querySelector('h1')), lead:T(hero.querySelector('.wf-lead')), buttons:own(hero,'.row .button, .row a').map(T), facts:[...document.querySelectorAll('.strip span')].map(T), toc:[...document.querySelectorAll('nav.v15-toc a')].map(a=>({t:T(a).replace(/\s*↗$/,''), key:(a.getAttribute('href')||'').split('-').slice(1).join('-')})), ph:ph(hero), all:T(hero)}};
   res.sections=[...document.querySelectorAll('main section.wf-section, body section.wf-section')].map((s,i)=>({
     key:((s.id||'').replace(/^[a-z]+-/,'')||('n'+i)).replace('customer-photos','photos'), h:T(s.querySelector('header h2, h2')),
     intro:own(s,':scope > p:not(.hint), :scope > header > p').map(T),
     hints:own(s,':scope p.hint, :scope .v15-note').map(T),
     cards:own(s,':scope .grid > *, :scope .steps > *').map(c=>({h:T(c.querySelector('h3,h4,strong')), p:own(c,'p').map(T), ph:ph(c), small:own(c,'small').map(T), cta:own(c,'a,button').map(T)})),
     lists:own(s,'ul').filter(u=>!u.closest('.faq')).map(u=>({h:T(u.previousElementSibling&&/H3|H4/.test(u.previousElementSibling.tagName)?u.previousElementSibling:null), items:own(u,'li').map(T)})),
     price:(()=>{const p=s.querySelector('.v15-price'); return p?{strong:T(p.querySelector('strong')), p:T(p.querySelector('p')), small:T(p.querySelector('small'))}:null})(),
     split:own(s,'.split > div:not(.ph)').map(d=>({h:T(d.querySelector('h3')), p:own(d,'p').map(T), links:own(d,'a').map(T)})),
     tables:own(s,'table').map(t=>({head:[...t.querySelectorAll('thead th')].map(T), rows:[...t.querySelectorAll('tbody tr')].map(r=>[...r.cells].map(T))})),
     faq:own(s,'details').map(d=>({q:T(d.querySelector('summary')), a:T(d.querySelector('p'))})),
     payment:own(s,'.v15-payment').map(p=>({h:T(p.querySelector('h3,h4,strong')), p:own(p,'p').map(T)})),
     links:own(s,'a,button').map(a=>({t:T(a), href:a.getAttribute('href')||'', brief:a.dataset.brief||''})).filter(x=>x.t),
     all:T(s)}));
   return res})()`)
}
writeFileSync(`/Users/artist/Documents/TEAMDEE WEB/docs/spec/teamdee-v22/extracted/${NAME}.json`, JSON.stringify(out, null, 1))
console.log(NAME, Object.entries(out).filter(([k]) => k[0] !== '_').map(([k, v]) => k + ':' + v.sections.length).join(' '))
}
} finally { await close() }
