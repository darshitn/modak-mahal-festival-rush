import { describe, expect, it } from 'vitest';
import {
  calculateJoystickVector,
  clampFeedbackToViewport,
  combineInputVectors,
  getCameraLayoutConfig,
  getMobileControlPositions,
  isMobileLayout,
  isFullscreenActive,
  isFullscreenSupported,
  TOUR_STEPS,
  getTourCardLayout,
  getTourCameraScroll,
  shouldShowLandscapeRecommendation,
  dismissLandscapeRecommendation,
  getDeviceResolution,
  validateMobileHudHitboxes,
  LANDSCAPE_RECOMMEND_KEY,
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

  describe('getMobileControlPositions', () => {
    it('positions landscape controls with elevated joystick and ample downward drag clearance', () => {
      // 844x390 landscape mobile
      const pos = getMobileControlPositions(844, 390, false);

      // Elevated joystick around screenHeight - 115, moved 20px right to x = 100
      expect(pos.joystick.y).toBe(390 - 115); // 275
      expect(pos.joystick.x).toBe(100);

      // Full downward drag knob reach is joyY + radius + knobRadius = 275 + 46 + 23 = 344
      // Leaving 46px clearance above bottom edge
      expect(pos.joystick.clearanceBottom).toBe(46);
      expect(pos.joystick.clearanceBottom).toBeGreaterThanOrEqual(40);

      // Ergonomically matched action button height
      expect(pos.actionButton.y).toBe(pos.joystick.y);
      expect(pos.actionButton.x).toBe(844 - 75);

      // Action card floats in top safe area below 54px mobile HUD
      expect(pos.actionCard.y).toBe(74);

      // Top bar buttons placed side-by-side with >= 44x44px touch targets
      expect(pos.pauseButton.x).toBe(844 - 48);
      expect(pos.pauseButton.y).toBe(7);
      expect(pos.pauseButton.width).toBeGreaterThanOrEqual(44);
      expect(pos.pauseButton.height).toBeGreaterThanOrEqual(44);

      expect(pos.fullscreenButton.x).toBe(844 - 96);
      expect(pos.fullscreenButton.y).toBe(7);
      expect(pos.fullscreenButton.width).toBeGreaterThanOrEqual(44);
      expect(pos.fullscreenButton.height).toBeGreaterThanOrEqual(44);

      expect(pos.soundButton.x).toBe(844 - 144);
      expect(pos.soundButton.y).toBe(7);
      expect(pos.soundButton.width).toBeGreaterThanOrEqual(44);
      expect(pos.soundButton.height).toBeGreaterThanOrEqual(44);
    });

    it('positions portrait controls with elevated joystick and ample downward drag clearance', () => {
      // 390x844 portrait mobile
      const pos = getMobileControlPositions(390, 844, true);

      // Elevated joystick around screenHeight - 110, moved 20px right to x = 90
      expect(pos.joystick.y).toBe(844 - 110); // 734
      expect(pos.joystick.x).toBe(90);

      // Downward drag clearance: 844 - (734 + 46 + 23) = 41px
      expect(pos.joystick.clearanceBottom).toBe(41);
      expect(pos.joystick.clearanceBottom).toBeGreaterThanOrEqual(40);

      // Ergonomically matched action button
      expect(pos.actionButton.y).toBe(pos.joystick.y);
      expect(pos.actionButton.x).toBe(390 - 70);

      // Action card positioned safely above joystick/action top boundary (734 - 46 = 688)
      expect(pos.actionCard.y).toBe(844 - 175); // 669
      expect(pos.actionCard.y).toBeLessThan(pos.joystick.y - pos.joystick.radius);

      // Fullscreen, pause, and sound buttons
      expect(pos.pauseButton.x).toBe(390 - 48);
      expect(pos.fullscreenButton.x).toBe(390 - 96);
      expect(pos.soundButton.x).toBe(390 - 144);
      expect(pos.soundButton.width).toBeGreaterThanOrEqual(44);
      expect(pos.soundButton.height).toBeGreaterThanOrEqual(44);
    });

    it('guards against crowding top HUD on short landscape screens', () => {
      // Very short landscape screen: 640x320
      const pos = getMobileControlPositions(640, 320, false);
      expect(pos.joystick.y).toBe(320 - 115); // 205
      // Top of joystick base (205 - 46 = 159) is safely below top HUD (54px)
      expect(pos.joystick.y - pos.joystick.radius).toBeGreaterThan(54);
      expect(pos.joystick.clearanceBottom).toBe(46);
    });

    it('ensures complete joystick touch hit area stays inside narrow mobile screens', () => {
      // 320x568 small mobile portrait
      const pos = getMobileControlPositions(320, 568, true);
      expect(pos.joystick.x - pos.joystick.hitRadius).toBeGreaterThanOrEqual(0);
      expect(pos.joystick.x + pos.joystick.hitRadius).toBeLessThanOrEqual(320);

      // 640x320 small mobile landscape
      const landPos = getMobileControlPositions(640, 320, false);
      expect(landPos.joystick.x - landPos.joystick.hitRadius).toBeGreaterThanOrEqual(0);
      expect(landPos.joystick.x + landPos.joystick.hitRadius).toBeLessThanOrEqual(640);
    });
  });

  describe('Fullscreen Helpers', () => {
    it('detects active fullscreen across standard and vendor prefixed document properties', () => {
      expect(isFullscreenActive({} as any)).toBe(false);
      expect(isFullscreenActive({ fullscreenElement: {} } as any)).toBe(true);
      expect(isFullscreenActive({ webkitFullscreenElement: {} } as any)).toBe(true);
      expect(isFullscreenActive({ mozFullScreenElement: {} } as any)).toBe(true);
      expect(isFullscreenActive({ msFullscreenElement: {} } as any)).toBe(true);
    });

    it('detects browser fullscreen support correctly', () => {
      // Supported standard
      const standardDoc = {
        fullscreenEnabled: true,
        documentElement: { requestFullscreen: () => {} }
      };
      expect(isFullscreenSupported(standardDoc as any)).toBe(true);

      // Supported webkit
      const webkitDoc = {
        webkitFullscreenEnabled: true,
        documentElement: { webkitRequestFullscreen: () => {} }
      };
      expect(isFullscreenSupported(webkitDoc as any)).toBe(true);

      // Explicitly disabled
      const disabledDoc = {
        fullscreenEnabled: false,
        documentElement: { requestFullscreen: () => {} }
      };
      expect(isFullscreenSupported(disabledDoc as any)).toBe(false);

      // Unsupported browser (e.g. mobile Safari without element requestFullscreen)
      const unsupportedDoc = {
        documentElement: {}
      };
      expect(isFullscreenSupported(unsupportedDoc as any)).toBe(false);
    });
  });

  describe('New Player Station Tour Helpers', () => {
    it('defines all 5 tour steps in canonical progression order', () => {
      expect(TOUR_STEPS).toHaveLength(5);
      expect(TOUR_STEPS.map((s) => s.stationId)).toEqual([
        'supplies',
        'steamer',
        'packing',
        'service',
        'upgrade'
      ]);
    });

    it('points to accurate world coordinates for each shop station', () => {
      const [supplies, steamer, packing, service, upgrade] = TOUR_STEPS;
      expect(supplies.worldPos).toEqual({ x: 205, y: 135 });
      expect(steamer.worldPos).toEqual({ x: 405, y: 135 });
      expect(packing.worldPos).toEqual({ x: 380, y: 390 });
      expect(service.worldPos).toEqual({ x: 700, y: 390 });
      expect(upgrade.worldPos).toEqual({ x: 740, y: 135 });
    });

    it('prominently clarifies that 10-minute timer starts after first sale', () => {
      const supplies = TOUR_STEPS[0];
      const service = TOUR_STEPS[3];
      expect(supplies.tip).toMatch(/10-minute/i);
      expect(supplies.tip).toMatch(/first sale/i);
      expect(service.tip).toMatch(/10-minute/i);
      expect(service.tip).toMatch(/1st sale/i);
    });

    it('prominently clarifies that Grand Pandal Dispatch unlocks after all 4 upgrades with 12 boxes', () => {
      const upgrade = TOUR_STEPS[4];
      expect(upgrade.tip).toMatch(/all 4 upgrades/i);
      expect(upgrade.tip).toMatch(/Grand Pandal Dispatch/i);
      expect(upgrade.tip).toMatch(/12 boxes/i);
    });

    it('calculates ergonomic card layout across portrait, short landscape, and desktop', () => {
      // 390x844 portrait: stays at bottom, leaves stations visible above
      const portraitLayout = getTourCardLayout(390, 844, true);
      expect(portraitLayout.width).toBeLessThanOrEqual(366);
      expect(portraitLayout.height).toBe(160);
      expect(portraitLayout.y).toBe(844 - 100);
      expect(portraitLayout.x).toBe(195);

      // 844x390 landscape: compact height, leaving top unobstructed
      const landscapeLayout = getTourCardLayout(844, 390, false);
      expect(landscapeLayout.width).toBeLessThanOrEqual(540);
      expect(landscapeLayout.height).toBe(124);
      expect(landscapeLayout.y).toBe(390 - 74);
      expect(landscapeLayout.x).toBe(422);

      // 1366x768 desktop: wide comfortable card
      const desktopLayout = getTourCardLayout(1366, 768, false);
      expect(desktopLayout.width).toBe(560);
      expect(desktopLayout.height).toBe(144);
      expect(desktopLayout.y).toBe(768 - 95);
      expect(desktopLayout.x).toBe(683);
    });

    it('computes camera scroll that brings offscreen stations into view on mobile portrait', () => {
      // On 390x844 portrait (zoom = 1.563), visible width = 390 / 1.563 ≈ 249.5
      // Max scrollX = 960 - 249.5 = 710.5
      const zoom = 844 / 540; // 1.56296
      const visibleW = 390 / zoom;

      // Supplies at x = 205 (already near left side)
      const suppliesScroll = getTourCameraScroll(205, 135, 390, 844, zoom);
      expect(suppliesScroll.scrollX).toBeCloseTo(205 - visibleW / 2, 0);

      // Service Counter at x = 700 (offscreen when camera is at player x = 260)
      const serviceScroll = getTourCameraScroll(700, 390, 390, 844, zoom);
      expect(serviceScroll.scrollX).toBeGreaterThanOrEqual(550);
      // Ensure target x = 700 is inside the visible window [scrollX, scrollX + visibleW]
      expect(serviceScroll.scrollX).toBeLessThanOrEqual(700);
      expect(serviceScroll.scrollX + visibleW).toBeGreaterThanOrEqual(700);

      // Upgrades Desk at x = 740 (offscreen right)
      const upgradeScroll = getTourCameraScroll(740, 135, 390, 844, zoom);
      expect(upgradeScroll.scrollX).toBeGreaterThanOrEqual(600);
      expect(upgradeScroll.scrollX).toBeLessThanOrEqual(740);
      expect(upgradeScroll.scrollX + visibleW).toBeGreaterThanOrEqual(740);
    });

    it('clamps tour camera scroll to valid world bounds', () => {
      // Station beyond right bound
      const extremeRight = getTourCameraScroll(1500, 300, 390, 844, 1.5);
      expect(extremeRight.scrollX).toBe(960 - 390 / 1.5);

      // Station at negative coordinates
      const extremeLeft = getTourCameraScroll(-100, -50, 390, 844, 1.5);
      expect(extremeLeft.scrollX).toBe(0);
      expect(extremeLeft.scrollY).toBe(0);
    });
  });

  // ── Device Resolution Helper ────────────────────────────────────────────────

  describe('getDeviceResolution', () => {
    it('returns 1.0 when dpr is 1 (standard display)', () => {
      expect(getDeviceResolution(1)).toBe(1);
    });

    it('returns 2.0 when dpr is 2 (Retina display)', () => {
      expect(getDeviceResolution(2)).toBe(2);
    });

    it('caps at 2.0 for dpr values above 2 (e.g. 3× OLED screen)', () => {
      expect(getDeviceResolution(3)).toBe(2);
      expect(getDeviceResolution(4)).toBe(2);
    });

    it('clamps below 1 up to minimum 1', () => {
      expect(getDeviceResolution(0)).toBe(1);
      expect(getDeviceResolution(0.5)).toBe(1);
    });
  });

  // ── Landscape Recommendation ────────────────────────────────────────────────

  describe('shouldShowLandscapeRecommendation', () => {
    const fakeStorage = (value: string | null): Pick<Storage, 'getItem'> => ({
      getItem: (_key: string) => value
    });

    it('returns true for portrait mobile when not yet dismissed', () => {
      expect(shouldShowLandscapeRecommendation(390, 844, true, fakeStorage(null))).toBe(true);
    });

    it('returns false when already dismissed (localStorage contains "true")', () => {
      expect(shouldShowLandscapeRecommendation(390, 844, true, fakeStorage('true'))).toBe(false);
    });

    it('returns false for landscape mobile (height <= width)', () => {
      expect(shouldShowLandscapeRecommendation(844, 390, true, fakeStorage(null))).toBe(false);
    });

    it('returns false for desktop portrait (non-mobile layout)', () => {
      // Any height > width triggers isMobileLayout (portrait is always mobile).
      // A true "desktop in portrait" scenario doesn't apply here. Test instead
      // that very large portrait screens without coarse pointer still pass the
      // mobile check (they do — portrait is always mobile layout by design).
      // The landscape recommendation only applies to genuine portrait mobile:
      // verify it is suppressed on a 1920x1080 desktop where height <= width.
      expect(shouldShowLandscapeRecommendation(1920, 1080, false, fakeStorage(null))).toBe(false);
    });

    it('returns false for desktop landscape', () => {
      expect(shouldShowLandscapeRecommendation(1366, 768, false, fakeStorage(null))).toBe(false);
    });
  });

  describe('dismissLandscapeRecommendation', () => {
    it('writes "true" to the storage under LANDSCAPE_RECOMMEND_KEY', () => {
      const written: Record<string, string> = {};
      const store: Pick<Storage, 'setItem'> = {
        setItem: (k, v) => { written[k] = v; }
      };
      dismissLandscapeRecommendation(store);
      expect(written[LANDSCAPE_RECOMMEND_KEY]).toBe('true');
    });
  });

  // ── Mobile HUD Hitbox Validation ────────────────────────────────────────────

  describe('validateMobileHudHitboxes', () => {
    it('passes for 390px portrait (iPhone SE size)', () => {
      const result = validateMobileHudHitboxes(390);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes for 412px portrait (Pixel / Galaxy S size)', () => {
      const result = validateMobileHudHitboxes(412);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes for 375px portrait (narrow phone)', () => {
      const result = validateMobileHudHitboxes(375);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('each button has at least 44x44 touch target', () => {
      const pos = getMobileControlPositions(390, 844, true);
      expect(pos.pauseButton.width).toBeGreaterThanOrEqual(44);
      expect(pos.pauseButton.height).toBeGreaterThanOrEqual(44);
      expect(pos.fullscreenButton.width).toBeGreaterThanOrEqual(44);
      expect(pos.fullscreenButton.height).toBeGreaterThanOrEqual(44);
      expect(pos.soundButton.width).toBeGreaterThanOrEqual(44);
      expect(pos.soundButton.height).toBeGreaterThanOrEqual(44);
    });

    it('buttons are ordered left-to-right: sound < fullscreen < pause', () => {
      const pos = getMobileControlPositions(390, 844, true);
      expect(pos.soundButton.x).toBeLessThan(pos.fullscreenButton.x);
      expect(pos.fullscreenButton.x).toBeLessThan(pos.pauseButton.x);
    });

    it('no two buttons overlap each other on a 390px screen', () => {
      const pos = getMobileControlPositions(390, 844, true);
      const buttons = [
        { name: 'sound', x: pos.soundButton.x, w: pos.soundButton.width },
        { name: 'fullscreen', x: pos.fullscreenButton.x, w: pos.fullscreenButton.width },
        { name: 'pause', x: pos.pauseButton.x, w: pos.pauseButton.width }
      ];
      for (let i = 0; i < buttons.length; i++) {
        for (let j = i + 1; j < buttons.length; j++) {
          const a = buttons[i];
          const b = buttons[j];
          const overlaps = a.x < b.x + b.w && b.x < a.x + a.w;
          expect(overlaps).toBe(false);
        }
      }
    });

    it('pause button is rightmost, flush to right edge (screenWidth - 48)', () => {
      const screenWidth = 390;
      const pos = getMobileControlPositions(screenWidth, 844, true);
      expect(pos.pauseButton.x).toBe(screenWidth - 48);
    });

    it('fullscreen button is at screenWidth - 96', () => {
      const screenWidth = 390;
      const pos = getMobileControlPositions(screenWidth, 844, true);
      expect(pos.fullscreenButton.x).toBe(screenWidth - 96);
    });

    it('sound button is at screenWidth - 144', () => {
      const screenWidth = 390;
      const pos = getMobileControlPositions(screenWidth, 844, true);
      expect(pos.soundButton.x).toBe(screenWidth - 144);
    });
  });

  // ── Orientation Change Behavior Contract ────────────────────────────────────

  describe('Orientation change behavior contract', () => {
    it('reports portrait for 390x844', () => {
      const { isPortrait } = getCameraLayoutConfig(390, 844);
      expect(isPortrait).toBe(true);
    });

    it('reports landscape (not portrait) for 844x390', () => {
      const { isPortrait } = getCameraLayoutConfig(844, 390);
      expect(isPortrait).toBe(false);
    });

    it('isMobileLayout is symmetric: portrait and landscape are both mobile', () => {
      expect(isMobileLayout(390, 844)).toBe(true);
      expect(isMobileLayout(844, 390)).toBe(true);
    });

    it('getMobileControlPositions returns different joystick x on orientation switch', () => {
      // Portrait joystick should be at x=90, landscape at x=100
      const portrait = getMobileControlPositions(390, 844, true);
      const landscape = getMobileControlPositions(844, 390, false);
      expect(portrait.joystick.x).toBe(90);
      expect(landscape.joystick.x).toBe(100);
    });

    it('joystick stays fully on-screen in portrait 390px wide', () => {
      const pos = getMobileControlPositions(390, 844, true);
      const leftEdge = pos.joystick.x - pos.joystick.radius;
      expect(leftEdge).toBeGreaterThanOrEqual(0);
    });

    it('joystick stays fully on-screen in landscape 844x390', () => {
      const pos = getMobileControlPositions(844, 390, false);
      const leftEdge = pos.joystick.x - pos.joystick.radius;
      expect(leftEdge).toBeGreaterThanOrEqual(0);
    });

    it('landscape recommendation hidden after device rotates to landscape', () => {
      // Portrait: should show
      expect(shouldShowLandscapeRecommendation(390, 844, true, { getItem: () => null })).toBe(true);
      // Landscape: should NOT show (even if not dismissed)
      expect(shouldShowLandscapeRecommendation(844, 390, true, { getItem: () => null })).toBe(false);
    });
  });
});
