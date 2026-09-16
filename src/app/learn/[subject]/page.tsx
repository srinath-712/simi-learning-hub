'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Search, ArrowLeft, BookOpen, Pin, Filter } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { ContentCard } from '@/components/content/ContentCard'
import { VideoPlayer } from '@/components/content/VideoPlayer'
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { isDemoMode, getMockContentBySubject, getMockSubjectBySlug } from '@/lib/mockData'
import type { ContentItem, Subject } from '@/types'
import { clsx } from 'clsx'

const TYPE_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'notes', label: 'Notes' },
  { value: 'video', label: 'Video' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
]

export default function SubjectClassroomPage() {
  const params = useParams()
  const slug = params.subject as string
  const { toast } = useToast()
  const demo = isDemoMode()

  const [subject, setSubject] = useState<Subject | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewContent, setViewContent] = useState<ContentItem | null>(null)

  const loadData = useCallback(async () => {
    if (demo) {
      const s = getMockSubjectBySlug(slug)
      const c = getMockContentBySubject(slug)
      setSubject(s || null)
      setContent(c)
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('slug', slug)
        .single()

      if (subjectError || !subjectData) {
        toast.error('Subject not found.')
        setLoading(false)
        return
      }

      setSubject(subjectData as Subject)

      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .select('*')
        .eq('subject_id', subjectData.id)
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (contentError) throw contentError
      setContent((contentData || []) as ContentItem[])
    } catch (err) {
      console.error('[classroom] Load error:', err)
      toast.error('Failed to load content.')
    } finally {
      setLoading(false)
    }
  }, [demo, slug, toast])

  useEffect(() => {
    let ignore = false
    if (!ignore) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadData()
    }
    return () => { ignore = true }
  }, [loadData])

  const filtered = content.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    return true
  })

  const pinnedItems = filtered.filter(c => c.is_pinned)
  const unpinnedItems = filtered.filter(c => !c.is_pinned)

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-6 w-32 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-[#1a1a24] rounded-xl border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <h1 className="text-xl font-semibold text-white mb-2">Subject Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">The subject you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to subjects
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Subjects
      </Link>

      {/* Subject header */}
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${subject.color_theme}20` }}
        >
          <BookOpen className="w-7 h-7" style={{ color: subject.color_theme }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{subject.name}</h1>
          {subject.description && (
            <p className="text-sm text-gray-500 mt-1">{subject.description}</p>
          )}
          <p className="text-xs text-gray-600 mt-2">{content.length} {content.length === 1 ? 'lesson' : 'lessons'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex bg-[#1a1a24] rounded-lg border border-white/[0.06] p-0.5">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
                typeFilter === tab.value
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned section */}
      {pinnedItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-sm font-medium text-amber-400">Pinned</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {pinnedItems.map((item) => (
              <ContentCard key={item.id} content={item} onView={handleView} />
            ))}
          </div>
        </div>
      )}

      {/* Content grid */}
      {unpinnedItems.length === 0 && pinnedItems.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {content.length === 0 ? 'No content available yet for this subject' : 'No lessons match your filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unpinnedItems.map((item) => (
            <ContentCard key={item.id} content={item} onView={handleView} />
          ))}
        </div>
      )}

      {/* View modal */}
      {viewContent && (
        <Modal
          isOpen={!!viewContent}
          onClose={() => setViewContent(null)}
          title={viewContent.title}
          size="xl"
        >
          {viewContent.description && (
            <p className="text-sm text-gray-400 mb-4">{viewContent.description}</p>
          )}
          {viewContent.type === 'video' && viewContent.file_url && (
            <VideoPlayer src={viewContent.file_url} title={viewContent.title} />
          )}
          {viewContent.type === 'youtube' && viewContent.external_url && (
            <YouTubeEmbed url={viewContent.external_url} title={viewContent.title} />
          )}
        </Modal>
      )}
    </div>
  )
}
