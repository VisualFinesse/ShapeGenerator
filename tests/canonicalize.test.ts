import { describe, it, expect } from "vitest";
import { canonicalize } from "../src/canonicalize.js";
import { generate } from "../src/generate.js";
import type { GeneratorInput } from "../src/types.js";

const validInput: GeneratorInput = {
  seed: 42,
  canvas: { width: 400, height: 300 },
  shapes: [
    { type: "square", x: 100, y: 100, size: 80 },
    { type: "rectangle", x: 200, y: 150, width: 120, height: 60 },
    { type: "circle", x: 300, y: 100, size: 50 },
    { type: "triangle", x: 150, y: 250, size: 70 },
  ],
};

describe("canonicalize - top-level unknown fields", () => {
  it("strips unknown top-level fields", () => {
    const input = { ...validInput, theme: "dark", version: "1.0" } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result).not.toHaveProperty("theme");
    expect(result).not.toHaveProperty("version");
  });

  it("preserves all required top-level fields", () => {
    const result = canonicalize(validInput);
    expect(result).toHaveProperty("seed", 42);
    expect(result).toHaveProperty("canvas");
    expect(result).toHaveProperty("shapes");
  });

  it("preserves outputMode when present", () => {
    const input: GeneratorInput = { ...validInput, outputMode: "path" };
    const result = canonicalize(input);
    expect(result.outputMode).toBe("path");
  });

  it("omits outputMode when not present in input", () => {
    const result = canonicalize(validInput);
    expect(result.outputMode).toBeUndefined();
  });
});

describe("canonicalize - canvas unknown fields", () => {
  it("strips unknown canvas fields", () => {
    const input = {
      ...validInput,
      canvas: { width: 400, height: 300, background: "blue" } as unknown as GeneratorInput["canvas"],
    };
    const result = canonicalize(input);
    expect(result.canvas).not.toHaveProperty("background");
  });

  it("preserves canvas width and height", () => {
    const result = canonicalize(validInput);
    expect(result.canvas.width).toBe(400);
    expect(result.canvas.height).toBe(300);
  });
});

describe("canonicalize - shape unknown fields", () => {
  it("strips unknown fields from square shapes", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "square", x: 50, y: 50, size: 40, foo: "bar" } as unknown as GeneratorInput["shapes"][0]],
    };
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("foo");
  });

  it("strips unknown fields from rectangle shapes", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "rectangle", x: 50, y: 50, width: 100, height: 60, extra: 99 } as unknown as GeneratorInput["shapes"][0]],
    };
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("extra");
  });

  it("strips unknown fields from circle shapes", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "circle", x: 50, y: 50, size: 40, color: "red" } as unknown as GeneratorInput["shapes"][0]],
    };
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("color");
  });

  it("strips unknown fields from triangle shapes", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "triangle", x: 50, y: 50, size: 40, label: "abc" } as unknown as GeneratorInput["shapes"][0]],
    };
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("label");
  });

  it("preserves allowed square shape fields", () => {
    const result = canonicalize(validInput);
    const sq = result.shapes[0];
    expect(sq.type).toBe("square");
    expect(sq.x).toBe(100);
    expect(sq.y).toBe(100);
    if (sq.type === "square") expect(sq.size).toBe(80);
  });

  it("preserves rotation when present", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "square", x: 50, y: 50, size: 40, rotation: 45 }],
    };
    const result = canonicalize(input);
    expect(result.shapes[0].rotation).toBe(45);
  });

  it("omits rotation when not present", () => {
    const result = canonicalize(validInput);
    expect(result.shapes[0].rotation).toBeUndefined();
  });
});

describe("US2-AS1: outputs with/without extra fields are strictly equal", () => {
  it("generate() with extra fields equals generate() without", () => {
    const cleanOutput = generate(validInput);
    const dirtyInput = {
      ...validInput,
      theme: "dark",
      shapes: validInput.shapes.map((s) => ({ ...s, foo: 1 })),
    } as unknown as GeneratorInput;
    const dirtyOutput = generate(dirtyInput);
    expect(dirtyOutput.svg).toBe(cleanOutput.svg);
  });
});

describe("US2-AS2: no trace of unknown field names in SVG string", () => {
  it("unknown field names do not appear in SVG output", () => {
    const input = {
      ...validInput,
      theme: "dark",
      shapes: validInput.shapes.map((s) => ({ ...s, myCustomField: "xyz" })),
    } as unknown as GeneratorInput;
    const output = generate(input);
    expect(output.svg).not.toContain("theme");
    expect(output.svg).not.toContain("myCustomField");
  });
});

describe("US2-AS3: top-level unknown fields have zero effect", () => {
  it("adding theme:'dark' does not change SVG output", () => {
    const clean = generate(validInput);
    const withTheme = generate({ ...validInput, theme: "dark" } as unknown as GeneratorInput);
    expect(withTheme.svg).toBe(clean.svg);
  });
});

