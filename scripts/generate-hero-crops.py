#!/usr/bin/env python3
"""Generate art-directed WebP crops of the Gemini landing hero.

Source: /root/ilali-landing-page-banner.png (2752x1536, 1.79:1)
Outputs:
  - public/images/hero/hero-landing-desktop.webp  (2:1, full width, left negative space kept)
  - public/images/hero/hero-landing-mobile.webp   (4:3, subject-biased, for <=640px viewports)

Composition rules (from the approved Aug 2 concept):
  - Kids/action on the RIGHT, negative space LEFT (headline + warm gradient overlay).
  - Desktop: wide cinematic scene, full width.
  - Mobile: tighter crop zoomed toward the subject, still leaving enough
    left-side room for the gradient + headline.
"""
import os
from PIL import Image

SRC = "/root/ilali-landing-page-banner.png"
OUT_DIR = "/root/ilali/public/images/hero"

MOBILE_W, MOBILE_H = 1100, 825      # 4:3
DESKTOP_W, DESKTOP_H = 2752, 1376   # 2:1 (full source width)

# Mobile crop bias: fraction of the extra width to cut from the LEFT.
# 0.0 = center crop, 0.5 = cut half the slack from the left (bias right).
# Tune after vision QA.
MOBILE_LEFT_BIAS = 0.35


def crop_to_ratio(im, ratio_w, ratio_h, left_bias=0.0):
    w, h = im.size
    target = ratio_w / ratio_h
    cur = w / h
    if cur > target:  # too wide → crop width
        new_w = int(h * target)
        slack = w - new_w
        x = int(slack * left_bias)
        box = (x, 0, x + new_w, h)
    else:  # too tall → crop height (center)
        new_h = int(w / target)
        y = (h - new_h) // 2
        box = (0, y, w, y + new_h)
    return im.crop(box)


def main():
    im = Image.open(SRC).convert("RGB")
    print(f"Source: {im.size}")

    os.makedirs(OUT_DIR, exist_ok=True)

    # Desktop: 2:1, full width — keep the wide cinematic scene.
    desktop = crop_to_ratio(im, 2, 1)
    desktop = desktop.resize((DESKTOP_W, DESKTOP_H), Image.LANCZOS)
    desk_path = os.path.join(OUT_DIR, "hero-landing-desktop.webp")
    desktop.save(desk_path, "WEBP", quality=80, method=6)
    print(f"Desktop {desktop.size} -> {desk_path} ({os.path.getsize(desk_path)//1024} KB)")

    # Mobile: 4:3, biased right toward the kids.
    mobile = crop_to_ratio(im, 4, 3, left_bias=MOBILE_LEFT_BIAS)
    mobile = mobile.resize((MOBILE_W, MOBILE_H), Image.LANCZOS)
    mob_path = os.path.join(OUT_DIR, "hero-landing-mobile.webp")
    mobile.save(mob_path, "WEBP", quality=80, method=6)
    print(f"Mobile  {mobile.size} -> {mob_path} ({os.path.getsize(mob_path)//1024} KB)")


if __name__ == "__main__":
    main()
