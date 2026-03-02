# Research: Stage 4 — Shape Masks & Layers

## R1: `<mask>` vs `<clipPath>`

**Decision**: Use SVG `<mask>` for all masking. Do not use `<clipPath>`.

**Rationale**:

- `<clipPath>` is hard-edged: a pixel is either fully clipped or fully visible. It cannot represent soft edges, transparency gradients, or luminance-based fading.
- `<mask>` supports luminance and alpha masking: the mask shape's color values (white = visible, black = transparent) allow smooth transitions and semi-transparent mask edges.
- Constitution Composability principle states "a shape must be usable as a mask" — soft masking via `<mask>` is more powerful and fulfills the composability intent.
- `<clipPath>` can be added in a future stage if hard-edge clipping is needed; introducing `<mask>` now does not prevent it.

**Alternatives considered**:

- `<clipPath>` only: Rejected — hard-edged only; insufficient for design use cases.
- Both `<mask>` and `<clipPath>` in this stage: Deferred — adds API surface without strong justification for v1.

---

## R2: `maskUnits` Strategy

**Decision**: Use `maskUnits="userSpaceOnUse"` (the SVG default).

**Rationale**:

- `userSpaceOnUse` means mask shape coordinates are in the same canvas coordinate space as all other shapes. A MaskShape with `x: 200, y: 200, size: 100` sits at the same canvas position as a main shape with identical coordinates.
- This aligns with how all ShapeGenerator shapes work: absolute `x` / `y` in canvas pixels.
- `maskContentUnits="objectBoundingBox"` would require callers to specify coordinates as fractions of the masked shape's bounding box — counterintuitive and inconsistent with the rest of the API.

**SVG output**:

```xml
<mask id="mask-s42-circle-0" maskUnits="userSpaceOnUse">
  <rect .../>
</mask>
```

**Alternatives considered**:

- Omit `maskUnits` (relies on SVG default "userSpaceOnUse"): Rejected in favor of explicit attribute for self-documenting output.
- `maskContentUnits="objectBoundingBox"`: Rejected — would require different coordinate semantics for mask shapes vs. regular shapes.

---

## R3: `mask-type` and Luminance Default

**Decision**: Do not emit `mask-type` attribute. The SVG2 default (`mask-type="luminance"`) is used implicitly.

**Rationale**:

- SVG `mask-type="luminance"` (the default): the mask's luminance (brightness) determines visibility — white = visible, black = hidden, grey = semi-transparent.
- `mask-type="alpha"` uses the mask's alpha channel instead. Less intuitive for shapes that use solid fill colors.
- The default white fill for mask shapes (`fill="white"`, FR-417) means: unless a caller explicitly sets fill to a non-white value, the mask shape fully reveals the target shape. This is the expected default behavior.
- Not emitting `mask-type` keeps the SVG output clean; callers who need alpha masking can do so in a future stage.

**Alternatives considered**:

- Always emit `mask-type="luminance"` explicitly: Rejected — verbose; default behavior is correct and well-specified.
- Support `mask-type` as a MaskShape field: Deferred — not needed for this stage.

---

## R4: Layer Sorting Strategy

**Decision**: Stable sort by `layer` value (ascending) after canonicalize/validate, before rendering. Original array index captured before sort, used for all shapeId / varSeed / maskSeed derivations.

**Implementation approach**:

```typescript
// In generate.ts:
const indexed = canonical.shapes.map((shape, i) => ({ shape, i }));
indexed.sort((a, b) => (a.shape.layer ?? 0) - (b.shape.layer ?? 0));
// All rendering uses `i` (original index) for IDs and PRNG seeds
```

**Rationale**:

- JavaScript's `Array.prototype.sort` is guaranteed stable in all modern environments (ECMAScript 2019+). TypeScript target ES2019+ is already in use.
- Capturing the original index before sorting ensures `shapeId(seed, type, i)` and `varSeed(seed, i)` produce identical values regardless of layer assignment — satisfying the determinism invariant (FR-404).
- Sorting at the `canonical.shapes` level (after validation) keeps the sort logic in one place (generate.ts).

**Default layer**: Shapes without `layer` field are treated as `layer === 0` for sorting (via `?? 0`). They sort among themselves in original array order (stable sort guarantee).

**Alternatives considered**:

- Sort before canonicalize: Rejected — would require two passes over shapes.
- Store layer on ShapeElement (internal type): Rejected — `ShapeElement` is a pure rendering struct; sorting is a generate.ts concern.

---

## R5: MaskShape Type Identity

**Decision**: `MaskShape` is a type alias for `Shape` — the same union of all 9 shape types. No new type is introduced.

**Rationale**:

- Reusing the `Shape` type means mask shapes benefit from all existing validation, canonicalization, and rendering logic without duplication.
- Mask shapes render using exactly the same pipeline as main shapes (just without `id` attr, and with default `fill="white"`).
- The `mask` and `layer` fields on MaskShapes are silently ignored (not validated, not rendered). This is explicit in the spec (FR-418) and handled in `buildMaskDef`.

**TypeScript definition**:

```typescript
export type MaskShape = Shape; // type alias
```

**Alternatives considered**:

- A restricted MaskShape type without `mask`/`layer` fields: Rejected — adds type complexity; runtime behavior (silently ignoring those fields) is simpler.
- Separate MaskShape-specific renderers: Rejected — identical to existing renderers except for `id` omission; centralizing in `mask.ts` avoids duplication.

---

## R6: Mask ID Convention

