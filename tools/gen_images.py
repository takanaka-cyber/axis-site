#!/usr/bin/env python3
"""Generate AXIS site visuals via fal.ai GPT Image 2, save to assets/img as webp."""
import os
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import fal_client

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
RAW = ROOT / "tools" / "_raw"
OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)

STYLE = (
    "Dark moody minimal abstract 3D render, cinematic studio lighting, "
    "deep charcoal near-black background, high-end design agency moodboard aesthetic, "
    "subtle film grain, photorealistic CGI, no text, no letters, no watermark, no logo."
)

# name, prompt, quality, max output width
IMAGES = [
    ("services_web", "Sculpture of fragmented translucent glass shards with glowing electric blue wireframe edges, floating and exploding outward in dark void, deep blue tones.", "high", 1280),
    ("services_marketing", "Lone human silhouette standing before a giant glowing circle, dramatic sunset gradient sky from magenta pink to violet and deep orange, dark foreground, cinematic scale.", "high", 1280),
    ("services_film", "Cluster of dark volcanic rocks floating in black void, thin teal cyan rim light tracing their edges, faint mist.", "high", 1280),
    ("flow_listen", "Macro close-up of porous organic coral-like structure in pale grey, dramatic raking side light on black background.", "medium", 800),
    ("flow_read", "Abstract dark sand dunes with soft silver moonlight, smooth flowing curves, macro scale.", "medium", 800),
    ("flow_define", "Spiral nautilus form carved in dark matte stone, single narrow beam of cool light from above.", "medium", 800),
    ("flow_architect", "Long-exposure light streak forming a sweeping architectural arc in dark space, thin white line of light.", "medium", 800),
    ("flow_craft", "Matte black pyramid prism with one thin spectral rainbow refraction line across it, black background.", "medium", 800),
    ("flow_grow", "Fine particles of warm light ascending like dust in a dark void, shallow depth of field, upward motion.", "medium", 800),
    ("works_launch", "Minimal concrete gallery interior bathed in deep blue light, single glowing doorway at the end, volumetric haze.", "high", 1024),
    ("works_traffic", "Looking up at a dark glass skyscraper facade at dusk, deep blue reflective panels, dramatic perspective.", "high", 1024),
    ("works_brand", "Abstract curved white architectural ribbons flowing on dark background, soft studio light, elegant minimal forms.", "high", 1024),
    ("works_oneteam", "Symmetrical geometric ceiling pattern of dark metal beams and frosted glass, looking straight up, moody blue-grey light.", "high", 1024),
    ("works_experience", "Surreal liquid gold metallic blobs floating over a warm beige-bronze gradient background, soft reflections.", "high", 1024),
    ("philosophy", "Lighthouse beam cutting diagonally through dark fog at night, tiny human silhouette below, monochrome with faint cold teal cast, cinematic.", "high", 1280),
    ("contact", "Planet eclipse seen from space, ultra dark sphere with a thin warm orange rim light on its lower edge, sparse faint stars, vast black space.", "high", 1280),
]

FFMPEG = os.path.expanduser("~/.local/bin/ffmpeg")


def gen(name: str, prompt: str, quality: str, width: int) -> str:
    dest = OUT / f"{name}.webp"
    if dest.exists():
        return f"skip {name}"
    args = {"prompt": f"{prompt} {STYLE}", "image_size": "1536x1024", "quality": quality, "num_images": 1}
    try:
        res = fal_client.subscribe("openai/gpt-image-2", arguments=args)
    except Exception:
        # retry without optional params in case the endpoint rejects them
        res = fal_client.subscribe("openai/gpt-image-2", arguments={"prompt": f"{prompt} {STYLE}"})
    url = res["images"][0]["url"]
    raw = RAW / f"{name}.png"
    urllib.request.urlretrieve(url, raw)
    subprocess.run(
        [FFMPEG, "-y", "-i", str(raw), "-vf", f"scale={width}:-2", "-quality", "82", str(dest)],
        check=True, capture_output=True,
    )
    return f"ok   {name} -> {dest.name}"


def main():
    if not os.environ.get("FAL_KEY"):
        sys.exit("FAL_KEY not set")
    errors = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen, *spec): spec[0] for spec in IMAGES}
        for fut in as_completed(futs):
            name = futs[fut]
            try:
                print(fut.result(), flush=True)
            except Exception as e:
                errors.append(name)
                print(f"FAIL {name}: {e}", flush=True)
    if errors:
        sys.exit(f"failed: {', '.join(errors)}")
    print("all done")


if __name__ == "__main__":
    main()
