# Research: Advanced Shapes v0.2

**Branch**: `002-advanced-shapes` | **Date**: 2026-03-01

## R1: Trapezoid Center Convention

**Decision**: The center `(x, y)` is the bounding-box midpoint — the geometric midpoint between the top edge and bottom edge (vertically) and between the two parallel sides (horizontally). Vertices:

```
TL = (x − topWidth/2,    y − height/2)
TR = (x + topWidth/2,    y − height/2)
BR = (x + bottomWidth/2, y + height/2)
BL = (x − bottomWidth/2, y + height/2)
```

**Rationale**: The bounding-box center is the most predictable reference point for designers specifying position. The mathematical centroid of a trapezoid varies non-linearly with the ratio of the parallel sides — counterintuitive for positioning. Using the bounding-box midpoint is consistent with the Stage 1 convention: rectangle's `(x, y)` is also its bounding-box center.

**Alternatives considered**:
- **Geometric centroid** (`h(2b+a) / 3(a+b)` from base): Mathematically precise but non-intuitive for designers. Rejected for inconsistency with Stage 1 positioning model.
- **Bottom-edge anchor**: Common in CSS layout but inconsistent with center-based model. Rejected.

---

## R2: Polygon Parameterization

**Decision**: Regular n-gon parameterized by `sides: number` (integer ≥ 3) and `size` (circumradius — center to vertex). Vertex `k` is at:

```
angle_k = 2π·k/n − π/2
vx_k    = x + size·cos(angle_k)
vy_k    = y + size·sin(angle_k)
```

