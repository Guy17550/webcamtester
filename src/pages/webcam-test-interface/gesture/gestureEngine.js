// src/pages/webcam-test-interface/gesture/gestureEngine.js

import * as กลับ from './oneHand/กลับ.js';
import * as กิน from './oneHand/กิน.js';
import * as เข้าใจ from './oneHand/เข้าใจ.js';
import * as ช้า from './oneHand/ช้า.js';
import * as ใช่ from './oneHand/ใช่.js';
import * as ถูก from './oneHand/ถูก.js';
//import * as ที่ไหน from './oneHand/ที่ไหน.js';
//import * as บ้าน from './oneHand/บ้าน.js';
//import * as ไป from './oneHand/ไป.js';
//import * as พรุ่งนี้ from './oneHand/พรุ่งนี้.js';
//import * as พูด from './oneHand/พูด.js';
//import * as มี from './oneHand/มี.js';
//import * as เมื่อวานนี้ from './oneHand/เมื่อวานนี้.js';
//import * as ไม่กิน from './oneHand/ไม่กิน.js';
//import * as ไม่ใช่ from './oneHand/ไม่ใช่.js';
//import * as ไม่ดี from './oneHand/ไม่ดี.js';
//import * as ไม่มี from './oneHand/ไม่มี.js';
//import * as ไม่อยาก from './oneHand/ไม่อยาก.js';
//import * as แย่มาก from './oneHand/แย่มาก.js';
//import * as ร้อน from './oneHand/ร้อน.js';
//import * as อยาก from './oneHand/อยาก.js';
//import * as อะไร from './oneHand/อะไร.js';




/**
 * SAFE / INTENT-AWARE GESTURE ENGINE (STABLE VERSION)
 *
 * หลักการ:
 * - engine ไม่ตีความ intent แทน gesture
 * - gesture ส่ง progress = intent
 * - gesture ส่ง finished = ยืนยัน
 * - lifecycle: idle → tracking → confirmed → ended
 * - มือออกเฟรม = reset ทั้งหมด
 */

const gestures = [
  // A: velocity-based
 อะไร,

  // B: compound / sequence
  ไม่กิน,
  ไม่มี,
  ไม่อยาก,

  // C: emotion / emphasis
  แย่มาก,
  ไม่ดี,
  ไม่ใช่,
  ร้อน,

  // D: semantic / near-face / body
  พูด,
  กิน,
  อยาก,
  มี,
  บ้าน,
  ที่ไหน,

  // E: base / directional
  ไป,
  กลับ,
  พรุ่งนี้,
  เมื่อวานนี้,
  ช้า,
  ใช่,
  ถูก,
  เข้าใจ
];

// lifecycle
let gestureState = 'idle'; // idle | tracking | confirmed | ended
let currentGestureWord = null;

// hand absence handling
let framesWithoutHand = 0;
const MAX_FRAMES_WITHOUT_HAND = 3;

export function analyzeGesture(results, previousLandmarks) {
  let updatedLandmarks = previousLandmarks;
  let debug = [];

  const hasHand =
    results?.multiHandLandmarks &&
    results.multiHandLandmarks.length > 0;

  /* ===============================
     HAND LEFT FRAME → HARD RESET
  =============================== */
  if (!hasHand) {
    framesWithoutHand++;

    if (framesWithoutHand >= MAX_FRAMES_WITHOUT_HAND) {
      gestureState = 'idle';
      currentGestureWord = null;
      framesWithoutHand = 0;

      return {
        detectedWord: null,
        previousLandmarks: null,
        gestureState: 'idle',
        debug: [{ state: 'idle', reason: 'hand_left_frame' }],
      };
    }

    return {
      detectedWord: null,
      previousLandmarks: updatedLandmarks,
      gestureState,
      debug: [{ state: gestureState, framesWithoutHand }],
    };
  }

  framesWithoutHand = 0;

  /* ===============================
     PROCESS GESTURES
  =============================== */
  for (const gesture of gestures) {
    const result = gesture.analyze(results, updatedLandmarks);
    if (!result) continue;

    if (result.previousLandmarks) {
      updatedLandmarks = result.previousLandmarks;
    }

    if (result.debug) {
      debug.push({
        gesture: result.word || 'unknown',
        ...result.debug,
      });
    }

    /* ---------- PROGRESS ---------- */
    if (result.event === 'progress') {
      // 🔑 จุดแก้สำคัญที่สุด:
      // progress จาก gesture = intent ทันที
      if (gestureState === 'idle') {
        gestureState = 'tracking';

        return {
          detectedWord: null,
          previousLandmarks: updatedLandmarks,
          gestureState: 'tracking',
          debug: [...debug, { state: 'tracking', note: 'intent_from_gesture' }],
        };
      }

      if (gestureState === 'tracking') {
        return {
          detectedWord: null,
          previousLandmarks: updatedLandmarks,
          gestureState: 'tracking',
          debug: [...debug, { state: 'tracking' }],
        };
      }
    }

    /* ---------- FINISHED ---------- */
    if (result.event === 'finished') {
      if (gestureState === 'tracking') {
        gestureState = 'confirmed';
        currentGestureWord = result.word;

        return {
          detectedWord: result.word,
          previousLandmarks: updatedLandmarks,
          gestureState: 'confirmed',
          debug: [...debug, { state: 'confirmed', word: result.word }],
        };
      }

      // finished จาก idle = ignore
      return {
        detectedWord: null,
        previousLandmarks: updatedLandmarks,
        gestureState,
        debug: [...debug, { state: gestureState, ignored: 'finish_from_idle' }],
      };
    }
  }

  /* ===============================
     STATE TRANSITIONS
  =============================== */

  // confirmed → ended (หนึ่งเฟรมถัดไป)
  if (gestureState === 'confirmed') {
    gestureState = 'ended';
    return {
      detectedWord: currentGestureWord,
      previousLandmarks: updatedLandmarks,
      gestureState: 'ended',
      debug: [{ state: 'ended' }],
    };
  }

  // ended → รอจนกว่ามือจะออกเฟรม
  if (gestureState === 'ended') {
    return {
      detectedWord: currentGestureWord,
      previousLandmarks: updatedLandmarks,
      gestureState: 'ended',
      debug: [{ state: 'ended_waiting_hand_leave' }],
    };
  }

  return {
    detectedWord: null,
    previousLandmarks: updatedLandmarks,
    gestureState,
    debug: [{ state: gestureState }],
  };
}