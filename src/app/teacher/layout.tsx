"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, UserCircle, LayoutDashboard } from "lucide-react"
import AuthGuard from "@/components/AuthGuard"
import { useEffect, useState } from "react"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.replace("/login")
  }

  return (
    <AuthGuard allowedRoles={["TEACHER", "ADMIN"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Navbar */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-2 font-bold text-xl text-blue-900 hover:opacity-80 transition"
            >
              <span>TUNorth</span>{" "}
              <span className="text-blue-500">Teacher</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/teacher/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600"
                >
                  <LayoutDashboard size={16} className="mr-2" /> Dashboard
                </Button>
              </Link>
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
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

        {/* Content */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </AuthGuard>
  )
}
