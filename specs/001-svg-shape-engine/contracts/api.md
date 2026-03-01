# API Contract: SVG Shape Engine v0.1

## Public Function

```typescript
generate(input: GeneratorInput): GeneratorOutput
```

### Input Contract

```typescript
{
  seed: number,               // required, finite, not NaN
  canvas: {
    width: number,            // required, > 0, finite
    height: number            // required, > 0, finite
  },
  outputMode?: "semantic" | "path", // optional, default "semantic"
  shapes: [                   // required, may be empty
    {
      type: "square",         // discriminant
      x: number,              // required, finite (center)
      y: number,              // required, finite (center)
      size: number,           // required, > 0, finite
      rotation?: number       // optional, finite (degrees)
    }
    // | { type: "rectangle", x, y, width, height, rotation? }
    // | { type: "circle",    x, y, size, rotation? }
    // | { type: "triangle",  x, y, size, rotation? }
  ]
}
```

Unknown fields at any level are silently dropped.

### Output Contract

```typescript
{
  svg: string,           // valid SVG 1.1 string
  metadata: {
    shapeCount: number   // === input.shapes.length
  }
}
```

### Error Contract

On invalid input, `generate()` throws an `Error` with a message
identifying:
- The field path (e.g., `shapes[2].x`)
- The specific issue (e.g., `NaN`, `missing required field`, `unsupported type`)

### SVG Output Contract — Semantic Mode (default)

When `outputMode` is omitted or `"semantic"`, the SVG uses native
shape elements:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     width="{canvas.width}" height="{canvas.height}"
     viewBox="0 0 {canvas.width} {canvas.height}">
  <!-- square / rectangle → <rect> -->
  <rect id="{shapeId}" x="..." y="..." width="..." height="..." />
  <!-- circle → <circle> -->
  <circle id="{shapeId}" cx="..." cy="..." r="..." />
  <!-- triangle → <polygon> -->
  <polygon id="{shapeId}" points="..." />
  <!-- with optional rotation -->
  <rect id="{shapeId}" ... transform="rotate(R, CX, CY)" />
</svg>
```

- Shape elements: `<rect>`, `<circle>`, `<polygon>` (no `<path>`)
- Square and rectangle both use `<rect>`; they are kept distinct by type identity in the domain model

### SVG Output Contract — Path Mode

When `outputMode: "path"`, every shape renders as a `<path>`:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     width="{canvas.width}" height="{canvas.height}"
     viewBox="0 0 {canvas.width} {canvas.height}">
  <!-- One <path> per shape, in input order -->
  <path id="{shapeId}" d="{pathData}" />
  <path id="{shapeId}" d="{pathData}" transform="rotate(R, CX, CY)" />
</svg>
```

- Shape elements: `<path>` only (no `<rect>`, `<circle>`, `<polygon>`)
- Circle uses exact two-arc path (no Bézier approximation)

### Shared SVG Rules (both modes)

- Root element: `<svg>` with `xmlns`, `width`, `height`, `viewBox`
- Shapes rendered in input order
- Each shape has a deterministic `id` attribute
- No scripts, event handlers, foreignObject, or external references
- `transform="rotate(R, CX, CY)"` added when `rotation` is present

### Determinism Guarantee

For any valid input `I`:
```
generate(I).svg === generate(I).svg  // always true, byte-for-byte
```

Two inputs that differ only in unknown fields produce identical output.
