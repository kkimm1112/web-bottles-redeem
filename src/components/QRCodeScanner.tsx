// src/components/QRCodeScanner.tsx

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import { useSession } from "next-auth/react";

interface BottleDetails {
  big: number;
  small: number;
  points: number;
}

interface AddPointsResponse {
  message: string;
  [key: string]: unknown;
}

interface ScannedToken {
  token: string;
  timestamp: number;
}

export default function QRCodeScannerWithPoints({ onScanSuccess }: { onScanSuccess?: (decodedText: string) => void }) {
  const { data: session, status } = useSession();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [bottleDetails, setBottleDetails] = useState<BottleDetails>({ big: 0, small: 0, points: 0 });
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "processing" | "completed" | "error">("idle");

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isProcessingRef = useRef(false); // ป้องกันการสแกนเบิ้ล
  const lastScanTimeRef = useRef(0); // เก็บเวลาสแกนล่าสุด
  const scannedTokensRef = useRef<ScannedToken[]>([]); // เก็บประวัติ token ที่เคยสแกน
  const SCAN_COOLDOWN = 3000; // ระยะเวลาขั้นต่ำระหว่างการสแกน (3 วินาที)
  const MAX_STORED_TOKENS = 50; // จำนวนสูงสุดของ token ที่จะเก็บไว้ในประวัติ

  // เก็บ userId จาก session
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      setUserId(session.user.id);
    }
  }, [session, status]);

  useEffect(() => {
    if (status !== "loading" && !scannerRef.current && !scanResult) {
      initializeScanner();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [status, scanResult]);

  // โหลดประวัติการสแกนจาก localStorage เมื่อ component mount
  useEffect(() => {
    const storedTokens = localStorage.getItem('scannedTokens');
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens) as ScannedToken[];
        // กรองเอาเฉพาะ token ที่ยังไม่หมดอายุ (24 ชั่วโมง)
        const now = Date.now();
        const validTokens = parsedTokens.filter(item => (now - item.timestamp) < 24 * 60 * 60 * 1000);
        scannedTokensRef.current = validTokens;
      } catch (error) {
        console.error("Error parsing stored tokens:", error);
        localStorage.removeItem('scannedTokens');
      }
    }
  }, []);

  const initializeScanner = () => {
    if (scannerRef.current) return;
    setScanStatus("scanning");
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 800 }, false);
    scannerRef.current = scanner;

    scanner.render(async (decodedText) => {
      if (isProcessingRef.current) {
        console.log("Already processing a scan. Ignoring this one.");
        return;
      }
      
      // ตรวจสอบระยะเวลาระหว่างการสแกน
      const now = Date.now();
      if (now - lastScanTimeRef.current < SCAN_COOLDOWN) {
        console.log(`Scan too soon. Please wait ${((SCAN_COOLDOWN - (now - lastScanTimeRef.current)) / 1000).toFixed(1)} seconds.`);
        setMessage(`⏱️ กรุณารอสักครู่ก่อนสแกนอีกครั้ง (${((SCAN_COOLDOWN - (now - lastScanTimeRef.current)) / 1000).toFixed(1)} วินาที)`);
        return;
      }
      
      lastScanTimeRef.current = now;
      isProcessingRef.current = true;
      setScanStatus("processing");
      await handleScan(decodedText);
      isProcessingRef.current = false;
    }, (error) => {
      console.warn("Scan error:", error);
    });
  };

  const calculatePoints = (big: number, small: number) => big * 200 + small * 100;

  const handleScan = async (decodedText: string) => {
    if (!decodedText || decodedText.trim() === "") return;

    try {
      const queryText = decodedText.includes("?") ? decodedText.split("?")[1] : decodedText;
      const params = queryText.split(";").reduce((acc, pair) => {
        const [key, value] = pair.split(":");
        acc[key] = value;
        return acc;
      }, {} as { [key: string]: string });

      const token = params.token;
      if (!token) {
        setMessage("❌ ไม่พบ token ใน QR Code");
        setScanStatus("error");
        return;
      }

      if (!decodedText.includes("token:")) {
        setMessage("❌ QR Code ไม่ถูกต้อง");
        setScanStatus("error");
        return;
      }

      // ตรวจสอบว่า token นี้เคยถูกสแกนไปแล้วหรือไม่
      const tokenExists = scannedTokensRef.current.some(item => item.token === token);
      if (tokenExists) {
        setMessage("❌ QR Code นี้ถูกใช้งานไปแล้ว ไม่สามารถใช้ซ้ำได้");
        setScanStatus("error");
        setTimeout(() => {
          handleRescan();
        }, 3000); // รีเซ็ตสแกนอัตโนมัติหลัง 3 วินาที
        return;
      }

      const PETbig = parseInt(params.big || "0", 10);
      const PETsmall = parseInt(params.small || "0", 10);
      const points = calculatePoints(PETbig, PETsmall);
      const isValid = await validateToken(token, PETbig, PETsmall, points);

      if (!isValid) {
        setMessage("❌ Token ไม่ถูกต้องหรือหมดอายุ");
        setScanStatus("error");
        return;
      }

      const currentUserId = userId || session?.user?.id;

      if (currentUserId && points > 0) {
        setLoading(true);
        try {
          const response = await addPointsToUser(currentUserId, points, PETbig, PETsmall);
          setMessage(`🎉 เพิ่มคะแนนสำเร็จ: ${points} คะแนน - ${response.message}`);
          
          // เพิ่ม token ที่สแกนแล้วเข้าไปในประวัติ
          addToScannedTokens(token);
          
          setScanStatus("completed");
        } catch (err: unknown) {
          if (err instanceof Error) {
            setMessage(err.message);
          } else {
            setMessage("เกิดข้อผิดพลาดในการเพิ่มคะแนน");
          }
          setScanStatus("error");
        } finally {
          setLoading(false);
        }
      } else {
        if (!currentUserId) {
          setMessage("❌ ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง");
          setScanStatus("error");
        } else {
          setMessage(`✅ ขวดใหญ่ ${PETbig} (${PETbig * 200} คะแนน), ขวดเล็ก ${PETsmall} (${PETsmall * 100} คะแนน), รวม ${points} คะแนน`);
          
          // เพิ่ม token ที่สแกนแล้วเข้าไปในประวัติ
          addToScannedTokens(token);
          
          setScanStatus("completed");
        }
      }

      setBottleDetails({ big: PETbig, small: PETsmall, points });
      setScanResult(decodedText);
      scannerRef.current?.clear().catch(() => {});
    } catch (error) {
      console.error("Parsing error:", error);
      setMessage("❌ ไม่สามารถอ่านข้อมูล QR ได้");
      setScanStatus("error");
    }

    if (onScanSuccess) {
      onScanSuccess(decodedText);
    }
  };

  // เพิ่ม token ที่สแกนแล้วเข้าไปในประวัติและบันทึกลง localStorage
  const addToScannedTokens = (token: string) => {
    const newToken: ScannedToken = { token, timestamp: Date.now() };
    
    // เพิ่ม token ใหม่และตัด token เก่าออกหากเกินจำนวนที่กำหนด
    const updatedTokens = [newToken, ...scannedTokensRef.current];
    if (updatedTokens.length > MAX_STORED_TOKENS) {
      updatedTokens.splice(MAX_STORED_TOKENS);
    }
    
    scannedTokensRef.current = updatedTokens;
    
    // บันทึกลง localStorage
    try {
      localStorage.setItem('scannedTokens', JSON.stringify(updatedTokens));
    } catch (error) {
      console.error("Error storing scanned tokens:", error);
    }
  };

  const validateToken = async (token: string, PETbig: number, PETsmall: number, points: number): Promise<boolean> => {
    try {
      const res = await axios.post("/api/routers/validate-token", { token, PETbig, PETsmall, points });
      return res.data.valid;
    } catch {
      return false;
    }
  };

  const addPointsToUser = async (userId: string, points: number, PETbig: number, PETsmall: number): Promise<AddPointsResponse> => {
    const res = await axios.post("/api/routers/add-points", { userId, points, PETbig, PETsmall });
    return res.data;
  };

  const handleRescan = () => {
    setScanResult(null);
    setMessage("");
    setBottleDetails({ big: 0, small: 0, points: 0 });
    setScanStatus("idle");
    scannerRef.current = null;
    isProcessingRef.current = false;
    initializeScanner();
  };

  // สร้าง UI indicator สำหรับสถานะการสแกน
  const renderScanStatusIndicator = () => {
    if (scanStatus === "idle" || scanStatus === "scanning") return null;
    
    let statusClass = "";
    let statusText = "";
    
    switch (scanStatus) {
      case "processing":
        statusClass = "status-processing";
        statusText = "กำลังประมวลผล...";
        break;
      case "completed":
        statusClass = "status-success";
        statusText = "สแกนสำเร็จ";
        break;
      case "error":
        statusClass = "status-error";
        statusText = "เกิดข้อผิดพลาด";
        break;
    }
    
    return (
      <div className={`scan-status-indicator ${statusClass}`}>
        <span>{statusText}</span>
      </div>
    );
  };

  return (
    <div className="qr-scanner-container">
      {!scanResult && <div id="reader"></div>}
      {renderScanStatusIndicator()}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>กำลังประมวลผล...</p>
        </div>
      )}

      {message && <div className="scan-message">{message}</div>}

      {scanResult && (
        <div className="scan-result">
          <h3>รายละเอียดการรับคะแนน</h3>
          <div className="bottle-details">
            <div className="bottle-item">
              <span className="bottle-label">ขวด PET ใหญ่:</span>
              <span className="bottle-value">{bottleDetails.big} ขวด</span>
              <span className="bottle-points">({bottleDetails.big * 200} คะแนน)</span>
            </div>
            <div className="bottle-item">
              <span className="bottle-label">ขวด PET เล็ก:</span>
              <span className="bottle-value">{bottleDetails.small} ขวด</span>
              <span className="bottle-points">({bottleDetails.small * 100} คะแนน)</span>
            </div>
            <div className="bottle-total">
              <span className="bottle-label">คะแนนรวม:</span>
              <span className="bottle-value">{bottleDetails.points} คะแนน</span>
            </div>
          </div>
          <div className="qr-value">
            <details>
              <summary>แสดงข้อมูล QR Code</summary>
              <p className="qr-text">{scanResult}</p>
            </details>
          </div>
          <button 
            className="rescan-button" 
            onClick={handleRescan}
            disabled={isProcessingRef.current || (Date.now() - lastScanTimeRef.current < SCAN_COOLDOWN)}
          >
            สแกนใหม่
          </button>
        </div>
      )}

      {/* เพิ่ม CSS สำหรับ UI indicator */}
      <style jsx>{`
        .scan-status-indicator {
          padding: 8px 16px;
          border-radius: 4px;
          margin: 8px 0;
          font-weight: bold;
          text-align: center;
        }
        .status-processing {
          background-color: #f0f0f0;
          color: #666;
        }
        .status-success {
          background-color: #e6f7e6;
          color: #2e7d32;
        }
        .status-error {
          background-color: #ffebee;
          color: #c62828;
        }
        .rescan-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}