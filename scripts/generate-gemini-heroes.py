#!/usr/bin/env python3
"""Generate 4 Gemini hero images via OpenRouter (gemini-2.5-flash-image), in parallel."""
import json, base64, os, subprocess, threading, urllib.request, sys

KEY_ENV = None
def load_key():
    global KEY_ENV
    env = {}
    for line in open("/root/ilali/.env.local"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    KEY_ENV = env.get("OPENROUTER_API_KEY", "")

PROMPTS = {
    "locations": "Cinematic editorial photography for a children's activities marketplace, two South African children exploring a nature trail with a guide, green fynbos and coastal scrub, Cape Town Table Mountain prominently visible in the background, bright sunny day with clear blue sky, joyful curious expressions, backpacks and hiking gear, premium family brand campaign style, warm cream and teal tones, generous negative space on the left side of frame for text overlay, photorealistic, shallow depth of field, no logos and no text, 8k",
    "safety": "Cinematic editorial photography for a children's activities marketplace, a warm friendly South African teacher or coach kneeling beside a young child, reassuring caring moment, bright airy classroom or sunny park setting, soft natural window light, warm cream and teal tones, child safety and trust feeling, generous negative space on the left side of frame for text overlay, photorealistic, shallow depth of field, no logos and no text, 8k",
    "provider-resources": "Cinematic editorial photography for a children's activities marketplace, a friendly South African soccer coach guiding a small team of kids on a green pitch, energetic joyful training session, warm golden afternoon light, Cape Town suburb in the background, kids listening and smiling, premium family brand campaign style, warm cream and teal tones, generous negative space on the left side of frame for text overlay, photorealistic, shallow depth of field, no logos and no text, 8k",
    "invite": "Cinematic editorial photography for a children's activities marketplace, three South African children playing a fun outdoor team game together, passing a ball, laughing and cooperating, sunny park with trees, warm golden light, diverse children of different ages, premium family brand campaign style, warm cream and teal tones, generous negative space on the left side of frame for text overlay, photorealistic, shallow depth of field, no logos and no text, 8k",
}

OUT_DIR = "/root/ilali/public/images/hero/gemini-v2"
os.makedirs(OUT_DIR, exist_ok=True)

def generate(name, prompt):
    payload = json.dumps({
        "model": "google/gemini-2.5-flash-image",
        "max_tokens": 2000,
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {KEY_ENV}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=150) as resp:
            d = json.loads(resp.read())
        imgs = d.get("choices", [{}])[0].get("message", {}).get("images", [])
        if imgs:
            url = imgs[0]["image_url"]["url"]
            if url.startswith("data:"):
                data = base64.b64decode(url.split(",", 1)[1])
                path = os.path.join(OUT_DIR, f"{name}.png")
                with open(path, "wb") as f:
                    f.write(data)
                print(f"{name}: SAVED {len(data)} bytes -> {path}", flush=True)
                return
        print(f"{name}: NO IMAGES: {json.dumps(d)[:300]}", flush=True)
    except Exception as e:
        print(f"{name}: ERROR {e}", flush=True)

load_key()
threads = []
for name, prompt in PROMPTS.items():
    t = threading.Thread(target=generate, args=(name, prompt))
    t.start()
    threads.append(t)
for t in threads:
    t.join()
print("ALL DONE", flush=True)
