# Guía de spritesheets y fondos con IA — Combate JRPG

Cómo generar hojas nuevas que encajen con el estilo y la escala de `assets/combat/` y cómo
integrarlas en el motor sin tocar la lógica.

---

## 1. Reglas de oro (evitan el 90 % de los problemas)

1. **Nunca pidas "transparent background".** Las IAs pintan un tablero de ajedrez falso.
   Pide un **fondo plano magenta `#FF00FF`** (o verde `#00FF00` si el personaje lleva rosa/magenta)
   y quítalo luego con `tools/sprite_repack.py --key`.
2. **Todos los sprites miran a la DERECHA.** El motor voltea a los enemigos automáticamente.
3. **Misma línea de suelo en todos los frames** y personaje centrado en su celda.
4. **Rejillas, no tiras largas.** Los generadores manejan mal proporciones de 8:1.
   Pide 2×2, 3×2 o 4×2 celdas cuadradas y usa `--rows` al procesar.
5. **Adjunta siempre una referencia** (`assets/combat/heroe_idle.png` o `Heroe.png`) como
   *character reference / image prompt*. Sin referencia, el personaje cambia entre hojas.
6. **Sin efectos grandes dentro del sprite.** Orbes, rayos, explosiones y estelas los genera el
   motor con partículas; si van pintados en la hoja se duplican y ensucian el recorte.
7. **Genera grande y deja que la herramienta reduzca.** 256 px por celda (o más) y después
   `--match-height 82` iguala la densidad de píxel con los sprites actuales.

---

## 2. Bloque de estilo común (pégalo al principio de cada prompt)

```
HD pixel art battle sprite, 32-bit JRPG style, crisp hand-placed pixels, 1-pixel dark navy
outline, limited palette of about 32 colors, cel shading with 2-3 tones per material,
soft rim light from the upper left, side three-quarter view facing right, full body,
consistent proportions (about 6 heads tall), no anti-aliasing blur, no dithering noise,
flat solid magenta #FF00FF background, no ground shadow, no text, no frame borders
```

**Negativo** (Stable Diffusion / campos "avoid"):

```
blurry, painterly, 3d render, photo, gradient background, checkerboard, transparent pattern,
cast shadow, floor, text, watermark, signature, frame numbers, grid lines, cropped limbs,
extra fingers, different character between frames, inconsistent scale, perspective camera
```

**Descripción fija del héroe** (para mantener la identidad):

```
young swordsman, messy chestnut-brown hair, dark steel plate armor with bronze rivets,
long royal-blue cape wrapped as a scarf, black gloves, brown leather boots,
straight steel longsword
```

---

## 3. Especificaciones técnicas

| Hoja | Frames | Rejilla a pedir | Lienzo IA | Fondo | fps | Bucle | `hitFrame` | Alineación (`--align`) |
|---|---|---|---|---|---|---|---|---|
| `heroe_hurt` | 3 | 3×1 | 768×256 | `#FF00FF` | 12 | no | — | `feet` |
| `heroe_victory` | 6 | 3×2 | 768×512 | `#FF00FF` | 8 | sí | — | `feet` |
| `heroe_cast` | 4 | 2×2 | 512×512 | `#FF00FF` | 8 | sí | — | `feet` |
| `heroe_limit` | 8 | 4×2 | 1024×512 | `#FF00FF` | 18 | no | 4 | `cell` (hay frames en el aire) |
| `soldado_idle` | 6 | 3×2 | 768×512 | `#FF00FF` | 7 | sí | — | `feet` |
| `soldado_ataque` | 6 | 3×2 | 768×512 | `#FF00FF` | 12 | no | 4 | `feet` |
| `dron_idle` | 6 | 3×2 | 768×512 | `#00FF00` | 8 | sí | — | `cell` (levita) |
| `dron_ataque` | 6 | 3×2 | 768×512 | `#00FF00` | 10 | no | 3 | `cell` |

