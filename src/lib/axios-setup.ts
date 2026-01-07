// frontend/src/lib/axios-setup.ts
import axios from "axios"

export function setupAxios() {
  // 1. ก่อนยิง Request: แอบยัด Token ใส่ Header
  axios.interceptors.request.use((config) => {
    // ต้องเช็คว่ารันบน Browser ถึงจะเข้าถึง localStorage ได้
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  })

  // 2. หลังได้รับ Response: ถ้าเจอ 401 (Token หมดอายุ) ให้เด้งไป Login
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // เฉพาะกรณีที่ไม่ได้อยู่ที่หน้า Login อยู่แล้ว เพื่อป้องกัน Loop
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          console.warn("Token expired or unauthorized, redirecting to login...")
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          window.location.href = "/login"
        }
      }
      return Promise.reject(error)
    }
  )
}
