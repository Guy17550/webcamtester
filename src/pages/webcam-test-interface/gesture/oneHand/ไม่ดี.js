/**
 * Gesture: ไม่ดี (v1.1 - PINKY SHAKE INTENT SAFE)
 *
 * Pattern:
 *  - Fist with pinky extended
 *  - Short side-to-side shake (1–2 times)
 */

const CONFIG = {
  // ---- Shape ----
  PINKY_EXTENSION_RATIO: 0.035,

  // ---- Motion ----
  SIDE_SHAKE_DISTANCE: 0.07,
  REQUIRED_SHAKES: 1,
  MAX_SHAKES: 2,

  // ---- Timing ----
  MAX_FRAMES: 35,
};

let state = 'idle';
// idle → pinky_pose → shaking → finish

let frameCount = 0;
let lastX = null;
let shakeCount = 0;
let direction = 0;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  lastX = null;
  shakeCount = 0;
  direction = 0;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  const pinkyTip = hand[20];
  const ringTip = hand[16];
  const indexMcp = hand[5];
  const wrist = hand[0];

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  // -------- รูปมือ: นิ้วก้อยชี้ + กำมือ --------
  const pinkyExtended =
    pinkyTip.y < ringTip.y - CONFIG.PINKY_EXTENSION_RATIO;

  const fistLike =
    hand[8].y > indexMcp.y &&
    hand[12].y > indexMcp.y &&
    hand[16].y > indexMcp.y;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (pinkyExtended && fistLike) {
      state = 'pinky_pose';
      lastX = wrist.x;
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- PINKY POSE ---------- */
  if (state === 'pinky_pose') {
    if (!pinkyExtended || !fistLike) {
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    const dx = wrist.x - lastX;

    if (Math.abs(dx) > CONFIG.SIDE_SHAKE_DISTANCE) {
      const newDir = Math.sign(dx);

      if (direction !== 0 && newDir !== direction) {
        shakeCount++;
      }

      direction = newDir;
      lastX = wrist.x;

      state = 'shaking';
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'pinky_pose', shakeCount },
    };
  }

  /* ---------- SHAKING ---------- */
  if (state === 'shaking') {
    if (shakeCount >= CONFIG.REQUIRED_SHAKES) {
      reset();
      return {
        event: 'finished',
        word: 'ไม่ดี',
        previousLandmarks: hand,
      };
    }

    if (shakeCount > CONFIG.MAX_SHAKES) {
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'shaking', shakeCount },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}