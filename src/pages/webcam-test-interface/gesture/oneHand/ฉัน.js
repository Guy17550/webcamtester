/**
 * Gesture: ฉัน (Me) - High Sensitivity
 * Pattern: นิ้วชี้ชี้เข้าหาตัว
 */

const CONFIG = {
  REQUIRED_FRAMES: 2, // ทำท่าเพียงครู่เดียวก็ติดเลย
};

let holdCounter = 0;

const reset = () => {
  holdCounter = 0;
};

// เช็คว่านิ้วกางหรือไม่ โดยเทียบปลายนิ้วกับข้อต่อกลางนิ้ว (ติดง่ายกว่าเทียบโคน)
const isExtendedFlex = (hand, tipIdx, midIdx) => {
  return hand[tipIdx].y < hand[midIdx].y;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // 1. สถานะนิ้ว: นิ้วชี้กาง (Index), นิ้วอื่นพับ (กลาง, นาง, ก้อย)
  const isIndexExtended = isExtendedFlex(hand, 8, 6);
  const isMiddleFolded = !isExtendedFlex(hand, 12, 10);
  const isRingFolded = !isExtendedFlex(hand, 16, 14);
  const isPinkyFolded = !isExtendedFlex(hand, 20, 18);

  // 2. ตรรกะ "ชี้เข้าหาตัว" (สำคัญมาก)
  // ปกติถ้าชี้เข้าหาตัว ปลายนิ้วชี้ (8) มักจะอยู่ "ต่ำกว่า" หรือ "ใกล้เคียง" กับโคนนิ้วชี้ (5) ในแกน Y
  // หรือเช็คว่าปลายนิ้วชี้ (8) อยู่ลึกกว่า (Z) ข้อมือ (0) ในบางมุมมอง
  const isPointingInward = hand[8].y > hand[5].y - 0.05; 

  // 3. รวมเงื่อนไข
  if (isIndexExtended && isMiddleFolded && isRingFolded && isPinkyFolded && isPointingInward) {
    holdCounter++;

    if (holdCounter >= CONFIG.REQUIRED_FRAMES) {
      return {
        event: 'finished',
        word: 'ฉัน',
        debug: { state: 'pointing_me' }
      };
    }
    return { event: 'progress' };
  } else {
    reset();
    return { event: 'none' };
  }
}
