# Research: SVG Shape Engine v0.1

**Branch**: `001-svg-shape-engine` | **Date**: 2026-02-28

## R1: Circle-as-Path Representation

**Decision**: Use two SVG arc commands (`A`) to render a circle in
`"path"` output mode. The path splits the circle at the leftmost and
rightmost points:
`M {x+r} {y} A {r} {r} 0 1 0 {x-r} {y} A {r} {r} 0 1 0 {x+r} {y} Z`

**Rationale**: SVG arc commands produce a geometrically exact circle
with no approximation error. A single 360° arc is degenerate in SVG
(start === end collapses to nothing), so two 180° arcs are used — a
well-known and widely understood idiom. This matches the spec
clarification: "Path mode uses two-arc circle (no Bézier approximation)."
In `"semantic"` mode the native `<circle>` element is used directly.

**Alternatives considered**:
- Four cubic Bézier curves (kappa ≈ 0.5522): Approximate only (~0.027%
  radial error). Rejected in favour of exact arc representation.
- Single 360° arc: Degenerate in SVG — produces no output.
- Eight or more Bézier segments: Higher accuracy than four Béziers but
  still approximate; larger output; unnecessary given exact arc option.

## R2: Deterministic Numeric Formatting

**Decision**: Round all coordinate values to 6 decimal places. Strip
trailing zeros after the decimal point. Use standard `Number.toFixed(6)`
then trim.

**Rationale**: JavaScript floating-point arithmetic can produce
platform-dependent representations (e.g., `1.0000000000000002`). Fixed
precision ensures byte-for-byte determinism. Six decimal places provide
sub-micrometer precision at any practical SVG viewport size.

**Alternatives considered**:
- No rounding: Risks platform-dependent float formatting.
- Fewer decimals (2-3): Could cause visible rounding at large scales.
- `toPrecision`: Less predictable output length.

## R3: SVG ID Validity

**Decision**: IDs follow format `s<seed>-<type>-<index>` with negative
seeds encoded as `sn<abs(seed)>`.

**Rationale**: XML `Name` production requires IDs to start with a letter
or underscore, followed by letters, digits, hyphens, underscores, or
periods. The `s` prefix guarantees a valid start character. Hyphens are
used as separators (valid in XML names). Negative sign (`-` at start)
would be invalid as it doesn't match `NameStartChar`, so we substitute
`n` for "negative".

**Alternatives considered**:
- Hash-based IDs (e.g., `sha256(seed+type+index)`): Opaque, harder to
  debug, doesn't encode type readably.
- Underscore prefix (`_42_square_0`): Valid but less readable.
- UUID-style: Not deterministic without a seed-based PRNG, overkill.

## R4: Testing Framework

**Decision**: Vitest.

**Rationale**: Native TypeScript support, fast execution, Jest-compatible
API, zero-config for TypeScript projects. Widely adopted in the
TypeScript ecosystem.

**Alternatives considered**:
- Jest: Requires ts-jest or SWC transformer configuration.
- Node test runner: Minimal ecosystem tooling, no snapshot support.
- Mocha/Chai: More configuration, less TypeScript-native.

## R5: Triangle Centroid Positioning

**Decision**: Use the geometric centroid (intersection of medians) as
the center point for equilateral triangles. The centroid is located at
1/3 of the height from the base.

**Rationale**: The centroid is the natural "center" for rotation and
positioning. It ensures the triangle is balanced around `(x, y)`.
For an equilateral triangle with side length `s`:
- Height `h = s * sqrt(3) / 2`
- Top vertex: `(x, y - 2h/3)`
- Bottom-left: `(x - s/2, y + h/3)`
- Bottom-right: `(x + s/2, y + h/3)`

**Alternatives considered**:
- Incenter: Coincides with centroid for equilateral triangles, so no
  difference.
- Bounding-box center: Would offset the triangle visually since
  equilateral triangles are not vertically symmetric about their
  bounding-box center. Rejected for misaligning designer intent.

## No Unresolved Items

All Technical Context fields were determined without ambiguity. No
NEEDS CLARIFICATION items remain.
