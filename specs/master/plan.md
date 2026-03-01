# Implementation Plan: Stage 3 — Styling & Bezier

**Branch**: `004-styling` | **Date**: 2026-03-01 | **Spec**: [`specs/master/spec.md`](spec.md)
**Input**: Feature specification from `/specs/master/spec.md`

## Summary

Extend the SVG shape engine with four per-shape feature groups: **Opacity** (`opacity?: 0–1`), **Color** (`fill`, `stroke`, `strokeWidth`), **Gradients** (`fillGradient`, `strokeGradient` — linear or radial with color stops), and **Bezier corner rounding** (`bezier?: 0–1`, `bezierDirection?: "out"|"in"`). All changes are additive and backward-compatible. A new `src/styling.ts` module handles gradient def building and styling attr injection. The `verticesToPath` function in `variation.ts` gains an optional bezier signature. `assembleSvg` in `svg.ts` gains an optional `defs` parameter for SVG `<defs>` output. No changes to the 9 shape renderers.

## Technical Context

**Language/Version**: TypeScript 5.4 (strict mode)
**Primary Dependencies**: None at runtime; Vitest 1.x (dev)
**Storage**: N/A
**Testing**: Vitest 1.x
**Target Platform**: Framework-agnostic TypeScript library
**Project Type**: Library (pure-function SVG generator)
**Performance Goals**: Deterministic, synchronous, no I/O
**Constraints**: Zero runtime dependencies; pure TypeScript; same input → same SVG output
**Scale/Scope**: Two new TypeScript interfaces, one new module (`src/styling.ts`), extensions to 5 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Principle | Result |
|------|-----------|--------|
| Only geometric generation + styling passthrough | Scope Discipline | PASS — color/opacity/gradients are passthrough attributes; Bezier is geometry. No color theory enforcement, no composition, no layout. Constitution explicitly states "Styling must layer on top of geometry" — this is exactly that layer. |
| New shapes composable | Composability | PASS — styled shapes are still self-contained SVG elements; gradients are embedded `<defs>` in the same SVG output. |
| Extends Stage 2 without rewriting | Incremental Expansion | PASS — additive: new optional fields, one new module, 5 file extensions; 9 shape renderers untouched. |
| All variation remains seed-based PRNG | Deterministic Variation | PASS — Bezier introduces no PRNG draws; styling is deterministic (pass-through from input). Gradient IDs are derived deterministically from `shapeId`. |
| Shape type identity preserved | Domain Integrity | PASS — `type` discriminant unchanged; styling/bezier are post-classification overlays. |
| Geometry separate from styling | Geometry First | PASS — `StylingFields` and `BezierFields` extend `ShapeBase` additionally; geometric fields (x, y, size, etc.) are untouched. Bezier is a geometric transformation layered after the variation pipeline. |
| Validated explicit input | Explicit Contracts | PASS — all new fields validated in `validate.ts`; canonicalized in `canonicalize.ts`; gradient objects whitelisted atomically. |

All 7 gates: **PASS**. No complexity violations required.

## Project Structure

### Documentation (this feature)

```text
specs/master/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── api.md           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks — not created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── types.ts             # MODIFY: add ColorStop, LinearGradient, RadialGradient, Gradient,
│                        #          StylingFields, BezierFields; extend ShapeBase
├── validate.ts          # MODIFY: validate opacity, strokeWidth, bezier, bezierDirection,
│                        #          fillGradient, strokeGradient (new validateGradient helper)
├── canonicalize.ts      # MODIFY: whitelist 8 new fields in base spread for all shape types
├── variation.ts         # MODIFY: extend verticesToPath(verts, bezier?, direction?) signature
│                        #          + bezier corner rounding algorithm
├── generate.ts          # MODIFY: extend path condition (dt > 0 || bz > 0); add styling
│                        #          attrs injection block; accumulate defs[]; pass to assembleSvg
├── svg.ts               # MODIFY: extend assembleSvg(canvas, elements, defs?) to emit <defs>
├── styling.ts           # NEW: buildGradientDef(id, gradient) → string
│                        #       buildStylingAttrs(shape, fillGradId?, strokeGradId?) → Record
└── shapes/
    └── (no changes — all 9 existing renderers untouched)

tests/
├── shapes/              # no changes
├── styling.test.ts      # NEW: unit tests for styling.ts (buildGradientDef, buildStylingAttrs)
├── bezier.test.ts       # NEW: unit tests for verticesToPath bezier rounding
├── generate.test.ts     # EXTEND: styling/bezier/gradient acceptance scenarios
├── validate.test.ts     # EXTEND: opacity/strokeWidth/bezier/bezierDirection/gradient tests
├── canonicalize.test.ts # EXTEND: new field canonicalization tests
└── invariants.test.ts   # EXTEND: backward compat invariants (no-styling → Stage 2 output)
```

**Structure Decision**: Single project. Existing `src/` + `tests/` layout. `src/styling.ts` is the only new source file — all gradient def building and styling attr assembly is isolated there. The 9 shape renderers remain untouched.

## Complexity Tracking

No constitution violations. No entries required.

---

## Phase 0: Research Summary

See [`research.md`](research.md) for full decisions. Key resolved questions:

| Question | Decision |
|---|---|
| gradientUnits strategy | `objectBoundingBox` — coordinates are 0–1 fractions of shape bounding box |
| Gradient coordinate defaults (linear) | `x1=0, y1=0, x2=1, y2=0` (left-to-right horizontal) |
| Gradient coordinate defaults (radial) | `cx=0.5, cy=0.5, r=0.5` (centered, covers full shape) |
| Gradient def format | Gradient strings built in `styling.ts`; passed to `assembleSvg` as `defs?: string[]` |
| Bezier algorithm | Quadratic bezier Q; handle = `bezier × 0.45 × min_adj_seg_len`; "out" = vertex control; "in" = reflected control |
| Bezier path formula | `M P1[0] Q ctrl[0] P2[0] L P1[1] Q ctrl[1] P2[1] ... Z` |
| fill/fillGradient precedence | `fillGradient` wins over `fill` when both present |
| strokeWidth without stroke | Not emitted (ignored) |
| Styling attr injection point | In `generate.ts` after renderer returns `{tag, attrs}` |

---

## Phase 1: Design Summary

### Data Model

See [`data-model.md`](data-model.md).

**New types**: `ColorStop`, `LinearGradient`, `RadialGradient`, `Gradient`, `StylingFields`, `BezierFields`

**Modified**: `ShapeBase` now `extends VariationFields, StylingFields, BezierFields`

**Modified**: `assembleSvg(canvas, elements, defs?: string[])` — optional defs parameter

**Modified**: `verticesToPath(vertices, bezier?, direction?)` — optional bezier rounding

**New module**: `src/styling.ts` — `buildGradientDef`, `buildStylingAttrs`

### API Contract

See [`contracts/api.md`](contracts/api.md).

The `generate()` function signature is unchanged. Input types are extended. Output SVG gains optional `<defs>` block and optional styling attrs. All changes are additive.

### Quickstart

See [`quickstart.md`](quickstart.md) for usage examples covering all four feature groups.
