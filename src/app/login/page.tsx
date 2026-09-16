'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, LogIn, Chrome } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { isDemoMode } from '@/lib/mockData'
import { useToast } from '@/components/ui/Toast'

function LoginContent() {
  const { isAuthenticated, canManageContent, signInWithEmail, signInWithGoogle, demoSignIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const rawRedirect = searchParams.get('redirect') || ''
  const sanitizedRedirect = rawRedirect.replace(/^[^/]+/, '')
  const redirect = (sanitizedRedirect.startsWith('/') && !sanitizedRedirect.startsWith('//'))
    ? sanitizedRedirect
    : (canManageContent ? '/dashboard' : '/learn')
  const demo = isDemoMode()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      const dest = canManageContent ? '/dashboard' : '/learn'
      const target = redirect && redirect !== '/login' && redirect.startsWith('/') ? redirect : dest
      router.replace(target)
    }
  }, [isAuthenticated, canManageContent, redirect, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    setError('')

    const result = await signInWithEmail(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast.success('Signed in successfully!')
    const dest = canManageContent ? '/dashboard' : '/learn'
    const target = redirect && redirect !== '/login' && redirect.startsWith('/') ? redirect : dest
    router.push(target)
  }

  const handleGoogleSignIn = async () => {
    await signInWithGoogle()
  }

  const handleDemoSignIn = (role: 'head' | 'tutor' | 'tutor_pending' | 'member') => {
    demoSignIn(role)
    const label = role === 'head' ? 'Head Admin' : role === 'tutor' ? 'Approved Tutor' : role === 'tutor_pending' ? 'Pending Tutor' : 'Student'
    toast.success(`Signed in as demo ${label}`)
    const dest = role === 'member' ? '/learn' : '/dashboard'
    router.push(dest)
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1.5">Sign in to your Simi Learning Hub account</p>
        </div>

        {/* Form card */}
        <div className="bg-[#1a1a24] rounded-xl border border-white/[0.06] p-6 space-y-5">
          {/* Google OAuth */}
          {!demo && (
            <>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleGoogleSignIn}
                icon={<Chrome className="w-4 h-4" />}
              >
                Sign in with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#1a1a24] px-3 text-gray-600">or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          {/* Demo buttons */}
          {demo && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#1a1a24] px-3 text-gray-600">or try demo mode</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoSignIn('head')}
                  className="text-purple-400 border-purple-500/20 text-xs"
                >
                  Head Admin
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoSignIn('tutor')}
                  className="text-indigo-400 border-indigo-500/20 text-xs"
                >
                  Approved Tutor
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoSignIn('tutor_pending')}
                  className="text-amber-400 border-amber-500/20 text-xs"
                >
                  Pending Tutor
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoSignIn('member')}
                  className="text-emerald-400 border-emerald-500/20 text-xs"
                >
                  Student Member
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center px-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
