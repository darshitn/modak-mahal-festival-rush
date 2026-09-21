import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../config/layout.ts';

export interface JoystickVector {
  x: number;
  y: number;
  knobX: number;
  knobY: number;
  active: boolean;
}

export interface CameraLayoutConfig {
  isMobile: boolean;
  isPortrait: boolean;
  zoom: number;
  followPlayer: boolean;
  followOffsetX: number;
  followOffsetY: number;
}

/**
 * Determines whether the layout should use mobile presentation (virtual joystick,
 * mobile action button, mobile pause control, responsive HUD) or desktop presentation.
 */
export function isMobileLayout(width: number, height: number, hasCoarsePointerOrTouch = false): boolean {
  // Any portrait screen is mobile
  if (height > width) {
    return true;
  }
  // Short viewport mobile landscape (e.g. phones in landscape like 844x390, 667x375, 915x412)
  if (height <= 500) {
    return true;
  }
  // Coarse-pointer / touch devices with compact dimensions
  if (hasCoarsePointerOrTouch && (width <= 1024 && height <= 600)) {
    return true;
  }
  // Standard desktop (1024x600 mouse, 1366x768, 1920x1080)
  return false;
}

/**
 * Calculates joystick vector with dead-zone filtering, radius clamping, and normalized output.
 */
export function calculateJoystickVector(
  deltaX: number,
  deltaY: number,
  maxRadius: number,
  deadZone: number
): JoystickVector {
  const dist = Math.hypot(deltaX, deltaY);

  if (dist < deadZone) {
    return {
      x: 0,
      y: 0,
      knobX: 0,
      knobY: 0,
      active: false
    };
  }

  const clampedDist = Math.min(dist, maxRadius);
  const angle = Math.atan2(deltaY, deltaX);
  const knobX = Math.cos(angle) * clampedDist;
  const knobY = Math.sin(angle) * clampedDist;

  // Linear ramp from deadZone to maxRadius, clamped to [0, 1]
  const intensity = (clampedDist - deadZone) / (maxRadius - deadZone);
  const normalizedIntensity = Math.max(0, Math.min(1, intensity));

  const x = Math.cos(angle) * normalizedIntensity;
  const y = Math.sin(angle) * normalizedIntensity;

  return {
    x,
    y,
    knobX,
    knobY,
    active: true
  };
}

/**
 * Safely combines keyboard vector with virtual joystick vector and normalizes the sum to <= 1.0.
 */
export function combineInputVectors(
  keyboard: { x: number; y: number },
  virtual: { x: number; y: number }
): { x: number; y: number } {
  let totalX = keyboard.x + virtual.x;
  let totalY = keyboard.y + virtual.y;

  const len = Math.hypot(totalX, totalY);
  if (len > 1.0) {
    totalX /= len;
    totalY /= len;
  }

  return { x: totalX, y: totalY };
}

/**
 * Computes camera zoom and follow settings for responsive viewport handling.
 */
export function getCameraLayoutConfig(
  width: number,
  height: number,
  hasCoarsePointerOrTouch = false
): CameraLayoutConfig {
  const isPortrait = height > width;
  const isMobile = isMobileLayout(width, height, hasCoarsePointerOrTouch);

  if (isPortrait) {
    // Zoom fills the height to eliminate unused black space at the bottom,
    // while keeping a minimum readable width of ~400px.
    const zoom = Math.max(width / 400, height / LOGICAL_HEIGHT);
    return {
      isMobile: true,
      isPortrait: true,
      zoom,
      followPlayer: true,
      followOffsetX: 0,
      followOffsetY: 0
    };
  }

  if (isMobile) {
    // Mobile landscape (e.g. 844x390): keep characters readable at ~1.0 scale
    // and softly follow the player across the 960x540 world.
    const zoom = Math.max(1.0, height / 380);
    return {
      isMobile: true,
      isPortrait: false,
      zoom,
      followPlayer: true,
      followOffsetX: 0,
      followOffsetY: 0
    };
  }

  // Desktop layout (1024x600, 1366x768, 1920x1080): full room visible and centered
  const desktopZoom = Math.min(width / LOGICAL_WIDTH, height / LOGICAL_HEIGHT);
  return {
    isMobile: false,
    isPortrait: false,
    zoom: desktopZoom,
    followPlayer: false,
    followOffsetX: 0,
    followOffsetY: 0
  };
}

