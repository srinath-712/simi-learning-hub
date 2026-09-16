'use client'

import { useState } from 'react'
import { Mail, Calendar, Shield, CreditCard, Lock, Save } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge, getPaymentBadgeVariant } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { isDemoMode } from '@/lib/mockData'

export default function AccountPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const demo = isDemoMode()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.')
      return
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    if (demo) {
      toast.success('Password updated successfully! (Demo mode)')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      return
    }

    setPasswordLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Failed to update password. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and password</p>
      </div>

      {/* Profile card */}
      <div className="bg-[#1a1a24] rounded-xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{profile?.name || 'User'}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg">
            <Mail className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-600">Email</p>
              <p className="text-sm text-gray-300">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg">
            <Shield className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-600">Plan</p>
              <Badge variant="info">{profile?.plan?.name || 'Free'}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-600">Payment status</p>
              <Badge variant={getPaymentBadgeVariant(profile?.payment_status || 'paid')} dot>
                {profile?.payment_status ? profile.payment_status.charAt(0).toUpperCase() + profile.payment_status.slice(1) : 'Paid'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-600">Member since</p>
              <p className="text-sm text-gray-300">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-[#1a1a24] rounded-xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-white">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <div className="pt-2">
            <Button type="submit" loading={passwordLoading} icon={<Save className="w-4 h-4" />}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
