/**
 * Gesture: ไม่กิน (v1.1 - SEQUENCE STRICT)
 *
 * Pattern:
 *  Phase A: กิน (เข้าใกล้ปาก)
 *  Phase B: แบมือปฏิเสธ ที่หน้าอก
 */

const CONFIG = {
  // ---- Phase A (กิน) ----
  NEAR_MOUTH_DISTANCE: 0.13,
  HOLD_NEAR_FRAMES: 2,

  // ---- Phase B (ไม่) ----
  CHEST_ZONE_Y: 0.6,
  OPEN_PALM_MIN_SPREAD: 0.06,
  HOLD_REJECT_FRAMES: 2,

  // ---- Timing ----
  MAX_GAP_FRAMES: 45,
};

let state = 'idle'; 
// idle → eat_near → transition → reject → finish

let frameCount = 0;
let holdNearCounter = 0;
let rejectHoldCounter = 0;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  holdNearCounter = 0;
  rejectHoldCounter = 0;
};

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  const wrist = hand[0];
  const indexTip = hand[8];
  const pinkyTip = hand[20];

  const mouthPoint = { x: 0.5, y: 0.42, z: 0 };

  frameCount++;
  if (frameCount > CONFIG.MAX_GAP_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    const d = dist(indexTip, mouthPoint);

    if (d < CONFIG.NEAR_MOUTH_DISTANCE) {
      holdNearCounter++;
      if (holdNearCounter >= CONFIG.HOLD_NEAR_FRAMES) {
        state = 'eat_near';
      }
    } else {
      holdNearCounter = 0;
    }

    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- PHASE A: EAT NEAR ---------- */
  if (state === 'eat_near') {
    // ออกจากปาก = เตรียมเข้าสู่ phase ปฏิเสธ
    const d = dist(indexTip, mouthPoint);
    if (d > CONFIG.NEAR_MOUTH_DISTANCE + 0.04) {
      state = 'transition';
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'eat_near' },
    };
  }

  /* ---------- TRANSITION ---------- */
  if (state === 'transition') {
    // ตรวจว่าเป็นแบมือจริง + อยู่หน้าอก
    const fingerSpread = Math.abs(indexTip.x - pinkyTip.x);

    if (
      fingerSpread > CONFIG.OPEN_PALM_MIN_SPREAD &&
      wrist.y > CONFIG.CHEST_ZONE_Y
    ) {
      rejectHoldCounter++;
      if (rejectHoldCounter >= CONFIG.HOLD_REJECT_FRAMES) {
        state = 'reject';
      }
    } else {
      rejectHoldCounter = 0;
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'transition' },
    };
  }

  /* ---------- PHASE B: REJECT ---------- */
  if (state === 'reject') {
    reset();
    return {
      event: 'finished',
      word: 'ไม่กิน',
      previousLandmarks: hand,
    };
  }

  return { event: 'none', previousLandmarks: hand };
}