export interface CameraViewportBounds {
  scrollX: number;
  scrollY: number;
  width: number;
  height: number;
  zoom: number;
  isMobile: boolean;
}

export interface ClampedFeedbackPosition {
  x: number;
  y: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Clamps customer feedback card world position to remain fully visible inside
 * the current camera viewport, respecting screen-equivalent edge margins (min 8px)
 * and mobile top HUD clearance (54px), while preserving desktop placement when visible.
 */
export function clampFeedbackToViewport(
  desiredX: number,
  desiredY: number,
  card: { width: number; height: number },
  camera: CameraViewportBounds,
  options?: {
    minMarginPx?: number;
    topHudHeightPx?: number;
    floatDistance?: number;
    worldWidth?: number;
    worldHeight?: number;
  }
): ClampedFeedbackPosition {
  const minMarginPx = options?.minMarginPx ?? 8;
  const topHudHeightPx = options?.topHudHeightPx ?? 54;
  const floatDistance = options?.floatDistance ?? 20;
  const worldWidth = options?.worldWidth ?? LOGICAL_WIDTH;
  const worldHeight = options?.worldHeight ?? LOGICAL_HEIGHT;

  const zoom = camera.zoom > 0 ? camera.zoom : 1;
  const marginWorldX = minMarginPx / zoom;
  const marginWorldY = minMarginPx / zoom;
  const topMarginWorld = (camera.isMobile ? topHudHeightPx + minMarginPx : minMarginPx) / zoom;

  // Visible camera window in world coordinates
  const camMinX = camera.scrollX;
  const camMaxX = camera.scrollX + camera.width;
  const camMinY = camera.scrollY;
  const camMaxY = camera.scrollY + camera.height;

  // Safe inner visible rectangle (bounded by both camera viewport and game world)
  const safeLeft = Math.max(marginWorldX, camMinX + marginWorldX);
  const safeRight = Math.min(worldWidth - marginWorldX, camMaxX - marginWorldX);
  const safeTop = Math.max(topMarginWorld, camMinY + topMarginWorld);
  const safeBottom = Math.min(worldHeight - marginWorldY, camMaxY - marginWorldY);

  const halfW = card.width / 2;
  const halfH = card.height / 2;

  let x: number;
  if (safeRight - safeLeft < card.width) {
    x = (safeLeft + safeRight) / 2;
  } else {
    const minCenterX = safeLeft + halfW;
    const maxCenterX = safeRight - halfW;
    x = Math.max(minCenterX, Math.min(maxCenterX, desiredX));
  }

  let y: number;
  if (safeBottom - safeTop < card.height + floatDistance) {
    y = safeTop + halfH + floatDistance;
  } else {
    const minCenterY = safeTop + halfH + floatDistance;
    const maxCenterY = safeBottom - halfH;
    y = Math.max(minCenterY, Math.min(maxCenterY, desiredY));
  }

  return {
    x,
    y,
    minX: x - halfW,
    maxX: x + halfW,
    minY: y - halfH,
    maxY: y + halfH
  };
}

/**
 * Extracts normalized CameraViewportBounds from a Phaser camera instance.
 */
export function extractCameraViewport(
  cam: { worldView?: { x: number; y: number; width: number; height: number }; scrollX?: number; scrollY?: number; width?: number; height?: number; zoom?: number } | null | undefined,
  isMobile: boolean
): CameraViewportBounds {
  if (!cam) {
    return {
      scrollX: 0,
      scrollY: 0,
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT,
      zoom: 1,
      isMobile: false
    };
  }

  const zoom = cam.zoom && cam.zoom > 0 ? cam.zoom : 1;
  const hasWorldView = cam.worldView && cam.worldView.width > 0 && cam.worldView.height > 0;
  return {
    scrollX: hasWorldView ? cam.worldView!.x : (cam.scrollX ?? 0),
    scrollY: hasWorldView ? cam.worldView!.y : (cam.scrollY ?? 0),
    width: hasWorldView ? cam.worldView!.width : (cam.width ?? LOGICAL_WIDTH) / zoom,
    height: hasWorldView ? cam.worldView!.height : (cam.height ?? LOGICAL_HEIGHT) / zoom,
    zoom,
    isMobile
  };
}

export interface MobileControlPositions {
  joystick: {
    x: number;
    y: number;
    radius: number;
    knobRadius: number;
    deadZone: number;
    hitRadius: number;
    clearanceBottom: number;
  };
  actionButton: {
    x: number;
    y: number;
    radius: number;
  };
  actionCard: {
    x: number;
    y: number;
  };
  pauseButton: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fullscreenButton: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Calculates ergonomic screen positions for mobile touch controls:
 * - Elevated joystick (around height - 115 in landscape, height - 110 in portrait) leaving ample downward drag clearance
 * - Ergonomically paired action button
 * - Action prompt card positioned safely away from thumb controls and HUD
 * - Top-bar pause and fullscreen buttons with >= 44x44px touch targets
 */
export function getMobileControlPositions(
  screenWidth: number,
  screenHeight: number,
  isPortrait: boolean
): MobileControlPositions {
  const joystickRadius = 46;
  const joystickKnobRadius = 23;
  const joystickDeadZone = 8;
  const joystickHitRadius = 70;

  let joyX: number;
  let joyY: number;
  let actX: number;
  let actY: number;
  let cardY: number;

  if (isPortrait) {
    joyX = 90;
    joyY = screenHeight - 110;
    actX = screenWidth - 70;
    actY = screenHeight - 110;
    // Safely above the top boundary of the joystick and action buttons
    cardY = screenHeight - 175;
  } else {
    joyX = 100;
    // Prevent encroaching on top HUD (54px) on unusually short screens
    const minJoyY = 54 + joystickRadius + 15;
    joyY = Math.max(minJoyY, screenHeight - 115);
    actX = screenWidth - 75;
    actY = joyY;
    // Under the top HUD in central safe area
    cardY = 74;
  }

  // Calculate bottom clearance when knob is dragged to maximum downward deflection
  const maxDownwardReach = joyY + joystickRadius + joystickKnobRadius;
  const clearanceBottom = Math.max(0, screenHeight - maxDownwardReach);

  return {
    joystick: {
      x: joyX,
      y: joyY,
      radius: joystickRadius,
      knobRadius: joystickKnobRadius,
      deadZone: joystickDeadZone,
      hitRadius: joystickHitRadius,
      clearanceBottom
    },
    actionButton: {
      x: actX,
      y: actY,
      radius: 36
    },
    actionCard: {
      x: screenWidth / 2,
      y: cardY
    },
    pauseButton: {
      x: screenWidth - 48,
      y: 7,
      width: 44,
      height: 44
    },
    fullscreenButton: {
      x: screenWidth - 96,
      y: 7,
      width: 44,
      height: 44
    }
  };
}

/**
 * Checks if fullscreen mode is currently active across standard and vendor implementations.
 */
export function isFullscreenActive(doc?: any): boolean {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d) return false;
  return !!(
    d.fullscreenElement ||
    d.webkitFullscreenElement ||
    d.mozFullScreenElement ||
    d.msFullscreenElement
  );
}

/**
 * Checks if the browser environment supports requesting fullscreen.
 */
export function isFullscreenSupported(doc?: any): boolean {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d) return false;
  const isEnabled =
    d.fullscreenEnabled ??
    d.webkitFullscreenEnabled ??
    d.mozFullScreenEnabled ??
    d.msFullscreenEnabled;
  if (isEnabled === false) return false;

