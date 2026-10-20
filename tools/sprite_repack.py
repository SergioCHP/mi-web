#!/usr/bin/env python3
"""
sprite_repack.py — Normaliza spritesheets (sobre todo las generadas con IA) para el motor JRPG.

Problemas que corrige:
  1. Fondos "falsos": las IAs pintan un color sólido (o un tablero de ajedrez) en lugar de
     transparencia real. Con --key se elimina un color croma (recomendado: #FF00FF).
  2. Ruido de alfa: halos casi invisibles (alpha 1-15) que ensucian los bordes.
  3. Frames fuera de cuadrícula: el personaje no está centrado en su celda y "baila"
     entre frames, o invade la celda vecina (sangrado). Se reasigna cada mancha de píxeles
     (componente conexa) al frame cuyo centro contiene su centroide.
  4. Alineación: el frame 0 se ancla por sus PIES y los siguientes se registran contra el
     anterior correlando la silueta de las piernas; se conserva la línea de suelo original.
  5. Escala: --scale reescala con filtro de calidad (alfa premultiplicado) para que todas
     las hojas de un mismo personaje tengan la misma densidad de píxel.

Salida: PNG en cuadrícula uniforme (1 fila) + JSON con frameWidth, frameHeight, frames,
anchor (pies) y bodyHeight, listo para copiar en js/jrpg/data/sprites.js.

Uso:
  pip install pillow numpy scipy
  python tools/sprite_repack.py entrada.png --frames 6 -o assets/combat/heroe_hurt.png
  python tools/sprite_repack.py ia.png --frames 4 --key ff00ff --tol 60 --match-height 82 -o out.png
  python tools/sprite_repack.py ia_4x2.png --frames 8 --rows 2 --key ff00ff --align cell -o out.png

Opciones clave:
  --frames N          número total de frames en la hoja original.
  --rows R            filas de la rejilla original (p. ej. 8 frames en 4×2 → --rows 2). Se leen
                      en orden de lectura (izquierda→derecha, arriba→abajo).
  --key RRGGBB        color de fondo a eliminar (croma). 'auto' = color de las esquinas.
  --tol N             tolerancia del croma (distancia RGB, 0-441). Por defecto 48.
  --scale F           factor de reescalado final.
  --match-height PX   alternativa a --scale: reescala para que el cuerpo del frame 0 mida PX.
  --align feet|cell   feet = registro por piernas (por defecto); cell = respeta la celda original.
  --min-area N        descarta manchas de menos de N píxeles (ruido). Por defecto 12.
  --strip-lines       borra líneas finas y oscuras que la IA dibuja sin pedirlas: separadores
                      de rejilla, marcos y la línea de suelo bajo los pies.

Hojas en JPG: funcionan, pero el JPG ensucia el croma. Sube --tol a 70-90.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def parse_hex(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    if len(value) != 6:
        raise argparse.ArgumentTypeError("Color en formato RRGGBB")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def corner_color(rgb: np.ndarray, patch: int = 6) -> tuple[int, int, int]:
    """Color más frecuente en las cuatro esquinas (para --key auto)."""
    h, w, _ = rgb.shape
    corners = np.concatenate([
        rgb[:patch, :patch].reshape(-1, 3), rgb[:patch, -patch:].reshape(-1, 3),
        rgb[-patch:, :patch].reshape(-1, 3), rgb[-patch:, -patch:].reshape(-1, 3),
    ])
    values, counts = np.unique(corners, axis=0, return_counts=True)
    return tuple(int(c) for c in values[counts.argmax()])  # type: ignore[return-value]


def chroma_key(img: np.ndarray, key: tuple[int, int, int], tol: float) -> np.ndarray:
    """Elimina el color croma con borde suave y quita el 'spill' (halo del color) en los bordes."""
    rgb = img[..., :3].astype(np.float32)
    dist = np.linalg.norm(rgb - np.array(key, np.float32), axis=-1)
    soft = np.clip((dist - tol) / max(tol * 0.5, 1.0), 0.0, 1.0)  # 0 = fondo, 1 = sólido
    alpha = img[..., 3].astype(np.float32) / 255.0 * soft
    # Despill: en píxeles semitransparentes, resta la contribución del color croma
    edge = (soft > 0) & (soft < 1)
    k = np.array(key, np.float32)
    rgb[edge] = np.clip((rgb[edge] - k * (1 - soft[edge, None])) / np.maximum(soft[edge, None], 1e-3), 0, 255)
    # Halo de 2 px junto al fondo: los píxeles con el TONO del croma (mezcla del contorno con
    # el fondo) se desaturan a su luminancia → contorno oscuro limpio, sin ribete de color.
    solid = alpha > 0.06
    band = solid & ndimage.binary_dilation(~solid, iterations=2)
    hsv = np.array(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB").convert("HSV"), np.float32)
    key_hue = np.array(Image.new("RGB", (1, 1), key).convert("HSV"))[0, 0, 0].astype(np.float32)
    hue_diff = np.abs(hsv[..., 0] - key_hue)
    hue_diff = np.minimum(hue_diff, 256 - hue_diff)
    spill = band & (hue_diff < 22) & (hsv[..., 1] > 50)
    luma = rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114
    rgb[spill] = (luma[spill, None] * 0.6).repeat(3, axis=1)

    out = img.copy()
    out[..., :3] = rgb.astype(np.uint8)
    out[..., 3] = (alpha * 255).astype(np.uint8)
    return out


def _longest_runs(mask: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Por cada fila: longitud, inicio y fin del tramo continuo más largo de True."""
    n, w = mask.shape
    length = np.zeros(n, int)
    start = np.zeros(n, int)
    for i in range(n):
        row = mask[i]
        if not row.any():
            continue
        padded = np.concatenate(([0], row.astype(np.int8), [0]))
        edges = np.flatnonzero(np.diff(padded))
        starts, ends = edges[::2], edges[1::2]
        k = int((ends - starts).argmax())
        length[i], start[i] = ends[k] - starts[k], starts[k]
    return length, start, start + length


