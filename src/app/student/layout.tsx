"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, UserCircle } from "lucide-react"
import AuthGuard from "@/components/AuthGuard"
import { useEffect, useState } from "react"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  // โหลดชื่อนักเรียนมาแสดงที่ Navbar
  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [])

  const handleLogout = () => {
    // ล้างข้อมูลและดีดออก
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.replace("/login")
  }

  return (
    // ครอบด้วย AuthGuard เฉพาะ STUDENT
    <AuthGuard allowedRoles={["STUDENT"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* --- Student Navbar --- */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
          {/* Logo / Home Link */}
          <Link
            href="/student/dashboard"
            className="flex items-center gap-2 font-bold text-xl text-blue-900 hover:opacity-80 transition"
          >
            <span>TUNorth</span> <span className="text-blue-500">Student</span>
          </Link>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                <UserCircle size={18} />
                <span className="font-medium truncate max-w-[150px]">
                  {user.fullName}
                </span>
                <span className="text-xs text-gray-500 border-l pl-2 ml-1">
                  {user.username}
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut size={18} className="mr-2" /> ออกจากระบบ
            </Button>
          </div>
        </header>

        {/* --- Content (Dashboard, ExamRoom, etc.) --- */}
        <main className="flex-1 w-full">{children}</main>
      </div>
    </AuthGuard>
  )
}
