# API Contract: Stage 3 — Styling & Bezier

## Overview

Stage 3 extends the existing `generate(input: GeneratorInput): GeneratorOutput` contract with optional per-shape styling fields (fill, stroke, opacity, gradients) and bezier corner rounding. The function signature and return type are **unchanged**. All changes are additive.

---

## New Input Types

### ColorStop

```typescript
interface ColorStop {
  offset: number;    // 0–1: gradient position (0 = start, 1 = end)
  color: string;     // CSS color string — passed through as-is
  opacity?: number;  // 0–1: per-stop stop-opacity; absent = 1
}
```

### LinearGradient

```typescript
interface LinearGradient {
  type: "linear";
  x1?: number;  // 0–1 (objectBoundingBox fraction); default 0
  y1?: number;  // 0–1; default 0
  x2?: number;  // 0–1; default 1
  y2?: number;  // 0–1; default 0  → produces left-to-right horizontal gradient
  stops: ColorStop[];  // at least 1 stop required
}
```

### RadialGradient

```typescript
interface RadialGradient {
  type: "radial";
  cx?: number;  // 0–1; default 0.5 (center)
  cy?: number;  // 0–1; default 0.5 (center)
  r?: number;   // 0–1; default 0.5 (full shape coverage)
  stops: ColorStop[];  // at least 1 stop required
}
```

### StylingFields (added to all shapes via ShapeBase)

```typescript
// fill and stroke accept any CSS color string (including hex, rgb(), named colors, "none")
// absent fields = SVG default applies (fill=black, stroke=none, opacity=1)
interface StylingFields {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fillGradient?: LinearGradient | RadialGradient;
  strokeGradient?: LinearGradient | RadialGradient;
}
```

### BezierFields (added to all shapes via ShapeBase)

```typescript
interface BezierFields {
  bezier?: number;                 // 0–1: corner rounding fraction; 0/absent = sharp corners
  bezierDirection?: "out" | "in"; // absent/default = "out" (convex rounding)
}
```

---

## Shape Example Configurations

```typescript
// Opacity only
{ type: "circle", x: 100, y: 100, size: 50, opacity: 0.5 }

// Solid fill + stroke
{ type: "square", x: 100, y: 100, size: 60, fill: "#3366ff", stroke: "#000000", strokeWidth: 2 }

// Fill "none" + stroke (outline shape)
{ type: "rectangle", x: 150, y: 100, width: 100, height: 60, fill: "none", stroke: "red", strokeWidth: 3 }

// Linear gradient fill (left-to-right)
{
  type: "circle",
  x: 200, y: 200, size: 80,
  fillGradient: {
    type: "linear",
    stops: [
      { offset: 0, color: "#ff0000" },
      { offset: 1, color: "#0000ff" }
    ]
  }
}

// Diagonal linear gradient
{
  type: "rectangle",
  x: 150, y: 150, width: 200, height: 100,
  fillGradient: {
    type: "linear",
    x1: 0, y1: 0, x2: 1, y2: 1,
    stops: [
      { offset: 0, color: "gold" },
      { offset: 0.5, color: "orange" },
      { offset: 1, color: "crimson" }
    ]
  }
}

// Radial gradient fill
{
  type: "circle",
  x: 200, y: 200, size: 100,
  fillGradient: {
    type: "radial",
    cx: 0.3, cy: 0.3, r: 0.6,
    stops: [
      { offset: 0, color: "white" },
      { offset: 1, color: "#3366ff", opacity: 0.8 }
    ]
  }
}

// Gradient stroke
{
  type: "polygon",
  x: 200, y: 200, sides: 6, size: 80,
  fill: "none",
  strokeWidth: 4,
  strokeGradient: {
    type: "linear",
    stops: [{ offset: 0, color: "cyan" }, { offset: 1, color: "magenta" }]
  }
}

// Bezier convex (default) corner rounding
{ type: "square", x: 100, y: 100, size: 80, bezier: 0.4 }

// Bezier concave corner rounding
{ type: "polygon", x: 200, y: 200, sides: 5, size: 70, bezier: 0.3, bezierDirection: "in" }

// Bezier + color combination
{
  type: "octagon",
  x: 200, y: 200, size: 80,
  bezier: 0.35,
  fill: "#6644aa",
  opacity: 0.85
}

// Full combination: sizeVariance + distort + bezier + gradient + opacity
{
  type: "square",
  x: 200, y: 200, size: 80,
  sizeVariance: 0.1,
  distort: 0.05,
  bezier: 0.3,
  opacity: 0.9,
  fillGradient: {
    type: "radial",
    stops: [{ offset: 0, color: "white" }, { offset: 1, color: "#3366ff" }]
  }
}
```

---

## Field Validation

| Field | Type | Constraint | Error when violated |
|---|---|---|---|
| `opacity` | `number` (optional) | `0 ≤ opacity ≤ 1`, finite | `"opacity must be a number between 0 and 1"` |
| `strokeWidth` | `number` (optional) | `> 0`, finite | `"strokeWidth must be a positive finite number"` |
| `bezier` | `number` (optional) | `0 ≤ bezier ≤ 1`, finite | `"bezier must be a number between 0 and 1"` |
| `bezierDirection` | `string` (optional) | `"out"` or `"in"` | `'bezierDirection must be "out" or "in"'` |
| `fillGradient.stops` | `ColorStop[]` | length ≥ 1 | `"fillGradient.stops must have at least one stop"` |
| `strokeGradient.stops` | `ColorStop[]` | length ≥ 1 | `"strokeGradient.stops must have at least one stop"` |
| `stop.offset` | `number` | `0 ≤ offset ≤ 1`, finite | `"gradient stop offset must be a number between 0 and 1"` |
| `stop.color` | `string` | must be string | `"gradient stop color must be a string"` |
| `stop.opacity` | `number` (optional) | `0 ≤ opacity ≤ 1`, finite | `"gradient stop opacity must be a number between 0 and 1"` |
| Linear `x1/y1/x2/y2` | `number` (optional) | finite | `"gradient coordinate must be a finite number"` |
| Radial `cx/cy` | `number` (optional) | finite | `"gradient coordinate must be a finite number"` |
| Radial `r` | `number` (optional) | `> 0`, finite | `"gradient r must be a positive finite number"` |

