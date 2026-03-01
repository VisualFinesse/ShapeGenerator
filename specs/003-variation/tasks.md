# Tasks: Stage 2 — Variation

**Input**: Design documents from `/specs/003-variation/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓, quickstart.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Establish green baseline before any changes.

- [x] T001 Confirm 229 Stage 1/1.5 tests pass — run `npm test` from repo root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type system and input pipeline changes required by all three user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add `VariationFields` interface and extend `ShapeBase` to include `distort?`, `sizeVariance?`, `clamp?` fields in `src/types.ts`
- [x] T003 [P] Add `varSeed(generatorSeed: number, index: number): number` to `src/prng.ts` using primes 1000033 and 2246822519 (distinct from blobSeed)
- [x] T004 Extend all 9 shape switch cases in `src/canonicalize.ts` to whitelist `distort`, `sizeVariance`, and `clamp` fields (conditional spread — omit when undefined) — depends on T002
- [x] T005 Extend `src/validate.ts` to validate `distort` (finite, 0–1), `sizeVariance` (finite, 0–1), and `clamp.width`/`clamp.height` (finite, > 0) for all shape types — depends on T002

> T002 and T003 are parallel (different files). T004 and T005 both depend on T002 but can run in parallel with each other.

**Checkpoint**: Types, canonicalization, and validation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Vertex Distortion (Priority: P1) 🎯 MVP

**Goal**: Any shape with `distort > 0` has its vertices perturbed by a PRNG offset of magnitude `charSize × distort`, and always renders as `<path>`.

**Independent Test**: A square with `distort: 0.1, seed: 42` produces a `<path>` whose vertex coordinates differ from the unvaried square but remain within `±charSize × distort` of their undistorted positions. Running twice produces the same SVG.

### Implementation for User Story 1

- [x] T006 [US1] Create `src/variation.ts` with: `charSizeOf(shape)`, `extractVertices(shape, generatorSeed, shapeIndex)` (all 9 types — circle/oval sample 16 points; blob re-derives control points via `blobSeed`), `applyDistort(vertices, charSize, distort, prng)`, `verticesToPath(vertices)`, and `renderVaried(shape, varPrng, generatorSeed, shapeIndex)` (distort pipeline only — no clamp yet)
- [x] T007 [US1] Extend `src/generate.ts`: add variation pipeline — import `createPrng` + `varSeed` from `src/prng.ts`, import `renderVaried`, `applySizeVariance` from `src/variation.ts`; create `varPrng` when `distort > 0` or `sizeVariance > 0`; call `renderVaried()` in place of switch when `distort > 0` — depends on T006
- [x] T008 [P] [US1] Create `tests/variation.test.ts` with unit tests: `charSizeOf` returns correct value for all 9 types; `extractVertices` returns correct vertex count per type (square/rect/trapezoid=4, triangle=3, octagon=8, polygon=N, circle/oval=16, blob=N); `applyDistort` keeps each vertex offset within `[-charSize×distort, +charSize×distort]`; `verticesToPath` produces string starting with `M`, containing `L` commands, ending with `Z` — depends on T006
- [x] T009 [P] [US1] Extend `tests/generate.test.ts` with US1 acceptance scenarios: distorted shape element is `<path>`; two calls with same input produce identical SVG; `distort: 0` (or absent) produces byte-for-byte identical output to Stage 1/1.5; mix of distorted and unvaried shapes in one call — depends on T007
- [x] T010 [P] [US1] Extend `tests/validate.test.ts` with distort validation: `0` valid, `0.5` valid, `1` valid, `1.1` invalid, `-0.1` invalid, `NaN` invalid, `Infinity` invalid — depends on T005

**Checkpoint**: All `distort` tests pass. A distorted square renders as `<path>` with perturbed vertices. Unvaried shapes unchanged.

---

## Phase 4: User Story 2 — Size Variation (Priority: P2)

**Goal**: Any shape with `sizeVariance > 0` has its size dimensions scaled by a PRNG factor in `[1 − sizeVariance, 1 + sizeVariance]`, using the normal render pipeline (no forced `<path>`).

**Independent Test**: A circle with `sizeVariance: 0.3, seed: 7` produces a `<circle>` whose `r` attribute differs from `size / 2` but stays within the `[0.7×(size/2), 1.3×(size/2)]` range. Two calls produce the same SVG.

### Implementation for User Story 2

- [x] T011 [US2] Add `applySizeVariance(shape: Shape, prng: () => number): Shape` to `src/variation.ts`: consumes one `prng()` draw; computes `f = 1 + (draw × 2 − 1) × sizeVariance`; scales all size dimensions for the shape type (see spec §US2 table); clamps each scaled dim to `Math.max(1, dim × f)` — depends on T006
- [x] T012 [US2] Extend `src/generate.ts` variation pipeline: call `applySizeVariance(shape, varPrng)` to produce `workShape` when `sizeVariance > 0` (before distort step; use `workShape` in the switch dispatch too) — depends on T011
- [x] T013 [P] [US2] Extend `tests/variation.test.ts` with `applySizeVariance` unit tests: scale factor stays in `[1−sv, 1+sv]`; minimum dimension clamp to 1; all 9 shape types have correct fields scaled; `sizeVariance: 0` returns same dimensions — depends on T011
- [x] T014 [P] [US2] Extend `tests/generate.test.ts` with US2 acceptance scenarios: `sizeVariance > 0` produces normal tag (e.g., `<circle>`); `sizeVariance: 0` (or absent) = identical to unvaried output; combined `sizeVariance + distort` both apply (size scaled then vertices perturbed); determinism holds — depends on T012
- [x] T015 [P] [US2] Extend `tests/validate.test.ts` with sizeVariance validation: `0` valid, `0.5` valid, `1` valid, `1.01` invalid, `-0.1` invalid, `NaN` invalid — depends on T005

**Checkpoint**: All `sizeVariance` tests pass. A circle with `sizeVariance: 0.3` renders as `<circle>` with a PRNG-scaled radius. Unvaried and distort-only shapes unchanged.

---

## Phase 5: User Story 3 — Vertex Clamping (Priority: P3)

**Goal**: Any distorted shape with `clamp: { width, height }` has its perturbed vertices constrained to `[x ± w/2, y ± h/2]`. No effect when `distort === 0`.

**Independent Test**: An octagon with `distort: 0.5, clamp: { width: 100, height: 100 }, x: 200, y: 200, seed: 1` produces a `<path>` where every vertex satisfies `150 ≤ vx ≤ 250` and `150 ≤ vy ≤ 250`.

### Implementation for User Story 3

- [x] T016 [US3] Add `applyClamp(vertices, cx, cy, clampWidth, clampHeight)` to `src/variation.ts`; integrate into `renderVaried()` — after `applyDistort`, call `applyClamp` when `shape.clamp` is present — depends on T006
- [x] T017 [P] [US3] Extend `tests/variation.test.ts` with `applyClamp` unit tests: vertex inside box unchanged; vertex outside box clamped to boundary; all four quadrant violations handled; empty vertex list → empty output — depends on T016
- [x] T018 [P] [US3] Extend `tests/generate.test.ts` with US3 acceptance scenarios: all vertices within clamp bounds when `distort > 0`; `clamp` with `distort: 0` (or absent) = no effect on vertex positions; combined `sizeVariance + distort + clamp` pipeline works end-to-end — depends on T016
- [x] T019 [P] [US3] Extend `tests/validate.test.ts` with clamp validation: valid `{ width: 100, height: 100 }`; `width: 0` invalid; `height: -1` invalid; `clamp` without `distort` still accepted (valid input, no-op at runtime); `width: Infinity` invalid — depends on T005

**Checkpoint**: All `clamp` tests pass. A heavily-distorted shape never exceeds its clamp box. Shapes without clamp unchanged.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Canonicalization tests, regression invariants, and final validation.

- [x] T020 [P] Extend `tests/canonicalize.test.ts`: `distort` preserved when present; `distort` absent → no key in canonical; `sizeVariance` preserved/absent; `clamp` object preserved atomically; unknown sibling fields still dropped; verify for at least 3 representative shape types
- [x] T021 [P] Extend `tests/invariants.test.ts`: all 9 shape types without any variation fields produce SVG byte-for-byte identical to a fresh Stage 1/1.5 `generate()` call with the same inputs (regression guard)
- [x] T022 Run `npm test` — all tests pass (229 existing + new variation tests)
- [x] T023 [P] Run `npm run lint` — zero warnings or errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion (T002–T005)
- **US2 (Phase 4)**: Depends on Phase 3 core (T006–T007) — `variation.ts` must exist before adding `applySizeVariance`
- **US3 (Phase 5)**: Depends on Phase 3 core (T006–T007) — `renderVaried` must exist before adding clamp integration
- **Polish (Phase 6)**: Depends on Phase 3–5 completion

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 foundation. No story dependencies.
- **US2 (P2)**: Depends on US1 (T006) — `applySizeVariance` is added to `variation.ts` created in US1.
- **US3 (P3)**: Depends on US1 (T006) — `applyClamp` is added to `variation.ts` created in US1.
- US2 and US3 can run in parallel with each other after US1 core (T006–T007).

### Within Each User Story

- Core `variation.ts` function(s) before `generate.ts` changes
- `generate.ts` changes before acceptance tests
- Unit tests and validate.test.ts extensions can run in parallel after core implementation

---

## Parallel Opportunities

### Phase 2 (Foundational)

```text
T002 [P] — src/types.ts          ─┐
T003 [P] — src/prng.ts           ─┘ run together

