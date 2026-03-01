# Feature Specification: Stage 3 — Styling & Bezier

**Branch**: `004-styling`
**Stage**: 3
**Depends on**: Stage 2 (`003-variation`)

---

## Overview

Extend the SVG shape engine with per-shape styling fields (opacity, fill color, stroke color, gradients) and a bezier corner-rounding field. Styling is additive — shapes without styling fields render identically to Stage 2 output. Bezier corner rounding forces path output (like `distort`) but applies a smooth curve transform to polygon vertices.

Four optional field groups are added to every shape:

1. **Opacity** (`opacity?: number`) — controls SVG `opacity` attribute
2. **Color** (`fill?: string`, `stroke?: string`, `strokeWidth?: number`) — SVG presentation attributes for fill and stroke
3. **Gradients** (`fillGradient?: Gradient`, `strokeGradient?: Gradient`) — linear or radial gradient fills/strokes injected into SVG `<defs>`
4. **Bezier** (`bezier?: number`, `bezierDirection?: "out" | "in"`) — smooth corner rounding on path-rendered shapes

---

## User Stories

### US1 — Opacity (P1)

**As a caller**, I want to control the opacity of any shape so that shapes can be transparent or semi-transparent.

**Acceptance criteria**:

- FR-300: Any `Shape` may carry `opacity?: number` (0–1 inclusive)
- FR-301: When `opacity` is absent or `1`, no `opacity` attribute is added to the SVG element (SVG default of 1 applies)
- FR-302: When `opacity` is in `(0, 1)`, the SVG element receives `opacity="{value}"` formatted with `fmt()`
- FR-303: When `opacity === 0`, the SVG element receives `opacity="0"`
- FR-304: `opacity` outside `[0, 1]` is rejected: `"opacity must be a number between 0 and 1"`
- FR-305: `opacity` applies to the entire shape (fill + stroke combined), not per-channel

---

### US2 — Color (P2)

**As a caller**, I want to specify fill and stroke colors on any shape so that shapes can be colored without relying on SVG defaults.

**Acceptance criteria**:

- FR-310: Any `Shape` may carry `fill?: string` — any CSS color string or `"none"`
- FR-311: Any `Shape` may carry `stroke?: string` — any CSS color string or `"none"`
- FR-312: Any `Shape` may carry `strokeWidth?: number` — positive finite number
- FR-313: When `fill` is absent, no `fill` attribute is emitted (SVG default `black` applies)
- FR-314: When `stroke` is absent, no `stroke` or `stroke-width` attribute is emitted (SVG default `none` applies)
- FR-315: When `stroke` is present but `strokeWidth` is absent, no `stroke-width` attribute is emitted (SVG default `1` applies)
- FR-316: When `strokeWidth` is present but `stroke` is absent, `stroke-width` is NOT emitted (strokeWidth requires stroke to be meaningful)
- FR-317: `strokeWidth` outside `(0, ∞)` is rejected: `"strokeWidth must be a positive finite number"`
- FR-318: `fill` and `stroke` are passed through as-is; no CSS color format validation is performed
- FR-319: When both `fill` and `fillGradient` are present, `fillGradient` takes precedence; `fill` is ignored

---

### US3 — Gradients (P3)

**As a caller**, I want to apply linear or radial gradients as fill or stroke to any shape so that shapes can have smooth color transitions.

**Acceptance criteria**:

- FR-320: Any `Shape` may carry `fillGradient?: Gradient` where `Gradient = LinearGradient | RadialGradient`
- FR-321: Any `Shape` may carry `strokeGradient?: Gradient`
- FR-322: Gradients are emitted as `<linearGradient>` or `<radialGradient>` elements inside `<defs>` in the SVG output
- FR-323: Each gradient has a deterministic ID: `grad-{shapeId}-fill` or `grad-{shapeId}-stroke`
- FR-324: The shape element references its gradient via `fill="url(#gradId)"` or `stroke="url(#gradId)"`
- FR-325: `gradientUnits="objectBoundingBox"` — all coordinate values (x1/y1/x2/y2 for linear; cx/cy/r for radial) are fractions of the shape's bounding box (0–1 range)
- FR-326: Linear gradient defaults: `x1=0, y1=0, x2=1, y2=0` (left-to-right horizontal)
- FR-327: Radial gradient defaults: `cx=0.5, cy=0.5, r=0.5` (center to edge)
- FR-328: Each gradient must have at least one `ColorStop`
- FR-329: `ColorStop.offset` must be `[0, 1]` inclusive; `ColorStop.color` must be a string; `ColorStop.opacity` (if present) must be `[0, 1]`
- FR-330: SVG `<defs>` is always emitted when any shape has a gradient; it appears before any shape elements
- FR-331: When `strokeGradient` is present but `stroke` is absent, `strokeGradient` is applied; no `stroke` string attribute is emitted
- FR-332: Gradient + opacity interact as per SVG spec: `opacity` applies to the whole element; gradient stop `opacity` controls per-stop transparency
- FR-333: Gradient validation errors:
  - No stops: `"fillGradient.stops must have at least one stop"` / `"strokeGradient.stops must have at least one stop"`
  - Invalid stop offset: `"gradient stop offset must be a number between 0 and 1"`
  - Invalid stop color: `"gradient stop color must be a string"`
  - Invalid stop opacity: `"gradient stop opacity must be a number between 0 and 1"`
  - Invalid linear coordinate (not finite): `"gradient coordinate must be a finite number"`
  - Invalid radial radius (not positive): `"gradient r must be a positive finite number"`

