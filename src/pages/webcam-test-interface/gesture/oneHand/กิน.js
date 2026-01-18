/**
 * Gesture: กิน (v2)
 * VELOCITY-BASED (EASY BUT SAFE)
 *
 * Pattern (1 bite):
 *  - มือเคลื่อน "เข้าใกล้ปาก" ด้วย velocity เป็นลบ
 *  - ความเร็วลดลง / หยุด (pause สั้น ๆ)
 *  - มือเคลื่อน "ออกจากปาก" ด้วย velocity เป็นบวก
 *
 * ต้องครบ 2 bites
 */

const CONFIG = {
  // ระยะอ้างอิงปาก
  NEAR_DISTANCE: 0.15,

  // velocity thresholds
  IN_VELOCITY: -0.0025,   // เข้าใกล้ปากจริง
  OUT_VELOCITY: 0.0025,   // ถอยออกจริง

  // pause (กันแกว่ง)
  PAUSE_FRAMES: 2,

  REQUIRED_BITES: 2,
  MAX_FRAMES: 70,
};

let state = 'idle'; // idle | in | pause | out
let biteCount = 0;
let frameCount = 0;

let lastDistance = null;
let pauseCounter = 0;

const reset = () => {
  state = 'idle';
  biteCount = 0;
  frameCount = 0;
  lastDistance = null;
  pauseCounter = 0;
};

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // ใช้ปลายนิ้วกลาง
  const handPoint = hand[12];

  // ตำแหน่งปาก (ค่าประมาณที่เสถียร)
  const mouthPoint = { x: 0.5, y: 0.4, z: 0 };

  const d = dist(handPoint, mouthPoint);

  if (lastDistance === null) {
    lastDistance = d;
    return { event: 'none', previousLandmarks: hand };
  }

  const velocity = d - lastDistance; // <0 = เข้า, >0 = ออก
  lastDistance = d;

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (d < CONFIG.NEAR_DISTANCE && velocity < CONFIG.IN_VELOCITY) {
      state = 'in';
      return {
        event: 'progress',
        previousLandmarks: hand,
        debug: { state: 'in', velocity, d, biteCount },
      };
    }

    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IN ---------- */
  if (state === 'in') {
    // ชะลอ = pause (เหมือนแตะปาก)
    if (Math.abs(velocity) < 0.001) {
      pauseCounter++;
      if (pauseCounter >= CONFIG.PAUSE_FRAMES) {
        state = 'pause';
      }
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'in', velocity, d, pauseCounter },
    };
  }

  /* ---------- PAUSE ---------- */
  if (state === 'pause') {
    // ถอยออกจริง
    if (velocity > CONFIG.OUT_VELOCITY) {
      state = 'out';
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'pause', velocity, d },
    };
  }

  /* ---------- OUT ---------- */
  if (state === 'out') {
    biteCount++;

    if (biteCount >= CONFIG.REQUIRED_BITES) {
      reset();
      return {
        event: 'finished',
        word: 'กิน',
        previousLandmarks: hand,
        debug: { biteCount },
      };
    }

    // รอ bite รอบถัดไป
    state = 'idle';
    pauseCounter = 0;

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'out', biteCount },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}