// ── Stage 1.5: unknown-field drop for new shape types ─────────────────────

describe("T029: canonicalize strips unknown fields from new shape types", () => {
  it("drops extra field from trapezoid", () => {
    const input = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "trapezoid", x: 100, y: 100, topWidth: 40, bottomWidth: 80, height: 50, color: "red" }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("color");
  });

  it("preserves all allowed trapezoid fields", () => {
    const input = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "trapezoid", x: 100, y: 100, topWidth: 40, bottomWidth: 80, height: 50 }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    const s = result.shapes[0] as { type: string; x: number; y: number; topWidth: number; bottomWidth: number; height: number };
    expect(s.topWidth).toBe(40);
    expect(s.bottomWidth).toBe(80);
    expect(s.height).toBe(50);
  });

  it("drops extra field from octagon", () => {
    const input = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "octagon", x: 100, y: 100, size: 50, irrelevant: true }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("irrelevant");
  });

  it("drops extra field from polygon", () => {
    const input = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "polygon", x: 100, y: 100, sides: 5, size: 40, label: "penta" }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("label");
  });

  it("drops extra field from oval", () => {
    const input = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "oval", x: 100, y: 100, width: 80, height: 40, unknownField: 0.5 }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("unknownField");
  });

  it("drops extra field from blob", () => {
    const input = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "blob", x: 100, y: 100, size: 50, foo: 1, bar: "baz" }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("foo");
    expect(result.shapes[0]).not.toHaveProperty("bar");
  });

  it("blob preserves optional points field when present", () => {
    const input = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "blob", x: 100, y: 100, size: 50, points: 8 }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    const s = result.shapes[0] as { type: string; points?: number };
    expect(s.points).toBe(8);
  });

  it("blob omits points when not present", () => {
    const input = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "blob", x: 100, y: 100, size: 50 }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("points");
  });

  it("unknown fields in new shapes have no effect on SVG output", () => {
    const clean = {
      seed: 5, canvas: { width: 200, height: 200 },
      shapes: [{ type: "polygon", x: 100, y: 100, sides: 6, size: 40 }],
    } as unknown as GeneratorInput;
    const dirty = {
      seed: 5, canvas: { width: 200, height: 200 },
      shapes: [{ type: "polygon", x: 100, y: 100, sides: 6, size: 40, myProp: "xyz", extra: 99 }],
    } as unknown as GeneratorInput;
    expect(generate(clean).svg).toBe(generate(dirty).svg);
  });
});

// ── Stage 2: variation field canonicalization ─────────────────────────────

describe("Stage2 canonicalize: distort field", () => {
  it("preserves distort when present", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "square", x: 50, y: 50, size: 40, distort: 0.2 }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).toHaveProperty("distort", 0.2);
  });

  it("omits distort key when absent", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "square", x: 50, y: 50, size: 40 }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("distort");
  });

  it("unknown sibling fields are still dropped even when distort is present", () => {
    const clean = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "circle", x: 100, y: 100, size: 50, distort: 0.1 }],
    } as unknown as GeneratorInput;
    const dirty = {
      seed: 1, canvas: { width: 200, height: 200 },
      shapes: [{ type: "circle", x: 100, y: 100, size: 50, distort: 0.1, unknownProp: "abc" }],
    } as unknown as GeneratorInput;
    expect(generate(clean).svg).toBe(generate(dirty).svg);
  });
});

describe("Stage2 canonicalize: sizeVariance field", () => {
  it("preserves sizeVariance when present", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "circle", x: 50, y: 50, size: 40, sizeVariance: 0.3 }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).toHaveProperty("sizeVariance", 0.3);
  });

  it("omits sizeVariance key when absent", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "circle", x: 50, y: 50, size: 40 }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("sizeVariance");
  });
});

describe("Stage2 canonicalize: clamp field", () => {
  it("preserves clamp object atomically when present", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "octagon", x: 50, y: 50, size: 40, clamp: { width: 80, height: 80 } }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).toHaveProperty("clamp");
    expect((result.shapes[0] as { clamp: { width: number; height: number } }).clamp).toEqual({ width: 80, height: 80 });
  });

  it("omits clamp key when absent", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "octagon", x: 50, y: 50, size: 40 }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).not.toHaveProperty("clamp");
  });

  it("all three variation fields preserved together on trapezoid", () => {
    const input = {
      seed: 7, canvas: { width: 200, height: 200 },
      shapes: [{ type: "trapezoid", x: 100, y: 100, topWidth: 40, bottomWidth: 80, height: 60, distort: 0.15, sizeVariance: 0.2, clamp: { width: 120, height: 100 } }],
    } as unknown as GeneratorInput;
    const result = canonicalize(input);
    expect(result.shapes[0]).toHaveProperty("distort", 0.15);
    expect(result.shapes[0]).toHaveProperty("sizeVariance", 0.2);
    expect(result.shapes[0]).toHaveProperty("clamp");
  });
});
