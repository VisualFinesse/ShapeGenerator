# Data Model: SVG Shape Engine v0.1

**Branch**: `001-foster-ts-shapes` | **Date**: 2026-02-28

## Entities

### GeneratorInput

The top-level input to the `generate()` function.

| Field      | Type                 | Required | Constraints         |
| ---------- | -------------------- | -------- | ------------------- |
| seed       | number               | Yes      | Finite, not NaN     |
| canvas     | Canvas               | Yes      | —                   |
| shapes     | Shape[]              | Yes      | May be empty        |
| outputMode | "semantic" \| "path" | No       | Default: "semantic" |

Unknown fields at this level are dropped during canonicalization.

### Canvas

Defines the SVG viewport.

| Field  | Type   | Required | Constraints          |
| ------ | ------ | -------- | -------------------- |
| width  | number | Yes      | > 0, finite, not NaN |
| height | number | Yes      | > 0, finite, not NaN |

### Shape (Discriminated Union)

Discriminated on `type`. All variants share a common base.

**Base fields** (all variants):

| Field    | Type   | Required | Constraints                                         |
| -------- | ------ | -------- | --------------------------------------------------- |
| type     | string | Yes      | One of: "square", "rectangle", "circle", "triangle" |
| x        | number | Yes      | Finite, not NaN (center X)                          |
| y        | number | Yes      | Finite, not NaN (center Y)                          |
| rotation | number | No       | Finite, not NaN (degrees, default: omitted)         |

**SquareShape** (`type: "square"`):

| Field | Type   | Required | Constraints                        |
| ----- | ------ | -------- | ---------------------------------- |
| size  | number | Yes      | > 0, finite, not NaN (side length) |

**RectangleShape** (`type: "rectangle"`):

| Field  | Type   | Required | Constraints          |
| ------ | ------ | -------- | -------------------- |
| width  | number | Yes      | > 0, finite, not NaN |
| height | number | Yes      | > 0, finite, not NaN |

**CircleShape** (`type: "circle"`):

| Field | Type   | Required | Constraints                     |
| ----- | ------ | -------- | ------------------------------- |
| size  | number | Yes      | > 0, finite, not NaN (diameter) |

**TriangleShape** (`type: "triangle"`):

| Field | Type   | Required | Constraints                        |
| ----- | ------ | -------- | ---------------------------------- |
| size  | number | Yes      | > 0, finite, not NaN (side length) |

Unknown fields on any shape variant are dropped during canonicalization.

### GeneratorOutput

The return value of `generate()`.

| Field               | Type   | Description                        |
| ------------------- | ------ | ---------------------------------- |
| svg                 | string | Valid SVG string                   |
| metadata.shapeCount | number | Count of shape elements in the SVG |

### ShapeID

A deterministic string identifier assigned to each shape element.

**Format**: `s<seed>-<type>-<index>`

| Component | Source                              | Example            |
| --------- | ----------------------------------- | ------------------ |
| seed      | `input.seed` (negative → `sn<abs>`) | `s42`, `sn7`       |
| type      | `shape.type`                        | `square`, `circle` |
| index     | 0-based position in `input.shapes`  | `0`, `3`           |

**Example**: `s42-triangle-3`

## Entity Relationships

```
GeneratorInput
├── seed: number
├── canvas: Canvas
│   ├── width
│   └── height
└── shapes: Shape[]
    ├── SquareShape   (type="square")
    ├── RectangleShape (type="rectangle")
    ├── CircleShape   (type="circle")
    └── TriangleShape (type="triangle")

generate(GeneratorInput) → GeneratorOutput
                            ├── svg: string (contains shape elements with id=ShapeID)
                            └── metadata.shapeCount: number
```

## Validation Rules Summary

1. All numeric fields: reject NaN, Infinity, -Infinity
2. Canvas dimensions: must be > 0
3. Shape size/width/height: must be > 0
4. Shape type: must be one of the four supported types
5. Required fields: seed, canvas.width, canvas.height, shape.type,
   shape.x, shape.y, plus type-specific sizing fields
