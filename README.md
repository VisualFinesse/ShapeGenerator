# foster-ts-shapes

> Deterministic SVG shape generation — zero dependencies, fully typed, endlessly composable.

Built by a developer who understands that the best infrastructure is the kind you never have to think about twice. `foster-ts-shapes` is a precision-engineered primitive: drop in a seed and a shape list, get back a pixel-perfect SVG every time. No canvas, no DOM, no runtime deps — just TypeScript and math.

---

## Install

```bash
npm install foster-ts-shapes
```

---

## Quick Start

```ts
import { generate } from "foster-ts-shapes";

const result = generate({
  seed: 42,
  canvas: { width: 400, height: 400 },
  shapes: [
    { type: "circle", x: 200, y: 200, size: 100, fill: "steelblue" },
  ],
});

console.log(result.svg); // <svg ...>...</svg>
```

Same seed → same SVG. Every time. On any machine.

---

## Shapes

Nine shape types, all sharing a common base interface:

| Type | Required fields |
|------|----------------|
| `square` | `x, y, size` |
| `rectangle` | `x, y, width, height` |
| `circle` | `x, y, size` |
| `triangle` | `x, y, size` |
| `trapezoid` | `x, y, topWidth, bottomWidth, height` |
| `octagon` | `x, y, size` |
| `polygon` | `x, y, sides, size` |
| `oval` | `x, y, width, height` |
| `blob` | `x, y, size, points?` |

Every shape also accepts `rotation?` (degrees).

---

## Features

### Styling

Every shape accepts fill, stroke, and opacity fields:

```ts
{
  type: "square",
  x: 100, y: 100, size: 80,
  fill: "tomato",
  stroke: "darkred",
  strokeWidth: 3,
  opacity: 0.85,
}
```

### Gradients

Linear and radial gradients on fill and/or stroke:

```ts
{
  type: "circle",
  x: 150, y: 150, size: 100,
  fillGradient: {
    type: "linear",
    x1: 0, y1: 0, x2: 1, y2: 1,
    stops: [
      { offset: 0, color: "royalblue" },
      { offset: 1, color: "mediumpurple" },
    ],
  },
}
```

### Bezier Rounding

Smooth out any shape's corners with a single field:

```ts
{
  type: "polygon",
  x: 200, y: 200, sides: 6, size: 100,
  bezier: 0.4,             // 0–1: rounding amount
  bezierDirection: "in",   // "out" (convex, default) | "in" (concave)
}
```

### Variation / Distortion

Seeded randomness that distorts vertices — great for organic, hand-drawn aesthetics:

```ts
{
  type: "blob",
  x: 150, y: 150, size: 100, points: 8,
  fill: "goldenrod",
  distort: 0.3,          // 0–1: per-vertex displacement
  sizeVariance: 0.2,     // 0–1: overall scale jitter
  clamp: { width: 200, height: 200 }, // keep shape within bounds
}
```

### Layers

Control z-order with `layer` — lower values render behind higher ones:

```ts
shapes: [
  { type: "circle",    x: 200, y: 200, size: 150, fill: "cornflowerblue", layer: 0 },
  { type: "oval",      x: 200, y: 200, width: 80, height: 40, fill: "white", layer: 1 },
]
```

### Masks

Clip any shape using one or more mask shapes. Masks accept the full variation and bezier API:

```ts
// Circle clipped to a triangle window
{
  type: "circle",
  x: 150, y: 150, size: 100,
  fill: "steelblue",
  mask: { type: "triangle", x: 150, y: 150, size: 90 },
}

// Polygon revealed through two circular windows
{
  type: "polygon",
  x: 200, y: 150, sides: 8, size: 130,
  fill: "mediumseagreen",
  mask: [
    { type: "circle", x: 140, y: 130, size: 60 },
    { type: "circle", x: 260, y: 170, size: 60 },
  ],
}

// Donut: punch a hole in a shape by compositing black into the mask
{
  type: "square",
  x: 150, y: 150, size: 160,
  fill: "steelblue",
  mask: [
    { type: "square", x: 150, y: 150, size: 160, fill: "white" }, // reveal
    { type: "square", x: 150, y: 150, size: 80,  fill: "black" }, // punch hole
  ],
}
```

---

## API

### `generate(input: GeneratorInput): GeneratorOutput`

```ts
interface GeneratorInput {
  seed: number;               // any integer — determines all randomness
  canvas: { width: number; height: number };
  shapes: Shape[];
  outputMode?: "semantic" | "path"; // default: "semantic"
}

interface GeneratorOutput {
  svg: string;
  metadata: { shapeCount: number };
}
```

`outputMode: "semantic"` emits native SVG primitives (`<rect>`, `<circle>`, etc.) where possible.
`outputMode: "path"` forces all shapes to `<path>` elements — useful when distortion or masking is applied.

---

## Determinism

The seed drives a [mulberry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c) PRNG. Given the same seed and input, `generate()` returns byte-for-byte identical SVG output across environments and versions. This makes the library suitable as a stable foundation for generative art pipelines, procedural asset systems, or any context where reproducibility matters.

---

## TypeScript

Full strict-mode types are included. No `@types/` package needed.

```ts
import type { GeneratorInput, Shape, GeneratorOutput } from "foster-ts-shapes";
```

---

## License

MIT © 2026 VisualFinesse
