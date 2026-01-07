"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, FileBarChart } from "lucide-react"
import * as XLSX from "xlsx"

// Interface สำหรับข้อมูลรายงาน
interface ReportItem {
  studentCode: string
  studentName: string
  classRoom: string
  status: string
  obtainedScore: number
  totalScore: number
  percentage: string
}

export default function ExamResultsPage() {
  const params = useParams()
  const examId = params.id
  const [report, setReport] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [examId])

  const fetchReport = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/exams/${examId}/report`
      )
      setReport(res.data)
    } catch (error) {
      alert("โหลดข้อมูลไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชัน Export Excel
  const handleExport = () => {
    // 1. เตรียมข้อมูลสำหรับ Excel
    const dataToExport = report.map((item) => ({
      รหัสนักเรียน: item.studentCode,
      "ชื่อ-นามสกุล": item.studentName,
      ชั้นเรียน: item.classRoom || "-",
      สถานะ: item.status,
      คะแนนที่ได้: item.obtainedScore,
      คะแนนเต็ม: item.totalScore,
      คิดเป็นร้อยละ: `${item.percentage}%`,
    }))

    // 2. สร้าง Worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Exam Results")

    // 3. ดาวน์โหลดไฟล์
    XLSX.writeFile(wb, `Score_Report_Exam_${examId}.xlsx`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChart className="text-blue-600" /> รายงานผลคะแนน
        </h1>
        <Button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สรุปคะแนนสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center p-4">กำลังคำนวณคะแนน...</div>
          ) : report.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              ยังไม่มีผู้เข้าสอบ
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสนักเรียน</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">คะแนนที่ได้</TableHead>
                  <TableHead className="text-right">ร้อยละ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {item.studentCode}
                    </TableCell>
                    <TableCell>{item.studentName}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.status === "SUBMITTED"
                            ? "bg-green-100 text-green-800"
                            : item.status === "LOCKED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {item.obtainedScore}{" "}
                      <span className="text-gray-400 text-sm font-normal">
                        / {item.totalScore}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.percentage}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
