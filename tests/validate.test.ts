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

// ── Stage 1.5 validation tests ─────────────────────────────────────────────

describe("T023: Trapezoid validation", () => {
  it("throws on missing topWidth", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "trapezoid", x: 50, y: 50, bottomWidth: 80, height: 40 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/topWidth/);
  });

  it("throws on missing bottomWidth", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "trapezoid", x: 50, y: 50, topWidth: 40, height: 40 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/bottomWidth/);
  });

  it("throws on missing height", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "trapezoid", x: 50, y: 50, topWidth: 40, bottomWidth: 80 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/height/);
  });

  it("throws on topWidth: 0", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "trapezoid", x: 50, y: 50, topWidth: 0, bottomWidth: 80, height: 40 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/topWidth/);
  });

  it("throws on topWidth: -5", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "trapezoid", x: 50, y: 50, topWidth: -5, bottomWidth: 80, height: 40 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/topWidth/);
  });

  it("throws on bottomWidth: NaN", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "trapezoid", x: 50, y: 50, topWidth: 40, bottomWidth: NaN, height: 40 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/bottomWidth/);
  });

  it("throws on height: Infinity", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "trapezoid", x: 50, y: 50, topWidth: 40, bottomWidth: 80, height: Infinity }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/height/);
  });

  it("does not throw for valid trapezoid", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "trapezoid", x: 50, y: 50, topWidth: 40, bottomWidth: 80, height: 40 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).not.toThrow();
  });
});

describe("T024: Octagon validation", () => {
  it("throws on missing size", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "octagon", x: 50, y: 50 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/size/);
  });

  it("throws on size: 0", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "octagon", x: 50, y: 50, size: 0 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/size/);
  });

  it("throws on size: -1", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "octagon", x: 50, y: 50, size: -1 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/size/);
  });

  it("throws on size: NaN", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "octagon", x: 50, y: 50, size: NaN }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/size/);
    expect(() => validate(input)).toThrow(/NaN/);
  });
});

describe("T025: Polygon validation", () => {
  it("throws on sides: 2 (less than 3)", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "polygon", x: 50, y: 50, sides: 2, size: 30 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/sides/);
  });

  it("throws on sides: 0", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "polygon", x: 50, y: 50, sides: 0, size: 30 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/sides/);
  });

  it("throws on sides: -1", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "polygon", x: 50, y: 50, sides: -1, size: 30 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/sides/);
  });

  it("throws on sides: 2.5 (non-integer)", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "polygon", x: 50, y: 50, sides: 2.5, size: 30 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/sides/);
  });

  it("throws on sides: NaN", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "polygon", x: 50, y: 50, sides: NaN, size: 30 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/sides/);
  });

  it("throws on missing sides", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "polygon", x: 50, y: 50, size: 30 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/sides/);
  });

  it("throws on missing size", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "polygon", x: 50, y: 50, sides: 5 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/size/);
  });

  it("throws on size: 0", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "polygon", x: 50, y: 50, sides: 5, size: 0 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/size/);
  });

  it("does not throw for valid polygon (sides=3)", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "polygon", x: 50, y: 50, sides: 3, size: 30 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).not.toThrow();
  });
});

describe("T026: Oval validation", () => {
  it("throws on missing width", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "oval", x: 50, y: 50, height: 40 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/width/);
  });

  it("throws on missing height", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "oval", x: 50, y: 50, width: 80 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/height/);
  });

  it("throws on width: 0", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "oval", x: 50, y: 50, width: 0, height: 40 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/width/);
  });

  it("throws on height: -1", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "oval", x: 50, y: 50, width: 80, height: -1 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/height/);
  });

  it("throws on width: Infinity", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "oval", x: 50, y: 50, width: Infinity, height: 40 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/width/);
  });

  it("throws on height: NaN", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "oval", x: 50, y: 50, width: 80, height: NaN }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/height/);
    expect(() => validate(input)).toThrow(/NaN/);
  });
});

describe("T027: Blob validation", () => {
  it("throws on missing size", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "blob", x: 50, y: 50 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/size/);
  });

  it("throws on size: 0", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "blob", x: 50, y: 50, size: 0 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/size/);
  });

  it("throws on size: NaN", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "blob", x: 50, y: 50, size: NaN }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/size/);
    expect(() => validate(input)).toThrow(/NaN/);
  });

  it("throws on points: 2 (less than 3)", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "blob", x: 50, y: 50, size: 30, points: 2 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/points/);
  });

  it("throws on points: 1", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "blob", x: 50, y: 50, size: 30, points: 1 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/points/);
  });

  it("throws on points: 2.9 (non-integer)", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "blob", x: 50, y: 50, size: 30, points: 2.9 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/points/);
  });

  it("throws on points: NaN", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "blob", x: 50, y: 50, size: 30, points: NaN }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).toThrow(/points/);
  });

  it("does not throw for valid blob (no points = uses default)", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "blob", x: 50, y: 50, size: 30 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).not.toThrow();
  });

  it("does not throw for points: 3 (minimum valid)", () => {
    const input = {
      seed: 1, canvas: { width: 100, height: 100 },
      shapes: [{ type: "blob", x: 50, y: 50, size: 30, points: 3 }],
    } as unknown as GeneratorInput;
    expect(() => validate(input)).not.toThrow();
  });
});