def strip_lines(img: np.ndarray, cols: int, rows: int, min_len: float = 0.5,
                max_thick: float = 0.015, dark: float = 95) -> tuple[np.ndarray, int]:
    """Borra líneas rectas oscuras y finas que las IAs dibujan aunque no se pidan:
    separadores de rejilla, marcos y la "línea de suelo" bajo los pies.

    Una línea es un grupo de filas (o columnas) consecutivas, dentro de una celda, cuyo tramo
    oscuro continuo ocupa más de `min_len` del ancho de la celda y que es fina (grosor máximo
    `max_thick` del alto de la celda). Los cuerpos son gruesos y las espadas claras: no se tocan.
    """
    out = img.copy()
    rgb = out[..., :3].astype(np.float32)
    luma = rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114
    opaque = out[..., 3] > 0
    darkish = opaque & (luma < dark)
    soft = opaque & (luma < dark + 45)          # antialias del borde de la línea
    h, w = darkish.shape
    removed = 0
    for r in range(rows):
        for c in range(cols):
            y0, y1 = round(r * h / rows), round((r + 1) * h / rows)
            x0, x1 = round(c * w / cols), round((c + 1) * w / cols)
            for axis in (0, 1):                  # 0 = líneas horizontales, 1 = verticales
                sub = darkish[y0:y1, x0:x1] if axis == 0 else darkish[y0:y1, x0:x1].T
                span = sub.shape[1]
                thick_max = max(3, int(max_thick * sub.shape[0]) + 2)
                length, seg0, seg1 = _longest_runs(sub)
                long = length >= min_len * span
                i = 0
                while i < len(long):
                    if not long[i]:
                        i += 1
                        continue
                    j = i
                    while j + 1 < len(long) and long[j + 1]:
                        j += 1
                    # Contraste: a ambos lados de una línea real el tramo oscuro es mucho más
                    # corto (fondo o pies). En el "pico" de un cuerpo los vecinos miden casi lo mismo.
                    near = np.concatenate([length[max(0, i - 8):max(0, i - 2)],
                                           length[min(len(long), j + 3):min(len(long), j + 9)]])
                    neighbour = int(near.max()) if near.size else 0
                    # Posición: los separadores van pegados al borde de la celda y la línea de
                    # suelo en su cuarto inferior; nunca a media altura del personaje.
                    pos = (i + j) / 2 / len(long)
                    where_ok = pos < 0.06 or pos > 0.94 or (axis == 0 and pos > 0.75)
                    is_line = (where_ok and j - i + 1 <= thick_max
                               and length[i:j + 1].max() >= 1.8 * neighbour)
                    if is_line:
                        a, b = int(seg0[i:j + 1].min()), int(seg1[i:j + 1].max())
                        lo, hi = max(0, i - 2), min(len(long), j + 3)
                        if axis == 0:
                            ys, xs = slice(y0 + lo, y0 + hi), slice(x0 + a, x0 + b)
                        else:
                            ys, xs = slice(y0 + a, y0 + b), slice(x0 + lo, x0 + hi)
                        kill = soft[ys, xs]
                        removed += int(kill.sum())
                        out[ys, xs, 3][kill] = 0
                    i = j + 1
    return out, removed


