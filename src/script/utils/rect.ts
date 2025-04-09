export function equal(r1?: DOMRect, r2?: DOMRect) {
  if (!r1 || !r2) {
    return false;
  }
  return (
    r1.x === r2.x &&
    r1.y === r2.y &&
    r1.width === r2.width &&
    r1.height === r2.height
  );
}

export function lerp(progress: number, r1: DOMRect, r2: DOMRect) {
  return new DOMRect(
    r1.x + (r2.x - r1.x) * progress,
    r1.y + (r2.y - r1.y) * progress,
    r1.width + (r2.width - r1.width) * progress,
    r1.height + (r2.height - r1.height) * progress
  );
}

export function distance(r1: DOMRect, r2: DOMRect) {
  const dx = r1.x - r2.x;
  const dy = r1.y - r2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
