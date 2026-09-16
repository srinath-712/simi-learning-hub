'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Users, Check, X, Clock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { isDemoMode, MOCK_MEMBERS, MOCK_PENDING_TUTOR } from '@/lib/mockData'
import type { Profile, PaymentStatus, UserRole, ApprovalStatus } from '@/types'
import { clsx } from 'clsx'

const PAYMENT_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending', label: 'Pending' },
]

export default function MemberManagerPage() {
  const { isHead } = useAuth()
  const { toast } = useToast()
  const demo = isDemoMode()

  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')

  const loadData = useCallback(async () => {
    if (demo) {
      setAllProfiles([MOCK_PENDING_TUTOR, ...MOCK_MEMBERS])
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('*, plan:plans(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllProfiles((data || []) as Profile[])
    } catch (err) {
      console.error('[members] Load error:', err)
      toast.error('Failed to load user directory.')
    } finally {
      setLoading(false)
    }
  }, [demo, toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  // Approve Tutor Application
  const handleApproveTutor = async (profile: Profile) => {
    if (demo) {
      setAllProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, approval_status: 'approved' } : p))
      toast.success(`Approved ${profile.name || profile.email} as Tutor!`)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', profile.id)

      if (error) throw error
      setAllProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, approval_status: 'approved' } : p))
      toast.success(`Approved ${profile.name || profile.email} as Tutor!`)
    } catch {
      toast.error('Failed to approve tutor.')
    }
  }

  // Reject Tutor Application
  const handleRejectTutor = async (profile: Profile) => {
    if (demo) {
      setAllProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, approval_status: 'rejected' } : p))
      toast.success(`Rejected ${profile.name || profile.email}'s tutor application.`)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'rejected' })
        .eq('id', profile.id)

      if (error) throw error
      setAllProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, approval_status: 'rejected' } : p))
      toast.success(`Rejected ${profile.name || profile.email}'s tutor application.`)
    } catch {
      toast.error('Failed to reject application.')
    }
  }

  // Change user role
  const handleRoleChange = async (profile: Profile, newRole: UserRole) => {
    const newApprovalStatus: ApprovalStatus = newRole === 'tutor' ? 'approved' : 'approved'

    if (demo) {
      setAllProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole, approval_status: newApprovalStatus } : p))
      toast.success(`Updated ${profile.name || profile.email}'s role to ${newRole.toUpperCase()}`)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, approval_status: newApprovalStatus })
        .eq('id', profile.id)

      if (error) throw error
      setAllProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole, approval_status: newApprovalStatus } : p))
      toast.success(`Updated ${profile.name || profile.email}'s role to ${newRole.toUpperCase()}`)
    } catch {
      toast.error('Failed to update user role.')
    }
  }

  const handlePaymentStatusChange = async (member: Profile, newStatus: PaymentStatus) => {
    if (demo) {
      setAllProfiles(prev => prev.map(m => m.id === member.id ? { ...m, payment_status: newStatus } : m))
      toast.success(`${member.name}'s payment status updated to ${newStatus}`)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.from('profiles').update({ payment_status: newStatus }).eq('id', member.id)
      if (error) throw error
      setAllProfiles(prev => prev.map(m => m.id === member.id ? { ...m, payment_status: newStatus } : m))
      toast.success(`${member.name}'s payment status updated to ${newStatus}`)
    } catch {
      toast.error('Failed to update payment status.')
    }
  }

  const pendingTutors = allProfiles.filter(p => p.role === 'tutor' && p.approval_status === 'pending')

  const membersList = allProfiles.filter(p => p.approval_status !== 'pending' || !isHead)

  const filtered = membersList.filter((m) => {
    if (search) {
      const q = search.toLowerCase()
      if (!m.name?.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false
    }
    if (paymentFilter !== 'all' && m.payment_status !== paymentFilter) return false
    return true
  })

  const getInitials = (name: string | null) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-96 bg-[#1a1a24] rounded-xl border border-white/[0.06] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Members & Roles</h1>
          <p className="text-sm text-gray-500 mt-1">{allProfiles.length} registered users</p>
        </div>
      </div>

      {/* Pending Tutor Applications Section (For Head Admin) */}
      {pendingTutors.length > 0 && (
        <div className="bg-[#1a1a24] rounded-xl border border-amber-500/30 overflow-hidden shadow-lg shadow-amber-500/5">
          <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Pending Tutor Applications</h2>
              <Badge variant="warning">{pendingTutors.length} pending</Badge>
            </div>
            <p className="text-xs text-amber-300 hidden sm:block">Head approval required before tutors can publish content</p>
          </div>

          <div className="divide-y divide-white/5">
            {pendingTutors.map((tutor) => (
              <div key={tutor.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {getInitials(tutor.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{tutor.name || 'Unnamed Tutor'}</p>
                    <p className="text-xs text-gray-400">{tutor.email}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Applied on: {new Date(tutor.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={() => handleApproveTutor(tutor)}
                    icon={<Check className="w-4 h-4" />}
                  >
                    Approve Tutor
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/10"
                    onClick={() => handleRejectTutor(tutor)}
                    icon={<X className="w-4 h-4" />}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex bg-[#1a1a24] rounded-lg border border-white/[0.06] p-0.5">
          {PAYMENT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setPaymentFilter(f.value)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
                paymentFilter === f.value
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {allProfiles.length === 0 ? 'No members registered yet' : 'No members match your filters'}
          </p>
        </div>
      ) : (
        <div className="bg-[#1a1a24] rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-600 border-b border-white/5">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium hidden sm:table-cell">Plan</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{member.name || 'Unnamed'}</p>
                          <p className="text-xs text-gray-600">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isHead ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member, e.target.value as UserRole)}
                          className={clsx(
                            'text-xs font-semibold rounded-full px-3 py-1 border cursor-pointer transition-all bg-transparent appearance-none',
                            member.role === 'head' && 'text-purple-400 border-purple-500/30',
                            member.role === 'tutor' && 'text-indigo-400 border-indigo-500/30',
                            member.role === 'member' && 'text-gray-400 border-white/10'
                          )}
                        >
                          <option value="member" className="bg-[#1a1a24]">Member</option>
                          <option value="tutor" className="bg-[#1a1a24]">Tutor</option>
                          <option value="head" className="bg-[#1a1a24]">Head Admin</option>
                        </select>
                      ) : (
                        <Badge variant={member.role === 'head' ? 'purple' : member.role === 'tutor' ? 'info' : 'default'}>
                          {member.role.toUpperCase()}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <Badge variant="info">
                        {member.plan?.name || 'Free'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.payment_status}
                        onChange={(e) => handlePaymentStatusChange(member, e.target.value as PaymentStatus)}
                        className={clsx(
                          'text-xs font-medium rounded-full px-3 py-1 border cursor-pointer transition-all',
                          'bg-transparent appearance-none',
                          member.payment_status === 'paid' && 'text-emerald-400 border-emerald-500/20',
                          member.payment_status === 'unpaid' && 'text-red-400 border-red-500/20',
                          member.payment_status === 'pending' && 'text-amber-400 border-amber-500/20',
                        )}
                      >
                        <option value="paid" className="bg-[#1a1a24]">Paid</option>
                        <option value="unpaid" className="bg-[#1a1a24]">Unpaid</option>
                        <option value="pending" className="bg-[#1a1a24]">Pending</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-600">
                        {new Date(member.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
