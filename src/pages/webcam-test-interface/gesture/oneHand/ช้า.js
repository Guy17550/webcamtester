/**
 * Gesture: ช้า (v1 - HUMAN NATURAL BASE)
 *
 * Intent:
 * - ลากมือขึ้น "ช้า ๆ อย่างตั้งใจ"
 * - ขึ้นอย่างเดียว (ห้ามลง)
 * - ความเร็วต่ำ + ต่อเนื่อง
 *
 * Pattern:
 * idle → slow_up → finished
 */

const CONFIG = {
  // จำนวนเฟรมขั้นต่ำที่ต้องลากขึ้น
  MIN_UP_FRAMES: 18,

  // ความเร็วแกน Y (ค่าลบ = ขึ้น)
  MIN_UP_VELOCITY: -0.0025, // ต่ำสุดที่ยังถือว่าเคลื่อน
  MAX_UP_VELOCITY: -0.0003, // สูงสุด (กันเร็วเกิน = swipe)

  // กันการส่าย / กระตุก
  MAX_Y_VARIANCE: 0.0015,

  // ถ้ามีการลงแรง → reset
  DOWN_VELOCITY_RESET: 0.0012,

  // จำกัดเวลา
  MAX_FRAMES: 90,
};

let state = 'idle'; // idle | slow_up
let frameCount = 0;
let upFrameCount = 0;

let lastY = null;
let velocityHistory = [];

const reset = () => {
  state = 'idle';
  frameCount = 0;
  upFrameCount = 0;
  lastY = null;
  velocityHistory = [];
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // ใช้ landmark กลางฝ่ามือ (เสถียรสุด)
  const point = hand[9];
  const y = point.y;

  if (lastY === null) {
    lastY = y;
    return { event: 'none', previousLandmarks: hand };
  }

  const velocityY = y - lastY; // <0 = ขึ้น
  lastY = y;

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ================= IDLE ================= */
  if (state === 'idle') {
    if (
      velocityY < CONFIG.MAX_UP_VELOCITY &&
      velocityY > CONFIG.MIN_UP_VELOCITY
    ) {
      state = 'slow_up';
      upFrameCount = 1;
      velocityHistory = [velocityY];

      return {
        event: 'progress',
        previousLandmarks: hand,
        debug: { state: 'slow_up_start', velocityY },
      };
    }

    return { event: 'none', previousLandmarks: hand };
  }

  /* ================= SLOW UP ================= */
  if (state === 'slow_up') {
    // ถ้ามีการลง → reset ทันที
    if (velocityY > CONFIG.DOWN_VELOCITY_RESET) {
      reset();
      return {
        event: 'none',
        previousLandmarks: hand,
        debug: { reset: 'moved_down' },
      };
    }

    // ต้องยังขึ้นช้า
    if (
      velocityY < CONFIG.MAX_UP_VELOCITY &&
      velocityY > CONFIG.MIN_UP_VELOCITY
    ) {
      upFrameCount++;
      velocityHistory.push(velocityY);

      // ตรวจความสม่ำเสมอ
      if (velocityHistory.length > 6) velocityHistory.shift();
      const variance =
        Math.max(...velocityHistory) -
        Math.min(...velocityHistory);

      if (variance > CONFIG.MAX_Y_VARIANCE) {
        reset();
        return {
          event: 'none',
          previousLandmarks: hand,
          debug: { reset: 'too_unstable' },
        };
      }

      // สำเร็จ
      if (upFrameCount >= CONFIG.MIN_UP_FRAMES) {
        reset();
        return {
          event: 'finished',
          word: 'ช้า',
          previousLandmarks: hand,
          debug: { upFrameCount },
        };
      }

      return {
        event: 'progress',
        previousLandmarks: hand,
        debug: { state: 'slow_up', upFrameCount },
      };
    }

    // หยุดหรือเร็วเกิน → reset
    reset();
    return {
      event: 'none',
      previousLandmarks: hand,
      debug: { reset: 'invalid_velocity' },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}
