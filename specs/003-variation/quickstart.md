# Quickstart: Stage 2 — Variation

## Basic Usage

### Vertex Distortion

Apply organic vertex perturbation to any shape. `distort: 0.1` perturbs each vertex by up to 10% of the shape's characteristic half-size.

```typescript
import { generate } from "./src/generate.js";

const result = generate({
  seed: 42,
  canvas: { width: 400, height: 400 },
  shapes: [
    { type: "square",   x: 100, y: 100, size: 80, distort: 0.1 },
    { type: "triangle", x: 250, y: 100, size: 60, distort: 0.2 },
    { type: "polygon",  x: 175, y: 280, sides: 6, size: 70, distort: 0.15 },
  ],
});

// All three shapes render as <path> elements because distort > 0
console.log(result.svg);
```

### Size Variation

Scale shapes randomly within a ±range. `sizeVariance: 0.25` allows shapes to be 75%–125% of specified size.

```typescript
const result = generate({
  seed: 7,
  canvas: { width: 500, height: 500 },
  shapes: [
    { type: "circle",    x: 100, y: 100, size: 40, sizeVariance: 0.25 },
    { type: "rectangle", x: 250, y: 100, width: 80, height: 50, sizeVariance: 0.3 },
    { type: "oval",      x: 100, y: 300, width: 90, height: 50, sizeVariance: 0.2 },
  ],
});

// Shapes render with their normal tags (circle, rect, ellipse)
// but with PRNG-scaled dimensions
```

### Both Together: Size + Distort

`sizeVariance` is applied first (determines final size), then `distort` perturbs the vertices.

```typescript
const result = generate({
  seed: 13,
  canvas: { width: 400, height: 400 },
  shapes: [
    {
      type: "square",
      x: 200,
      y: 200,
      size: 100,
      sizeVariance: 0.2,  // size will be 80–120 px range
      distort: 0.1,       // vertices then perturbed by up to 10% of that size
    },
  ],
});
// Output: <path ...> (distort > 0 forces path)
```

### Vertex Clamping

Constrain distorted vertices to a bounding box. Useful for keeping shapes inside a grid cell.

```typescript
const result = generate({
  seed: 99,
  canvas: { width: 600, height: 400 },
  shapes: [
    {
      type: "octagon",
      x: 150,
      y: 200,
      size: 80,
      distort: 0.3,                    // heavy distortion
      clamp: { width: 180, height: 180 }, // but never exceeds 180×180 box
    },
  ],
});
```

---

## Mixing Varied and Normal Shapes

Variation fields are per-shape. Shapes without variation fields are unaffected.

```typescript
const result = generate({
  seed: 55,
  canvas: { width: 600, height: 400 },
  shapes: [
    { type: "circle",  x: 100, y: 200, size: 50 },              // unchanged
    { type: "square",  x: 250, y: 200, size: 60, distort: 0.1 },// varied
    { type: "polygon", x: 450, y: 200, sides: 5, size: 70 },    // unchanged
  ],
});
// circle → <circle>, square → <path>, polygon → <polygon>
```

---

## Blob with Distortion

Distorted blobs apply PRNG perturbation to the Catmull-Rom control points, producing a bumpier outline while preserving smooth curves.

```typescript
const result = generate({
  seed: 7,
  canvas: { width: 400, height: 400 },
  shapes: [
    { type: "blob", x: 200, y: 200, size: 120, points: 8, distort: 0.15 },
  ],
});
// Output: <path> with perturbed smooth spline
```

---

## Determinism Verification

Same seed always produces the same output regardless of call count.

```typescript
const input = {
  seed: 42,
  canvas: { width: 400, height: 400 },
  shapes: [{ type: "square" as const, x: 100, y: 100, size: 80, distort: 0.1 }],
};

const a = generate(input);
const b = generate(input);
assert(a.svg === b.svg); // always true
```

---

## Validation Errors

```typescript
// distort out of range
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "square", x: 50, y: 50, size: 40, distort: 1.5 }
]});
// throws: "distort must be a number between 0 and 1"

// sizeVariance out of range
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "circle", x: 50, y: 50, size: 40, sizeVariance: -0.1 }
]});
// throws: "sizeVariance must be a number between 0 and 1"

// clamp with non-positive dimension
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "square", x: 50, y: 50, size: 40, distort: 0.1, clamp: { width: 0, height: 80 } }
]});
// throws: "clamp.width must be a positive finite number"
```

---

## outputMode Interaction

`outputMode: "path"` continues to work as in Stage 1/1.5. When `distort > 0`, shapes always render as `<path>` regardless of `outputMode`. When only `sizeVariance > 0`, `outputMode` is respected normally.

```typescript
generate({
  seed: 1,
  canvas: { width: 200, height: 200 },
  outputMode: "semantic",
  shapes: [
    { type: "square", x: 100, y: 100, size: 50 },             // → <rect>
    { type: "square", x: 100, y: 100, size: 50, distort: 0.1 }, // → <path> (distort overrides)
    { type: "square", x: 100, y: 100, size: 50, sizeVariance: 0.2 }, // → <rect> (no distort)
  ],
});
```
