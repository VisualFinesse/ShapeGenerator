# Tasks: SVG Shape Engine v0.1

**Branch**: `001-foster-ts-shapes` | **Generated**: 2026-02-28
**Input**: plan.md · spec.md · data-model.md · contracts/api.md · research.md · quickstart.md

**Tests**: Included — DoD (plan.md §7) requires `npm run test` 100% green.
**Execution**: Sequential. No `[P]` markers — each task runs after the previous.

---

## Format: `[ID] [USn?] Description — file path (FR-xxx; INV-n)`

- **[USn]**: User story (spec.md priority order). Setup/foundational tasks have no label.
- No `[P]` markers: workflow is fully sequential.

---

## Phase 1: Setup

**Purpose**: TypeScript library project scaffold — no source logic yet.

- [x] T001 Create `package.json` (`name: "foster-ts-shapes"`, `type: "module"`, `exports: "./src/index.ts"`, scripts: `"build": "tsc"`, `"test": "vitest run"`, `"lint": "tsc --noEmit"`), `tsconfig.json` (strict, `ES2022`, `NodeNext`, `noEmit: false`, `outDir: "dist"`, `declaration: true`), `vitest.config.ts` — project root

**Checkpoint**: `npm run build` and `npm run test` both succeed (no source yet, no tests yet).

---

## Phase 2: Foundational

**Purpose**: Shared types and ID function — required by every pipeline stage.

⚠️ No user-story work begins until T002–T004 are complete.

- [x] T002 Define all TypeScript types in `src/types.ts` — public types: `GeneratorInput` (seed, canvas, shapes, `outputMode?: "semantic" | "path"`), `Canvas`, `Shape` discriminated union, `SquareShape`, `RectangleShape`, `CircleShape`, `TriangleShape`, `ShapeBase`, `GeneratorOutput`; **internal type** (not exported): `ShapeElement { tag: "rect"|"circle"|"polygon"|"path"; attrs: Record<string, string|number>; id: string; rotation?: number; cx: number; cy: number }` — this is the struct passed from shape renderers through `generate.ts` to `svg.ts`; all fields per plan.md §1 and data-model.md (FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-012, FR-013)

- [x] T003 Implement `shapeId(seed, type, index): string` in `src/id.ts` — format `s<seed>-<type>-<index>`; negative seed encoded as `sn<abs(seed)>` to satisfy XML `Name` production; no other logic (FR-007, FR-008; R3)

- [x] T004 Write `tests/id.test.ts` — assert correct output for positive seed (`s42-square-0`), negative seed (`sn7-circle-2`), zero seed, correct type and index encoding, XML name validity (starts with letter, only letters/digits/hyphens) (FR-007, FR-008)

**Checkpoint**: Types compile under strict mode; `shapeId` unit tests pass.

---

## Phase 3: US1 — Generate SVG from Primitive Shapes (Priority: P1) 🎯 MVP

**Goal**: `generate()` accepts valid, clean input and returns a correct SVG string with `metadata.shapeCount`.

**Independent test**: Run the spec example (seed `42`, 4 shapes); verify 4 shape elements, `shapeCount === 4`, byte-for-byte identical output on two consecutive calls, each `id` contains its shape type string.

- [x] T005 [US1] Implement `src/shapes/square.ts` — export function returning `{tag: "rect", attrs: {x, y, width, height}}` in semantic mode and `{tag: "path", attrs: {d: "M x1 y1 L x2 y2 L x3 y3 L x4 y4 Z"}}` in path mode, computed from center `(x, y)` and `size`; all coordinates via `Number.toFixed(6)` with trailing-zero strip (FR-002, FR-003, FR-004, FR-009, FR-012; INV-6, INV-7; R2)

- [x] T006 [US1] Implement `src/shapes/rectangle.ts` — same dual-mode pattern as square, using `width`/`height` instead of `size`; vertices from center `(x, y)` ± half-dimensions (FR-002, FR-003, FR-004, FR-009, FR-012; INV-6, INV-7; R2)

