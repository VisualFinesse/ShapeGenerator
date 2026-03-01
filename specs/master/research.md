# Research: Stage 3 — Styling & Bezier

## R1: Styling Field Architecture

**Decision**: Add two new interfaces to `types.ts`: `StylingFields` (fill, stroke, strokeWidth, opacity, fillGradient, strokeGradient) and `BezierFields` (bezier, bezierDirection). `ShapeBase` extends both alongside the existing `VariationFields`.

**Rationale**: Separating styling and bezier into their own interfaces follows the same pattern as `VariationFields` from Stage 2. It keeps concerns distinct, makes the whitelist additions in `canonicalize.ts` explicit per group, and allows future stages to extend one group without touching the others.

**Alternatives considered**:
- Fold all fields directly into `ShapeBase`: Rejected — flattening everything into ShapeBase makes the interface increasingly wide with no semantic grouping.
- Add `fill?: string | Gradient` (union type): Rejected — union types complicate canonicalization and TypeScript discriminated unions require extra narrowing at callsites. Separate `fill` (string) and `fillGradient` (Gradient) are unambiguous.

---

## R2: SVG Styling Attribute Strategy

**Decision**: Apply styling fields as SVG presentation attributes on the shape element (`fill`, `stroke`, `stroke-width`, `opacity`). These are added in `generate.ts` after the shape renderer returns `{ tag, attrs }` — no changes to the 9 existing shape renderers.

**Rationale**: SVG presentation attributes are the lowest-friction way to apply styling. They are overridable by CSS if needed, and they work uniformly across all SVG element types (`<rect>`, `<circle>`, `<path>`, `<polygon>`, `<ellipse>`). Centralizing the styling attr injection in `generate.ts` keeps the shape renderers pure geometry concerns.

**fill/stroke default behavior**: When `fill` is absent, no `fill` attr is emitted and the SVG default (black) applies. When `stroke` is absent, no `stroke` attr is emitted and the SVG default (none) applies. This is correct behavior — the library does not impose its own defaults over SVG's.

**strokeWidth without stroke**: `stroke-width` is only emitted when `stroke` is also present (or `strokeGradient` is present). A `strokeWidth` without any stroke source would be silently ignored by SVG renderers anyway.

**Alternatives considered**:
- Add `fill="black"` as a default: Rejected — breaks backward compatibility (Stage 1/2 SVGs have no fill attr, relying on SVG default). Adds noise to output.
- Apply styling in each shape renderer: Rejected — duplicates logic across 9 files; renders styling inseparable from geometry.

---

## R3: Gradient Architecture

**Decision**: Gradients use `gradientUnits="objectBoundingBox"`. Gradient coordinates (x1/y1/x2/y2 for linear; cx/cy/r for radial) are fractions 0–1 of the shape's bounding box. Gradient defs are accumulated in `generate.ts` and passed to `assembleSvg(canvas, elements, defs)` as an optional third argument.

**Rationale**:
- `objectBoundingBox` is the SVG default and aligns with the library's design principle of keeping shape definitions composable and position-independent. A caller specifying `x1=0, y1=0, x2=1, y2=0` always means "left to right" regardless of where the shape sits on the canvas.
- `userSpaceOnUse` would require callers to know the absolute position and size of each shape in canvas coordinates — coupling gradient spec to layout.
- Passing defs as an array of pre-built strings to `assembleSvg` is the minimal change: `assembleSvg` gains one optional parameter and emits a `<defs>` block when defs is non-empty.

**Gradient ID format**: `grad-{shapeId}-fill` and `grad-{shapeId}-stroke` where `shapeId` = `s{seed}-{type}-{index}`. These IDs are deterministic (same seed + config → same gradient IDs), satisfying the reproducibility invariant.

**Alternatives considered**:
- Inline gradient as data-URI fill: Rejected — not valid SVG; gradients must be defined in `<defs>`.
- Shared gradient library across shapes: Rejected — would require detecting structural equality between gradients; adds complexity without strong design justification. Per-shape gradients are always correct.
- `gradientUnits="userSpaceOnUse"` with shape-derived coordinates: Rejected — ties gradient to absolute position; breaks composability.

