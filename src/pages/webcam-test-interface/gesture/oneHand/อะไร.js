/**
 * Gesture: อะไร (v1.1 - FLICK INTENT SAFE)
 *
 * Pattern:
 *  - Index finger up
 *  - One fast flick (up or forward)
 *  - Very short duration
 */

const CONFIG = {
  // ---- Velocity / Flick ----
  FLICK_VELOCITY: 0.045,      // ต้องเร็วจริง
  MAX_DISPLACEMENT: 0.08,    // ระยะสั้น (กัน swipe)

  // ---- Timing ----
  MAX_FRAMES: 20,            // จบเร็ว
};

let state = 'idle';
// idle → ready → flick → finish

let frameCount = 0;
let lastPos = null;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  lastPos = null;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  const indexTip = hand[8];
  const indexMcp = hand[5];

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  // รูปมือ: นิ้วชี้ต้องเหยียด
  const indexExtended = indexTip.y < indexMcp.y;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (indexExtended) {
      state = 'ready';
      lastPos = { ...indexTip };
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- READY ---------- */
  if (state === 'ready') {
    if (!indexExtended) {
      reset();
      return { event: 'none', previousLandmarks: hand };
    }

    const dx = indexTip.x - lastPos.x;
    const dy = indexTip.y - lastPos.y;

    const velocity = Math.hypot(dx, dy);
    const displacement = Math.hypot(
      indexTip.x - lastPos.x,
      indexTip.y - lastPos.y
    );

    lastPos = { ...indexTip };

    // ตรวจ flick เร็ว + ระยะสั้น
    if (
      velocity > CONFIG.FLICK_VELOCITY &&
      displacement < CONFIG.MAX_DISPLACEMENT
    ) {
      state = 'flick';
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'ready', velocity },
    };
  }

  /* ---------- FLICK ---------- */
  if (state === 'flick') {
    reset();
    return {
      event: 'finished',
      word: 'อะไร',
      previousLandmarks: hand,
    };
  }

  return { event: 'none', previousLandmarks: hand };
}