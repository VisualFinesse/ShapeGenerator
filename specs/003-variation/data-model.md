# Data Model: Stage 2 — Variation

## New Interface: VariationFields

```typescript
export interface VariationFields {
  distort?: number;       // 0–1: vertex perturbation magnitude as fraction of charSize
  sizeVariance?: number;  // 0–1: size scale factor range [1-sv, 1+sv]
  clamp?: {
    width: number;        // bounding box width; vertices clamped to [x - w/2, x + w/2]
    height: number;       // bounding box height; vertices clamped to [y - h/2, y + h/2]
  };
}
```

## Modified Interface: ShapeBase

```typescript
// BEFORE (Stage 1/1.5):
export interface ShapeBase {
  type: string;
  x: number;
  y: number;
  rotation?: number;
}

// AFTER (Stage 2):
export interface ShapeBase extends VariationFields {
  type: string;
  x: number;
  y: number;
  rotation?: number;
}
```

All 9 existing shape interfaces (`SquareShape`, `RectangleShape`, `CircleShape`, `TriangleShape`, `TrapezoidShape`, `OctagonShape`, `PolygonShape`, `OvalShape`, `BlobShape`) inherit the three variation fields through `ShapeBase`. No changes to individual shape interfaces.

---

## New Module: src/variation.ts

### Exported Functions

```typescript
/**
 * Derive a deterministic variation seed from generator seed and shape index.
 * Uses different prime constants from blobSeed to ensure independence.
 */
export function varSeed(generatorSeed: number, index: number): number

/**
 * Return the characteristic half-size used as the distortion magnitude basis.
 */
export function charSizeOf(shape: Shape): number

/**
 * Extract vertices from a shape as [x, y] pairs.
 * For circle/oval: samples 16 points around the perimeter.
 * For blob: re-derives the N control points using blobSeed PRNG.
 */
export function extractVertices(
  shape: Shape,
  generatorSeed: number,
  shapeIndex: number
): [number, number][]

/**
 * Perturb each vertex by a PRNG offset in [-charSize*distort, +charSize*distort].
 * Draws 2 prng() values per vertex (dx, dy).
 */
export function applyDistort(
  vertices: [number, number][],
  charSize: number,
  distort: number,
  prng: () => number
): [number, number][]

/**
 * Clamp each vertex to the bounding box [cx±w/2, cy±h/2].
 */
export function applyClamp(
  vertices: [number, number][],
  cx: number,
  cy: number,
  clampWidth: number,
  clampHeight: number
): [number, number][]

/**
 * Convert a vertex list to an SVG path string: M v0 L v1 ... L v(n-1) Z
 */
export function verticesToPath(vertices: [number, number][]): string

/**
 * Scale all size dimensions of a shape by factor f = 1 + (prng()*2-1)*sizeVariance.
 * Consumes exactly one prng() draw.
 * Returns a new shape object with scaled dimensions; all other fields unchanged.
 */
export function applySizeVariance(shape: Shape, prng: () => number): Shape

/**
 * Full distortion render pipeline (assumes sizeVariance already applied):
 * extractVertices → applyDistort → applyClamp (if present) → verticesToPath
 * Always returns tag: "path".
 */
export function renderVaried(
  shape: Shape,
  varPrng: () => number,
  generatorSeed: number,
  shapeIndex: number
): { tag: "path"; attrs: Record<string, string | number> }
```

---

## Modified Module: src/prng.ts

```typescript
// ADDED (Stage 2):
/**
 * Derive a deterministic seed for a shape's variation PRNG.
 * Different primes from blobSeed to guarantee independence.
 */
export function varSeed(generatorSeed: number, index: number): number {
  return (Math.imul(generatorSeed | 0, 1000033) + Math.imul(index, 2246822519)) | 0;
}
```

Note: `varSeed` will be exported from both `src/prng.ts` (for use in variation.ts) and re-exported from `src/variation.ts` for convenience.

---

## Canonicalization Rules (src/canonicalize.ts changes)

All 9 shape types in the canonicalize switch must be updated to include the three variation fields in their whitelists. The whitelist expansion is identical for all types:

```typescript
// Added to every shape's canonical field object:
...(shape.distort !== undefined   && { distort: shape.distort }),
...(shape.sizeVariance !== undefined && { sizeVariance: shape.sizeVariance }),
...(shape.clamp !== undefined     && { clamp: shape.clamp }),
```

Fields absent from the input produce no key in the canonical object (undefined fields are dropped). `clamp` is treated as a nested object — it is included atomically (both `width` and `height` together).

---

## Validation Rules (src/validate.ts changes)

Three new validation cases apply to all shape types:

| Field | Rule | Error message |
|---|---|---|
| `distort` | If present: must be a finite number in `[0, 1]` | `"distort must be a number between 0 and 1"` |
| `sizeVariance` | If present: must be a finite number in `[0, 1]` | `"sizeVariance must be a number between 0 and 1"` |
| `clamp` | If present: `clamp.width` and `clamp.height` must each be finite and > 0 | `"clamp.width must be a positive finite number"` / `"clamp.height must be a positive finite number"` |

Validation is applied in the shared validation pass before type-specific checks. All three fields are optional; absent fields are not validated.

---

## Entity Relationship Diagram

```
GeneratorInput
  └── shapes: Shape[]
        └── ShapeBase (extends VariationFields)
              ├── distort?: number         — 0-1 vertex perturbation
              ├── sizeVariance?: number    — 0-1 size scale factor range
              ├── clamp?: ClampBox         — bounding box for distorted vertices
              ├── x, y: number             — center position
              └── rotation?: number        — degrees

ClampBox
  ├── width: number    — full box width (centered on x)
  └── height: number   — full box height (centered on y)

variation.ts (internal pipeline)
  ├── varSeed(seed, i) → number
  ├── charSizeOf(shape) → number
  ├── extractVertices(shape, seed, i) → [number,number][]
  ├── applyDistort(verts, cs, dt, prng) → [number,number][]
  ├── applyClamp(verts, cx, cy, w, h) → [number,number][]
  ├── verticesToPath(verts) → string
  ├── applySizeVariance(shape, prng) → Shape
  └── renderVaried(shape, prng, seed, i) → { tag: "path"; attrs }
```

---

## State Transitions in generate.ts

```
Input shape
    │
    ▼
canonicalize() + validate()
    │
    ▼
[has sizeVariance > 0?]
    ├─ yes → applySizeVariance(shape, varPrng) → workShape
    └─ no  → workShape = shape
    │
    ▼
[has distort > 0?]
    ├─ yes → renderVaried(workShape, varPrng, seed, i) → { tag: "path", attrs }
    └─ no  → existing switch dispatch (renderSquare / renderCircle / ...)
    │
    ▼
assemble ShapeElement → assembleSvg()
```

Key invariant: If neither `sizeVariance` nor `distort` is active, the variation pipeline is a no-op and the output is byte-for-byte identical to Stage 1/1.5.