Then:
T004 — src/canonicalize.ts       ─┐
T005 — src/validate.ts           ─┘ run together (both depend on T002)
```

### Phase 3 (US1)

```text
T006 → T007 (sequential: generate.ts imports variation.ts)

After T007:
T008 [P] — tests/variation.test.ts    ─┐
T009 [P] — tests/generate.test.ts     ─┤ run together
T010 [P] — tests/validate.test.ts     ─┘
```

### Phase 4 (US2) — after T006

```text
T011 → T012 (sequential)

After T012:
T013 [P] — tests/variation.test.ts    ─┐
T014 [P] — tests/generate.test.ts     ─┤ run together
T015 [P] — tests/validate.test.ts     ─┘
```

### Phase 5 (US3) — after T006, parallel with US2

```text
T016 (depends on T006)

After T016:
T017 [P] — tests/variation.test.ts    ─┐
T018 [P] — tests/generate.test.ts     ─┤ run together
T019 [P] — tests/validate.test.ts     ─┘
```

### Phase 6 (Polish)

```text
T020 [P] — tests/canonicalize.test.ts ─┐
T021 [P] — tests/invariants.test.ts   ─┘ run together

Then T022 → T023 [P]
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T005) — CRITICAL
3. Complete Phase 3: US1 (T006–T010)
4. **STOP and VALIDATE**: Run `npm test` — distorted shapes work, unvaried shapes unchanged
5. Demo: distorted octagon, triangle, polygon

