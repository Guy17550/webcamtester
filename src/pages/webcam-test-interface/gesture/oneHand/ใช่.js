/**
 * Gesture: ใช้ (human-natural rotation base)
 *
 * Pattern:
 * - ใช้ index + middle finger
 * - วาดวงกลมในระนาบหน้ากล้อง
 * - อย่างน้อย 1 รอบ = finished
 *
 * Concept:
 * - ใช้การสะสมมุม (rotation / angle accumulation)
 * - ไม่พึ่ง velocity เข้า–ออก
 * - กันนิ้วสั่น / กันลากเส้นตรง
 */

const CONFIG = {
  REQUIRED_ROUNDS: 1,        // 1 รอบก็พอ
  MIN_RADIUS: 0.02,          // กันนิ้วสั่น
  MAX_FRAMES: 90,
  MIN_DELTA_ANGLE: 0.01,     // กัน noise
};

let state = 'idle'; // idle | rotating
let frameCount = 0;

let lastAngle = null;
let accumulatedAngle = 0;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  lastAngle = null;
  accumulatedAngle = 0;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // index + middle finger
  const indexTip = hand[8];
  const middleTip = hand[12];

  // center ระหว่าง 2 นิ้ว
  const center = {
    x: (indexTip.x + middleTip.x) / 2,
    y: (indexTip.y + middleTip.y) / 2,
  };

  // vector จาก center → index
  const vx = indexTip.x - center.x;
  const vy = indexTip.y - center.y;

  const radius = Math.hypot(vx, vy);

  // กันนิ้วสั่น / ไม่กางนิ้ว
  if (radius < CONFIG.MIN_RADIUS) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  const angle = Math.atan2(vy, vx);

  if (lastAngle === null) {
    lastAngle = angle;
    return { event: 'none', previousLandmarks: hand };
  }

  // delta angle (normalize)
  let delta = angle - lastAngle;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;

  lastAngle = angle;
  frameCount++;

  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  // กัน noise
  if (Math.abs(delta) < CONFIG.MIN_DELTA_ANGLE) {
    return {
      event: state === 'rotating' ? 'progress' : 'none',
      previousLandmarks: hand,
    };
  }

  accumulatedAngle += Math.abs(delta);

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    state = 'rotating';
    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'rotating', accumulatedAngle },
    };
  }

  /* ---------- ROTATING ---------- */
  if (state === 'rotating') {
    if (accumulatedAngle >= 2 * Math.PI * CONFIG.REQUIRED_ROUNDS) {
      reset();
      return {
        event: 'finished',
        word: 'ใช้',
        previousLandmarks: hand,
      };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'rotating', accumulatedAngle },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}
