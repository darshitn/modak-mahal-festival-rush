/** Phaser adds a Container's half-size display origin before hit testing.
 * Offset the custom area to match artwork drawn from local (0, 0).
 */
export function topLeftButtonHitArea(width: number, height: number) {
  return { x: width / 2, y: height / 2, width, height };
}
