/**
 * Gesture: ไม่ใช่ (STRICT VERSION)
 *
 * Concept:
 * - open palm
 * - palm facing camera clearly
 * - side-to-side shake (REAL 1 cycle)
 * - short but intentional
 * - reject noise / flick / other negations
 */

const WORD = "ไม่ใช่";

// =====================
// Internal State
// =====================
let startTime = null;
let lastWristX = null;
let lastDirection = null;
let directionChanges = 0;

let minX = null;
let maxX = null;

let lastTriggeredTime = 0;

// =====================
// Thresholds (STRICT)
// =====================
const MIN_DURATION = 250; // ms
const MAX_DURATION = 900;

const MIN_DIRECTION_CHANGES = 2; // L → R → L (1 full cycle)

const MIN_AMPLITUDE_RATIO = 0.1;  // shoulder width
const MAX_AMPLITUDE_RATIO = 0.25;

const PALM_DOT_THRESHOLD = 0.75;

const COOLDOWN_MS = 800;

// =====================
// Helpers
// =====================
function reset() {
  startTime = null;
  lastWristX = null;
  lastDirection = null;
  directionChanges = 0;
  minX = null;
  maxX = null;
}

function isOpenPalm(landmarks) {
  const tips = [8, 12, 16, 20]; // index → pinky tips
  const mcps = [5, 9, 13, 17];

  return tips.every((tip, i) => {
    return landmarks[tip].y < landmarks[mcps[i]].y;
  });
}

function palmFacingCamera(landmarks) {
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];

  const vx1 = indexMcp.x - wrist.x;
  const vy1 = indexMcp.y - wrist.y;
  const vx2 = pinkyMcp.x - wrist.x;
  const vy2 = pinkyMcp.y - wrist.y;

  const normalZ = vx1 * vy2 - vy1 * vx2;
  return Math.abs(normalZ) > PALM_DOT_THRESHOLD;
}

// =====================
// Main Analyze
// =====================
export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks?.[0]) {
    reset();
    return null;
  }

  const landmarks = results.multiHandLandmarks[0];
  const now = Date.now();

  // Cooldown protection
  if (now - lastTriggeredTime < COOLDOWN_MS) {
    reset();
    return null;
  }

  const wrist = landmarks[0];
  const shoulder = results.poseLandmarks?.[12]; // right shoulder (proxy)

  // =====================
  // Shape validation
  // =====================
  if (!isOpenPalm(landmarks)) {
    reset();
    return null;
  }

  if (!palmFacingCamera(landmarks)) {
    reset();
    return null;
  }

  // =====================
  // Position validation (height lock)
  // =====================
  if (shoulder) {
    const upper = shoulder.y - 0.25;
    const lower = shoulder.y + 0.1;

    if (wrist.y < upper || wrist.y > lower) {
      reset();
      return null;
    }
  }

  // =====================
  // Motion tracking
  // =====================
  if (!startTime) {
    startTime = now;
    lastWristX = wrist.x;
    minX = wrist.x;
    maxX = wrist.x;
    return {
      event: "progress",
      word: WORD,
      debug: { phase: "start" },
    };
  }

  const dx = wrist.x - lastWristX;
  const direction = dx > 0 ? "right" : "left";

  if (lastDirection && direction !== lastDirection) {
    directionChanges++;
  }

  lastDirection = direction;
  lastWristX = wrist.x;

  minX = Math.min(minX, wrist.x);
  maxX = Math.max(maxX, wrist.x);

  const duration = now - startTime;

  // =====================
  // Finish check
  // =====================
  if (duration >= MIN_DURATION) {
    const amplitude = Math.abs(maxX - minX);
    const shoulderWidth = shoulder ? Math.abs(shoulder.x - results.poseLandmarks[11].x) : 1;

    const ampRatio = amplitude / shoulderWidth;

    const valid =
      directionChanges >= MIN_DIRECTION_CHANGES &&
      duration <= MAX_DURATION &&
      ampRatio >= MIN_AMPLITUDE_RATIO &&
      ampRatio <= MAX_AMPLITUDE_RATIO;

    if (valid) {
      lastTriggeredTime = now;
      reset();

      return {
        event: "finished",
        word: WORD,
        debug: {
          duration,
          directionChanges,
          ampRatio: ampRatio.toFixed(2),
        },
      };
    }
  }

  // =====================
  // Timeout → reset
  // =====================
  if (duration > MAX_DURATION) {
    reset();
    return null;
  }

  return {
    event: "progress",
    word: WORD,
    debug: {
      duration,
      directionChanges,
    },
  };
}