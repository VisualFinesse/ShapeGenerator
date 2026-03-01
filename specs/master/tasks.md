# Tasks: Stage 3 — Styling & Bezier

**Input**: Design documents from `/specs/master/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓

**Organization**: Tasks grouped by user story (US1 Opacity → US2 Color → US3 Gradients → US4 Bezier).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no cross-dependencies)
- **[Story]**: Which user story (US1–US4) the task implements

---

## Phase 1: Setup

**Purpose**: Create the new styling.ts module (stub only — fully implemented in Phase 5).

- [x] T001 Create `src/styling.ts` with exported function stubs: `buildGradientDef(gradientId: string, gradient: Gradient): string` and `buildStylingAttrs(shape: ShapeBase, fillGradId?: string, strokeGradId?: string): Record<string, string | number>`; import `Gradient`, `ShapeBase` from `./types.js`; both functions may throw `"not implemented"` at this stage

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type definitions and canonicalization — MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: All user story work depends on these two tasks.

- [x] T002 [P] Extend `src/types.ts`: add `ColorStop` interface `{ offset: number; color: string; opacity?: number }`; add `LinearGradient` interface `{ type: "linear"; x1?: number; y1?: number; x2?: number; y2?: number; stops: ColorStop[] }`; add `RadialGradient` interface `{ type: "radial"; cx?: number; cy?: number; r?: number; stops: ColorStop[] }`; add `type Gradient = LinearGradient | RadialGradient`; add `StylingFields` interface `{ fill?: string; stroke?: string; strokeWidth?: number; opacity?: number; fillGradient?: Gradient; strokeGradient?: Gradient }`; add `BezierFields` interface `{ bezier?: number; bezierDirection?: "out" | "in" }`; update `ShapeBase` to `extends VariationFields, StylingFields, BezierFields`

- [x] T003 [P] Extend `src/canonicalize.ts`: in `canonicalizeShape()`, add 8 conditional spreads to the `base` object (after the existing `clamp` spread): `fill`, `stroke`, `strokeWidth`, `opacity`, `fillGradient`, `strokeGradient`, `bezier`, `bezierDirection` — using the same `...(shape.X !== undefined ? { X: shape.X } : {})` pattern already present for `rotation`, `distort`, `sizeVariance`, `clamp`

**Checkpoint**: Types and canonicalization complete — user story phases can now proceed.

---

## Phase 3: User Story 1 — Opacity (Priority: P1) 🎯 MVP

**Goal**: Any shape can carry `opacity?: 0–1`; when present the SVG element gets an `opacity` attribute.

**Independent Test**: `generate({ seed:1, canvas:{width:100,height:100}, shapes:[{ type:"circle", x:50, y:50, size:40, opacity:0.5 }] })` returns SVG containing `opacity="0.5"` on the circle element; shape without opacity field produces identical output to Stage 2.

- [x] T004 [P] [US1] Add opacity validation to `src/validate.ts`: in `validateShape()`, after the existing `clamp` validation block, add a check — if `shape.opacity !== undefined`: call `checkFinite(shape.opacity, \`${prefix}.opacity\`)`; if `shape.opacity < 0 || shape.opacity > 1` throw `"opacity must be a number between 0 and 1"`

- [x] T005 [P] [US1] Add opacity attr injection to `src/generate.ts`: after the `if/else` rendering block (lines ~35–53) and before the `return` statement, add a styling injection block — `if (shape.opacity !== undefined) attrs.opacity = fmt(shape.opacity);` (import `fmt` from `./fmt.js` if not already imported; `fmt` already imported if stage 2 is the baseline)

**Checkpoint**: Opacity fully functional. Shapes with `opacity` get the attr; shapes without are unchanged.

---

## Phase 4: User Story 2 — Color (Priority: P2)

**Goal**: Any shape can carry `fill`, `stroke`, `strokeWidth`; these become SVG presentation attributes on the element.

**Independent Test**: `generate({ seed:1, canvas:{width:100,height:100}, shapes:[{ type:"square", x:50, y:50, size:40, fill:"#ff0000", stroke:"blue", strokeWidth:2 }] })` returns SVG with `fill="#ff0000" stroke="blue" stroke-width="2"` on the rect/path element; `strokeWidth` without `stroke` produces no `stroke-width` attr; `fill` absent produces no `fill` attr.

- [x] T006 [P] [US2] Add strokeWidth validation to `src/validate.ts`: in `validateShape()`, after the opacity check (T004), add — if `shape.strokeWidth !== undefined`: if `typeof shape.strokeWidth !== "number" || !Number.isFinite(shape.strokeWidth) || shape.strokeWidth <= 0` throw `"strokeWidth must be a positive finite number"`

- [x] T007 [P] [US2] Add fill/stroke/stroke-width attr injection to `src/generate.ts`: extend the styling block (after the opacity line from T005) — add `if (shape.fill !== undefined) attrs.fill = shape.fill;`; add `if (shape.stroke !== undefined) attrs.stroke = shape.stroke;`; add `if (shape.stroke !== undefined && shape.strokeWidth !== undefined) attrs["stroke-width"] = fmt(shape.strokeWidth);`; note: gradient overrides (added in T011) will override these attrs when `fillGradient`/`strokeGradient` are present — this base behavior is intentional

**Checkpoint**: Color fully functional. Fill, stroke, strokeWidth work. Shapes without color fields unchanged.

---

## Phase 5: User Story 3 — Gradients (Priority: P3)

**Goal**: Any shape can carry `fillGradient` and/or `strokeGradient`; gradients are emitted in `<defs>` and referenced via `url(#...)` on the shape element.

**Independent Test**: `generate({ seed:42, canvas:{width:200,height:200}, shapes:[{ type:"circle", x:100, y:100, size:60, fillGradient:{ type:"linear", stops:[{offset:0,color:"red"},{offset:1,color:"blue"}] } }] })` returns SVG containing a `<defs>` block with `<linearGradient id="grad-s42-circle-0-fill" ...>` and the circle element has `fill="url(#grad-s42-circle-0-fill)"`.

- [x] T008 [P] [US3] Implement `src/styling.ts`: replace stubs with full implementations — `buildGradientDef(gradientId, gradient)` builds the complete `<linearGradient>` or `<radialGradient>` SVG element string with stops; linear defaults: x1=0, y1=0, x2=1, y2=0; radial defaults: cx=0.5, cy=0.5, r=0.5; always emit `gradientUnits="objectBoundingBox"`; each stop: `<stop offset="{fmt(offset)}" stop-color="{color}"` plus optional `stop-opacity="{fmt(opacity)}"` if present; `buildStylingAttrs(shape, fillGradId?, strokeGradId?)` returns attrs Record — if `fillGradId` provided set `fill: \`url(#${fillGradId})\``; else if `shape.fill !== undefined` set `fill: shape.fill`; if `strokeGradId` provided set `stroke: \`url(#${strokeGradId})\``; else if `shape.stroke !== undefined` set `stroke: shape.stroke`; if (`shape.stroke !== undefined` OR `strokeGradId` provided) AND `shape.strokeWidth !== undefined` set `"stroke-width": fmt(shape.strokeWidth)`; if `shape.opacity !== undefined` set `opacity: fmt(shape.opacity)` — Note: this centralizes ALL styling attr logic; integrate with T005/T007 output in T011

- [x] T009 [P] [US3] Add gradient validation to `src/validate.ts`: add private helper `validateGradient(grad: unknown, fieldName: string): void` — check `grad.type` is `"linear"` or `"radial"` (throw `"gradient type must be 'linear' or 'radial'"`); check `grad.stops` is a non-empty array (throw `"${fieldName}.stops must have at least one stop"`); for each stop: check `offset` is finite number in `[0,1]` (throw `"gradient stop offset must be a number between 0 and 1"`); check `color` is string (throw `"gradient stop color must be a string"`); check `opacity` (if present) is finite number in `[0,1]` (throw `"gradient stop opacity must be a number between 0 and 1"`); for linear: check `x1/y1/x2/y2` (if present) are finite (throw `"gradient coordinate must be a finite number"`); for radial: check `cx/cy` (if present) are finite; check `r` (if present) is finite and > 0 (throw `"gradient r must be a positive finite number"`); in `validateShape()` after the `bezierDirection` check (T012) add: `if (shape.fillGradient !== undefined) validateGradient(shape.fillGradient, "fillGradient");` and `if (shape.strokeGradient !== undefined) validateGradient(shape.strokeGradient, "strokeGradient");`

- [x] T010 [P] [US3] Extend `src/svg.ts`: update `assembleSvg(canvas: Canvas, elements: ShapeElement[], defs?: string[]): string` — add optional third parameter; when `defs && defs.length > 0` emit `  <defs>` + each def indented with 4 spaces + `  </defs>` as the first block inside `<svg>`, before shape elements; when `defs` is empty or absent output is byte-for-byte identical to Stage 2

- [x] T011 [US3] Add gradient support to `src/generate.ts` (depends on T008, T010): at top of `generate()` function add `const defs: string[] = [];`; replace the existing per-shape styling injection block (from T005/T007) with calls to `buildGradientDef` and `buildStylingAttrs` from `./styling.js` — for each shape: if `shape.fillGradient`: `const fillGradId = \`grad-${id}-fill\`; defs.push(buildGradientDef(fillGradId, shape.fillGradient));` else `fillGradId = undefined`; similarly for `strokeGradient`; then `Object.assign(attrs, buildStylingAttrs(workShape, fillGradId, strokeGradId));`; update final return to `assembleSvg(canonical.canvas, elements, defs)`; add imports for `buildGradientDef`, `buildStylingAttrs` from `./styling.js`; add `shapeId` import (already present) — `id` is `shapeId(canonical.seed, shape.type, i)` which must be computed before gradient ID building

**Checkpoint**: Gradients fully functional. `<defs>` block present when shapes have gradient fields. Shapes without gradients produce identical Stage 2 output.

---

## Phase 6: User Story 4 — Bezier Corner Rounding (Priority: P4)

**Goal**: Any shape can carry `bezier?: 0–1`; when present the shape is rendered as a `<path>` with quadratic bezier (`Q`) curves replacing each sharp corner.

**Independent Test**: `generate({ seed:1, canvas:{width:200,height:200}, shapes:[{ type:"square", x:100, y:100, size:80, bezier:0.4 }] })` returns SVG with a `<path>` element whose `d` attribute contains `Q` commands; `bezier: 0` produces identical output to Stage 2 for that shape; `bezierDirection:"in"` produces a concave path (control points reflected).

- [x] T012 [P] [US4] Add bezier/bezierDirection validation to `src/validate.ts`: in `validateShape()` after the `strokeWidth` check (T006), add — if `shape.bezier !== undefined`: `checkFinite(shape.bezier, \`${prefix}.bezier\`)`; if `shape.bezier < 0 || shape.bezier > 1` throw `"bezier must be a number between 0 and 1"`; add — if `shape.bezierDirection !== undefined`: if `shape.bezierDirection !== "out" && shape.bezierDirection !== "in"` throw `'bezierDirection must be "out" or "in"'`

- [x] T013 [P] [US4] Extend `src/variation.ts`: update `verticesToPath(vertices, bezier?, direction?)` signature and implementation — when `bezier` is `0`, `undefined`, or `vertices.length < 2` return the existing straight-line `M ... L ... Z` path unchanged; when `bezier > 0`: compute `t = bezier * 0.45`; for each vertex `v[i]` (N = vertices.length) with `prev = vertices[(i-1+N)%N]` and `next = vertices[(i+1)%N]`: compute `P1 = [v[0]+t*(prev[0]-v[0]), v[1]+t*(prev[1]-v[1])]`; compute `P2 = [v[0]+t*(next[0]-v[0]), v[1]+t*(next[1]-v[1])]`; for direction `"out"` (default): `ctrl = v`; for direction `"in"`: `ctrl = [P1[0]+P2[0]-v[0], P1[1]+P2[1]-v[1]]`; assemble path: start with `M ${fmt(P1[0])} ${fmt(P1[1])}` for i=0; for each i add `Q ${fmt(ctrl[0])} ${fmt(ctrl[1])} ${fmt(P2[0])} ${fmt(P2[1])}`; for i < N-1 add `L ${fmt(P1_next[0])} ${fmt(P1_next[1])}` where P1_next is P1 of vertex i+1; close with `Z`; also update `renderVaried()` signature to accept `bezier?: number, bezierDirection?: "out" | "in"` and pass them through to the `verticesToPath(verts, bezier, bezierDirection)` call inside

- [x] T014 [US4] Extend `src/generate.ts` bezier integration (depends on T013): add `const bz = shape.bezier ?? 0;` after `const dt` line; update the PRNG condition to keep `varPrng` for sizeVariance/distort only (unchanged); update the path pipeline condition from `if (dt > 0 && varPrng)` to `if (dt > 0 || bz > 0)`; inside the updated condition: `if (dt > 0 && varPrng)` → call `renderVaried(workShape, varPrng, canonical.seed, i, bz, workShape.bezierDirection ?? "out")`; `else` (bezier only, no distort) → call `extractVertices(workShape, canonical.seed, i)` then `verticesToPath(verts, bz, workShape.bezierDirection ?? "out")` to build `{ tag: "path" as const, attrs: { d } }`; add `extractVertices` and `verticesToPath` to the import from `./variation.js`

**Checkpoint**: Bezier fully functional. Shapes with `bezier > 0` render as `<path>` with Q curves. Shapes without bezier field produce Stage 2-identical output.

---

## Phase 7: Polish & Validation

**Purpose**: Verify all 339+ existing tests still pass and strict TypeScript lints clean.

- [x] T015 Run `npm test` from repo root; ensure all existing tests pass (339 baseline) and no regressions; if any test fails, diagnose and fix the regression before proceeding

- [x] T016 [P] Run `npm run lint` from repo root; fix any TypeScript strict-mode errors introduced by the new types (e.g., `unknown` property access, optional chain use, `Record` type mismatches); pay particular attention to `src/styling.ts` and `src/generate.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 Opacity)**: Depends on Phase 2
- **Phase 4 (US2 Color)**: Depends on Phase 3 (shares generate.ts styling block)
- **Phase 5 (US3 Gradients)**: T008/T009/T010 depend on Phase 2; T011 depends on T008 + T010
- **Phase 6 (US4 Bezier)**: T012/T013 depend on Phase 2; T014 depends on T013
- **Phase 7 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (Opacity)**: Must precede US2 — both write to generate.ts styling block; sequential to avoid conflicts
- **US2 (Color)**: Must precede US3 — T011 replaces T005+T007's styling block with `buildStylingAttrs`
- **US3 (Gradients)**: Can start T008/T009/T010 in parallel after Phase 2; T011 needs T008 + T010
- **US4 (Bezier)**: Independent of US1/US2/US3 after Phase 2; T012/T013 can run in parallel

### Within-Phase Parallel Opportunities

| Phase | Parallel Group | Tasks |
|---|---|---|
| Phase 2 | Types + Canonicalize | T002, T003 |
| Phase 3 | Validate + Generate | T004, T005 |
| Phase 4 | Validate + Generate | T006, T007 |
| Phase 5 | Styling + Validate + SVG | T008, T009, T010 |
| Phase 6 | Validate + Variation | T012, T013 |

---

## Parallel Execution Examples

### Phase 2 (Foundational)

```
Parallel:
  T002 — Extend src/types.ts (new interfaces)
  T003 — Extend src/canonicalize.ts (whitelist 8 new fields)
```

### Phase 5 (Gradients — 3-way parallel start)

```
Parallel:
  T008 — Implement src/styling.ts (buildGradientDef + buildStylingAttrs)
  T009 — Add validateGradient to src/validate.ts
  T010 — Extend assembleSvg in src/svg.ts

Sequential (after T008 + T010 complete):
  T011 — Add gradient support to src/generate.ts
```

### Phase 6 (Bezier — 2-way parallel start)

```
Parallel:
  T012 — Add bezier validation to src/validate.ts
  T013 — Extend verticesToPath in src/variation.ts

Sequential (after T013):
  T014 — Extend path condition in src/generate.ts
```

---

## Implementation Strategy

### MVP (US1 Only — Opacity)

1. Phase 1 (T001) + Phase 2 (T002, T003) — setup and foundation
2. Phase 3 (T004, T005) — opacity
3. **STOP**: run `npm test`, verify all 339 tests still pass

### Incremental Delivery

1. Foundation → US1 (Opacity) → test → demo
2. + US2 (Color) → test → demo
3. + US3 (Gradients) → test → demo
4. + US4 (Bezier) → test → demo
5. Polish → final test + lint

### Notes

- T011 (generate.ts US3) replaces the incremental T005+T007 styling block with a clean `buildStylingAttrs` call — this is intentional (styling.ts centralizes all attr logic)
- `fmt()` is already imported in `generate.ts`; ensure it's also imported in `styling.ts`
- `ShapeBase` type in `styling.ts` must use the updated Stage 3 type (includes `StylingFields`)
- All `verticesToPath` callers (variation.ts `renderVaried`) must pass the new `bezier`/`direction` params after T013
