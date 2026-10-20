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
      <div className="flex flex-col h-full bg-white">
      {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Menu</span>
        <button
          onClick={onMobileClose}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
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
                  ? 'text-indigo-700 bg-indigo-50 border-l-2 border-indigo-600 ml-0 pl-[10px]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-2 border-transparent ml-0 pl-[10px]'
              )}
            >
              <Icon className={clsx('w-5 h-5', active ? 'text-indigo-600' : 'text-slate-400')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">Simi Learning Hub</p>
        <p className="text-xs text-slate-400">Tutor Dashboard</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:min-h-[calc(100vh-64px)] bg-white border-r border-slate-200">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 lg:hidden overflow-y-auto">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
