import React, { useRef, useState, useEffect } from "react";

import VideoDisplay from "./components/VideoDisplay";
import CameraControls from "./components/CameraControls";
import ErrorDisplay from "./components/ErrorDisplay";

const WebcamTestInterface = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  // ✅ เพิ่ม state สำหรับสลับกล้อง
  // user = กล้องหน้า, environment = กล้องหลัง
  const [facingMode, setFacingMode] = useState("user");

  /* =========================
     START CAMERA
  ========================= */
  const startCamera = async () => {
    try {
      setError(null);

      if (!navigator?.mediaDevices?.getUserMedia) {
        setError("เบราว์เซอร์ของคุณไม่รองรับการเข้าถึงกล้อง");
        return;
      }

      // ❗ หยุด stream เดิมก่อน (สำคัญมาก)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // ✅ ใช้ facingMode จาก state
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: facingMode,
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      console.error("Camera error:", err);

      let errorMessage = "ไม่สามารถเปิดกล้องได้";

      if (err?.name === "NotAllowedError") {
        errorMessage = "กรุณาอนุญาตการเข้าถึงกล้อง";
      } else if (err?.name === "NotFoundError") {
        errorMessage = "ไม่พบกล้องในอุปกรณ์";
      } else if (err?.name === "NotReadableError") {
        errorMessage = "กล้องกำลังถูกใช้งานโดยแอปอื่น";
      } else if (err?.name === "OverconstrainedError") {
        errorMessage = "ไม่สามารถใช้กล้องตามโหมดที่เลือกได้";
      }

      setError(errorMessage);
    }
  };

  /* =========================
     STOP CAMERA
  ========================= */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  };

  /* =========================
     SWITCH CAMERA
  ========================= */
  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));

    // รีสตาร์ทกล้องด้วย facingMode ใหม่
    if (isActive) {
      startCamera();
    }
  };

  const handleRetry = () => {
    setError(null);
    startCamera();
  };

  /* =========================
     CLEANUP
  ========================= */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-6">

      {/* Video + Gesture */}
      <VideoDisplay videoRef={videoRef} isActive={isActive} />

      {/* Camera controls (start / stop) */}
      <CameraControls
        isActive={isActive}
        onStart={startCamera}
        onStop={stopCamera}
        isLoading={false}
        disabled={false}
      />

      {/* ✅ ปุ่มสลับกล้อง */}
      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded"
        onClick={switchCamera}
        disabled={!isActive}
      >
        🔄 สลับกล้อง ({facingMode === "user" ? "หน้า" : "หลัง"})
      </button>

      {/* Error */}
      {error && <ErrorDisplay error={error} onRetry={handleRetry} />}
    </div>
  );
};

export default WebcamTestInterface;