"use client"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle } from "lucide-react"

export default function ExamIntroPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const startExam = async () => {
    setLoading(true)
    const userStr = localStorage.getItem("user")
    if (!userStr) return router.push("/login")
    const user = JSON.parse(userStr)

    try {
      // 1. เรียก API Start/Resume Session
      const res = await axios.post(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/take/start`,
        {
          studentId: user.id,
          examId: Number(params.id),
        }
      )

      const { sessionId, status } = res.data

      if (status === "SUBMITTED") {
        alert("คุณส่งข้อสอบชุดนี้ไปแล้ว")
        router.push("/student/dashboard")
        return
      }

      // 2. Redirect ไปหน้าห้องสอบจริง (Exam Room)
      router.push(`/student/exam/room/${sessionId}`)
    } catch (error) {
      alert("ไม่สามารถเริ่มทำข้อสอบได้")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardHeader className="bg-yellow-50 border-b border-yellow-100">
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle /> คำชี้แจงและข้อตกลง
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-gray-700">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              ระบบจะจับเวลาทันทีเมื่อท่านกดปุ่ม <b>"ยอมรับและเริ่มทำข้อสอบ"</b>
            </li>
            <li>ห้ามออกจากหน้าจอสอบ หรือสลับหน้าต่าง (Tab) โดยเด็ดขาด</li>
            <li>
              หากระบบตรวจพบการสลับหน้าจอ จะถือว่า <b>ทุจริต</b>{" "}
              และล็อกหน้าจอทันที
            </li>
            <li>คำตอบจะถูกบันทึกอัตโนมัติ (Auto-save) ทุกครั้งที่เลือก</li>
            <li>เมื่อหมดเวลา ระบบจะส่งคำตอบล่าสุดให้โดยอัตโนมัติ</li>
          </ul>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex gap-2">
            <CheckCircle className="shrink-0" size={20} />
            <span>
              ข้าพเจ้ายอมรับเงื่อนไข
              และยินยอมให้ระบบบันทึกพฤติกรรมการใช้งานระหว่างการสอบ
            </span>
          </div>

          <Button
            className="w-full text-lg py-6 mt-4"
            size="lg"
            onClick={startExam}
            disabled={loading}
          >
            {loading ? "กำลังเข้าสู่ห้องสอบ..." : "ยอมรับและเริ่มทำข้อสอบ"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
