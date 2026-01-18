/**
 * Gesture: ดู (Watch / Look) - High Sensitivity
 * Pattern: นิ้วชี้และนิ้วกลางกางออก (เป็นรูปตัว V) นิ้วที่เหลือพับ
 */

const CONFIG = {
  REQUIRED_FRAMES: 2, 
};

let holdCounter = 0;

const reset = () => {
  holdCounter = 0;
};

// เช็คการกางนิ้ว (ใช้ข้อกลางนิ้วเทียบ เพื่อให้คนกำมือไม่แน่นทำติดได้)
const isExtendedFlex = (hand, tipIdx, midIdx) => {
  return hand[tipIdx].y < hand[midIdx].y;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // 1. นิ้วที่ต้อง "กาง" (ชี้ และ กลาง)
  const isIndexExtended = isExtendedFlex(hand, 8, 6);
  const isMiddleExtended = isExtendedFlex(hand, 12, 10);

  // 2. นิ้วที่ต้อง "พับ" (นาง และ ก้อย)
  // ใช้เกณฑ์ที่ผ่อนปรน: ปลายนิ้วอยู่ต่ำกว่าข้อกลางนิ้ว
  const isRingFolded = hand[16].y > hand[14].y;
  const isPinkyFolded = hand[20].y > hand[18].y;

  // 3. ทิศทาง (Optional แต่ช่วยให้แม่นขึ้น)
  // สำหรับท่า "ดู" นิ้วชี้และนิ้วกลางมักจะแยกออกจากกันเล็กน้อย (รูปตัว V)
  const fingerSpread = Math.abs(hand[8].x - hand[12].x);

  // 4. เงื่อนไขการตัดสิน: ชี้+กลาง กาง / นาง+ก้อย พับ
  if (isIndexExtended && isMiddleExtended && isRingFolded && isPinkyFolded) {
    holdCounter++;

    if (holdCounter >= CONFIG.REQUIRED_FRAMES) {
      return {
        event: 'finished',
        word: 'ดู',
        debug: { state: 'looking', fingerSpread }
      };
    }
    return { event: 'progress' };
  } else {
    reset();
    return { event: 'none' };
  }
}
