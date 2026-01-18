/**
 * Gesture: เขา (คนอื่น) - เวอร์ชันติดง่าย (High Sensitivity)
 */

const CONFIG = {
  // ลดเหลือ 2 เฟรม (เกือบจะทันทีแต่ยังกันค่ากระโดดได้)
  REQUIRED_FRAMES: 2, 
};

let holdCounter = 0;

const reset = () => {
  holdCounter = 0;
};

/**
 * ปรับปรุงการเช็คนิ้วให้ยืดหยุ่นขึ้น
 * โดยเช็คว่า "ปลายนิ้ว" อยู่สูงกว่า "ข้อต่อที่สอง" (PIP joint) 
 * แทนการเช็คโคนนิ้ว เพื่อให้ชี้แบบงอนิ้วนิดๆ ก็ยังติด
 */
const isExtendedFlex = (hand, tipIdx, midIdx) => {
  return hand[tipIdx].y < hand[midIdx].y;
};

export function analyze(results) {
  // ส่วนตรวจสอบเบื้องต้น (เหมือนเดิม)
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  // 1. ตรวจสอบสถานะนิ้ว (ใช้ข้อกลางนิ้วเป็นเกณฑ์เพื่อให้ติดง่ายขึ้น)
  const isIndexExtended = isExtendedFlex(hand, 8, 6);   
  const isMiddleFolded = !isExtendedFlex(hand, 12, 10); 
  const isRingFolded = !isExtendedFlex(hand, 16, 14);   
  const isPinkyFolded = !isExtendedFlex(hand, 20, 18);  

  // 2. ปรับทิศทาง (Pointing Away) ให้กว้างขึ้น
  // ลดค่า threshold จาก 0.05 เหลือ 0.02 เพื่อให้ชี้ตรงๆ ก็ยังติดง่าย
  const isPointingAway = Math.abs(hand[8].x - hand[5].x) > 0.02 || 
                         Math.abs(hand[8].z - hand[5].z) > 0.02;

  // 3. เงื่อนไขการตัดสิน
  if (isIndexExtended && isMiddleFolded && isRingFolded && isPinkyFolded) {
    // ถ้าผ่านเงื่อนไขนิ้ว เราจะให้คะแนนง่ายขึ้น
    holdCounter++;

    if (holdCounter >= CONFIG.REQUIRED_FRAMES) {
      return {
        event: 'finished',
        word: 'เขา',
        debug: { holdCounter, sensitivity: 'high' }
      };
    }
    return { event: 'progress' };
  } else {
    reset();
    return { event: 'none' };
  }
}
