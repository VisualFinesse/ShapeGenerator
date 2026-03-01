import { generate } from "../src/index.ts";
import { writeFileSync } from "fs";

const result = generate({
  seed: 45,
  canvas: { width: 400, height: 400 },
  shapes: [
    { type: "circle",    x: 100, y: 100, size: 80 },
    { type: "square",    x: 200, y: 150, size: 60 },
    { type: "rectangle", x: 50,  y: 250, width: 120, height: 50 },
    { type: "triangle",  x: 300, y: 300, size: 70, rotation: 45 },
  ],
});

// Write SVG to disk
writeFileSync("scratch/output.svg", result.svg, "utf8");
console.log("Wrote scratch/output.svg");
console.log("Metadata:", result.metadata);
console.log("\nSVG snippet:\n", result.svg.slice(0, 400));
