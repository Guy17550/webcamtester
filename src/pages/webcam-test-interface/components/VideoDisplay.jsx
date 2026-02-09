import React, { useEffect, useRef, useState } from "react";
import { analyzeGesture } from "../gesture/gestureEngine";

// 🔹 sentence layer (SINGLE SOURCE OF TRUTH)
import {
  acceptWord,
  getSentenceState,
  resetSentence,
  undoLastWord,
  pauseSentence,
  resumeSentence,
  confirmSentence,
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
  const [sentenceText, setSentenceText] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  /* =========================
     🔊 TEXT TO SPEECH
  ========================= */
  const speakSentence = () => {
    if (!sentenceText) return;

    const utterance = new SpeechSynthesisUtterance(sentenceText);
    utterance.lang = "th-TH";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  /* =====================================================
     1️⃣ CREATE MEDIAPIPE HANDS (ONCE ONLY)
  ===================================================== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const drawHand = (hand) => {
      ctx.fillStyle = "#00ff00";
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;

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
          const sentenceState = getSentenceState();
          setSentenceText(sentenceState.formatted);
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

    return () => {
      hands.close();
      handsRef.current = null;
    };
  }, []); // ✅ สำคัญ: dependency ว่าง

  /* =====================================================
     2️⃣ CAMERA LOOP (CONTROLLED BY isActive)
  ===================================================== */
  useEffect(() => {
    if (!isActive || !videoRef?.current || !handsRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const syncCanvas = () => {
      if (!video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    const loop = async () => {
      if (video.readyState >= 2) {
        syncCanvas();
        await handsRef.current.send({ image: video });
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, videoRef]);

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        />
      </div>

      <div className="mt-3 text-sm">
        สถานะ: <b>{gestureStatus}</b>
      </div>

      <div className="text-4xl font-bold mt-4 text-green-600">
        {detectedWord || "—"}
      </div>

      <div className="text-xl mt-4">
        ประโยค: <b>{sentenceText || "—"}</b>
      </div>

      {/* CONTROLS */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded"
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
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => {
            undoLastWord();
            setSentenceText(getSentenceState().formatted);
          }}
        >
          Undo คำล่าสุด
        </button>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => {
            const result = confirmSentence();
            if (result.confirmed) {
              setIsConfirmed(true);
              alert("ยืนยันประโยค: " + result.formatted);
            }
          }}
        >
          ยืนยันประโยค
        </button>

        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={() => {
            resetSentence();
            setSentenceText("");
            setIsPaused(false);
            setIsConfirmed(false);
          }}
        >
          ลบคำทั้งหมด
        </button>

        <button
          className="px-4 py-2 bg-purple-600 text-white rounded"
          onClick={speakSentence}
          disabled={!sentenceText}
        >
          🔊 อ่านประโยค
        </button>
      </div>

      {debugInfo && (
        <pre className="mt-3 text-xs bg-gray-100 p-2 rounded">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default VideoDisplay;