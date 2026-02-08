/**
 * Gesture: พูด (v1.1 - INTENT SAFE)
 *
 * Pattern:
 *  - Flat hand horizontal
 *  - Near mouth
 *  - Small vertical micro motion OR short hold
 */

const CONFIG = {
  // ---- Position ----
  MOUTH_ZONE_Y_MIN: 0.42,
  MOUTH_ZONE_Y_MAX: 0.55,

  // ---- Hand shape ----
  MIN_FINGER_SPREAD: 0.05,
  MAX_FINGER_SPREAD: 0.12,

  // ---- Motion / Hold ----
  MICRO_MOVE_THRESHOLD: 0.012,
  HOLD_FRAMES: 3,

  MAX_FRAMES: 50,
};

let state = 'idle';
// idle → near_mouth → intent → finish

let frameCount = 0;
let holdCounter = 0;
let lastY = null;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  holdCounter = 0;
  lastY = null;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  const wrist = hand[0];
  const indexTip = hand[8];
  const pinkyTip = hand[20];

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  const fingerSpread = Math.abs(indexTip.x - pinkyTip.x);

  const inMouthZone =
    wrist.y > CONFIG.MOUTH_ZONE_Y_MIN &&
    wrist.y < CONFIG.MOUTH_ZONE_Y_MAX;

  const flatHand =
    fingerSpread > CONFIG.MIN_FINGER_SPREAD &&
    fingerSpread < CONFIG.MAX_FINGER_SPREAD;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (inMouthZone && flatHand) {
      state = 'near_mouth';
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- NEAR MOUTH ---------- */
  if (state === 'near_mouth') {
    if (!inMouthZone || !flatHand) {
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    if (lastY !== null) {
      const dy = Math.abs(wrist.y - lastY);

      if (dy > CONFIG.MICRO_MOVE_THRESHOLD) {
        state = 'intent';
      } else {
        holdCounter++;
        if (holdCounter >= CONFIG.HOLD_FRAMES) {
          state = 'intent';
        }
      }
    }

    lastY = wrist.y;

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'near_mouth' },
    };
  }

  /* ---------- INTENT ---------- */
  if (state === 'intent') {
    reset();
    return {
      event: 'finished',
      word: 'พูด',
      previousLandmarks: hand,
    };
  }

  return { event: 'none', previousLandmarks: hand };
}