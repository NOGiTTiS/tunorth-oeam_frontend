"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // เช่น ['TEACHER', 'ADMIN']
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // 1. เช็ค Token
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      // ถ้าไม่มี Token ให้ดีดไป Login
      router.replace("/login");
      return;
    }

    // 2. เช็ค Role (ถ้ามีการระบุ allowedRoles)
    if (allowedRoles) {
      const user = JSON.parse(userStr);
      if (!allowedRoles.includes(user.role)) {
        // ถ้า Role ไม่ตรง ให้ดีดกลับไป Dashboard ของ Role นั้นๆ
        if (user.role === "STUDENT") router.replace("/student/dashboard");
        else if (user.role === "TEACHER") router.replace("/teacher/dashboard");
        else if (user.role === "ADMIN") router.replace("/admin/dashboard");
        return;
      }
    }

    // ผ่านทุกด่าน
    setAuthorized(true);
  }, [router, allowedRoles]);

  // ระหว่างรอเช็ค ให้แสดง Loading (เพื่อไม่ให้เห็นหน้าเว็บแวบหนึ่ง)
  if (!authorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-10 w-10 text-gray-400" />
      </div>
    );
  }

  return <>{children}</>;
}