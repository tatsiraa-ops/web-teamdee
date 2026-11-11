# ตัดรูปแบบเสื้อพิมพ์ลายสำหรับหน้าแรก (9 พ.ย. 2026 อาร์ต "ทำให้ดีๆ ไม่ต้องเจนใหม่")
# ลบพื้นตาราง/แถบ TEAMDEE หัวท้าย · ครอปชิดตัวเสื้อ · วางกลางกรอบ 4:3 ขาวเท่ากันทุกใบ → public/img/design-home/<code>-{720,480}.webp
import json, os, sys
from PIL import Image, ImageChops
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pub = os.path.join(root, 'public')
designs = [d for d in json.load(open(os.path.join(root, 'src/data/designs.json'), encoding='utf-8')) if 'print' in (d.get('product') or [])]
# 10 พ.ย. แบบจากแกลเลอรีเว็บเดิม (live-gallery.json · ไม่มีรหัส) ครอปชุดเดียวกัน → g-<กลุ่ม>-<ลำดับ> · ใช้เติมกลุ่มที่แบบน้อย (อาร์ต "รวบรวมรูปมาให้เต็มๆ ทุกหมวด")
import glob
only = sys.argv[1] if len(sys.argv) > 1 else ''
home = json.load(open(os.path.join(root, 'src/data/home.json'), encoding='utf-8'))
keep = sorted({k for ks in home['gallery'].get('extra', {}).values() for k in ks})
for k in keep:
    g, n = k.split('-')
    designs.append({'code': f'g-{k}', 'img': f'/img/gallery/{g}/{n}.webp'})
# ลบไฟล์ g-* ที่ไม่ได้ใช้แล้ว (เอาออกจาก extra)
for f in glob.glob(os.path.join(pub, 'img/design-home/g-*.webp')):
    if os.path.basename(f).rsplit('-', 1)[0][2:] not in keep: os.remove(f)
if only == 'gallery': designs = [d for d in designs if d['code'].startswith('g-')]
out = os.path.join(pub, 'img/design-home'); os.makedirs(out, exist_ok=True)
for d in designs:
    src = d['img']
    clean = src.replace('/img/design/', '/img/design-clean/').rsplit('.', 1)[0] + '.webp'
    if src.startswith('/img/design/d') and os.path.exists(pub + clean): src = clean
    im = Image.open(pub + src).convert('RGB'); w, h = im.size
    if '/download-designs/' in src or '/img/gallery/' in src: im = im.crop((0, int(h * .19), w, int(h * .87)))  # แถบโลโก้ TEAMDEE หัว + แถบข้อมูลท้าย
    # พื้นหลัง = พิกเซลเกือบขาวสีจาง (พื้นตาราง เส้นจาง) ที่ต่อกับขอบภาพ → ขาวล้วน · ในตัวเสื้อสีขาวไม่โดน (ไม่ต่อกับขอบ)
    W, H = im.size
    lum = im.convert('L')
    sat = ImageChops.difference(lum.convert('RGB'), im).convert('L')
    bgish = Image.eval(ImageChops.lighter(lum.point(lambda v: 0 if v >= 226 else 255), sat.point(lambda v: 255 if v > 14 else 0)), lambda v: 0 if v else 255)
    from PIL import ImageDraw
    for x in range(0, W, 12):
        for y in (0, H - 1):
            if bgish.getpixel((x, y)) == 255: ImageDraw.floodfill(bgish, (x, y), 128)
    for y in range(0, H, 12):
        for x in (0, W - 1):
            if bgish.getpixel((x, y)) == 255: ImageDraw.floodfill(bgish, (x, y), 128)
    bg = bgish.point(lambda v: 255 if v == 128 else 0)
    im = Image.composite(Image.new('RGB', im.size, 'white'), im, bg)
    keep = ImageChops.invert(bg)
    box = keep.getbbox() or (0, 0, W, H)
    im = im.crop(box)
    cw, ch = im.size
    # กรอบ 4:3 เว้นขอบ 6%
    tw = max(cw / .88, ch / .88 * 4 / 3); th = tw * 3 / 4
    canvas = Image.new('RGB', (int(tw), int(th)), 'white')
    canvas.paste(im, ((int(tw) - cw) // 2, (int(th) - ch) // 2))
    for size in (1200, 720, 480):  # 1200 = กล่องดูรูปใหญ่
        canvas.resize((size, size * 3 // 4), Image.LANCZOS).save(os.path.join(out, f"{d['code']}-{size}.webp"), quality=82, method=6)
print(len(designs), 'แบบ')
