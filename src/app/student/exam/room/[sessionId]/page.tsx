"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { io } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Loader2,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Unlock,
} from "lucide-react"

// อย่าลืมสร้างไฟล์ ExamTimer.tsx ตามที่แนะนำก่อนหน้านี้
import { ExamTimer } from "@/components/ExamTimer"

const socket = io("http://localhost:8001", {
  autoConnect: false,
})

export default function ExamRoomPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId

  // --- States ---
  const [examData, setExamData] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Security States
  const [isLocked, setIsLocked] = useState(false)
  const [warnings, setWarnings] = useState(0)
  const [canResume, setCanResume] = useState(false)

  // --- 1. Load Exam Data ---
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/take/session/${sessionId}`
        )
        setExamData(res.data)

        // Check Locked Status from DB (กัน F5)
        if (res.data.status === "LOCKED") {
          setIsLocked(true)
          setCanResume(false)
        }

        // Restore Answers
        const savedAnswers: Record<number, number> = {}
        res.data.answers.forEach((ans: any) => {
          savedAnswers[ans.questionId] = ans.selectedChoiceId
        })
        setAnswers(savedAnswers)

        if (!socket.connected) socket.connect()
      } catch (e) {
        console.error(e)
        alert("Session หมดอายุ หรือโหลดข้อมูลไม่สำเร็จ")
        router.push("/student/dashboard")
      } finally {
        setLoading(false)
      }
    }
    fetchSession()

    return () => {
      socket.disconnect()
    }
  }, [sessionId, router])

  // --- 2. Security Logic ---
  useEffect(() => {
    if (!examData) return
    const { exam, studentId, student } = examData

    // Join Room
    socket.emit("join_exam_room", exam.id)

    // Report Cheating Function
    const reportCheating = (type: string) => {
      if (isLocked) return

      setWarnings((prev) => prev + 1)
      setIsLocked(true)
      setCanResume(false)

      socket.emit("cheating_alert", {
        sessionId: Number(sessionId),
        examId: exam.id,
        studentId: studentId,
        studentName: student?.fullName || "Unknown",
        type: type,
        timestamp: new Date(),
      })
    }

    // Listeners
    const handleVisibilityChange = () => {
      if (document.hidden) reportCheating("TAB_SWITCH")
    }
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isLocked)
        reportCheating("EXIT_FULLSCREEN")
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    // Unlock Listener
    socket.on("force_unlock", () => {
      setCanResume(true)
    })

    // Auto Fullscreen
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen()
      } catch (err) {
        console.log("Fullscreen blocked")
      }
    }
    enterFullscreen()

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      socket.off("force_unlock")
    }
  }, [examData, isLocked])

  // --- 3. Handlers ---

  const handleResumeExam = async () => {
    try {
      await document.documentElement.requestFullscreen()
    } catch (e) {}
    setIsLocked(false)
    setCanResume(false)
  }

  const handleAnswer = async (questionId: number, choiceId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }))
    setSaving(true)
    try {
      await axios.post("http://localhost:8000/take/answer", {
        sessionId: Number(sessionId),
        questionId,
        selectedChoiceId: choiceId,
      })
    } catch (error) {
      console.error("Auto-save failed")
    } finally {
      setTimeout(() => setSaving(false), 500)
    }
  }

  const submitExam = async () => {
    if (isSubmitted) return
    setIsSubmitted(true)
    try {
      await axios.post("http://localhost:8000/take/submit", {
        sessionId: Number(sessionId),
      })
      router.push("/student/dashboard")
    } catch (error) {
      alert("ส่งไม่สำเร็จ")
    }
  }

  const handleManualSubmit = () => {
    if (!confirm("ยืนยันการส่งข้อสอบ?")) return
    submitExam()
  }

  // Called by Timer
  const handleTimeUp = () => {
    alert("หมดเวลาสอบ! ระบบกำลังส่งคำตอบอัตโนมัติ")
    submitExam()
  }

  // --- Render ---

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    )
  if (!examData) return null

  // Locked Overlay
  if (isLocked) {
    if (canResume) {
      return (
        <div className="fixed inset-0 bg-green-600 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in zoom-in">
          <Unlock size={80} className="mb-6 opacity-90" />
          <h1 className="text-4xl font-bold mb-4">ได้รับอนุญาตให้ทำต่อได้</h1>
          <Button
            onClick={handleResumeExam}
            className="bg-white text-green-700 hover:bg-green-50 text-xl px-10 py-8 rounded-full font-bold shadow-xl"
          >
            กลับเข้าสู่โหมดเต็มจอ
          </Button>
        </div>
      )
    }
    return (
      <div className="fixed inset-0 bg-red-600 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center">
        <Lock size={80} className="mb-6" />
        <h1 className="text-5xl font-bold mb-4">หน้าจอถูกล็อก!</h1>
        <div className="bg-red-800/50 p-6 rounded-xl border border-red-400 max-w-2xl">
          <p className="text-2xl font-semibold">
            ระบบตรวจพบพฤติกรรมที่ผิดกฎการสอบ
          </p>
          <p className="mt-4">กรุณายกมือเรียกผู้คุมสอบเพื่อทำการปลดล็อก</p>
          <p className="mt-4 text-sm opacity-70">
            Warnings: {warnings} | Session: {sessionId}
          </p>
        </div>
      </div>
    )
  }

  const { exam } = examData

  return (
    <div className="min-h-screen bg-gray-50 pb-20 select-none">
      <header className="bg-white border-b h-16 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="w-1/4">
          <h1 className="font-bold text-lg text-blue-900 truncate">
            {exam.subjectName}
          </h1>
          <p className="text-xs text-gray-500 truncate">{exam.title}</p>
        </div>

        {/* --- Timer --- */}
        <div className="flex-1 flex justify-center">
          <ExamTimer
            initialSeconds={examData.remainingTime}
            onTimeUp={handleTimeUp}
          />
        </div>

        <div className="w-1/4 flex justify-end items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border text-sm">
            {saving ? (
              <Loader2 size={12} className="animate-spin text-gray-500" />
            ) : (
              <CheckCircle2 size={14} className="text-green-600" />
            )}
            <span className={saving ? "text-gray-500" : "text-green-700"}>
              {saving ? "Saving..." : "Saved"}
            </span>
          </div>
          <Button
            onClick={handleManualSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            ส่งคำตอบ
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm mb-6">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>
            ห้ามออกจากหน้าจอนี้โดยเด็ดขาด ระบบจะทำการล็อกหน้าจอทันทีหากมีการสลับ
            Tab หรือออกจาก Fullscreen
          </p>
        </div>

        {exam.questions.map((q: any, idx: number) => (
          <Card key={q.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="mb-6 flex gap-2 items-start">
              <span className="font-bold text-lg text-blue-600 bg-blue-50 w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                {idx + 1}
              </span>
              <div className="space-y-1">
                <p className="text-lg font-medium text-gray-900">
                  {q.questionText}
                </p>
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {q.score} คะแนน
                </span>
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
                  className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    answers[q.id] === c.id
                      ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleAnswer(q.id, c.id)}
                >
                  <RadioGroupItem
                    value={c.id.toString()}
                    id={`c-${c.id}`}
                    className="text-blue-600"
                  />
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
  )
}
