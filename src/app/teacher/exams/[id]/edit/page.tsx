"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import * as XLSX from "xlsx"
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
  Image as ImageIcon,
  X,
  Edit,
} from "lucide-react"
import Link from "next/link"

// --- Type Definitions ---
interface Choice {
  id?: number
  choiceText: string
  text?: string // field ช่วยสำหรับ mapping
  imageUrl?: string
  isCorrect: boolean
}

interface Question {
  id: number
  questionText: string
  imageUrl?: string
  score: number
  choices: Choice[]
}

export default function EditExamPage() {
  const params = useParams()
  const examId = params.id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // --- State สำหรับโหมดแก้ไข (Editing Mode) ---
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Question | null>(null)

  // --- State สำหรับฟอร์มเพิ่มโจทย์ใหม่ (Create Mode) ---
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    imageUrl: "",
    score: 1,
    choices: [
      { text: "", imageUrl: "", isCorrect: true },
      { text: "", imageUrl: "", isCorrect: false },
      { text: "", imageUrl: "", isCorrect: false },
      { text: "", imageUrl: "", isCorrect: false },
    ],
  })

  useEffect(() => {
    fetchExamData()
  }, [examId])

  const fetchExamData = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/exams/${examId}`)
      setExam(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- Image Upload ---
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "create" | "edit",
    target: "question" | "choice",
    choiceIndex?: number
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const url = res.data.url

      if (mode === "create") {
        if (target === "question")
          setNewQuestion((prev) => ({ ...prev, imageUrl: url }))
        else if (choiceIndex !== undefined) {
          const updated = [...newQuestion.choices]
          updated[choiceIndex].imageUrl = url
          setNewQuestion((prev) => ({ ...prev, choices: updated }))
        }
      } else if (mode === "edit" && editForm) {
        if (target === "question")
          setEditForm((prev) => (prev ? { ...prev, imageUrl: url } : null))
        else if (choiceIndex !== undefined) {
          const updatedChoices = [...editForm.choices]
          updatedChoices[choiceIndex] = {
            ...updatedChoices[choiceIndex],
            imageUrl: url,
          }
          setEditForm((prev) =>
            prev ? { ...prev, choices: updatedChoices } : null
          )
        }
      }
    } catch (error) {
      alert("Upload failed")
    }
  }

  // --- Create Logic ---
  const handleCreateChoiceChange = (idx: number, val: string) => {
    const updated = [...newQuestion.choices]
    updated[idx].text = val
    setNewQuestion({ ...newQuestion, choices: updated })
  }
  const handleCreateCorrect = (idx: number) => {
    const updated = newQuestion.choices.map((c, i) => ({
      ...c,
      isCorrect: i === idx,
    }))
    setNewQuestion({ ...newQuestion, choices: updated })
  }
  const handleAddQuestion = async () => {
    if (!newQuestion.questionText) return alert("กรุณากรอกโจทย์")
    try {
      await axios.post("http://localhost:8000/questions", {
        examId: Number(examId),
        ...newQuestion,
        questionType: "MCQ",
      })
      setNewQuestion({
        questionText: "",
        imageUrl: "",
        score: 1,
        choices: [
          { text: "", imageUrl: "", isCorrect: true },
          { text: "", imageUrl: "", isCorrect: false },
          { text: "", imageUrl: "", isCorrect: false },
          { text: "", imageUrl: "", isCorrect: false },
        ],
      })
      fetchExamData()
    } catch (e) {
      alert("เพิ่มไม่สำเร็จ")
    }
  }

  // --- Edit Logic ---
  const startEditing = (question: Question) => {
    setEditingId(question.id)
    setEditForm({
      ...question,
      choices: question.choices.map((c) => ({ ...c, text: c.choiceText })),
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleEditChoiceChange = (idx: number, val: string) => {
    if (!editForm) return
    const updated = [...editForm.choices]
    updated[idx].text = val
    updated[idx].choiceText = val
    setEditForm({ ...editForm, choices: updated })
  }

  const handleEditCorrect = (idx: number) => {
    if (!editForm) return
    const updated = editForm.choices.map((c, i) => ({
      ...c,
      isCorrect: i === idx,
    }))
    setEditForm({ ...editForm, choices: updated })
  }

  const handleUpdateQuestion = async () => {
    if (!editForm || !editForm.questionText) return alert("ข้อมูลไม่ครบ")

    try {
      const payload = {
        questionText: editForm.questionText,
        score: Number(editForm.score),
        // แก้ตรงนี้: ถ้าเป็น null ให้ส่ง "" (String ว่าง) แทน
        imageUrl: editForm.imageUrl || "",
        choices: editForm.choices.map((c) => ({
          id: c.id,
          text: c.text || c.choiceText,
          // แก้ตรงนี้เช่นกัน: ป้องกัน null
          imageUrl: c.imageUrl || "",
          isCorrect: c.isCorrect,
        })),
      }

      await axios.put(`http://localhost:8000/questions/${editForm.id}`, payload)

      alert("แก้ไขสำเร็จ")
      setEditingId(null)
      fetchExamData()
    } catch (e: any) {
      // ปรับปรุงการแสดง Error ให้ชัดเจนขึ้น
      console.error("Update Error:", e.response?.data)
      const errorMsg = e.response?.data?.message || e.message
      alert(
        `แก้ไขไม่สำเร็จ: ${
          typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg
        }`
      )
    }
  }

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm("ลบข้อนี้?")) return
    await axios.delete(`http://localhost:8000/questions/${qId}`)
    fetchExamData()
  }

  // --- Import Logic ---
  // *** ฟังก์ชันนี้แหละครับที่หายไป นำกลับมาแล้ว ***
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

      // 1. อ่านข้อมูลมาเป็น JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(ws)

      if (rawData.length === 0) {
        alert("ไฟล์ไม่มีข้อมูล")
        return
      }

      // 2. แปลงข้อมูลและกรองแถวเสีย (Sanitize)
      const formattedQuestions = rawData
        // กรองแถวที่ไม่มี "คำถาม" ทิ้งไป (แก้ปัญหาแถวว่างใน Excel)
        .filter((row) => row["คำถาม"] && row["คำถาม"].toString().trim() !== "")
        .map((row) => {
          const correctChar = row["ข้อที่ถูก (A/B/C/D)"]
            ?.toString()
            .toUpperCase()
            .trim()

          return {
            // แปลงเป็น String เสมอ เพื่อกัน Error 422
            questionText: row["คำถาม"]?.toString() || "",

            // แปลงคะแนน ถ้าไม่มีให้เป็น 1
            score: Number(row["คะแนน"]) || 1,

            // สร้าง Choices
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
            ].filter((c) => c.text.trim() !== ""), // กรอง Choice ว่างทิ้ง
          }
        })

      if (formattedQuestions.length === 0) {
        alert("ไม่พบข้อมูลคำถามที่ถูกต้องในไฟล์")
        return
      }

      // 3. ส่งไป Backend
      try {
        await axios.post("http://localhost:8000/questions/bulk", {
          examId: Number(examId),
          questions: formattedQuestions,
        })
        alert(`นำเข้าสำเร็จ ${formattedQuestions.length} ข้อ`)
        fetchExamData()
      } catch (error) {
        console.error("Import Error:", error)
        alert("เกิดข้อผิดพลาด: ข้อมูลในไฟล์ไม่ถูกต้องตามรูปแบบ")
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    reader.readAsBinaryString(file)
  }

  if (loading) return <div>Loading...</div>

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
          <h1 className="text-2xl font-bold">{exam?.subjectName}</h1>
          <p className="text-gray-500">{exam?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT: Create Form & Import --- */}
        <div className="lg:col-span-1 space-y-6">
          {/* Import Card */}
          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="pt-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white text-green-700 border-green-200 hover:bg-green-50"
                onClick={downloadTemplate} // ตรงนี้จะไม่ error แล้วครับ
              >
                <Download size={14} className="mr-2" /> 1. ดาวน์โหลดไฟล์ตัวอย่าง
              </Button>

              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".xlsx"
                />
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} className="mr-2" /> 2. เลือกไฟล์ Excel
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 text-center">
                รองรับไฟล์ .xlsx ตามรูปแบบ Template
              </p>
            </CardContent>
          </Card>

          {/* Create Form */}
          <Card className="border-blue-200 shadow-md sticky top-6">
            <CardHeader className="bg-blue-50 py-3">
              <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
                <Plus size={20} /> เพิ่มโจทย์ใหม่
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label>คำถาม</Label>
                <Textarea
                  value={newQuestion.questionText}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      questionText: e.target.value,
                    })
                  }
                />
                <div className="mt-2">
                  {newQuestion.imageUrl ? (
                    <div className="relative w-fit">
                      <img
                        src={newQuestion.imageUrl}
                        className="h-24 rounded border"
                      />
                      <button
                        onClick={() =>
                          setNewQuestion({ ...newQuestion, imageUrl: "" })
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex w-fit gap-1">
                      <ImageIcon size={14} /> เพิ่มรูป{" "}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(e, "create", "question")
                        }
                      />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <Label>คะแนน</Label>
                <Input
                  type="number"
                  value={newQuestion.score}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      score: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                {newQuestion.choices.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="newCorrect"
                      checked={c.isCorrect}
                      onChange={() => handleCreateCorrect(idx)}
                      className="w-4 h-4"
                    />
                    <Input
                      value={c.text}
                      onChange={(e) =>
                        handleCreateChoiceChange(idx, e.target.value)
                      }
                      placeholder={`ตัวเลือก ${idx + 1}`}
                    />
                    <label className="cursor-pointer text-gray-400 hover:text-blue-600">
                      <ImageIcon size={16} />
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, "create", "choice", idx)
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleAddQuestion}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
              >
                บันทึกโจทย์
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT: List (View & Edit Mode) --- */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-xl">
            รายการโจทย์ ({exam?.questions.length})
          </h2>

          {exam?.questions.map((q: any, idx: number) => (
            <Card
              key={q.id}
              className={`transition-all ${
                editingId === q.id
                  ? "ring-2 ring-blue-500 shadow-lg"
                  : "hover:shadow-md"
              }`}
            >
              {/* === EDIT MODE === */}
              {editingId === q.id && editForm ? (
                <CardContent className="pt-6 space-y-4 bg-blue-50/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-blue-700">
                      กำลังแก้ไขข้อที่ {idx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditing}
                      className="text-gray-500"
                    >
                      <X size={16} /> ยกเลิก
                    </Button>
                  </div>

                  {/* Edit Question Text & Image */}
                  <div>
                    <Label>โจทย์</Label>
                    <Textarea
                      value={editForm.questionText}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          questionText: e.target.value,
                        })
                      }
                    />
                    <div className="mt-2">
                      {editForm.imageUrl ? (
                        <div className="relative w-fit">
                          <img
                            src={editForm.imageUrl}
                            className="h-32 rounded border"
                          />
                          <button
                            onClick={() =>
                              setEditForm({ ...editForm, imageUrl: "" })
                            }
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex w-fit gap-1">
                          <ImageIcon size={14} /> เพิ่มรูปโจทย์{" "}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(e, "edit", "question")
                            }
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>คะแนน</Label>
                    <Input
                      type="number"
                      value={editForm.score}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          score: Number(e.target.value),
                        })
                      }
                      className="w-24"
                    />
                  </div>

                  {/* Edit Choices */}
                  <div className="space-y-2">
                    {editForm.choices.map((c, cIdx) => (
                      <div
                        key={c.id}
                        className="flex flex-col gap-1 p-2 border rounded bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`editCorrect-${q.id}`}
                            checked={c.isCorrect}
                            onChange={() => handleEditCorrect(cIdx)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <Input
                            value={c.text}
                            onChange={(e) =>
                              handleEditChoiceChange(cIdx, e.target.value)
                            }
                          />
                          <label className="cursor-pointer text-gray-400 hover:text-blue-600">
                            <ImageIcon size={18} />
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) =>
                                handleImageUpload(e, "edit", "choice", cIdx)
                              }
                            />
                          </label>
                        </div>
                        {c.imageUrl && (
                          <div className="relative w-fit ml-6">
                            <img
                              src={c.imageUrl}
                              className="h-16 rounded border"
                            />
                            <button
                              onClick={() => {
                                const updated = [...editForm.choices]
                                updated[cIdx].imageUrl = ""
                                setEditForm({ ...editForm, choices: updated })
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={cancelEditing}>
                      ยกเลิก
                    </Button>
                    <Button
                      onClick={handleUpdateQuestion}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save size={16} className="mr-2" /> บันทึกการแก้ไข
                    </Button>
                  </div>
                </CardContent>
              ) : (
                /* === VIEW MODE === */
                <CardContent className="pt-6 relative group">
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => startEditing(q)}
                      title="แก้ไข"
                    >
                      <Edit size={16} className="text-blue-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="ลบ"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="flex gap-4 mb-4 items-start">
                    <div className="bg-gray-100 text-gray-500 font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                      {idx + 1}
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="font-medium text-lg whitespace-pre-line">
                        {q.questionText}
                      </p>
                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          className="max-h-48 rounded border object-contain"
                        />
                      )}
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {q.score} คะแนน
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                    {q.choices.map((c: Choice) => (
                      <div
                        key={c.id}
                        className={`p-2 rounded border text-sm flex items-center gap-2 ${
                          c.isCorrect
                            ? "bg-green-50 border-green-200"
                            : "bg-white"
                        }`}
                      >
                        {c.isCorrect ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border" />
                        )}
                        <div className="flex flex-col">
                          <span>{c.choiceText}</span>
                          {c.imageUrl && (
                            <img
                              src={c.imageUrl}
                              className="h-16 mt-1 rounded border object-contain bg-white"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
