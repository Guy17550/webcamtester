/**
 * Gesture: กิน (v4.1 - INTENT TIGHT)
 *
 * Pattern (1 bite):
 *  - มือเข้าใกล้ปาก
 *  - ค้างใกล้ปากจริง (hold)
 *  - ถอยออกจากปาก
 *
 * ต้องครบ 2 bites
 */

const CONFIG = {
  // ระยะใกล้ปาก (แคบลง กันมั่ว)
  NEAR_DISTANCE: 0.13,

  // velocity ใช้เป็นตัวช่วย ไม่ใช่ตัวตัด
  IN_VELOCITY: -0.0035,
  OUT_VELOCITY: 0.0035,

  // 🔑 สำคัญที่สุด
  HOLD_NEAR_FRAMES: 3,   // ต้องค้างใกล้ปากจริง
  PAUSE_FRAMES: 2,

  REQUIRED_BITES: 2,
  MAX_FRAMES: 90,
};

let state = 'idle'; // idle | near | pause | out
let biteCount = 0;
let frameCount = 0;

let lastDistance = null;
let nearCounter = 0;
let pauseCounter = 0;

const reset = () => {
  state = 'idle';
  biteCount = 0;
  frameCount = 0;
  lastDistance = null;
  nearCounter = 0;
  pauseCounter = 0;
};

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // ใช้ปลายนิ้วกลาง (นิ่งกว่า index)
  const handPoint = hand[12];

  // จุดปาก (ค่าประมาณ)
  const mouthPoint = { x: 0.5, y: 0.42, z: 0 };

  const d = dist(handPoint, mouthPoint);

  if (lastDistance === null) {
    lastDistance = d;
    return { event: 'none', previousLandmarks: hand };
  }

  const velocity = d - lastDistance;
  lastDistance = d;

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    // ต้องเข้าใกล้ + มีแนวโน้มเข้า
    if (d < CONFIG.NEAR_DISTANCE && velocity < CONFIG.IN_VELOCITY) {
      nearCounter++;
      if (nearCounter >= CONFIG.HOLD_NEAR_FRAMES) {
        state = 'near';
      }
    } else {
      nearCounter = 0;
    }

    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- NEAR (ค้างใกล้ปาก) ---------- */
  if (state === 'near') {
    // ชะลอจริง = pause
    if (Math.abs(velocity) < 0.0015) {
      pauseCounter++;
      if (pauseCounter >= CONFIG.PAUSE_FRAMES) {
        state = 'pause';
      }
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'near', d, velocity, nearCounter },
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
      debug: { state: 'pause', velocity },
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

    // เตรียม bite รอบถัดไป
    state = 'idle';
    nearCounter = 0;
    pauseCounter = 0;

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'out', biteCount },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}