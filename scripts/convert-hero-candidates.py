#!/usr/bin/env python3
"""Convert Gemini hero candidates to art-directed WebP crops.

Follows the same pipeline as generate-hero-crops.py:
  - Desktop: 2:1, full width (source is 2752x1536 = 1.79:1)
  - Mobile:  4:3 at 1100x825, biased toward the subject (right side for
    these two images per edge-density analysis: for-providers COM 0.54,
    contact COM 0.57; left thirds are negative space).

Usage: python3 scripts/convert-hero-candidates.py
"""
import os
from PIL import Image

CANDIDATES = "/root/ilali/public/images/hero/gemini-candidates"
OUT_DIR = "/root/ilali/public/images/hero"

JOBS = [
    # (candidate name, output base, mobile left-bias)
    ("for-providers", "hero-for-providers", 0.40),
    ("contact", "hero-contact", 0.50),
]

MOBILE_W, MOBILE_H = 1100, 825      # 4:3
DESKTOP_W, DESKTOP_H = 2752, 1376   # 2:1


def crop_to_ratio(im, ratio_w, ratio_h, left_bias=0.0):
    w, h = im.size
    target = ratio_w / ratio_h
    cur = w / h
    if cur > target:  # too wide -> crop width
        new_w = int(h * target)
        slack = w - new_w
        x = int(slack * left_bias)
        return im.crop((x, 0, x + new_w, h))
    new_h = int(w / target)
    y = (h - new_h) // 2
    return im.crop((0, y, w, y + new_h))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, base, left_bias in JOBS:
        src = os.path.join(CANDIDATES, f"{name}.png")
        im = Image.open(src).convert("RGB")
        print(f"{name}: source {im.size}")

        desktop = crop_to_ratio(im, 2, 1).resize((DESKTOP_W, DESKTOP_H), Image.LANCZOS)
        desk_path = os.path.join(OUT_DIR, f"{base}-desktop.webp")
        desktop.save(desk_path, "WEBP", quality=80, method=6)
        print(f"  desktop -> {desk_path} ({os.path.getsize(desk_path)//1024} KB)")

        mobile = crop_to_ratio(im, 4, 3, left_bias=left_bias).resize((MOBILE_W, MOBILE_H), Image.LANCZOS)
        mob_path = os.path.join(OUT_DIR, f"{base}-mobile.webp")
        mobile.save(mob_path, "WEBP", quality=80, method=6)
        print(f"  mobile  -> {mob_path} ({os.path.getsize(mob_path)//1024} KB)")


if __name__ == "__main__":
    main()