def feet_anchor_x(mask: np.ndarray) -> float:
    """Mediana X de los píxeles opacos en el 12 % inferior del cuerpo (los pies)."""
    ys, xs = np.nonzero(mask)
    top, bottom = ys.min(), ys.max()
    band = bottom - max(2, int((bottom - top) * 0.12))
    sel = ys >= band
    return float(np.median(xs[sel]))


def resize_rgba(img: Image.Image, scale: float) -> Image.Image:
    """Reescalado con alfa premultiplicado: evita halos oscuros en los bordes."""
    w, h = img.size
    size = (max(1, round(w * scale)), max(1, round(h * scale)))
    resample = Image.LANCZOS if scale < 1 else Image.NEAREST
    return img.convert("RGBa").resize(size, resample).convert("RGBA")


def repack(args: argparse.Namespace) -> dict:
    src = Image.open(args.input).convert("RGBA")
    img = np.array(src)

    # Croma y limpieza de líneas sobre la rejilla ORIGINAL (las líneas siguen las celdas)
    if args.key:
        key = corner_color(img[..., :3]) if args.key == "auto" else parse_hex(args.key)
        img = chroma_key(img, key, args.tol)
        print(f"· croma eliminado: #{key[0]:02x}{key[1]:02x}{key[2]:02x} (tol {args.tol})")
    if args.strip_lines:
        img, removed = strip_lines(img, args.frames // args.rows, args.rows)
        print(f"· líneas de rejilla/suelo eliminadas: {removed} px")

    # Rejilla → una sola fila (las IAs generan mejor en 2×2 o 4×2 que en tiras de 8:1)
    if args.rows > 1:
        if args.frames % args.rows:
            sys.exit("✗ --frames debe ser múltiplo de --rows")
        strip_h = img.shape[0] // args.rows
        img = np.concatenate([img[r * strip_h:(r + 1) * strip_h] for r in range(args.rows)], axis=1)

    # 1) Limpieza de alfa residual
    img[img[..., 3] < args.alpha_threshold] = 0
    solid = img[..., 3] > 0

    # 2) Componentes conexas (8-vecindad) y descarte de motas
    labels, count = ndimage.label(solid, structure=np.ones((3, 3), int))
    sizes = ndimage.sum(solid, labels, index=np.arange(1, count + 1))
    centroids = ndimage.center_of_mass(solid, labels, index=np.arange(1, count + 1))

    height, width = solid.shape
    cell_w = width / args.frames
    frame_of = np.full(count + 1, -1, int)
    for idx, (size, (cy, cx)) in enumerate(zip(sizes, centroids), start=1):
        if size >= args.min_area:
            frame_of[idx] = min(args.frames - 1, int(cx // cell_w))

    frames = []
    for f in range(args.frames):
        mask = np.isin(labels, np.nonzero(frame_of == f)[0])
        if not mask.any():
            sys.exit(f"✗ El frame {f} está vacío: revisa --frames o --min-area")
        ys, xs = np.nonzero(mask)
        frames.append({"mask": mask, "x0": xs.min(), "x1": xs.max(), "y0": ys.min(), "y1": ys.max(),
                       "cell_center": f * cell_w + cell_w / 2})

    top = min(f["y0"] for f in frames)
    bottom = max(f["y1"] for f in frames)

    # 3) Anclas X (enteras: un ancla fraccionaria + redondeo crea columnas duplicadas/huecas)
    if args.align == "cell":
        for f in frames:
            f["anchor"] = int(round(f["cell_center"]))
    else:
        # Registro por la silueta de las piernas: el perfil de columnas de la franja inferior
        # de cada frame se correlaciona con el del frame anterior. Más robusto que la mediana
        # cuando la espada o una capa tocan el suelo.
        band_top = int(bottom - 0.3 * (bottom - top))
        profiles = [f["mask"][band_top:bottom + 1].sum(axis=0).astype(np.float32) for f in frames]
        frames[0]["anchor"] = int(round(feet_anchor_x(frames[0]["mask"])))
        reach = int(max(f["x1"] - f["x0"] for f in frames))
        for i in range(1, len(frames)):
            prev, cur = frames[i - 1], frames[i]
            u = np.arange(-reach, reach + 1)
            ref = profiles[i - 1][np.clip(prev["anchor"] + u, 0, width - 1)]
            best, best_score = cur["x0"], -1.0
            for cand in range(cur["x0"], cur["x1"] + 1):
                score = float(ref @ profiles[i][np.clip(cand + u, 0, width - 1)])
                if score > best_score:
                    best, best_score = cand, score
            cur["anchor"] = int(best)

    # 4) Caja común relativa al ancla de cada frame → todos comparten el mismo punto de pies
    left = max(f["anchor"] - f["x0"] for f in frames)
    right = max(f["x1"] - f["anchor"] for f in frames)
    pad = args.pad
    fw = int(left + right) + 1 + pad * 2
    fh = int(bottom - top) + 1 + pad * 2

    sheet = np.zeros((fh, fw * args.frames, 4), np.uint8)
    for i, f in enumerate(frames):
        ys, xs = np.nonzero(f["mask"])
        dx = xs + (left - f["anchor"]) + pad + i * fw
        dy = (ys - top) + pad
        sheet[dy, dx] = img[ys, xs]

    anchor_x = left + pad
    anchor_y = (frames[0]["y1"] - top) + pad + 1          # línea de suelo (debajo del último píxel)
    body_h = frames[0]["y1"] - frames[0]["y0"] + 1

    scale = args.scale
    if args.match_height:
        scale = args.match_height / body_h
    out = Image.fromarray(sheet, "RGBA")
    if abs(scale - 1) > 1e-6:
        # Reescalar cada frame por separado mantiene la cuadrícula exacta
        tiles = [out.crop((i * fw, 0, (i + 1) * fw, fh)) for i in range(args.frames)]
        tiles = [resize_rgba(t, scale) for t in tiles]
        fw, fh = tiles[0].size
        out = Image.new("RGBA", (fw * args.frames, fh))
        for i, t in enumerate(tiles):
            out.paste(t, (i * fw, 0))
        anchor_x *= scale
        anchor_y *= scale
        body_h *= scale

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    out.save(args.output, optimize=True)
    meta = {
        "src": Path(args.output).name,
        "frames": args.frames,
        "frameWidth": fw,
        "frameHeight": fh,
        "anchor": {"x": round(float(anchor_x), 1), "y": round(float(anchor_y), 1)},
        "bodyHeight": round(float(body_h), 1),
    }
    if args.json:
        Path(args.json).write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"✓ {args.output}: {args.frames} frames de {fw}×{fh}px · ancla {meta['anchor']} · cuerpo {meta['bodyHeight']}px")
    return meta


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input")
    p.add_argument("-o", "--output", required=True)
    p.add_argument("--frames", type=int, required=True)
    p.add_argument("--rows", type=int, default=1)
    p.add_argument("--json")
    p.add_argument("--key", help="RRGGBB o 'auto'")
    p.add_argument("--tol", type=float, default=48)
    p.add_argument("--alpha-threshold", type=int, default=16)
    p.add_argument("--min-area", type=int, default=12)
    p.add_argument("--pad", type=int, default=2)
    p.add_argument("--align", choices=("feet", "cell"), default="feet")
    p.add_argument("--strip-lines", action="store_true",
                   help="borra separadores de rejilla, marcos y líneas de suelo dibujadas por la IA")
    g = p.add_mutually_exclusive_group()
    g.add_argument("--scale", type=float, default=1.0)
    g.add_argument("--match-height", type=float)
    repack(p.parse_args())


if __name__ == "__main__":
    main()
