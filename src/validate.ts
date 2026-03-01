import type { GeneratorInput, Shape } from "./types.js";

const SUPPORTED_TYPES = [
  "square", "rectangle", "circle", "triangle",
  "trapezoid", "octagon", "polygon", "oval", "blob",
] as const;

function checkFinite(value: number, path: string): void {
  if (typeof value !== "number") return;
  if (Number.isNaN(value)) {
    throw new Error(`Invalid numeric value in ${path}: NaN`);
  }
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric value in ${path}: ${value}`);
  }
}

function isPositiveFinite(value: number, path: string): void {
  checkFinite(value, path);
  if (value <= 0) {
    throw new Error(`${path} must be positive, got ${value}`);
  }
}

function validateGradient(gradient: unknown, fieldName: string): void {
  const g = gradient as { type?: unknown; stops?: unknown };
  if (g.type !== "linear" && g.type !== "radial") {
    throw new Error(`gradient type must be 'linear' or 'radial'`);
  }
  if (!Array.isArray(g.stops) || (g.stops as unknown[]).length === 0) {
    throw new Error(`${fieldName}.stops must have at least one stop`);
  }
  for (const stop of g.stops as { offset?: unknown; color?: unknown; opacity?: unknown }[]) {
    if (typeof stop.offset !== "number" || !Number.isFinite(stop.offset) || stop.offset < 0 || stop.offset > 1) {
      throw new Error(`gradient stop offset must be a number between 0 and 1`);
    }
    if (typeof stop.color !== "string") {
      throw new Error(`gradient stop color must be a string`);
    }
    if (stop.opacity !== undefined) {
      if (typeof stop.opacity !== "number" || !Number.isFinite(stop.opacity) || stop.opacity < 0 || stop.opacity > 1) {
        throw new Error(`gradient stop opacity must be a number between 0 and 1`);
      }
    }
  }
  if (g.type === "linear") {
    const lg = g as { x1?: unknown; y1?: unknown; x2?: unknown; y2?: unknown };
    for (const val of [lg.x1, lg.y1, lg.x2, lg.y2]) {
      if (val !== undefined && (typeof val !== "number" || !Number.isFinite(val))) {
        throw new Error(`gradient coordinate must be a finite number`);
      }
    }
  } else {
    const rg = g as { cx?: unknown; cy?: unknown; r?: unknown };
    for (const val of [rg.cx, rg.cy]) {
      if (val !== undefined && (typeof val !== "number" || !Number.isFinite(val))) {
        throw new Error(`gradient coordinate must be a finite number`);
      }
    }
    if (rg.r !== undefined) {
      if (typeof rg.r !== "number" || !Number.isFinite(rg.r) || rg.r <= 0) {
        throw new Error(`gradient r must be a positive finite number`);
      }
    }
  }
}

function validateShape(shape: Shape, index: number): void {
  const prefix = `shapes[${index}]`;

  // Type check
  if (!SUPPORTED_TYPES.includes(shape.type as typeof SUPPORTED_TYPES[number])) {
    throw new Error(
      `Invalid shape type "${shape.type}" in ${prefix}. Must be one of: ${SUPPORTED_TYPES.join(", ")}`
    );
  }

  // x and y required
  if (shape.x === undefined || shape.x === null) {
    throw new Error(`Missing required field ${prefix}.x`);
  }
  if (shape.y === undefined || shape.y === null) {
    throw new Error(`Missing required field ${prefix}.y`);
  }

  // Numeric safety on x, y, rotation
  checkFinite(shape.x, `${prefix}.x`);
  checkFinite(shape.y, `${prefix}.y`);
  if (shape.rotation !== undefined) {
    checkFinite(shape.rotation, `${prefix}.rotation`);
  }

  // Opacity validation (Stage 3)
  if (shape.opacity !== undefined) {
    checkFinite(shape.opacity, `${prefix}.opacity`);
    if (shape.opacity < 0 || shape.opacity > 1) {
      throw new Error(`opacity must be a number between 0 and 1`);
    }
  }

  // strokeWidth validation (Stage 3)
  if (shape.strokeWidth !== undefined) {
    if (typeof shape.strokeWidth !== "number" || !Number.isFinite(shape.strokeWidth) || shape.strokeWidth <= 0) {
      throw new Error(`strokeWidth must be a positive finite number`);
    }
  }

  // bezier/bezierDirection validation (Stage 3)
  if (shape.bezier !== undefined) {
    checkFinite(shape.bezier, `${prefix}.bezier`);
    if (shape.bezier < 0 || shape.bezier > 1) {
      throw new Error(`bezier must be a number between 0 and 1`);
    }
  }
  if (shape.bezierDirection !== undefined) {
    if (shape.bezierDirection !== "out" && shape.bezierDirection !== "in") {
      throw new Error(`bezierDirection must be "out" or "in"`);
    }
  }

  // Gradient validation (Stage 3)
  if (shape.fillGradient !== undefined) validateGradient(shape.fillGradient, "fillGradient");
  if (shape.strokeGradient !== undefined) validateGradient(shape.strokeGradient, "strokeGradient");

  // Variation field validation (optional on all shape types)
  if (shape.distort !== undefined) {
    checkFinite(shape.distort, `${prefix}.distort`);
    if (shape.distort < 0 || shape.distort > 1) {
      throw new Error(`distort must be a number between 0 and 1`);
    }
  }
  if (shape.sizeVariance !== undefined) {
    checkFinite(shape.sizeVariance, `${prefix}.sizeVariance`);
    if (shape.sizeVariance < 0 || shape.sizeVariance > 1) {
      throw new Error(`sizeVariance must be a number between 0 and 1`);
    }
  }
  if (shape.clamp !== undefined) {
    const w = shape.clamp.width;
    const h = shape.clamp.height;
    if (typeof w !== "number" || !Number.isFinite(w) || w <= 0) {
      throw new Error(`clamp.width must be a positive finite number`);
    }
    if (typeof h !== "number" || !Number.isFinite(h) || h <= 0) {
      throw new Error(`clamp.height must be a positive finite number`);
    }
  }

  // Per-type validation
  switch (shape.type) {
    case "square": {
      if (shape.size === undefined || shape.size === null) {
        throw new Error(`Missing required field ${prefix}.size for square`);
      }
      isPositiveFinite(shape.size, `${prefix}.size`);
      break;
    }
    case "circle": {
      if (shape.size === undefined || shape.size === null) {
        throw new Error(`Missing required field ${prefix}.size for circle`);
      }
      isPositiveFinite(shape.size, `${prefix}.size`);
      break;
    }
    case "triangle": {
      if (shape.size === undefined || shape.size === null) {
        throw new Error(`Missing required field ${prefix}.size for triangle`);
      }
      isPositiveFinite(shape.size, `${prefix}.size`);
      break;
    }
    case "rectangle": {
      if (shape.width === undefined || shape.width === null) {
        throw new Error(`Missing required field ${prefix}.width for rectangle`);
      }
      if (shape.height === undefined || shape.height === null) {
        throw new Error(`Missing required field ${prefix}.height for rectangle`);
      }
      isPositiveFinite(shape.width, `${prefix}.width`);
      isPositiveFinite(shape.height, `${prefix}.height`);
      break;
    }
    case "trapezoid": {
      if (shape.topWidth === undefined || shape.topWidth === null) {
        throw new Error(`Missing required field ${prefix}.topWidth for trapezoid`);
      }
      if (shape.bottomWidth === undefined || shape.bottomWidth === null) {
        throw new Error(`Missing required field ${prefix}.bottomWidth for trapezoid`);
      }
      if (shape.height === undefined || shape.height === null) {
        throw new Error(`Missing required field ${prefix}.height for trapezoid`);
      }
      isPositiveFinite(shape.topWidth, `${prefix}.topWidth`);
      isPositiveFinite(shape.bottomWidth, `${prefix}.bottomWidth`);
      isPositiveFinite(shape.height, `${prefix}.height`);
      break;
    }
    case "octagon": {
      if (shape.size === undefined || shape.size === null) {
        throw new Error(`Missing required field ${prefix}.size for octagon`);
      }
      isPositiveFinite(shape.size, `${prefix}.size`);
      break;
    }
    case "polygon": {
      if (shape.sides === undefined || shape.sides === null) {
        throw new Error(`Missing required field ${prefix}.sides for polygon`);
      }
      if (shape.size === undefined || shape.size === null) {
        throw new Error(`Missing required field ${prefix}.size for polygon`);
      }
      checkFinite(shape.sides, `${prefix}.sides`);
      if (!Number.isInteger(shape.sides) || shape.sides < 3) {
        throw new Error(`${prefix}.sides must be an integer >= 3, got ${shape.sides}`);
      }
      isPositiveFinite(shape.size, `${prefix}.size`);
      break;
    }
    case "oval": {
      if (shape.width === undefined || shape.width === null) {
        throw new Error(`Missing required field ${prefix}.width for oval`);
      }
      if (shape.height === undefined || shape.height === null) {
        throw new Error(`Missing required field ${prefix}.height for oval`);
      }
      isPositiveFinite(shape.width, `${prefix}.width`);
      isPositiveFinite(shape.height, `${prefix}.height`);
      break;
    }
    case "blob": {
      if (shape.size === undefined || shape.size === null) {
        throw new Error(`Missing required field ${prefix}.size for blob`);
      }
      isPositiveFinite(shape.size, `${prefix}.size`);
      if (shape.points !== undefined) {
        checkFinite(shape.points, `${prefix}.points`);
        if (!Number.isInteger(shape.points) || shape.points < 3) {
          throw new Error(`${prefix}.points must be an integer >= 3, got ${shape.points}`);
        }
      }
      break;
    }
  }
}

export function validate(input: GeneratorInput): void {
  // seed required
  if (input.seed === undefined || input.seed === null) {
    throw new Error("Missing required field: seed");
  }
  checkFinite(input.seed, "seed");

  // canvas validation
  if (!input.canvas) {
    throw new Error("Missing required field: canvas");
  }
  checkFinite(input.canvas.width, "canvas.width");
  checkFinite(input.canvas.height, "canvas.height");
  if (input.canvas.width <= 0) {
    throw new Error(`canvas.width must be > 0, got ${input.canvas.width}`);
  }
  if (input.canvas.height <= 0) {
    throw new Error(`canvas.height must be > 0, got ${input.canvas.height}`);
  }

  // shapes validation
  for (let i = 0; i < input.shapes.length; i++) {
    validateShape(input.shapes[i], i);
  }
}
