# Data Model: Stage 3 — Styling & Bezier

## New Types

### ColorStop

```typescript
export interface ColorStop {
  offset: number;    // 0–1: position along the gradient (0 = start, 1 = end)
  color: string;     // CSS color string (any valid SVG color — pass-through)
  opacity?: number;  // 0–1: stop-opacity (per-stop transparency)
}
```

### LinearGradient

```typescript
export interface LinearGradient {
  type: "linear";
  x1?: number;  // 0–1 fraction of bounding box width; default 0 (left edge)
  y1?: number;  // 0–1 fraction of bounding box height; default 0 (top edge)
  x2?: number;  // 0–1 fraction of bounding box width; default 1 (right edge)
  y2?: number;  // 0–1 fraction of bounding box height; default 0 (top edge → horizontal)
  stops: ColorStop[];
}
```

### RadialGradient

```typescript
export interface RadialGradient {
  type: "radial";
  cx?: number;  // 0–1 fraction of bounding box width; default 0.5 (center)
  cy?: number;  // 0–1 fraction of bounding box height; default 0.5 (center)
  r?: number;   // 0–1 fraction of bounding box; default 0.5 (covers full shape)
  stops: ColorStop[];
}
```

### Gradient (union)

```typescript
export type Gradient = LinearGradient | RadialGradient;
```

---

## New Interfaces

### StylingFields

```typescript
export interface StylingFields {
  fill?: string;               // CSS color or "none"; absent = SVG default (black)
  stroke?: string;             // CSS color or "none"; absent = SVG default (none)
  strokeWidth?: number;        // positive finite; only emitted when stroke or strokeGradient present
  opacity?: number;            // 0–1; absent or 1 = no attr emitted
  fillGradient?: Gradient;     // overrides fill when present
  strokeGradient?: Gradient;   // overrides stroke when present
}
```

### BezierFields

```typescript
export interface BezierFields {
  bezier?: number;                   // 0–1: corner rounding fraction; 0 = sharp (default)
  bezierDirection?: "out" | "in";    // "out" = convex (default); "in" = concave
}
```

---

## Modified Interface: ShapeBase

```typescript
// BEFORE (Stage 2):
export interface ShapeBase extends VariationFields {
  type: string;
  x: number;
  y: number;
  rotation?: number;
}

// AFTER (Stage 3):
export interface ShapeBase extends VariationFields, StylingFields, BezierFields {
  type: string;
  x: number;
  y: number;
  rotation?: number;
}
```

All 9 existing shape interfaces (`SquareShape`, `RectangleShape`, `CircleShape`, `TriangleShape`, `TrapezoidShape`, `OctagonShape`, `PolygonShape`, `OvalShape`, `BlobShape`) inherit the new fields through `ShapeBase`. No changes to individual shape interfaces.

---

## Modified Function: assembleSvg (src/svg.ts)

```typescript
// BEFORE (Stage 2):
export function assembleSvg(canvas: Canvas, elements: ShapeElement[]): string

// AFTER (Stage 3):
export function assembleSvg(canvas: Canvas, elements: ShapeElement[], defs?: string[]): string
```

When `defs` is non-empty, a `<defs>` block is emitted as the first child of `<svg>`. When `defs` is empty or absent, output is byte-for-byte identical to Stage 2.

---

## New Module: src/styling.ts

Exports gradient def builder and styling attr applier used by `generate.ts`.

### Exported Functions

```typescript
/**
 * Build a complete SVG linearGradient or radialGradient element string.
 * gradientId: the SVG id attribute value (e.g., "grad-s42-circle-0-fill")
 */
export function buildGradientDef(gradientId: string, gradient: Gradient): string

/**
 * Collect styling attrs from a shape for injection into the element's attrs.
 * Returns a partial Record with keys: fill, stroke, stroke-width, opacity.
 * Gradient fill/stroke are NOT included here — they produce a url(#...) value
 * and are handled by the caller (which also builds the gradient def).
 */
export function buildStylingAttrs(
  shape: ShapeBase,
  fillGradId?: string,
  strokeGradId?: string
): Record<string, string | number>
```

