"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PlusCircle,
  Trash2,
  Edit,
  Eye,
  BarChart3,
  Power,
  Clock,
} from "lucide-react"

// Interface สำหรับข้อมูลข้อสอบ
interface Exam {
  id: number
  subjectName: string
  title: string
  durationMinutes: number
  _count: { questions: number }
  isActive: boolean
}

export default function TeacherDashboard() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExams()
  }, [])

  // 1. ดึงข้อมูลข้อสอบทั้งหมด
  const fetchExams = async () => {
    try {
      const res = await axios.get("http://localhost:8000/exams")
      setExams(res.data)
    } catch (error) {
      console.error("Failed to load exams")
    } finally {
      setLoading(false)
    }
  }

  // 2. ฟังก์ชันลบข้อสอบ
  const deleteExam = async (id: number) => {
    if (
      !confirm("ยืนยันการลบข้อสอบชุดนี้? (ข้อมูลการสอบและคะแนนจะหายไปทั้งหมด)")
    )
      return
    try {
      await axios.delete(`http://localhost:8000/exams/${id}`)
      fetchExams() // โหลดข้อมูลใหม่หลังลบ
    } catch (error) {
      alert("ลบไม่สำเร็จ")
    }
  }

  // 3. ฟังก์ชันเปิด/ปิดสถานะสอบ (Toggle Active)
  const toggleActive = async (examId: number, currentStatus: boolean) => {
    try {
      await axios.patch(`http://localhost:8000/exams/${examId}/toggle`, {
        isActive: !currentStatus,
      })
      fetchExams() // โหลดข้อมูลใหม่เพื่ออัปเดต UI
    } catch (error) {
      alert("เปลี่ยนสถานะไม่สำเร็จ")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการข้อสอบ</h1>
          <p className="text-gray-500 mt-1">รายการข้อสอบทั้งหมดในระบบ</p>
        </div>
        <Link href="/teacher/exams/create">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md">
            <PlusCircle size={18} /> สร้างข้อสอบใหม่
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-10 text-gray-500">
          กำลังโหลดข้อมูล...
        </div>
      )}

      {/* Empty State */}
      {!loading && exams.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-400 mb-4">ยังไม่มีชุดข้อสอบ</p>
          <Link href="/teacher/exams/create">
            <Button variant="outline">เริ่มสร้างข้อสอบแรก</Button>
          </Link>
        </div>
      )}

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <Card
            key={exam.id}
            className={`hover:shadow-lg transition-all duration-200 border-t-4 ${
              exam.isActive ? "border-t-green-500" : "border-t-gray-300"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle
                  className="text-lg font-bold text-blue-900 line-clamp-1"
                  title={exam.subjectName}
                >
                  {exam.subjectName}
                </CardTitle>

                {/* ปุ่ม Toggle Status */}
                <Button
                  variant={exam.isActive ? "default" : "secondary"}
                  size="sm"
                  onClick={() => toggleActive(exam.id, exam.isActive)}
                  className={`h-7 px-2 text-xs gap-1 transition-colors ${
                    exam.isActive
                      ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  <Power size={12} />
                  {exam.isActive ? "เปิดสอบอยู่" : "ปิดสอบ"}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <p className="font-medium text-gray-700 mb-4 h-12 line-clamp-2">
                {exam.title}
              </p>

              <div className="flex gap-4 text-sm text-gray-500 mb-6 bg-gray-50 p-2 rounded-md">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-gray-800">
                    {exam._count?.questions || 0}
                  </span>{" "}
                  ข้อ
                </div>
                <div className="w-px bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <Clock size={14} /> {exam.durationMinutes} นาที
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Edit */}
                <Link
                  href={`/teacher/exams/${exam.id}/edit`}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1 hover:bg-gray-50"
                  >
                    <Edit size={14} /> แก้ไข
                  </Button>
                </Link>

                {/* 2. Delete */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteExam(exam.id)}
                  className="w-full gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
                >
                  <Trash2 size={14} /> ลบ
                </Button>

                {/* 3. Monitor (Real-time) */}
                <Link
                  href={`/teacher/exams/${exam.id}/monitor`}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  >
                    <Eye size={14} /> คุมสอบ
                  </Button>
                </Link>

                {/* 4. Results (Report) */}
                <Link
                  href={`/teacher/exams/${exam.id}/results`}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                  >
                    <BarChart3 size={14} /> ผลสอบ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
