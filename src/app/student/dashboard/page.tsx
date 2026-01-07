"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, PlayCircle } from "lucide-react"

export default function StudentDashboard() {
  const router = useRouter()
  const [exams, setExams] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // โหลด User จาก LocalStorage
    const u = localStorage.getItem("user")
    if (u) setUser(JSON.parse(u))
    fetchExams()
  }, [])

  const fetchExams = async () => {
    // *ของจริงต้อง Filter เฉพาะวิชาที่นักเรียนคนนี้มีสิทธิ์*
    const res = await axios.get("http://localhost:8000/exams")
    setExams(res.data)
  }

  const handleStartExam = (examId: number) => {
    router.push(`/student/exam/${examId}/intro`)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">
        👋 สวัสดี, {user?.fullName}
      </h1>
      <p className="text-gray-500">เลือกวิชาที่ต้องการสอบ</p>

      <div className="grid gap-4 md:grid-cols-2">
        {exams.map((exam) => (
          <Card
            key={exam.id}
            className="hover:shadow-lg transition-all border-l-4 border-l-blue-500"
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-blue-600 mb-1">
                    {exam.subjectName}
                  </div>
                  {exam.title}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Clock size={16} /> {exam.durationMinutes} นาที
                </div>
                <div>{exam._count?.questions || 0} ข้อ</div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => handleStartExam(exam.id)}
                disabled={!exam.isActive} // ปุ่มเทาถ้ายังไม่ Active
              >
                <PlayCircle size={16} />
                {exam.isActive ? "เข้าห้องสอบ" : "ยังไม่เปิดให้สอบ"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
