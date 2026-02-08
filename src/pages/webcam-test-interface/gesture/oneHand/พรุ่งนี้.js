/**
 * Gesture: พรุ่งนี้ (Tomorrow)
 * HUMAN-NATURAL BASE
 *
 * Meaning:
 * - มือขวา แบแนวตั้ง
 * - เริ่มใกล้แก้มขวา
 * - ลากมือออกไปด้านหน้า 1 ครั้ง
 *
 * Type:
 * - position + direction based
 * - ไม่ใช้ rotation
 * - ไม่ใช้ sequence
 */

const CONFIG = {
  // ระยะใกล้หน้า (เริ่ม intent)
  FACE_NEAR_DISTANCE: 0.12,

  // ระยะที่ถือว่าลากออกไปข้างหน้าแล้ว
  FORWARD_DISTANCE: 0.10,

  // velocity ขั้นต่ำ กันมือสั่น
  MIN_VELOCITY: 0.0015,

  // timeout
  MAX_FRAMES: 40,
};

let state = 'idle'; // idle | ready | move
let startPos = null;
let frameCount = 0;

const reset = () => {
  state = 'idle';
  startPos = null;
  frameCount = 0;
};

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // ใช้ข้อมือเป็นแกนหลัก
  const wrist = hand[0];

  // ตำแหน่งหน้า (ค่าประมาณกลางหน้า)
  const facePoint = { x: 0.5, y: 0.4, z: 0 };

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    const dFace = dist(wrist, facePoint);

    if (dFace < CONFIG.FACE_NEAR_DISTANCE) {
      state = 'ready';
      startPos = { ...wrist };
    }

    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- READY ---------- */
  if (state === 'ready') {
    const dz = wrist.z - startPos.z; // ออกไปข้างหน้า = z เปลี่ยน
    const velocity = Math.abs(dz);

    if (velocity > CONFIG.MIN_VELOCITY) {
      state = 'move';
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'ready', velocity },
    };
  }

  /* ---------- MOVE FORWARD ---------- */
  if (state === 'move') {
    const forwardDistance = Math.abs(wrist.z - startPos.z);

    if (forwardDistance >= CONFIG.FORWARD_DISTANCE) {
      reset();
      return {
        event: 'finished',
        word: 'พรุ่งนี้',
        previousLandmarks: hand,
      };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: { state: 'move', forwardDistance },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}