/**
 * Gesture: ไม่อยาก
 *
 * Compound gesture (sequence-based)
 *
 * Phase A: chest-touch (ความรู้สึกของฉัน)
 * Phase B: soft reject (ปฏิเสธแบบนุ่ม)
 */

const CONFIG = {
  // Phase A: chest touch
  CHEST_DISTANCE: 0.18,
  HOLD_FRAMES: 4,

  // Phase B: soft reject
  FORWARD_MIN: 0.04,
  FORWARD_MAX: 0.12,
  DOWN_MIN: 0.03,
  MAX_VELOCITY: 0.02,

  MAX_FRAMES: 80,
};

let state = 'idle';
// idle → on_chest → hold → soft_reject → finish

let frameCount = 0;
let holdCounter = 0;
let startPos = null;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  holdCounter = 0;
  startPos = null;
};

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

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

  // chest proxy (กลางอก)
  const chestPoint = {
    x: 0.5,
    y: 0.6,
  };

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- SHAPE CHECK ---------- */
  const openPalm =
    Math.abs(indexTip.y - wrist.y) > 0.05 &&
    Math.abs(middleTip.y - wrist.y) > 0.05;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (openPalm && dist(wrist, chestPoint) < CONFIG.CHEST_DISTANCE) {
      state = 'on_chest';
      holdCounter = 0;
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- ON CHEST ---------- */
  if (state === 'on_chest') {
    if (dist(wrist, chestPoint) < CONFIG.CHEST_DISTANCE) {
      holdCounter++;
      if (holdCounter >= CONFIG.HOLD_FRAMES) {
        state = 'hold';
        startPos = { ...wrist };
      }
    } else {
      reset();
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'on_chest', holdCounter },
    };
  }

  /* ---------- HOLD ---------- */
  if (state === 'hold') {
    const dx = wrist.x - startPos.x;
    const dy = wrist.y - startPos.y;

    // soft forward or downward
    if (
      (dx > CONFIG.FORWARD_MIN && dx < CONFIG.FORWARD_MAX) ||
      (dy > CONFIG.DOWN_MIN)
    ) {
      state = 'soft_reject';
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'hold' },
    };
  }

  /* ---------- SOFT REJECT ---------- */
  if (state === 'soft_reject') {
    reset();
    return {
      event: 'finished',
      word: 'ไม่อยาก',
      previousLandmarks: hand,
    };
  }

  return { event: 'none', previousLandmarks: hand };
}