"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  Upload,
  Trash2,
  Pencil,
  Download,
  FileSpreadsheet,
} from "lucide-react"

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")

  // Modal State
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "STUDENT",
    classRoom: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (roleFilter !== "ALL") params.role = roleFilter

      const res = await axios.get("http://localhost:8000/users", { params })
      setUsers(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- CRUD Functions ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) {
        // Update
        await axios.put(`http://localhost:8000/users/${editId}`, formData)
      } else {
        // Create
        if (!formData.password) return alert("กรุณากรอกรหัสผ่าน")
        await axios.post("http://localhost:8000/users", formData)
      }
      setIsOpen(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      alert("บันทึกไม่สำเร็จ (Username อาจซ้ำ)")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบผู้ใช้?")) return
    await axios.delete(`http://localhost:8000/users/${id}`)
    fetchUsers()
  }

  const openEdit = (user: any) => {
    setEditId(user.id)
    setFormData({
      username: user.username,
      password: "", // Password ไม่ดึงกลับมา
      fullName: user.fullName,
      role: user.role,
      classRoom: user.classRoom || "",
    })
    setIsOpen(true)
  }

  const resetForm = () => {
    setEditId(null)
    setFormData({
      username: "",
      password: "",
      fullName: "",
      role: "STUDENT",
      classRoom: "",
    })
  }

  // --- Import Functions ---
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Username: "66001",
        Password: "123",
        FullName: "นายสมชาย ใจดี",
        Role: "STUDENT",
        Class: "6/1",
      },
      {
        Username: "teacher01",
        Password: "123",
        FullName: "ครูสมศรี",
        Role: "TEACHER",
        Class: "",
      },
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Users")
    XLSX.writeFile(wb, "User_Import_Template.xlsx")
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: "binary" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data: any[] = XLSX.utils.sheet_to_json(ws)

      const formattedUsers = data.map((row) => ({
        username: row["Username"]?.toString(),
        password: row["Password"]?.toString(),
        fullName: row["FullName"],
        role: row["Role"] || "STUDENT",
        classRoom: row["Class"]?.toString() || "",
      }))

      try {
        await axios.post("http://localhost:8000/users/bulk", {
          users: formattedUsers,
        })
        alert(`นำเข้าสำเร็จ ${formattedUsers.length} คน`)
        fetchUsers()
      } catch (error) {
        alert("นำเข้าล้มเหลว")
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">จัดการผู้ใช้งาน</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download size={16} /> Template
          </Button>
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx"
              onChange={handleImport}
            />
            <Button
              variant="outline"
              className="gap-2 text-green-700 border-green-200 bg-green-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet size={16} /> Import Excel
            </Button>
          </div>
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600">
                <Plus size={16} /> เพิ่มผู้ใช้
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editId ? "แก้ไขข้อมูล" : "เพิ่มผู้ใช้ใหม่"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Username / รหัสนักเรียน</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    disabled={!!editId}
                    required
                  />
                </div>
                <div>
                  <Label>Password {editId && "(เว้นว่างถ้าไม่เปลี่ยน)"}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editId}
                  />
                </div>
                <div>
                  <Label>ชื่อ-นามสกุล</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(v) =>
                        setFormData({ ...formData, role: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="TEACHER">Teacher</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.role === "STUDENT" && (
                    <div>
                      <Label>ชั้นเรียน</Label>
                      <Input
                        value={formData.classRoom}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            classRoom: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  {editId ? "บันทึกการแก้ไข" : "สร้างผู้ใช้"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="ค้นหาชื่อ หรือ รหัส..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="STUDENT">นักเรียน</SelectItem>
                <SelectItem value="TEACHER">ครูอาจารย์</SelectItem>
                <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>สิทธิ์ (Role)</TableHead>
                <TableHead>ชั้นเรียน</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === "ADMIN"
                          ? "bg-red-100 text-red-800"
                          : u.role === "TEACHER"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>{u.classRoom || "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(u.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
