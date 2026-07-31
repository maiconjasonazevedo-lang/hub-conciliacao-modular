from PIL import Image
import sys
from pathlib import Path

assets = Path(__file__).parent.parent / 'assets'
# find original image (prefer large png/jpg not favicon)
candidates = [p for p in assets.iterdir() if p.suffix.lower() in ('.png','.jpg','.jpeg') and 'favicon' not in p.name.lower()]
if not candidates:
    print('No source image found in assets. Place a PNG/JPG in assets and rerun.')
    sys.exit(1)
# choose the largest file by filesize
src = max(candidates, key=lambda p: p.stat().st_size)
print('Using source:', src.name)
img = Image.open(src).convert('RGBA')

# create square thumbnail by fitting and centering
def make_square(im, size, bgcolor=(0,0,0,0)):
    w,h = im.size
    if w == h:
        return im.resize((size,size), Image.LANCZOS)
    # fit into size preserving aspect and pad
    im.thumbnail((size,size), Image.LANCZOS)
    new = Image.new('RGBA', (size,size), bgcolor)
    nx, ny = im.size
    new.paste(im, ((size-nx)//2, (size-ny)//2), im if im.mode=='RGBA' else None)
    return new

# generate pngs
sizes = [32,16]
for s in sizes:
    out = assets / f'favicon-{s}.png'
    sq = make_square(img.copy(), s)
    sq.save(out)
    print('Wrote', out.name)

# generate ico containing multiple sizes
ico_path = assets / 'favicon.ico'
# PIL can save ICO with multiple sizes by passing list of images
ico_images = [make_square(img.copy(), s) for s in [64,32,16]]
# convert to RGB for ICO
ico_images_rgb = [im.convert('RGB') for im in ico_images]
ico_images_rgb[0].save(ico_path, format='ICO', sizes=[(64,64),(32,32),(16,16)])
print('Wrote', ico_path.name)