- **`hitFrame`** cuenta desde 0: es el frame en el que se aplica el daño y saltan las partículas.
- **Celda**: 256×256 px, personaje ocupando ~80 % del alto, pies a ~12 px del borde inferior.
- **Escala final**: el motor espera ~82 px de cuerpo de pie (densidad de `heroe_idle.png`);
  la herramienta lo ajusta con `--match-height`.
- **Estilo**: pixel art "HD-2D / 32 bits". Si tu generador lo permite, genera a 4× sobre una
  resolución nativa de 64×64 por celda (más fiel al grano real del pixel art).
- **Formato final**: PNG con alfa, rejilla de una fila (lo genera la herramienta).

---

## 4. Prompts

> Formato: **[bloque de estilo común]** + **[descripción del personaje]** + el texto de cada hoja.
> Si el generador acepta referencia de imagen, adjunta `assets/combat/heroe_idle.png`.

### 4.1 Héroe — `Hurt / Daño` (3 frames)

```
sprite sheet, 3 frames in a single row, equal square cells, same character in every frame,
hit reaction animation: frame 1 impact, torso jerks back, head snaps back, eyes shut,
cape flaring forward; frame 2 maximum recoil, knees bent, leaning back 15 degrees,
free arm raised defensively, sword lowered; frame 3 recovering into guard stance, grimacing,
feet on the same ground line in all frames
```

### 4.2 Héroe — `Victory / Celebración` (6 frames en bucle)

```
sprite sheet, 6 frames in a 3x2 grid, equal square cells, seamless looping animation,
victory pose: sword sheathed on the hip, right fist raised high, confident smile,
cape and hair fluttering in the wind, subtle breathing bounce, frame 6 flows back into frame 1,
feet planted on the same ground line in all frames
```

*Variante "envainar" (sin bucle, `loop: false` en el clip):*
`frame 1 sword raised vertically in front of the face; 2 quick flourish spin; 3 blade sliding into the scabbard; 4 hilt clicks in, hand on the pommel; 5 straightening up, cape settling; 6 calm proud stance`

### 4.3 Héroe — `Casting / Magia` (4 frames en bucle)

```
sprite sheet, 4 frames in a 2x2 grid, equal square cells, looping spell-casting animation:
frame 1 sword planted point-down at his side, left hand stretched forward, palm open;
frame 2 gathering energy, hair and cape lifting upward; frame 3 both hands forward,
faint cyan glow only on the palms; frame 4 peak concentration, eyes glowing faintly,
loops back to frame 2, no large magic effects, feet on the same ground line
```

### 4.4 Héroe — `Limit Break` (8 frames, corte acrobático)

```
sprite sheet, 8 frames in a 4x2 grid, equal square cells, character centered in each cell,
dynamic acrobatic sword combo: frame 1 low crouch wind-up, sword drawn back;
frame 2 explosive forward dash, body almost horizontal; frame 3 leaping spin, airborne,
sword arcing overhead; frame 4 upside-down mid-air slash; frame 5 descending downward
cleave, the decisive hit; frame 6 landing impact on one knee, sword driven into the ground;
frame 7 rising upward slash; frame 8 recovery stance, sword resting on the shoulder,
dramatic cape motion, only a thin white slash trail on the blade, grounded frames share
the same ground line
```

### 4.5 Enemigo — `Soldado de Élite`

Descripción fija:

```
elite security soldier, sleek dark navy tactical armor with red glowing visor helmet,
angular shoulder pauldrons, compact assault rifle held in the right hand,
short combat sword sheathed on the back, armored boots, menacing posture,
same height and pixel density as a human swordsman sprite
```

**Idle (6 frames):**
```
sprite sheet, 6 frames in a 3x2 grid, equal square cells, seamless idle loop:
rifle held at low ready, subtle breathing, visor light pulsing, slight weight shift,
feet on the same ground line, facing right
```

**Ataque (6 frames):**
```
sprite sheet, 6 frames in a 3x2 grid, equal square cells, attack animation:
frame 1 raises rifle; frame 2 aims down the sights; frame 3 fires a three-round burst
with a tiny muzzle flash; frame 4 draws the short sword from the back in one motion;
frame 5 lunging horizontal slash; frame 6 returns to ready stance, feet on the same ground line
```

