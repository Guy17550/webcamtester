/**
 * Gesture: เข้าใจ
 *
 * Pattern:
 * 1) กำมืออยู่ติดขมับขวา
 * 2) เปลี่ยนเป็นชี้นิ้วชี้ขึ้น (ตำแหน่งเดิม)
 *
 * - ไม่ใช้ velocity
 * - ไม่ใช้การเคลื่อนที่
 * - ใช้ shape + position + sequence
 */

const CONFIG = {
  // ตำแหน่งขมับขวา (ค่าประมาณ ใช้ได้จริง)
  TEMPLE_X_MIN: 0.55,
  TEMPLE_Y_MIN: 0.15,
  TEMPLE_Y_MAX: 0.35,

  HOLD_FRAMES: 4,     // ต้องกำมือค้างกี่เฟรม
  MAX_FRAMES: 40,     // กันค้าง
};

let state = 'idle'; // idle | fist_ready | waiting_index
let holdCount = 0;
let frameCount = 0;

const reset = () => {
  state = 'idle';
  holdCount = 0;
  frameCount = 0;
};

/* =========================
   UTIL FUNCTIONS
========================= */

// ใช้กลางฝ่ามือเป็นจุดอ้างอิง
const isAtRightTemple = (hand) => {
  const palm = hand[9];
  return (
    palm.x > CONFIG.TEMPLE_X_MIN &&
    palm.y > CONFIG.TEMPLE_Y_MIN &&
    palm.y < CONFIG.TEMPLE_Y_MAX
  );
};

// เช็คกำมือ (ปลายนิ้วต่ำกว่า PIP)
const isFist = (hand) => {
  const fingers = [
    [8, 6],  // index
    [12, 10], // middle
    [16, 14], // ring
    [20, 18], // pinky
  ];

  let folded = 0;
  fingers.forEach(([tip, pip]) => {
    if (hand[tip].y > hand[pip].y) folded++;
  });

  return folded >= 3; // ไม่ต้องเป๊ะทุกนิ้ว
};

// เช็คนิ้วชี้ขึ้น
const isIndexUp = (hand) => {
  const indexUp = hand[8].y < hand[6].y;
  const middleFold = hand[12].y > hand[10].y;
  const ringFold = hand[16].y > hand[14].y;
  const pinkyFold = hand[20].y > hand[18].y;

  return indexUp && middleFold && ringFold && pinkyFold;
};

/* =========================
   ANALYZE
========================= */

export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];
  frameCount++;

  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (isAtRightTemple(hand) && isFist(hand)) {
      holdCount++;
      if (holdCount >= CONFIG.HOLD_FRAMES) {
        state = 'fist_ready';
      }
    } else {
      holdCount = 0;
    }

    return {
      event: 'none',
      previousLandmarks: hand,
      debug: { state, holdCount },
    };
  }

  /* ---------- FIST READY ---------- */
  if (state === 'fist_ready') {
    if (!isAtRightTemple(hand)) {
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    if (isIndexUp(hand)) {
      reset();
      return {
        event: 'finished',
        word: 'เข้าใจ',
        previousLandmarks: hand,
        debug: { state: 'finished' },
      };
    }

    state = 'waiting_index';
    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state },
    };
  }

  /* ---------- WAITING INDEX ---------- */
  if (state === 'waiting_index') {
    if (!isAtRightTemple(hand)) {
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    if (isIndexUp(hand)) {
      reset();
      return {
        event: 'finished',
        word: 'เข้าใจ',
        previousLandmarks: hand,
        debug: { state: 'finished' },
      };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}