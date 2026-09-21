import { describe, expect, it } from 'vitest';
import { topLeftButtonHitArea } from '../utils/buttonHitArea';

// Use Phaser's actual containment implementation, with the display-origin
// normalization performed by InputManager.pointWithinHitArea.
import contains from 'phaser/src/geom/rectangle/Contains.js';

describe('top-left HUD artwork and Phaser container input', () => {
  for (const [width, height] of [[44, 44], [42, 36]]) {
    it(`accepts the complete visible ${width} x ${height} button`, () => {
      const area = topLeftButtonHitArea(width, height);
      for (const x of [1, width / 2, width - 1]) {
        for (const y of [1, height / 2, height - 1]) {
          expect(contains(area, x + width / 2, y + height / 2)).toBe(true);
        }
      }
      expect(contains(area, width / 2 - 1, height)).toBe(false);
      expect(contains(area, width * 1.5 + 1, height)).toBe(false);
    });
  }

  it('does not send a fullscreen right-edge tap to pause', () => {
    const screenWidth = 390;
    const tapX = screenWidth - 96 + 41;
    const area = topLeftButtonHitArea(44, 44);
    expect(contains(area, tapX - (screenWidth - 96) + 22, 19 + 22)).toBe(true);
    expect(contains(area, tapX - (screenWidth - 48) + 22, 19 + 22)).toBe(false);
  });
});
