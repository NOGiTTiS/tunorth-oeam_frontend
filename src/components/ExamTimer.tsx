"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface ExamTimerProps {
  initialSeconds: number; // รับค่าเวลาที่เหลือมาจาก Server
  onTimeUp: () => void;   // ฟังก์ชันที่จะทำงานเมื่อเวลาหมด
}

export function ExamTimer({ initialSeconds, onTimeUp }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    // ตั้งค่าเริ่มต้นใหม่ถ้ารับค่าใหม่จาก Server (เช่นตอน Resume)
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp(); // เรียกฟังก์ชันส่งข้อสอบ
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp]);

  // แปลงวินาทีเป็น ชั่วโมง:นาที:วินาที
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    // Pad zero เช่น 09:05
    const pad = (n: number) => n.toString().padStart(2, "0");

    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  // เปลี่ยนสีเมื่อเวลาน้อยกว่า 5 นาที
  const isUrgent = timeLeft < 300; // 5 minutes

  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-md border shadow-sm transition-colors ${
        isUrgent ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-white text-gray-700 border-gray-200"
    }`}>
      <Clock size={20} />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}