#!/usr/bin/env python3
"""Generate art-directed WebP crops for ILALI club (provider) hero images.

Source: 2752x1536 Gemini PNGs/JPGs (1.79:1)
Outputs (per club slug):
  - public/images/hero/club-{slug}-desktop.webp  (2:1, full width, center vertical)
  - public/images/hero/club-{slug}-mobile.webp   (4:3, right-biased toward kids/action)

Composition rules (approved Gemini hero register):
  - Action/faces on the RIGHT, negative space LEFT (headline + warm gradient overlay).
  - Desktop: wide cinematic scene, full width.
  - Mobile: tighter crop zoomed toward the subject, still leaving left-side room.
"""
import os
import sys
from PIL import Image

SRC_DIR = "/tmp/clubs-hero/clubs-hero-images"
OUT_DIR = "/root/ilali/public/images/hero"

# uploaded file -> registry slug
FILES = {
    "soccer-stars.jpg": "soccer-stars-academy",
    "piano-pathway.jpg": "piano-pathways",
    "codecubs.jpg": "codecubs-programming-club",
    "aquaKids.jpg": "aquakids-swimming",
    "ScienceLab.jpg": "sciencelab-explorers",
}

MOBILE_W, MOBILE_H = 1100, 825      # 4:3
DESKTOP_W, DESKTOP_H = 2752, 1376   # 2:1 (full source width)

# Mobile crop bias: fraction of extra width to cut from the LEFT.
# 0.0 = center crop, 0.5 = cut half the slack from the left (bias right).
MOBILE_LEFT_BIAS = 0.35


def crop_to_ratio(im, ratio_w, ratio_h, left_bias=0.0):
    w, h = im.size
    target = ratio_w / ratio_h
    cur = w / h
    if cur > target:  # too wide -> crop width
        new_w = int(h * target)
        slack = w - new_w
        x = int(slack * left_bias)
        box = (x, 0, x + new_w, h)
    else:  # too tall -> crop height (center)
        new_h = int(w / target)
        y = (h - new_h) // 2
        box = (0, y, w, y + new_h)
    return im.crop(box)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    only = sys.argv[1:] if len(sys.argv) > 1 else list(FILES.keys())
    for fname in only:
        if fname not in FILES:
            print(f"SKIP unknown file: {fname}")
            continue
        slug = FILES[fname]
        src = os.path.join(SRC_DIR, fname)
        if not os.path.exists(src):
            print(f"SKIP missing: {src}")
            continue
        im = Image.open(src).convert("RGB")
        # Desktop 2:1, full width
        desktop = crop_to_ratio(im, 2, 1)
        desktop = desktop.resize((DESKTOP_W, DESKTOP_H), Image.LANCZOS)
        desk_path = os.path.join(OUT_DIR, f"club-{slug}-desktop.webp")
        desktop.save(desk_path, "WEBP", quality=80, method=6)
        # Mobile 4:3, right-biased
        mobile = crop_to_ratio(im, 4, 3, left_bias=MOBILE_LEFT_BIAS)
        mobile = mobile.resize((MOBILE_W, MOBILE_H), Image.LANCZOS)
        mob_path = os.path.join(OUT_DIR, f"club-{slug}-mobile.webp")
        mobile.save(mob_path, "WEBP", quality=80, method=6)
        print(f"{fname} -> {slug}: desktop {desktop.size} ({os.path.getsize(desk_path)//1024} KB), "
              f"mobile {mobile.size} ({os.path.getsize(mob_path)//1024} KB)")


if __name__ == "__main__":
    main()
