#!/usr/bin/env python3
"""Split the approved character source into aligned transparent PNG layers."""

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/duik-character/source/character-selected-v1.png"
OUT = ROOT / "public/duik-character/layers-selected"


def polygon(size, points):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return np.asarray(mask, dtype=np.uint8) > 0


def save_layer(source, mask, name):
    rgba = np.array(source, dtype=np.uint8, copy=True)
    rgba[~mask, 3] = 0
    alpha = rgba[:, :, 3]
    ys, xs = np.where(alpha > 0)
    if not len(xs):
        raise RuntimeError(f"Empty layer: {name}")
    bbox = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    x0, y0, x1, y1 = bbox
    path = OUT / f"{name}.png"
    cropped = Image.fromarray(rgba[y0:y1, x0:x1], "RGBA")
    cropped.save(path)
    canvas_path = OUT / f"{name}-canvas.png"
    Image.fromarray(rgba, "RGBA").save(canvas_path)
    return {
        "name": name,
        "src": f"/duik-character/layers-selected/{name}.png",
        "canvasSrc": f"/duik-character/layers-selected/{name}-canvas.png",
        "bbox": bbox,
        "size": [x1 - x0, y1 - y0],
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")
    rgba = np.asarray(source, dtype=np.uint8)
    height, width = rgba.shape[:2]
    alpha = rgba[:, :, 3] > 0

    head_region = polygon(source.size, [(140, 0), (930, 0), (930, 570), (140, 570)])
    neck_region = polygon(source.size, [
        (430, 420), (720, 420), (735, 615), (700, 690), (460, 690), (420, 615),
    ])

    raised_region = polygon(source.size, [
        (770, 705), (845, 690), (925, 735), (985, 815), (1030, 735),
        (1015, 660), (1018, 570), (1035, 515), (1070, 488), (1108, 492),
        (1140, 512), (1187, 485), (1225, 495), (1265, 525), (1252, 590),
        (1210, 628), (1140, 652), (1080, 666), (1062, 805), (1040, 930),
        (1018, 1002), (990, 1042), (958, 1056), (920, 1034), (882, 978),
        (842, 900), (802, 820),
    ])
    resting_region = polygon(source.size, [
        (185, 715), (260, 645), (340, 632), (420, 692), (420, 860),
        (470, 935), (575, 958), (700, 972), (805, 1000), (865, 1035),
        (890, 1095), (878, 1150), (850, 1185), (810, 1198), (720, 1180),
        (665, 1145), (600, 1120), (470, 1110), (350, 1125), (250, 1110),
        (205, 1072), (185, 990),
    ])

    head = alpha & (head_region | neck_region)
    raised_arm = alpha & raised_region & ~head
    resting_arm = alpha & resting_region & ~head & ~raised_arm

    yy = np.arange(height)[:, None]
    occupied = head | raised_arm | resting_arm
    waist = alpha & (yy >= 970) & ~occupied
    upper_body = alpha & ~occupied & ~waist
    masks = [upper_body, waist, raised_arm, resting_arm, head]

    # Preserve the original source RGBA samples. The masks form a disjoint
    # partition, so compositing these PNGs at their recorded offsets is exact.
    combined = np.zeros_like(alpha)
    for mask in masks:
        combined |= mask
    if not np.array_equal(combined, alpha):
        raise RuntimeError(f"Layer masks leave {int(np.count_nonzero(alpha & ~combined))} visible pixels unassigned")
    layers = [
        save_layer(source, upper_body, "upper-body"),
        save_layer(source, waist, "waist"),
        save_layer(source, raised_arm, "raised-arm"),
        save_layer(source, resting_arm, "resting-arm"),
        save_layer(source, head, "head-neck"),
    ]

    assembled = np.zeros_like(rgba)
    for mask in masks:
        assembled[mask] = rgba[mask]
    exact = np.array_equal(assembled[:, :, 3], rgba[:, :, 3]) and np.array_equal(assembled[alpha, :], rgba[alpha, :])
    Image.fromarray(assembled, "RGBA").save(ROOT / "output/character-selected-v1-assembled.png")
    manifest = {"source": "/duik-character/source/character-selected-v1.png", "canvas": [width, height], "layers": layers, "staticAssemblyPixelExact": exact}
    (OUT / "layers.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == "__main__":
    main()
