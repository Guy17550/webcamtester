const CONFIG = {
  VERY_LOW_THRESHOLD: 0.001, // ต่ำมากเพื่อให้ติดแน่นอน
  MAX_FRAMES: 100,
};

let state = 'idle';
let startY = null;
let frameCount = 0;

const reset = () => {
  state = 'idle';
  startY = null;
  frameCount = 0;
};

export function analyze(results, previousLandmarks) {
  // เช็คว่ามี Data เข้ามาไหม
  if (!results?.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    reset();
    return { event: 'none' };
  }

  const hand = results.multiHandLandmarks[0];
  const point = hand[9]; // จุดหลังมือ

  if (!startY) {
    startY = point.y;
    return { event: 'none', previousLandmarks: hand };
  }

  frameCount++;
  const distY = Math.abs(point.y - startY); // ดูแค่ว่ามีการขยับจากจุดเริ่มไหม

  // ถ้าขยับนิ้วนิดเดียว (0.001) ให้ Finished ทันทีเพื่อทดสอบระบบ
  if (distY > CONFIG.VERY_LOW_THRESHOLD) {
    reset();
    return {
      event: 'finished',
      word: 'มี (TEST)', 
      previousLandmarks: hand,
    };
  }

  if (frameCount > CONFIG.MAX_FRAMES) reset();

  return { event: 'none', previousLandmarks: hand };
}
