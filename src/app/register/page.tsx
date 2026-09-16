'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, UserPlus, BookOpen, GraduationCap, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import type { UserRole } from '@/types'
import { clsx } from 'clsx'

export default function RegisterPage() {
  const { signUpWithEmail } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [role, setRole] = useState<UserRole>('member')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    const result = await signUpWithEmail(email, password, name, role)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (role === 'tutor') {
      toast.success('Tutor application submitted! Awaiting Head approval.')
      router.push('/dashboard')
    } else {
      toast.success('Account created! Welcome to Simi Learning Hub.')
      router.push('/learn')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1.5">Join Simi Learning Hub to start learning or teaching</p>
        </div>

        {/* Form card */}
        <div className="bg-[#1a1a24] rounded-xl border border-white/[0.06] p-6 space-y-5">
          {/* Account Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={clsx(
                  'flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all duration-150',
                  role === 'member'
                    ? 'bg-indigo-500/10 border-indigo-500 text-white'
                    : 'bg-[#0f0f13] border-white/10 text-gray-400 hover:border-white/20'
                )}
              >
                <BookOpen className={clsx('w-4 h-4', role === 'member' ? 'text-indigo-400' : 'text-gray-500')} />
                <div>
                  <p className="text-xs font-semibold">Student</p>
                  <p className="text-[10px] text-gray-500">Instant Access</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('tutor')}
                className={clsx(
                  'flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all duration-150',
                  role === 'tutor'
                    ? 'bg-purple-500/10 border-purple-500 text-white'
                    : 'bg-[#0f0f13] border-white/10 text-gray-400 hover:border-white/20'
                )}
              >
                <GraduationCap className={clsx('w-4 h-4', role === 'tutor' ? 'text-purple-400' : 'text-gray-500')} />
                <div>
                  <p className="text-xs font-semibold">Tutor</p>
                  <p className="text-[10px] text-gray-500">Requires Head Approval</p>
                </div>
              </button>
            </div>

            {role === 'tutor' && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Tutor applications require approval from the Head Admin before you can create courses and upload content.
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              placeholder="Arjun Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              autoComplete="name"
            />
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
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {role === 'tutor' ? 'Apply for Tutor Account' : 'Create Student Account'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
