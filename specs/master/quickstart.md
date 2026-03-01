# Quickstart: Stage 3 — Styling & Bezier

## Opacity

Control the transparency of any shape with `opacity` (0 = invisible, 1 = fully opaque).

```typescript
import { generate } from "./src/generate.js";

const result = generate({
  seed: 42,
  canvas: { width: 400, height: 400 },
  shapes: [
    { type: "circle",    x: 100, y: 200, size: 80, opacity: 1.0 },  // fully opaque
    { type: "circle",    x: 200, y: 200, size: 80, opacity: 0.5 },  // 50% transparent
    { type: "circle",    x: 300, y: 200, size: 80, opacity: 0.2 },  // nearly transparent
  ],
});
console.log(result.svg);
// → circles have opacity="1.0", opacity="0.5", opacity="0.2" attributes
```

---

## Color (Fill & Stroke)

Use any CSS color string for `fill` and `stroke`. Add `strokeWidth` to control stroke thickness.

```typescript
const result = generate({
  seed: 1,
  canvas: { width: 400, height: 400 },
  shapes: [
    // Solid fill, no stroke
    { type: "square", x: 100, y: 100, size: 70, fill: "#3366ff" },

    // Fill + stroke
    { type: "circle", x: 250, y: 100, size: 60, fill: "coral", stroke: "#333333", strokeWidth: 3 },

    // Outline only (no fill)
    { type: "polygon", x: 100, y: 280, sides: 5, size: 60,
      fill: "none", stroke: "darkgreen", strokeWidth: 2 },

    // Semi-transparent fill with stroke
    { type: "rectangle", x: 280, y: 250, width: 120, height: 80,
      fill: "rgba(100, 100, 255, 0.4)", stroke: "navy", strokeWidth: 1.5 },
  ],
});
```

---

## Linear Gradient Fill

Specify at least two color stops; positions are fractions of the shape's bounding box.

```typescript
const result = generate({
  seed: 42,
  canvas: { width: 400, height: 400 },
  shapes: [
    // Default: left-to-right horizontal gradient
    {
      type: "rectangle",
      x: 200, y: 150, width: 300, height: 100,
      fillGradient: {
        type: "linear",
        stops: [
          { offset: 0, color: "#ff6b6b" },
          { offset: 1, color: "#4ecdc4" },
        ],
      },
    },

    // Diagonal gradient (top-left to bottom-right)
    {
      type: "square",
      x: 200, y: 300, size: 100,
      fillGradient: {
        type: "linear",
        x1: 0, y1: 0, x2: 1, y2: 1,
        stops: [
          { offset: 0, color: "gold" },
          { offset: 0.5, color: "orange" },
          { offset: 1, color: "crimson" },
        ],
      },
    },

    // Vertical gradient (top to bottom)
    {
      type: "circle",
      x: 100, y: 100, size: 80,
      fillGradient: {
        type: "linear",
        x1: 0, y1: 0, x2: 0, y2: 1,
        stops: [
          { offset: 0, color: "#ffffff" },
          { offset: 1, color: "#3a86ff" },
        ],
      },
    },
  ],
});
```

---

## Radial Gradient Fill

```typescript
const result = generate({
  seed: 7,
  canvas: { width: 400, height: 400 },
  shapes: [
    // Centered radial (default — burst from center to edge)
    {
      type: "circle",
      x: 100, y: 200, size: 100,
      fillGradient: {
        type: "radial",
        stops: [
          { offset: 0, color: "white" },
          { offset: 1, color: "#ff0077" },
        ],
      },
    },

    // Off-center radial (light source at top-left)
    {
      type: "square",
      x: 300, y: 200, size: 120,
      fillGradient: {
        type: "radial",
        cx: 0.25, cy: 0.25, r: 0.8,
        stops: [
          { offset: 0, color: "#ffffff" },
          { offset: 0.4, color: "#88aaff" },
          { offset: 1, color: "#001166" },
        ],
      },
    },
  ],
});
```

---

## Gradient Stroke

Apply a gradient to the stroke instead of (or in addition to) the fill.

```typescript
const result = generate({
  seed: 3,
  canvas: { width: 400, height: 400 },
  shapes: [
    // Gradient stroke, no fill
    {
      type: "polygon",
      x: 200, y: 200, sides: 6, size: 100,
      fill: "none",
      strokeWidth: 6,
      strokeGradient: {
        type: "linear",
        stops: [
          { offset: 0, color: "cyan" },
          { offset: 1, color: "magenta" },
        ],
      },
    },

    // Both fill gradient and stroke gradient
    {
      type: "octagon",
      x: 100, y: 100, size: 70,
      strokeWidth: 3,
      fillGradient: {
        type: "radial",
        stops: [{ offset: 0, color: "white" }, { offset: 1, color: "steelblue" }],
      },
      strokeGradient: {
        type: "linear",
        stops: [{ offset: 0, color: "navy" }, { offset: 1, color: "skyblue" }],
      },
    },
  ],
});
```

---

## Gradient with Stop Opacity

Use `opacity` on individual stops for per-stop transparency (fades to transparent).

