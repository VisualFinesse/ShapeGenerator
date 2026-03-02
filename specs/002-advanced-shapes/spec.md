# Feature Specification: Advanced Shapes v0.2

**Feature Branch**: `002-advanced-shapes`
**Created**: 2026-03-01
**Status**: Draft
**Depends on**: `001-foster-ts-shapes` ✅
**Input**: ROADMAP.md Stage 1.5 — Extend the shape engine with additional geometric primitives.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Generate SVG with Advanced Shape Types (Priority: P1)

A developer provides a seed, canvas, and an array of shapes that includes one or more of the new types: `trapezoid`, `octagon`, `polygon`, `oval`, `blob`. The engine returns a valid SVG string with all shapes rendered deterministically. The same input always produces byte-for-byte identical output.

**Acceptance Scenarios**:

1. Given a `trapezoid` with `topWidth: 40`, `bottomWidth: 80`, `height: 50`, centered at `(100, 100)`, when SVG is generated in semantic mode, the output contains a `<polygon>` with four correct vertex coordinates.
2. Given an `octagon` with `size: 40` at `(100, 100)`, when SVG is generated, the output contains 8 equally-spaced vertices with first vertex at the top.
3. Given a `polygon` with `sides: 5`, `size: 30` at `(100, 100)`, when SVG is generated, the output contains a `<polygon>` with 5 vertices.
4. Given an `oval` with `width: 80`, `height: 40` at `(100, 100)`, when SVG is generated in semantic mode, the output contains `<ellipse rx="40" ry="20">`.
5. Given a `blob` with `size: 50` at `(100, 100)`, when SVG is generated, the output contains a `<path>` with a smooth closed spline; running again with the same input produces the byte-for-byte identical path.
6. Given the same input twice (any new shape type), the outputs are identical byte-for-byte.

---

### User Story 2 — Path Mode for All New Shapes (Priority: P1)

All new shapes MUST support `outputMode: "path"`. In path mode, every shape renders as a `<path>` element. For blob, `<path>` is used in both modes.

---

### User Story 3 — Input Validation for New Shape Types (Priority: P2)

Invalid or missing parameters for new shape types MUST result in a clear, actionable error identifying the field path and issue.

**Acceptance Scenarios**:

1. Given a `polygon` with `sides: 2`, the engine throws an error: `shapes[0].sides: must be an integer >= 3`.
2. Given a `blob` with `points: 1`, the engine throws an error: `shapes[0].points: must be an integer >= 3`.
3. Given a `trapezoid` with missing `topWidth`, the engine throws: `shapes[0].topWidth: missing required field`.

---

### User Story 4 — Backward Compatibility (Priority: P1)

All Stage 1 shapes (square, rectangle, circle, triangle) MUST continue to function exactly as before. The `generate()` function signature is unchanged.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-100**: New shape types added as discriminant values to the `Shape` union: `"trapezoid"`, `"octagon"`, `"polygon"`, `"oval"`, `"blob"`.
- **FR-101**: All new shapes use center-based coordinates (`x`, `y`) consistent with Stage 1.
- **FR-102**: **Trapezoid** parameters:
  - `topWidth: number` — required, > 0, finite
  - `bottomWidth: number` — required, > 0, finite
  - `height: number` — required, > 0, finite
  - Center is the bounding-box midpoint between the two parallel edges.
- **FR-103**: **Octagon** parameters:
  - `size: number` — required, > 0, finite (circumradius — center to vertex)
  - 8 vertices at equal angular spacing; first vertex at top (angle = −π/2).
- **FR-104**: **Polygon** parameters:
  - `sides: number` — required, integer ≥ 3, finite
  - `size: number` — required, > 0, finite (circumradius — center to vertex)
  - `n` vertices at equal angular spacing; first vertex at top (angle = −π/2).
