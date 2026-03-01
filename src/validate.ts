import type { GeneratorInput, Shape } from "./types.js";

const SUPPORTED_TYPES = ["square", "rectangle", "circle", "triangle"] as const;

function checkFinite(value: number, path: string): void {
  if (typeof value !== "number") return;
  if (Number.isNaN(value)) {
    throw new Error(`Invalid numeric value in ${path}: NaN`);
  }
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric value in ${path}: ${value}`);
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

  // Per-type validation
  switch (shape.type) {
    case "square": {
      if (shape.size === undefined || shape.size === null) {
        throw new Error(`Missing required field ${prefix}.size for square`);
      }
      checkFinite(shape.size, `${prefix}.size`);
      if (shape.size <= 0) {
        throw new Error(`${prefix}.size must be positive, got ${shape.size}`);
      }
      break;
    }
    case "circle": {
      if (shape.size === undefined || shape.size === null) {
        throw new Error(`Missing required field ${prefix}.size for circle`);
      }
      checkFinite(shape.size, `${prefix}.size`);
      if (shape.size <= 0) {
        throw new Error(`${prefix}.size must be positive, got ${shape.size}`);
      }
      break;
    }
    case "triangle": {
      if (shape.size === undefined || shape.size === null) {
        throw new Error(`Missing required field ${prefix}.size for triangle`);
      }
      checkFinite(shape.size, `${prefix}.size`);
      if (shape.size <= 0) {
        throw new Error(`${prefix}.size must be positive, got ${shape.size}`);
      }
      break;
    }
    case "rectangle": {
      if (shape.width === undefined || shape.width === null) {
        throw new Error(`Missing required field ${prefix}.width for rectangle`);
      }
      if (shape.height === undefined || shape.height === null) {
        throw new Error(`Missing required field ${prefix}.height for rectangle`);
      }
      checkFinite(shape.width, `${prefix}.width`);
      checkFinite(shape.height, `${prefix}.height`);
      if (shape.width <= 0) {
        throw new Error(`${prefix}.width must be positive, got ${shape.width}`);
      }
      if (shape.height <= 0) {
        throw new Error(`${prefix}.height must be positive, got ${shape.height}`);
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