**Decision**: Mask elements use ID format `mask-{shapeId}` where `shapeId` is the parent shape's ID.

**Rationale**:

- Consistent with gradient ID format: `grad-{shapeId}-fill` / `grad-{shapeId}-stroke`.
- Derived deterministically from `seed + type + originalIndex` — satisfies replay integrity.
- One mask element per masked shape — no sharing across shapes.

**SVG output**:

```xml
<mask id="mask-s42-circle-0" maskUnits="userSpaceOnUse">
  ...mask shapes...
</mask>
```

Shape element:

```xml
<circle ... mask="url(#mask-s42-circle-0)"/>
```

**Alternatives considered**:

- Shared mask elements (dedup by structural equality): Rejected — structural equality on nested shape objects is complex; per-shape masks are always correct and simpler.
- Caller-supplied mask IDs: Deferred — auto-generation is sufficient for this stage.

---

## R7: Default Fill="white" for Mask Shapes

**Decision**: When a MaskShape has no `fill` and no `fillGradient`, inject `fill="white"` as the default styling attr for that mask shape element.

**Rationale**:

- SVG `mask-type="luminance"`: a shape with the default SVG fill (black) would produce an invisible mask — the target shape would be fully hidden. This is counterintuitive.
- Defaulting to white means "show the target shape in the area covered by the mask shape" — the most natural default behavior.
- Callers can override with any fill (black to cut out, grey for semi-transparency, a gradient for soft edges).
- This default is applied only to mask shapes — top-level shapes are unaffected.

**Implementation**: In `buildMaskDef`, after computing styling attrs for a mask shape, if `fill` is not in attrs, inject `attrs.fill = "white"`.

---

## R8: `maskSeed` — PRNG Isolation for Mask Shapes

**Decision**: Introduce a new `maskSeed(generatorSeed, parentIndex, maskIndex)` function in `prng.ts`. Mask shapes consume draws from a `createPrng(maskSeed(...))` instance, completely independent of the parent shape's `varPrng`.

**Rationale**:

- If mask shapes drew from the parent's `varPrng`, adding or removing a mask shape would shift all subsequent PRNG draws for the parent shape — violating determinism.
- An isolated seed per mask shape means mask variation is fully deterministic and independent. Changing a mask shape does not affect the parent shape's distortion output.

**Seed formula**:

```typescript
export function maskSeed(
  genSeed: number,
  parentIdx: number,
  maskIdx: number
): number {
  return (genSeed * 1000039 + parentIdx * 65537 + maskIdx) >>> 0;
}
```

**Primes used**: 1000039 (near 1000033 used by varSeed), 65537 (Fermat prime, commonly used for index mixing). The `>>> 0` ensures unsigned 32-bit result for mulberry32 compatibility.

**Alternatives considered**:

- Derive mask PRNG from parent's varPrng: Rejected — order-dependent; breaks FR-404 determinism.
- Single shared maskSeed(genSeed, parentIdx): Rejected — all mask shapes for the same parent would share the same seed; first mask shape's PRNG would overlay second mask shape's.

---

## R9: `buildMaskDef` Module

**Decision**: Create `src/mask.ts` with a `buildMaskDef` function. This function takes the mask shapes, renders each one using the same logic as generate.ts, and returns the complete `<mask>...</mask>` string for injection into `defs[]`.

**Signature**:

```typescript
export function buildMaskDef(
  maskId: string,
  maskShapes: MaskShape[],
  mode: "semantic" | "path",
  generatorSeed: number,
  parentIndex: number,
  gradientDefs: string[] // accumulator — mask shape gradients are pushed here
): string;
```

**Rationale**:

- Isolating mask rendering in `mask.ts` keeps `generate.ts` clean and follows the pattern of `styling.ts` from Stage 3.
- The `gradientDefs` parameter is an accumulator so that mask shapes' gradient `<defs>` strings are appended to the same top-level defs array that `assembleSvg` will consume.
- Mask shapes are rendered using the same switch dispatch as main shapes (renderSquare, renderCircle, etc.) but without IDs. The `id` attr is not set — mask shapes are anonymous.

**Alternatives considered**:

- Inline mask rendering in generate.ts: Rejected — would significantly bloat generate.ts; mask building is a distinct concern.
- A full sub-pipeline in mask.ts (canonicalize + validate + render): Mask shapes are pre-canonicalized and pre-validated by generate.ts before buildMaskDef is called. buildMaskDef only handles rendering.

---

## R10: Canonicalization of `mask` and `layer` Fields

**Decision**: `layer` and `mask` are whitelisted in the `base` spread in `canonicalize.ts`. `layer` uses the same conditional spread pattern as other optional scalar fields. `mask` is canonicalized as an array: single MaskShape is wrapped in array; each MaskShape in the array is canonicalized using the same per-type whitelisting as top-level shapes (minus `mask` and `layer` keys).

**Rationale**:

- Consistent with how gradient objects (`fillGradient`, `strokeGradient`) are canonicalized atomically in Stage 3.
- Normalizing single-shape `mask` to `mask: [shape]` array simplifies downstream code (always an array after canonicalize).
- Each MaskShape runs through the same per-type whitelist as a top-level shape — unknown fields on mask shapes are dropped. `mask` and `layer` fields on mask shapes are silently excluded from the canonical MaskShape output.

**Replay integrity**: `mask` and `layer` are part of the canonical input. Changing them changes SVG output. Generator version is unchanged (additive fields, no breaking change to inputs without these fields).
