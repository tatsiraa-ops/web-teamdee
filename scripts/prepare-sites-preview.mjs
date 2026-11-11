import { readdir, readFile, writeFile, mkdir, cp, stat } from 'node:fs/promises'
import path from 'node:path'
import { isExported } from './seo-check.mjs'

const source = path.resolve('dist-wp')
const target = path.resolve('sites/teamdee-preview-20261027/dist')
const pages = []
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full)
    else if (entry.name.endsWith('.html')) pages.push(path.relative(source, full))
  }
}
await walk(source)
const routeFor = file => '/' + file.replace(/index\.html$/, '')
const selected = pages.filter(file => isExported(routeFor(file)))
const routes = new Set(selected.map(routeFor))
await mkdir(target, { recursive: true })
for (const name of ['assets', 'img', 'logo', 'files', 'favicon.svg', 'apple-touch-icon.png']) {
  await cp(path.join(source, name), path.join(target, name), { recursive: true })
}
let externalLinks = 0
for (const file of selected) {
  let html = await readFile(path.join(source, file), 'utf8')
  html = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<meta\b[^>]*name="robots"[^>]*>/gi, '')
    .replace('</head>', '<meta name="robots" content="noindex,nofollow"><script src="/preview-notice.js" defer></script></head>')
    .replace(/(<a\b[^>]*\bhref=")([^"#]+)(")/gi, (whole, start, href, end) => {
      if (!href.startsWith('/') || href.startsWith('//')) return whole
      const pathname = href.split(/[?#]/)[0]
      if (routes.has(pathname) || routes.has(pathname + '/') || /\.[a-z0-9]+$/i.test(pathname)) return whole
      externalLinks++
      return start + 'https://team-dee.com' + href + end
    })
  await mkdir(path.dirname(path.join(target, file)), { recursive: true })
  await writeFile(path.join(target, file), html)
}
await writeFile(path.join(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
await writeFile(path.join(target, 'preview-notice.js'), `
const notice = document.createElement('div');
notice.textContent = 'เว็บไซต์ทดลอง · ฟอร์มยังไม่ส่งข้อมูลจริง · ปุ่ม LINE / โทร และบทความบางหน้าเปิดช่องทางจริง';
notice.setAttribute('role', 'note');
notice.style.cssText = 'position:relative;z-index:1;padding:10px 18px;background:#fff0df;color:#713406;text-align:center;font:13px/1.6 sans-serif';
document.body.append(notice);
const form = document.querySelector('form');
if (location.pathname.startsWith('/contact-us') && form) {
  const note = notice.cloneNode(true);
  note.textContent = 'หน้านี้สำหรับทดลองกรอกเท่านั้น ยังไม่เชื่อมระบบรับข้อมูล กรุณาอย่ากรอกข้อมูลส่วนบุคคลจริง';
  form.before(note);
  form.addEventListener('submit', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    note.textContent = 'ทดลองสำเร็จ — ไม่มีการส่งข้อมูลไปยังทีมดี';
    note.scrollIntoView({block:'center',behavior:'smooth'});
  }, true);
}
`)
let checked = 0
for (const file of selected) {
  const html = await readFile(path.join(target, file), 'utf8')
  if (!html.includes('noindex,nofollow')) throw new Error('Missing noindex: ' + file)
  for (const match of html.matchAll(/(?:src|href)="(\/(?:assets|img|logo|files)\/[^"?#]+)[^"]*"/g)) {
    await stat(path.join(target, decodeURI(match[1])))
    checked++
  }
}
console.log(JSON.stringify({ pages: selected.length, assetReferencesChecked: checked, linksToLiveCMS: externalLinks, target }))
