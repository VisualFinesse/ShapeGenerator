# ShapeGenerator Memory

## Project Overview

Pure TypeScript SVG shape engine. Single `generate()` entry point. Zero runtime dependencies. Deterministic output.

**Repo**: `C:/Users/foster/Documents/devProjects/2026/ShapeGenerator`
**Tech**: TypeScript 5.4 strict, Vitest 1.x
**Commands**: `npm test`, `npm run lint` (tsc --noEmit)

## Stage Status

| Stage                             | Branch                 | Status  |
| --------------------------------- | ---------------------- | ------- |
| 1 — Primitives                    | `001-foster-ts-shapes` | ✅ Done |
| 1.5 — Advanced Shapes             | `002-advanced-shapes`  | ✅ Done |
| 2 — Variation                     | `003-variation`        | ✅ Done |
| 3 — Masks                         | `004-shape-masks`      | ✅ Done |
| 3.5–3.7 — Opacity/Color/Gradients | `005–007`              | ✅ Done |
| 4 — Bézier + Shape Merger         | `008–009`              | ✅ Done |

## Source Structure

```
src/
  index.ts          # exports generate()
  types.ts          # all public + internal TypeScript types
  generate.ts       # orchestrate: canonicalize → validate → render → assemble
  canonicalize.ts   # drop unknown fields per shape type whitelist
  validate.ts       # reject NaN/Infinity/missing/out-of-range
  id.ts             # shapeId(seed, type, index) → "s<seed>-<type>-<index>"
  fmt.ts            # fmt(n) → 6dp trimmed float string
  svg.ts            # assembleSvg(canvas, elements[]) → SVG string
  prng.ts           # createPrng(seed), blobSeed(genSeed, index) [Stage 1.5]
  shapes/
    square.ts / rectangle.ts / circle.ts / triangle.ts
    trapezoid.ts / octagon.ts / polygon.ts / oval.ts / blob.ts

tests/
  generate.test.ts / canonicalize.test.ts / validate.test.ts
  invariants.test.ts / id.test.ts
  shapes/ [one per shape]
```

## Key Patterns

- **ShapeElement**: `{ tag, attrs, id, rotation?, cx, cy }` — svg.ts serializes it generically
- **Renderer signature**: `renderX(shape, mode) → { tag, attrs }` except blob: `renderBlob(shape, mode, seed, index)`
- **Blob** always returns `tag: "path"` regardless of outputMode
- **Oval** semantic → `<ellipse>`, path → two-arc `<path>` (same idiom as circle)
- **Polygon/Octagon**: first vertex at top (angle = −π/2)
- **Trapezoid center**: bounding-box midpoint (not geometric centroid)
- **PRNG**: mulberry32, seeded via `blobSeed(generatorSeed, shapeIndex)`

## Shape Type Summary (Stage 1 + 1.5)

| Type      | Key Params                      | Semantic        | Path                |
| --------- | ------------------------------- | --------------- | ------------------- |
| square    | size                            | `<rect>`        | `<path>`            |
| rectangle | width, height                   | `<rect>`        | `<path>`            |
| circle    | size (diameter)                 | `<circle>`      | `<path>` (two arcs) |
| triangle  | size                            | `<polygon>`     | `<path>`            |
| trapezoid | topWidth, bottomWidth, height   | `<polygon>`     | `<path>`            |
| octagon   | size (circumradius)             | `<polygon>`     | `<path>`            |
| polygon   | sides (≥3), size (circumradius) | `<polygon>`     | `<path>`            |
| oval      | width, height (full extents)    | `<ellipse>`     | `<path>` (two arcs) |
| blob      | size, points? (default 6)       | `<path>` always | `<path>` always     |

## speckit Workflow Notes

- `/speckit.plan` creates: spec.md, plan.md, research.md, data-model.md, contracts/api.md, quickstart.md
- `/speckit.tasks` creates: tasks.md (after plan)
- `/speckit.implement` executes tasks.md (after tasks)
- Setup script: `.specify/scripts/powershell/setup-plan.ps1 -Json`
- Agent context update: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`

## Test Count History

| After Stage | Tests |
| ----------- | ----- |
| Stage 1     | 112   |
| Stage 1.5   | 229   |
