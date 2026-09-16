'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ContentCard } from '@/components/content/ContentCard'
import { ContentUploadModal, type UploadFormData } from '@/components/content/ContentUploadModal'
import { Modal } from '@/components/ui/Modal'
import { VideoPlayer } from '@/components/content/VideoPlayer'
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { isDemoMode, MOCK_CONTENT, MOCK_SUBJECTS } from '@/lib/mockData'
import { generateStoragePath, deleteContentFile } from '@/lib/supabase/storage'
import type { ContentItem, Subject } from '@/types'
import { clsx } from 'clsx'

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'notes', label: 'Notes' },
  { value: 'video', label: 'Video' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

import { Clock } from 'lucide-react'

export default function ContentManagerPage() {
  const { profile, canManageContent } = useAuth()
  const { toast } = useToast()
  const demo = isDemoMode()

  const [content, setContent] = useState<ContentItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [viewContent, setViewContent] = useState<ContentItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ContentItem | null>(null)

  const isPendingTutor = profile?.role === 'tutor' && profile?.approval_status === 'pending'

  const loadData = useCallback(async () => {
    if (demo) {
      setContent(MOCK_CONTENT)
      setSubjects(MOCK_SUBJECTS)
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const [contentRes, subjectsRes] = await Promise.all([
        supabase.from('content').select('*').order('created_at', { ascending: false }),
        supabase.from('subjects').select('*').order('order_index'),
      ])

      setContent((contentRes.data || []) as ContentItem[])
      setSubjects((subjectsRes.data || []) as Subject[])
    } catch (err) {
      console.error('[content] Load error:', err)
      toast.error('Failed to load content.')
    } finally {
      setLoading(false)
    }
  }, [demo, toast])

  useEffect(() => {
    let ignore = false
    if (!ignore) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadData()
    }
    return () => { ignore = true }
  }, [loadData])

  // Filter content
  const filtered = content.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (statusFilter === 'published' && !item.is_published) return false
    if (statusFilter === 'draft' && item.is_published) return false
    if (subjectFilter !== 'all' && item.subject_id !== subjectFilter) return false
    return true
  })

  const handleUpload = async (data: UploadFormData) => {
    if (demo) {
      const newItem: ContentItem = {
        id: `content-${Date.now()}`,
        subject_id: data.subjectId,
        type: data.type,
        title: data.title,
        description: data.description || null,
        file_url: data.file ? '#' : null,
        file_name: data.file?.name || null,
        file_path: null,
        file_size: data.file?.size || null,
        external_url: data.externalUrl || null,
        is_published: data.isPublished,
        is_pinned: false,
        uploaded_by: 'tutor-001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setContent(prev => [newItem, ...prev])
      toast.success(`"${data.title}" uploaded successfully!`)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { uploadContentFile } = await import('@/lib/supabase/storage')

      const { data: record, error: insertError } = await supabase
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

      if (insertError || !record) throw new Error(insertError?.message || 'Failed to create record.')

      if (data.file && (data.type === 'notes' || data.type === 'video')) {
        const bucket = data.type === 'notes' ? 'notes' as const : 'videos' as const
        const storagePath = generateStoragePath(data.subjectId, record.id, data.file.name)
        const result = await uploadContentFile(bucket, storagePath, data.file, () => {})

        if ('error' in result) {
          await supabase.from('content').delete().eq('id', record.id)
          throw new Error(result.error)
        }

        await supabase.from('content').update({
          file_url: result.url,
          file_name: data.file.name,
          file_path: result.path,
          file_size: data.file.size,
        }).eq('id', record.id)
      }

      toast.success(`"${data.title}" uploaded successfully!`)
      loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.'
      toast.error(message)
      throw err
    }
  }

  const handleTogglePublish = async (item: ContentItem) => {
    if (!canManageContent) {
      toast.error('Your account is pending Head approval.')
      return
    }

    if (demo) {
      setContent(prev => prev.map(c => c.id === item.id ? { ...c, is_published: !c.is_published } : c))
      toast.success(item.is_published ? 'Moved to draft' : 'Published!')
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.from('content').update({ is_published: !item.is_published }).eq('id', item.id)
      if (error) throw error
      setContent(prev => prev.map(c => c.id === item.id ? { ...c, is_published: !c.is_published } : c))
      toast.success(item.is_published ? 'Moved to draft' : 'Published!')
    } catch {
      toast.error('Failed to update content status.')
    }
  }

  const handleTogglePin = async (item: ContentItem) => {
    if (!canManageContent) {
      toast.error('Your account is pending Head approval.')
      return
    }

    if (demo) {
      setContent(prev => prev.map(c => c.id === item.id ? { ...c, is_pinned: !c.is_pinned } : c))
      toast.success(item.is_pinned ? 'Unpinned' : 'Pinned to top!')
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.from('content').update({ is_pinned: !item.is_pinned }).eq('id', item.id)
      if (error) throw error
      setContent(prev => prev.map(c => c.id === item.id ? { ...c, is_pinned: !c.is_pinned } : c))
      toast.success(item.is_pinned ? 'Unpinned' : 'Pinned to top!')
    } catch {
      toast.error('Failed to update pin status.')
    }
  }

  const handleDelete = async (item: ContentItem) => {
    if (!canManageContent) {
      toast.error('Your account is pending Head approval.')
      return
    }

    if (demo) {
      setContent(prev => prev.filter(c => c.id !== item.id))
      setDeleteConfirm(null)
      toast.success(`"${item.title}" deleted.`)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Delete storage file first if it exists
      if (item.file_path && (item.type === 'notes' || item.type === 'video')) {
        const bucket = item.type === 'notes' ? 'notes' as const : 'videos' as const
        await deleteContentFile(bucket, item.file_path)
      }

      const { error } = await supabase.from('content').delete().eq('id', item.id)
      if (error) throw error

      setContent(prev => prev.filter(c => c.id !== item.id))
      setDeleteConfirm(null)
      toast.success(`"${item.title}" deleted.`)
    } catch {
      toast.error('Failed to delete content.')
    }
  }

  const handleView = (item: ContentItem) => {
    if (item.type === 'instagram' && item.external_url) {
      window.open(item.external_url, '_blank', 'noopener,noreferrer')
      return
    }
    if (item.type === 'notes' && item.file_url) {
      window.open(item.file_url, '_blank', 'noopener,noreferrer')
      return
    }
    setViewContent(item)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-[#1a1a24] rounded-xl border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Content Library</h1>
          <p className="text-sm text-gray-500 mt-1">{content.length} total items</p>
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
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200 text-xs sm:text-sm flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Your tutor account is pending Head approval before you can upload or publish content.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Type filter tabs */}
          <div className="flex bg-[#1a1a24] rounded-lg border border-white/[0.06] p-0.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
                  typeFilter === f.value
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1a1a24] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-gray-300 appearance-none cursor-pointer"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-[#1a1a24] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-gray-300 appearance-none cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No content matches your filters</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setSubjectFilter('all') }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              isTutor
              onView={handleView}
              onTogglePublish={handleTogglePublish}
              onTogglePin={handleTogglePin}
              onDelete={(item) => setDeleteConfirm(item)}
            />
          ))}
        </div>
      )}

      {/* Upload modal */}
      <ContentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        subjects={subjects}
        onSubmit={handleUpload}
      />

      {/* View modal */}
      {viewContent && (
        <Modal
          isOpen={!!viewContent}
          onClose={() => setViewContent(null)}
          title={viewContent.title}
          size="xl"
        >
          {viewContent.type === 'video' && viewContent.file_url && (
            <VideoPlayer src={viewContent.file_url} title={viewContent.title} />
          )}
          {viewContent.type === 'youtube' && viewContent.external_url && (
            <YouTubeEmbed url={viewContent.external_url} title={viewContent.title} />
          )}
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Content"
          size="sm"
        >
          <p className="text-sm text-gray-300 mb-2">
            Are you sure you want to delete <strong className="text-white">&quot;{deleteConfirm.title}&quot;</strong>?
          </p>
          {deleteConfirm.file_path && (
            <p className="text-xs text-gray-500 mb-4">
              The associated file will also be permanently removed from storage.
            </p>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