---

### US4 — Bezier Corner Rounding (P4)

**As a caller**, I want to round the corners of polygon shapes with smooth bezier curves (convex or concave) so that shapes can have softened or indented corners.

**Acceptance criteria**:

- FR-340: Any `Shape` may carry `bezier?: number` (0–1 inclusive)
- FR-341: When `bezier === 0` or absent, output is identical to Stage 1/2 output for that shape
- FR-342: When `bezier > 0`, the SVG element tag is always `"path"` regardless of `outputMode`
- FR-343: Any `Shape` may carry `bezierDirection?: "out" | "in"`; default is `"out"` when absent
- FR-344: `"out"` (convex) rounding: each corner bulges outward using a quadratic bezier with the original vertex as control point
- FR-345: `"in"` (concave) rounding: each corner indents inward using a quadratic bezier with the control point reflected through the P1–P2 midpoint
- FR-346: The bezier handle length per corner = `bezier × 0.45 × min(|prev − vertex|, |next − vertex|)` — max 45% of the shorter adjacent segment to prevent handle overlap
- FR-347: Bezier rounding is applied after distortion and clamping; `bezier > 0` does not affect the PRNG draw order (bezier is deterministic, no PRNG)
- FR-348: When `bezier > 0` and `distort === 0`, the shape is converted to vertices (same extraction as `distort`) before bezier rounding
- FR-349: `bezier` outside `[0, 1]` is rejected: `"bezier must be a number between 0 and 1"`
- FR-350: `bezierDirection` not `"out"` or `"in"` is rejected: `'bezierDirection must be "out" or "in"'`
- FR-351: `bezierDirection` has no effect when `bezier === 0` (but is not an error)
- FR-352: For circle and oval shapes, `bezier` has no visible effect (they are already smooth curves) but is accepted without error
- FR-353: Bezier rounding interacts with distort: if both `bezier > 0` and `distort > 0`, distortion is applied first, then bezier rounding is applied to the distorted vertices

---

## PRNG Draw Order (updated)

Bezier rounding introduces no PRNG draws. The PRNG order from Stage 2 is unchanged:

1. **Size draw** (only if `sizeVariance > 0`): one `prng()` call
2. **Vertex draws** (only if `distort > 0`): two `prng()` calls per vertex

---

## Pipeline Order (updated)

For each shape in generate.ts:

```
Input shape
    │
    ▼
canonicalize() + validate()
    │
    ▼
[has sizeVariance > 0?]
    ├─ yes → applySizeVariance(shape, varPrng) → workShape
    └─ no  → workShape = shape
    │
    ▼
[has distort > 0 OR bezier > 0?]
    ├─ yes → extractVertices(workShape)
    │         → if distort > 0: applyDistort(vertices, varPrng)
    │         → if clamp present and distort > 0: applyClamp(vertices)
    │         → verticesToPath(vertices, bezier, bezierDirection)
    │         → { tag: "path", attrs: { d: ... } }
    └─ no  → existing switch dispatch (renderSquare / renderCircle / ...)
    │
    ▼
Apply styling fields:
    ├─ fill / fillGradient → fill attr or gradient def + url ref
    ├─ stroke / strokeGradient → stroke attr or gradient def + url ref
    ├─ strokeWidth → stroke-width attr
    └─ opacity → opacity attr
    │
    ▼
assemble ShapeElement → assembleSvg(canvas, elements, defs)
```

---

## Backward Compatibility

- All shapes without styling or bezier fields produce SVG identical to Stage 2
- Canonicalization: all new fields are whitelisted; absent fields produce no output key
- Validation: all new fields are optional; shapes without them pass existing validation
- `assembleSvg` is extended to accept optional `defs` — when defs is empty or absent, output is identical to Stage 2

---

## Out of Scope

- CSS class-based styling (only SVG presentation attributes)
- Per-axis opacity (fill-opacity / stroke-opacity as top-level shape fields — available only inside gradient stops)
- Stroke `dasharray`, `linecap`, `linejoin` (future stage)
- Pattern fills (future stage)
- Filter effects / drop shadows (future stage)
- `gradientUnits="userSpaceOnUse"` (future: objectBoundingBox only in this stage)
- Per-vertex bezier radius control (uniform rounding only)
- Animated gradients / transitions
- Color format validation (fill/stroke are pass-through strings)
- Global / shared gradient library across shapes (per-shape only)
