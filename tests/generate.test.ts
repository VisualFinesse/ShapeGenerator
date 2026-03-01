import { describe, it, expect } from "vitest";
import { generate } from "../src/generate.js";
import type { GeneratorInput } from "../src/types.js";

// Replay bundle: seed 42, 4 shapes
const replayInput: GeneratorInput = {
  seed: 42,
  canvas: { width: 500, height: 500 },
  shapes: [
    { type: "square", x: 100, y: 100, size: 80 },
    { type: "circle", x: 250, y: 250, size: 60 },
    { type: "triangle", x: 400, y: 150, size: 70 },
    { type: "rectangle", x: 200, y: 400, width: 120, height: 50 },
  ],
};

describe("US1-AS1: 4-shape replay bundle", () => {
  it("returns shapeCount === 4", () => {
    const output = generate(replayInput);
    expect(output.metadata.shapeCount).toBe(4);
  });

  it("SVG contains 4 shape elements", () => {
    const output = generate(replayInput);
    // Count self-closing tags that are shape elements
    const shapeTagMatches = output.svg.match(/<(rect|circle|polygon|path) /g);
    expect(shapeTagMatches).toHaveLength(4);
  });
});

describe("US1-AS2: determinism — same input produces identical output", () => {
  it("two consecutive calls produce byte-for-byte identical strings", () => {
    const out1 = generate(replayInput);
    const out2 = generate(replayInput);
    expect(out1.svg).toBe(out2.svg);
  });
});

describe("US1-AS3: shape IDs contain type string", () => {
  it("square ID contains 'square'", () => {
    const output = generate(replayInput);
    expect(output.svg).toContain('id="s42-square-0"');
  });

  it("circle ID contains 'circle'", () => {
    const output = generate(replayInput);
    expect(output.svg).toContain('id="s42-circle-1"');
  });

  it("triangle ID contains 'triangle'", () => {
    const output = generate(replayInput);
    expect(output.svg).toContain('id="s42-triangle-2"');
  });

  it("rectangle ID contains 'rectangle'", () => {
    const output = generate(replayInput);
    expect(output.svg).toContain('id="s42-rectangle-3"');
  });
});

describe("Edge cases", () => {
  it("empty shapes array produces valid SVG with shapeCount=0", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 100, height: 100 },
      shapes: [],
    };
    const output = generate(input);
    expect(output.metadata.shapeCount).toBe(0);
    expect(output.svg).toContain("<svg");
    expect(output.svg).toContain("</svg>");
    // No shape elements
    expect(output.svg).not.toMatch(/<(rect|circle|polygon|path) /);
  });

  it("shape beyond canvas renders without error", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 100, height: 100 },
      shapes: [{ type: "square", x: 500, y: 500, size: 200 }],
    };
    expect(() => generate(input)).not.toThrow();
    const output = generate(input);
    expect(output.metadata.shapeCount).toBe(1);
  });

  it("rotation: 360 produces transform attribute", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 100, height: 100 },
      shapes: [{ type: "square", x: 50, y: 50, size: 40, rotation: 360 }],
    };
    const output = generate(input);
    expect(output.svg).toContain('transform="rotate(360');
  });

  it("duplicate shapes get unique IDs via distinct index", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 100, height: 100 },
      shapes: [
        { type: "square", x: 50, y: 50, size: 40 },
        { type: "square", x: 50, y: 50, size: 40 },
      ],
    };
    const output = generate(input);
    expect(output.svg).toContain('id="s1-square-0"');
    expect(output.svg).toContain('id="s1-square-1"');
  });
});

// US2 Canonicalization acceptance scenarios
describe("US2-AS1: extra fields have no effect on output", () => {
  it("input with extra top-level fields equals clean input output", () => {
    const cleanOutput = generate(replayInput);
    const dirtyInput = { ...replayInput, theme: "dark" } as unknown as GeneratorInput;
    const dirtyOutput = generate(dirtyInput);
    expect(dirtyOutput.svg).toBe(cleanOutput.svg);
  });
});

describe("US2-AS2: no trace of unknown field names in output SVG", () => {
  it("unknown fields are not present in SVG string", () => {
    const dirtyInput = {
      ...replayInput,
      unknownField: "secret",
      shapes: replayInput.shapes.map((s) => ({ ...s, myProp: "xyz" })),
    } as unknown as GeneratorInput;
    const output = generate(dirtyInput);
    expect(output.svg).not.toContain("unknownField");
    expect(output.svg).not.toContain("myProp");
    expect(output.svg).not.toContain("secret");
    expect(output.svg).not.toContain("xyz");
  });
});

describe("US2-AS3: top-level theme field has zero effect", () => {
  it("adding theme does not change SVG output", () => {
    const clean = generate(replayInput);
    const withTheme = generate({ ...replayInput, theme: "dark" } as unknown as GeneratorInput);
    expect(withTheme.svg).toBe(clean.svg);
    expect(withTheme.metadata.shapeCount).toBe(clean.metadata.shapeCount);
  });
});

// US3 Validation acceptance scenarios
describe("US3-AS1: x: NaN throws with field path and NaN", () => {
  it("throws error mentioning shapes[0].x and NaN", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 100, height: 100 },
      shapes: [{ type: "square", x: NaN, y: 50, size: 40 }],
    };
    expect(() => generate(input)).toThrow(/shapes\[0\]\.x/);
    expect(() => generate(input)).toThrow(/NaN/);
  });
});

describe("US3-AS2: x: Infinity throws", () => {
  it("throws error for Infinity x", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 100, height: 100 },
      shapes: [{ type: "square", x: Infinity, y: 50, size: 40 }],
    };
    expect(() => generate(input)).toThrow(/shapes\[0\]\.x/);
  });
});

describe("US3-AS3: square with wrong param (missing size after canonicalize) throws", () => {
  it("throws when square lacks size field", () => {
    const input = {
      seed: 1,
      canvas: { width: 100, height: 100 },
      shapes: [{ type: "square", x: 50, y: 50, width: 80 }],
    } as unknown as GeneratorInput;
    expect(() => generate(input)).toThrow(/size/);
  });
});

describe("US3-AS4: type 'hexagon' throws listing valid types", () => {
  it("throws with message listing valid types", () => {
    const input = {
      seed: 1,
      canvas: { width: 100, height: 100 },
      shapes: [{ type: "hexagon", x: 50, y: 50, size: 40 }],
    } as unknown as GeneratorInput;
    const fn = () => generate(input);
    expect(fn).toThrow(/hexagon/);
    expect(fn).toThrow(/square/);
    expect(fn).toThrow(/circle/);
    expect(fn).toThrow(/triangle/);
    expect(fn).toThrow(/rectangle/);
  });
});

describe("US3-AS5: canvas.width: 0 throws", () => {
  it("throws when canvas width is zero", () => {
    const input: GeneratorInput = {
      seed: 1,
      canvas: { width: 0, height: 100 },
      shapes: [{ type: "square", x: 50, y: 50, size: 40 }],
    };
    expect(() => generate(input)).toThrow(/canvas\.width/);
  });
});
