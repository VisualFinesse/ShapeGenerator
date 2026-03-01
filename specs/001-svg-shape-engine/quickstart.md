# Quickstart: SVG Shape Engine v0.1

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Usage — Semantic Mode (default)

```typescript
import { generate } from "./src/index";

const result = generate({
  seed: 42,
  canvas: { width: 200, height: 200 },
  shapes: [
    { type: "square",    x: 50,  y: 50,  size: 30 },
    { type: "rectangle", x: 120, y: 80,  width: 60, height: 30 },
    { type: "circle",    x: 100, y: 150, size: 40 },
    { type: "triangle",  x: 160, y: 40,  size: 35, rotation: 45 },
  ],
  // outputMode: "semantic" is the default — can be omitted
});

console.log(result.svg);
// → <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
//     <rect    id="s42-square-0"    x="35" y="35" width="30" height="30" />
//     <rect    id="s42-rectangle-1" x="90" y="65" width="60" height="30" />
//     <circle  id="s42-circle-2"    cx="100" cy="150" r="20" />
//     <polygon id="s42-triangle-3"  points="160,9.7... 130.7,...  189.3,..."
//              transform="rotate(45, 160, 40)" />
//   </svg>

console.log(result.metadata.shapeCount);
// → 4
```

## Usage — Path Mode

```typescript
const result = generate({
  seed: 42,
  canvas: { width: 200, height: 200 },
  shapes: [
    { type: "square",    x: 50,  y: 50,  size: 30 },
    { type: "circle",    x: 100, y: 150, size: 40 },
  ],
  outputMode: "path",
});

console.log(result.svg);
// → <svg ...>
//     <path id="s42-square-0"  d="M 35 35 L 65 35 L 65 65 L 35 65 Z" />
//     <path id="s42-circle-1"  d="M 120 150 A 20 20 0 1 0 80 150 A 20 20 0 1 0 120 150 Z" />
//   </svg>
```

## Verify Determinism

```typescript
const a = generate(input);
const b = generate(input);
console.log(a.svg === b.svg); // → true
```

## Supported Shapes

| Type      | Required Params     | Optional |
|-----------|---------------------|----------|
| square    | x, y, size          | rotation |
| rectangle | x, y, width, height | rotation |
| circle    | x, y, size          | rotation |
| triangle  | x, y, size          | rotation |

All coordinates are center-based.

**Semantic mode** (default): square/rectangle → `<rect>`, circle → `<circle>`, triangle → `<polygon>`.
**Path mode**: every shape → `<path>`.
