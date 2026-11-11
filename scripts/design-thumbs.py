"""ภาพย่อการ์ดแบบเสื้อหน้า /designs/ ให้เสื้อเต็มการ์ด 3:2 (อาร์ต 6 พ.ย. "ทำรูปให้มันเต็มๆหน่อย")
ใช้: python3 scripts/design-thumbs.py  → public/img/design-thumb/<ชื่อ>-1080.webp + -540.webp (เฉพาะภาพที่ไม่ใช่ 3:2)
- บอร์ดแม่แบบ TEAMDEE (embroider-* + brand/loose ที่มีโลโก้ส้มกลางบน · is_board): เลย์เอาต์เดียวกันทุกแผ่น → ตัดหัวโลโก้ (บน 17%) และแถบติดต่อ (ล่าง 16.3%) ออกพอดี 3:2
- ภาพอื่น (3d-* พื้นดำ · brand/loose บอร์ด · เบสบอลตัวเดียว): หาขอบเสื้อจากสีพื้น (มุมภาพ) ตัดแถว/คอลัมน์ที่มีเนื้อน้อย (ตัวหนังสือเล็กท้ายบอร์ด)
  แล้วตีกรอบ 3:2 คลุมเสื้อ + ขอบ 5% · กรอบเกินภาพ = เติมสีพื้นเดิม (ไม่ตัดคอ/ชายเสื้อ)
ไม่แก้ภาพต้นฉบับ (กดดูภาพใหญ่ยังเป็นไฟล์เต็ม)"""
import json, os
import numpy as np
from PIL import Image

OUT = 'public/img/design-thumb'
os.makedirs(OUT, exist_ok=True)


def is_board(im):
    """บอร์ดแม่แบบ TEAMDEE (โลโก้ส้มกลางบน + แถบติดต่อล่าง) · ใช้กับ brand/loose ที่ทำจากแม่แบบเดียวกับงานปัก"""
    a = np.asarray(im).astype(int); H, W, _ = a.shape
    top = a[: int(H * .15), int(W * .38): int(W * .62)]
    r, g, b = top[..., 0], top[..., 1], top[..., 2]
    orange = (r > 200) & (g > 70) & (g < 150) & (b < 80)
    return W / H < 1.2 and orange.mean() > .003


def thumb(im, name):
    W, H = im.size
    if name.startswith('embroider-') or is_board(im):
        h = W / 1.5; top = H * .17
        return im.crop((0, round(top), W, round(top + h)))
    a = np.asarray(im).astype(int)
    bg = np.median(np.array([a[4, 4], a[4, -5], a[-5, 4], a[-5, -5]]), axis=0)
    m = np.abs(a - bg).max(axis=2) > 36
    rows = np.nonzero(m.mean(axis=1) > .02)[0]; cols = np.nonzero(m.mean(axis=0) > .02)[0]
    if not len(rows) or not len(cols): return None
    y0, y1, x0, x1 = rows.min(), rows.max(), cols.min(), cols.max()
    bw, bh = (x1 - x0) * 1.10, (y1 - y0) * 1.10
    if bw / bh > 1.5: bh = bw / 1.5
    else: bw = bh * 1.5
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    box = [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2]
    canvas = Image.new('RGB', (round(bw), round(bh)), tuple(int(v) for v in bg))
    sx, sy = max(0, round(box[0])), max(0, round(box[1]))
    ex, ey = min(W, round(box[2])), min(H, round(box[3]))
    canvas.paste(im.crop((sx, sy, ex, ey)), (sx - round(box[0]), sy - round(box[1])))
    return canvas


done = {}
for d in json.load(open('src/data/designs.json')):
    src = 'public' + d['img']
    if not os.path.exists(src): continue
    im = Image.open(src).convert('RGB'); W, H = im.size
    if abs(W / H - 1.5) < .05: continue
    name = os.path.basename(d['img']).rsplit('.', 1)[0]
    t = thumb(im, name)
    if t is None: continue
    t.resize((1080, 720), Image.LANCZOS).save(f'{OUT}/{name}-1080.webp', quality=84)
    t.resize((540, 360), Image.LANCZOS).save(f'{OUT}/{name}-540.webp', quality=84)
    done[d['code']] = name
print(json.dumps({'n': len(done)}, ensure_ascii=False))