  const elem = d.documentElement || (typeof document !== 'undefined' ? document.documentElement : null);
  if (!elem) return false;
  return !!(
    elem.requestFullscreen ||
    elem.webkitRequestFullscreen ||
    elem.mozRequestFullScreen ||
    elem.msRequestFullscreen
  );
}

export interface TourStep {
  stationId: 'supplies' | 'steamer' | 'packing' | 'service' | 'upgrade';
  stepNum: number;
  totalSteps: number;
  badge: string;
  title: string;
  desc: string;
  tip: string;
  worldPos: { x: number; y: number };
}

export const TOUR_STEPS: TourStep[] = [
  {
    stationId: 'supplies',
    stepNum: 1,
    totalSteps: 5,
    badge: '1 • SUPPLIES',
    title: 'Supply Shelf',
    desc: 'Buy recipe bundles (₹12) of rice flour, coconut, jaggery & boxes. Return ingredients here anytime to free hands.',
    tip: '⏱ 10-minute festival timer starts only AFTER your first sale—explore without rushing!',
    worldPos: { x: 205, y: 135 }
  },
  {
    stationId: 'steamer',
    stepNum: 2,
    totalSteps: 5,
    badge: '2 • STEAMING',
    title: 'Brass Steamer',
    desc: 'Walk close to load recipe bundles into Steamer 1. Steams fresh modaks to golden perfection in 8s.',
    tip: '💡 Steamer 2 unlocks later at the Upgrade Desk to double your kitchen throughput.',
    worldPos: { x: 405, y: 135 }
  },
  {
    stationId: 'packing',
    stepNum: 3,
    totalSteps: 5,
    badge: '3 • PACKING',
    title: 'Packing Bench',
    desc: 'Deposit cooked modaks to pack 3 festive gift boxes (3s). Your hands stay free while packing.',
    tip: '👥 You can hire an automated Packer NPC later to box modaks while you make deliveries.',
    worldPos: { x: 380, y: 390 }
  },
  {
    stationId: 'service',
    stepNum: 4,
    totalSteps: 5,
    badge: '4 • SERVICE',
    title: 'Devotee Counter',
    desc: 'Serve devotees waiting outside. Earn ₹10/box plus speed tips (up to +₹3/box) for rapid service!',
    tip: '🚨 Completing your 1st sale here officially opens the festival & starts the 10-minute round clock.',
    worldPos: { x: 700, y: 390 }
  },
  {
    stationId: 'upgrade',
    stepNum: 5,
    totalSteps: 5,
    badge: '5 • UPGRADES',
    title: 'Management Desk & Finale',
    desc: 'Invest your profits into 4 upgrades: Carry Capacity, Auto-Packer, Cashier, and Steamer 2.',
    tip: '⭐ Owning all 4 upgrades unlocks Grand Pandal Dispatch (deliver 12 boxes to WIN)!',
    worldPos: { x: 740, y: 135 }
  }
];

