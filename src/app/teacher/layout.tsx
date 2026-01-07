import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b h-16 flex items-center px-6 justify-between">
        <div className="font-bold text-xl text-blue-800">TUNorth-OEAM (Teacher)</div>
        <div className="space-x-4">
          <Link href="/teacher/dashboard"><Button variant="ghost">Dashboard</Button></Link>
          <Link href="/login"><Button variant="destructive">Logout</Button></Link>
        </div>
      </header>
      
      {/* Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}