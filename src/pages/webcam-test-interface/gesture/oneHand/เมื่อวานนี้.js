/**
 * Gesture: เมื่อวานนี้ (Yesterday)
 * HUMAN-NATURAL BASE
 *
 * Concept:
 * - มือขวาแบ อยู่ข้างศีรษะด้านขวา
 * - นิ้ว 4 เหยียดชิด, นิ้วโป้งกางเล็กน้อย
 * - ลากมือย้อนหลัง (temple → หลังศีรษะ)
 * - ทำ 1 ครั้ง
 *
 * Type:
 * - direction-based + position-based
 * - ไม่ใช้ rotation / velocity เป็นตัวหลัก
 */

const CONFIG = {
  // head / temple proxy (ค่าประมาณ normalized)
  HEAD_POINT: { x: 0.65, y: 0.32, z: 0 },

  HEAD_DISTANCE: 0.18,

  // backward movement threshold
  BACKWARD_DISTANCE: 0.09,

  // flat hand tolerance
  FLAT_VARIANCE: 0.025,

  MAX_FRAMES: 60,
};

let state = 'idle'; // idle | near_head | moving_back
let frameCount = 0;
let startX = null;

const reset = () => {
  state = 'idle';
  frameCount = 0;
  startX = null;
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
  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  frameCount++;
  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- รูปมือ: แบนจริง ---------- */
  const maxY = Math.max(
    indexTip.y,
    middleTip.y,
    ringTip.y,
    pinkyTip.y
  );
  const minY = Math.min(
    indexTip.y,
    middleTip.y,
    ringTip.y,
    pinkyTip.y
  );

  const isFlatHand =
    maxY - minY < CONFIG.FLAT_VARIANCE;

  /* ---------- ใกล้ศีรษะ ---------- */
  const dHead = dist(wrist, CONFIG.HEAD_POINT);
  const isNearHead = dHead < CONFIG.HEAD_DISTANCE;

  /* ---------- IDLE ---------- */
  if (state === 'idle') {
    if (isFlatHand && isNearHead) {
      state = 'near_head';
      startX = wrist.x;
    }
    return { event: 'none', previousLandmarks: hand };
  }

  /* ---------- NEAR HEAD ---------- */
  if (state === 'near_head') {
    const movedBackward = wrist.x > startX;

    if (movedBackward) {
      state = 'moving_back';
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: {
        state: 'near_head',
        isFlatHand,
        dHead,
      },
    };
  }

  /* ---------- MOVING BACK ---------- */
  if (state === 'moving_back') {
    const backwardDistance = wrist.x - startX;

    if (backwardDistance >= CONFIG.BACKWARD_DISTANCE) {
      reset();
      return {
        event: 'finished',
        word: 'เมื่อวานนี้',
        previousLandmarks: hand,
      };
    }

    return {
      event: 'progress',
      previousLandmarks: hand,
      debug: {
        state: 'moving_back',
        backwardDistance,
      },
    };
  }

  return { event: 'none', previousLandmarks: hand };
}