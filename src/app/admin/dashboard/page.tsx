"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  UserPlus,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Mock Data สำหรับกราฟ (ของจริงต้องทำ API GroupBy วันที่)
  const chartData = [
    { name: "จันทร์", exams: 4 },
    { name: "อังคาร", exams: 3 },
    { name: "พุธ", exams: 10 },
    { name: "พฤหัส", exams: 7 },
    { name: "ศุกร์", exams: 12 },
  ]

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:8000/admin/stats")
        setStats(res.data)
      } catch (error) {
        console.error("Failed to load stats")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>
    )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">
        ภาพรวมระบบ (Dashboard)
      </h1>

      {/* --- 1. Stat Cards --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              นักเรียนทั้งหมด
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.counts.students}</div>
            <p className="text-xs text-gray-500">Active Students</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              ครูอาจารย์
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.counts.teachers}</div>
            <p className="text-xs text-gray-500">Total Teachers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              กำลังสอบอยู่ (ขณะนี้)
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.counts.activeSessions}
            </div>
            <p className="text-xs text-gray-500">Active Sessions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              ผู้ดูแลระบบ
            </CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.counts.admins}</div>
            <p className="text-xs text-gray-500">System Admins</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* --- 2. Chart Section (Left 4 cols) --- */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>สถิติการสอบรายสัปดาห์</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Bar
                    dataKey="exams"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* --- 3. Recent Activity & Actions (Right 3 cols) --- */}
        <div className="col-span-3 space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>เมนูด่วน</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/admin/users">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 border-blue-200"
                >
                  <UserPlus size={24} className="text-blue-600" />
                  <span>จัดการผู้ใช้</span>
                </Button>
              </Link>
              <Link href="/teacher/dashboard">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 border-purple-200"
                >
                  <FileText size={24} className="text-purple-600" />
                  <span>ระบบจัดการข้อสอบ</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity List */}
          <Card className="shadow-sm h-fit">
            <CardHeader>
              <CardTitle>การเข้าสอบล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivities.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">
                    ยังไม่มีการเคลื่อนไหว
                  </p>
                ) : (
                  stats?.recentActivities.map((act: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                          {act.student.fullName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {act.exam.subjectName}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Started
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
