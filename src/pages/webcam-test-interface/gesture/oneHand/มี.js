/**
 * Gesture: มี
 * EASY-TRIGGER & PREDICTIVE VERSION
 */

const CONFIG = {
  // ความแม่นยำของรูปมือ (ยิ่งน้อยยิ่งติดง่าย)
  FIST_CONFIDENCE: 0.22, 
  
  // ระยะเคลื่อนที่ขั้นต่ำที่ใช้ "เดา" ว่ากำลังทำท่าอยู่
  GESTURE_THRESHOLD: 0.03,

  MAX_FRAMES: 50,
};

let state = 'idle';
let startPos = null;
let frameCount = 0;

const reset = () => {
  state = 'idle';
  startPos = null;
  frameCount = 0;
};

// เช็คว่ารูปมือ "ใกล้เคียง" การกำหมัดหรือไม่
const isFistPredictive = (hand) => {
  const wrist = hand[0];
  const tips = [8, 12, 16, 20];
  // หาค่าเฉลี่ยความห่างของนิ้ว ถ้าส่วนใหญ่หดเข้าหาฝ่ามือ ถือว่าผ่าน
  const avgDist = tips.reduce((sum, t) => sum + Math.hypot(hand[t].x - wrist.x, hand[t].y - wrist.y), 0) / 4;
  return avgDist < CONFIG.FIST_CONFIDENCE;
};

export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];
  const point = hand[9]; // ใช้หลังมือเป็นจุดหลัก

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* 1. เช็ครูปมือเบื้องต้น (เดาจากกำหมัด) */
  const handMatch = isFistPredictive(hand);

  /* 2. บันทึกจุดเริ่มต้น */
  if (!startPos) {
    startPos = { x: point.x, y: point.y };
    return { event: 'none', previousLandmarks: hand };
  }

  const movementY = point.y - startPos.y;
  const totalMovement = Math.hypot(point.x - startPos.x, point.y - startPos.y);

  /* 3. Logic การเดาและตัดสิน (Prediction Logic) */
  if (state === 'idle') {
    // ถ้ากำมือ และเริ่มขยับนิดเดียว (เข้าสู่ Tracking ทันที)
    if (handMatch && totalMovement > 0.01) {
      state = 'tracking';
      return { event: 'progress', previousLandmarks: hand };
    }
  }

  if (state === 'tracking') {
    // จังหวะเดา: ถ้ายังกำมืออยู่ และมีการเลื่อนมือลง (Y เพิ่ม) 
    // หรือมีการขยับที่ชัดเจนในระยะสั้นๆ ให้ตัดสินว่าเป็นท่า "มี" เลย
    if (handMatch && (movementY > CONFIG.GESTURE_THRESHOLD || totalMovement > CONFIG.GESTURE_THRESHOLD * 1.5)) {
      reset();
      return {
        event: 'finished',
        word: 'มี',
        previousLandmarks: hand,
      };
    }
  }

  return { event: 'none', previousLandmarks: hand };
}