- [x] T007 [US1] Implement `src/shapes/circle.ts` — semantic mode: `{tag: "circle", attrs: {cx, cy, r}}` where `r = size/2`; path mode: `{tag: "path", attrs: {d: "M (x+r) y A r r 0 1 0 (x-r) y A r r 0 1 0 (x+r) y Z"}}` (exact two-arc, no Bézier); rotation emits `transform` attr when non-zero (FR-002, FR-003, FR-004, FR-005, FR-009, FR-012; INV-6, INV-7; R1, R2)

- [x] T008 [US1] Implement `src/shapes/triangle.ts` — semantic mode: `{tag: "polygon", attrs: {points: "x1,y1 x2,y2 x3,y3"}}`; path mode: `{tag: "path", attrs: {d: "M x1 y1 L x2 y2 L x3 y3 Z"}}`; equilateral centroid: `h = size*√3/2`, top `(x, y−2h/3)`, base-left `(x−size/2, y+h/3)`, base-right `(x+size/2, y+h/3)` (FR-002, FR-003, FR-004, FR-005, FR-009, FR-012; INV-6, INV-7; R2, R5)

- [x] T009 [US1] Implement `src/svg.ts` — `assembleSvg(canvas: Canvas, elements: ShapeElement[]): string` returns complete SVG string; root `<svg xmlns="http://www.w3.org/2000/svg" width height viewBox="0 0 W H">`; for each `ShapeElement`: render `<{tag} id="{id}" {attrs...}/>`, append `transform="rotate({rotation}, {cx}, {cy})"` only when `rotation` is present and non-zero; elements in input order; no other attributes or elements (FR-006, FR-009, FR-014, FR-015; INV-3, INV-4, INV-6, INV-7)

- [x] T010 [US1] Implement `generate(input: GeneratorInput): GeneratorOutput` in `src/generate.ts` — pipeline (no canonicalize/validate yet): (1) resolve `outputMode`: default to `"semantic"` when `input.outputMode` is `undefined`; (2) for each shape at index `i`, call the matching shape renderer (`square`/`rectangle`/`circle`/`triangle`) with the shape and `outputMode`, build a `ShapeElement` by adding `id: shapeId(input.seed, shape.type, i)`, `rotation: shape.rotation`, `cx: shape.x`, `cy: shape.y`; (3) call `assembleSvg(input.canvas, elements)`; (4) return `{svg, metadata: {shapeCount: input.shapes.length}}`; valid clean input assumed for this phase (FR-001, FR-006, FR-007, FR-009, FR-012; INV-1, INV-4, INV-5)

- [x] T011 [US1] Wire `src/index.ts` — re-export `generate` and exactly the 8 types from plan.md §1 (`GeneratorInput`, `Canvas`, `Shape`, `SquareShape`, `RectangleShape`, `CircleShape`, `TriangleShape`, `GeneratorOutput`); no other exports

- [x] T012 [US1] Write `tests/shapes/square.test.ts`, `tests/shapes/rectangle.test.ts`, `tests/shapes/circle.test.ts`, `tests/shapes/triangle.test.ts` — assert correct attribute values and path `d` strings for known center/size inputs; verify `toFixed(6)` precision and trailing-zero stripping; verify semantic vs path mode differ correctly; verify circle arc uses `A` commands (not `C`) (FR-002, FR-003, FR-004, FR-012)

- [x] T013 [US1] Write `tests/generate.test.ts` — US1-AS1: 4-shape replay bundle → 4 elements, `shapeCount === 4`; US1-AS2: same input twice → byte-for-byte identical strings; US1-AS3: square ID contains `"square"`; edge cases: empty `shapes[]` → valid SVG zero elements (FR-014), shape beyond canvas → renders as-is no clipping (FR-015), `rotation: 360` accepted literally (FR-005), duplicate shapes get unique IDs via distinct index (FR-008)