### Incremental Delivery

1. **Phase 1+2**: Foundation ready — all validation + canonicalization works for new fields
2. **Phase 3 (US1)**: Vertex distortion → test → confirm `<path>` output + determinism
3. **Phase 4 (US2)**: Size variation → test → confirm scaled dims + normal tags
4. **Phase 5 (US3)**: Clamping → test → confirm vertex containment
5. **Phase 6**: Polish, regression guard, lint clean

### Key Constraint

`variation.ts` must be created in US1 (T006) before US2 or US3 can add functions to it. US2 and US3 are otherwise independent and their test tasks are fully parallel.

---

## Notes

- All shape renderers in `src/shapes/` are **untouched** — no regression risk there
- `renderVaried` in `variation.ts` receives the full shape object; it reads `shape.clamp` internally — no additional `generate.ts` changes needed for US3
- The `varPrng` draw order is fixed: size draw (if `sizeVariance > 0`) first, vertex draws (if `distort > 0`) second — this ordering must be respected for determinism
- `extractVertices` for blob re-derives control points using `createPrng(blobSeed(seed, index))` — this is the same derivation as in `renderBlob`; the results are then perturbed by `varPrng`
- `applyClamp` only runs inside `renderVaried` (when `distort > 0`); it is never called for sizeVariance-only shapes
