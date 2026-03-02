# Quickstart: Stage 4 — Shape Masks & Layers

## Basic Layer Usage

Control which shapes appear in front of or behind others using `layer`:

```typescript
import { generate } from "./src/generate.js";

const output = generate({
  seed: 42,
  canvas: { width: 400, height: 300 },
  shapes: [
    // Background circle (layer 0 — default)
    { type: "circle", x: 200, y: 150, size: 200 },
    // Overlapping square rendered on top (layer 1)
    { type: "square", x: 200, y: 150, size: 80, layer: 1, fill: "#ff0000" },
    // Far background square (layer -1)
    { type: "square", x: 50, y: 50, size: 60, layer: -1, fill: "#0000ff" },
  ],
});

console.log(output.svg);
// SVG order: blue square (layer -1), circle (layer 0), red square (layer 1)
```

Shape IDs are always derived from the original input array position, regardless of layer:
- `s42-circle-0` (input index 0)
- `s42-square-1` (input index 1)
- `s42-square-2` (input index 2)

---

## Shapes with Equal Layers

When two shapes share the same layer value, they retain their original array order:

```typescript
shapes: [
  { type: "circle", x: 100, y: 100, size: 60, layer: 0 },  // first at layer 0
  { type: "square", x: 130, y: 130, size: 40, layer: 0 },  // second at layer 0 — renders on top
]
// SVG: circle first, square second (stable sort)
```

---

## Basic Mask Usage

Mask a circle with a square — only the area inside the square is visible:

```typescript
const output = generate({
  seed: 1,
  canvas: { width: 200, height: 200 },
  shapes: [{
    type: "circle",
    x: 100, y: 100, size: 100,
    fill: "#3399ff",
    mask: { type: "square", x: 100, y: 100, size: 80 }
  }],
});
```

The square mask shape defaults to `fill="white"` — white reveals the target shape in luminance masking.

---

## Cutout Mask (Black Fill)

Use `fill: "black"` on a mask shape to cut out a hole:

```typescript
shapes: [{
  type: "square",
  x: 100, y: 100, size: 100,
  fill: "#3399ff",
  mask: [
    // Full white background — show everything
    { type: "square", x: 100, y: 100, size: 100 },
    // Black circle cutout — hide the center
    { type: "circle", x: 100, y: 100, size: 40, fill: "black" },
  ]
}]
```

SVG luminance compositing is additive: the last rendered white/black areas within `<mask>` take effect.

---

## Soft Fade Mask (Gradient)

Use a gradient on a mask shape to fade the target shape from visible to transparent:

```typescript
shapes: [{
  type: "square",
  x: 100, y: 100, size: 160,
  fill: "#ff6600",
  mask: {
    type: "square",
    x: 100, y: 100, size: 160,
    fillGradient: {
      type: "linear",
      x1: 0, y1: 0, x2: 1, y2: 0,  // left to right
      stops: [
        { offset: 0, color: "black" },  // left edge: hidden
        { offset: 1, color: "white" },  // right edge: fully visible
      ]
    }
  }
}]
```

---

## Distorted Mask Shape

Mask shapes support all variation fields — create an organic mask boundary:

```typescript
shapes: [{
  type: "circle",
  x: 100, y: 100, size: 100,
  fill: "#33cc33",
  mask: {
    type: "circle",
    x: 100, y: 100, size: 90,
    distort: 0.3  // irregular, wobbly mask boundary
  }
}]
// Note: mask PRNG is seeded independently — does not affect parent shape variation
```

---

## Bezier-Rounded Mask

Soften the edges of a rectangular mask with bezier rounding:

```typescript
shapes: [{
  type: "circle",
  x: 100, y: 100, size: 100,
  fill: "#9933ff",
  mask: {
    type: "square",
    x: 100, y: 100, size: 80,
    bezier: 0.4  // round the corners of the square mask
  }
}]
```

---

## Combined: Layers + Masks + Styling

```typescript
const output = generate({
  seed: 7,
  canvas: { width: 400, height: 300 },
  shapes: [
    // Background gradient rectangle (layer -1)
    {
      type: "rectangle",
      x: 200, y: 150, width: 400, height: 300,
      layer: -1,
      fillGradient: {
        type: "linear",
        x1: 0, y1: 0, x2: 0, y2: 1,
        stops: [
          { offset: 0, color: "#1a1a2e" },
          { offset: 1, color: "#16213e" },
        ]
      }
    },
    // Masked circle on top (layer 1)
    {
      type: "circle",
      x: 200, y: 150, size: 200,
      layer: 1,
      fill: "#e94560",
      opacity: 0.8,
      mask: {
        type: "polygon",
        x: 200, y: 150, sides: 6, size: 160,
        bezier: 0.2
      }
    },
  ],
});
```

---

## Validation Errors

```typescript
// Non-finite layer:
generate({ ..., shapes: [{ type: "square", x: 0, y: 0, size: 10, layer: NaN }] })
// Error: "layer must be a finite number"

// Invalid mask shape:
generate({ ..., shapes: [{ type: "circle", x: 0, y: 0, size: 50, mask: { type: "circle", x: 0, y: 0, size: -1 } }] })
// Error: "circle size must be a positive finite number"
```
