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

// ── Stage 1.5 acceptance scenarios ────────────────────────────────────────────

// US1 — all 5 new shape types
const advancedInput: GeneratorInput = {
  seed: 42,
  canvas: { width: 400, height: 400 },
  shapes: [
    { type: "trapezoid", x: 80,  y: 80,  topWidth: 40, bottomWidth: 80, height: 50 },
    { type: "octagon",   x: 200, y: 80,  size: 40 },
    { type: "polygon",   x: 320, y: 80,  sides: 5, size: 35 },
    { type: "oval",      x: 80,  y: 220, width: 80, height: 40 },
    { type: "blob",      x: 250, y: 220, size: 50, points: 6 },
  ],
};

describe("Stage1.5-US1-AS1: shapeCount equals number of new shapes", () => {
  it("returns shapeCount === 5 for 5 advanced shapes", () => {
    const output = generate(advancedInput);
    expect(output.metadata.shapeCount).toBe(5);
  });
});

describe("Stage1.5-US1-AS2: correct SVG element types in semantic mode", () => {
  it("trapezoid renders as <polygon>", () => {
    const output = generate(advancedInput);
    expect(output.svg).toContain("<polygon ");
  });

  it("oval renders as <ellipse>", () => {
    const output = generate(advancedInput);
    expect(output.svg).toContain("<ellipse ");
  });

  it("blob renders as <path>", () => {
    const output = generate(advancedInput);
    expect(output.svg).toContain("<path ");
  });
});

describe("Stage1.5-US1-AS3: determinism with advanced shapes", () => {
  it("two consecutive calls with advanced shapes produce identical SVG", () => {
    const out1 = generate(advancedInput);
    const out2 = generate(advancedInput);
    expect(out1.svg).toBe(out2.svg);
  });
});

describe("Stage1.5-US1-AS4: shape IDs for new types", () => {
  it("trapezoid ID follows s<seed>-trapezoid-<index> format", () => {
    const output = generate(advancedInput);
    expect(output.svg).toContain('id="s42-trapezoid-0"');
  });

  it("octagon ID follows s<seed>-octagon-<index> format", () => {
    const output = generate(advancedInput);
    expect(output.svg).toContain('id="s42-octagon-1"');
  });

  it("polygon ID follows s<seed>-polygon-<index> format", () => {
    const output = generate(advancedInput);
    expect(output.svg).toContain('id="s42-polygon-2"');
  });

  it("oval ID follows s<seed>-oval-<index> format", () => {
    const output = generate(advancedInput);
    expect(output.svg).toContain('id="s42-oval-3"');
  });

  it("blob ID follows s<seed>-blob-<index> format", () => {
    const output = generate(advancedInput);
    expect(output.svg).toContain('id="s42-blob-4"');
  });
});

// US2 — path mode for new shapes
describe("Stage1.5-US2: outputMode path produces only <path> elements for new shapes", () => {
  it("all new shapes in path mode render as <path>", () => {
    const output = generate({ ...advancedInput, outputMode: "path" });
    expect(output.svg).not.toContain("<polygon ");
    expect(output.svg).not.toContain("<ellipse ");
    // All 5 elements should be paths
    const pathMatches = output.svg.match(/<path /g);
    expect(pathMatches).toHaveLength(5);
  });

  it("blob renders as <path> in semantic mode (always)", () => {
    const output = generate({
      seed: 1,
      canvas: { width: 200, height: 200 },
      outputMode: "semantic",
      shapes: [{ type: "blob", x: 100, y: 100, size: 40 }],
    });
    expect(output.svg).toContain("<path ");
    expect(output.svg).not.toContain("<polygon ");
  });

  it("blob renders as <path> in path mode (same as semantic)", () => {
    const semantic = generate({
      seed: 5,
      canvas: { width: 200, height: 200 },
      outputMode: "semantic",
      shapes: [{ type: "blob", x: 100, y: 100, size: 40 }],
    });
    const path = generate({
      seed: 5,
      canvas: { width: 200, height: 200 },
      outputMode: "path",
      shapes: [{ type: "blob", x: 100, y: 100, size: 40 }],
    });
    expect(semantic.svg).toBe(path.svg);
  });
});
