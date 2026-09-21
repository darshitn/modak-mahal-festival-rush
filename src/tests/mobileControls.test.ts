import { describe, expect, it } from 'vitest';
import {
  calculateJoystickVector,
  clampFeedbackToViewport,
  combineInputVectors,
  getCameraLayoutConfig,
  isMobileLayout,
  type CameraViewportBounds
} from '../utils/mobileControls.ts';

describe('Mobile Controls & Layout Helpers', () => {
  describe('isMobileLayout', () => {
    it('identifies portrait viewports as mobile layout', () => {
      expect(isMobileLayout(390, 844)).toBe(true);
      expect(isMobileLayout(412, 915)).toBe(true);
      expect(isMobileLayout(768, 1024)).toBe(true);
    });

    it('identifies short mobile landscape viewports as mobile layout', () => {
      expect(isMobileLayout(844, 390)).toBe(true);
      expect(isMobileLayout(915, 412)).toBe(true);
      expect(isMobileLayout(667, 375)).toBe(true);
      expect(isMobileLayout(800, 480)).toBe(true);
    });

    it('identifies standard desktop viewports as desktop layout', () => {
      expect(isMobileLayout(1024, 600, false)).toBe(false);
      expect(isMobileLayout(1366, 768, false)).toBe(false);
      expect(isMobileLayout(1920, 1080, false)).toBe(false);
    });

    it('handles touch tablets in compact landscape when coarse pointer is present', () => {
      expect(isMobileLayout(1024, 600, true)).toBe(true);
      expect(isMobileLayout(1920, 1080, true)).toBe(false);
    });
  });

  describe('calculateJoystickVector', () => {
    const maxRadius = 46;
    const deadZone = 8;

    it('returns zero and inactive inside dead-zone', () => {
      const v = calculateJoystickVector(3, 4, maxRadius, deadZone); // dist = 5 < 8
      expect(v.active).toBe(false);
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.knobX).toBe(0);
      expect(v.knobY).toBe(0);
    });

    it('clamps knob strictly to maximum joystick radius', () => {
      const v = calculateJoystickVector(100, 0, maxRadius, deadZone);
      expect(v.active).toBe(true);
      expect(v.knobX).toBeCloseTo(46, 3);
      expect(v.knobY).toBeCloseTo(0, 3);
      expect(v.x).toBeCloseTo(1, 3);
      expect(v.y).toBeCloseTo(0, 3);
    });

    it('normalizes diagonal drag so magnitude never exceeds 1.0', () => {
      const v = calculateJoystickVector(80, 80, maxRadius, deadZone);
      expect(v.active).toBe(true);
      const mag = Math.hypot(v.x, v.y);
      expect(mag).toBeCloseTo(1.0, 3);
      expect(v.x).toBeCloseTo(Math.SQRT1_2, 3);
      expect(v.y).toBeCloseTo(Math.SQRT1_2, 3);

      const knobDist = Math.hypot(v.knobX, v.knobY);
      expect(knobDist).toBeCloseTo(maxRadius, 3);
    });

    it('provides smooth proportional deflection between dead-zone and max-radius', () => {
      // Midpoint: distance = (8 + 46) / 2 = 27
      const v = calculateJoystickVector(27, 0, maxRadius, deadZone);
      expect(v.active).toBe(true);
      expect(v.knobX).toBeCloseTo(27, 3);
      expect(v.knobY).toBeCloseTo(0, 3);
      expect(v.x).toBeCloseTo(0.5, 3);
      expect(v.y).toBeCloseTo(0, 3);
    });
  });

  describe('combineInputVectors', () => {
    it('preserves single directional keyboard input', () => {
      const res = combineInputVectors({ x: 1, y: 0 }, { x: 0, y: 0 });
      expect(res.x).toBe(1);
      expect(res.y).toBe(0);
    });

    it('normalizes diagonal keyboard input to unit length', () => {
      const res = combineInputVectors({ x: 1, y: 1 }, { x: 0, y: 0 });
      const mag = Math.hypot(res.x, res.y);
      expect(mag).toBeCloseTo(1.0, 3);
      expect(res.x).toBeCloseTo(Math.SQRT1_2, 3);
      expect(res.y).toBeCloseTo(Math.SQRT1_2, 3);
    });

    it('combines keyboard and virtual input without exceeding 1.0 magnitude', () => {
      const res = combineInputVectors({ x: 1, y: 0 }, { x: 1, y: 0 });
      expect(res.x).toBe(1.0);
      expect(res.y).toBe(0);

      const diagonalRes = combineInputVectors({ x: 0, y: 1 }, { x: 1, y: 0 });
      const diagMag = Math.hypot(diagonalRes.x, diagonalRes.y);
      expect(diagMag).toBeCloseTo(1.0, 3);
    });

    it('allows clean movement reset to zero', () => {
      const res = combineInputVectors({ x: 0, y: 0 }, { x: 0, y: 0 });
      expect(res.x).toBe(0);
      expect(res.y).toBe(0);
    });
  });

  describe('getCameraLayoutConfig', () => {
    it('sets portrait zoom to eliminate lower empty space at 390x844', () => {
      const config = getCameraLayoutConfig(390, 844);
      expect(config.isPortrait).toBe(true);
      expect(config.isMobile).toBe(true);
      expect(config.followPlayer).toBe(true);
      // 844 / 540 = 1.56296 > 390 / 400 (0.975)
      expect(config.zoom).toBeCloseTo(844 / 540, 3);
      // Visible height in world coordinates must be <= 540
      const visibleHeight = 844 / config.zoom;
      expect(visibleHeight).toBeLessThanOrEqual(540.01);
    });

    it('sets portrait zoom to eliminate lower empty space at 412x915', () => {
      const config = getCameraLayoutConfig(412, 915);
      expect(config.isPortrait).toBe(true);
      expect(config.followPlayer).toBe(true);
      expect(config.zoom).toBeCloseTo(915 / 540, 3);
      const visibleHeight = 915 / config.zoom;
      expect(visibleHeight).toBeLessThanOrEqual(540.01);
    });

    it('configures readable camera and player follow on 844x390 landscape mobile', () => {
      const config = getCameraLayoutConfig(844, 390);
      expect(config.isPortrait).toBe(false);
      expect(config.isMobile).toBe(true);
      expect(config.followPlayer).toBe(true);
      expect(config.zoom).toBeGreaterThanOrEqual(1.0);
    });

    it('configures full room desktop camera without follow on 1366x768 and 1920x1080', () => {
      const d1 = getCameraLayoutConfig(1366, 768, false);
      expect(d1.isMobile).toBe(false);
      expect(d1.followPlayer).toBe(false);

      const d2 = getCameraLayoutConfig(1920, 1080, false);
      expect(d2.isMobile).toBe(false);
      expect(d2.followPlayer).toBe(false);
      expect(d2.zoom).toBe(2.0);
    });
  });

  describe('clampFeedbackToViewport', () => {
    it('preserves default placement (850, 250) on full 960x540 desktop camera', () => {
      const desktopCam: CameraViewportBounds = {
        scrollX: 0,
        scrollY: 0,
        width: 960,
        height: 540,
        zoom: 1.422, // e.g. 1366x768
        isMobile: false
      };
      const res = clampFeedbackToViewport(850, 250, { width: 170, height: 22 }, desktopCam);
      expect(res.x).toBe(850);
      expect(res.y).toBe(250);
      expect(res.minX).toBe(850 - 85);
      expect(res.maxX).toBe(850 + 85);
      expect(res.minX).toBeGreaterThanOrEqual(0);
      expect(res.maxX).toBeLessThanOrEqual(960);
    });

    it('clamps feedback inside visible viewport when customer lane is beyond the right edge on cropped mobile landscape', () => {
      // 844x390 mobile landscape, player at packing bench (x ≈ 380) so camera scrollX = 0, width = 822
      const mobileLandscapeCam: CameraViewportBounds = {
        scrollX: 0,
        scrollY: 0,
        width: 822, // 844 / 1.0263 ≈ 822
        height: 380,
        zoom: 1.0263,
        isMobile: true
      };
      // Customer lane is at desiredX = 850 (which is beyond 822!)
      const res = clampFeedbackToViewport(850, 250, { width: 170, height: 22 }, mobileLandscapeCam);
      // Must be pulled left to remain visible
      expect(res.x).toBeLessThan(850);
      // Right edge in screen coordinates must have at least 8px margin:
      const screenRight = (res.maxX - mobileLandscapeCam.scrollX) * mobileLandscapeCam.zoom;
      expect(screenRight).toBeLessThanOrEqual(836.01);
      // Left edge must have at least 8px margin
      const screenLeft = (res.minX - mobileLandscapeCam.scrollX) * mobileLandscapeCam.zoom;
      expect(screenLeft).toBeGreaterThanOrEqual(7.99);
    });

    it('clamps feedback into visible horizontal corridor on portrait camera', () => {
      // 390x844 portrait, player at Supply Shelf (x ≈ 205), scrollX = 0, visible width = 249.5
      const portraitCam: CameraViewportBounds = {
        scrollX: 0,
        scrollY: 0,
        width: 249.5, // 390 / 1.563
        height: 540,
        zoom: 1.563,
        isMobile: true
      };
      const res = clampFeedbackToViewport(850, 250, { width: 170, height: 22 }, portraitCam);
      // Entire card must be within [0, 249.5] with 8px margin
      const screenRight = (res.maxX - portraitCam.scrollX) * portraitCam.zoom;
      expect(screenRight).toBeLessThanOrEqual(390 - 8 + 0.01);
      const screenLeft = (res.minX - portraitCam.scrollX) * portraitCam.zoom;
      expect(screenLeft).toBeGreaterThanOrEqual(8 - 0.01);

      // Vertical position must clear top mobile HUD (54px + 8px = 62px)
      const screenTop = (res.minY - portraitCam.scrollY) * portraitCam.zoom;
      expect(screenTop).toBeGreaterThanOrEqual(62 - 0.01);
    });

    it('keeps a long 210px feedback card fully visible without clipping', () => {
      const mobileCam: CameraViewportBounds = {
        scrollX: 100,
        scrollY: 50,
        width: 820,
        height: 380,
        zoom: 1.0,
        isMobile: true
      };
      const longCard = { width: 210, height: 34 };
      const res = clampFeedbackToViewport(850, 250, longCard, mobileCam);

      expect(res.maxX - res.minX).toBe(210);
      expect(res.maxY - res.minY).toBe(34);
      // Clamped inside camera view with 8px margin
      expect(res.minX).toBeGreaterThanOrEqual(mobileCam.scrollX + 8);
      expect(res.maxX).toBeLessThanOrEqual(mobileCam.scrollX + mobileCam.width - 8);
      expect(res.minY).toBeGreaterThanOrEqual(mobileCam.scrollY + 54 + 8);
      expect(res.maxY).toBeLessThanOrEqual(mobileCam.scrollY + mobileCam.height - 8);
    });

    it('strictly enforces minimum 8px screen-equivalent edge margins across different zooms', () => {
      const zooms = [0.8, 1.0, 1.563, 2.0];
      for (const zoom of zooms) {
        const screenW = 800;
        const screenH = 600;
        const cam: CameraViewportBounds = {
          scrollX: 50,
          scrollY: 50,
          width: screenW / zoom,
          height: screenH / zoom,
          zoom,
          isMobile: false
        };
        // Place card near extreme right
        const resRight = clampFeedbackToViewport(2000, 250, { width: 100, height: 20 }, cam);
        const screenRight = (resRight.maxX - cam.scrollX) * zoom;
        expect(screenW - screenRight).toBeGreaterThanOrEqual(7.99);

        // Place card near extreme left
        const resLeft = clampFeedbackToViewport(-500, 250, { width: 100, height: 20 }, cam);
        const screenLeft = (resLeft.minX - cam.scrollX) * zoom;
        expect(screenLeft).toBeGreaterThanOrEqual(7.99);
      }
    });
  });
});