The `−π/2` offset places the first vertex at the top (12 o'clock position), consistent with octagon.

**Rationale**: Side-count parameterization is what designers mean by "a pentagon" or "a hexagon." It's deterministic, requires no user geometry, and is consistent with how octagon is defined. Explicit vertex lists would be a different shape type (`"custom"` or `"polyline"`) — out of scope for this stage.

**Alternatives considered**:
- **Explicit vertex list**: Allows arbitrary polygons but breaks the procedural/deterministic model; requires different validation. Out of scope per roadmap.
- **Inradius instead of circumradius**: Less common convention for regular polygons; circumradius is the standard "radius" designers picture.

---

## R3: Octagon as Distinct Domain Type

**Decision**: `"octagon"` is a first-class shape type with `size` (circumradius) as its only sizing parameter. Internally it uses the same regular-polygon vertex formula as `"polygon"` with `n=8`.

**Rationale**: The Domain Integrity principle mandates that shapes distinct in the design domain remain distinct in the model. A designer who asks for an octagon thinks "octagon," not "8-sided polygon." Collapsing octagon into polygon would leak implementation details into the domain model. The octagon type provides a cleaner API surface for a very common use case.

**Alternatives considered**:
- **Octagon as alias for `polygon{sides:8}`**: Simpler internally but violates Domain Integrity. Rejected.
- **No octagon type, require polygon**: Acceptable technically but a worse DX for a common shape. Rejected.

---

## R4: Oval Path Representation

**Decision**: In path mode, oval uses a two-arc path split at the left and right extremes (same idiom as Stage 1 circle):

```
M (x+rx) y
A rx ry 0 1 0 (x−rx) y
A rx ry 0 1 0 (x+rx) y
Z
```

Where `rx = width/2`, `ry = height/2`.

**Rationale**: SVG arc commands produce an exact ellipse. The two-arc idiom avoids the degenerate single-arc case (360° arc collapses to nothing in SVG). This is a direct generalization of the Stage 1 circle path representation — same structure, non-equal radii.

**Alternatives considered**:
- **Four Bézier curves**: Approximate only (the kappa approximation introduces ~0.027% error). Rejected for consistency with Stage 1's exact arc approach.
- **Single 360° arc**: Degenerate in SVG. Rejected.

---

## R5: Blob — PRNG Algorithm

**Decision**: mulberry32, a well-known 32-bit hash-based PRNG. The seed for a blob at index `i` is derived as:

```typescript
function blobSeed(generatorSeed: number, shapeIndex: number): number {
  return (Math.imul(generatorSeed | 0, 1000003) + shapeIndex * 2654435761) | 0;
}
```

Then mulberry32 advances the state:

```typescript
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let z = Math.imul(s ^ (s >>> 15), s | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}
```

**Rationale**: mulberry32 is fast, zero-dependency, pure TypeScript, widely referenced in game dev and procedural generation, and passes basic statistical tests. It produces consistent output across all JS engines (uses only integer arithmetic). ~10 lines of code.

**Alternatives considered**:
- **sfc32**: Also valid; slightly more complex state (4 words vs 1). Overkill for blob point generation.
- **xorshift32**: Simpler but lower quality; potential clustering in low bits.
- **seeding from `Math.random()`**: Breaks determinism. Rejected.
- **External PRNG library**: Adds a runtime dependency. Rejected per zero-dependency constraint.

---

## R6: Blob — Control Point Layout

**Decision**: `n` control points placed at evenly-spaced angles with seed-based radial variation:

```
angle_k  = 2π·k/n           (k = 0..n−1)
radius_k = size · (0.6 + 0.4 · prng())
point_k  = (x + radius_k·cos(angle_k), y + radius_k·sin(angle_k))
```

Default `n = 6`. Minimum `n = 3`.

**Rationale**: Even angular spacing prevents degenerate configurations (e.g., all points on one side). Radial variation in `[0.6·size, 1.0·size]` produces an organic but bounded outline — always within one size-radius of center and never collapsing to nothing. The `0.6` floor prevents overly concave or crossing outlines.

**Alternatives considered**:
- **Random angular spacing**: Can produce crossing outlines and non-convex shapes in unexpected ways. Rejected for predictability.
- **Uniform radius (no variation)**: Would produce a regular polygon, not a blob. Rejected.
- **Larger variation range (e.g., 0–1.5)**: Can produce self-intersecting outlines. Rejected.

---

## R7: Blob — Catmull-Rom to Cubic Bézier Conversion

**Decision**: Convert the closed Catmull-Rom spline to cubic Bézier segments for SVG path output. For segment P[i] → P[i+1] in a closed loop (indices modulo n):

```
CP1 = P[i]   + (P[i+1] − P[i−1]) / 6
CP2 = P[i+1] − (P[i+2] − P[i]  ) / 6
```

SVG path: `M P[0] C CP1_0 CP2_0 P[1] C CP1_1 CP2_1 P[2] ... Z`

**Rationale**: Catmull-Rom splines pass through each control point and produce smooth, natural-looking curves — ideal for organic shapes. The Bézier conversion formula is a well-known closed-form relationship (derived from the Catmull-Rom tangent condition). All arithmetic is deterministic floating-point using `fmt()` for consistent serialization.

**Alternatives considered**:
- **Quadratic Bézier approximation**: Lower quality; less smooth. Rejected.
- **Linear segments (polyline)**: Simple but produces a jagged, non-organic outline. Rejected.
- **Cubic spline (natural)**: Requires solving a tridiagonal system — more complex code with no user-visible quality benefit over Catmull-Rom. Rejected.

---

## R8: Semantic vs Path Mode for Blob

**Decision**: Blob always emits `<path>` regardless of `outputMode`. It does not have a separate "semantic" representation.

**Rationale**: There is no native SVG element for a freeform blob. The `<path>` element is the natural and only representation. Treating `"semantic"` mode identically to `"path"` mode for blob is the simplest, clearest behavior — no conditional logic, no surprise output differences.

**Alternatives considered**:
- **`<path>` in path mode, error/undefined in semantic mode**: Confusing — blob is a valid shape in both modes. Rejected.
- **Introduce a new SVG element category**: Out of scope.

---

## No Unresolved Items

All Technical Context fields were determined. The one open question from the roadmap (Polygon parameterization) is resolved as `sides: number`. No NEEDS CLARIFICATION items remain.
