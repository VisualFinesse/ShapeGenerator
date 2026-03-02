# Feature Specification: Stage 2 — Variation

**Branch**: `003-variation`
**Stage**: 2
**Depends on**: Stage 1 (`001-foster-ts-shapes`), Stage 1.5 (`002-advanced-shapes`)

---

## Overview

Extend the SVG shape engine with per-shape variation controls that introduce controlled, deterministic chaos into geometry. All variation is seed-based (PRNG) — the same `seed` + canonical config always produces the same output.

Three optional fields are added to every shape: `distort`, `sizeVariance`, and `clamp`. All are opt-in; shapes without variation fields behave identically to Stage 1/1.5.

---

## User Stories

### US1 — Vertex Distortion (P1)

**As a caller**, I want to apply configurable vertex perturbation to any shape so that shapes acquire organic, hand-drawn character.

**Acceptance criteria**:

- FR-200: Any `Shape` may carry `distort?: number` (0–1 inclusive)
- FR-201: When `distort === 0` or absent, output is byte-for-byte identical to Stage 1/1.5 output
- FR-202: When `distort > 0`, each vertex is offset by a PRNG value in `[-(charSize × distort), +(charSize × distort)]` in both x and y
- FR-203: `charSize` is the shape's characteristic half-size (see §Parameter Definitions below)
- FR-204: When `distort > 0`, the SVG element tag is always `"path"` regardless of `outputMode`
- FR-205: Determinism invariant holds: same `seed` + `distort` + shape config → identical SVG
- FR-206: `distort` outside `[0, 1]` is rejected as an invalid input

### US2 — Size Variation (P2)

**As a caller**, I want shapes to vary in size within a range so that repeated patterns feel natural without manually rewriting shape arrays.

**Acceptance criteria**:

- FR-210: Any `Shape` may carry `sizeVariance?: number` (0–1 inclusive)
- FR-211: When `sizeVariance === 0` or absent, output is identical to unvaried output
- FR-212: When `sizeVariance > 0`, all size dimensions are scaled by factor `f` where `f` is drawn from PRNG and lies in `[1 − sizeVariance, 1 + sizeVariance]`
- FR-213: Scaled sizes are clamped to a minimum of `1` to prevent zero or negative geometry
- FR-214: `sizeVariance` is applied before `distort` in the pipeline (scale first, then perturb)
- FR-215: `sizeVariance` outside `[0, 1]` is rejected

**Affected size dimensions per type**:

| Shape type                                                   | Scaled dimensions                   |
| ------------------------------------------------------------ | ----------------------------------- |
| `square`, `circle`, `triangle`, `octagon`, `polygon`, `blob` | `size`                              |
| `rectangle`, `oval`                                          | `width`, `height`                   |
| `trapezoid`                                                  | `topWidth`, `bottomWidth`, `height` |

### US3 — Vertex Clamping (P3)

**As a caller**, I want to constrain distorted vertices to a bounding envelope so that shapes never exceed a layout boundary.

**Acceptance criteria**:

- FR-220: Any `Shape` may carry `clamp?: { width: number; height: number }`
- FR-221: When `clamp` is present and `distort > 0`, each computed vertex `(vx, vy)` is clamped to `[x − w/2, x + w/2]` × `[y − h/2, y + h/2]`
- FR-222: `clamp` has no effect when `distort === 0` or absent
- FR-223: `clamp.width` and `clamp.height` must each be positive finite numbers

---

## Parameter Definitions

### charSize (distortion magnitude basis)

| Shape type  | `charSize`                                    |
| ----------- | --------------------------------------------- |
| `square`    | `size / 2`                                    |
| `circle`    | `size / 2`                                    |
| `triangle`  | `size / 2`                                    |
| `octagon`   | `size / 2`                                    |
| `polygon`   | `size / 2`                                    |
| `blob`      | `size / 2`                                    |
| `rectangle` | `Math.min(width, height) / 2`                 |
| `oval`      | `Math.min(width, height) / 2`                 |
| `trapezoid` | `Math.min(topWidth, bottomWidth, height) / 2` |

### Circle / Oval vertex sampling (when `distort > 0`)

Circles and ovals have no discrete vertices. When `distort > 0`, **16 points** are sampled evenly around the perimeter:

- Circle: `(cx + size/2 × cos(θ), cy + size/2 × sin(θ))` for θ = k × 2π/16
- Oval: `(cx + width/2 × cos(θ), cy + height/2 × sin(θ))` for θ = k × 2π/16

These 16 points are then distorted and emitted as a 16-vertex `<path>`.

### Blob vertex distortion

Blob's PRNG-derived control points (seeded by `blobSeed`) are used as the distortion base. The `varPrng` (seeded by `varSeed`) perturbs each control point. The Catmull-Rom → Bézier conversion is applied to the perturbed control points. This layered approach maintains full determinism: the blob's inherent shape (from `blobSeed`) and the distortion layer (from `varSeed`) are derived from independent but reproducible PRNGs.

---

## PRNG Draw Order Per Shape

For each shape with any variation field, a single PRNG instance is seeded by `varSeed(generatorSeed, shapeIndex)`. Draws occur in this fixed order:

1. **Size draw** (only if `sizeVariance > 0`): one `prng()` call → scale factor `f = 1 + (draw × 2 − 1) × sizeVariance`
2. **Vertex draws** (only if `distort > 0`): two `prng()` calls per vertex (dx, dy)

Draws are skipped for inactive features. This ensures isolation: activating `sizeVariance` after the fact changes the size draw result but not the vertex draws (since size draws precede vertex draws).

---

## Backward Compatibility

- All 9 existing shape types render identically when variation fields are absent
- Canonicalization: variation fields (`distort`, `sizeVariance`, `clamp`) are whitelisted — present fields are preserved, absent fields produce no output key
- Validation: variation fields are optional; shapes without them pass all existing validation rules

## Out of Scope

- Global/shared variation settings (all variation is per-shape only)
- Variation seeding independent from `GeneratorInput.seed`
- Animated or time-varying output
- Positional variation (`x`, `y`, `rotation` are never modified)
- Smooth spline fitting for non-blob distorted shapes (straight-line vertices only)
