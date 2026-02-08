/**
 * Gesture: ถูก (human-natural base)
 *
 * Pattern:
 * - มือขวา
 * - รูปมือคงที่ (นิ้วก้อยเหยียด)
 * - เคลื่อนที่ขึ้นเฉียงขวา (↗)
 * - ไม่มี rotation / ไม่มีเข้าใกล้หน้า
 */

const CONFIG = {
  // การเคลื่อนไหว
  MIN_DX: 0.02,      // ต้องขยับไปทางขวา
  MIN_DY: -0.03,     // ต้องขยับขึ้น
  MIN_DISTANCE: 0.05, // ระยะรวมขั้นต่ำ

  // ความเร็ว
  MIN_VELOCITY: 0.001,

  // เฟรม
  MAX_FRAMES: 50,
};

let state = 'idle'; // idle | tracking
let startPos = null;
let lastPos = null;
let frameCount = 0;

const reset = () => {
  state = 'idle';
  startPos = null;
  lastPos = null;
  frameCount = 0;
};

const dist2D = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // ใช้จุดกลางมือ (เสถียรกว่า)
  const point = hand[9];

  if (!lastPos) {
    lastPos = point;
    startPos = point;
    return { event: 'none', previousLandmarks: hand };
  }

  const dx = point.x - lastPos.x;
  const dy = point.y - lastPos.y;

  const totalDx = point.x - startPos.x;
  const totalDy = point.y - startPos.y;

  const velocity = Math.hypot(dx, dy);

  lastPos = point;
  frameCount++;

  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    // ต้องเริ่มเคลื่อนขึ้น + ขวา จริง
    if (
      dx > 0 &&
      dy < 0 &&
      velocity > CONFIG.MIN_VELOCITY
    ) {
      state = 'tracking';
      return {
        event: 'progress',
        previousLandmarks: hand,
        debug: { state: 'tracking_start', dx, dy },
      };
    }

    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- TRACKING ---------- */
  if (state === 'tracking') {
    // ตรวจว่าลากขึ้นเฉียงขวาครบระยะ
    if (
      totalDx > CONFIG.MIN_DX &&
      totalDy < CONFIG.MIN_DY &&
      dist2D(startPos, point) > CONFIG.MIN_DISTANCE
    ) {
      reset();
      return {
        event: 'finished',
        word: 'ถูก',
        previousLandmarks: hand,
      };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'tracking', totalDx, totalDy },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}