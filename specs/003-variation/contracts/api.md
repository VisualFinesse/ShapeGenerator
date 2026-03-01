# API Contract: Stage 2 — Variation

## Overview

Stage 2 extends the existing `generate(input: GeneratorInput): GeneratorOutput` contract with three optional per-shape variation fields. The function signature and return type are **unchanged**. All changes are additive.

---

## Input Contract

### VariationFields (new — added to all shapes via ShapeBase)

```typescript
interface VariationFields {
  distort?: number;
  sizeVariance?: number;
  clamp?: { width: number; height: number };
}
```

### Extended Shape Examples

```typescript
// Square with vertex distortion
{ type: "square", x: 100, y: 100, size: 50, distort: 0.15 }

// Circle with size variation
{ type: "circle", x: 200, y: 200, size: 40, sizeVariance: 0.3 }

// Polygon with distortion + clamp
{ type: "polygon", x: 150, y: 150, sides: 6, size: 60, distort: 0.2, clamp: { width: 140, height: 140 } }

// Rectangle with both variation types
{ type: "rectangle", x: 100, y: 80, width: 120, height: 60, sizeVariance: 0.2, distort: 0.1 }
```

### Field Validation

| Field | Type | Constraint | Error when violated |
|---|---|---|---|
| `distort` | `number` (optional) | `0 ≤ distort ≤ 1`, finite | `"distort must be a number between 0 and 1"` |
| `sizeVariance` | `number` (optional) | `0 ≤ sizeVariance ≤ 1`, finite | `"sizeVariance must be a number between 0 and 1"` |
| `clamp.width` | `number` (optional) | `> 0`, finite | `"clamp.width must be a positive finite number"` |
| `clamp.height` | `number` (optional) | `> 0`, finite | `"clamp.height must be a positive finite number"` |

### Backward Compatibility

Shapes without variation fields pass validation unchanged. `distort: 0` and `sizeVariance: 0` are treated as absent (no variation applied). `clamp` without `distort > 0` is accepted but has no effect on output.

---

## Output Contract

### SVG Output When Variation Is Inactive

Identical to Stage 1/1.5 output for that shape type. No variation fields in canonical input → same SVG bytes.

### SVG Output When `distort > 0`

The shape element is always `<path>`:

```xml
<!-- Square with distort: 0.15, seed: 42 -->
<g transform="rotate(0, 100, 100)">
  <path id="s42-square-0" d="M 71.3 68.2 L 128.7 71.1 L 131.4 129.8 L 70.2 128.1 Z" />
</g>
```

- **4 vertices** for rectangle/square/trapezoid; **3** for triangle; **8** for octagon; **N** for polygon; **16** for circle/oval; **N control points** for blob
- Path format: `M x0 y0 L x1 y1 ... L x(n-1) y(n-1) Z`
- Numbers formatted with `fmt()` (6dp max, trailing zeros stripped) — same as existing output
- Element `id` follows existing pattern: `s{seed}-{type}-{index}` — **unchanged**
- `rotation` transform applied the same way as non-distorted shapes

### SVG Output When `sizeVariance > 0` Only (no `distort`)

The shape renders with its normal tag for the type (e.g., `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`, `<path>`). The size dimensions are scaled by the PRNG factor but the rendering pipeline is otherwise unchanged.

```xml
<!-- Circle with sizeVariance: 0.3, seed: 99, index: 0 — actual radius varies -->
<circle id="s99-circle-0" cx="100" cy="100" r="43.7" />
```

### Metadata

`GeneratorOutput.metadata` is unchanged: `{ shapeCount: number }`. No new metadata fields.

---

## Determinism Contract

All variation is fully deterministic:

| Invariant | Description |
|---|---|
| `generate(input) === generate(input)` | Identical inputs always produce identical SVG |
| `distort: 0` → no change | Same output as shape without distort field |
| `sizeVariance: 0` → no change | Same output as shape without sizeVariance field |
| Order-stable | Adding `distort` to shape at index 0 does not affect shapes at index 1+ |
| PRNG isolation | `varSeed(s, i) ≠ blobSeed(s, i)` — blob and variation PRNGs are independent |

---

## Canonicalization Contract

Variation fields are included in the canonical representation when present:

```typescript
// Input: { type: "square", x: 100, y: 100, size: 50, distort: 0.1, unknownField: true }
// Canonical: { type: "square", x: 100, y: 100, size: 50, distort: 0.1 }
//   → unknownField dropped, distort preserved

// Input: { type: "square", x: 100, y: 100, size: 50 }
// Canonical: { type: "square", x: 100, y: 100, size: 50 }
//   → no variation keys emitted when absent
```

The `clamp` object is canonicalized atomically — both `width` and `height` are included together, or neither is.