- [x] T014 [US1] Write `tests/invariants.test.ts` — INV-1 determinism (100-call loop, all outputs identical); INV-3 valid SVG root (parse `<svg>`, check `xmlns`/`width`/`height`/`viewBox`); INV-4 exact shape count (element count vs `metadata.shapeCount` vs `input.shapes.length`); INV-5 shape identity (each `id` contains its type string); INV-6 default semantic output (omit `outputMode` → `<rect`/`<circle`/`<polygon` present, zero `<path`); INV-7 path-only output (`outputMode: "path"` → N `<path`, zero `<rect`/`<circle`/`<polygon`)

**Checkpoint**: US1 independently testable — `generate()` produces correct SVG for valid clean input.

---

## Phase 4: US2 — Input Canonicalization (Priority: P2)

**Goal**: Unknown fields silently dropped at all levels; two inputs differing only in unknown fields produce identical SVG.

**Independent test**: `generate({...validInput, theme: "dark", shapes: [{...square, foo: 1}]})` strictly equals `generate(validInput)`.

- [x] T015 [US2] Implement `canonicalize(input)` in `src/canonicalize.ts` — strict allowlist; top-level retains only `{seed, canvas, shapes, outputMode}`; canvas retains only `{width, height}`; each shape reconstructed with base fields `{type, x, y, rotation?}` plus type-specific keys per plan.md §3 Step 1; returns a new object, no mutation (FR-010; INV-2)

- [x] T016 [US2] Update `src/generate.ts` — insert `const canonical = canonicalize(input)` as step 1; pass `canonical` through the rest of the pipeline (FR-010; INV-2)

- [x] T017 [US2] Write `tests/canonicalize.test.ts` — strips top-level unknowns (`theme`, `version`); strips canvas unknowns; strips unknown keys on all 4 shape types; preserves all allowed keys unchanged; US2-AS1: outputs with/without extra fields are strictly equal; US2-AS2: no trace of unknown field names in SVG string; US2-AS3: top-level `theme: "dark"` has zero effect on output (FR-010; INV-2)

**Checkpoint**: `generate()` silently drops unknown fields at every level.

---

## Phase 5: US3 — Input Validation (Priority: P3)

**Goal**: Invalid numeric values, missing required fields, invalid canvas, wrong per-type params, or unsupported type throw `Error` with a message naming the field and the issue.

**Independent test**: Input with `x: NaN` throws `Error` whose message contains `"shapes[0].x"` and `"NaN"`.

- [x] T018 [US3] Implement `validate(input)` in `src/validate.ts` — (1) numeric safety: walk all numeric fields, throw `"Invalid numeric value in <path>: <value>"` on `NaN`/`Infinity`/`−Infinity`; (2) canvas `width`/`height` must be `> 0` finite; (3) shape `type` must be one of four supported values, error lists them; (4) per-type sizing: square/circle/triangle require positive `size`, rectangle requires positive `width`/`height`; (5) `x`, `y` required on every shape, `seed` required at top level (FR-011; data-model.md Validation Rules 1–5)

- [x] T019 [US3] Update `src/generate.ts` — insert `validate(canonical)` as step 2, after `canonicalize()` and before rendering (FR-001, FR-011)

- [x] T020 [US3] Write `tests/validate.test.ts` — US3-AS1: `x: NaN` throws, message contains field path and `"NaN"`; US3-AS2: `x: Infinity` throws; US3-AS3: square with `width` key (wrong param, stripped by canonicalize → missing `size`) throws; US3-AS4: `type: "hexagon"` throws listing valid types; US3-AS5: `canvas.width: 0` throws; also test `−Infinity`, missing `y`, negative `size`, missing `seed` (FR-011)

