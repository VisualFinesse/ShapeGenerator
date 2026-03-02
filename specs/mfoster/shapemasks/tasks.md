# Tasks: Stage 4 — Shape Masks & Layers

**Input**: Design documents from `/specs/mfoster/shapemasks/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1 = Layers, US2 = Shape Masks)

---

## Phase 1: Setup

**Purpose**: Create the new module stub so imports resolve before full implementation.

- [x] T001 Create src/mask.ts stub — empty module with placeholder export comment so the file exists for imports

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add all new TypeScript types to src/types.ts. Both user stories depend on these type definitions.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Add `LayerFields` interface (`layer?: number`), `MaskFields` interface (`mask?: MaskShape | MaskShape[]`), and `MaskShape` type alias (`= Shape`) to src/types.ts; extend `ShapeBase` to also extend `LayerFields` and `MaskFields`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Layers (Priority: P1) 🎯 MVP

**Goal**: Allow callers to set `layer?: number` on any shape to control SVG rendering order (z-order). Shapes with lower layer values render earlier (further back). Stable sort preserves original array order for equal layers. Shape IDs and PRNG seeds are always derived from the original input array position.

**Independent Test**: Call `generate()` with three shapes at layers `[1, 0, 2]`; verify SVG element order is `index-1` before `index-0` before `index-2`. Verify shape IDs still match original input positions.

### Implementation for User Story 1

- [x] T003 [P] [US1] Add `layer` field to base spread in src/canonicalize.ts — add `...(shape.layer !== undefined ? { layer: shape.layer } : {})` to the existing `base` object in `canonicalizeShape`
- [x] T004 [P] [US1] Add layer validation to src/validate.ts — after existing field checks, if `shape.layer !== undefined && !isFinite(shape.layer)` throw `"layer must be a finite number"`
- [x] T005 [P] [US1] Add stable layer sort to src/generate.ts — after `validate(canonical)`, map shapes to `{ shape, i }` pairs, stable-sort by `(a.shape.layer ?? 0) - (b.shape.layer ?? 0)`, then use each pair's `i` (original index) for all `shapeId` / `varSeed` / `createPrng` calls in the existing `canonical.shapes.map` loop

**Checkpoint**: Shapes with `layer` field render in correct z-order; shapes without `layer` produce identical output to Stage 3

---

## Phase 4: User Story 2 — Shape Masks (Priority: P2)

**Goal**: Allow callers to set `mask?: MaskShape | MaskShape[]` on any shape. The masked shape gets a `<mask>` element in `<defs>` containing the rendered mask shapes (white fill by default), and a `mask="url(#mask-{id})"` attribute on the shape element. Mask shape variation/styling fields are honored. PRNG is isolated via `maskSeed`.

**Independent Test**: Call `generate()` with a circle carrying a square mask; verify SVG contains `<mask id="mask-s1-circle-0" maskUnits="userSpaceOnUse">`, a `<rect>` with `fill="white"` inside it, and `mask="url(#mask-s1-circle-0)"` on the `<circle>` element.

### Implementation for User Story 2

- [x] T006 [P] [US2] Add `maskSeed(genSeed: number, parentIdx: number, maskIdx: number): number` to src/prng.ts — implementation: `return (Math.imul(genSeed | 0, 1000039) + Math.imul(parentIdx, 65537) + maskIdx) | 0;` — uses different primes from blobSeed and varSeed to guarantee independence
- [x] T007 [P] [US2] Add mask canonicalization to src/canonicalize.ts — in `canonicalizeShape`, add mask handling to base spread: normalize single MaskShape to array; if array is non-empty, canonicalize each element using the same per-type switch (reuse `canonicalizeShape` without mask/layer on each MaskShape); omit `mask` key if absent or empty array; add `...(canonicalizedMask ? { mask: canonicalizedMask } : {})` to the base spread
- [x] T008 [P] [US2] Add mask validation to src/validate.ts — in `validateShape`, after existing checks: if `shape.mask` is present, normalize to array, for each MaskShape call `validateShape(ms)` recursively (mask/layer fields won't be present after canonicalize so no special handling needed)
- [x] T009 [US2] Implement `buildMaskDef` in src/mask.ts — import from `./shapes/*.js`, `./variation.js`, `./styling.js`, `./prng.js`, `./fmt.js`; for each MaskShape at index `mi`: create `createPrng(maskSeed(generatorSeed, parentIndex, mi))`; apply `applySizeVariance` if `sizeVariance > 0`; render via same switch dispatch as generate.ts (or `renderVaried` if `distort > 0 || bezier > 0`); compute `buildStylingAttrs`; inject `fill: "white"` default if no fill attr and no fillGradient; accumulate gradient defs into `gradientDefs` param; build SVG element string without id attr; return `<mask id="${maskId}" maskUnits="userSpaceOnUse">${elements}</mask>`
- [x] T010 [US2] Add mask processing to src/generate.ts — import `buildMaskDef` from `./mask.js`; in the per-shape block (after `id` is computed, before `return`): normalize `shape.mask` to array; if non-empty, call `buildMaskDef(\`mask-${id}\`, maskShapes, mode, canonical.seed, i, defs)` and push result to `defs[]`; after `Object.assign(attrs, buildStylingAttrs(...))`, if mask present set `attrs["mask"] = \`url(#mask-${id})\``

**Checkpoint**: Masked shapes render with `<mask>` in defs and `mask="url(...)"` attribute; unmasked shapes and shapes without `layer` produce identical output to Stage 3

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T011 [P] Run full test suite to verify all existing tests still pass and no regressions introduced: `npm test`
- [x] T012 [P] Run TypeScript lint to verify no type errors: `npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 — Layers (Phase 3)**: Depends on Phase 2 (types.ts); T003/T004/T005 are all [P] (different files)
- **US2 — Shape Masks (Phase 4)**: Depends on Phase 2 (types.ts); T006/T007/T008 are [P]; T009 depends on T006 (needs maskSeed); T010 depends on T007+T008+T009
- **Polish (Phase 5)**: Depends on Phase 3 + Phase 4 completion

### User Story Dependencies

- **US1 (Layers)**: Depends only on Phase 2 — independently implementable and testable
- **US2 (Shape Masks)**: Depends only on Phase 2 — independently implementable and testable; does NOT depend on US1

### Within Each User Story

- US1: T003, T004, T005 can all run in parallel (canonicalize.ts, validate.ts, generate.ts are independent files)
- US2: T006, T007, T008 can run in parallel; T009 requires T006 (maskSeed); T010 requires T007+T008+T009

### Parallel Opportunities

- T003, T004, T005 can all launch simultaneously (Phase 3)
- T006, T007, T008 can all launch simultaneously (Phase 4)
- Once T006 completes, T009 can start while T007/T008 finish
- T011, T012 can run in parallel (Phase 5)

---

## Parallel Example: User Story 1

```
# All three tasks touch different files — run together:
Task T003: Add layer to base spread in src/canonicalize.ts
Task T004: Add layer validation in src/validate.ts
Task T005: Add layer sort in src/generate.ts
```

## Parallel Example: User Story 2

```
# Phase 4a — run together:
Task T006: Add maskSeed to src/prng.ts
Task T007: Add mask canonicalization to src/canonicalize.ts
Task T008: Add mask validation to src/validate.ts

# Phase 4b — after T006:
Task T009: Implement buildMaskDef in src/mask.ts

# Phase 4c — after T007+T008+T009:
Task T010: Add mask processing to src/generate.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002)
3. Complete Phase 3: User Story 1 (T003–T005)
4. **STOP and VALIDATE**: `npm test` — verify layer sort works, no regressions
5. Deliver: shapes now support z-order control

### Incremental Delivery

1. T001 → T002 → foundation ready
2. T003+T004+T005 → US1 (Layers) complete — test independently
3. T006+T007+T008 → T009 → T010 → US2 (Shape Masks) complete — test independently
4. T011+T012 → polish and verify

---

## Notes

- T009 (`mask.ts`) is the most complex task — it mirrors the rendering logic in `generate.ts`. Read generate.ts carefully before implementing.
- T010 (`generate.ts` mask processing): the `defs` array is already declared in generate.ts (from Stage 3 gradient work). Push mask element strings to the same array.
- Canonicalize mask shapes WITHOUT `mask` and `layer` keys in their base spread — call a helper or add a flag to suppress those fields for nested canonicalization.
- `maskSeed` must use `Math.imul` like `blobSeed` and `varSeed` for consistent 32-bit arithmetic.
- Layer sort: `Array.prototype.sort` is stable in ES2019+. TypeScript target is already ES2019+.
- MaskShape `fill` default: inject AFTER `buildStylingAttrs` — if `attrs.fill` is not set and no `fillGradient`, set `attrs.fill = "white"`.
