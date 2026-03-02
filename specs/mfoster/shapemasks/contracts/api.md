# API Contract: Stage 4 — Shape Masks & Layers

## Overview

The `generate(input: GeneratorInput): GeneratorOutput` signature is unchanged. Two new optional fields are added to every shape: `layer?: number` and `mask?: MaskShape | MaskShape[]`. All changes are additive and backward-compatible.

---

## Updated Input Type

### `GeneratorInput` (unchanged)

```typescript
interface GeneratorInput {
  seed: number;
  canvas: { width: number; height: number };
  shapes: Shape[];
  outputMode?: "semantic" | "path";
}
```

### New Shape Fields (added to all 9 shape types via `ShapeBase`)

```typescript
interface LayerFields {
  layer?: number;  // finite; default 0 for sort; negative, fractional allowed
}

interface MaskFields {
  mask?: MaskShape | MaskShape[];  // MaskShape = Shape (any of the 9 types)
}
```

---

## Field Specifications

### `layer`

| Property | Value |
|----------|-------|
| Type | `number` |
| Required | No |
| Default (sort) | `0` |
| Constraint | Must be finite (`isFinite(layer) === true`) |
| Error | `"layer must be a finite number"` |
| Effect | Controls SVG element order (lower = further back) |

**Example**:
```json
{
  "type": "circle",
  "x": 200, "y": 200, "size": 100,
  "layer": 2
}
```

---

### `mask`

| Property | Value |
|----------|-------|
| Type | `Shape` or `Shape[]` |
| Required | No |
| Default | No mask applied |
| Constraint | Each MaskShape must be a valid Shape (same validation as top-level shapes) |
| Effect | Generates `<mask>` in `<defs>`; adds `mask="url(#mask-{id})"` to the shape element |

**MaskShape behavior**:
- Coordinates in canvas space (same as `x`/`y` of all shapes)
- Default fill: `"white"` (when no `fill` or `fillGradient` on the MaskShape)
- White = reveals target shape; black = hides it; grey = partial transparency
- Variation fields (`distort`, `sizeVariance`, `bezier`) are honored
- Styling fields (`fill`, `stroke`, `opacity`, gradients) are honored
- `mask` and `layer` fields on MaskShapes are silently ignored

---

## Layer Ordering Contract

Given input shapes `[A, B, C]` with layers `[1, 0, 2]`:
- SVG output order: `B` (layer 0), `A` (layer 1), `C` (layer 2)
- IDs: `A` → index 0, `B` → index 1, `C` → index 2 (original array positions)
- PRNG seeds: derived from original indices (unaffected by layer sort)

Given input shapes `[A, B, C]` with layers `[0, 0, 0]` (all same):
- SVG output order: `A`, `B`, `C` (stable sort preserves original order)

---

## SVG Output Contract

### With `layer` only

```typescript
generate({
  seed: 1,
  canvas: { width: 200, height: 200 },
  shapes: [
    { type: "circle", x: 100, y: 100, size: 60, layer: 1 },  // index 0
    { type: "square", x: 100, y: 100, size: 80 }              // index 1, layer 0 (default)
  ]
})
```

Expected SVG element order (square layer 0 before circle layer 1):
```xml
<rect id="s1-square-1" .../>    <!-- square, index 1, layer 0 -->
<circle id="s1-circle-0" .../>  <!-- circle, index 0, layer 1 -->
```

### With `mask` only

```typescript
generate({
  seed: 1,
  canvas: { width: 200, height: 200 },
  shapes: [{
    type: "circle",
    x: 100, y: 100, size: 100,
    mask: { type: "square", x: 100, y: 100, size: 80 }
  }]
})
```

Expected SVG:
```xml
<svg ...>
  <defs>
    <mask id="mask-s1-circle-0" maskUnits="userSpaceOnUse">
      <rect x="60" y="60" width="80" height="80" fill="white"/>
    </mask>
  </defs>
  <circle id="s1-circle-0" cx="100" cy="100" r="50" mask="url(#mask-s1-circle-0)"/>
</svg>
```

### With multiple mask shapes

```typescript
mask: [
  { type: "circle", x: 80, y: 100, size: 60 },   // left half
  { type: "circle", x: 120, y: 100, size: 60 }    // right half
]
```

Expected `<mask>` content:
```xml
<mask id="mask-s1-circle-0" maskUnits="userSpaceOnUse">
  <circle cx="80" cy="100" r="30" fill="white"/>
  <circle cx="120" cy="100" r="30" fill="white"/>
</mask>
```

### With `mask` + gradients (Stage 3 + Stage 4)

A mask shape may carry its own gradient (black-to-white for a soft fade effect):
```typescript
mask: {
  type: "square",
  x: 100, y: 100, size: 100,
  fillGradient: {
    type: "linear",
    x1: 0, y1: 0, x2: 1, y2: 0,
    stops: [
      { offset: 0, color: "black" },
      { offset: 1, color: "white" }
    ]
  }
}
```

The gradient def is accumulated in the same top-level `<defs>` block.

---

## Validation Errors

| Input | Error |
|-------|-------|
| `layer: NaN` | `"layer must be a finite number"` |
| `layer: Infinity` | `"layer must be a finite number"` |
| `mask: [{ type: "invalid", ... }]` | `"unknown shape type: invalid"` |
| `mask: [{ type: "circle", x: 0, y: 0, size: -1 }]` | Same as top-level: `"circle size must be a positive finite number"` |

---

## Backward Compatibility

All inputs valid for Stage 3 remain valid for Stage 4. SVG output for inputs without `layer` or `mask` fields is byte-for-byte identical to Stage 3 output.

| Stage 3 input | Stage 4 output |
|---------------|----------------|
| No `layer` field | Same SVG (sort is stable; original order preserved) |
| No `mask` field | Same SVG (no `<mask>` in defs, no `mask` attr on element) |
| Existing gradient defs | Unchanged (mask shape gradient defs appended after, not before) |
