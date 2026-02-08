/**
 * Gesture: ร้อน (v1 - HEAT IN BODY)
 *
 * Pattern:
 *  - Semi-fist / fist
 *  - Hand starts near neck
 *  - Short downward drag to chest (1 time)
 */

const CONFIG = {
  // ---- Zones ----
  NECK_Y_MAX: 0.38,     // บริเวณคอ (บน)
  CHEST_Y_MIN: 0.42,    // บริเวณอก (ล่าง)

  // ---- Motion ----
  MIN_DOWN_DISTANCE: 0.06, // ระยะลากลงขั้นต่ำ
  MAX_DOWN_DISTANCE: 0.18, // กันลากยาวเกิน

  // ---- Timing ----
  MAX_FRAMES: 30,
};

let state = 'idle';
// idle → hand_on_neck → dragging → finish

let startY = null;
let frameCount = 0;

const reset = () => {
  state = 'idle';
  startY = null;
  frameCount = 0;
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

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  // -------- รูปมือ: กำ / กึ่งกำ --------
  const fistLike =
    hand[8].y > indexMcp.y &&
    hand[12].y > middleMcp.y &&
    hand[16].y > middleMcp.y &&
    hand[20].y > middleMcp.y;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (fistLike && wrist.y < CONFIG.NECK_Y_MAX) {
      state = 'hand_on_neck';
      startY = wrist.y;
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- HAND ON NECK ---------- */
  if (state === 'hand_on_neck') {
    if (!fistLike) {
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    const downDist = wrist.y - startY;

    if (downDist > CONFIG.MIN_DOWN_DISTANCE) {
      state = 'dragging';
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'hand_on_neck', downDist },
    };
  }

  /* ---------- DRAGGING ---------- */
  if (state === 'dragging') {
    const totalDown = wrist.y - startY;

    // กันลากยาวเกิน (จะคล้าย "เหนื่อย")
    if (totalDown > CONFIG.MAX_DOWN_DISTANCE) {
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    if (wrist.y > CONFIG.CHEST_Y_MIN) {
      reset();
      return {
        event: 'finished',
        word: 'ร้อน',
        previousLandmarks: hand,
      };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'dragging', totalDown },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}