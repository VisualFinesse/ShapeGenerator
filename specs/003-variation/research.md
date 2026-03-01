# Research: Stage 2 — Variation

## R1: Distortion Parameterization

**Decision**: `distort: number` (0–1 scale) representing the perturbation magnitude as a fraction of the shape's characteristic half-size (`charSize`).

**Rationale**: A normalized 0–1 scale means `distort=0.1` applies the same *relative* perturbation (10% of charSize) regardless of whether the shape is 10px or 1000px. This is intuitive for designers and consistent across shape types. Explicit pixel offsets would require callers to know the shape's rendered size, coupling the variation API to layout decisions.

**Alternatives considered**:
- Explicit pixel offset bounds (e.g., `{ minOffset: -5, maxOffset: 5 }`): Rejected — couples API to physical scale; inconsistent across shape sizes.
- Percentage of canvas size: Rejected — variation would change when canvas changes, making per-shape control unintuitive.
- Per-axis distortion (`distortX`, `distortY`): Rejected — adds API surface without clear design value; symmetric perturbation covers the primary use case.

**PRNG offset formula**: `offset = (prng() * 2 - 1) * charSize * distort`
This draws from `[0,1)`, converts to `[-1, 1)`, then scales. Each vertex draws two independent offsets (dx, dy).

---

## R2: Clamping Scope

**Decision**: `clamp: { width, height }` constrains only distorted **vertex positions** to a bounding box centered on the shape's `(x, y)`. Clamping applies after distortion and before path assembly.

- Vertex `vx` is clamped to `[x - width/2, x + width/2]`
- Vertex `vy` is clamped to `[y - height/2, y + height/2]`
- `clamp` has no effect when `distort === 0` (no perturbation to constrain)
- Shape `x`, `y`, `rotation`, and `size` dimensions are never modified by clamping

**Rationale**: The primary use case is layout safety — preventing distorted vertices from exceeding a reserved cell in a design grid. Clamping position or rotation would change the shape's placement semantics, which belongs to the caller. Clamping before distortion (pre-clamp) was considered and rejected: the designer intent is to allow distortion up to a boundary, not to shrink the base shape.

**Alternatives considered**:
- Canvas-level clamp (global): Rejected — too coarse; per-shape control is the project's established pattern.
- Clamp both position and size: Rejected — position/size changes break shape placement contracts; callers own layout.
- Pre-distortion clamp (shrink base shape): Rejected — changes the unperturbed shape's geometry, which is unexpected.

---

## R3: PRNG Seed Strategy for Variation

**Decision**: Add `varSeed(generatorSeed, index)` to `src/prng.ts` using different prime constants than `blobSeed` to guarantee independence.

```typescript
export function varSeed(generatorSeed: number, index: number): number {
  return (Math.imul(generatorSeed | 0, 1000033) + Math.imul(index, 2246822519)) | 0;
}
```