**Checkpoint**: Full pipeline — `generate()` rejects all invalid inputs with actionable errors.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T021 Expand `tests/generate.test.ts` — add US2 acceptance scenarios (AS1/AS2/AS3) and US3 acceptance scenarios (AS1–AS5) as specified in plan.md §6 "Acceptance Scenario Tests" table; these exercise the full integrated pipeline end-to-end (FR-010, FR-011; plan.md §6)

- [x] T022 Verify DoD: run `npm run build` (zero TypeScript strict-mode errors) and `npm run test` (all tests green); confirm all 10 checklist items from plan.md §7, including zero runtime dependencies in `package.json` and exported API matching plan.md §1 exactly

- [x] T023 Create `.github/workflows/ci.yml` — trigger on push/PR to `main` and `001-foster-ts-shapes`; steps: checkout, `npm ci`, `npm run build`, `npm run test`; run the replay bundle (seed `42`, 4 shapes) 3 consecutive times in a single job step and assert all 3 outputs are byte-for-byte identical; job must pass before merge (plan.md §7 DoD item 10)

---

## Dependencies & Execution Order

```
T001 (setup)
  └─ T002 (types.ts)
       └─ T003 (id.ts)
            └─ T004 (id.test.ts)
                 └─ T005 (square.ts)
                      └─ T006 (rectangle.ts)
                           └─ T007 (circle.ts)
                                └─ T008 (triangle.ts)
                                     └─ T009 (svg.ts)
                                          └─ T010 (generate.ts — no pipeline)
                                               └─ T011 (index.ts)
                                                    └─ T012 (shape unit tests)
                                                         └─ T013 (generate.test.ts US1)
                                                              └─ T014 (invariants.test.ts)
                                                                   └─ T015 (canonicalize.ts)
                                                                        └─ T016 (integrate canonicalize)
                                                                             └─ T017 (canonicalize.test.ts)
                                                                                  └─ T018 (validate.ts)
                                                                                       └─ T019 (integrate validate)
                                                                                            └─ T020 (validate.test.ts)
                                                                                                 └─ T021 (US2+US3 scenarios)
                                                                                                      └─ T022 (DoD verify)
                                                                                                           └─ T023 (CI workflow)
```

### MVP Scope

Complete **Phases 1–3** (T001–T014) to deliver US1: a working `generate()` on valid input, all invariants passing.

### FR / Invariant Coverage

| ID     | Tasks                        |
| ------ | ---------------------------- |
| FR-001 | T002, T010, T019             |
| FR-002 | T002, T005–T008, T012        |
| FR-003 | T002, T005–T008              |
| FR-004 | T002, T005–T008, T018        |
| FR-005 | T002, T007, T008, T009, T013 |
| FR-006 | T002, T009, T010             |
| FR-007 | T003, T010, T013             |
| FR-008 | T003, T004, T009, T013, T014 |
| FR-009 | T009, T010, T013             |
| FR-010 | T015, T016, T017, T021       |
| FR-011 | T018, T019, T020, T021       |
| FR-012 | T002, T005–T009, T014        |
| FR-013 | T002, T013                   |
| FR-014 | T009, T013                   |
| FR-015 | T009, T013                   |
| INV-1  | T010, T014                   |
| INV-2  | T015, T016, T017             |
| INV-3  | T009, T014                   |
| INV-4  | T009, T010, T014             |
| INV-5  | T003, T009, T014             |
| INV-6  | T005–T009, T014              |
| INV-7  | T005–T009, T014              |

### Task Count Summary

| Phase                       | Tasks  | Description |
| --------------------------- | ------ | ----------- |
| 1 Setup                     | 1      | T001        |
| 2 Foundational              | 3      | T002–T004   |
| 3 US1 Generate SVG (P1)     | 10     | T005–T014   |
| 4 US2 Canonicalization (P2) | 3      | T015–T017   |
| 5 US3 Validation (P3)       | 3      | T018–T020   |
| 6 Polish                    | 3      | T021–T023   |
| **Total**                   | **23** |             |
