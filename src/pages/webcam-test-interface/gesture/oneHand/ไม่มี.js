/**
 * Gesture: ไม่มี
 *
 * Compound gesture (sequence-based)
 *
 * Phase A: "มี"
 *  - fist + thumb up
 *  - near chest / shoulder
 *  - short hold
 *
 * Phase B: "ไม่มี"
 *  - open palm
 *  - fingers spread
 *  - short side shake (1 time)
 */

const CONFIG = {
  // --- Phase A (มี) ---
  THUMB_UP_THRESHOLD: 0.035,
  FIST_THRESHOLD: 0.04,
  HOLD_FRAMES: 4,

  // --- Phase B (ไม่มี) ---
  FINGER_SPREAD_THRESHOLD: 0.05,
  SIDE_DISPLACEMENT_MIN: 0.08,
  SIDE_DISPLACEMENT_MAX: 0.18,
  REQUIRED_SHAKES: 1,

  // timing
  MAX_FRAMES: 90,
};

let state = 'idle';
// idle → thumb_up → hold → open_palm → shake → finish

let frameCount = 0;
let holdCounter = 0;
let shakeCount = 0;
let lastX = null;
let direction = null;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  holdCounter = 0;
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
  const thumbTip = hand[4];
  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- SHAPE CHECKS ---------- */

  // Phase A: thumb-up + fist
  const thumbUp =
    (indexTip.y - thumbTip.y) > CONFIG.THUMB_UP_THRESHOLD;

  const fistLike =
    Math.abs(indexTip.y - wrist.y) < CONFIG.FIST_THRESHOLD &&
    Math.abs(middleTip.y - wrist.y) < CONFIG.FIST_THRESHOLD &&
    Math.abs(ringTip.y - wrist.y) < CONFIG.FIST_THRESHOLD &&
    Math.abs(pinkyTip.y - wrist.y) < CONFIG.FIST_THRESHOLD;

  // Phase B: open palm + spread
  const fingerSpread =
    Math.abs(indexTip.x - pinkyTip.x) > CONFIG.FINGER_SPREAD_THRESHOLD;

  const openPalm =
    Math.abs(indexTip.y - wrist.y) > CONFIG.FIST_THRESHOLD &&
    Math.abs(middleTip.y - wrist.y) > CONFIG.FIST_THRESHOLD;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (thumbUp && fistLike) {
      state = 'thumb_up';
      holdCounter = 0;
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- THUMB UP ---------- */
  if (state === 'thumb_up') {
    if (thumbUp && fistLike) {
      holdCounter++;
      if (holdCounter >= CONFIG.HOLD_FRAMES) {
        state = 'hold';
      }
    } else {
      reset();
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'thumb_up', holdCounter },
    };
  }

  /* ---------- HOLD ---------- */
  if (state === 'hold') {
    if (openPalm && fingerSpread) {
      state = 'open_palm';
      lastX = wrist.x;
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'hold' },
    };
  }

  /* ---------- OPEN PALM ---------- */
  if (state === 'open_palm') {
    const dx = wrist.x - lastX;

    if (Math.abs(dx) > CONFIG.SIDE_DISPLACEMENT_MIN) {
      direction = dx > 0 ? 'right' : 'left';
      state = 'shake';
    }

    lastX = wrist.x;

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'open_palm' },
    };
  }

  /* ---------- SHAKE ---------- */
  if (state === 'shake') {
    const dx = wrist.x - lastX;

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

    if (shakeCount >= CONFIG.REQUIRED_SHAKES) {
      reset();
      return {
        event: 'finished',
        word: 'ไม่มี',
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