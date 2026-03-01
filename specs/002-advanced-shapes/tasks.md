# Tasks: Advanced Shapes v0.2

**Input**: Design documents from `/specs/002-advanced-shapes/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: Included — plan.md project structure explicitly lists test files for all new shape types.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: Confirm the existing test baseline before any changes.

- [x] T001 Run `npm test` to verify all Stage 1 tests pass on branch `002-advanced-shapes` (establishes regression baseline)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and infrastructure that ALL shape renderers and tests depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Extend `src/types.ts` — add `TrapezoidShape`, `OctagonShape`, `PolygonShape`, `OvalShape`, `BlobShape` interfaces; add all 5 to the `Shape` union; add `"ellipse"` to `ShapeElement.tag` union (needed for oval semantic mode)
- [x] T003 [P] Create `src/prng.ts` — export `createPrng(seed: number): () => number` (mulberry32 algorithm) and `blobSeed(generatorSeed: number, index: number): number` helper (seed mixing for per-shape determinism)
- [x] T004 Extend `src/canonicalize.ts` — import 5 new shape interfaces; add switch cases for `"trapezoid"` (picks topWidth, bottomWidth, height), `"octagon"` (picks size), `"polygon"` (picks sides, size), `"oval"` (picks width, height), `"blob"` (picks size, points if present) — drops all other fields (depends on T002)
- [x] T005 Extend `src/validate.ts` — add 5 new types to `SUPPORTED_TYPES`; add per-type switch cases enforcing rules V-10 through V-19: trapezoid topWidth/bottomWidth/height (> 0, finite), octagon size (> 0, finite), polygon sides (integer ≥ 3, finite) + size (> 0, finite), oval width/height (> 0, finite), blob size (> 0, finite) + optional points (integer ≥ 3 when present) (depends on T002)

> T004 and T005 both depend on T002 but touch different files — start them in parallel once T002 is done.

**Checkpoint**: Types defined, PRNG available, canonicalization and validation cover all 9 shape types. User story work can begin.

---

## Phase 3: User Story 1 — Generate SVG with Advanced Shape Types (P1) 🎯 MVP

**Goal**: All 5 new shape types render correctly via `generate()` in semantic mode (and both modes, since each renderer handles both in a single function).

**Independent Test**: `generate({ seed: 42, canvas: {width:400,height:400}, shapes: [{type:"trapezoid",...},{type:"octagon",...},{type:"polygon",...},{type:"oval",...},{type:"blob",...}] })` returns an SVG string containing the correct element types, `metadata.shapeCount === 5`, and is byte-for-byte identical on two consecutive calls.

### Implementation

- [x] T006 [P] [US1] Create `src/shapes/trapezoid.ts` — export `renderTrapezoid(shape: TrapezoidShape, mode)`: compute TL/TR/BR/BL from x, y, topWidth, bottomWidth, height using bounding-box center convention; semantic → `{ tag: "polygon", attrs: { points: "..." } }`; path → `{ tag: "path", attrs: { d: "M TL L TR L BR L BL Z" } }`; use `fmt()` for all coordinates
- [x] T007 [P] [US1] Create `src/shapes/octagon.ts` — export `renderOctagon(shape: OctagonShape, mode)`: compute 8 vertices at `k·π/4 − π/2` for k=0..7 using `x + size·cos(angle)`, `y + size·sin(angle)`; semantic → `{ tag: "polygon", attrs: { points: "..." } }`; path → `{ tag: "path", attrs: { d: "M v0 L v1 ... L v7 Z" } }`; use `fmt()` for all coordinates
- [x] T008 [P] [US1] Create `src/shapes/polygon.ts` — export `renderPolygon(shape: PolygonShape, mode)`: compute `sides` vertices at `2πk/n − π/2` for k=0..n-1; semantic → `{ tag: "polygon", attrs: { points: "..." } }`; path → `{ tag: "path", attrs: { d: "M v0 L v1 ... Z" } }`; use `fmt()` for all coordinates
- [x] T009 [P] [US1] Create `src/shapes/oval.ts` — export `renderOval(shape: OvalShape, mode)`: rx=width/2, ry=height/2; semantic → `{ tag: "ellipse", attrs: { cx, cy, rx, ry } }`; path → `{ tag: "path", attrs: { d: "M (x+rx) y A rx ry 0 1 0 (x-rx) y A rx ry 0 1 0 (x+rx) y Z" } }`; use `fmt()` for all values
- [x] T010 [P] [US1] Create `src/shapes/blob.ts` — export `renderBlob(shape: BlobShape, mode, seed: number, index: number)`: call `createPrng(blobSeed(seed, index))`; place `n = shape.points ?? 6` control points at even angles `2πk/n` with radius `shape.size * (0.6 + 0.4 * prng())`; convert closed Catmull-Rom spline to cubic Bézier segments (CP1 = P[i] + (P[i+1]−P[i−1])/6, CP2 = P[i+1] − (P[i+2]−P[i])/6, indices mod n); serialize as `{ tag: "path", attrs: { d: "M P[0] C CP1_0 CP2_0 P[1] C ... Z" } }`; always returns `tag: "path"` regardless of mode; use `fmt()` for all coordinates (depends on T003)
- [x] T011 [US1] Extend `src/generate.ts` — import all 5 new render functions; add switch cases: `"trapezoid"` → `renderTrapezoid(shape, mode)`, `"octagon"` → `renderOctagon(shape, mode)`, `"polygon"` → `renderPolygon(shape, mode)`, `"oval"` → `renderOval(shape, mode)`, `"blob"` → `renderBlob(shape, mode, canonical.seed, i)` (note: blob receives extra `seed` and `i` args); remove `default` throw or update its message to reference all 9 types (depends on T006–T010)

### Tests

- [x] T012 [P] [US1] Create `tests/shapes/trapezoid.test.ts` — assert: symmetric trapezoid (topWidth=bottomWidth) produces a rectangle-equivalent `points` string; asymmetric trapezoid TL/TR/BR/BL vertex math matches manual calculation; `tag === "polygon"` in semantic mode; `rotation` field passes through to render output structure unchanged
- [x] T013 [P] [US1] Create `tests/shapes/octagon.test.ts` — assert: exactly 8 space-separated coordinate pairs in `points`; first vertex has `vy < shape.y` (at top); all vertices are `size` distance from center (circumradius check with tolerance); `tag === "polygon"` in semantic mode
- [x] T014 [P] [US1] Create `tests/shapes/polygon.test.ts` — assert: triangle (sides=3) produces 3 vertex pairs; pentagon (sides=5) produces 5 pairs; first vertex vy < shape.y for all n; `tag === "polygon"`; verify sides=2 case is not tested here (validation tested in US3 phase)
- [x] T015 [P] [US1] Create `tests/shapes/oval.test.ts` — assert semantic mode: `tag === "ellipse"`, attrs contain `cx`, `cy`, `rx === width/2`, `ry === height/2`; assert path mode: `tag === "path"`, d string contains `"A"` twice; assert a square oval (width=height) still renders as `<ellipse>` not `<circle>`
- [x] T016 [P] [US1] Create `tests/shapes/blob.test.ts` — assert: calling `renderBlob` twice with identical args produces identical `d` string (determinism); `tag === "path"` in semantic mode; `tag === "path"` in path mode; default points=6 produces path with 6 cubic Bézier segments; custom points=4 produces path with 4 segments; different seeds produce different paths (depends on T010)
- [x] T017 [US1] Extend `tests/generate.test.ts` with US1 acceptance scenarios — (1) input with one of each new type produces `shapeCount === 5`; (2) each expected SVG element tag present for correct type+mode; (3) same input called twice → identical SVG strings; (4) trapezoid `id` matches `s42-trapezoid-0` format; (5) empty shapes array still works with new type support added (depends on T011)

**Checkpoint**: `npm test` passes. All 5 new shapes render in semantic mode. Byte-for-byte determinism verified.

---

## Phase 4: User Story 2 — Path Mode for All New Shapes (P1)

**Goal**: Every new shape type emits a `<path>` element when `outputMode: "path"`. Blob emits `<path>` in both modes.

**Independent Test**: `generate({ seed: 1, canvas: {width:300,height:300}, outputMode: "path", shapes: [trapezoid, octagon, polygon, oval] })` — all 4 elements are `<path>` tags. Blob in semantic mode is also `<path>`.

### Tests (extending Phase 3 test files)

- [x] T018 [P] [US2] Extend `tests/shapes/trapezoid.test.ts` — path mode: `tag === "path"`; `d` attribute starts with `"M"`, contains 3 `"L"` commands, ends with `"Z"`; coordinate values match the same vertices as semantic mode
- [x] T019 [P] [US2] Extend `tests/shapes/octagon.test.ts` — path mode: `tag === "path"`; `d` contains 7 `"L"` segments (M v0 + 7 L + Z = 8 vertices); path closes with `"Z"`
- [x] T020 [P] [US2] Extend `tests/shapes/polygon.test.ts` — path mode: `tag === "path"`; for sides=5: `d` contains 4 `"L"` segments + `"Z"`; for sides=6: `d` contains 5 `"L"` + `"Z"`
- [x] T021 [P] [US2] Extend `tests/shapes/oval.test.ts` — path mode: `tag === "path"`; `d` matches pattern `M {x+rx} {y} A {rx} {ry} 0 1 0 {x-rx} {y} A {rx} {ry} 0 1 0 {x+rx} {y} Z`; spot-check coordinate values against known rx/ry
- [x] T022 [US2] Extend `tests/generate.test.ts` — `outputMode: "path"` scenario: generate with all 5 new shapes, assert SVG contains only `<path>` elements (no `<polygon>`, `<ellipse>`); assert blob with `outputMode: "semantic"` still emits `<path>`; assert blob with `outputMode: "path"` also emits `<path>` (same in both modes) (depends on T018–T021)

**Checkpoint**: `npm test` passes. Path mode verified for all 5 new shapes. Blob `<path>`-always invariant confirmed.

---

## Phase 5: User Story 3 — Input Validation for New Shape Types (P2)

**Goal**: Invalid or missing parameters for all 5 new types produce clear, actionable error messages with field path and issue.

**Independent Test**: Each error scenario from spec.md US3 (polygon sides < 3, blob points < 3, trapezoid missing bottomWidth) throws an `Error` with the specified message.

### Tests

- [x] T023 [US3] Extend `tests/validate.test.ts` with trapezoid validation cases — throws on: missing `topWidth`; missing `bottomWidth`; missing `height`; `topWidth: 0`; `topWidth: -5`; `bottomWidth: NaN`; `height: Infinity`
- [x] T024 [US3] Extend `tests/validate.test.ts` with octagon validation cases — throws on: missing `size`; `size: 0`; `size: -1`; `size: NaN`
- [x] T025 [US3] Extend `tests/validate.test.ts` with polygon validation cases — throws on: `sides: 2` (< 3); `sides: 0`; `sides: -1`; `sides: 2.5` (non-integer); `sides: NaN`; missing `sides`; missing `size`; `size: 0`
- [x] T026 [US3] Extend `tests/validate.test.ts` with oval validation cases — throws on: missing `width`; missing `height`; `width: 0`; `height: -1`; `width: Infinity`; `height: NaN`
- [x] T027 [US3] Extend `tests/validate.test.ts` with blob validation cases — throws on: missing `size`; `size: 0`; `size: NaN`; `points: 2` (< 3); `points: 1`; `points: 2.9` (non-integer); `points: NaN`; valid `points: 3` does NOT throw

> T023–T027 all extend `tests/validate.test.ts` (same file — run sequentially).

**Checkpoint**: `npm test` passes. All 7 new error categories from validation rules V-10 to V-19 are covered.

---

## Phase 6: User Story 4 — Backward Compatibility (P1)

**Goal**: All Stage 1 shapes (square, rectangle, circle, triangle) function exactly as before with no regressions.

**Independent Test**: Run `npm test` — all pre-existing Stage 1 tests pass without modification.

### Tests

- [x] T028 [US4] Run `npm test` — confirm all pre-existing Stage 1 tests still pass; zero regressions (validates `src/generate.ts` switch changes in T011 did not affect Stage 1 paths)
- [x] T029 [P] [US4] Extend `tests/canonicalize.test.ts` with unknown-field drop tests for all 5 new shape types — e.g., trapezoid with extra `color: "red"` field is dropped; blob with extra `foo: 1` field is dropped; polygon with extra `irrelevant: true` field is dropped; canonicalized output matches exact allowed-field whitelist from data-model.md
- [x] T030 [US4] Extend `tests/invariants.test.ts` — add invariant assertions covering all 9 shape types: (1) determinism: two calls with identical input → identical SVG for each type; (2) shape identity: `type` attribute in shape ID matches input type for new shapes; (3) shapeCount: `metadata.shapeCount === input.shapes.length` with mixed new/old shapes; (4) valid SVG root: output always starts with `<svg xmlns=` (depends on T029)

**Checkpoint**: Full test suite passes. Stage 1 invariants hold across all 9 shape types.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all implementation.

- [x] T031 [P] Run `npm run lint` — resolve any TypeScript strict-mode errors or warnings in all new files (`src/prng.ts`, `src/shapes/*.ts` new files, modified `src/types.ts`, `src/generate.ts`, `src/canonicalize.ts`, `src/validate.ts`)
- [x] T032 Run `npm test` — confirm 0 test failures across all test files; all new shape test files included in test run
- [x] T033 [P] Manually validate the 5 examples from `specs/002-advanced-shapes/quickstart.md` against actual `generate()` output in a scratch file — confirm shape elements, IDs, and coordinate values match documented behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
  - T002 → T004, T005 (parallel once T002 done)
  - T003 (independent, parallel with T002)
- **Phase 3 (US1)**: Depends on all Phase 2 tasks
  - T006–T009 can start in parallel immediately
  - T010 requires T003 (done in Phase 2) — starts in parallel with T006–T009
  - T011 requires T006–T010 all complete
  - T012–T015 can start in parallel with T006–T009 (test first if TDD preferred)
  - T016 requires T010; T017 requires T011
- **Phase 4 (US2)**: Depends on Phase 3 complete
  - T018–T021 parallel; T022 requires T018–T021
- **Phase 5 (US3)**: Depends on Phase 2 complete (validate.ts already extended)
  - T023–T027 sequential (same file)
  - Can run in parallel with Phase 4 since they touch different files
- **Phase 6 (US4)**: Depends on all prior phases complete
  - T028 run first; T029 and T030 then parallel
- **Phase 7 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no dependencies on other user stories
- **US2 (P1)**: Starts after US1 complete (extends same test files created in US1)
- **US3 (P2)**: Starts after Foundational complete — independent of US1/US2 (validate.ts is separate from renderers)
- **US4 (P1)**: Starts after US1+US2+US3 all complete

---

## Parallel Opportunities

### Phase 2 (after T002 completes)
```
T003 (prng.ts)      ← starts with T002 in parallel
T004 (canonicalize) ← starts after T002
T005 (validate)     ← starts after T002, parallel with T004
```

### Phase 3 (all start together)
```
T006 (trapezoid.ts)  T007 (octagon.ts)  T008 (polygon.ts)
T009 (oval.ts)       T010 (blob.ts)
T012 (trapezoid test) T013 (octagon test) T014 (polygon test)
T015 (oval test)      T016 (blob test)
```

### Phase 4 (all start together after Phase 3)
```
T018 (trapezoid path test)  T019 (octagon path test)
T020 (polygon path test)    T021 (oval path test)
```

### Phase 5 + Phase 4 (can run in parallel — different files)
```
Phase 4: T018–T022 (shape test files)
Phase 5: T023–T027 (validate.test.ts)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 4)

1. Complete Phase 1: Setup baseline
2. Complete Phase 2: Foundational (types, prng, canonicalize, validate)
3. Complete Phase 3: US1 — all 5 shapes rendering in semantic + path mode
4. Complete Phase 6: US4 — confirm no Stage 1 regressions
5. **STOP and VALIDATE**: Run `npm test`, all green
6. All 5 new shapes functional; ready for review

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 → 5 new shapes working (US1) ← deployable MVP
3. Phase 4 → Path mode verified (US2)
4. Phase 5 → Validation hardened (US3)
5. Phase 6 + 7 → Backward compat confirmed + polish

---

## Notes

- Blob's `renderBlob` signature differs from other renderers: `(shape, mode, seed, index)` — `generate.ts` passes `canonical.seed` and the map index `i`
- `ShapeElement.tag` in `src/types.ts` must include `"ellipse"` (T002) before `src/shapes/oval.ts` can compile
- `src/svg.ts` requires **no changes** — `assembleSvg` serializes any tag + attrs generically
- All coordinate math uses `fmt()` from `src/fmt.ts` for 6-decimal deterministic formatting
- Blob always returns `tag: "path"` — the `outputMode` parameter is accepted but ignored
- `[P]` tasks = different files, no dependency on incomplete tasks — safe to parallelize
- Each user story phase is independently testable before moving to the next
