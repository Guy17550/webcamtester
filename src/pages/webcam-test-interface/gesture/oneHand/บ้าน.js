/**
 * Gesture: บ้าน (human-natural base)
 *
 * Pattern:
 * - มือขวา
 * - แตะแก้มขวา 2 ครั้ง (near → far → near)
 * - รูปมือคงที่
 */

const CONFIG = {
  NEAR_DISTANCE: 0.12,     // ระยะถือว่า "แตะ"
  FAR_DISTANCE: 0.18,      // ระยะถือว่า "ถอยออก"
  REQUIRED_TAPS: 2,
  MAX_FRAMES: 60,
};

let state = 'idle'; // idle | near | far
let tapCount = 0;
let frameCount = 0;
let lastDistance = null;

const reset = () => {
  state = 'idle';
  tapCount = 0;
  frameCount = 0;
  lastDistance = null;
};

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // ใช้ปลายนิ้วชี้
  const handPoint = hand[8];

  // ตำแหน่งแก้มขวา (ประมาณ)
  const cheekPoint = { x: 0.6, y: 0.45, z: 0 };

  const d = dist(handPoint, cheekPoint);

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (d < CONFIG.NEAR_DISTANCE) {
      state = 'near';
      tapCount++;
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- NEAR ---------- */
  if (state === 'near') {
    if (d > CONFIG.FAR_DISTANCE) {
      state = 'far';
    }
    return { event: 'progress', previousLandmarks: hand };
  }

  /* ---------- FAR ---------- */
  if (state === 'far') {
    if (d < CONFIG.NEAR_DISTANCE) {
      tapCount++;
      state = 'near';

      if (tapCount >= CONFIG.REQUIRED_TAPS) {
        reset();
        return {
          event: 'finished',
          word: 'บ้าน',
          previousLandmarks: hand,
        };
      }
    }
    return { event: 'progress', previousLandmarks: hand };
  }

  return { event: 'none', previousLandmarks: hand };
}