/**
 * Gesture: ไม่ใช่ (No / Incorrect)
 *
 * Pattern:
 * - Open palm facing camera
 * - Side-to-side shake (short range)
 * - 1–2 rounds only
 *
 * Type:
 * - direction-based ⭐
 * - hand-shape-based ⭐
 *
 * Anti-mistake:
 * - ไม่ใช่โบกกว้าง (สวัสดี)
 * - ไม่ใช่ผลักออก (ไม่เอา)
 */

const CONFIG = {
  // hand shape
  FLAT_VARIANCE: 0.03,          // นิ้วต้องอยู่ระนาบเดียวกัน
  PALM_FACING_THRESHOLD: 0.5,   // ฝ่ามือหันเข้ากล้องพอสมควร

  // movement
  SIDE_DISPLACEMENT_MIN: 0.08,  // ระยะส่ายขั้นต่ำ
  SIDE_DISPLACEMENT_MAX: 0.22,  // กันโบกกว้างเกิน
  REQUIRED_SHAKES: 1,           // อย่างน้อย 1 รอบ
  MAX_SHAKES: 2,

  // timing
  MAX_FRAMES: 70,
};

let state = 'idle';
// idle → ready → shake → finish

let frameCount = 0;
let shakeCount = 0;
let lastX = null;
let direction = null; // 'left' | 'right'

const reset = () => {
  state = 'idle';
  frameCount = 0;
  shakeCount = 0;
  lastX = null;
  direction = null;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  const wrist = hand[0];
  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- HAND SHAPE CHECK ---------- */

  const maxY = Math.max(
    indexTip.y,
    middleTip.y,
    ringTip.y,
    pinkyTip.y
  );
  const minY = Math.min(
    indexTip.y,
    middleTip.y,
    ringTip.y,
    pinkyTip.y
  );

  const isFlatHand = (maxY - minY) < CONFIG.FLAT_VARIANCE;

  /* ---------- PALM FACING CAMERA ---------- */
  // ใช้ระยะ wrist → middle_tip เป็น proxy แบบง่าย
  const palmFacingCamera =
    Math.abs(middleTip.z - wrist.z) < CONFIG.PALM_FACING_THRESHOLD;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (isFlatHand && palmFacingCamera) {
      state = 'ready';
      lastX = wrist.x;
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- READY ---------- */
  if (state === 'ready') {
    const dx = wrist.x - lastX;

    if (Math.abs(dx) > CONFIG.SIDE_DISPLACEMENT_MIN) {
      direction = dx > 0 ? 'right' : 'left';
      state = 'shake';
    }

    lastX = wrist.x;

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'ready' },
    };
  }

  /* ---------- SHAKE ---------- */
  if (state === 'shake') {
    const dx = wrist.x - lastX;

    // กันโบกกว้าง (จะกลายเป็นสวัสดี)
    if (Math.abs(dx) > CONFIG.SIDE_DISPLACEMENT_MAX) {
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    if (dx !== 0) {
      const newDir = dx > 0 ? 'right' : 'left';

      if (newDir !== direction) {
        shakeCount++;
        direction = newDir;
      }
    }

    lastX = wrist.x;

    if (shakeCount >= CONFIG.REQUIRED_SHAKES &&
        shakeCount <= CONFIG.MAX_SHAKES) {
      reset();
      return {
        event: 'finished',
        word: 'ไม่ใช่',
        previousLandmarks: hand,
      };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'shake', shakeCount },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}