# Quickstart: Advanced Shapes v0.2

**Branch**: `002-advanced-shapes`

This guide shows how to use the five new shape types added in Stage 1.5. All examples use the unchanged `generate()` entry point.

---

## New Shape Types at a Glance

| Type       | Key Parameters | Semantic SVG | Path SVG |
|------------|---------------|--------------|----------|
| trapezoid  | topWidth, bottomWidth, height | `<polygon>` (4 pts) | `<path>` |
| octagon    | size (circumradius)           | `<polygon>` (8 pts) | `<path>` |
| polygon    | sides, size (circumradius)    | `<polygon>` (n pts) | `<path>` |
| oval       | width, height                 | `<ellipse>`         | `<path>` |
| blob       | size, points? (default 6)     | `<path>` (always)   | `<path>` |

---

## Trapezoid

A quadrilateral with two parallel horizontal sides. Center `(x, y)` is the bounding-box midpoint.

```typescript
import { generate } from "./src/index.js";

const result = generate({
  seed: 1,
  canvas: { width: 300, height: 200 },
  shapes: [
    {
      type: "trapezoid",
      x: 150,
      y: 100,
      topWidth: 60,    // narrower top edge
      bottomWidth: 120, // wider bottom edge
      height: 80,
    }
  ]
});
// → <polygon points="120,60 180,60 210,140 90,140" />
```

---

## Octagon

A regular 8-sided polygon. `size` is the circumradius (center to vertex). First vertex is at the top.

```typescript
const result = generate({
  seed: 1,
  canvas: { width: 300, height: 200 },
  shapes: [
    {
      type: "octagon",
      x: 150,
      y: 100,
      size: 60,   // center-to-vertex distance
    }
  ]
});
// → <polygon points="150,40 192.43,...  ..." />
```

---

## Polygon (n-sided)

A regular polygon with `sides` vertices. `size` is the circumradius. `sides` must be an integer ≥ 3.

```typescript
// Pentagon
const result = generate({
  seed: 1,
  canvas: { width: 300, height: 200 },
  shapes: [
    { type: "polygon", x: 150, y: 100, sides: 5, size: 60 }
  ]
});

// Hexagon with rotation
const result2 = generate({
  seed: 1,
  canvas: { width: 300, height: 200 },
  shapes: [
    { type: "polygon", x: 150, y: 100, sides: 6, size: 60, rotation: 30 }
  ]
});
```

---

## Oval

An ellipse. `width` and `height` are the full extents (not semi-axes). Semi-axes are `width/2` and `height/2`.

```typescript
const result = generate({
  seed: 1,
  canvas: { width: 300, height: 200 },
  shapes: [
    {
      type: "oval",
      x: 150,
      y: 100,
      width: 180,   // full width  (rx = 90)
      height: 80,   // full height (ry = 40)
    }
  ]
});
// semantic → <ellipse cx="150" cy="100" rx="90" ry="40" />
// path     → <path d="M 240 100 A 90 40 0 1 0 60 100 A 90 40 0 1 0 240 100 Z" />
```

---

## Freeform Blob

A seed-based organic shape. `size` controls the bounding radius; `points` (default 6) controls the number of control points. Always emits `<path>`.

```typescript
// Default blob (6 control points)
const result = generate({
  seed: 42,
  canvas: { width: 300, height: 300 },
  shapes: [
    { type: "blob", x: 150, y: 150, size: 80 }
  ]
});

// Custom control point count
const result2 = generate({
  seed: 42,
  canvas: { width: 300, height: 300 },
  shapes: [
    { type: "blob", x: 150, y: 150, size: 80, points: 10 }
  ]
});
```

**Determinism**: Changing `seed` produces a different blob shape. Changing `size` scales it. `points` changes the smoothness level. All are fully reproducible.

```typescript
// These always produce the same path string:
generate({ seed: 7, canvas: { width: 200, height: 200 }, shapes: [{ type: "blob", x: 100, y: 100, size: 50 }] }).svg
=== generate({ seed: 7, canvas: { width: 200, height: 200 }, shapes: [{ type: "blob", x: 100, y: 100, size: 50 }] }).svg
// → true
```

---

## Mixed Example

All five new types in a single call:

```typescript
const result = generate({
  seed: 99,
  canvas: { width: 500, height: 400 },
  shapes: [
    { type: "trapezoid", x: 80,  y: 80,  topWidth: 50, bottomWidth: 100, height: 60 },
    { type: "octagon",   x: 200, y: 80,  size: 50 },
    { type: "polygon",   x: 320, y: 80,  sides: 6, size: 50 },
    { type: "oval",      x: 80,  y: 220, width: 100, height: 60 },
    { type: "blob",      x: 280, y: 230, size: 70, points: 8 },
  ]
});

console.log(result.metadata.shapeCount); // 5
```

---

## Path Mode

All new shapes support `outputMode: "path"`:

```typescript
const result = generate({
  seed: 1,
  canvas: { width: 300, height: 200 },
  outputMode: "path",
  shapes: [
    { type: "trapezoid", x: 100, y: 100, topWidth: 60, bottomWidth: 100, height: 60 },
    { type: "oval",      x: 200, y: 100, width: 80, height: 50 },
  ]
});
// All elements are <path d="..." />
```

---

## Validation Errors

```typescript
// Error: sides too low
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "polygon", x: 50, y: 50, sides: 2, size: 30 }
]});
// → Error: shapes[0].sides: must be an integer >= 3

// Error: blob points too low
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "blob", x: 50, y: 50, size: 30, points: 2 }
]});
// → Error: shapes[0].points: must be an integer >= 3

// Error: missing required field
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "trapezoid", x: 50, y: 50, topWidth: 40, height: 30 }
]});
// → Error: shapes[0].bottomWidth: missing required field
```
