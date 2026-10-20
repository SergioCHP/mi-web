#!/usr/bin/env python3
"""
stage_layer.py — Prepara capas de fondo (parallax) generadas con IA para el combate JRPG.

Hace, por este orden:
  1. --key RRGGBB      quita el croma (fondo magenta/verde) → transparencia real.
  2. --fog RRGGBB:K    "perspectiva aérea": mezcla la capa con el color de la niebla (K = 0..1)
                       para que quede detrás de los personajes y no compita con ellos.
  3. --clear-center A:B  vacía el centro con un degradado (|x−0,5| < A transparente, > B opaco).
                       Sirve para que una capa media no tape el elemento central de la lejana.
  4. --width N         reduce a N px de ancho (LANCZOS, alfa premultiplicado).
  Guarda en WebP (con alfa si hace falta).

Ejemplos (Reactor Mako):
  python tools/stage_layer.py "assets/combat/Fondo A Reactor Mako.jpg" -o assets/combat/mako_far.webp --width 1920
  python tools/stage_layer.py "assets/combat/Fondo A Reactor Mako, capa media.jpg" --key ff00ff \\
      --fog 0f3634:0.38 --clear-center 0.12:0.26 -o assets/combat/mako_mid.webp --width 1600
  python tools/stage_layer.py "assets/combat/Fondo A Reactor Mako, suelo.jpg" --key ff00ff \\
      -o assets/combat/mako_floor.webp --width 1920
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sprite_repack import chroma_key, parse_hex  # noqa: E402


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input")
    p.add_argument("-o", "--output", required=True)
    p.add_argument("--key", help="color croma RRGGBB")
    p.add_argument("--tol", type=float, default=80, help="tolerancia del croma (JPG: 70-90)")
    p.add_argument("--fog", help="RRGGBB:K  color de niebla y mezcla 0..1")
    p.add_argument("--clear-center", help="A:B  centro transparente con degradado")
    p.add_argument("--width", type=int, help="ancho final en px")
    p.add_argument("--quality", type=int, default=82)
    args = p.parse_args()

    img = np.array(Image.open(args.input).convert("RGBA"))
    if args.key:
        img = chroma_key(img, parse_hex(args.key), args.tol)
        img[img[..., 3] < 16, 3] = 0

    if args.fog:
        color, amount = args.fog.split(":")
        fog = np.array(parse_hex(color), np.float32)
        k = float(amount)
        rgb = img[..., :3].astype(np.float32)
        img[..., :3] = np.clip(rgb * (1 - k) + fog * k, 0, 255).astype(np.uint8)

    if args.clear_center:
        a, b = (float(v) for v in args.clear_center.split(":"))
        w = img.shape[1]
        d = np.abs(np.arange(w) / (w - 1) - 0.5)
        t = np.clip((d - a) / max(b - a, 1e-3), 0, 1)
        ramp = t * t * (3 - 2 * t)  # smoothstep
        img[..., 3] = (img[..., 3].astype(np.float32) * ramp[None, :]).astype(np.uint8)

    out = Image.fromarray(img, "RGBA")
    if args.width and args.width < out.width:
        h = round(out.height * args.width / out.width)
        out = out.convert("RGBa").resize((args.width, h), Image.LANCZOS).convert("RGBA")

    has_alpha = bool((np.array(out)[..., 3] < 255).any())
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    (out if has_alpha else out.convert("RGB")).save(args.output, quality=args.quality, method=6)
    kb = Path(args.output).stat().st_size / 1024
    print(f"✓ {args.output}: {out.width}×{out.height}px · alfa {'sí' if has_alpha else 'no'} · {kb:.0f} KB")


if __name__ == "__main__":
    main()
