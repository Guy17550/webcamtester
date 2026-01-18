/**
 * Gesture: มี
 * DISPLACEMENT-BASED (ใช้หลักการเดียวกับท่ากินแต่เป็นแนวตั้ง)
 */

const CONFIG = {
  // ระยะการเคลื่อนที่ลงที่ต้องทำได้ (Displacement)
  MIN_DRAG_DOWN: 0.08, 

  // ความเร็วขั้นต่ำที่ยอมรับ (กันมือสั่น)
  MOVE_THRESHOLD: 0.002,

  MAX_FRAMES: 40,
};

let state = 'idle'; // idle | tracking
let startY = null;
let frameCount = 0;
let lastY = null;

const reset = () => {
  state = 'idle';
  startY = null;
  lastY = null;
  frameCount = 0;
};

export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];
  // ใช้จุดที่ 9 (หลังมือ) เพราะเสถียรที่สุดจากรูปที่คุณส่งมา
  const currentY = hand[9].y; 

  if (lastY === null) {
    lastY = currentY;
    return { event: 'none', previousLandmarks: hand };
  }

  // คำนวณความเร็วแนวตั้ง (บวกคือลง ลบคือขึ้น)
  const velocityY = currentY - lastY;
  lastY = currentY;

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    // ถ้าเริ่มขยับมือลง (velocityY เป็นบวก)
    if (velocityY > CONFIG.MOVE_THRESHOLD) {
      state = 'tracking';
      startY = currentY;
      return { event: 'progress', previousLandmarks: hand };
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- TRACKING ---------- */
  if (state === 'tracking') {
    const totalDisplacement = currentY - startY;

    // เงื่อนไขสำเร็จ: ขยับมือลงมาได้ระยะที่กำหนด
    if (totalDisplacement > CONFIG.MIN_DRAG_DOWN) {
      reset();
      return {
        event: 'finished',
        word: 'มี',
        previousLandmarks: hand,
      };
    }

    // ถ้าเปลี่ยนทิศทาง (ขยับขึ้น) ให้ reset เพื่อป้องกันการติดมั่ว
    if (velocityY < -0.01) {
      reset();
    }

    return { 
      event: 'progress', 
      previousLandmarks: hand,
      debug: { totalDisplacement } 
    };
  }

  return { event: 'none', previousLandmarks: hand };
}
