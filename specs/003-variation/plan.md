# Implementation Plan: Stage 2 — Variation

**Branch**: `003-variation` | **Date**: 2026-03-01 | **Spec**: [`specs/003-variation/spec.md`](spec.md)
**Input**: Feature specification from `/specs/003-variation/spec.md`

## Summary

Extend the SVG shape engine with three optional per-shape variation fields: `distort` (vertex perturbation, 0–1), `sizeVariance` (size scaling, 0–1), and `clamp` (bounding box envelope). All variation is seed-based PRNG (deterministic). When `distort > 0`, vertices are perturbed and output is forced to `<path>`. When `sizeVariance > 0`, size dimensions are scaled before rendering. `clamp` constrains distorted vertices to a bounding box. A new `src/variation.ts` module isolates all variation logic.

## Technical Context

**Language/Version**: TypeScript 5.4 (strict mode)
**Primary Dependencies**: None at runtime; Vitest 1.x (dev)
**Storage**: N/A
**Testing**: Vitest 1.x
**Target Platform**: Framework-agnostic TypeScript library
**Project Type**: Library (pure-function SVG generator)
**Performance Goals**: Deterministic, synchronous, no I/O
**Constraints**: Zero runtime dependencies; pure TypeScript; same input → same SVG output
**Scale/Scope**: Three optional fields extending all 9 existing shape types; one new module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Principle | Result |
|------|-----------|--------|
| Only geometric generation | Scope Discipline | PASS — distort/sizeVariance/clamp modify vertex positions and sizes (geometry), not composition, layout, or styling |
| New shapes composable | Composability | PASS — distorted shapes remain self-contained SVG path elements |
| Extends Stage 1/1.5 without rewriting | Incremental Expansion | PASS — additive: new optional fields, new module; no existing shape renderers modified |
| Variation is seed-based PRNG | Deterministic Variation | PASS — `varSeed(seed, index)` + existing mulberry32; same seed → same distortion |
| Shape type identity preserved | Domain Integrity | PASS — `type` discriminant unchanged; variation is post-classification |
| Geometry-only changes | Geometry First | PASS — all 3 fields affect geometry (vertices, sizes); no styling attributes added |
| Validated explicit input | Explicit Contracts | PASS — canonicalize/validate extended for distort, sizeVariance, clamp |

All 7 gates: **PASS**. No complexity violations required.

## Project Structure

### Documentation (this feature)

```text
specs/003-variation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── types.ts             # MODIFY: add VariationFields interface; extend ShapeBase
├── prng.ts              # MODIFY: add varSeed() function
├── canonicalize.ts      # MODIFY: whitelist distort/sizeVariance/clamp for all shape types
├── validate.ts          # MODIFY: validate distort/sizeVariance/clamp values
├── generate.ts          # MODIFY: variation pipeline (sizeVariance → distort) before shape dispatch
├── variation.ts         # NEW: charSizeOf, extractVertices, applyDistort, applyClamp,
│                        #       verticesToPath, applySizeVariance, renderVaried
└── shapes/
    └── (no changes — existing 9 renderers untouched)

tests/
├── shapes/              # no changes to existing shape tests
├── variation.test.ts    # NEW: unit tests for variation.ts
├── generate.test.ts     # EXTEND: variation acceptance scenarios (US1, US2, US3)
├── validate.test.ts     # EXTEND: distort/sizeVariance/clamp validation tests
└── canonicalize.test.ts # EXTEND: variation field canonicalization tests
```

**Structure Decision**: Single project. Existing `src/` + `tests/` layout. `src/variation.ts` is the only new source file — all variation logic is isolated there to keep existing shape renderers unchanged.
