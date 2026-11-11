"""ตัดเฉพาะเสื้อด้านหน้าจากภาพแบบคู่ (หน้า+หลัง) ให้การ์ดแบบเสื้อ /sublimation/ (อาร์ต 6 พ.ย. "เอาแค่ด้านหน้าเสื้อ ไม่เอาคำ")
ใช้: python3 scripts/design-fronts.py <path ภาพเต็ม /img/...> ...  → public/img/design-front/<ชื่อ>-720.webp + พิมพ์ JSON {path: front|null}
ภาพคู่ = กว้าง/สูง > 1.2 หรือพื้นดำ 3d-* (loose-* = ภาพเดี่ยวเสมอ → null ใช้ภาพเดิม)
วิธี (พื้นขาว d*): ตัวหน้าอยู่ซ้ายและสมมาตร → แกนกลาง = กึ่งกลางคอเสื้อ · ทีละแถว ขอบขวา = สะท้อนขอบซ้าย (+1.2%)
     อะไรเลยขอบนั้น (ตัวหลัง) ทาสีพื้นทับ → ครอป → วางกลางจัตุรัสสีพื้นเดิม
     พื้นดำ 3d-*: เสื้อสีเข้มกลืนพื้น ใช้ตัดครึ่งซ้าย 49% (ไม่มีตัวหลังล้ำ)
     เบสบอล ta-* (ม็อกอัปเดียวกันทุกแบบ พื้นซิกแซกเหมือนกันเป๊ะ): หน้ากากเสื้อ = พิกเซลที่สีต่างกันระหว่างภาพ ta-* ทั้งชุด
     → เอาก้อนตัวหน้า (ซ้าย) วางบนพื้นเรียบ ขอบนุ่ม 1px"""
import sys, json, os
import numpy as np
from PIL import Image


def front(im, simple):
    a = np.asarray(im).astype(int); H, W, _ = a.shape
    bg = a[H // 2, 4]
    m = np.abs(a - bg).max(axis=2) > 40
    half = int(W * .49); out = a.copy()
    ys, xs = np.nonzero(m[:, :half])
    if simple or not len(ys):  # พื้นดำ 3d-*: ตัดครึ่งซ้ายตรงๆ
        box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1); mode = 'half'
    else:
        y0 = ys.min(); fh = ys.max() - y0
        # แกนกลาง = กึ่งกลางคอเสื้อ (แถวบนสุด 4% ของตัวหน้า ในครึ่งซ้าย)
        cy = np.nonzero(m[y0: y0 + max(3, int(fh * .04)), :half])[1]; cx = (cy.min() + cy.max()) / 2
        pad = int(W * .012); right = 0; bottom = y0
        for y in range(H):
            row = np.nonzero(m[y])[0]
            if not len(row) or row[0] >= cx:  # แถวนี้ไม่มีตัวหน้า (ว่าง หรือเจอตัวหลังก่อน)
                if y > y0: out[y, int(cx):] = bg
                continue
            r = int(2 * cx - row[0]) + pad  # ขอบขวาของตัวหน้า = สะท้อนขอบซ้าย
            out[y, r:] = bg; right = max(right, r); bottom = y
        box = (xs.min(), y0, min(W, right), bottom + 1); mode = 'mirror'
    c = Image.fromarray(out.astype(np.uint8)).crop(box)
    s = int(max(c.size) * 1.1); sq = Image.new('RGB', (s, s), tuple(int(v) for v in bg))
    sq.paste(c, ((s - c.width) // 2, (s - c.height) // 2))
    return sq, mode


TA_BG = (255, 255, 255)  # อาร์ต 6 พ.ย. "เอาพื้นหลังขาวล้วน"
_ta_mask = None


def ta_mask():
    """หน้ากากตัวหน้า ใช้ร่วมทุกภาพ ta-* · พื้นหลังเหมือนกันทุกภาพ (ส่วนเบี่ยงเบน = 0) เสื้อแต่ละแบบสีต่างกัน"""
    global _ta_mask
    if _ta_mask is None:
        from PIL import ImageDraw, ImageFilter
        d = 'public/img/design'
        fs = sorted(f for f in os.listdir(d) if f.startswith('ta-') and f.endswith('.webp') and not f.endswith('-540.webp'))
        st = np.stack([np.asarray(Image.open(f'{d}/{f}').convert('RGB')).astype(np.int16) for f in fs])
        m = Image.fromarray(((st.std(axis=0).max(axis=2) > 4) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
        ImageDraw.floodfill(m, (0, 0), 128)  # พื้นนอกเสื้อ → 128 · ที่เหลือ (รวมรูในเสื้อ เช่น ป้ายชาย) = เสื้อ
        shirts = Image.fromarray(((np.asarray(m) != 128) * 255).astype(np.uint8)).copy()  # copy: fromarray แชร์หน่วยความจำ floodfill เขียนไม่ติด
        W, H = shirts.size
        ImageDraw.floodfill(shirts, (int(W * .2), int(H * .5)), 100)  # ก้อนตัวหน้า (ฝั่งซ้าย)
        _ta_mask = Image.fromarray(((np.asarray(shirts) == 100) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))
    return _ta_mask


def ta_front(im):
    a = ta_mask(); bb = a.getbbox()
    flat = Image.new('RGB', im.size, TA_BG); flat.paste(im, (0, 0), a)
    c = flat.crop(bb); s = int(max(c.size) * 1.1); sq = Image.new('RGB', (s, s), TA_BG)
    sq.paste(c, ((s - c.width) // 2, (s - c.height) // 2))
    return sq


res = {}
os.makedirs('public/img/design-front', exist_ok=True)
for src in sys.argv[1:]:
    im = Image.open('public' + src).convert('RGB'); W, H = im.size; base = os.path.basename(src)
    if base.startswith('loose-') or not (W / H > 1.2 or base.startswith('3d-')): res[src] = None; continue
    sq = ta_front(im) if base.startswith('ta-') else front(im, base.startswith('3d-'))[0]
    dst = f"/img/design-front/{base.rsplit('.', 1)[0]}-720.webp"
    sq.resize((720, 720), Image.LANCZOS).save('public' + dst, quality=84)
    res[src] = dst
print(json.dumps(res, ensure_ascii=False, indent=1))
