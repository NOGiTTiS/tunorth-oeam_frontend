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
  Wifi,
  WifiOff,
  RefreshCw,
  Maximize,
} from "lucide-react"

import { ExamTimer } from "@/components/ExamTimer"

const socket = io("http://localhost:8001", {
  autoConnect: false,
})

export default function ExamRoomPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  // --- States ---
  const [examData, setExamData] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Offline States
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)

  // Security States
  const [isLocked, setIsLocked] = useState(false)
  const [warnings, setWarnings] = useState(0)
  const [canResume, setCanResume] = useState(false)

  // [NEW] State: รอ User กดเริ่มเพื่อเข้า Fullscreen
  const [isStarted, setIsStarted] = useState(false)

  const isOnlineRef = useRef(true)

  // --- 1. Offline / Online Logic ---
  useEffect(() => {
    isOnlineRef.current = isOnline
  }, [isOnline])

  useEffect(() => {
    const handleOnline = () => updateOnlineStatus(true)
    const handleOffline = () => updateOnlineStatus(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const heartbeatInterval = setInterval(async () => {
      try {
        await axios.get("http://localhost:8000/", { timeout: 2000 })
        if (!isOnlineRef.current) updateOnlineStatus(true)
      } catch (error) {
        if (isOnlineRef.current) {
          console.log("Heartbeat failed. Going offline.")
          updateOnlineStatus(false)
        }
      }
    }, 3000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(heartbeatInterval)
    }
  }, [])

  const updateOnlineStatus = (status: boolean) => {
    setIsOnline(status)
    isOnlineRef.current = status
    if (status) {
      if (socket.disconnected) socket.connect()
      syncAnswers()
    }
  }

  useEffect(() => {
    const queue = JSON.parse(
      localStorage.getItem(`offline_queue_${sessionId}`) || "[]"
    )
    setPendingSync(queue.length)
  }, [sessionId])

  const syncAnswers = async () => {
    const queueKey = `offline_queue_${sessionId}`
    const queue = JSON.parse(localStorage.getItem(queueKey) || "[]")
    if (queue.length === 0) return
    setSaving(true)
    try {
      for (const item of queue) {
        await axios.post("http://localhost:8000/take/answer", item)
      }
      localStorage.removeItem(queueKey)
      setPendingSync(0)
    } catch (error) {
      console.error("Sync failed")
    } finally {
      setSaving(false)
    }
  }

  // --- 2. Load Exam Data ---
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/take/session/${sessionId}`
        )
        setExamData(res.data)
        if (res.data.status === "LOCKED") {
          setIsLocked(true)
          setCanResume(false)
          setIsStarted(true) // ถ้าโดนล็อก แสดงว่าเริ่มไปแล้ว
        }
        const savedAnswers: Record<number, number> = {}
        res.data.answers.forEach((ans: any) => {
          savedAnswers[ans.questionId] = ans.selectedChoiceId
        })

        const queue = JSON.parse(
          localStorage.getItem(`offline_queue_${sessionId}`) || "[]"
        )
        queue.forEach((item: any) => {
          savedAnswers[item.questionId] = item.selectedChoiceId
        })

        setAnswers(savedAnswers)
        if (navigator.onLine && !socket.connected) socket.connect()
      } catch (e) {
        alert("ไม่สามารถโหลดข้อสอบได้")
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
    return () => {
      socket.disconnect()
    }
  }, [sessionId, router])

  // --- 3. Security Logic ---
  useEffect(() => {
    if (!examData || !isStarted) return // [FIX] เริ่มทำงานเมื่อ isStarted = true เท่านั้น

    const { exam, studentId, student } = examData
    if (isOnline) socket.emit("join_exam_room", exam.id)

    const reportCheating = (type: string) => {
      if (isLocked) return
      setWarnings((prev) => prev + 1)
      setIsLocked(true)
      setCanResume(false)
      if (isOnline) {
        socket.emit("cheating_alert", {
          sessionId: Number(sessionId),
          examId: exam.id,
          studentId: studentId,
          studentName: student?.fullName || "Unknown",
          type: type,
          timestamp: new Date(),
        })
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) reportCheating("TAB_SWITCH")
    }
    const handleFullscreenChange = () => {
      // ถ้าออกจาก Fullscreen โดยที่ไม่ได้ถูกล็อก และเริ่มสอบแล้ว -> โกง
      if (!document.fullscreenElement && !isLocked && isStarted) {
        reportCheating("EXIT_FULLSCREEN")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    socket.on("force_unlock", () => {
      setCanResume(true)
    })

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      socket.off("force_unlock")
    }
  }, [examData, isLocked, isOnline, isStarted]) // เพิ่ม isStarted

  // --- 4. Handlers ---

  // [NEW] ฟังก์ชันเริ่มสอบและเข้า Fullscreen (เรียกจากปุ่มคลิก)
  const handleUserStart = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsStarted(true)
    } catch (err) {
      alert("กรุณาอนุญาตให้เข้าโหมดเต็มจอเพื่อทำข้อสอบ")
      console.error("Fullscreen failed:", err)
    }
  }

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
    const payload = {
      sessionId: Number(sessionId),
      questionId,
      selectedChoiceId: choiceId,
    }

    if (!isOnline) {
      saveToOfflineQueue(payload)
      setTimeout(() => setSaving(false), 200)
      return
    }
    try {
      await axios.post("http://localhost:8000/take/answer", payload, {
        timeout: 3000,
      })
    } catch (error) {
      saveToOfflineQueue(payload)
      updateOnlineStatus(false)
    } finally {
      setTimeout(() => setSaving(false), 500)
    }
  }

  const saveToOfflineQueue = (payload: any) => {
    const queueKey = `offline_queue_${sessionId}`
    const queue = JSON.parse(localStorage.getItem(queueKey) || "[]")
    const newQueue = queue.filter(
      (item: any) => item.questionId !== payload.questionId
    )
    newQueue.push(payload)
    localStorage.setItem(queueKey, JSON.stringify(newQueue))
    setPendingSync(newQueue.length)
  }

  const handleManualSubmit = async () => {
    if (pendingSync > 0 && !isOnline) {
      alert(
        "คุณกำลัง Offline! ระบบบันทึกคำตอบไว้ในเครื่องแล้ว \nกรุณาเชื่อมต่ออินเทอร์เน็ตก่อนกดส่งข้อสอบ"
      )
      return
    }
    if (!confirm("ยืนยันการส่งข้อสอบ?")) return
    await syncAnswers()
    try {
      await axios.post("http://localhost:8000/take/submit", {
        sessionId: Number(sessionId),
      })
      router.push("/student/dashboard")
    } catch (error) {
      alert("ส่งไม่สำเร็จ")
    }
  }

  const handleTimeUp = () => {
    alert("หมดเวลาสอบ!")
    handleManualSubmit()
  }

  // --- Render ---
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    )
  if (!examData) return null

  // [NEW] Overlay ก่อนเริ่มสอบ (User Gesture Required)
  if (!isStarted) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center">
        <Maximize size={80} className="mb-6 opacity-80" />
        <h1 className="text-4xl font-bold mb-4">พร้อมเริ่มทำข้อสอบ</h1>
        <p className="text-lg opacity-80 mb-8 max-w-lg">
          ระบบจะเข้าสู่โหมดเต็มจอ (Fullscreen) ทันทีที่คุณกดปุ่มด้านล่าง <br />
          ห้ามออกจากหน้าจอนี้จนกว่าจะทำข้อสอบเสร็จ
        </p>
        <Button
          onClick={handleUserStart}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xl px-12 py-8 h-auto rounded-full font-bold shadow-xl transition-transform hover:scale-105"
        >
          คลิกเพื่อเริ่มทำข้อสอบ
        </Button>
      </div>
    )
  }

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
          <p className="mt-4">กรุณายกมือเรียกผู้คุมสอบ</p>
        </div>
      </div>
    )
  }

  const { exam } = examData

  return (
    <div className="min-h-screen bg-gray-50 pb-20 select-none">
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-bold sticky top-0 z-[100] animate-pulse">
          <WifiOff size={16} className="inline mr-2" />{" "}
          ขาดการเชื่อมต่ออินเทอร์เน็ต! (Offline Mode)
        </div>
      )}
      {isOnline && pendingSync > 0 && (
        <div className="bg-blue-500 text-white text-center py-1 px-4 text-xs font-bold sticky top-0 z-[100]">
          <RefreshCw size={12} className="inline mr-2 animate-spin" />{" "}
          กำลังส่งคำตอบที่ค้างอยู่...
        </div>
      )}

      <header className="bg-white border-b h-16 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="w-1/4">
          <h1 className="font-bold text-lg text-blue-900 truncate">
            {exam.subjectName}
          </h1>
          <p className="text-xs text-gray-500 truncate">{exam.title}</p>
        </div>
        <div className="flex-1 flex justify-center">
          <ExamTimer
            initialSeconds={examData.remainingTime}
            onTimeUp={handleTimeUp}
          />
        </div>
        <div className="w-1/4 flex justify-end items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm transition-colors ${
              !isOnline
                ? "bg-amber-100 border-amber-200 text-amber-700"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff size={14} />
                <span>Offline ({pendingSync})</span>
              </>
            ) : saving ? (
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
          <Button
            onClick={handleManualSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!isOnline && pendingSync > 0}
          >
            {!isOnline && pendingSync > 0 ? "รอเน็ต..." : "ส่งคำตอบ"}
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
            <div className="mb-6">
              <div className="flex gap-2 items-start">
                <span className="font-bold text-lg text-blue-600 bg-blue-50 w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                  {idx + 1}
                </span>
                <div className="w-full space-y-3">
                  <p className="text-lg font-medium text-gray-900 whitespace-pre-line">
                    {q.questionText}
                  </p>
                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt="Question"
                      className="max-h-[400px] max-w-full rounded border shadow-sm object-contain"
                    />
                  )}
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {q.score} คะแนน
                  </span>
                </div>
              </div>
            </div>

            <RadioGroup
              value={answers[q.id]?.toString() ?? ""}
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
                    <div>{c.choiceText}</div>
                    {c.imageUrl && (
                      <img
                        src={c.imageUrl}
                        alt="Choice"
                        className="h-24 mt-2 rounded border object-contain bg-white"
                      />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </Card>
        ))}
        {/* --- [NEW] ปุ่มส่งคำตอบด้านล่าง (Bottom Submit Section) --- */}
        <div className="mt-12 mb-8 p-8 bg-white rounded-2xl border border-blue-100 shadow-lg flex flex-col items-center text-center space-y-4">
          <div className="bg-blue-50 p-3 rounded-full">
            <CheckCircle2 size={32} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              ทำข้อสอบครบทุกข้อแล้วใช่ไหม?
            </h3>
            <p className="text-gray-500">
              กรุณาตรวจสอบคำตอบอีกครั้ง เมื่อมั่นใจแล้วให้กดปุ่มส่งคำตอบด้านล่าง
            </p>
          </div>

          <Button
            onClick={handleManualSubmit}
            className="w-full md:w-1/2 text-xl py-8 rounded-xl font-bold shadow-blue-200 shadow-xl transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={!isOnline && pendingSync > 0}
          >
            {!isOnline && pendingSync > 0
              ? "รอสัญญาณเน็ต..."
              : "ยืนยันการส่งคำตอบ"}
          </Button>
        </div>
      </main>
    </div>
  )
}