export interface TourCardLayout {
  width: number;
  height: number;
  x: number;
  y: number;
  isPortrait: boolean;
}

export function getTourCardLayout(
  screenWidth: number,
  screenHeight: number,
  isPortrait: boolean
): TourCardLayout {
  const x = screenWidth / 2;
  let width: number;
  let height: number;
  let y: number;

  if (isPortrait) {
    width = Math.min(366, screenWidth - 24);
    height = 160;
    y = screenHeight - 100;
  } else if (screenHeight <= 500) {
    width = Math.min(540, screenWidth - 36);
    height = 124;
    y = screenHeight - 74;
  } else {
    width = Math.min(560, screenWidth - 60);
    height = 144;
    y = screenHeight - 95;
  }

  return { width, height, x, y, isPortrait };
}

export function getTourCameraScroll(
  worldX: number,
  worldY: number,
  screenWidth: number,
  screenHeight: number,
  zoom: number,
  worldWidth = LOGICAL_WIDTH,
  worldHeight = LOGICAL_HEIGHT
): { scrollX: number; scrollY: number } {
  const z = zoom > 0 ? zoom : 1;
  const visibleW = screenWidth / z;
  const visibleH = screenHeight / z;

  const maxScrollX = Math.max(0, worldWidth - visibleW);
  const maxScrollY = Math.max(0, worldHeight - visibleH);

  const scrollX = Math.max(0, Math.min(maxScrollX, worldX - visibleW / 2));
  const scrollY = Math.max(0, Math.min(maxScrollY, worldY - visibleH / 2));

  return { scrollX, scrollY };
}
