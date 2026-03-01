import { describe, it, expect } from "vitest";
import { generate } from "../src/generate.js";
import type { GeneratorInput } from "../src/types.js";

const baseInput: GeneratorInput = {
  seed: 42,
  canvas: { width: 500, height: 500 },
  shapes: [
    { type: "square", x: 100, y: 100, size: 80 },
    { type: "circle", x: 250, y: 250, size: 60 },
    { type: "triangle", x: 400, y: 150, size: 70 },
    { type: "rectangle", x: 200, y: 400, width: 120, height: 50 },
  ],
};

describe("INV-1: Determinism", () => {
  it("100-call loop produces identical output every time", () => {
    const first = generate(baseInput).svg;
    for (let i = 1; i < 100; i++) {
      const result = generate(baseInput).svg;
      expect(result).toBe(first);
    }
  });
});

describe("INV-3: Valid SVG root", () => {
  it("output contains <svg opening tag", () => {
    const output = generate(baseInput);
    expect(output.svg).toContain("<svg");
  });

  it("svg has xmlns attribute", () => {
    const output = generate(baseInput);
    expect(output.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("svg has width attribute", () => {
    const output = generate(baseInput);
    expect(output.svg).toContain('width="500"');
  });

  it("svg has height attribute", () => {
    const output = generate(baseInput);
    expect(output.svg).toContain('height="500"');
  });

  it("svg has viewBox attribute", () => {
    const output = generate(baseInput);
    expect(output.svg).toContain('viewBox="0 0 500 500"');
  });
});

describe("INV-4: Shape count consistency", () => {
  it("element count equals metadata.shapeCount equals input.shapes.length", () => {
    const output = generate(baseInput);
    const shapeCount = baseInput.shapes.length;
    expect(output.metadata.shapeCount).toBe(shapeCount);
    const shapeTagMatches = output.svg.match(/<(rect|circle|polygon|path) /g);
    expect(shapeTagMatches).toHaveLength(shapeCount);
  });

  it("works for single shape", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 100, height: 100 },
      shapes: [{ type: "circle", x: 50, y: 50, size: 40 }],
    };
    const output = generate(input);
    expect(output.metadata.shapeCount).toBe(1);
    const shapeTagMatches = output.svg.match(/<(rect|circle|polygon|path) /g);
    expect(shapeTagMatches).toHaveLength(1);
  });
});

describe("INV-5: Shape identity — each ID contains its type string", () => {
  it("each id attribute contains the shape type string", () => {
    const output = generate(baseInput);
    for (let i = 0; i < baseInput.shapes.length; i++) {
      const shape = baseInput.shapes[i];
      expect(output.svg).toContain(`id="s42-${shape.type}-${i}"`);
    }
  });
});

describe("INV-6: Default semantic output", () => {
  it("default mode uses <rect, <circle, <polygon — no <path", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 500, height: 500 },
      shapes: [
        { type: "square", x: 100, y: 100, size: 80 },
        { type: "circle", x: 250, y: 250, size: 60 },
        { type: "triangle", x: 400, y: 150, size: 70 },
        { type: "rectangle", x: 200, y: 400, width: 120, height: 50 },
      ],
    };
    const output = generate(input);
    expect(output.svg).toContain("<rect ");
    expect(output.svg).toContain("<circle ");
    expect(output.svg).toContain("<polygon ");
    expect(output.svg).not.toContain("<path ");
  });

  it("explicit outputMode:'semantic' uses semantic tags", () => {
    const input: GeneratorInput = {
      ...baseInput,
      outputMode: "semantic",
    };
    const output = generate(input);
    expect(output.svg).not.toContain("<path ");
  });
});

describe("INV-7: Path-only output", () => {
  it("outputMode:'path' produces only <path elements, no semantic tags", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 500, height: 500 },
      shapes: [
        { type: "square", x: 100, y: 100, size: 80 },
        { type: "circle", x: 250, y: 250, size: 60 },
        { type: "triangle", x: 400, y: 150, size: 70 },
        { type: "rectangle", x: 200, y: 400, width: 120, height: 50 },
      ],
      outputMode: "path",
    };
    const output = generate(input);
    const pathMatches = output.svg.match(/<path /g);
    expect(pathMatches).toHaveLength(4);
    expect(output.svg).not.toContain("<rect ");
    expect(output.svg).not.toContain("<circle ");
    expect(output.svg).not.toContain("<polygon ");
  });
});

// ── Stage 1.5 invariants ───────────────────────────────────────────────────

const advancedInput: GeneratorInput = {
  seed: 7,
  canvas: { width: 400, height: 400 },
  shapes: [
    { type: "trapezoid", x: 80,  y: 80,  topWidth: 40, bottomWidth: 80, height: 50 },
    { type: "octagon",   x: 200, y: 80,  size: 40 },
    { type: "polygon",   x: 320, y: 80,  sides: 5, size: 35 },
    { type: "oval",      x: 80,  y: 220, width: 80, height: 40 },
    { type: "blob",      x: 250, y: 220, size: 50 },
  ],
};

describe("INV-1 (Stage 1.5): Determinism with advanced shapes", () => {
  it("10-call loop with new shapes produces identical SVG every time", () => {
    const first = generate(advancedInput).svg;
    for (let i = 1; i < 10; i++) {
      expect(generate(advancedInput).svg).toBe(first);
    }
  });
});

describe("INV-4 (Stage 1.5): Shape count consistency with mixed shapes", () => {
  it("shapeCount matches shapes.length for advanced types", () => {
    const output = generate(advancedInput);
    expect(output.metadata.shapeCount).toBe(5);
  });

  it("element count matches shapeCount for mixed old+new shapes", () => {
    const mixed: GeneratorInput = {
      seed: 3,
      canvas: { width: 400, height: 400 },
      shapes: [
        { type: "square",    x: 50,  y: 50,  size: 40 },
        { type: "trapezoid", x: 150, y: 50,  topWidth: 30, bottomWidth: 60, height: 40 },
        { type: "oval",      x: 250, y: 50,  width: 60, height: 30 },
        { type: "blob",      x: 350, y: 50,  size: 30 },
      ],
    };
    const output = generate(mixed);
    expect(output.metadata.shapeCount).toBe(4);
    // Count all shape element tags (including ellipse for oval)
    const tagMatches = output.svg.match(/<(rect|circle|polygon|path|ellipse) /g);
    expect(tagMatches).toHaveLength(4);
  });
});

describe("INV-5 (Stage 1.5): Shape identity for new types", () => {
  it("each new shape ID contains its type string and correct index", () => {
    const output = generate(advancedInput);
    const types = ["trapezoid", "octagon", "polygon", "oval", "blob"];
    types.forEach((type, i) => {
      expect(output.svg).toContain(`id="s7-${type}-${i}"`);
    });
  });
});

describe("INV-3 (Stage 1.5): Valid SVG root with advanced shapes", () => {
  it("SVG starts with <svg xmlns and ends with </svg>", () => {
    const output = generate(advancedInput);
    expect(output.svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(output.svg).toMatch(/<\/svg>$/);
  });
});