```typescript
const result = generate({
  seed: 5,
  canvas: { width: 400, height: 300 },
  shapes: [
    {
      type: "circle",
      x: 200, y: 150, size: 100,
      fillGradient: {
        type: "radial",
        stops: [
          { offset: 0, color: "#ffcc00", opacity: 1 },    // solid gold center
          { offset: 0.6, color: "#ff6600", opacity: 0.7 },
          { offset: 1, color: "#ff0000", opacity: 0 },     // fades to transparent edge
        ],
      },
    },
  ],
});
```

---

## Bezier Corner Rounding

Round the corners of polygon shapes. `bezier: 0` = sharp (default), `bezier: 1` = maximum.

```typescript
const result = generate({
  seed: 42,
  canvas: { width: 600, height: 400 },
  shapes: [
    // Subtle rounding
    { type: "square", x: 100, y: 200, size: 80, bezier: 0.2 },

    // Medium rounding
    { type: "rectangle", x: 300, y: 200, width: 160, height: 80, bezier: 0.5 },

    // Heavy rounding (near-pill shape)
    { type: "rectangle", x: 500, y: 200, width: 160, height: 80, bezier: 0.95 },
  ],
});
// All three render as <path> elements (bezier > 0 forces path output)
```

---

## Bezier Concave (Inward) Rounding

Use `bezierDirection: "in"` for corners that indent inward.

```typescript
const result = generate({
  seed: 13,
  canvas: { width: 400, height: 400 },
  shapes: [
    // Star-like effect on octagon
    { type: "octagon", x: 200, y: 200, size: 100, bezier: 0.5, bezierDirection: "in" },

    // Concave pentagon
    { type: "polygon", x: 100, y: 100, sides: 5, size: 60,
      bezier: 0.4, bezierDirection: "in", fill: "#aa66ff" },
  ],
});
```

---

## Bezier + Distort Combined

Bezier rounding is applied after distortion — softening the rough vertices.

```typescript
const result = generate({
  seed: 7,
  canvas: { width: 400, height: 400 },
  shapes: [
    {
      type: "square",
      x: 200, y: 200, size: 100,
      distort: 0.1,       // add organic vertex variation first
      bezier: 0.3,        // then smooth out the corners
      fill: "#66aaff",
    },
  ],
});
```

---

## Full Combination: All Feature Groups

```typescript
const result = generate({
  seed: 99,
  canvas: { width: 500, height: 500 },
  shapes: [
    {
      type: "octagon",
      x: 250, y: 250, size: 150,

      // Variation (Stage 2)
      sizeVariance: 0.1,
      distort: 0.05,

      // Bezier (Stage 3)
      bezier: 0.3,
      bezierDirection: "out",

      // Opacity (Stage 3)
      opacity: 0.95,

      // Gradient fill (Stage 3)
      fillGradient: {
        type: "radial",
        cx: 0.4, cy: 0.3, r: 0.7,
        stops: [
          { offset: 0, color: "white", opacity: 0.9 },
          { offset: 0.6, color: "#8844ee" },
          { offset: 1, color: "#221144" },
        ],
      },

      // Stroke (Stage 3)
      strokeWidth: 2,
      stroke: "#ffffff",
    },
  ],
});
```

---

## Mixing Styled and Unstyled Shapes

Styling is per-shape. Shapes without styling fields are unaffected by Stage 3.

```typescript
const result = generate({
  seed: 55,
  canvas: { width: 600, height: 400 },
  shapes: [
    { type: "circle",  x: 100, y: 200, size: 60 },              // Stage 2 identical: <circle>
    { type: "square",  x: 250, y: 200, size: 70, fill: "red" }, // fill attr added
    { type: "polygon", x: 450, y: 200, sides: 6, size: 60 },    // Stage 2 identical: <polygon>
  ],
});
// circle → <circle> (no styling attrs)
// square → <rect fill="red"> or <path fill="red"> depending on other fields
// polygon → <polygon> (no styling attrs)
```

---

## Validation Errors

```typescript
// opacity out of range
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "circle", x: 50, y: 50, size: 40, opacity: 1.5 }
]});
// throws: "opacity must be a number between 0 and 1"

// strokeWidth invalid
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "square", x: 50, y: 50, size: 40, stroke: "red", strokeWidth: -2 }
]});
// throws: "strokeWidth must be a positive finite number"

// bezier out of range
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "square", x: 50, y: 50, size: 40, bezier: 2.0 }
]});
// throws: "bezier must be a number between 0 and 1"

// bezierDirection invalid
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "square", x: 50, y: 50, size: 40, bezier: 0.3, bezierDirection: "round" }
]});
// throws: 'bezierDirection must be "out" or "in"'

// gradient with no stops
generate({ seed: 1, canvas: { width: 100, height: 100 }, shapes: [
  { type: "circle", x: 50, y: 50, size: 40,
    fillGradient: { type: "linear", stops: [] } }
]});
// throws: "fillGradient.stops must have at least one stop"
```

---

## Determinism Verification

Same seed and config always produce identical SVG, including gradient IDs and paths.

```typescript
const input = {
  seed: 42,
  canvas: { width: 400, height: 400 },
  shapes: [{
    type: "square" as const,
    x: 200, y: 200, size: 80,
    bezier: 0.3,
    fillGradient: {
      type: "linear" as const,
      stops: [{ offset: 0, color: "red" }, { offset: 1, color: "blue" }],
    },
  }],
};

const a = generate(input);
const b = generate(input);
assert(a.svg === b.svg); // always true — deterministic including gradient IDs
```
