"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CalendarClock, Plus, Trash2, Power } from "lucide-react"
import Link from "next/link"

export default function ExamSchedulesPage() {
  const params = useParams()
  const examId = params.id
  const [schedules, setSchedules] = useState<any[]>([])
  const [examTitle, setExamTitle] = useState("")

  const [classRoomInput, setClassRoomInput] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  // [FIX] กำหนด URL กลาง (ถ้ามี Env ให้ใช้ Env, ถ้าไม่มีให้ใช้ localhost)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    fetchData()
  }, [examId])

  const fetchData = async () => {
    try {
      // [FIX] ใช้ apiUrl
      const examRes = await axios.get(`${apiUrl}/exams/${examId}`)
      setExamTitle(examRes.data.subjectName + " - " + examRes.data.title)

      const schRes = await axios.get(`${apiUrl}/exams/${examId}/schedules`)
      setSchedules(schRes.data)
    } catch (error) {
      console.error("Fetch Error:", error)
    }
  }

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const rooms = classRoomInput
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r !== "")
      const startTimeISO = new Date(startTime).toISOString()
      const endTimeISO = new Date(endTime).toISOString()

      // [FIX] ใช้ apiUrl
      await axios.post(`${apiUrl}/exams/${examId}/schedules`, {
        classRooms: rooms,
        startTime: startTimeISO,
        endTime: endTimeISO,
      })

      fetchData()
      setClassRoomInput("")
    } catch (error) {
      alert("เพิ่มตารางไม่สำเร็จ")
      console.error(error)
    }
  }

  const toggleActive = async (scheduleId: number, currentStatus: boolean) => {
    try {
      // [FIX] ใช้ apiUrl
      await axios.patch(`${apiUrl}/exams/schedules/${scheduleId}/toggle`, {
        isActive: !currentStatus,
      })
      fetchData()
    } catch (error) {
      alert("Error")
    }
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm("ยืนยันการลบตารางสอบนี้?")) return

    try {
      // [FIX] ใช้ apiUrl
      await axios.delete(`${apiUrl}/exams/schedules/${scheduleId}`)
      fetchData()
    } catch (error) {
      alert("ลบไม่สำเร็จ")
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/teacher/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการตารางสอบ</h1>
          <p className="text-gray-500">{examTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form เพิ่มตาราง */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Plus size={20} /> เพิ่มตารางสอบ
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <Label>ห้องเรียน (ใส่หลายห้องคั่นด้วย comma)</Label>
                <Input
                  placeholder="เช่น 6/1, 6/2"
                  value={classRoomInput}
                  onChange={(e) => setClassRoomInput(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>เวลาเริ่ม</Label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>เวลาสิ้นสุด</Label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                บันทึกตาราง
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ตารางแสดงรายการ */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>รายการตารางสอบ ({schedules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีตารางสอบ
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                  >
                    <div>
                      <div className="font-bold text-lg text-blue-900 mb-1">
                        ห้อง {sch.classRoom}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <CalendarClock size={14} />
                        {new Date(sch.startTime).toLocaleString("th-TH")} -{" "}
                        {new Date(sch.endTime).toLocaleString("th-TH")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-xs px-2 py-1 rounded font-bold ${
                          sch.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {sch.isActive ? "OPEN" : "CLOSED"}
                      </div>
                      <Button
                        size="sm"
                        variant={sch.isActive ? "default" : "secondary"}
                        onClick={() => toggleActive(sch.id, sch.isActive)}
                        className={
                          sch.isActive
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }
                      >
                        <Power size={14} className="mr-1" />{" "}
                        {sch.isActive ? "เปิดอยู่" : "เปิดสอบ"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSchedule(sch.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="ลบตารางสอบ"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
