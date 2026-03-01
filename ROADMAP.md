# SVG Component Generator — Roadmap

**Last updated**: 2026-02-28
**Active branch**: `001-svg-shape-engine` (Stage 1)

Each stage gets its own branch (`NNN-stage-name`) and spec file (`specs/NNN-stage-name/spec.md`) created just-in-time when that stage begins.

---

## Stage 1 — Primitive Shapes `001-svg-shape-engine` Done

**Branch**: `001-svg-shape-engine` | **Spec**: [`specs/001-svg-shape-engine/spec.md`](specs/001-svg-shape-engine/spec.md)

Return deterministic SVG from a seed + canvas + array of primitive shapes.

**Shapes**: Circle, Square, Triangle, Rectangle

**Key capabilities**:
- Center-based coordinates (`x`, `y`) for all shapes
- Type-specific sizing parameters (`size`, `width`/`height`)
- Optional `rotation` in degrees, applied around shape center
- Deterministic element IDs encoding seed + type + index
- `outputMode`: `"semantic"` (default) or `"path"`
- Input canonicalization (unknown fields silently dropped)
- Input validation (NaN/Infinity rejected; per-type param rules enforced)

**Definition of Done**: [`specs/001-svg-shape-engine/plan.md §7`](specs/001-svg-shape-engine/plan.md)

---

## Stage 1.5 — Advanced Shapes `002-advanced-shapes` Done

**Branch**: `002-advanced-shapes` (not yet created)

Extend the shape engine with additional geometric primitives. All new shapes are additive to the existing `generate()` function — new `type` discriminant values with their own required parameters.

**Shapes**: Trapezoid, Octagon, Polygon (n-sided), Oval, Freeform Blob

**Freeform Blob**: Seed-based procedural. PRNG places `n` control points around the shape center; `seed` + `size` + optional `points` count fully defines the outline. A smooth closed spline (e.g., Catmull-Rom) is fitted through the points. Fully deterministic.

**Open questions before spec**:
- Polygon: parameterized by side count `n`, or by explicit vertex list?

---

## Stage 2 — Variation `003-variation` ACTIVE
**Branch**: `003-variation` (not yet created)

Return distorted/varied shapes. Introduce controlled chaos into geometry.

**Capabilities**:
- Per-shape distortion: perturb vertices or control points by a configurable amount
- Size variation: shapes can vary within a clamped min/max range
- Chaos/randomness parameter (per shape or global)
- Clamping: constrain output dimensions to a defined envelope

**Variation model**: **Seed-based PRNG (deterministic)**. Same seed + config always produces the same distorted shape. The Stage 1 determinism invariant holds through all stages. A lightweight pure-TS PRNG (e.g., mulberry32 or sfc32, zero dependencies) will be seeded from `GeneratorInput.seed`.

**Open questions before spec**:
- How is distortion parameterized? (e.g., `variance: number` 0–1 scale, or explicit vertex offset bounds)
- Does "clamping" apply to position, size, or both?

---

## Stage 3 — Shape Masks `004-shape-masks` ⬜ Planned

**Branch**: `004-shape-masks` (not yet created)

Return a shape with another shape cut out of or layered inside it.

**Capabilities**:
- Inner shape as a **negative** (cutout/mask): the inner area is transparent, revealing what is behind
- Inner shape as an **alternate fill**: a second shape overlaid inside the outer shape
- Inner shape can be: same type as outer, different type, or slightly distorted variant
- Inner shape positioning: centered and aligned with outer (default), or offset/rotated independently
- Optional imperfections: subtle vertex noise on inner shape for organic character

**Open questions before spec**:
- SVG mechanism: `<mask>`, `<clipPath>`, or compound `<path>` with even-odd fill rule?
- Can the inner shape be a different type than the outer (e.g., circle inside a square)?
- Is distortion on the inner shape the same system as Stage 2 variation, or a separate simpler offset?

---

## Stage 3.5 — Opacity `005-opacity` ⬜ Planned

**Branch**: `005-opacity` (not yet created)

Allow shapes to carry an opacity value.

**API**: `opacity?: number` (0–1) directly on the shape object. Applied via SVG `opacity` attribute on the element. Omitted when absent (no default emitted).