---

## Modified Module: src/variation.ts

### Modified Function: verticesToPath

```typescript
// BEFORE (Stage 2):
export function verticesToPath(vertices: [number, number][]): string

// AFTER (Stage 3):
export function verticesToPath(
  vertices: [number, number][],
  bezier?: number,
  direction?: "out" | "in"
): string
```

When `bezier = 0` or absent, output is identical to Stage 2 (straight-line `M L L ... Z`).

When `bezier > 0`:
- Handle length `t = bezier × 0.45`
- For each vertex `v[i]`, prev `p = v[(i-1+N) % N]`, next `n = v[(i+1) % N]`:
  - `P1 = lerp(p, v[i], 1 - t)`  (approaching point on incoming edge)
  - `P2 = lerp(v[i], n, t)`       (departing point on outgoing edge)
  - For `"out"`: control = `v[i]`
  - For `"in"`:  control = `P1 + P2 - v[i]`  (reflection through midpoint)
- Path: `M P1[0] Q ctrl[0] P2[0] L P1[1] Q ctrl[1] P2[1] ... Z`

---

## Modified Module: src/generate.ts

### Condition for path pipeline (extended from Stage 2)

```typescript
const dt = shape.distort ?? 0;
const bz = shape.bezier ?? 0;
const varPrng = (sv > 0 || dt > 0) ? createPrng(varSeed(canonical.seed, i)) : null;
```

Path pipeline triggers when `dt > 0 || bz > 0` (was `dt > 0 && varPrng` in Stage 2).

### Styling attrs injection (new in Stage 3)

After shape element is produced by renderer or variation pipeline:

```typescript
// Gradient fill
let fillGradId: string | undefined;
if (shape.fillGradient) {
  fillGradId = `grad-${id}-fill`;
  defs.push(buildGradientDef(fillGradId, shape.fillGradient));
}

// Gradient stroke
let strokeGradId: string | undefined;
if (shape.strokeGradient) {
  strokeGradId = `grad-${id}-stroke`;
  defs.push(buildGradientDef(strokeGradId, shape.strokeGradient));
}

// Merge styling attrs
const stylingAttrs = buildStylingAttrs(shape, fillGradId, strokeGradId);
Object.assign(attrs, stylingAttrs);
```

---

## Canonicalization Rules (src/canonicalize.ts changes)

All 9 shape types in the canonicalize switch inherit the new fields through the `base` spread. Two new groups are added alongside `rotation`, `distort`, `sizeVariance`, `clamp`:

```typescript
// Added to base (for all 9 shape types):
...(shape.fill          !== undefined && { fill: shape.fill }),
...(shape.stroke        !== undefined && { stroke: shape.stroke }),
...(shape.strokeWidth   !== undefined && { strokeWidth: shape.strokeWidth }),
...(shape.opacity       !== undefined && { opacity: shape.opacity }),
...(shape.fillGradient  !== undefined && { fillGradient: shape.fillGradient }),
...(shape.strokeGradient!== undefined && { strokeGradient: shape.strokeGradient }),
...(shape.bezier        !== undefined && { bezier: shape.bezier }),
...(shape.bezierDirection !== undefined && { bezierDirection: shape.bezierDirection }),
```

Gradient objects (`fillGradient`, `strokeGradient`) are included atomically — the entire object is whitelisted as-is. Unknown sub-fields inside gradient objects are NOT stripped (pass-through).

---

## Validation Rules (src/validate.ts changes)

Validation is added in the shared section (before per-type checks), applied to all shape types:

| Field | Rule | Error message |
|---|---|---|
| `opacity` | If present: finite number in `[0, 1]` | `"opacity must be a number between 0 and 1"` |
| `strokeWidth` | If present: finite number > 0 | `"strokeWidth must be a positive finite number"` |
| `bezier` | If present: finite number in `[0, 1]` | `"bezier must be a number between 0 and 1"` |
| `bezierDirection` | If present: must be `"out"` or `"in"` | `'bezierDirection must be "out" or "in"'` |
| `fillGradient` | If present: validate gradient structure (see below) | per-field messages |
| `strokeGradient` | If present: validate gradient structure (see below) | per-field messages |

