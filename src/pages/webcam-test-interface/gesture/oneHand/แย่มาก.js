/**
 * Gesture: แย่มาก (v1.1 - THUMB DOWN + SHAKE)
 *
 * Pattern:
 *  - Fist with thumb pointing DOWN
 *  - Stronger short shake (1–2 times)
 */

const CONFIG = {
  // ---- Shape ----
  THUMB_DOWN_RATIO: 0.035,

  // ---- Motion ----
  SIDE_SHAKE_DISTANCE: 0.1,   // แรงกว่า "ไม่ดี"
  REQUIRED_SHAKES: 1,
  MAX_SHAKES: 2,

  // ---- Timing ----
  MAX_FRAMES: 35,
};

let state = 'idle';
// idle → thumb_down_pose → shaking → finish

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

  const thumbTip = hand[4];
  const indexMcp = hand[5];
  const wrist = hand[0];

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  // -------- รูปมือ: thumb-down + กำมือ --------
  const thumbDown =
    thumbTip.y > indexMcp.y + CONFIG.THUMB_DOWN_RATIO;

  const fistLike =
    hand[8].y > indexMcp.y &&
    hand[12].y > indexMcp.y &&
    hand[16].y > indexMcp.y &&
    hand[20].y > indexMcp.y;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (thumbDown && fistLike) {
      state = 'thumb_down_pose';
      lastX = wrist.x;
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- THUMB DOWN POSE ---------- */
  if (state === 'thumb_down_pose') {
    if (!thumbDown || !fistLike) {
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
      debug: { state: 'thumb_down_pose', shakeCount },
    };
  }

  /* ---------- SHAKING ---------- */
  if (state === 'shaking') {
    if (shakeCount >= CONFIG.REQUIRED_SHAKES) {
      reset();
      return {
        event: 'finished',
        word: 'แย่มาก',
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