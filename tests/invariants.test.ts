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
