/**
 * Gesture: อะไร (STRICT VERSION)
 *
 * Concept:
 * - index finger only
 * - very fast flick (velocity spike)
 * - short duration
 * - single intentional motion
 * - no side movement
 */

const WORD = "อะไร";

// =====================
// Internal State
// =====================
let startTime = null;
let lastPos = null;
let maxVelocity = 0;

let triggeredTime = 0;

// =====================
// Thresholds (STRICT)
// =====================
const MAX_DURATION = 300; // ms
const MIN_VELOCITY = 0.015;
const MIN_ACCELERATION = 0.02;

const MAX_SIDE_RATIO = 0.25;
const COOLDOWN_MS = 700;

// =====================
// Helpers
// =====================
function reset() {
  startTime = null;
  lastPos = null;
  maxVelocity = 0;
}

function isIndexOnly(landmarks) {
  const indexTip = landmarks[8];
  const indexMcp = landmarks[5];

  const others = [
    [12, 9],  // middle
    [16, 13], // ring
    [20, 17], // pinky
  ];

  const indexExtended = indexTip.y < indexMcp.y;

  const othersFolded = others.every(
    ([tip, mcp]) => landmarks[tip].y > landmarks[mcp].y
  );

  return indexExtended && othersFolded;
}

// =====================
// Main Analyze
// =====================
export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks?.[0]) {
    reset();
    return null;
  }

  const now = Date.now();

  if (now - triggeredTime < COOLDOWN_MS) {
    reset();
    return null;
  }

  const landmarks = results.multiHandLandmarks[0];
  const indexTip = landmarks[8];

  // =====================
  // Shape check
  // =====================
  if (!isIndexOnly(landmarks)) {
    reset();
    return null;
  }

  // =====================
  // Start tracking
  // =====================
  if (!startTime) {
    startTime = now;
    lastPos = { x: indexTip.x, y: indexTip.y };
    return {
      event: "progress",
      word: WORD,
      debug: { phase: "start" },
    };
  }

  const dx = indexTip.x - lastPos.x;
  const dy = indexTip.y - lastPos.y;

  const velocity = Math.sqrt(dx * dx + dy * dy);
  maxVelocity = Math.max(maxVelocity, velocity);

  // side movement guard
  if (Math.abs(dx) > Math.abs(dy) * MAX_SIDE_RATIO) {
    reset();
    return null;
  }

  lastPos = { x: indexTip.x, y: indexTip.y };

  const duration = now - startTime;

  // =====================
  // Finish check
  // =====================
  if (
    duration <= MAX_DURATION &&
    maxVelocity >= MIN_VELOCITY &&
    velocity >= MIN_ACCELERATION &&
    dy < 0 // must go up or forward
  ) {
    triggeredTime = now;
    reset();

    return {
      event: "finished",
      word: WORD,
      debug: {
        duration,
        maxVelocity: maxVelocity.toFixed(4),
      },
    };
  }

  if (duration > MAX_DURATION) {
    reset();
    return null;
  }

  return {
    event: "progress",
    word: WORD,
    debug: {
      duration,
      velocity: velocity.toFixed(4),
    },
  };
}