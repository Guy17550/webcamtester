const CONFIG = {
  VELOCITY_THRESHOLD: 0.02,
  MAX_FRAMES: 20,
};

let state = 'idle';
let lastPos = null;
let frameCount = 0;

const reset = () => {
  state = 'idle';
  lastPos = null;
  frameCount = 0;
};

export function analyze(results, previousLandmarks) {
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length !== 1) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];
  const point = hand[12]; // fingertip

  if (!lastPos) {
    lastPos = point;
    return { event: 'none', previousLandmarks: hand };
  }

  const velocity = Math.hypot(
    point.x - lastPos.x,
    point.y - lastPos.y
  );

  lastPos = point;
  frameCount++;

  if (frameCount > CONFIG.MAX_FRAMES) {
    reset();
    return { event: 'none', previousLandmarks: hand };
  }

  if (state === 'idle' && velocity > CONFIG.VELOCITY_THRESHOLD) {
    state = 'tracking';
    return { event: 'progress', previousLandmarks: hand };
  }

  if (state === 'tracking' && velocity > CONFIG.VELOCITY_THRESHOLD * 1.5) {
    reset();
    return {
      event: 'finished',
      word: 'กิน',
      previousLandmarks: hand,
    };
  }

  return { event: 'none', previousLandmarks: hand };
}

  return { event: 'none', previousLandmarks: hand };
}
