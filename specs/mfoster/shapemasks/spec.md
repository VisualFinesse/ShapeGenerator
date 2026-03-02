# Feature Specification: Stage 4 — Shape Masks & Layers

**Branch**: `mfoster/shapemasks`
**Stage**: 4
**Depends on**: Stage 3 (`003-variation` with styling/bezier)

---

## Overview

Extend the SVG shape engine with two compositing features: **Layers** and **Shape Masks**.

**Layers** (`layer?: number`) allow callers to control rendering order (z-order) of shapes. Shapes with lower layer values render below shapes with higher values. SVG's painter's model (document order) is leveraged — shapes are sorted by layer value before being emitted.

**Shape Masks** (`mask?: MaskShape | MaskShape[]`) allow a shape to be clipped or faded by one or more mask shapes. Mask shapes are rendered as SVG `<mask>` elements inside `<defs>`. The masked shape references its mask via `mask="url(#mask-{id})"`. Mask shapes use SVG luminance masking: white areas reveal the target shape, black areas hide it.

Both features are additive. Shapes without `layer` or `mask` fields produce SVG identical to Stage 3.

---

## User Stories

### US1 — Layers (P1)

**As a caller**, I want to control the z-order of shapes so that shapes can appear in front of or behind other shapes regardless of their position in the input array.

**Acceptance criteria**:

- FR-400: Any `Shape` may carry `layer?: number` — any finite number (positive, negative, or fractional)
- FR-401: When `layer` is absent, the shape is treated as if `layer === 0` for sorting purposes
- FR-402: Shapes are sorted by ascending `layer` value before being emitted into the SVG (lower layer = rendered earlier = further behind)
- FR-403: Sorting is stable — shapes with the same `layer` value maintain their relative order from the input array
- FR-404: Shape IDs and PRNG seeds are derived from the original input array position (before layer sorting), ensuring determinism is preserved when layer values change
- FR-405: Layer values need not be integers; any finite number is valid
- FR-406: Non-finite layer values (NaN, ±Infinity) are rejected: `"layer must be a finite number"`
- FR-407: Shapes without `layer` field produce SVG output identical to Stage 3

---

### US2 — Shape Masks (P2)

**As a caller**, I want to define a mask shape (or multiple mask shapes) for a shape so that only the part of the shape inside the mask region is visible.

**Acceptance criteria**:

- FR-410: Any `Shape` may carry `mask?: MaskShape | MaskShape[]` — one or more shapes defining the visible region
- FR-411: `MaskShape` is the same union type as `Shape` — any of the 9 supported shape types
- FR-412: Mask shapes use SVG luminance masking (`mask-type="luminance"` is the SVG default): white = fully visible, black = fully hidden
- FR-413: When `mask` is absent, the shape renders identically to Stage 3 (no `mask` attribute on the SVG element)
- FR-414: When `mask` is present (non-empty), a `<mask id="mask-{shapeId}" maskUnits="userSpaceOnUse">` element is added to `<defs>`; the shape element receives `mask="url(#mask-{shapeId})"` attribute
- FR-415: `maskUnits="userSpaceOnUse"` — mask shape coordinates use the same canvas coordinate space as all other shapes (absolute pixel positions)
- FR-416: Multiple mask shapes in an array are all rendered inside the single `<mask>` element; their combined luminance values define the composite visible region
- FR-417: When a MaskShape has no `fill` and no `fillGradient`, `fill="white"` is applied as the default (so the mask shape is visible in the mask by default)
- FR-418: MaskShape fields `mask` and `layer` are silently ignored — mask nesting is not supported; mask shapes cannot themselves be masked or layer-sorted
- FR-419: MaskShape variation fields (`distort`, `sizeVariance`, `clamp`, `bezier`, `bezierDirection`) are honored — a mask shape may be distorted or have bezier rounding
- FR-420: MaskShape styling fields (`fill`, `stroke`, `strokeWidth`, `opacity`, `fillGradient`, `strokeGradient`) are honored — styling on mask shapes controls luminance values in the mask
- FR-421: MaskShape PRNG is derived from a deterministic seed: `maskSeed(generatorSeed, parentIndex, maskIndex)` — independent from the parent shape's `varPrng`
- FR-422: Mask shape SVG elements do not carry an `id` attribute — mask shapes are anonymous inside the `<mask>` element
- FR-423: Mask shapes are validated as full shapes (type + numeric fields + variation + styling) — invalid mask shapes throw the same validation errors as top-level shapes; `mask` and `layer` fields on MaskShapes are not validated (silently ignored)
- FR-424: Canonicalization applies to mask shapes — unknown fields stripped, all whitelisted fields preserved (same as top-level shapes, minus `mask` and `layer`)
- FR-425: When `mask` is an empty array `[]`, it is treated as absent — no `<mask>` element emitted, no `mask` attribute on the shape
- FR-426: Gradients defined inside mask shapes are accumulated in the same `<defs>` block as top-level shape gradients

---

## PRNG Draw Order (updated)

Layer sorting introduces no PRNG draws. The Stage 2/3 PRNG order for main shapes is unchanged:

1. **Size draw** (only if `sizeVariance > 0`): one `prng()` call
2. **Vertex draws** (only if `distort > 0`): two `prng()` calls per vertex

Mask shape PRNG (per mask shape, independent from parent):

- Seed: `maskSeed(generatorSeed, parentIndex, maskIndex)`
- Same consumption pattern as main shapes for that mask shape's variation fields

---

## Pipeline Order (updated)

```
Input shapes
    │
    ▼
canonicalize() + validate() (all shapes including mask shapes)
    │
    ▼
Sort shapes by layer (stable, ascending) — original array indices preserved
    │
    ▼
For each shape (using original index for IDs and PRNG):
    │
    ├─ [has mask?] → for each MaskShape:
    │                   render MaskShape → { tag, attrs }
    │                   apply default fill="white" if no fill/fillGradient
    │                   push mask element string to defs[]
    │
    ├─ [existing Stage 2/3 pipeline]
    │     sizeVariance → distort/bezier → switch dispatch / renderVaried
    │
    ├─ Apply styling attrs (fill, stroke, gradient, opacity)
    │
    └─ [has mask?] → inject mask="url(#mask-{shapeId})" into attrs
    │
    ▼
assembleSvg(canvas, elements, defs)
```

---

## Backward Compatibility

- All shapes without `layer` or `mask` fields produce SVG identical to Stage 3
- `layer` in canonicalize: whitelisted; absent = not present in canonical output
- `mask` in canonicalize: whitelisted atomically; each MaskShape canonicalized independently
- Validation: both fields are optional; shapes without them pass existing validation unchanged
- `assembleSvg` already accepts `defs` (Stage 3); no changes needed

---

## Out of Scope

- Nested masks (mask shapes cannot have their own `mask` field)
- `<clipPath>` — all masking uses `<mask>`
- `mask-type="alpha"` — luminance only in this stage
- `maskContentUnits` other than the SVG default
- Explicit caller-supplied mask IDs (auto-generated only: `mask-{shapeId}`)
- Mask shape `id` attributes in SVG output
- Per-shape `isolation`, `mix-blend-mode`, or CSS compositing attributes
- Layer groups or nested layer hierarchies
- Explicit `z-index` numbers on the internal `ShapeElement` type — sorting is done in `generate.ts`
