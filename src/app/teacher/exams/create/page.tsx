"use client"

import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shuffle } from "lucide-react"

export default function CreateExamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subjectName: "",
    title: "",
    durationMinutes: 60,
    isRandomQuestion: false,
    isRandomChoice: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // ไม่ต้องส่ง start/end datetime แล้ว
      const payload = {
        ...formData,
        durationMinutes: Number(formData.durationMinutes),
      }

      const res = await axios.post("http://localhost:8000/exams", payload)

      // สร้างเสร็จ ไปหน้า Edit โจทย์ต่อ
      router.push(`/teacher/exams/${res.data.id}/edit`)
    } catch (error) {
      console.error(error)
      alert("สร้างข้อสอบไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-900">
            สร้างชุดข้อสอบใหม่
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>รหัสวิชา / ชื่อวิชา</Label>
                <Input
                  required
                  placeholder="เช่น ว30101 วิทยาศาสตร์"
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
                  placeholder="เช่น สอบกลางภาค 1/2568"
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
              {/* ลบ Start/End Datetime ออกจากตรงนี้ */}
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
              disabled={loading}
            >
              {loading ? "กำลังบันทึก..." : "บันทึกและไปเพิ่มโจทย์"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
