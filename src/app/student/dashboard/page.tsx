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
    const u = localStorage.getItem("user")
    if (u) setUser(JSON.parse(u))
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const res = await axios.get("http://localhost:8000/exams")
      setExams(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleStartExam = (examId: number) => {
    router.push(`/student/exam/${examId}/intro`)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          👋 สวัสดี, {user?.fullName || "นักเรียน"}
        </h1>
        <p className="opacity-90">เตรียมความพร้อม แล้วลุยข้อสอบกันเลย!</p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          📚 รายวิชาที่เปิดสอบ
        </h2>

        {exams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">ยังไม่มีการสอบในช่วงเวลานี้</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card
                key={exam.id}
                className="group hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500 overflow-hidden"
              >
                <CardHeader className="bg-gray-50/50 pb-3">
                  <CardTitle>
                    <div className="text-sm font-medium text-blue-600 mb-1">
                      {exam.subjectName}
                    </div>
                    <div className="text-lg leading-tight group-hover:text-blue-700 transition-colors">
                      {exam.title}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <Clock size={14} /> {exam.durationMinutes} นาที
                    </div>
                    <div className="text-gray-400">|</div>
                    <div>{exam._count?.questions || 0} ข้อ</div>
                  </div>
                  <Button
                    className="w-full gap-2 transition-transform active:scale-95"
                    onClick={() => handleStartExam(exam.id)}
                    disabled={!exam.isActive}
                    variant={exam.isActive ? "default" : "secondary"}
                  >
                    <PlayCircle size={16} />
                    {exam.isActive ? "เข้าห้องสอบ" : "ยังไม่เปิดให้สอบ"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
