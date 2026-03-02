# Data Model: Advanced Shapes v0.2

**Branch**: `002-advanced-shapes` | **Date**: 2026-03-01

> This document extends the Stage 1 data model (`specs/001-foster-ts-shapes/data-model.md`). All Stage 1 entities are unchanged. Only additions and modifications are described here.

---

## Extended Entities

### Shape (Discriminated Union — extended)

The `Shape` type gains five new variants. All share the Stage 1 base fields.

**Base fields** (all variants, unchanged):

| Field    | Type   | Required | Constraints                                                                                                |
| -------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| type     | string | Yes      | One of: "square", "rectangle", "circle", "triangle", **"trapezoid", "octagon", "polygon", "oval", "blob"** |
| x        | number | Yes      | Finite, not NaN (center X)                                                                                 |
| y        | number | Yes      | Finite, not NaN (center Y)                                                                                 |
| rotation | number | No       | Finite, not NaN (degrees, default: omitted)                                                                |

---

**TrapezoidShape** (`type: "trapezoid"`):

| Field       | Type   | Required | Constraints          |
| ----------- | ------ | -------- | -------------------- |
| topWidth    | number | Yes      | > 0, finite, not NaN |
| bottomWidth | number | Yes      | > 0, finite, not NaN |
| height      | number | Yes      | > 0, finite, not NaN |

Center convention: bounding-box midpoint (midpoint between top and bottom parallel edges).

Vertices:

- TL = (x − topWidth/2, y − height/2)
- TR = (x + topWidth/2, y − height/2)
- BR = (x + bottomWidth/2, y + height/2)
- BL = (x − bottomWidth/2, y + height/2)

Semantic: `<polygon>` | Path: `<path>`

---

**OctagonShape** (`type: "octagon"`):

| Field | Type   | Required | Constraints                         |
| ----- | ------ | -------- | ----------------------------------- |
| size  | number | Yes      | > 0, finite, not NaN (circumradius) |

8 vertices at angles `k·π/4 − π/2` for k = 0..7 (first vertex at top).

Semantic: `<polygon>` | Path: `<path>`

---

**PolygonShape** (`type: "polygon"`):

| Field | Type   | Required | Constraints                         |
| ----- | ------ | -------- | ----------------------------------- |
| sides | number | Yes      | Integer ≥ 3, finite, not NaN        |
| size  | number | Yes      | > 0, finite, not NaN (circumradius) |

`n` vertices at angles `2π·k/n − π/2` for k = 0..n−1 (first vertex at top).

Semantic: `<polygon>` | Path: `<path>`

---

**OvalShape** (`type: "oval"`):

| Field  | Type   | Required | Constraints                                   |
| ------ | ------ | -------- | --------------------------------------------- |
| width  | number | Yes      | > 0, finite, not NaN (full horizontal extent) |
| height | number | Yes      | > 0, finite, not NaN (full vertical extent)   |

Semi-axes: `rx = width/2`, `ry = height/2`.

Semantic: `<ellipse cx="x" cy="y" rx="rx" ry="ry">` | Path: two-arc `<path>` (split at left/right extremes)

---

**BlobShape** (`type: "blob"`):

| Field  | Type   | Required | Constraints                                    |
| ------ | ------ | -------- | ---------------------------------------------- |
| size   | number | Yes      | > 0, finite, not NaN (nominal bounding radius) |
| points | number | No       | Integer ≥ 3, default 6                         |

Generation procedure:

1. Derive PRNG seed: `Math.imul(generatorSeed | 0, 1000003) + shapeIndex * 2654435761`
2. mulberry32 PRNG from derived seed
3. Place `n = points` control points at evenly-spaced angles `2π·k/n`
4. Each point's radius: `size · (0.6 + 0.4 · prng())`
5. Fit closed Catmull-Rom spline → convert to cubic Bézier segments
6. Serialize as SVG `<path>` with `fmt()` for deterministic float formatting

Output: always `<path>` (both `"semantic"` and `"path"` outputMode).

---

## New Internal Entity

### Prng

An internal (non-exported) utility function type.

```typescript
type PrngFn = () => number; // returns [0, 1)
```

Created by `createPrng(seed: number): PrngFn`. Each call to the returned function advances the state and returns the next pseudo-random float in `[0, 1)`.

Not part of the public API. Used exclusively by blob rendering.

---

## Extended Entity Relationships

```
GeneratorInput
├── seed: number
├── canvas: Canvas
│   ├── width
│   └── height
└── shapes: Shape[]
    ├── SquareShape       (type="square")       [Stage 1]
    ├── RectangleShape    (type="rectangle")    [Stage 1]
    ├── CircleShape       (type="circle")       [Stage 1]
    ├── TriangleShape     (type="triangle")     [Stage 1]
    ├── TrapezoidShape    (type="trapezoid")    [Stage 1.5]
    ├── OctagonShape      (type="octagon")      [Stage 1.5]
    ├── PolygonShape      (type="polygon")      [Stage 1.5]
    ├── OvalShape         (type="oval")         [Stage 1.5]
    └── BlobShape         (type="blob")         [Stage 1.5]

generate(GeneratorInput) → GeneratorOutput
                            ├── svg: string (contains shape elements with id=ShapeID)
                            └── metadata.shapeCount: number
```

---

## Extended Validation Rules

Additional rules on top of Stage 1:

| #    | Rule                                             |
| ---- | ------------------------------------------------ |
| V-10 | `trapezoid.topWidth`: required, > 0, finite      |
| V-11 | `trapezoid.bottomWidth`: required, > 0, finite   |
| V-12 | `trapezoid.height`: required, > 0, finite        |
| V-13 | `octagon.size`: required, > 0, finite            |
| V-14 | `polygon.sides`: required, integer ≥ 3, finite   |
| V-15 | `polygon.size`: required, > 0, finite            |
| V-16 | `oval.width`: required, > 0, finite              |
| V-17 | `oval.height`: required, > 0, finite             |
| V-18 | `blob.size`: required, > 0, finite               |
| V-19 | `blob.points` (if provided): integer ≥ 3, finite |

---

## Extended Canonicalization Rules

New shape variants and their allowed fields (all others silently dropped):

| Type      | Allowed fields                                      |
| --------- | --------------------------------------------------- |
| trapezoid | type, x, y, rotation, topWidth, bottomWidth, height |
| octagon   | type, x, y, rotation, size                          |
| polygon   | type, x, y, rotation, sides, size                   |
| oval      | type, x, y, rotation, width, height                 |
| blob      | type, x, y, rotation, size, points                  |
