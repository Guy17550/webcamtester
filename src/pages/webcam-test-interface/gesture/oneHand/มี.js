const CONFIG = {
  // ค่าความห่างเฉลี่ยของนิ้ว (ปรับให้กว้างขึ้นเพื่อให้ติดง่าย ไม่ต้องกำแน่น)
  HAND_OPENNESS_THRESHOLD: 0.25, 
  
  // ระยะเคลื่อนที่ที่ระบบจะเริ่ม "เดา" ว่าเป็นท่า "มี"
  PREDICTIVE_MOVE: 0.02,

  MAX_FRAMES: 60,
};

let state = 'idle';
let startPos = null;
let frameCount = 0;

const reset = () => {
  state = 'idle';
  startPos = null;
  frameCount = 0;
};

// เช็คว่ามือมีการ "รวบนิ้ว" เข้าหาหลังมือ (จุดที่ 9) หรือไม่
const isHandClustered = (hand) => {
  const center = hand[9]; // ใช้หลังมือเป็นศูนย์กลาง
  const fingers = [4, 8, 12, 16, 20]; // ปลายนิ้วทุกนิ้ว
  const avgDist = fingers.reduce((sum, f) => sum + Math.hypot(hand[f].x - center.x, hand[f].y - center.y), 0) / 5;
  return avgDist < CONFIG.HAND_OPENNESS_THRESHOLD;
};

export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];
  const point = hand[9]; 

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  const handMatch = isHandClustered(hand);

  if (!startPos) {
    startPos = { x: point.x, y: point.y };
    return { event: 'none', previousLandmarks: hand };
  }

  // ดูการเคลื่อนที่สะสม
  const diffY = point.y - startPos.y;
  const totalDist = Math.hypot(point.x - startPos.x, point.y - startPos.y);

  if (state === 'idle') {
    // ถ้ามือรวบ และมีการขยับเพียงเล็กน้อย (Predictive Start)
    if (handMatch && totalDist > 0.01) {
      state = 'tracking';
      return { event: 'progress', previousLandmarks: hand };
    }
  }

  if (state === 'tracking') {
    // ระบบเดา: ถ้ายังรวบมืออยู่ และมือเคลื่อนที่ลง (diffY > 0) หรือขยับเกินเกณฑ์
    // เราจะตัดสินว่าคือท่า "มี" ทันทีโดยไม่ต้องรอให้จบกระบวนการสะบัด
    if (handMatch && (diffY > CONFIG.PREDICTIVE_MOVE || totalDist > CONFIG.PREDICTIVE_MOVE * 1.5)) {
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
