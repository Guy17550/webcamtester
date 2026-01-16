/**
 * Sentence Engine - v1 (Stable / Contracted)
 *
 * Responsibility:
 * - Collect confirmed words from gestureEngine
 * - Prevent duplicate consecutive words
 * - Support pause / resume
 * - Support undo last word
 * - Support confirm (lock) sentence
 * - Support reset for new sentence
 *
 * IMPORTANT:
 * - This file is the SINGLE SOURCE OF TRUTH for sentence state
 * - UI must read sentence ONLY via getSentenceState()
 * - No gesture / no UI / no MediaPipe logic here
 */

// =====================
// Internal State
// =====================

let sentenceArray = [];
let lastAcceptedWord = null;

let isPaused = false;
let isSentenceConfirmed = false;

// =====================
// Core APIs
// =====================

/**
 * Accept a confirmed word and append to sentence
 * @param {string} word
 * @returns {Array<string>} current sentence (copy)
 */
export function acceptWord(word) {
  // ❌ ignore when paused or confirmed
  if (isPaused || isSentenceConfirmed) {
    return [...sentenceArray];
  }

  if (!word || typeof word !== "string") {
    return [...sentenceArray];
  }

  const trimmedWord = word.trim();
  if (!trimmedWord) {
    return [...sentenceArray];
  }

  // ❌ prevent duplicate consecutive words
  if (trimmedWord === lastAcceptedWord) {
    return [...sentenceArray];
  }

  sentenceArray.push(trimmedWord);
  lastAcceptedWord = trimmedWord;

  return [...sentenceArray];
}

/**
 * Confirm current sentence (LOCK)
 * After this, no more words are accepted until reset
 */
export function confirmSentence() {
  if (sentenceArray.length === 0) {
    return {
      confirmed: false,
      reason: "empty_sentence",
    };
  }

  isSentenceConfirmed = true;

  return {
    confirmed: true,
    sentence: [...sentenceArray],
    formatted: sentenceArray.join(" "),
    wordCount: sentenceArray.length,
  };
}

/**
 * Undo last accepted word
 */
export function undoLastWord() {
  if (sentenceArray.length === 0) {
    return [...sentenceArray];
  }

  sentenceArray.pop();
  lastAcceptedWord =
    sentenceArray[sentenceArray.length - 1] || null;

  return [...sentenceArray];
}

/**
 * Pause sentence input (gestures still run, but words ignored)
 */
export function pauseSentence() {
  isPaused = true;
}

/**
 * Resume sentence input
 */
export function resumeSentence() {
  isPaused = false;
}

/**
 * Reset everything for new sentence
 */
export function resetSentence() {
  const previousSentence = [...sentenceArray];

  sentenceArray = [];
  lastAcceptedWord = null;
  isPaused = false;
  isSentenceConfirmed = false;

  return {
    reset: true,
    previousSentence,
  };
}

// =====================
// Read-only helpers
// =====================

/**
 * Get full sentence state (READ-ONLY)
 * UI should use this instead of touching internals
 */
export function getSentenceState() {
  return {
    sentence: [...sentenceArray],
    formatted: sentenceArray.join(" "),
    wordCount: sentenceArray.length,
    isPaused,
    isConfirmed: isSentenceConfirmed,
    isEmpty: sentenceArray.length === 0,
  };
}