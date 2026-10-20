'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Menu } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#f8fafc]">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-x-hidden">
        {/* Mobile sidebar toggle */}
          <div className="lg:hidden flex items-center px-4 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
           <span className="ml-3 text-sm font-medium text-slate-600">Dashboard</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
