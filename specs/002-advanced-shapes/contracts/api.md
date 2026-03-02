# API Contract: Advanced Shapes v0.2

> This document extends the Stage 1 API contract (`specs/001-foster-ts-shapes/contracts/api.md`). The public function signature, output contract, error contract, and SVG shared rules are **unchanged**. Only the input contract is extended with new shape variants.

---

## Public Function (unchanged)

```typescript
generate(input: GeneratorInput): GeneratorOutput
```

---

## Input Contract (extended)

```typescript
{
  seed: number,               // required, finite, not NaN
  canvas: {
    width: number,            // required, > 0, finite
    height: number            // required, > 0, finite
  },
  outputMode?: "semantic" | "path", // optional, default "semantic"
  shapes: Shape[]             // required, may be empty
}
```

### Shape Union — complete (Stage 1 + Stage 1.5)

```typescript
type Shape =
  // ── Stage 1 ──────────────────────────────────────────────────────
  | { type: "square"; x: number; y: number; size: number; rotation?: number }
  | {
      type: "rectangle";
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
    }
  | { type: "circle"; x: number; y: number; size: number; rotation?: number }
  | { type: "triangle"; x: number; y: number; size: number; rotation?: number }
  // ── Stage 1.5 ────────────────────────────────────────────────────
  | {
      type: "trapezoid";
      x: number;
      y: number;
      topWidth: number;
      bottomWidth: number;
      height: number;
      rotation?: number;
    }
  | { type: "octagon"; x: number; y: number; size: number; rotation?: number }
  | {
      type: "polygon";
      x: number;
      y: number;
      sides: number;
      size: number;
      rotation?: number;
    }
  | {
      type: "oval";
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
    }
  | {
      type: "blob";
      x: number;
      y: number;
      size: number;
      points?: number;
      rotation?: number;
    };
```

### Field Constraints (new types)

| Type      | Field       | Constraint                                     |
| --------- | ----------- | ---------------------------------------------- |
| trapezoid | topWidth    | > 0, finite, not NaN                           |
| trapezoid | bottomWidth | > 0, finite, not NaN                           |
| trapezoid | height      | > 0, finite, not NaN                           |
| octagon   | size        | > 0, finite, not NaN (circumradius)            |
| polygon   | sides       | Integer ≥ 3, finite, not NaN                   |
| polygon   | size        | > 0, finite, not NaN (circumradius)            |
| oval      | width       | > 0, finite, not NaN (full extent)             |
| oval      | height      | > 0, finite, not NaN (full extent)             |
| blob      | size        | > 0, finite, not NaN (nominal bounding radius) |
| blob      | points      | Integer ≥ 3, default 6 (optional)              |

Unknown fields at any level are silently dropped.

---

## Output Contract (unchanged)

```typescript
{
  svg: string,           // valid SVG 1.1 string
  metadata: {
    shapeCount: number   // === input.shapes.length
  }
}
```

---

## Error Contract (unchanged in structure, extended in messages)

On invalid input, `generate()` throws an `Error` with a message identifying:

- The field path (e.g., `shapes[2].sides`)
- The specific issue (e.g., `must be an integer >= 3`, `missing required field`, `NaN`)

New error examples:

- `shapes[0].sides: must be an integer >= 3` (polygon with sides < 3)
- `shapes[1].points: must be an integer >= 3` (blob with points < 3)
- `shapes[2].topWidth: missing required field` (trapezoid)
- `shapes[3].sides: NaN` (polygon with NaN sides)

---

## SVG Output Contract — Semantic Mode (extended)

When `outputMode` is omitted or `"semantic"`:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     width="{canvas.width}" height="{canvas.height}"
     viewBox="0 0 {canvas.width} {canvas.height}">

  <!-- Stage 1 (unchanged) -->
  <rect id="{shapeId}" x="..." y="..." width="..." height="..." />
  <circle id="{shapeId}" cx="..." cy="..." r="..." />
  <polygon id="{shapeId}" points="..." />

  <!-- Stage 1.5: trapezoid → <polygon> (4 vertices) -->
  <polygon id="{shapeId}" points="TL TR BR BL" />

  <!-- Stage 1.5: octagon → <polygon> (8 vertices) -->
  <polygon id="{shapeId}" points="v0 v1 v2 v3 v4 v5 v6 v7" />

  <!-- Stage 1.5: polygon → <polygon> (n vertices) -->
  <polygon id="{shapeId}" points="v0 v1 ... vn" />

  <!-- Stage 1.5: oval → <ellipse> -->
  <ellipse id="{shapeId}" cx="..." cy="..." rx="..." ry="..." />

  <!-- Stage 1.5: blob → <path> (always, regardless of outputMode) -->
  <path id="{shapeId}" d="M ... C ... C ... Z" />

  <!-- optional rotation on any shape -->
  <polygon id="{shapeId}" ... transform="rotate(R, CX, CY)" />
</svg>
```

New elements introduced: `<ellipse>`

---

## SVG Output Contract — Path Mode (extended)

When `outputMode: "path"`, every shape renders as `<path>` **except blob** (which already uses `<path>` in both modes):

```xml
<svg xmlns="http://www.w3.org/2000/svg" ...>

  <!-- Stage 1 shapes as <path> (unchanged) -->
  <path id="{shapeId}" d="{pathData}" />

  <!-- Stage 1.5: trapezoid → <path> M TL L TR L BR L BL Z -->
  <path id="{shapeId}" d="M x1 y1 L x2 y2 L x3 y3 L x4 y4 Z" />

  <!-- Stage 1.5: octagon → <path> M v0 L v1 ... L v7 Z -->
  <path id="{shapeId}" d="M x0 y0 L x1 y1 ... L x7 y7 Z" />

  <!-- Stage 1.5: polygon → <path> M v0 L v1 ... L vn-1 Z -->
  <path id="{shapeId}" d="M x0 y0 L x1 y1 ... Z" />

  <!-- Stage 1.5: oval → <path> two-arc split at left/right -->
  <!-- M (cx+rx) cy A rx ry 0 1 0 (cx-rx) cy A rx ry 0 1 0 (cx+rx) cy Z -->
  <path id="{shapeId}" d="M ... A ... A ... Z" />

  <!-- Stage 1.5: blob → <path> (same as semantic mode) -->
  <path id="{shapeId}" d="M ... C ... Z" />

</svg>
```

---

## Shared SVG Rules (both modes) — unchanged

- Root element: `<svg>` with `xmlns`, `width`, `height`, `viewBox`
- Shapes rendered in input order
- Each shape has a deterministic `id` attribute: `s<seed>-<type>-<index>`
- No scripts, event handlers, foreignObject, or external references
- `transform="rotate(R, CX, CY)"` added when `rotation` is present
- All numeric values serialized with `fmt()`: 6 decimal places, trailing zeros stripped

---

## Determinism Guarantee (unchanged)

For any valid input `I`:

```
generate(I).svg === generate(I).svg  // always true, byte-for-byte
```

Two inputs that differ only in unknown fields produce identical output.

Blob determinism: same `seed`, `x`, `y`, `size`, `points`, and shape `index` always produce the same path string.