---

## R4: Gradient Stop Format

**Decision**: `ColorStop.offset` is a `number` in `[0, 1]` (not percentage string). `ColorStop.color` is a CSS color string (pass-through, no validation of color format). `ColorStop.opacity` is an optional `number` in `[0, 1]` that maps to `stop-opacity`.

**SVG emission**:
```xml
<stop offset="0" stop-color="#ff0000"/>
<stop offset="0.5" stop-color="#0000ff" stop-opacity="0.5"/>
<stop offset="1" stop-color="#00ff00"/>
```
Offsets are emitted as decimal numbers (not percentage strings) — valid per SVG spec.

**Rationale**: Decimal offsets are more precise and simpler to generate. The `fmt()` function handles rounding. Percentage strings would require a separate string-building path.

**Alternatives considered**:
- Accept `offset` as either number or percentage string: Rejected — adds parsing complexity; decimal-only is cleaner.
- Validate CSS color string format: Rejected — CSS color strings have enormous valid format space (hex, rgb, hsl, lab, named, etc.); any partial validation risks rejecting valid inputs. Pass-through is correct.

---

## R5: Linear Gradient Defaults

**Decision**: Linear gradient defaults are `x1=0, y1=0, x2=1, y2=0` (left-to-right horizontal). In SVG terms with `gradientUnits="objectBoundingBox"`, this means the gradient sweeps from the left edge (0%) to the right edge (100%) of the shape's bounding box.

**SVG emission** when all defaults used:
```xml
<linearGradient id="grad-..." x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
```

**Rationale**: These defaults match the SVG spec defaults for `objectBoundingBox` mode (`x1=0%, y1=0%, x2=100%, y2=0%`) when expressed as fractions. Always emitting `gradientUnits` and the coordinate attrs (even at defaults) produces self-documenting, predictable output.

---

## R6: Radial Gradient Defaults

**Decision**: Radial gradient defaults are `cx=0.5, cy=0.5, r=0.5` (center to edge, covering the full shape). No `fx`/`fy` (focal point) in this stage — focal point defaults to center.

**SVG emission**:
```xml
<radialGradient id="grad-..." cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
```

**Rationale**: `cx=0.5, cy=0.5, r=0.5` is the SVG default behavior and produces a centered radial burst covering the bounding box. The focal point (`fx`, `fy`) enables off-center effects but is deferred to a future stage. Adding focal point now would add significant API surface with marginal benefit.

**Alternatives considered**:
- Include `fx`/`fy` in this stage: Deferred — useful for spotlight effects; can be added as optional fields in a future patch.

---

## R7: Bezier Corner Rounding Algorithm

**Decision**: Use quadratic bezier (`Q`) curves at each polygon vertex. Handle length = `bezier × 0.45 × min(incoming_seg_len, outgoing_seg_len)`. Control point for "out" = the original vertex. Control point for "in" = reflection of vertex through midpoint(P1, P2).

**Formula**:
```
t = bezier × 0.45                              // max 45% of min segment length
P1 = lerp(prev_vertex, vertex, 1 - t)          // approaching point on incoming edge
P2 = lerp(vertex, next_vertex, t)              // departing point on outgoing edge

// Convex ("out"):
ctrl = vertex
// Concave ("in"):
mid = lerp(P1, P2, 0.5)
ctrl = 2 * mid - vertex

// Path fragment:
L P1  Q ctrl P2
```

**Path structure for N-vertex closed polygon**:
```
M P1[0]
Q ctrl[0] P2[0]
L P1[1]  Q ctrl[1] P2[1]
...
L P1[N-1]  Q ctrl[N-1] P2[N-1]
Z
```

The path starts at P1[0] (not the vertex) so the first corner is also rounded. Vertex wraparound uses modulo indexing.