### 4.6 Enemigo — `Dron Guardián` (fondo verde `#00FF00`)

Descripción fija:

```
hovering spherical security drone, gunmetal grey hull with panel lines, single large red
sensor eye, four small stabilizer fins, underslung laser cannon, faint orange thruster glow
underneath, floating with no legs, no ground contact, flat solid green #00FF00 background
```

**Idle (6 frames):**
```
sprite sheet, 6 frames in a 3x2 grid, equal square cells, drone centered in each cell at the
same height, seamless hover loop: fins flicker, sensor eye scans left and right,
thruster glow pulses, no vertical bobbing (the engine adds it)
```

**Ataque (6 frames):**
```
sprite sheet, 6 frames in a 3x2 grid, equal square cells, laser attack animation:
frames 1-3 the cannon charges, red glow growing at the muzzle; frame 4 fires, short bright
beam stub only at the muzzle; frame 5 recoil, hull tilts back; frame 6 cooling vents,
returning to neutral, drone centered at the same height in every cell
```

### 4.7 Fondos de combate

Especificaciones comunes: **1920×864 px** (proporción 20:9), pixel art a 4× (resolución nativa
480×216), sin personajes, **zona central del suelo despejada**, contraste moderado en la franja
donde luchan los sprites y **línea de suelo al 71 % de la altura** (el motor alinea ahí los pies).
Para parallax real genera **3 capas** con la misma composición.

**A) Reactor Mako subterráneo con puente metálico**

Capa lejana (opaca, `depth 0.12`):
```
pixel art battle background, 4x upscaled from 480x216, side view, underground industrial
reactor cavern, colossal cylindrical reactor core in the center emitting a vertical column of
glowing green energy, distant pipes and catwalks fading into darkness, teal and green palette,
volumetric haze near the floor line, no characters, no text, empty center
```
Capa media (sobre `#FF00FF`, `depth 0.45`):
```
pixel art silhouettes of heavy machinery, tanks, pressure valves, pipe bundles and a crane
along the horizon, dark steel with thin green rim light from the reactor, small amber warning
lamps, flat solid magenta #FF00FF background above and around the silhouettes
```
Suelo (sobre `#FF00FF`, `depth 1`):
```
pixel art metal bridge deck seen in slight perspective, riveted steel plates and grating,
railings along the far edge, green reflections from the reactor, occupying the bottom 29 percent
of the image, everything above the bridge railing is flat solid magenta #FF00FF
```

**B) Carretera destruida en autopista nocturna cyberpunk**

Capa lejana (opaca, `depth 0.15`):
```
pixel art battle background, 4x upscaled from 480x216, side view, night cyberpunk megacity
skyline, towering skyscrapers with magenta and cyan neon signs (no readable text), rain haze,
distant flying traffic lights, deep blue and purple palette, no characters
```
Capa media (sobre `#00FF00`, `depth 0.5`):
```
pixel art silhouettes of a broken elevated highway section, snapped concrete pillars,
bent guardrails, a flickering street lamp, an overturned car at the far left edge,
flat solid green #00FF00 background
```
Suelo (sobre `#00FF00`, `depth 1`):
```
pixel art cracked asphalt road in slight perspective, faded lane markings, rain puddles
reflecting pink and cyan neon, debris at the edges only, center clear, occupying the bottom
29 percent of the image, everything above is flat solid green #00FF00
```

---

## 5. Post-proceso con `tools/sprite_repack.py`

```bash
pip install pillow numpy scipy

# Héroe herido (3×1, alineado por los pies, misma densidad que el idle)
python tools/sprite_repack.py ia/heroe_hurt.png --frames 3 --key ff00ff --tol 60 \
  --match-height 82 -o assets/combat/heroe_hurt.png --json tmp/heroe_hurt.json

# Límite (4×2 con saltos: alineación por celda)
python tools/sprite_repack.py ia/heroe_limit.png --frames 8 --rows 2 --key ff00ff \
  --align cell --match-height 82 -o assets/combat/heroe_limit.png --json tmp/heroe_limit.json

# Dron (fondo verde)
python tools/sprite_repack.py ia/dron_idle.png --frames 6 --rows 2 --key 00ff00 \
  --align cell --match-height 70 -o assets/combat/dron_idle.png --json tmp/dron_idle.json
```

