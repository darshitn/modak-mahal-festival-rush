export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;

// Render at 2x the stable world coordinate system. Phaser cameras zoom the
// logical 960x540 world to this backing buffer, keeping existing interactions
// predictable while avoiding browser enlargement of a low-resolution canvas.
export const RENDER_SCALE = 2;
export const RENDER_WIDTH = LOGICAL_WIDTH * RENDER_SCALE;
export const RENDER_HEIGHT = LOGICAL_HEIGHT * RENDER_SCALE;

export const COLORS = {
  floor: 0xf7ecdd,
  floorAlt: 0xeedcc8,
  paper: 0xfffdf7,
  walnut: 0x45362e,
  saffron: 0xe99527,
  brass: 0xc9953d,
  leaf: 0x35765a,
  vermilion: 0xb84e3b
} as const;

import {
  clampFeedbackToViewport,
  type CameraViewportBounds
} from '../utils/mobileControls.ts';

export interface FeedbackBounds {
  width: number;
  height: number;
  cardX: number;
  cardY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function calculateFeedbackBounds(
  text: string,
  coinBadgeText?: string,
  camera?: CameraViewportBounds
): FeedbackBounds {
  const approxCharWidth = 6.8;
  const textWidth = Math.min(190, text.length * approxCharWidth);
  const padX = 10;
  const width = Math.max(70, Math.min(210, textWidth + padX * 2));
  const height = coinBadgeText ? 34 : 22;

  if (camera) {
    const clamped = clampFeedbackToViewport(850, 250, { width, height }, camera);
    return {
      width,
      height,
      cardX: clamped.x,
      cardY: clamped.y,
      minX: clamped.minX,
      maxX: clamped.maxX,
      minY: clamped.minY,
      maxY: clamped.maxY
    };
  }

  const cardY = 250; // Positioned strictly above customer bubbles (bubbles at y ≈ 305)
  const cardX = Math.min(LOGICAL_WIDTH - width / 2 - 4, Math.max(width / 2 + 4, 850));

  return {
    width,
    height,
    cardX,
    cardY,
    minX: cardX - width / 2,
    maxX: cardX + width / 2,
    minY: cardY - height / 2,
    maxY: cardY + height / 2
  };
}

