/**
 * Gesture: มี (Predictive Version)
 * ใช้พิกัด Y ของหลังมือ (Point 9) เป็นหลัก
 */

const CONFIG = {
  // ระยะเคลื่อนที่ลงที่ถือว่า "เริ่มทำท่า" (0.01 = นิดเดียว)
  START_MOVE: 0.01,
  // ระยะเคลื่อนที่ลงที่ถือว่า "จบชื่อคำ" (0.05 = ประมาณ 1 ช่วงข้อมือ)
  FINISH_MOVE: 0.05,
  MAX_FRAMES: 40,
};

let state = 'idle'; 
let startY = null;
let frameCount = 0;

const reset = () => {
  state = 'idle';
  startY = null;
  frameCount = 0;
};

export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];
  const currentY = hand[9].y; // หลังมือ

  if (!startY) {
    startY = currentY;
    return { event: 'none', previousLandmarks: hand };
  }

  frameCount++;
  const diffY = currentY - startY; // ค่าเป็นบวกคือเคลื่อนที่ลง

  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    // ถ้าเริ่มขยับมือลงนิดเดียว ให้ส่ง progress เพื่อให้ Engine เปลี่ยนเป็น tracking
    if (diffY > CONFIG.START_MOVE) {
      state = 'tracking';
      return { 
        event: 'progress', 
        previousLandmarks: hand,
        debug: { diffY } 
      };
    }
  }

  /* ---------- TRACKING ---------- */
  if (state === 'tracking') {
    // ถ้าเลื่อนลงมาถึงระยะที่กำหนด ให้ส่ง finished
    if (diffY > CONFIG.FINISH_MOVE) {
      reset();
      return {
        event: 'finished',
        word: 'มี',
        previousLandmarks: hand,
        debug: { totalDist: diffY }
      };
    }

    // ถ้ามือขยับขึ้น (ย้อนกลับ) ให้ Reset กันพลาด
    if (diffY < -0.02) {
      reset();
    }

    return { event: 'progress', previousLandmarks: hand };
  }

  return { event: 'none', previousLandmarks: hand };
}
