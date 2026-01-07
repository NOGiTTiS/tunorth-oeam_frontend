"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, Lock, AlertTriangle, Unlock } from "lucide-react";

// สร้าง Socket Connection นอก Component
const socket = io("http://localhost:8001", {
  autoConnect: false,
});

export default function ExamRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId;

  // --- States ---
  const [examData, setExamData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Security States
  const [isLocked, setIsLocked] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [canResume, setCanResume] = useState(false); // State ใหม่สำหรับรอ User กดกลับเข้าสอบ

  // --- 1. Load Exam Data & Resume Answers ---
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/take/session/${sessionId}`);
        setExamData(res.data);

        // --- เพิ่มส่วนนี้: เช็คสถานะจาก Database ---
        if (res.data.status === "LOCKED") {
            setIsLocked(true);
            setCanResume(false); // ต้องรอครูปลดเท่านั้น
        }
        // --------------------------------------

        // Restore Answers
        const savedAnswers: Record<number, number> = {};
        res.data.answers.forEach((ans: any) => {
          savedAnswers[ans.questionId] = ans.selectedChoiceId;
        });
        setAnswers(savedAnswers);

        if (!socket.connected) {
          socket.connect();
        }

      } catch (e) {
        console.error(e);
        alert("ไม่สามารถโหลดข้อสอบได้ หรือ Session หมดอายุ");
        router.push("/student/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    return () => {
      socket.disconnect();
    };
  }, [sessionId, router]);

  // --- 2. Security Logic & Socket Events ---
  useEffect(() => {
    if (!examData) return;

    const { exam, studentId, student } = examData;

    // 2.1 Join Room
    socket.emit("join_exam_room", exam.id);

    // 2.2 Function แจ้งเตือนการโกง
    const reportCheating = (type: string) => {
      // ถ้าล็อกอยู่แล้ว หรือรอให้กด Resume ไม่ต้องส่งซ้ำ
      if (isLocked) return;

      setWarnings((prev) => prev + 1);
      setIsLocked(true); 
      setCanResume(false); // ต้องรอครูปลดล็อกใหม่เท่านั้น

      socket.emit("cheating_alert", {
        sessionId: Number(sessionId),
        examId: exam.id,
        studentId: studentId,
        studentName: student?.fullName || "Unknown Student",
        type: type,
        timestamp: new Date(),
      });
    };

    // 2.3 Browser Events
    const handleVisibilityChange = () => {
      if (document.hidden) reportCheating("TAB_SWITCH");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isLocked) {
         // เช็ค !isLocked เพื่อป้องกัน Loop เวลาเราสั่ง exit fullscreen เองตอนจบ
         reportCheating("EXIT_FULLSCREEN");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // 2.4 Auto Enter Fullscreen on Mount
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.log("Auto-fullscreen blocked, waiting for user interaction");
      }
    };
    enterFullscreen();

    // 2.5 Listen for Remote Unlock
    socket.on("force_unlock", () => {
      // เมื่อครูปลดล็อก ให้เปลี่ยนสถานะเป็น 'พร้อมกลับเข้าสอบ'
      // แต่ยังไม่ปลด isLocked จนกว่า User จะกดปุ่ม
      setCanResume(true);
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      socket.off("force_unlock");
    };
  }, [examData, isLocked]); // เพิ่ม isLocked ใน dependency เพื่อให้ logic ทำงานถูกต้อง

  // --- 3. Handlers ---

  const handleResumeExam = async () => {
    // ฟังก์ชันนี้จะทำงานเมื่อ User กดปุ่มสีเขียว
    try {
        await document.documentElement.requestFullscreen();
    } catch (e) {
        console.error("Fullscreen failed", e);
    }
    setIsLocked(false);
    setCanResume(false);
  };

  const handleAnswer = async (questionId: number, choiceId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
    setSaving(true);
    try {
      await axios.post("http://localhost:8000/take/answer", {
        sessionId: Number(sessionId),
        questionId,
        selectedChoiceId: choiceId,
      });
    } catch (error) {
      console.error("Auto-save failed");
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const handleSubmitExam = async () => {
    if (!confirm("ยืนยันการส่งข้อสอบ?")) return;
    try {
      await axios.post("http://localhost:8000/take/submit", { sessionId: Number(sessionId) });
      router.push("/student/dashboard"); 
    } catch (error) {
      alert("ส่งข้อสอบไม่สำเร็จ");
    }
  };

  // --- 4. Render ---

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (!examData) return null;

  // 4.1 Locked Screen Logic
  if (isLocked) {
    // Case A: ครูปลดล็อกแล้ว -> แสดงหน้าจอเขียวให้กดกลับ
    if (canResume) {
        return (
            <div className="fixed inset-0 bg-green-600 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in zoom-in duration-300">
                <Unlock size={80} className="mb-6 opacity-90" />
                <h1 className="text-4xl font-bold mb-4">ได้รับอนุญาตให้ทำต่อได้</h1>
                <p className="text-xl mb-8 opacity-90">ผู้คุมสอบได้ทำการปลดล็อกหน้าจอแล้ว</p>
                
                <Button 
                    onClick={handleResumeExam}
                    className="bg-white text-green-700 hover:bg-green-50 text-xl px-10 py-8 h-auto rounded-full font-bold shadow-xl transition-transform hover:scale-105 active:scale-95"
                >
                    กดปุ่มนี้เพื่อกลับเข้าสู่โหมดเต็มจอ
                </Button>
            </div>
        );
    }

    // Case B: ยังไม่ปลดล็อก -> แสดงหน้าจอแดง
    return (
      <div className="fixed inset-0 bg-red-600 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-300">
        <Lock size={80} className="mb-6 opacity-90" />
        <h1 className="text-5xl font-bold mb-4">หน้าจอถูกล็อก!</h1>
        <div className="bg-red-800/50 p-6 rounded-xl border border-red-400 max-w-2xl backdrop-blur-sm shadow-lg">
          <p className="text-2xl mb-2 font-semibold">ระบบตรวจพบพฤติกรรมที่ผิดกฎการสอบ</p>
          <p className="text-lg opacity-90">
            (มีการสลับหน้าจอ, ออกจากโหมดเต็มจอ, หรือย่อหน้าต่าง)
          </p>
          <div className="mt-8 p-4 bg-white/10 rounded-lg animate-pulse">
            <p className="text-xl font-bold">กรุณายกมือเรียกผู้คุมสอบเพื่อทำการปลดล็อก</p>
          </div>
          <p className="mt-4 text-sm font-mono opacity-70">Warning Count: {warnings} | Session ID: {sessionId}</p>
        </div>
      </div>
    );
  }

  // 4.2 Main Exam UI
  const { exam } = examData;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 select-none">
      <header className="bg-white border-b h-16 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="font-bold text-lg text-blue-900">{exam.subjectName}</h1>
          <p className="text-xs text-gray-500">{exam.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border text-sm">
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin text-gray-500" />
                <span className="text-gray-500">Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-green-700">Saved</span>
              </>
            )}
          </div>
          <Button onClick={handleSubmitExam} className="bg-blue-600 hover:bg-blue-700">
            ส่งคำตอบ
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm mb-6">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p>ห้ามออกจากหน้าจอนี้โดยเด็ดขาด ระบบจะทำการล็อกหน้าจอทันทีหากมีการสลับ Tab หรือออกจาก Fullscreen</p>
        </div>

        {exam.questions.map((q: any, idx: number) => (
          <Card key={q.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="mb-6">
              <div className="flex gap-2 items-start">
                <span className="font-bold text-lg text-blue-600 bg-blue-50 w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                    {idx + 1}
                </span>
                <div className="space-y-1">
                    <p className="text-lg font-medium text-gray-900 leading-relaxed">
                        {q.questionText}
                    </p>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {q.score} คะแนน
                    </span>
                </div>
              </div>
            </div>

            <RadioGroup
              value={answers[q.id]?.toString()}
              onValueChange={(val) => handleAnswer(q.id, Number(val))}
              className="pl-10 space-y-3"
            >
              {q.choices.map((c: any) => (
                <div
                  key={c.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    answers[q.id] === c.id 
                        ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" 
                        : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                  onClick={() => handleAnswer(q.id, c.id)}
                >
                  <RadioGroupItem value={c.id.toString()} id={`c-${c.id}`} className="text-blue-600" />
                  <Label 
                    htmlFor={`c-${c.id}`} 
                    className="flex-1 cursor-pointer font-normal text-gray-700 text-base"
                  >
                    {c.choiceText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </Card>
        ))}
      </main>
    </div>
  );
}