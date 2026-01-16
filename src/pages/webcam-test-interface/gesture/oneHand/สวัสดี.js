/**
 * Thai Sign Language Gesture: สวัสดี (Sawasdee)
 * STATIC GESTURE — TIME ACCUMULATION VERSION
 */

const CONFIG = {
  FINGER_GAP_MAX: 0.12,
  PALM_VERTICAL_RATIO: 1.05,

  HAND_CENTER_MIN: 0.25,
  HAND_CENTER_MAX: 0.75,

  HOLD_TIME_MS: 500,        // ต้อง “อยู่ในท่า” รวม ≥ 0.5s
  STABLE_MOVE_MAX: 0.06,    // อนุญาต skeleton สั่น
  MAX_UNSTABLE_GAP_MS: 120, // สั่นสั้น ๆ ได้ ไม่รีเซ็ต
};

let holdAccumulated = 0;
let lastFrameTime = null;
let lastStableTime = null;

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/* ---------- SHAPE ---------- */

const fingersStraight = (hand) => {
  const wrist = hand[0];
  const fingers = [[8,7],[12,11],[16,15],[20,19]];
  return fingers.every(([tip, mid]) =>
    dist(hand[tip], wrist) > dist(hand[mid], wrist)
  );
};

const fingersClose = (hand) => {
  const gaps = [
    dist(hand[8], hand[12]),
    dist(hand[12], hand[16]),
    dist(hand[16], hand[20]),
  ];
  return Math.max(...gaps) < CONFIG.FINGER_GAP_MAX;
};

const palmVertical = (hand) => {
  const w = hand[0], m = hand[12];
  return (
    Math.abs(m.y - w.y) /
    (Math.abs(m.x - w.x) + 0.0001)
  ) > CONFIG.PALM_VERTICAL_RATIO;
};

const handCentered = (hand) => {
  const x = hand.reduce((s, p) => s + p.x, 0) / hand.length;
  return x > CONFIG.HAND_CENTER_MIN && x < CONFIG.HAND_CENTER_MAX;
};

const handStable = (hand, prev) => {
  if (!prev) return false;
  const points = [0, 9];
  let total = 0;
  for (const i of points) {
    total += dist(hand[i], prev[i]);
  }
  return (total / points.length) <= CONFIG.STABLE_MOVE_MAX;
};

const reset = () => {
  holdAccumulated = 0;
  lastFrameTime = null;
  lastStableTime = null;
};

/* ---------- ANALYZE ---------- */

export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];

  const shapeOK =
    fingersStraight(hand) &&
    fingersClose(hand) &&
    palmVertical(hand) &&
    handCentered(hand);

  if (!shapeOK) {
    reset();
    return { event: 'none' };
  }

  const now = performance.now();

  if (!lastFrameTime) {
    lastFrameTime = now;
    lastStableTime = now;
    return { event: 'progress' };
  }

  const dt = now - lastFrameTime;
  lastFrameTime = now;

  if (handStable(hand, previousLandmarks)) {
    holdAccumulated += dt;
    lastStableTime = now;
  } else {
    // ถ้าสั่นไม่นาน → ไม่ reset
    if (now - lastStableTime > CONFIG.MAX_UNSTABLE_GAP_MS) {
      reset();
      return { event: 'none' };
    }
  }

  if (holdAccumulated >= CONFIG.HOLD_TIME_MS) {
    reset();
    return {
      event: 'finished',
      word: 'สวัสดี',
      debug: { holdAccumulated },
    };
  }

  return {
    event: 'progress',
    debug: { holdAccumulated },
  };
}