Primes: `1000033` (next prime after `1000003` used in blobSeed), `2246822519` (distinct from blobSeed's `2654435761`). With different primes, `varSeed(s, i) !== blobSeed(s, i)` for all practical (s, i) combinations, ensuring a blob's inherent shape and its distortion layer are derived from independent PRNG streams.

**Rationale**: Reusing `blobSeed` would cause blob shapes with distort > 0 to correlate their distortion with their base shape PRNG, making them non-independent. Using fresh primes is a zero-cost guarantee of independence.

**Alternatives considered**:
- Separate salt value (XOR with constant): Rejected — less rigorous; chosen primes are empirically independent.
- Use generator-level seed directly (no mixing): Rejected — all shapes at the same index would share the same seed, making variation identical for shapes of different types at the same index.

---

## R4: Size Variation Model

**Decision**: Scale factor `f = 1 + (prng() * 2 - 1) * sizeVariance` gives a value uniformly distributed in `[1 - sizeVariance, 1 + sizeVariance)`. Applied to all size dimensions (see spec §US2 table). Clamped: `Math.max(1, dim * f)` for each dimension.

**Rationale**: A symmetric multiplicative scale factor centered at 1.0 means `sizeVariance=0.2` allows shapes to be 80%–120% of their specified size — intuitive for a "tolerance" concept. Additive offsets were considered and rejected: they behave differently for large vs. small shapes.

**Minimum size = 1**: Prevents zero or near-zero geometry that would produce degenerate SVG. The minimum of 1 is conservative (much smaller than typical shape sizes) and avoids invisible output.

**Alternatives considered**:
- Additive size offset: Rejected — scale-dependent; inconsistent feel.
- Log-normal distribution: Rejected — more complex, no clear design advantage for this use case.
- Min-size = 0: Rejected — zero-size shapes produce empty paths; degenerate output violates the "geometry must be usable" principle.

---

## R5: Vertex Extraction Strategy

**Decision**: Each shape type's vertices are extracted as `[number, number][]` pairs:

| Shape type | Vertex extraction |
|---|---|
| `square` | 4 corners: TL, TR, BR, BL from center + half-size |
| `rectangle` | 4 corners: TL, TR, BR, BL from center + width/2, height/2 |
| `triangle` | 3 vertices: equilateral from center (angle = −π/2 + k × 2π/3) |
| `trapezoid` | 4 corners: TL, TR, BR, BL using topWidth/bottomWidth/height |
| `octagon` | 8 vertices: angle = k × π/4 − π/2 at circumradius |
| `polygon` | N vertices: angle = k × 2π/N − π/2 at circumradius |
| `circle` | 16 sampled points at circumradius |
| `oval` | 16 sampled points at rx = width/2, ry = height/2 |
| `blob` | N control points re-derived using blobSeed PRNG (same as normal render) |

**Rationale**: Extracting vertices in `variation.ts` keeps all 9 shape renderers in `src/shapes/` unchanged — zero regression risk. The extraction duplicates some geometry math from the renderers, but this is an acceptable trade-off: the variation module is a new concern isolated from the rendering concern.

**Alternative considered**: Exporting vertex extraction from each shape renderer. Rejected — would change existing renderer APIs (regression risk) and couple rendering to variation in both directions.

---

## R6: Distorted Blob Rendering

**Decision**: For blob shapes with `distort > 0`, derive the control points using the same blobSeed PRNG (as in normal rendering), then apply varPrng perturbation to each control point, then re-run Catmull-Rom → Bézier conversion on the perturbed control points.

**Rationale**: This layering means a distorted blob = blob's inherent randomness (from blobSeed) + additive distortion layer (from varSeed). Both PRNGs are seeded deterministically from `generatorSeed + shapeIndex`, so full determinism is preserved. The Catmull-Rom step on perturbed control points produces a smooth spline through the distorted points, which looks better than linear interpolation for blob shapes.

**Alternative considered**: Skip Catmull-Rom and use linear vertices for distorted blobs (same as other distorted shapes). Rejected — a distorted blob rendered as a jagged polygon looks unnatural; blobs are inherently smooth shapes and should remain so even when distorted.

---

## R7: Path Format for Distorted Non-Blob Shapes

**Decision**: When `distort > 0`, non-blob shapes are rendered as a linear `<path>`: `M v0 L v1 L v2 ... L v(n-1) Z` (straight lines between perturbed vertices). No spline smoothing.

**Rationale**: Linear vertex connections are the right default for distorted hard-edged shapes (squares, polygons, triangles). The "rough" aesthetic from straight lines between slightly offset vertices is precisely the hand-drawn character Stage 2 targets. Smooth splines would soften the distortion effect.

**Alternative considered**: Catmull-Rom for all distorted shapes. Rejected — inconsistent with the semantic intent; hard shapes should stay hard even when distorted. Callers wanting smooth distortion can use `blob` or await a future stage.

---

## R8: generate.ts Variation Pipeline

**Decision**: The variation pipeline in `generate.ts` executes in this order per shape:

1. Check if any variation is active: `const sv = shape.sizeVariance ?? 0; const dt = shape.distort ?? 0`
2. Create varPrng only if needed: `const varPrng = (sv > 0 || dt > 0) ? createPrng(varSeed(seed, i)) : null`
3. Apply size scaling (if `sv > 0`): `workShape = applySizeVariance(shape, varPrng)`
4. Render: if `dt > 0` → `renderVaried(workShape, varPrng, seed, i)` else → normal switch dispatch

**Rationale**: Creating varPrng only when needed avoids unnecessary PRNG instantiation for the common case (shapes without variation). The size-then-distort order matches the spec and is intuitive: first settle on the final size, then add texture to the edges. The shape dispatch in step 4 falls through to the existing switch unchanged, meaning zero regression for non-varied shapes.
