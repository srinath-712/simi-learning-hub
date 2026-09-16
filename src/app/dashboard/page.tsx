'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, BookOpen, FileText, HardDrive, Plus, Upload, Clock } from 'lucide-react'
import { Badge, getContentBadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ContentUploadModal, type UploadFormData } from '@/components/content/ContentUploadModal'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { isDemoMode, MOCK_DASHBOARD_STATS, MOCK_CONTENT, MOCK_SUBJECTS } from '@/lib/mockData'
import { formatFileSize, generateStoragePath } from '@/lib/supabase/storage'
import type { DashboardStats, ContentItem, Subject } from '@/types'

export default function DashboardOverviewPage() {
  const { profile, canManageContent, isHead } = useAuth()
  const { toast } = useToast()
  const demo = isDemoMode()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentContent, setRecentContent] = useState<ContentItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const isPendingTutor = profile?.role === 'tutor' && profile?.approval_status === 'pending'

  const loadData = useCallback(async () => {
    if (demo) {
      setStats(MOCK_DASHBOARD_STATS)
      setRecentContent(MOCK_CONTENT.slice(0, 5))
      setSubjects(MOCK_SUBJECTS)
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Fetch stats in parallel
      const [membersRes, subjectsRes, contentRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'member'),
        supabase.from('subjects').select('*').order('order_index'),
        supabase.from('content').select('*').order('created_at', { ascending: false }),
      ])

      const allContent = (contentRes.data || []) as ContentItem[]
      const allSubjects = (subjectsRes.data || []) as Subject[]

      setStats({
        total_members: membersRes.count || 0,
        active_subjects: allSubjects.length,
        total_lessons: allContent.filter(c => c.is_published).length,
        storage_used_bytes: allContent.reduce((sum, c) => sum + (c.file_size || 0), 0),
      })

      setRecentContent(allContent.slice(0, 5))
      setSubjects(allSubjects)
    } catch (err) {
      console.error('[dashboard] Load error:', err)
      toast.error('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [demo, toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const handleUpload = async (data: UploadFormData) => {
    if (!canManageContent) {
      toast.error('Your account is pending Head approval.')
      return
    }

    if (demo) {
      toast.success(`[Demo] "${data.title}" uploaded successfully!`)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { uploadContentFile } = await import('@/lib/supabase/storage')

      let fileUrl: string | null = null
      let fileName: string | null = null
      let filePath: string | null = null
      let fileSize: number | null = null

      // Create content record first to get ID for storage path
      const { data: contentRecord, error: insertError } = await supabase
        .from('content')
        .insert({
          subject_id: data.subjectId,
          type: data.type,
          title: data.title,
          description: data.description || null,
          external_url: data.externalUrl || null,
          is_published: data.isPublished,
          uploaded_by: profile?.id,
        })
        .select()
        .single()

      if (insertError || !contentRecord) {
        throw new Error(insertError?.message || 'Failed to create content record.')
      }

      // Upload file if present
      if (data.file && (data.type === 'notes' || data.type === 'video')) {
        const bucket = data.type === 'notes' ? 'notes' as const : 'videos' as const
        const storagePath = generateStoragePath(data.subjectId, contentRecord.id, data.file.name)

        const result = await uploadContentFile(bucket, storagePath, data.file, () => {})

        if ('error' in result) {
          // Rollback the content record
          await supabase.from('content').delete().eq('id', contentRecord.id)
          throw new Error(result.error)
        }

        fileUrl = result.url
        fileName = data.file.name
        filePath = result.path
        fileSize = data.file.size

        // Update content record with file info
        await supabase.from('content').update({
          file_url: fileUrl,
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize,
        }).eq('id', contentRecord.id)
      }

      toast.success(`"${data.title}" uploaded successfully!`)
      loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.'
      toast.error(message)
      throw err
    }
  }

  // Skeleton loader
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#1a1a24] rounded-xl border border-white/[0.06] animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-[#1a1a24] rounded-xl border border-white/[0.06] animate-pulse" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Members', value: stats?.total_members ?? 0, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Active Subjects', value: stats?.active_subjects ?? 0, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Lessons', value: stats?.total_lessons ?? 0, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Storage Used', value: formatFileSize(stats?.storage_used_bytes ?? 0), icon: HardDrive, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            {isHead && <Badge variant="purple">Head Admin</Badge>}
          </div>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {profile?.name || 'Tutor'}</p>
        </div>
        {canManageContent ? (
          <Button onClick={() => setUploadModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Upload
          </Button>
        ) : (
          <Badge variant="warning" className="py-2 px-3">
            <Clock className="w-3.5 h-3.5 mr-1.5 inline" /> Awaiting Head Approval
          </Badge>
        )}
      </div>

      {/* Pending Approval Notice Banner */}
      {isPendingTutor && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-400 text-base">
            <Clock className="w-5 h-5 shrink-0" />
            <span>Tutor Account Pending Head Approval</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Your registration as a Tutor is currently under review by the Head Administrator. Once approved, you will have full permissions to create new courses (subjects) and upload videos, PDFs, and learning materials.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-[#1a1a24] rounded-xl border border-white/[0.06] p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Recent uploads */}
      <div className="bg-[#1a1a24] rounded-xl border border-white/[0.06]">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Recent Uploads</h2>
          {canManageContent && (
            <Button variant="ghost" size="sm" onClick={() => setUploadModalOpen(true)} icon={<Upload className="w-3.5 h-3.5" />}>
              Quick upload
            </Button>
          )}
        </div>

        {recentContent.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No content uploaded yet</p>
            {canManageContent && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setUploadModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Upload your first content
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-600 border-b border-white/5">
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium hidden sm:table-cell">Subject</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Status</th>
                  <th className="px-6 py-3 font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentContent.map((item) => {
                  const subject = subjects.find(s => s.id === item.subject_id)
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-gray-200 truncate max-w-[200px]">{item.title}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant={getContentBadgeVariant(item.type)}>
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-gray-500">{subject?.name || '—'}</span>
                      </td>
                      <td className="px-6 py-3.5 hidden md:table-cell">
                        <Badge variant={item.is_published ? 'success' : 'warning'} dot>
                          {item.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-gray-600">
                          {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload modal */}
      {canManageContent && (
        <ContentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          subjects={subjects}
          onSubmit={handleUpload}
        />
      )}
    </div>
  )
}
