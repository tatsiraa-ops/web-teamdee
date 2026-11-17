#!/usr/bin/env python3
"""รูปแชร์ (og:image) JPG 1200×630 รายหน้า · 17 พ.ย. 2026 แผน SEO/GEO ข้อ A8 · tests/og-images.test.js

ใช้: python3 scripts/make-og.py           สร้างเฉพาะหน้าที่ยังไม่มีรูป
     python3 scripts/make-og.py --force   สร้างใหม่ทุกหน้า
     python3 scripts/make-og.py /sport/   สร้างใหม่เฉพาะหน้าที่ระบุ

ต้นทาง = รูปแชร์ที่หน้านั้นใช้อยู่ใน dist-wp (รูปแรกของเนื้อหา) → ใช้ไฟล์ใหญ่สุดที่มี → ครอปแบบเต็มกรอบกึ่งกลาง 1200×630 → public/img/og/<slug>.jpg
หน้าแรกมีรูปของตัวเองอยู่แล้ว (home.jpg) ไม่แตะ · รันหลัง npm run export:wp แล้ว export อีกรอบให้หน้าใช้รูปใหม่
อยากได้รูปอื่นสำหรับหน้าไหน: วาง JPG 1200×630 ชื่อ <slug>.jpg ใน public/img/og/ ทับได้เลย
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
OUT = PUBLIC / 'img' / 'og'
W, H = 1200, 630


def source_for(route: str):
    html = ROOT / 'dist-wp' / route.strip('/') / 'index.html' if route != '/' else ROOT / 'dist-wp' / 'index.html'
    text = html.read_text('utf-8')
    m = re.search(r'<meta property="og:image" content="[^"]*?(/img/[^"]+)"', text)
    path = m.group(1) if m else None
    if not path or path.startswith('/img/og/'):
        # มีรูป og แล้ว → หาต้นทางจากรูปแรกในเนื้อหา (<main>) กฎเดียวกับ build (src/build/plugins.js seoTags)
        main = text[text.find('<main'):] if '<main' in text else ''
        mi = re.search(r'<img[^>]+src="[^"]*?(/img/[^"]+)"', main)
        if not mi:
            return None
        path = mi.group(1)
    stem = re.sub(r'-(?:\d{3,4})(\.\w+)$', r'\1', path)  # ตัดขนาดท้ายชื่อ หาไฟล์ใหญ่สุด
    base, _ = stem.rsplit('.', 1)
    cands = [path] + [f'{base}{s}.{e}' for s in ('', '-1600', '-1280', '-1200') for e in ('jpg', 'webp', 'png')]
    found = [PUBLIC / c.lstrip('/') for c in cands if (PUBLIC / c.lstrip('/')).exists()]
    return max(found, key=lambda p: Image.open(p).size[0]) if found else None


def cover(src: Path, dst: Path):
    im = Image.open(src).convert('RGB')
    scale = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    # แบนเนอร์ hero หน้ากลุ่มลูกค้า/หน้าสินค้า: ข้อความซ้าย คนกับเสื้ออยู่ซีกขวา → ครอปชิดขวา (กลางภาพเป็นพื้นว่าง)
    if re.search(r'/(use-hero|pp-hero)/', str(src)):
        x = im.width - W
    im.crop((x, y, x + W, y + H)).save(dst, 'JPEG', quality=82, optimize=True, progressive=True)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv
    pages = json.loads((ROOT / 'wp-theme/teamdee/build/pages.json').read_text('utf-8'))['pages']
    OUT.mkdir(parents=True, exist_ok=True)
    made = []
    for route, p in pages.items():
        if not route.startswith('/') or 'noindex' in (p.get('robots') or '') or route == '/':
            continue
        if args and route not in args:
            continue
        dst = OUT / f"{p['slug']}.jpg"
        if dst.exists() and not force and not args:
            continue
        src = source_for(route)
        if not src:
            print(f'ข้าม {route}: ไม่พบรูปต้นทาง')
            continue
        cover(src, dst)
        made.append((route, src.relative_to(PUBLIC)))
    for r, s in made:
        print(f'{r} ← {s}')
    print(f'สร้าง {len(made)} รูป → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
