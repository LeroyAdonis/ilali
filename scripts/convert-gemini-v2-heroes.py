#!/usr/bin/env python3
"""Convert Gemini v2 hero candidates (1024x1024 from OpenRouter) to art-directed
WebP crops: desktop 2:1 (2752x1376), mobile 4:3 (1100x825). Brighten a touch,
crop with subject bias, save WebP q80."""
import os
from PIL import Image, ImageEnhance
import numpy as np

RESAMPLE = Image.Resampling.LANCZOS

CAND = "/root/ilali/public/images/hero/gemini-v2"
OUT = "/root/ilali/public/images/hero"
MOBILE_W, MOBILE_H = 1100, 825      # 4:3
DESKTOP_W, DESKTOP_H = 2752, 1376   # 2:1

# (candidate, output base, mobile left-bias)
JOBS = [
    ("about.png", "hero-about", 0.40),
    ("invite.png", "hero-invite", 0.45),
    ("locations.png", "hero-locations", 0.45),
    ("provider-resources.png", "hero-provider-resources", 0.40),
    ("safety.png", "hero-safety", 0.50),
]

def brighten(im):
    im = ImageEnhance.Brightness(im).enhance(1.12)
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im = ImageEnhance.Color(im).enhance(1.03)
    arr = np.array(im).astype(np.float32)
    arr = 255.0 * (arr / 255.0) ** 0.9
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

for name, base, bias in JOBS:
    src = os.path.join(CAND, name)
    if not os.path.exists(src):
        print(f"SKIP {base}: no source {name}")
        continue
    im = Image.open(src).convert("RGB")
    im = brighten(im)

    desk = crop_to_ratio(im, 2, 1, 0.45).resize((DESKTOP_W, DESKTOP_H), RESAMPLE)
    desk_path = os.path.join(OUT, f"{base}-desktop.webp")
    desk.save(desk_path, "WEBP", quality=82, method=6)

    mob = crop_to_ratio(im, 4, 3, bias).resize((MOBILE_W, MOBILE_H), RESAMPLE)
    mob_path = os.path.join(OUT, f"{base}-mobile.webp")
    mob.save(mob_path, "WEBP", quality=82, method=6)

    print(f"{base}: {os.path.getsize(desk_path)//1024}KB desk, {os.path.getsize(mob_path)//1024}KB mob")
