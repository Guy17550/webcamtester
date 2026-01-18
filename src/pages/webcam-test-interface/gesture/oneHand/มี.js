const CONFIG = {
  MOVE_DISTANCE_THRESHOLD: 0.03, // ระยะรวม (ปรับง่าย)
  MAX_FRAMES: 60,
};

let state = 'idle';
let startPos = null;
let lastPos = null;
let frameCount = 0;
let totalDistance = 0;

const reset = () => {
  state = 'idle';
  startPos = null;
  lastPos = null;
  frameCount = 0;
  totalDistance = 0;
};

export function analyze(results) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];
  const point = hand[9]; // โคนนิ้วกลาง

  if (!startPos) {
    startPos = point;
    lastPos = point;
    return { event: 'none', previousLandmarks: hand };
  }

  const delta = Math.hypot(
    point.x - lastPos.x,
    point.y - lastPos.y
  );

  totalDistance += delta;
  lastPos = point;
  frameCount++;

  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  if (state === 'idle' && totalDistance > CONFIG.MOVE_DISTANCE_THRESHOLD * 0.3) {
    state = 'tracking';
    return { event: 'progress', previousLandmarks: hand };
  }

  if (state === 'tracking' && totalDistance > CONFIG.MOVE_DISTANCE_THRESHOLD) {
    reset();
    return {
      event: 'finished',
      word: 'มี',
      previousLandmarks: hand,
    };
  }

  return { event: 'none', previousLandmarks: hand };
}