`fill` and `stroke` are accepted as any string value — no CSS color format validation is performed.

---

## Output Contract

### SVG Output — Opacity

```xml
<!-- opacity: 0.5 -->
<rect id="s42-square-0" x="70" y="70" width="60" height="60" opacity="0.5"/>
```

### SVG Output — Color

```xml
<!-- fill + stroke + strokeWidth -->
<circle id="s42-circle-0" cx="200" cy="200" r="40" fill="#3366ff" stroke="#000000" stroke-width="2"/>
```

### SVG Output — Linear Gradient

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="grad-s42-circle-0-fill" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#ff0000"/>
      <stop offset="1" stop-color="#0000ff"/>
    </linearGradient>
  </defs>
  <circle id="s42-circle-0" cx="200" cy="200" r="40" fill="url(#grad-s42-circle-0-fill)"/>
</svg>
```

### SVG Output — Radial Gradient with stop-opacity

```xml
<defs>
  <radialGradient id="grad-s42-circle-0-fill" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
    <stop offset="0" stop-color="white"/>
    <stop offset="1" stop-color="#3366ff" stop-opacity="0.8"/>
  </radialGradient>
</defs>
<circle id="s42-circle-0" cx="200" cy="200" r="50" fill="url(#grad-s42-circle-0-fill)"/>
```

### SVG Output — Bezier Convex Rounding

```xml
<!-- square, bezier: 0.4, bezierDirection: "out" (default) -->
<!-- Renders as <path> with quadratic bezier curves at each corner -->
<path id="s42-square-0" d="M 82 70 Q 70 70 70 82 L 70 118 Q 70 130 82 130 L 118 130 Q 130 130 130 118 L 130 82 Q 130 70 118 70 Z"/>
```

### SVG Output — Bezier + Gradient Combined

```xml
<defs>
  <radialGradient id="grad-s42-square-0-fill" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
    <stop offset="0" stop-color="white"/>
    <stop offset="1" stop-color="#3366ff"/>
  </radialGradient>
</defs>
<path id="s42-square-0" d="M ... Z" fill="url(#grad-s42-square-0-fill)" opacity="0.9"/>
```

### SVG Output — Multiple Shapes with Gradients

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="grad-s42-circle-0-fill" ...>...</linearGradient>
    <radialGradient id="grad-s42-square-1-fill" ...>...</radialGradient>
  </defs>
  <circle id="s42-circle-0" cx="100" cy="100" r="40" fill="url(#grad-s42-circle-0-fill)"/>
  <path   id="s42-square-1" d="..." fill="url(#grad-s42-square-1-fill)"/>
</svg>
```

### Metadata

`GeneratorOutput.metadata` is unchanged: `{ shapeCount: number }`. No new metadata fields.

---

## Precedence Rules

| Situation | Result |
|---|---|
| `fillGradient` present + `fill` present | `fillGradient` wins; `fill` string is ignored |
| `strokeGradient` present + `stroke` present | `strokeGradient` wins; `stroke` string is ignored |
| `strokeWidth` present but neither `stroke` nor `strokeGradient` | `strokeWidth` is ignored (not emitted) |
| `bezierDirection` present but `bezier` absent or `0` | `bezierDirection` accepted, no effect |
| `clamp` present but `bezier > 0` and `distort === 0` | `clamp` has no effect (distort-only feature); bezier rounding still applied |

---

## Determinism Contract

| Invariant | Description |
|---|---|
| `generate(input) === generate(input)` | Identical inputs always produce identical SVG |
| Gradient IDs deterministic | `grad-{shapeId}-fill/stroke` → deterministic from seed + type + index |
| `bezier: 0` → no change | Same output as shape without bezier field |
| `opacity` absent or `1` → no opacity attr | Same output as Stage 2 for that element |
| No styling fields → Stage 2 identical output | Styling block is a complete no-op |
| Ordering stable | Gradient defs appear in shape order (index 0 first, then 1, etc.) |

---

## Canonicalization Contract

All new fields are whitelisted in the canonical representation:

```typescript
// Input: { type: "square", x: 100, y: 100, size: 50, fill: "#ff0000", unknownField: true }
// Canonical: { type: "square", x: 100, y: 100, size: 50, fill: "#ff0000" }
//   → unknownField dropped, fill preserved

// Input: { type: "circle", x: 100, y: 100, size: 50 }
// Canonical: { type: "circle", x: 100, y: 100, size: 50 }
//   → no styling/bezier keys emitted when absent (backward compatible)
```

Gradient objects are canonicalized atomically — the entire `fillGradient` object is included or excluded together. Unknown sub-fields inside gradient objects are passed through as-is.

---

## Backward Compatibility

All shapes without styling or bezier fields produce SVG output byte-for-byte identical to Stage 2 output. No breaking changes to the `generate` function signature or the `GeneratorOutput` type.
