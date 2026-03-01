export function shapeId(seed: number, type: string, index: number): string {
  const seedPart = seed < 0 ? `sn${Math.abs(seed)}` : `s${seed}`;
  return `${seedPart}-${type}-${index}`;
}
