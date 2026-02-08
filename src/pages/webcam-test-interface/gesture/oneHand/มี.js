/**
 * Gesture: มี (Have)
 * HUMAN-NATURAL BASE
 *
 * Concept:
 * - มือขวา กำหลวม
 * - นิ้วโป้งชี้ขึ้นเด่น
 * - นิ้วอื่นงอ (ไม่แบ)
 * - มืออยู่ใกล้หน้าอกด้านขวา
 * - ค้างท่า = intent
 *
 * Type:
 * - hand-shape-based + position-based
 * - movement เป็น secondary
 */

const CONFIG = {
  // chest zone (ค่าประมาณตำแหน่งอก)
  CHEST_POINT: { x: 0.6, y: 0.55, z: 0 },

  CHEST_DISTANCE: 0.2,

  // รูปมือ
  THUMB_UP_DIFF: 0.04, // thumb_tip ต้องสูงกว่า index_mcp

  // ต้องค้างกี่เฟรม
  HOLD_FRAMES: 4,

  MAX_FRAMES: 60,
};

let state = 'idle'; // idle | shape_ok | hold
let frameCount = 0;
let holdCounter = 0;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  holdCounter = 0;
};

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  const wrist = hand[0];
  const thumbTip = hand[4];
  const thumbIP = hand[3];
  const indexMCP = hand[5];

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- รูปมือ: กำหลวม + thumb up ---------- */
  const isThumbUp =
    thumbTip.y < indexMCP.y - CONFIG.THUMB_UP_DIFF;

  const fingersCurled =
    hand[8].y > indexMCP.y &&   // index_tip
    hand[12].y > indexMCP.y && // middle_tip
    hand[16].y > indexMCP.y && // ring_tip
    hand[20].y > indexMCP.y;   // pinky_tip

  const isHandShapeOK = isThumbUp && fingersCurled;

  /* ---------- ตำแหน่งใกล้อก ---------- */
  const dChest = dist(wrist, CONFIG.CHEST_POINT);
  const isNearChest = dChest < CONFIG.CHEST_DISTANCE;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (isHandShapeOK && isNearChest) {
      state = 'shape_ok';
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- SHAPE OK ---------- */
  if (state === 'shape_ok') {
    if (isHandShapeOK && isNearChest) {
      holdCounter++;
      if (holdCounter >= CONFIG.HOLD_FRAMES) {
        state = 'hold';
      }
    } else {
      reset();
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: {
        state: 'shape_ok',
        isThumbUp,
        fingersCurled,
        dChest,
        holdCounter,
      },
    };
  }

  /* ---------- HOLD ---------- */
  if (state === 'hold') {
    reset();
    return {
      event: 'finished',
      word: 'มี',
      previousLandmarks: hand,
    };
  }

  return { event: 'none', previousLandmarks: hand };
}