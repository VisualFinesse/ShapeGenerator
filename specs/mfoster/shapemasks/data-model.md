# Data Model: Stage 4 — Shape Masks & Layers

## New Interfaces

### `LayerFields`

```typescript
export interface LayerFields {
  layer?: number;  // any finite number; default 0 for sorting; negative allowed
}
```

**Validation rules**:
- If present: must be a finite number (`isFinite(layer)` must be true)
- NaN and ±Infinity are rejected: `"layer must be a finite number"`
- Absent = treated as 0 for sort purposes; canonical output omits the key

---

### `MaskShape` (type alias)

```typescript
export type MaskShape = Shape;
```

`MaskShape` is the same union as `Shape`. All 9 shape types are valid as mask shapes. The `mask` and `layer` fields present on the `Shape` types are silently dropped during mask canonicalization and rendering.

---

### `MaskFields`

```typescript
export interface MaskFields {
  mask?: MaskShape | MaskShape[];
}
```

**Validation rules**:
- If present and non-empty: each element is validated as a full `Shape` (type check, numeric field ranges, variation + styling field validation)
- `mask` and `layer` fields on each `MaskShape` are not validated (silently ignored)
- Empty array `[]`: treated as absent; canonical output omits the key
- Single `MaskShape` (non-array): normalized to `[MaskShape]` during canonicalization

---

## Modified Types

### `ShapeBase` (extended)

```typescript
export interface ShapeBase extends VariationFields, StylingFields, BezierFields, LayerFields, MaskFields {
  type: string;
  x: number;
  y: number;
  rotation?: number;
}
```

All 9 concrete shape interfaces (`SquareShape`, `RectangleShape`, etc.) inherit `layer?` and `mask?` via `ShapeBase` — no changes to individual shape interfaces.

---

## New `prng.ts` Export

### `maskSeed`

```typescript
export function maskSeed(genSeed: number, parentIdx: number, maskIdx: number): number {
  return (genSeed * 1000039 + parentIdx * 65537 + maskIdx) >>> 0;
}
```

Produces a deterministic 32-bit seed for mask shape PRNG. Independent from `varSeed` and `blobSeed`.

| Function | Multiplier | Constant | Index factor |
|----------|-----------|----------|-------------|
| `blobSeed` | 1000003 | 2654435761 | shapeIndex |
| `varSeed` | 1000033 | 2246822519 | shapeIndex |
| `maskSeed` | 1000039 | — | parentIdx × 65537 + maskIdx |

---

## New `mask.ts` Module

### `buildMaskDef`

```typescript
export function buildMaskDef(
  maskId: string,
  maskShapes: MaskShape[],
  mode: "semantic" | "path",
  generatorSeed: number,
  parentIndex: number,
  gradientDefs: string[]
): string
```

**Behavior**:
1. For each `maskShape` at index `mi`:
   - Create PRNG: `createPrng(maskSeed(generatorSeed, parentIndex, mi))`
   - Apply `applySizeVariance` if `sizeVariance > 0`
   - Render via existing shape renderers or `renderVaried` (same logic as generate.ts)
   - Apply styling attrs via `buildStylingAttrs`; inject `fill="white"` default if no fill/fillGradient
   - Accumulate any gradient defs into `gradientDefs` array
   - Build SVG element string (no `id` attribute)
2. Assemble: `<mask id="{maskId}" maskUnits="userSpaceOnUse">` + elements + `</mask>`

**Returns**: Complete `<mask>...</mask>` string ready for injection into `defs[]`.

---

## `generate.ts` Changes

### Layer Sort

```typescript
// After canonicalize + validate:
const indexed = canonical.shapes.map((shape, i) => ({ shape, i }));
indexed.sort((a, b) => (a.shape.layer ?? 0) - (b.shape.layer ?? 0));
// Render in sorted order; use i (original index) for all IDs and PRNG
```

### Mask Processing

```typescript
// In the per-shape rendering block, before styling:
const maskShapes = normalizeMask(shape.mask);  // undefined | [] → undefined; Shape → [Shape]
if (maskShapes && maskShapes.length > 0) {
  const maskId = `mask-${id}`;
  defs.push(buildMaskDef(maskId, maskShapes, mode, canonical.seed, i, defs));
  // After attrs assembled: inject mask reference
  attrs["mask"] = `url(#${maskId})`;
}
```

---

## `canonicalize.ts` Changes

New fields added to `base` spread (all shapes):

```typescript
...(shape.layer !== undefined ? { layer: shape.layer } : {}),
...(normalizeMaskForCanonical(shape.mask)),  // omits key if absent/empty
```

`normalizeMaskForCanonical(mask)`:
- If `mask` is absent or empty array: returns `{}`
- If `mask` is a single shape: canonicalizes it and returns `{ mask: [canonicalMaskShape] }`
- If `mask` is an array: canonicalizes each element and returns `{ mask: canonicalMaskShapes }`

Each MaskShape is canonicalized using the same per-type whitelisting as top-level shapes, excluding `mask` and `layer` keys from the base spread.

---

## `validate.ts` Changes

### `validateShape` additions

```typescript
// layer validation (added to existing validateShape):
if (shape.layer !== undefined && !isFinite(shape.layer)) {
  throw new Error("layer must be a finite number");
}

// mask validation (added to existing validateShape):
if (shape.mask !== undefined) {
  const maskArr = Array.isArray(shape.mask) ? shape.mask : [shape.mask];
  for (const ms of maskArr) {
    validateShape(ms);  // recursive — same validation, mask/layer fields on ms are not present after canonicalize
  }
}
```

---

## SVG Output Structure (with mask and layer)

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <!-- gradient defs (Stage 3) -->
    <linearGradient id="grad-s42-circle-0-fill" ...>...</linearGradient>
    <!-- mask defs (Stage 4) -->
    <mask id="mask-s42-circle-0" maskUnits="userSpaceOnUse">
      <rect x="150" y="150" width="100" height="100" fill="white"/>
    </mask>
  </defs>
  <!-- shapes rendered in layer order -->
  <rect id="s42-square-1" .../>   <!-- layer: -1 (rendered first, furthest back) -->
  <circle id="s42-circle-0" ... fill="url(#grad-s42-circle-0-fill)" mask="url(#mask-s42-circle-0)"/>  <!-- layer: 0 -->
  <path id="s42-triangle-2" .../>  <!-- layer: 1 (rendered last, on top) -->
</svg>
```

---

## Field Whitelist Summary (canonicalize.ts additions)

| Field | Type | All Shapes | Notes |
|-------|------|-----------|-------|
| `layer` | `number` | ✓ | Omitted from canonical output if absent |
| `mask` | `MaskShape[]` | ✓ | Normalized to array; omitted if absent or empty; each MaskShape canonicalized without `mask`/`layer` |

---

## Validation Error Messages

| Field | Condition | Message |
|-------|-----------|---------|
| `layer` | Non-finite (NaN, ±Infinity) | `"layer must be a finite number"` |
| `mask[i]` | Invalid shape type | Same as top-level shape: `"unknown shape type: ..."` |
| `mask[i]` | Invalid numeric field | Same as top-level shape type-specific errors |
| `mask[i]` | Invalid variation field | Same as top-level: e.g. `"distort must be a number between 0 and 1"` |
| `mask[i]` | Invalid styling field | Same as top-level: e.g. `"opacity must be a number between 0 and 1"` |
