import React, { useEffect, useRef, useState } from "react";
import { analyzeGesture } from "../gesture/gestureEngine";

// sentence layer
import {
  acceptWord,
  resetSentence,
  undoLastWord,
  pauseSentence,
  resumeSentence,
  confirmSentence,
  getSentenceState,
} from "../gesture/sentenceEngine";

const COOLDOWN_MS = 400;

const VideoDisplay = ({ videoRef, isActive }) => {
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const rafRef = useRef(null);
  const prevLandmarksRef = useRef(null);
  const cooldownUntilRef = useRef(0);

  // UI state
  const [detectedWord, setDetectedWord] = useState("");
  const [gestureStatus, setGestureStatus] = useState("กำลังตรวจจับ...");
  const [sentenceState, setSentenceState] = useState(getSentenceState());
  const [isPaused, setIsPaused] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  /* =====================
     SPEAK SENTENCE
  ===================== */
  const speakSentence = () => {
    if (!sentenceState.formatted) return;
    const utterance = new SpeechSynthesisUtterance(sentenceState.formatted);
    utterance.lang = "th-TH";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  /* =====================
     CAMERA + GESTURE LOOP
  ===================== */
  useEffect(() => {
    if (!isActive || !videoRef?.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const syncCanvas = () => {
      if (!video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    const drawHand = (hand) => {
      ctx.fillStyle = "#38bdf8";
      hand.forEach((p) => {
        ctx.beginPath();
        ctx.arc(
          p.x * canvas.width,
          p.y * canvas.height,
          4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    };

    const onResults = (results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results?.multiHandLandmarks?.[0]) {
        drawHand(results.multiHandLandmarks[0]);
      }

      const now = Date.now();
      if (now < cooldownUntilRef.current) return;

      const result = analyzeGesture(results, prevLandmarksRef.current);
      prevLandmarksRef.current = result?.previousLandmarks;
      setDebugInfo(result?.debug);

      const state = result?.gestureState;

      if (state === "idle") {
        setGestureStatus("กำลังตรวจจับ...");
        setDetectedWord("");
      } else if (state === "tracking") {
        setGestureStatus("กำลังติดตาม...");
      } else if (state === "confirmed") {
        setGestureStatus("ยืนยันแล้ว");

        if (result?.detectedWord && !isPaused && !isConfirmed) {
          acceptWord(result.detectedWord);
          setSentenceState(getSentenceState());
          setDetectedWord(result.detectedWord);
          cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
        }
      } else if (state === "ended") {
        setGestureStatus("เสร็จสิ้น");
      }
    };

    const hands = new window.Hands({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    const loop = async () => {
      if (video.readyState >= 2) {
        syncCanvas();
        await hands.send({ image: video });
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (handsRef.current) handsRef.current.close();
    };
  }, [isActive, videoRef, isPaused, isConfirmed]);

  /* =====================
     UI
  ===================== */
  return (
    <div className="relative h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col">
      
      {/* CAMERA (compact for mobile) */}
      <div className="relative w-full h-[220px] md:h-[360px] overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ pointerEvents: "none" }}
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1 px-4 py-3 overflow-y-auto pb-28">
        <div className="text-sm text-blue-200">
          สถานะ: <b>{gestureStatus}</b>
        </div>

        <div className="text-4xl font-bold text-cyan-300 mt-3">
          {detectedWord || "—"}
        </div>

        {/* Sentence bubbles */}
        <div className="mt-5 flex flex-wrap gap-2">
          {sentenceState.sentence.length === 0 && (
            <span className="opacity-50">ยังไม่มีคำ</span>
          )}
          {sentenceState.sentence.map((word, idx) => (
            <span
              key={idx}
              className={`px-3 py-1 rounded-full text-sm font-semibold
                ${
                  idx === sentenceState.sentence.length - 1
                    ? "bg-cyan-500 text-black shadow-lg shadow-cyan-400/50"
                    : "bg-blue-700"
                }`}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-950/95 border-t border-blue-700 px-3 py-3 flex gap-2 justify-between">
        <button
          className="px-3 py-2 bg-yellow-500 text-black rounded"
          onClick={() => {
            if (isPaused) {
              resumeSentence();
              setIsPaused(false);
            } else {
              pauseSentence();
              setIsPaused(true);
            }
          }}
        >
          {isPaused ? "Resume" : "Pause"}
        </button>

        <button
          className="px-3 py-2 bg-blue-500 rounded"
          onClick={() => {
            undoLastWord();
            setSentenceState(getSentenceState());
          }}
        >
          Undo
        </button>

        <button
          className="px-3 py-2 bg-purple-600 rounded"
          onClick={speakSentence}
          disabled={!sentenceState.formatted}
        >
          🔊
        </button>

        <button
          className="px-4 py-2 bg-green-600 rounded font-bold"
          onClick={() => {
            const result = confirmSentence();
            if (result.confirmed) {
              setIsConfirmed(true);
              alert("ยืนยันประโยค: " + result.formatted);
            }
          }}
        >
          Confirm
        </button>

        <button
          className="px-3 py-2 bg-red-600 rounded"
          onClick={() => {
            resetSentence();
            setSentenceState(getSentenceState());
            setIsPaused(false);
            setIsConfirmed(false);
          }}
        >
          Reset
        </button>
      </div>

      {/* DEBUG */}
      {debugInfo && (
        <pre className="absolute top-2 right-2 text-xs bg-black/50 p-2 rounded max-w-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default VideoDisplay;
