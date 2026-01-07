// frontend/src/app/layout.tsx

"use client" // <--- สำคัญมาก! ต้องใส่บรรทัดนี้บนสุด

import { useEffect, useState } from "react" // เพิ่ม useState
import { Inter } from "next/font/google"
import "./globals.css"
import { setupAxios } from "@/lib/axios-setup" // Import ฟังก์ชันที่เพิ่งสร้าง

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // เรียกใช้ setupAxios ครั้งเดียวตอนโหลดแอป
  useEffect(() => {
    setupAxios()
  }, [])

  // (Optional) ป้องกัน Hydration Error เล็กน้อย
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* แสดงผลเมื่อ mount แล้วเพื่อความชัวร์ (หรือใส่ children เลยก็ได้) */}
        {mounted ? children : <div className="p-4">Loading...</div>}
      </body>
    </html>
  )
}
