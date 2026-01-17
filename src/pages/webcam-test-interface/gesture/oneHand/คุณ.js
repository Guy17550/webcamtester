/**
 * Gesture: เขา (He/She/Person)
 * ชี้ไปที่คนอื่น
 * * Pattern:
 * - นิ้วชี้กางออก (Index Extended)
 * - นิ้วอื่นๆ (กลาง, นาง, ก้อย) ต้องกำลง
 * - ทิศทางปลายนิ้วชี้ต้องไม่อยู่ใกล้ตัวมากเกินไป
 */

const CONFIG = {
  REQUIRED_FRAMES: 3, 
};

let holdCounter = 0;

const reset = () => {
  holdCounter = 0;
};

// เช็คว่านิ้วกางหรือไม่
const isExtended = (hand, tipIdx, baseIdx) => {
  return hand[tipIdx].y < hand[baseIdx].y;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // 1. ตรวจสอบสถานะนิ้ว
  const isIndexExtended = isExtended(hand, 8, 6);   // นิ้วชี้ต้องกาง
  const isMiddleFolded = !isExtended(hand, 12, 10); // นิ้วกลางต้องพับ
  const isRingFolded = !isExtended(hand, 16, 14);   // นิ้วนางต้องพับ
  const isPinkyFolded = !isExtended(hand, 20, 18);  // นิ้วก้อยต้องพับ

  // 2. ตรวจสอบทิศทาง (นิ้วชี้ต้องชี้ไปข้างหน้าหรือข้างๆ ไม่ได้ชี้ขึ้นฟ้าตรงๆ หรือชี้เข้าหาตัว)
  // เช็คว่าระยะ X ของปลายนิ้ว (8) ต่างจากโคนนิ้วชี้ (5) อย่างชัดเจน
  const isPointingAway = Math.abs(hand[8].x - hand[5].x) > 0.05;

  if (isIndexExtended && isMiddleFolded && isRingFolded && isPinkyFolded && isPointingAway) {
    holdCounter++;

    if (holdCounter >= CONFIG.REQUIRED_FRAMES) {
      return {
        event: 'finished',
        word: 'เขา', // หมายถึง He/She/They
        debug: { holdCounter, state: 'pointing_other' }
      };
    }
    return { event: 'progress', debug: { holdCounter } };
  } else {
    reset();
    return { event: 'none' };
  }
}
