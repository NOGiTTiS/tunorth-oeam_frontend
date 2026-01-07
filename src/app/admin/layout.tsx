import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, LayoutDashboard, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Admin Navbar */}
      <header className="bg-slate-900 text-white h-16 flex items-center px-6 justify-between shadow-md">
        <div className="flex items-center gap-2 font-bold text-xl">
           <span className="text-blue-400">TUNorth</span> Admin
        </div>
        <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
                <Button variant="ghost" className="text-white hover:bg-slate-800 gap-2">
                    <LayoutDashboard size={16}/> Dashboard
                </Button>
            </Link>
            <Link href="/admin/users">
                <Button variant="ghost" className="text-white hover:bg-slate-800 gap-2">
                    <Users size={16}/> จัดการผู้ใช้
                </Button>
            </Link>
            <Link href="/login">
                <Button variant="destructive" size="sm" className="gap-2">
                    <LogOut size={16}/> Logout
                </Button>
            </Link>
        </div>
      </header>
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}