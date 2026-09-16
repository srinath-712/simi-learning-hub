'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, BookOpen, Users, X } from 'lucide-react'
import { clsx } from 'clsx'

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/content', label: 'Content', icon: FileText, exact: false },
  { href: '/dashboard/subjects', label: 'Subjects', icon: BookOpen, exact: false },
  { href: '/dashboard/members', label: 'Members', icon: Users, exact: false },
]

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Mobile close button */}
      <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-white/5">
        <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Menu</span>
        <button
          onClick={onMobileClose}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'text-indigo-400 bg-indigo-500/10 border-l-2 border-indigo-500 ml-0 pl-[10px]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-l-2 border-transparent ml-0 pl-[10px]'
              )}
            >
              <Icon className={clsx('w-5 h-5', active ? 'text-indigo-400' : 'text-gray-500')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <p className="text-xs text-gray-600">Simi Learning Hub</p>
        <p className="text-xs text-gray-600">Tutor Dashboard</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:min-h-[calc(100vh-64px)] bg-[#0f0f13] border-r border-white/5">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0f0f13] border-r border-white/5 lg:hidden overflow-y-auto">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
