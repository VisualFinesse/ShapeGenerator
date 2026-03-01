import { describe, it, expect } from "vitest";
import { validate } from "../src/validate.js";
import { generate } from "../src/generate.js";
import type { GeneratorInput } from "../src/types.js";

const validInput: GeneratorInput = {
  seed: 42,
  canvas: { width: 400, height: 300 },
  shapes: [{ type: "square", x: 100, y: 100, size: 80 }],
};

describe("US3-AS1: x: NaN throws with field path and NaN", () => {
  it("throws when shape x is NaN", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "square", x: NaN, y: 100, size: 80 }],
    };
    expect(() => validate(input)).toThrow(/shapes\[0\]\.x/);
    expect(() => validate(input)).toThrow(/NaN/);
  });
});

describe("US3-AS2: x: Infinity throws", () => {
  it("throws when shape x is Infinity", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "square", x: Infinity, y: 100, size: 80 }],
    };
    expect(() => validate(input)).toThrow(/shapes\[0\]\.x/);
  });

  it("throws when shape x is -Infinity", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "square", x: -Infinity, y: 100, size: 80 }],
    };
    expect(() => validate(input)).toThrow(/shapes\[0\]\.x/);
  });
});

describe("US3-AS3: square with missing size throws (after canonicalize strips wrong fields)", () => {
  it("throws when square has no size after canonicalization", () => {
    // A square with width instead of size — canonicalize strips width (wrong for square), leaving no size
    const input = {
      seed: 42,
      canvas: { width: 400, height: 300 },
      shapes: [{ type: "square", x: 100, y: 100, width: 80 }],
    } as unknown as GeneratorInput;
    // generate runs canonicalize then validate — size will be undefined
    expect(() => generate(input)).toThrow(/size/);
  });
});

describe("US3-AS4: type: 'hexagon' throws listing valid types", () => {
  it("throws with message listing valid types", () => {
    const input = {
      seed: 42,
      canvas: { width: 400, height: 300 },
      shapes: [{ type: "hexagon", x: 100, y: 100, size: 80 }],
    } as unknown as GeneratorInput;
    const fn = () => validate(input);
    expect(fn).toThrow(/hexagon/);
    // message should list the valid types
    expect(fn).toThrow(/square/);
    expect(fn).toThrow(/rectangle/);
    expect(fn).toThrow(/circle/);
    expect(fn).toThrow(/triangle/);
  });
});

describe("US3-AS5: canvas.width: 0 throws", () => {
  it("throws when canvas.width is 0", () => {
    const input: GeneratorInput = {
      ...validInput,
      canvas: { width: 0, height: 300 },
    };
    expect(() => validate(input)).toThrow(/canvas\.width/);
  });
});

describe("Additional validation edge cases", () => {
  it("throws on -Infinity in shape y", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "square", x: 100, y: -Infinity, size: 80 }],
    };
    expect(() => validate(input)).toThrow(/shapes\[0\]\.y/);
  });

  it("throws when y is missing (undefined)", () => {
    const input = {
      seed: 42,
      canvas: { width: 400, height: 300 },
      shapes: [{ type: "square", x: 100, size: 80 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/shapes\[0\]\.y/);
  });

  it("throws when canvas.height is 0", () => {
    const input: GeneratorInput = {
      ...validInput,
      canvas: { width: 400, height: 0 },
    };
    expect(() => validate(input)).toThrow(/canvas\.height/);
  });

  it("throws when canvas.height is negative", () => {
    const input: GeneratorInput = {
      ...validInput,
      canvas: { width: 400, height: -1 },
    };
    expect(() => validate(input)).toThrow(/canvas\.height/);
  });

  it("throws when circle size is negative", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "circle", x: 50, y: 50, size: -10 }],
    };
    expect(() => validate(input)).toThrow(/size/);
  });

  it("throws when triangle size is zero", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "triangle", x: 50, y: 50, size: 0 }],
    };
    expect(() => validate(input)).toThrow(/size/);
  });

  it("throws when rectangle width is negative", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "rectangle", x: 50, y: 50, width: -10, height: 60 }],
    };
    expect(() => validate(input)).toThrow(/width/);
  });

  it("throws when rectangle height is zero", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "rectangle", x: 50, y: 50, width: 100, height: 0 }],
    };
    expect(() => validate(input)).toThrow(/height/);
  });

  it("does not throw on valid input", () => {
    expect(() => validate(validInput)).not.toThrow();
  });

  it("validates multiple shapes — reports first error index", () => {
    const input: GeneratorInput = {
      seed: 42,
      canvas: { width: 400, height: 300 },
      shapes: [
        { type: "square", x: 100, y: 100, size: 80 },
        { type: "circle", x: NaN, y: 50, size: 40 },
      ],
    };
    expect(() => validate(input)).toThrow(/shapes\[1\]/);
  });

  it("throws when size is NaN", () => {
    const input: GeneratorInput = {
      ...validInput,
      shapes: [{ type: "square", x: 50, y: 50, size: NaN }],
    };
    expect(() => validate(input)).toThrow(/shapes\[0\]\.size/);
    expect(() => validate(input)).toThrow(/NaN/);
  });

  it("throws when canvas.width is NaN", () => {
    const input: GeneratorInput = {
      ...validInput,
      canvas: { width: NaN, height: 300 },
    };
    expect(() => validate(input)).toThrow(/canvas\.width/);
    expect(() => validate(input)).toThrow(/NaN/);
  });
});
