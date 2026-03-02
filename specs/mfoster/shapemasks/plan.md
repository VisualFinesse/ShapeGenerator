# Implementation Plan: Stage 4 — Shape Masks & Layers

**Branch**: `mfoster/shapemasks` | **Date**: 2026-03-01 | **Spec**: [`specs/mfoster/shapemasks/spec.md`](spec.md)
**Input**: Feature specification from `/specs/mfoster/shapemasks/spec.md`

## Summary

Extend the SVG shape engine with two compositing features: **Layers** (`layer?: number`) for z-order control via stable sort before rendering, and **Shape Masks** (`mask?: MaskShape | MaskShape[]`) for SVG `<mask>`-based clipping/fading of shapes. A new `src/mask.ts` module handles mask element building. `prng.ts` gains `maskSeed()`. `generate.ts` is extended with layer sort and mask processing. All changes are additive and backward-compatible.

## Technical Context

**Language/Version**: TypeScript 5.4 (strict mode)
**Primary Dependencies**: None at runtime; Vitest 1.x (dev)
**Storage**: N/A
**Testing**: Vitest 1.x
**Target Platform**: Framework-agnostic TypeScript library
**Project Type**: Library (pure-function SVG generator)
**Performance Goals**: Deterministic, synchronous, no I/O
**Constraints**: Zero runtime dependencies; pure TypeScript; same input → same SVG output; replay integrity preserved
**Scale/Scope**: Two new interfaces (LayerFields, MaskFields), one type alias (MaskShape), one new module (`src/mask.ts`), one new prng function (`maskSeed`), extensions to 5 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Principle | Result |
|------|-----------|--------|
| Only geometric generation + compositing passthrough | Scope Discipline | PASS — layers are a geometric z-ordering concern; masks are a geometric clipping concern. No composition logic, layout rules, or color theory. Constitution explicitly states "A shape must be usable as a mask" — this feature directly fulfills that requirement. |
| Shapes composable; usable as masks | Composability | PASS — MaskShape = Shape; shapes are reused as mask definitions. Constitution: "A shape must be usable as a standalone element, as part of a group, as a mask" — directly satisfied. |
| Extends Stage 3 without rewriting | Incremental Expansion | PASS — additive: 2 new optional fields, 1 new module, 1 new prng function, 5 file extensions; all existing renderers untouched. |
| All variation remains seed-based PRNG | Deterministic Variation | PASS — maskSeed is derived deterministically from generatorSeed + parentIndex + maskIndex. Layer sort uses original array indices for all PRNG seeds (FR-404). No runtime randomness introduced. |
| Shape type identity preserved | Domain Integrity | PASS — `type` discriminant unchanged; layer/mask are compositing overlays; `MaskShape = Shape` (same type). |
| Geometry separate from compositing | Geometry First | PASS — LayerFields and MaskFields extend ShapeBase additionally; geometric fields (x, y, size, etc.) are untouched. Sorting is post-geometry; mask building reuses existing geometric renderers. |
| Validated explicit input; canonical replay | Explicit Contracts | PASS — layer validated (finite check); mask shapes validated as full shapes; both fields whitelisted in canonicalize.ts; canonical output includes mask shapes after per-type whitelist stripping. |

All 7 gates: **PASS**. No complexity violations required.

## Project Structure

### Documentation (this feature)

```text
specs/mfoster/shapemasks/
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
├── types.ts             # MODIFY: add LayerFields, MaskFields, MaskShape; extend ShapeBase
├── prng.ts              # MODIFY: add maskSeed(genSeed, parentIdx, maskIdx) function
├── validate.ts          # MODIFY: validate layer (finite check); validate mask shapes (recursive)
├── canonicalize.ts      # MODIFY: whitelist layer + mask fields; normalize mask to array;
│                        #         canonicalize each MaskShape without mask/layer keys
├── generate.ts          # MODIFY: stable sort by layer (original index preserved);
│                        #         call buildMaskDef + inject mask attr per masked shape
├── mask.ts              # NEW: buildMaskDef(maskId, maskShapes, mode, seed, parentIdx, gradDefs)
│                        #      renders mask shapes via existing renderers; default fill="white"
└── shapes/
    └── (no changes — all 9 existing renderers untouched)

tests/
├── shapes/              # no changes
├── mask.test.ts         # NEW: unit tests for mask.ts (buildMaskDef, default fill, gradient accumulation)
├── layers.test.ts       # NEW: unit tests for layer sorting (order, stable sort, index preservation)
├── generate.test.ts     # EXTEND: layer + mask acceptance scenarios
├── validate.test.ts     # EXTEND: layer/mask validation tests
├── canonicalize.test.ts # EXTEND: layer/mask canonicalization tests
└── invariants.test.ts   # EXTEND: backward compat invariants (no-layer/no-mask → Stage 3 output)
```

**Structure Decision**: Single project. Existing `src/` + `tests/` layout. `src/mask.ts` is the only new source file. All 9 shape renderers remain untouched. The layer sort is contained entirely within `generate.ts`.

## Complexity Tracking

No constitution violations. No entries required.

---

## Phase 0: Research Summary

See [`research.md`](research.md) for full decisions. Key resolved questions:

| Question | Decision |
|---|---|
| `<mask>` vs `<clipPath>` | `<mask>` — supports soft luminance masking; clipPath is hard-edge only |
| `maskUnits` | `"userSpaceOnUse"` — canvas coordinates match x/y system |
| `mask-type` | Luminance (SVG default) — white=visible, black=hidden; not emitted explicitly |
| Layer sort algorithm | Stable sort by `layer ?? 0`; original array index captured before sort |
| MaskShape type | Type alias for `Shape` — full 9-type union; mask+layer fields silently dropped |
| Mask ID format | `mask-{shapeId}` — consistent with gradient ID pattern |
| MaskShape default fill | `"white"` when no fill/fillGradient on MaskShape |
| PRNG isolation | `maskSeed(genSeed, parentIdx, maskIdx)` — independent from parent varPrng |
| New module | `src/mask.ts` — buildMaskDef; isolates mask rendering from generate.ts |
| Canonicalize strategy | mask normalized to array; each MaskShape whitelisted per-type without mask/layer |

---

## Phase 1: Design Summary

### Data Model

See [`data-model.md`](data-model.md).

**New types**: `LayerFields`, `MaskFields`, `MaskShape` (type alias for `Shape`)

**Modified**: `ShapeBase` now `extends VariationFields, StylingFields, BezierFields, LayerFields, MaskFields`

**New function**: `maskSeed(genSeed, parentIdx, maskIdx)` in `prng.ts`

**New module**: `src/mask.ts` — `buildMaskDef`

**Modified**: `generate.ts` gains layer sort + mask processing block

### API Contract

See [`contracts/api.md`](contracts/api.md).

The `generate()` function signature is unchanged. Input types are extended with two optional fields. SVG output gains `<mask>` elements in `<defs>` and `mask="url(...)"` attributes on masked shapes. Layer sort changes element order without changing IDs. All changes are additive.

### Quickstart

See [`quickstart.md`](quickstart.md) for usage examples covering layers, basic masks, cutout masks, gradient fade masks, and distorted mask shapes.