Qué hace: quita el croma (con limpieza de halo), elimina ruido de alfa, reasigna cada mancha
de píxeles a su frame, alinea los pies, reescala con alfa premultiplicado y exporta una fila
uniforme + JSON con `frameWidth`, `frameHeight` y `anchor`.

> **`--match-height`** mide el frame 0. Si el frame 0 no está de pie (p. ej. *hurt*), usa
> `--scale` y compara a ojo con `heroe_idle.png` hasta que la cabeza tenga el mismo tamaño.

Fondos (reducir a WebP; las capas con croma necesitan alfa):

```bash
python -c "from PIL import Image; Image.open('ia/reactor_far.png').convert('RGB').resize((1600,720), Image.LANCZOS).save('assets/combat/reactor_far.webp', quality=82)"
```

---

## 6. Integración en el motor

**1. Registrar la hoja** en `js/jrpg/data/sprites.js` copiando el JSON:

```js
heroe_hurt: { src: 'assets/combat/heroe_hurt.png', frames: 3, frameWidth: 70, frameHeight: 88, anchor: { x: 40, y: 86 } },
```

**2. Apuntar el clip** (sustituye al *fallback*):

```js
hurt:    { sheet: 'heroe_hurt',    fps: 12, loop: false },
victory: { sheet: 'heroe_victory', fps: 8,  loop: true },
cast:    { sheet: 'heroe_cast',    fps: 8,  loop: true },
limit:   { sheet: 'heroe_limit',   fps: 18, loop: false, hitFrame: 4 },
```

El *Director* detecta que el clip ya es nativo y deja de usar los efectos de sustitución
(saltitos de victoria, retroceso procedural…).

**3. Nuevo enemigo** en `data/sprites.js` (juego de animaciones) y `data/units.js` (plantilla + IA):

```js
// sprites.js → ANIMATIONS
drone: { clips: { idle: { sheet: 'dron_idle', fps: 8, loop: true },
                  attack: { sheet: 'dron_ataque', fps: 10, loop: false, hitFrame: 3 },
                  hurt: { fallback: 'idle' }, cast: { fallback: 'idle' },
                  victory: { fallback: 'idle' }, limit: { fallback: 'attack' } } },

// units.js → UNITS
drone: { nameKey: 'unit.drone', portrait: 'assets/Monstruo.png', sprite: 'drone',
         pixelScale: 1.4, hover: 26,              // levita 26 unidades con balanceo
         stats: { hp: 220, mp: 0, atk: 20, mag: 26, def: 18, mdef: 6, spd: 10 },
         elements: { weak: ['thunder'], resist: [] }, ai: 'larva' },
```

Añade `'unit.drone'` a `data/i18n.js` y el enemigo al encuentro en `config.js`.

**4. Fondo con capas**: copia las WebP a `assets/combat/`, descomenta el ejemplo `highway` en
`render/background.js` y su entrada en `STAGE_IMAGES` de `main.js`, y prueba con
`minijuego.html?stage=highway`.

---

## 7. Herramientas que funcionan bien

| Herramienta | Cómo conseguir consistencia |
|---|---|
| Midjourney v7 | `--cref` con `heroe_idle.png`, `--sref` con una hoja existente, `--ar 3:2` para 3×2 |
| GPT-image / ChatGPT | Adjunta la referencia y pide "same character, same pixel density" |
| Stable Diffusion XL | LoRA de pixel art + ControlNet OpenPose con poses dibujadas a mano |
| Aseprite (retoque) | Corrige 2-3 píxeles por frame y exporta como *sprite sheet* horizontal |

Comprueba siempre el resultado con `minijuego.html?debug=1&seed=1`: misma semilla, mismo
combate, ideal para comparar antes y después.
