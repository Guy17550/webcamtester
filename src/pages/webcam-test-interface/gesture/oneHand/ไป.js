/**
 * Gesture: ไป (human-natural base)
 *
 * Pattern:
 * - มือขวา
 * - เริ่มที่หน้าอกขวา
 * - สะบัดมือ "ออกด้านหน้า" (forward jerk)
 * - จังหวะสั้น ครั้งเดียวจบ
 */

const CONFIG = {
  // โซนหน้าอกขวา (ค่าประมาณ normalized)
  CHEST_ZONE: {
    xMin: 0.45,
    xMax: 0.75,
    yMin: 0.45,
    yMax: 0.75,
  },

  // ความแรงการสะบัดออกด้านหน้า
  FORWARD_VELOCITY: -0.035, // z ลด = ออกหากล้อง

  MAX_FRAMES: 15,
};

let state = 'idle';
let frameCount = 0;
let lastZ = null;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  lastZ = null;
};

const inChestZone = (p) =>
  p.x >= CONFIG.CHEST_ZONE.xMin &&
  p.x <= CONFIG.CHEST_ZONE.xMax &&
  p.y >= CONFIG.CHEST_ZONE.yMin &&
  p.y <= CONFIG.CHEST_ZONE.yMax;

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // ใช้โคนนิ้วกลาง (เสถียร)
  const point = hand[9];

  if (lastZ === null) {
    lastZ = point.z;
    return { event: 'none', previousLandmarks: hand };
  }

  const velocityZ = point.z - lastZ; // ลบ = ออกด้านหน้า
  lastZ = point.z;

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (inChestZone(point)) {
      state = 'ready';
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- READY ---------- */
  if (state === 'ready') {
    if (velocityZ < CONFIG.FORWARD_VELOCITY) {
      reset();
      return {
        event: 'finished',
        word: 'ไป',
        previousLandmarks: hand,
        debug: {
          gesture: 'ไป',
          velocityZ,
        },
      };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'ready', velocityZ },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}