/**
 * Gesture: ดี (Good / Thumbs Up) - High Sensitivity
 * Pattern: ชูนิ้วโป้งขึ้น นิ้วอื่นพับ
 */

const CONFIG = {
  REQUIRED_FRAMES: 2, // ทำท่าแป๊บเดียวติดเลย
};

let holdCounter = 0;

const reset = () => {
  holdCounter = 0;
};

// เช็คว่านิ้วกางหรือไม่ (เทียบปลายนิ้วกับข้อต่อกลางนิ้ว)
const isExtendedFlex = (hand, tipIdx, midIdx) => {
  return hand[tipIdx].y < hand[midIdx].y;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  /**
   * 1. ตรวจสอบนิ้วโป้ง (Thumb) 
   * นิ้วโป้งจะพิเศษกว่านิ้วอื่น เพราะกางออกด้านข้าง 
   * ในท่า "ดี" ปลายนิ้วโป้ง (4) ต้องอยู่สูงกว่าข้อต่อโคนนิ้วโป้ง (2)
   */
  const isThumbUp = hand[4].y < hand[2].y;

  /**
   * 2. ตรวจสอบนิ้วที่เหลือ (ชี้, กลาง, นาง, ก้อย)
   * ต้องพับเก็บทั้งหมด (ปลายนิ้วอยู่ต่ำกว่าข้อต่อกลางนิ้ว)
   */
  const isIndexFolded = hand[8].y > hand[6].y;
  const isMiddleFolded = hand[12].y > hand[10].y;
  const isRingFolded = hand[16].y > hand[14].y;
  const isPinkyFolded = hand[20].y > hand[18].y;

  // 3. รวมเงื่อนไข: นิ้วโป้งตั้งขึ้น + นิ้วอื่นพับ
  if (isThumbUp && isIndexFolded && isMiddleFolded && isRingFolded && isPinkyFolded) {
    holdCounter++;

    if (holdCounter >= CONFIG.REQUIRED_FRAMES) {
      return {
        event: 'finished',
        word: 'ดี',
        debug: { state: 'thumbs_up' }
      };
    }
    return { event: 'progress' };
  } else {
    reset();
    return { event: 'none' };
  }
}
