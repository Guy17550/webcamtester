/**
 * Gesture: อยาก (want / desire)
 *
 * Meaning:
 * - ความต้องการจากภายใน (อยากทำ อยากได้)
 *
 * Pattern:
 * - มือกำ / กำหลวม
 * - แตะหน้าอก
 * - ดึงเข้าหาตัว หรือกดเบา ๆ เพียง 1 ครั้ง
 *
 * Type:
 * - position-based + direction-based
 * ❌ ไม่ใช้ shake
 * ❌ ไม่ใช้ oscillation
 * ❌ ไม่ใช้ push ออก
 */

const CONFIG = {
  // chest zone (normalized y)
  CHEST_Y_MIN: 0.48,
  CHEST_Y_MAX: 0.65,

  // inward movement
  MIN_INWARD: 0.04,   // ดึงเข้าหาตัวขั้นต่ำ
  MAX_INWARD: 0.12,   // กันการขยับแรงเกิน (จะกลายเป็นท่าอื่น)

  MAX_FRAMES: 40,
};

let state = 'idle';
// idle → hand_on_chest → inward_pull → finish

let frameCount = 0;
let startZ = null;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  startZ = null;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  const wrist = hand[0];
  const indexMcp = hand[5];
  const middleMcp = hand[9];
  const thumbTip = hand[4];

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- HAND SHAPE: FIST / SEMI-FIST ---------- */
  const fist =
    thumbTip.y > indexMcp.y &&
    indexMcp.y > hand[8].y &&
    middleMcp.y > hand[12].y;

  if (!fist) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (wrist.y >= CONFIG.CHEST_Y_MIN && wrist.y <= CONFIG.CHEST_Y_MAX) {
      state = 'hand_on_chest';
      startZ = wrist.z;
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- HAND ON CHEST ---------- */
  if (state === 'hand_on_chest') {
    const inward = startZ - wrist.z; // เข้าหาตัว = z ลด

    if (inward >= CONFIG.MIN_INWARD) {
      state = 'inward_pull';
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'hand_on_chest', inward },
    };
  }

  /* ---------- INWARD PULL ---------- */
  if (state === 'inward_pull') {
    const totalInward = startZ - wrist.z;

    if (totalInward > CONFIG.MAX_INWARD) {
      // ดึงแรงเกิน → อาจเป็นอารมณ์อื่น
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    reset();
    return {
      event: 'finished',
      word: 'อยาก',
      previousLandmarks: hand,
    };
  }

  return { event: 'none', previousLandmarks: hand };
}