### Gradient validation rules (shared helper `validateGradient(grad, fieldName)`):

| Field | Rule | Error message |
|---|---|---|
| `type` | Must be `"linear"` or `"radial"` | `"gradient type must be 'linear' or 'radial'"` |
| `stops` | Must be array with ≥ 1 item | `"{fieldName}.stops must have at least one stop"` |
| `stops[i].offset` | Finite number in `[0, 1]` | `"gradient stop offset must be a number between 0 and 1"` |
| `stops[i].color` | Must be string | `"gradient stop color must be a string"` |
| `stops[i].opacity` | If present: finite number in `[0, 1]` | `"gradient stop opacity must be a number between 0 and 1"` |
| Linear: `x1/y1/x2/y2` | If present: finite number | `"gradient coordinate must be a finite number"` |
| Radial: `cx/cy` | If present: finite number | `"gradient coordinate must be a finite number"` |
| Radial: `r` | If present: finite, > 0 | `"gradient r must be a positive finite number"` |

---

## Entity Relationship Diagram

```
GeneratorInput
  └── shapes: Shape[]
        └── ShapeBase (extends VariationFields, StylingFields, BezierFields)
              ├── [VariationFields — Stage 2]
              │     ├── distort?, sizeVariance?, clamp?
              ├── [StylingFields — Stage 3 new]
              │     ├── fill?: string
              │     ├── stroke?: string
              │     ├── strokeWidth?: number
              │     ├── opacity?: number
              │     ├── fillGradient?: Gradient
              │     └── strokeGradient?: Gradient
              └── [BezierFields — Stage 3 new]
                    ├── bezier?: number
                    └── bezierDirection?: "out" | "in"

Gradient (union)
  ├── LinearGradient  { type: "linear", x1?, y1?, x2?, y2?, stops: ColorStop[] }
  └── RadialGradient  { type: "radial", cx?, cy?, r?, stops: ColorStop[] }

ColorStop  { offset: number, color: string, opacity?: number }

styling.ts (new)
  ├── buildGradientDef(id, gradient) → string
  └── buildStylingAttrs(shape, fillGradId?, strokeGradId?) → Record<string, string|number>

variation.ts (updated)
  └── verticesToPath(vertices, bezier?, direction?) → string   ← extended signature
```

---

## State Transitions in generate.ts (updated)

```
Input shape
    │
    ▼
canonicalize() + validate()
    │
    ▼
[has sizeVariance > 0?]  ← unchanged from Stage 2
    ├─ yes → applySizeVariance(shape, varPrng) → workShape
    └─ no  → workShape = shape
    │
    ▼
[has distort > 0 OR bezier > 0?]  ← UPDATED condition
    ├─ yes → extractVertices(workShape, seed, i)
    │         → if distort > 0: applyDistort(verts, charSize, dt, varPrng)
    │         → if clamp present + distort > 0: applyClamp(verts, ...)
    │         → verticesToPath(verts, bezier, bezierDirection)  ← UPDATED call
    │         → { tag: "path", attrs: { d } }
    └─ no  → existing switch dispatch (unchanged)
    │
    ▼
Apply styling:  ← NEW Stage 3 block
    ├─ if fillGradient: defs.push(buildGradientDef(...)); attrs.fill = "url(#...)"
    ├─ if strokeGradient: defs.push(buildGradientDef(...)); attrs.stroke = "url(#...)"
    └─ Object.assign(attrs, buildStylingAttrs(shape, fillGradId, strokeGradId))
    │
    ▼
ShapeElement + assembleSvg(canvas, elements, defs)  ← defs arg NEW
```

Key invariant: If no styling or bezier fields are present, the styling block is a no-op and output is byte-for-byte identical to Stage 2.
