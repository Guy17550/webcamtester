/**
 * Gesture: ที่ไหน (human-natural base)
 *
 * รูปมือ:
 * - มือขวา
 * - นิ้วชี้เหยียด
 * - นิ้วอื่นงอ
 *
 * ตำแหน่ง:
 * - ระดับไหล่ / หน้าอกบน
 *
 * การเคลื่อนไหว:
 * - สะบัดข้อมือเบา ๆ
 * - ใช้ rotation (angle change)
 * - 1 รอบก็ผ่าน
 */

const CONFIG = {
  // ตำแหน่งอ้างอิง (ช่วงไหล่/อก)
  SHOULDER_Y_MIN: 0.35,
  SHOULDER_Y_MAX: 0.65,

  // rotation
  ANGLE_THRESHOLD: 0.35, // ความเปลี่ยนมุมขั้นต่ำ
  REQUIRED_FLICKS: 1,

  MAX_FRAMES: 40,
};

let state = 'idle'; // idle | tracking
let frameCount = 0;
let flickCount = 0;
let lastAngle = null;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  flickCount = 0;
  lastAngle = null;
};

const angleBetween = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // ใช้ข้อมือ → นิ้วชี้
  const wrist = hand[0];
  const indexTip = hand[8];

  // เช็กตำแหน่ง (ระดับไหล่)
  if (
    indexTip.y < CONFIG.SHOULDER_Y_MIN ||
    indexTip.y > CONFIG.SHOULDER_Y_MAX
  ) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  const angle = angleBetween(wrist, indexTip);

  if (lastAngle === null) {
    lastAngle = angle;
    return { event: 'none', previousLandmarks: hand };
  }

  const deltaAngle = Math.abs(angle - lastAngle);
  lastAngle = angle;

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (deltaAngle > CONFIG.ANGLE_THRESHOLD) {
      state = 'tracking';
      flickCount++;

      return {
        event: 'progress',
        previousLandmarks: hand,
        debug: { state: 'tracking', deltaAngle, flickCount },
      };
    }

    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- TRACKING ---------- */
  if (state === 'tracking') {
    if (deltaAngle > CONFIG.ANGLE_THRESHOLD) {
      flickCount++;
    }

    if (flickCount >= CONFIG.REQUIRED_FLICKS) {
      reset();
      return {
        event: 'finished',
        word: 'ที่ไหน',
        previousLandmarks: hand,
        debug: { flickCount },
      };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'tracking', flickCount },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}