- **FR-105**: **Oval** parameters:
  - `width: number` — required, > 0, finite (full horizontal extent)
  - `height: number` — required, > 0, finite (full vertical extent)
  - Semantic mode: `<ellipse cx="x" cy="y" rx="width/2" ry="height/2">`
  - Path mode: two-arc path (split at left/right extremes), exact representation.
- **FR-106**: **Blob** parameters:
  - `size: number` — required, > 0, finite (nominal bounding radius)
  - `points?: number` — optional, integer ≥ 3, default 6 (control point count)
  - Procedure: PRNG (seeded from `seed + index`) places `n` control points around center at angles `2πk/n`; each point's radial offset varies in `[0.6·size, 1.0·size]`; smooth closed Catmull-Rom spline (converted to cubic Bézier) fitted through them.
  - Output: always `<path>` regardless of `outputMode`.
- **FR-107**: All new shapes support optional `rotation` (degrees), applied as `transform="rotate(R, CX, CY)"`.
- **FR-108**: All new shapes receive deterministic IDs using the existing `s<seed>-<type>-<index>` format.
- **FR-109**: Unknown fields on new shape types are silently dropped during canonicalization.
- **FR-110**: Per-type parameter rules enforced by the validation layer:
  - `polygon.sides`: must be integer ≥ 3
  - `blob.points` (if provided): must be integer ≥ 3
  - All numeric fields: reject NaN, Infinity, −Infinity
  - Positive-only fields: `topWidth`, `bottomWidth`, `height`, `size`, `width`, `polygon.size`
- **FR-111**: The `generate()` function signature and return type are unchanged.
- **FR-112**: Stage 1 shapes (square, rectangle, circle, triangle) are unaffected.

---

## Key Entities

- **TrapezoidShape**
- **OctagonShape**
- **PolygonShape**
- **OvalShape**
- **BlobShape**
- **Prng** (internal — seed-based mulberry32 for blob)

---

## Invariants

All Stage 1 invariants hold and are extended:

1. **Determinism** — identical input → identical output, byte-for-byte (including blob).
2. **Canonicalization** — unknown fields dropped before generation.
3. **Valid SVG output** — output is well-formed SVG.
4. **Exact shape count** — `metadata.shapeCount === input.shapes.length`.
5. **Shape identity preserved** — no auto-coercion between types.
6. **Default semantic output** — trapezoid, octagon, polygon → `<polygon>`; oval → `<ellipse>`; blob → `<path>` (always).
7. **Path-only output mode** — when `outputMode: "path"`: trapezoid, octagon, polygon, oval → `<path>`; blob → `<path>` (unchanged).
8. **Blob determinism** — same `seed`, `size`, `points`, and shape `index` always produce the same blob path.

---

## Resolved Open Questions

- **Polygon parameterization**: `sides: number` (integer ≥ 3). Explicit vertex lists are out of scope — the engine generates shapes procedurally. A vertex-list shape would require a separate `"polyline"` or `"custom"` type outside this stage.

---

## Example Input

```json
{
  "seed": 42,
  "canvas": { "width": 400, "height": 400 },
  "shapes": [
    {
      "type": "trapezoid",
      "x": 100,
      "y": 80,
      "topWidth": 40,
      "bottomWidth": 80,
      "height": 50
    },
    { "type": "octagon", "x": 200, "y": 80, "size": 40 },
    { "type": "polygon", "x": 300, "y": 80, "sides": 5, "size": 35 },
    { "type": "oval", "x": 100, "y": 200, "width": 80, "height": 40 },
    { "type": "blob", "x": 250, "y": 200, "size": 50, "points": 7 }
  ]
}
```

---

## Assumptions

- Zero new runtime dependencies (PRNG is pure TypeScript, ~10 lines).
- No changes to `GeneratorOutput`, `Canvas`, or the public `generate()` signature.
- Blob always emits `<path>` — this is the only shape type that ignores `outputMode`.
- Rotation is supported on all new shapes, including blob.
- Stage scope: this spec covers Stage 1.5 only. Stage 2 (Variation) and beyond are in `ROADMAP.md`.