**Constitution note**: Requires amendment of the *Geometry First* principle — opacity is a visual/rendering property, not geometry. Scope strictly limited to per-shape field; no global opacity system.

---

## Stage 3.6 — Color `006-color` ⬜ Planned

**Branch**: `006-color` (not yet created)

Allow shapes to carry fill and stroke color values.

**API**: `fill?: string`, `stroke?: string`, `strokeWidth?: number` directly on the shape object. Color format: hex (`#rrggbb` / `#rrggbbaa`) or named CSS color. Omitted when absent — caller's CSS handles default fill.

**Constitution note**: Requires amendment of the *Geometry First* principle. Scope strictly limited to `fill`/`stroke` per-shape — no theme system, no shared palettes, no global defaults.

---

## Stage 3.7 — Gradients `007-gradients` ⬜ Planned

**Branch**: `007-gradients` (not yet created)

Allow shapes to use linear and radial gradient fills.

**API**: `gradient?: { type: "linear" | "radial", stops: { offset: number, color: string }[], ... }` directly on the shape object, replacing `fill` when present. Gradient rendered into `<defs>` with a deterministic `id` derived from seed + shape index.

**Constitution note**: Introduces `<defs>` element into SVG output — new document structure. Requires amendment of the *Explicit Contracts* and output contract sections.

---

## Stage 4 — Bézier Corner Rounding `008-bezier` ⬜ Planned

**Branch**: `008-bezier` (not yet created)

Allow corners of shapes to be rounded via Bézier curves.

**Capabilities**:
- Per-shape `cornerRadius` (or per-vertex control): rounds convex corners outward
- Optional inward rounding (concave corners / "squircle" style)
- Applies to square, rectangle, triangle, trapezoid, octagon, polygon
- Circle and oval: no-op (already smooth)
- Works in both `"semantic"` and `"path"` output modes; semantic mode falls back to path when corner rounding is active

---

## Stage 4 — Shape Merger `009-shape-merger` ⬜ Planned

**Branch**: `009-shape-merger` (not yet created)

Combine multiple shapes into a single unified compound shape — procedural logo/centerpiece generation.

**Capabilities**:
- Boolean shape operations: union, intersection, difference on two or more shapes
- Consistent Bézier/corner rounding applied to the merged outline
- Procedural generation: Perlin noise applied to the merged outline for organic variation
- Seed-based: same seed + config → same merged shape (deterministic)
- Output: single compound `<path>` element

**API**: Extended via the single `generate()` function — merged shape described within `GeneratorInput.shapes` using a new `type: "merge"` shape variant with child shape definitions.

**Open questions before spec**:
- Boolean operations require a polygon clipping library (e.g., Clipper.js / polybool). Does this break the zero-runtime-dependencies constraint, or does Stage 4 introduce its first dependency?
- Perlin noise: self-implemented (pure TS, no dep) or via a small utility?

---

## Stage Dependency Graph

```
Stage 1 (Primitives)
  └── Stage 1.5 (Advanced Shapes)     — extends Stage 1 shape types
        └── Stage 2 (Variation)        — adds distortion to any shape
              └── Stage 3 (Masks)      — uses shapes as mask layers
                    ├── Stage 3.5 (Opacity)
                    ├── Stage 3.6 (Color)
                    └── Stage 3.7 (Gradients)
                          └── Stage 4a (Bézier)
                                └── Stage 4b (Shape Merger)
```

---

## Constitution Change Log

| Stage | Principle affected | Required amendment |
|-------|-------------------|--------------------|
| Stage 2 | Deterministic Variation | No amendment needed — variation is seed-based PRNG, invariant preserved |
| Stage 3 | Explicit Contracts | New SVG output elements (`<mask>` or `<clipPath>`) must be added to output contract |
| Stage 3.5–3.7 | Geometry First | Amend to "Geometry + Appearance" — styling is allowed per-shape, no global/shared systems |
| Stage 3.7 | Explicit Contracts | `<defs>` element added to SVG output structure |
| Stage 4b | Scope Discipline | Shape Merger introduces composition — amend to "single-output composition is in scope" |
