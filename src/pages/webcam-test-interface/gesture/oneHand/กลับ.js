/**
 * Gesture: กลับ
 * ROTATION-ONLY (MATCH REAL SIGN)
 *
 * - มือแทบไม่เคลื่อนตำแหน่ง
 * - หมุนข้อมือออกด้านขวา
 * - ไม่สนรูปนิ้ว
 */

const CONFIG = {
  ROTATION_START_THRESHOLD: 0.10, // ⬅ ลดนิดเดียว (เดิม 0.15)
  ROTATION_FINISH_THRESHOLD: 0.32, // ⬅ ลดจาก 0.45 → ใช้ได้กับท่าจริง
  MAX_FRAMES: 30,
};

let state = 'idle'; // idle | tracking
let startPalmVector = null;
let frameCount = 0;

/* ======================
   VECTOR UTILS
====================== */

const palmVector = (hand) => {
  const wrist = hand[0];
  const middleMCP = hand[9];
  return {
    x: middleMCP.x - wrist.x,
    y: middleMCP.y - wrist.y,
    z: middleMCP.z - wrist.z,
  };
};

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const mag = (v) => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);

/**
 * rotation score: 0 = ไม่หมุน, 1 = หมุนแรง
 */
const rotationScore = (a, b) =>
  1 - Math.abs(dot(a, b) / (mag(a) * mag(b) + 0.0001));

const reset = () => {
  state = 'idle';
  startPalmVector = null;
  frameCount = 0;
};

/* ======================
   ANALYZE
====================== */

export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // เฟรมแรก: เก็บ landmark เฉย ๆ
  if (!previousLandmarks) {
    return {
      event: 'none',
      previousLandmarks: hand,
    };
  }

  const currentPalm = palmVector(hand);
  const prevPalm = palmVector(previousLandmarks);
  const rot = rotationScore(prevPalm, currentPalm);

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (rot >= CONFIG.ROTATION_START_THRESHOLD) {
      state = 'tracking';
      startPalmVector = prevPalm;
      frameCount = 1;
    }

    return {
      event: 'none',
      previousLandmarks: hand,
      debug: { state, rot },
    };
  }

  /* ---------- TRACKING ---------- */
  frameCount++;

  const totalRotation = rotationScore(startPalmVector, currentPalm);

  // timeout
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  // ✅ หมุนชัด = กลับ
  if (totalRotation >= CONFIG.ROTATION_FINISH_THRESHOLD) {
    reset();
    return {
      event: 'finished',
      word: 'กลับ',
      previousLandmarks: hand,
      debug: {
        totalRotation,
        frameCount,
      },
    };
  }

  return {
    event: 'progress',
    previousLandmarks: hand,
    debug: {
      totalRotation,
      frameCount,
    },
  };
}