"""Build the light-pink plaster maps used by the wall. CC0-style, generated locally."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "public" / "textures"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 2048, 1180
RNG = np.random.default_rng(11)


def fbm(h, w, octaves, seed):
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    amp = 1.0
    total = 0.0
    for i in range(octaves):
        gh = 3 * (2**i)
        gw = max(2, int(round(gh * w / h)))
        grid = rng.random((gh, gw), dtype=np.float32)
        layer = Image.fromarray((grid * 255).astype(np.uint8), mode="L")
        layer = layer.resize((w, h), Image.Resampling.BICUBIC)
        acc += np.asarray(layer).astype(np.float32) / 255.0 * amp
        total += amp
        amp *= 0.52
    return acc / total


def normals(height, strength):
    dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * strength
    dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * strength
    nz = np.ones_like(height)
    length = np.sqrt(dx * dx + dy * dy + nz * nz)
    rgb = np.stack(
        ((-dx / length) * 0.5 + 0.5, (dy / length) * 0.5 + 0.5, (nz / length) * 0.5 + 0.5),
        axis=-1,
    )
    return (np.clip(rgb, 0, 1) * 255).astype(np.uint8)


grain = fbm(H, W, 6, 3)
stain = fbm(H, W, 4, 19)

pit_noise = RNG.random((H, W), dtype=np.float32)
pit_img = Image.fromarray((pit_noise * 255).astype(np.uint8), mode="L").filter(
    ImageFilter.GaussianBlur(1.1)
)
pits = np.asarray(pit_img).astype(np.float32) / 255.0
pits = np.clip((pits - 0.78) / 0.22, 0, 1)
pits = np.asarray(
    Image.fromarray((pits * 255).astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(1.4))
).astype(np.float32) / 255.0

crack_img = Image.new("L", (W, H), 0)
draw = ImageDraw.Draw(crack_img)


def walk(x, y, steps, width, angle, branch):
    points = [(x, y)]
    for i in range(steps):
        angle += float(RNG.normal(0, 0.16))
        x += np.cos(angle) * float(RNG.uniform(7, 16))
        y += np.sin(angle) * float(RNG.uniform(7, 16))
        points.append((x, y))
        if branch and i > 12 and i % 26 == 0 and RNG.random() < 0.55:
            walk(
                x,
                y,
                steps // 3,
                max(1, width - 1),
                angle + float(RNG.choice([-1.0, 1.0])) * float(RNG.uniform(0.35, 0.9)),
                False,
            )
    if len(points) > 1:
        draw.line(points, fill=255, width=width, joint="curve")


crack = np.zeros((H, W), np.float32)

yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
xx = np.linspace(0, 1, W, dtype=np.float32)[None, :]
edge = np.minimum(np.minimum(xx, 1 - xx), np.minimum(yy, 1 - yy))
ao = np.clip(edge * 14.0, 0, 1) ** 0.55

height = 0.62 + (grain - 0.5) * 0.28 + (stain - 0.5) * 0.08
height -= pits * 0.22
height -= crack * 0.72
height = np.clip(height, 0, 1)

hi = np.array([255, 236, 239], np.float32)
mid = np.array([244, 205, 214], np.float32)
low = np.array([214, 156, 168], np.float32)
crack_color = np.array([156, 96, 112], np.float32)

shade = np.clip(0.42 + (grain - 0.5) * 0.7 + (stain - 0.5) * 0.45, 0, 1)[..., None]
color = low + (hi - low) * shade
color = color * 0.78 + mid * 0.22
color *= 0.78 + 0.22 * ao[..., None]
color *= 1 - pits[..., None] * 0.16
color = color * (1 - crack[..., None] * 0.62) + crack_color * (crack[..., None] * 0.62)

chips = (stain > 0.72).astype(np.float32)
chips = np.asarray(
    Image.fromarray((chips * 255).astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(6))
).astype(np.float32) / 255.0
color = np.clip(color + chips[..., None] * np.array([10, 6, 8], np.float32), 0, 255)
speck = RNG.random((H, W), dtype=np.float32)
speck = np.asarray(
    Image.fromarray((speck * 255).astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(0.6))
).astype(np.float32) / 255.0
color = np.clip(color + (speck[..., None] - 0.5) * 28, 0, 255)

rough = np.clip(0.86 + (1 - grain) * 0.12 + crack * 0.06 - chips * 0.18, 0.55, 1)

Image.fromarray(color.astype(np.uint8), "RGB").save(OUT / "plaster-color.jpg", quality=88)
Image.fromarray(normals(height, 8.0), "RGB").save(OUT / "plaster-normal.jpg", quality=90)
Image.fromarray((rough * 255).astype(np.uint8), "L").save(OUT / "plaster-rough.jpg", quality=86)
Image.fromarray((np.clip(height, 0, 1) * 255).astype(np.uint8), "L").save(
    OUT / "plaster-height.jpg", quality=88
)

# Soft ellipse the polaroids sit on.
shadow = Image.new("L", (256, 256), 0)
sdraw = ImageDraw.Draw(shadow)
sdraw.ellipse((28, 36, 228, 220), fill=255)
shadow = shadow.filter(ImageFilter.GaussianBlur(18))
shadow.save(OUT / "shadow.png")

# Film grain tile.
grain_tile = (RNG.random((256, 256)) * 255).astype(np.uint8)
Image.fromarray(grain_tile, "L").save(OUT / "grain.png")

# Seamless grain for the tray lip, so the frame matches the wall without tiled cracks.
def tile_octave(size, blur, seed):
    rng = np.random.default_rng(seed)
    img = Image.fromarray((rng.random((size, size)) * 255).astype(np.uint8), mode="L")
    img = ImageChops.offset(img, size // 2, size // 2)
    img = img.filter(ImageFilter.GaussianBlur(blur))
    img = ImageChops.offset(img, size // 2, size // 2)
    return np.asarray(img).astype(np.float32) / 255.0

size = 1024
fine = tile_octave(size, 1.2, 4) * 0.45 + tile_octave(size, 3.5, 8) * 0.35 + tile_octave(size, 9, 15) * 0.2
frame_height = np.clip(0.55 + (fine - 0.5) * 0.5, 0, 1)
frame_color = low + (hi - low) * np.clip(fine, 0, 1)[..., None]
frame_color = np.clip(frame_color * 0.82 + mid * 0.18, 0, 255)
Image.fromarray(frame_color.astype(np.uint8), "RGB").save(OUT / "frame-color.jpg", quality=88)
Image.fromarray(normals(frame_height, 3.2), "RGB").save(OUT / "frame-normal.jpg", quality=88)

print("wrote", OUT)
print("mean color", color.mean(axis=(0, 1)))
