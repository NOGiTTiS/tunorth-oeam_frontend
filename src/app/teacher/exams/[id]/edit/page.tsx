"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import * as XLSX from "xlsx" // ต้องมั่นใจว่ารัน bun add xlsx แล้ว
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  FileSpreadsheet,
  Upload,
  Download,
} from "lucide-react"
import Link from "next/link"

// --- Type Definitions ---
interface Choice {
  id?: number
  choiceText: string
  isCorrect: boolean
}

interface Question {
  id: number
  questionText: string
  score: number
  choices: Choice[]
}

interface ExamDetail {
  id: number
  subjectName: string
  title: string
  questions: Question[]
}

export default function EditExamPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // State สำหรับฟอร์มเพิ่มโจทย์รายข้อ
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    score: 1,
    choices: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  })

  // --- 1. Fetch Data ---
  useEffect(() => {
    fetchExamData()
  }, [examId])

  const fetchExamData = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/exams/${examId}`)
      setExam(res.data)
    } catch (error) {
      console.error("Error fetching exam:", error)
      alert("ไม่สามารถดึงข้อมูลข้อสอบได้")
    } finally {
      setLoading(false)
    }
  }

  // --- 2. Single Question Form Logic ---
  const handleChoiceChange = (index: number, val: string) => {
    const updatedChoices = [...newQuestion.choices]
    updatedChoices[index].text = val
    setNewQuestion({ ...newQuestion, choices: updatedChoices })
  }

  const handleCorrectSelect = (index: number) => {
    const updatedChoices = newQuestion.choices.map((c, i) => ({
      ...c,
      isCorrect: i === index,
    }))
    setNewQuestion({ ...newQuestion, choices: updatedChoices })
  }

  const handleAddQuestion = async () => {
    if (!exam || !newQuestion.questionText) return alert("กรุณากรอกคำถาม")

    try {
      await axios.post("http://localhost:8000/questions", {
        examId: Number(examId),
        questionText: newQuestion.questionText,
        questionType: "MCQ",
        score: newQuestion.score,
        choices: newQuestion.choices,
      })

      // Reset Form
      setNewQuestion({
        questionText: "",
        score: 1,
        choices: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      })
      fetchExamData()
    } catch (error) {
      console.error(error)
      alert("เพิ่มโจทย์ไม่สำเร็จ")
    }
  }

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm("ต้องการลบข้อนี้ใช่หรือไม่?")) return
    try {
      await axios.delete(`http://localhost:8000/questions/${qId}`)
      fetchExamData()
    } catch (error) {
      alert("ลบไม่สำเร็จ")
    }
  }

  // --- 3. Excel Import Logic ---
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        คำถาม: "ตัวอย่าง: 1 + 1 เท่ากับเท่าไหร่?",
        คะแนน: 1,
        "ตัวเลือก A": "1",
        "ตัวเลือก B": "2",
        "ตัวเลือก C": "3",
        "ตัวเลือก D": "4",
        "ข้อที่ถูก (A/B/C/D)": "B",
      },
      {
        คำถาม: "Sun หมายถึงอะไร?",
        คะแนน: 2,
        "ตัวเลือก A": "ดวงจันทร์",
        "ตัวเลือก B": "ดวงอาทิตย์",
        "ตัวเลือก C": "ดาวอังคาร",
        "ตัวเลือก D": "โลก",
        "ข้อที่ถูก (A/B/C/D)": "B",
      },
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    XLSX.writeFile(wb, "Exam_Template.xlsx")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: "binary" })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data: any[] = XLSX.utils.sheet_to_json(ws)

      if (data.length === 0) {
        alert("ไฟล์ไม่มีข้อมูล")
        return
      }

      // Transform Data
      const formattedQuestions = data.map((row) => {
        const correctChar = row["ข้อที่ถูก (A/B/C/D)"]
          ?.toString()
          .toUpperCase()
          .trim()
        return {
          questionText: row["คำถาม"],
          score: Number(row["คะแนน"]) || 1,
          choices: [
            {
              text: row["ตัวเลือก A"]?.toString() || "",
              isCorrect: correctChar === "A",
            },
            {
              text: row["ตัวเลือก B"]?.toString() || "",
              isCorrect: correctChar === "B",
            },
            {
              text: row["ตัวเลือก C"]?.toString() || "",
              isCorrect: correctChar === "C",
            },
            {
              text: row["ตัวเลือก D"]?.toString() || "",
              isCorrect: correctChar === "D",
            },
          ].filter((c) => c.text !== ""), // Remove empty choices
        }
      })

      // Send to Backend
      try {
        await axios.post("http://localhost:8000/questions/bulk", {
          examId: Number(examId),
          questions: formattedQuestions,
        })
        alert(`นำเข้าสำเร็จ ${formattedQuestions.length} ข้อ`)
        fetchExamData()
      } catch (error) {
        console.error(error)
        alert("เกิดข้อผิดพลาดในการนำเข้า กรุณาตรวจสอบไฟล์ Excel")
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    reader.readAsBinaryString(file)
  }

  // --- Render ---
  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!exam)
    return <div className="p-8 text-center text-red-500">Exam not found</div>

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/teacher/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {exam.subjectName}
          </h1>
          <p className="text-gray-500">{exam.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-1 space-y-6">
          {/* 1. Import Card */}
          <Card className="border-green-200 shadow-sm bg-green-50/30">
            <CardHeader className="bg-green-100/50 py-3 border-b border-green-200">
              <CardTitle className="text-green-800 text-base flex items-center gap-2">
                <FileSpreadsheet size={18} /> นำเข้าจาก Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white text-green-700 border-green-200 hover:bg-green-50"
                onClick={downloadTemplate}
              >
                <Download size={14} className="mr-2" /> 1. ดาวน์โหลดไฟล์ตัวอย่าง
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} className="mr-2" /> 2. เลือกไฟล์ Excel
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 text-center">
                รองรับไฟล์ .xlsx / .xls ตามรูปแบบ Template
              </p>
            </CardContent>
          </Card>

          {/* 2. Add Question Form */}
          <Card className="border-blue-200 shadow-md sticky top-6">
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <CardTitle className="text-blue-800 flex items-center gap-2 text-lg">
                <Plus size={20} /> เพิ่มโจทย์ทีละข้อ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label>คำถาม</Label>
                <Textarea
                  placeholder="พิมพ์โจทย์ที่นี่..."
                  value={newQuestion.questionText}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      questionText: e.target.value,
                    })
                  }
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div>
                <Label>คะแนน</Label>
                <Input
                  type="number"
                  min={1}
                  value={newQuestion.score}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      score: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-3">
                <Label>ตัวเลือก (เลือกข้อที่ถูก)</Label>
                {newQuestion.choices.map((choice, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={choice.isCorrect}
                      onChange={() => handleCorrectSelect(idx)}
                      className="w-4 h-4 text-blue-600 cursor-pointer shrink-0"
                    />
                    <Input
                      placeholder={`ตัวเลือกที่ ${idx + 1}`}
                      value={choice.text}
                      onChange={(e) => handleChoiceChange(idx, e.target.value)}
                      className={
                        choice.isCorrect
                          ? "border-green-500 ring-1 ring-green-200 bg-green-50"
                          : ""
                      }
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleAddQuestion}
                className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
              >
                <Save size={16} className="mr-2" /> บันทึกโจทย์
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-gray-800">
              รายการโจทย์ ({exam.questions.length} ข้อ)
            </h2>
            <div className="text-sm text-gray-500">
              คะแนนรวม: {exam.questions.reduce((sum, q) => sum + q.score, 0)}{" "}
              คะแนน
            </div>
          </div>

          {exam.questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
              <FileSpreadsheet size={48} className="mb-4 opacity-20" />
              <p>ยังไม่มีโจทย์</p>
              <p className="text-sm">
                เพิ่มโจทย์ทางด้านซ้าย หรือ Import จาก Excel
              </p>
            </div>
          ) : (
            exam.questions.map((q, index) => (
              <Card
                key={q.id}
                className="relative group hover:shadow-md transition-shadow border-gray-200"
              >
                <CardContent className="pt-6">
                  {/* Delete Button (Hidden by default, shown on hover) */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <div className="bg-gray-100 text-gray-500 font-bold text-lg w-10 h-10 flex items-center justify-center rounded-full shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-lg mb-2 text-gray-900">
                        {q.questionText}
                      </p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                        {q.score} คะแนน
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-14">
                    {q.choices.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-md border text-sm flex items-center gap-2 ${
                          c.isCorrect
                            ? "bg-green-50 border-green-200 text-green-800 font-medium"
                            : "bg-white border-gray-100 text-gray-600"
                        }`}
                      >
                        {c.isCorrect ? (
                          <CheckCircle2
                            size={16}
                            className="text-green-600 shrink-0"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0"></div>
                        )}
                        {c.choiceText}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
