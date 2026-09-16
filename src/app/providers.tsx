'use client'

import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { Navbar } from '@/components/layout/Navbar'
import { usePathname } from 'next/navigation'

// The landing page has its own nav, so we skip the global Navbar there
const PAGES_WITHOUT_NAVBAR = ['/']

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNavbar = !PAGES_WITHOUT_NAVBAR.includes(pathname)

  return (
    <AuthProvider>
      <ToastProvider>
        {showNavbar && <Navbar />}
        <main className="flex-1">{children}</main>
      </ToastProvider>
    </AuthProvider>
  )
}
