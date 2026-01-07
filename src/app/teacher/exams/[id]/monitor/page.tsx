"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { io } from "socket.io-client"
import axios from "axios" // อย่าลืม import axios
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Unlock, RefreshCw } from "lucide-react"

// Socket
const socket = io("http://localhost:8001")

interface Log {
  studentName: string
  type: string
  timestamp: string
}

// Interface สำหรับข้อมูลนักเรียน
interface StudentSession {
  id: number
  status: "ONGOING" | "LOCKED" | "SUBMITTED"
  student: {
    username: string
    fullName: string
    classRoom: string
  }
}

export default function MonitorPage() {
  const params = useParams()
  const examId = params.id
  const [logs, setLogs] = useState<Log[]>([])
  const [students, setStudents] = useState<StudentSession[]>([]) // State เก็บข้อมูลนักเรียนจริง

  // Function โหลดข้อมูลนักเรียน
  const fetchStudentStatus = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/exams/${examId}/sessions`
      )
      setStudents(res.data)
    } catch (error) {
      console.error("Failed to fetch students")
    }
  }

  useEffect(() => {
    // 1. Join Room
    socket.emit("join_teacher_room", examId)

    // 2. Load Initial Data
    fetchStudentStatus()

    // 3. Listen for Warnings
    socket.on("student_warning", (data: any) => {
      setLogs((prev) => [data, ...prev])

      // เมื่อมีการแจ้งเตือน (โกง) ให้รีโหลดสถานะนักเรียนใหม่ (เพื่อให้เห็นสีแดงทันที)
      fetchStudentStatus()
    })

    return () => {
      socket.off("student_warning")
    }
  }, [examId])

  const handleUnlockAll = () => {
    socket.emit("teacher_unlock_all", examId)

    // รอแป๊บนึงแล้วโหลดสถานะใหม่ (เพื่อให้เห็นกลับมาเป็นสีเขียว)
    setTimeout(() => {
      fetchStudentStatus()
    }, 1000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-red-700 flex items-center gap-2">
          <AlertTriangle /> Real-time Monitoring
        </h1>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={fetchStudentStatus}>
            <RefreshCw size={16} className="mr-2" /> รีเฟรชสถานะ
          </Button>
          <Button
            onClick={handleUnlockAll}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Unlock size={16} className="mr-2" /> ปลดล็อกทุกคน
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Live Feed */}
        <Card className="h-[500px] flex flex-col">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Live Cheating Logs</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                ยังไม่มีการแจ้งเตือน
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 font-medium">
                  <tr>
                    <th className="p-3">เวลา</th>
                    <th className="p-3">นักเรียน</th>
                    <th className="p-3">เหตุการณ์</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr
                      key={i}
                      className="border-b animate-in fade-in slide-in-from-top-2"
                    >
                      <td className="p-3 text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-medium">{log.studentName}</td>
                      <td className="p-3 text-red-600 font-bold">{log.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Right: Real Student Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle>สถานะนักเรียน ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                ยังไม่มีนักเรียนเข้าห้องสอบ
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {students.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded text-center border shadow-sm transition-colors ${
                      session.status === "LOCKED"
                        ? "bg-red-100 border-red-300 text-red-800 font-bold animate-pulse" // สีแดงเมื่อถูกล็อก
                        : session.status === "SUBMITTED"
                        ? "bg-gray-100 border-gray-300 text-gray-500" // สีเทาเมื่อส่งแล้ว
                        : "bg-green-100 border-green-300 text-green-800" // สีเขียวปกติ
                    }`}
                  >
                    <div className="text-lg font-semibold">
                      {session.student.username}
                    </div>
                    <div className="text-xs truncate">
                      {session.student.fullName}
                    </div>
                    <div className="text-[10px] mt-1 uppercase tracking-wide">
                      {session.status}
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