**45% cap rationale**: Capping at 45% (not 50%) ensures that even at `bezier=1`, the P1 and P2 handles on adjacent corners don't reach each other — they stop 5% short of touching. This prevents any degenerate path shapes where handles overlap.

**Alternatives considered**:
- Use cubic bezier (C): More control (two control points per vertex), but quadratic bezier with a single vertex-derived control point produces smooth, natural-looking curves with simpler math. Cubic would be needed for C1 continuity at tangent joins, but quadratic Q already provides smooth joins since the tangent into Q[i] and out of Q[i-1] are aligned.
- Apply bezier to arc-path shapes (circle, oval): Not useful — they're already smooth curves. Bezier is accepted but produces no visible change (extractVertices samples 16 points, rounding them produces minimal visible effect). No special case needed — the algorithm runs but the result is nearly identical.
- Independent handle lengths per vertex: Deferred — uniform `bezier × 0.45` per vertex is predictable and sufficient; per-vertex control is future work.
- Use `bezier` as an absolute pixel radius: Rejected — same reasoning as `distort`; fractional scale relative to segment length is size-independent and consistent.

---

## R8: Bezier Pipeline Position

**Decision**: Bezier rounding is the last step in the path pipeline, applied in `verticesToPath(vertices, bezier?, bezierDirection?)`. This function already existed for assembling `M L L Z` paths — its signature is extended with optional bezier params. When `bezier = 0` or absent, it emits the original straight-line path (unchanged behavior).

**Rationale**: Placing bezier at the end (after distort + clamp) ensures the smooth curves are applied to the final vertex positions. This is consistent with the semantic intent: "given these vertices, smooth the corners." The `verticesToPath` extension is minimal — the existing callers pass no bezier params and get the same output.

**generate.ts path condition**: The existing condition `if (dt > 0 && varPrng)` is extended to `if (dt > 0 || bz > 0)`. When `bz > 0` but `dt = 0`, `varPrng` may still be null (if `sizeVariance = 0` too) — so `extractVertices` is called directly without a PRNG.

**Alternatives considered**:
- Separate `applyBezier(vertices, ...)` function: The rounding is applied inside `verticesToPath` rather than as a separate vertex-transform because bezier rounding changes path *commands* (introduces Q), not just vertex *positions*. It's a path-building concern, not a vertex-transform concern.

---

## R9: assembleSvg Defs Extension

**Decision**: `assembleSvg(canvas, elements, defs?: string[])` gains an optional third parameter. When `defs` is non-empty, a `<defs>` block is emitted as the first child of `<svg>`. When empty or absent, output is byte-for-byte identical to Stage 2.

```xml
<svg ...>
  <defs>
    <linearGradient id="grad-s42-circle-0-fill" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#ff0000"/>
      <stop offset="1" stop-color="#0000ff"/>
    </linearGradient>
  </defs>
  <circle id="s42-circle-0" cx="200" cy="200" r="50" fill="url(#grad-s42-circle-0-fill)"/>
</svg>
```

**Rationale**: The `defs` array is built in `generate.ts` as shapes are processed. Each gradient is a fully-formed string. `assembleSvg` doesn't need to understand gradient semantics — it just injects the strings. This keeps `svg.ts` generic and `generate.ts` as the orchestration layer.

---

## R10: Canonicalization and Replay Integrity

**Decision**: All new styling and bezier fields are added to the `base` spread in `canonicalize.ts` using the same conditional spread pattern as existing variation fields. Unknown fields continue to be dropped. Gradient objects are canonicalized atomically (the entire `fillGradient` or `strokeGradient` object is included or excluded as a unit).

**Rationale**: The existing canonicalize pattern handles optional fields correctly. Gradient objects are complex nested structures — canonicalizing individual gradient sub-fields would be over-engineering. The entire gradient is accepted as-is after validation. Replay bundles include the full gradient spec.

**Implications for replay integrity**: Changing a gradient definition changes the canonical input, which changes the SVG output. Generator version is unchanged (no breaking change to existing inputs without gradients). This satisfies the replay integrity invariant.
