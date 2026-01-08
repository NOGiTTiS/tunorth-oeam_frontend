"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shuffle, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function EditExamSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id

  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    subjectName: "",
    title: "",
    durationMinutes: 60,
    isRandomQuestion: false,
    isRandomChoice: false,
  })

  // 1. โหลดข้อมูลเดิม
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/exams/${examId}`)
        const data = res.data
        setFormData({
          subjectName: data.subjectName,
          title: data.title,
          durationMinutes: data.durationMinutes,
          isRandomQuestion: data.isRandomQuestion,
          isRandomChoice: data.isRandomChoice,
        })
      } catch (error) {
        alert("โหลดข้อมูลไม่สำเร็จ")
        router.push("/teacher/dashboard")
      } finally {
        setLoading(false)
      }
    }
    fetchExam()
  }, [examId, router])

  // 2. บันทึกการแก้ไข
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.put(`http://localhost:8000/exams/${examId}`, {
        ...formData,
        durationMinutes: Number(formData.durationMinutes),
      })

      alert("บันทึกข้อมูลเรียบร้อย")
      router.push("/teacher/dashboard") // กลับ Dashboard หรือไปหน้า Edit โจทย์ต่อก็ได้
    } catch (error) {
      console.error(error)
      alert("แก้ไขไม่สำเร็จ")
    }
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          แก้ไขรายละเอียดข้อสอบ
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-900">
            ข้อมูลทั่วไป
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>รหัสวิชา / ชื่อวิชา</Label>
                <Input
                  required
                  value={formData.subjectName}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>ชื่อการสอบ</Label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>ระยะเวลาสอบ (นาที)</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Shuffle size={16} /> การสุ่ม (Randomization)
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="randQ"
                    className="w-5 h-5 cursor-pointer"
                    checked={formData.isRandomQuestion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isRandomQuestion: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="randQ" className="cursor-pointer font-normal">
                    สุ่มลำดับโจทย์
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="randC"
                    className="w-5 h-5 cursor-pointer"
                    checked={formData.isRandomChoice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isRandomChoice: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="randC" className="cursor-pointer font-normal">
                    สุ่มลำดับตัวเลือก
                  </Label>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
            >
              <Save className="mr-2" /> บันทึกการเปลี่ยนแปลง
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
