# Feature Specification: SVG Shape Engine v0.1

**Feature Branch**: `001-svg-shape-engine`
**Created**: 2026-02-28
**Status**: Draft
**Input**: User description: "Specify v0.1 of a pure TypeScript core library that generates deterministic SVG strings for designer-intent primitive shapes."

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Generate SVG from Primitive Shapes (Priority: P1)

A developer provides a seed value, canvas dimensions, and an array of primitive shapes (square, rectangle, circle, triangle) with center-based coordinates and type-specific sizing parameters. The engine returns a valid SVG string and metadata containing the shape count. The output is fully deterministic: the same input always produces the exact same SVG string, byte-for-byte.

**Acceptance Scenarios**:

1. Given a valid input with seed `42`, canvas `{width: 200, height: 200}`, and one shape of each type, when the engine generates SVG, then the output contains exactly four shape elements and `metadata.shapeCount` equals `4`.
2. Given the same input twice, when the engine generates SVG both times, then the two output strings are identical byte-for-byte.
3. Given a square shape, when SVG is generated, then its identity is preserved via a deterministic ID containing its shape type.

---

### User Story 2 - Input Canonicalization (Priority: P2)

Unknown fields in the input MUST be silently dropped before generation and MUST NOT affect output.

Two inputs differing only by unknown fields MUST produce identical SVG.

---

### User Story 3 - Input Validation (Priority: P3)

Invalid numeric values, missing required fields, or incorrect per-type parameters MUST result in clear, actionable errors.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The engine MUST accept `{seed: number, canvas: {width: number, height: number}, shapes: Shape[]}`.
- **FR-002**: Supported shape types are exactly `"square"`, `"rectangle"`, `"circle"`, `"triangle"`.
- **FR-003**: All shapes use center-based coordinates (`x`, `y`).
- **FR-004**: Shape parameter rules:

  - **Square**: requires `size`.
  - **Rectangle**: requires `width` and `height`.
  - **Circle**: requires `size` (interpreted as diameter).
  - **Triangle**: requires `size`.

- **FR-005**: Shapes MAY include optional `rotation` (degrees). Rotation is applied around the shape’s center. Rotation on circle is permitted but produces no visible effect.
- **FR-006**: The engine MUST return `{svg: string, metadata: {shapeCount: number}}`.
- **FR-007**: Output MUST be deterministic: identical input produces identical output.
- **FR-008**: Each shape MUST have a deterministic SVG `id`:

  - Must encode shape type and index.
  - Must incorporate the seed.
  - Must be valid for SVG/XML.
  - Must be unique within the document.

- **FR-009**: Shapes MUST be rendered in the same order as provided.
- **FR-010**: Unknown fields MUST be dropped during canonicalization.
- **FR-011**: The engine MUST reject `NaN`, `Infinity`, or `-Infinity`.
- **FR-012**: explicitly allow <rect>, <circle>, <polygon> and <path>; default is semantic.
- outputMode?: "semantic" | "path" (optional, default "semantic").


  - `<svg>` root
  - primitive shape elements
  - no scripts, no event handlers, no foreignObject, no external references.

- **FR-013**: Shape identity MUST NOT be auto-converted (square remains square).
- **FR-014**: Empty shapes array MUST produce valid SVG with zero shape elements.
- **FR-015**: The engine MUST NOT clip or adjust shapes that extend beyond canvas bounds. Shapes are rendered exactly as specified.

---

## Key Entities

- **GeneratorInput**
- **Canvas**
- **Shape**
- **GeneratorOutput**
- **ShapeID**

(unchanged, already solid)

---

## Invariants

1. Determinism
2. Canonicalization
3. Valid SVG output
4. Exact shape count
5. Shape identity preserved
6. **Default semantic output**: When `outputMode` is omitted or `"semantic"`, square/rectangle MUST render as `<rect>`, circle as `<circle>`, triangle as `<polygon>`.
7. **Path-only output mode**: When `outputMode: "path"`, each input shape MUST render as a `<path>` element (no `<rect>`, `<circle>`, or `<polygon>`).

---

## Example Input

```json
{
  "seed": 42,
  "canvas": { "width": 200, "height": 200 },
  "shapes": [
    { "type": "square", "x": 50, "y": 50, "size": 30 },
    { "type": "rectangle", "x": 120, "y": 80, "width": 60, "height": 30 },
    { "type": "circle", "x": 100, "y": 150, "size": 40 },
    { "type": "triangle", "x": 160, "y": 40, "size": 35, "rotation": 45 }
  ]
}
```

**Determinism assertion**: Running the engine with the above input MUST always produce identical SVG output.

---

## Assumptions

- Pure function, no side effects.
- `seed` is required and incorporated into ID generation.
- SVG 1.1 namespace.
- Single public entry point.
- **Stage scope**: This spec covers Stage 1 only. Future stages (1.5–4) are tracked in `/ROADMAP.md` at repo root; each stage will receive its own branch and spec when development begins.

---

## Clarifications

### Session 2026-02-28

- Q: Should Stage 1 use semantic SVG primitives or path-only output? → A: Semantic primitives as default (`<rect>`, `<circle>`, `<polygon>`), with optional `outputMode: "path"` for path-only output. Path mode uses two-arc circle (no Bézier approximation).
- Q: How should multi-stage roadmap be tracked? → A: Top-level `ROADMAP.md` at repo root captures all stages; individual specs/branches created just-in-time when each stage begins. This spec covers Stage 1 only.
- Q: Should Stage 2 variation/distortion be deterministic or truly random? → A: Seed-based PRNG (deterministic). Same input always produces identical distortion. The Stage 1 determinism invariant holds through all stages; true randomness is out of scope.
- Q: Should all stages extend the same `generate()` function or introduce separate entry points? → A: Single `generate()` forever. New shape types and per-shape capabilities (variance, opacity, fill, masks) are additive optional fields. No new entry points across stages.
- Q: How should the Freeform Blob shape (Stage 1.5) be defined? → A: Seed-based procedural. PRNG places `n` control points around the shape center; `seed` + `size` + optional `points` count fully defines the blob. Deterministic — no user-provided geometry required.
- Q: Where do visual properties (opacity, color, gradients) live on the input schema? → A: Directly on the shape object as optional fields — `opacity`, `fill`, `stroke`, `gradient` added per-shape in their respective stages. Consistent with `rotation` precedent. No separate appearance layer.

---

## Success Criteria

Unchanged — all measurable outcomes remain valid.
