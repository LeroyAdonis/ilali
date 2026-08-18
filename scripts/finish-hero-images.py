#!/usr/bin/env python3
"""Finish hero-image conversion: brighten FLUX candidates, crop to art-directed
WebP (2:1 desktop 2752x1376, 4:3 mobile 1100x825), per ILALI pipeline."""
import os
from PIL import Image, ImageEnhance
import numpy as np

CAND = "/root/ilali/public/images/hero/gemini-candidates"
OUT = "/root/ilali/public/images/hero"
MOBILE_W, MOBILE_H = 1100, 825      # 4:3
DESKTOP_W, DESKTOP_H = 2752, 1376   # 2:1

# (candidate, output base, mobile left-bias)
JOBS = [
    ("about-1-seed3303.png", "hero-about", 0.40),
    ("invite-seed2001.png", "hero-invite", 0.45),
    ("locations-3-seed9909.png", "hero-locations", 0.45),
    ("provider-resources-1-seed1010.png", "hero-provider-resources", 0.40),
    ("safety-2-seed5505.png", "hero-safety", 0.50),
]

def brighten(im):
    """FLUX comes out dark — lift brightness/contrast/color, gamma-lift shadows."""
    im = ImageEnhance.Brightness(im).enhance(1.4)
    im = ImageEnhance.Contrast(im).enhance(1.1)
    im = ImageEnhance.Color(im).enhance(1.05)
    arr = np.array(im).astype(np.float32)
    arr = 255.0 * (arr / 255.0) ** 0.85
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

def crop_to_ratio(im, rw, rh, left_bias=0.0):
    w, h = im.size
    target = rw / rh
    cur = w / h
    if cur > target:
        new_w = int(h * target)
        slack = w - new_w
        x = int(slack * left_bias)
        return im.crop((x, 0, x + new_w, h))
    new_h = int(w / target)
    y = (h - new_h) // 2
    return im.crop((0, y, w, y + new_h))

def lum(im):
    return sum(im.convert("L").resize((50, 50)).getdata()) / (50 * 50)

for name, base, bias in JOBS:
    src = os.path.join(CAND, name)
    im = Image.open(src).convert("RGB")
    before = lum(im)
    im = brighten(im)
    after = lum(im)

    desk = crop_to_ratio(im, 2, 1, 0.45).resize((DESKTOP_W, DESKTOP_H), Image.LANCZOS)
    desk_path = os.path.join(OUT, f"{base}-desktop.webp")
    desk.save(desk_path, "WEBP", quality=80, method=6)

    mob = crop_to_ratio(im, 4, 3, bias).resize((MOBILE_W, MOBILE_H), Image.LANCZOS)
    mob_path = os.path.join(OUT, f"{base}-mobile.webp")
    mob.save(mob_path, "WEBP", quality=80, method=6)

    print(f"{base}: lum {before:.0f} -> {after:.0f} | {os.path.getsize(desk_path)//1024}KB desk, {os.path.getsize(mob_path)//1024}KB mob")
