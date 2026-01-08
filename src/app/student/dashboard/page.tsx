"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, PlayCircle, CalendarDays } from "lucide-react"

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
        <p className="opacity-90">
          ห้องเรียน:{" "}
          <span className="font-bold bg-white/20 px-2 py-0.5 rounded ml-1">
            {user?.classRoom || "-"}
          </span>
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          📚 รายวิชาที่เปิดสอบสำหรับคุณ
        </h2>

        {exams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">ยังไม่มีการสอบในช่วงเวลานี้</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => {
              // ดึง Schedule ของห้องนักเรียน (API จะส่งมาให้แค่อันเดียวที่ตรงกับห้อง)
              const schedule = exam.schedules?.[0]

              return (
                <Card
                  key={exam.id}
                  className="group hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500 overflow-hidden bg-white"
                >
                  <CardHeader className="bg-gray-50/50 pb-3 border-b">
                    <CardTitle>
                      <div className="text-sm font-medium text-blue-600 mb-1 truncate">
                        {exam.subjectName}
                      </div>
                      <div className="text-lg leading-tight group-hover:text-blue-700 transition-colors line-clamp-2 min-h-[1.5em]">
                        {exam.title}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* แสดงวันเวลาสอบ */}
                    {schedule ? (
                      <div className="text-sm bg-blue-50 text-blue-900 p-3 rounded-lg border border-blue-100 flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-semibold">
                          <CalendarDays size={16} className="text-blue-600" />
                          {new Date(schedule.startTime).toLocaleDateString(
                            "th-TH",
                            {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            }
                          )}
                        </div>
                        <div className="pl-6 text-xs text-gray-600">
                          {new Date(schedule.startTime).toLocaleTimeString(
                            "th-TH",
                            { hour: "2-digit", minute: "2-digit" }
                          )}{" "}
                          -{" "}
                          {new Date(schedule.endTime).toLocaleTimeString(
                            "th-TH",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm bg-gray-50 text-gray-500 p-3 rounded-lg border flex justify-center">
                        ไม่ระบุเวลา
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-600 px-1">
                      <div className="flex items-center gap-1">
                        <Clock size={14} /> {exam.durationMinutes} นาที
                      </div>
                      <div>{exam._count?.questions || 0} ข้อ</div>
                    </div>

                    <Button
                      className="w-full gap-2 transition-transform active:scale-95"
                      onClick={() => handleStartExam(exam.id)}
                      // ปุ่มจะกดได้ก็ต่อเมื่อ มีตารางสอบ และครูเปิด Active
                      // (ถึงแม้ API จะกรองมาแล้ว แต่ใส่ disabled ไว้เพื่อความปลอดภัย UX)
                      disabled={!schedule}
                      variant="default"
                    >
                      <PlayCircle size={16} /> เข้าห้องสอบ
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
