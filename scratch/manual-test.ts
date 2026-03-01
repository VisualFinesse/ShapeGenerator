import { generate } from "../src/index.ts";
import { writeFileSync } from "fs";

const result = generate({
  seed: 45,
  canvas: { width: 400, height: 400 },
  shapes: [
    // { type: "circle",    x: 100, y: 100, size: 80 },
    // { type: "square",    x: 200, y: 150, size: 60 },
    // { type: "rectangle", x: 50,  y: 250, width: 120, height: 50 },
    // { type: "triangle",  x: 300, y: 300, size: 70, rotation: 45 },

    // Square with vertex distortion
    { type: "square", x: 100, y: 100, size: 50, distort: 0.15 },

    // Circle with size variation
    { type: "circle", x: 200, y: 150, size: 40, sizeVariance: 0.3 },

    // Polygon with distortion + clamp
    {
      type: "polygon",
      x: 50,
      y: 250,
      sides: 6,
      size: 60,
      distort: 0.2,
      clamp: { width: 140, height: 140 },
    },

    // Rectangle with both variation types
    {
      type: "rectangle",
      x: 300,
      y: 300,
      width: 120,
      height: 60,
      sizeVariance: 0.2,
      distort: 0.1,
    },
  ],
});

// Write SVG to disk
writeFileSync("scratch/output.svg", result.svg, "utf8");
console.log("Wrote scratch/output.svg");
console.log("Metadata:", result.metadata);
console.log("\nSVG snippet:\n", result.svg.slice(0, 400));

// run file with `npx tsx scratch/manual-test.ts`
