'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, BookOpen, FileText, Video, Youtube, Instagram, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { isDemoMode, MOCK_SUBJECTS } from '@/lib/mockData'
import type { Subject } from '@/types'

function LearnContent() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const demo = isDemoMode()

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Show unauthorized alert if redirected from dashboard
  useEffect(() => {
    if (searchParams.get('alert') === 'unauthorized') {
      toast.warning('You don\'t have access to the tutor dashboard.')
    }
  }, [searchParams, toast])

  useEffect(() => {
    let isMounted = true

    async function fetchSubjects() {
      if (demo) {
        if (isMounted) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSubjects(MOCK_SUBJECTS)
          setLoading(false)
        }
        return
      }

      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .order('order_index')

        if (subjectsError) throw subjectsError

        // Fetch content counts per subject
        const { data: contentData } = await supabase
          .from('content')
          .select('subject_id, type')
          .eq('is_published', true)

        const subjectsWithCounts = (subjectsData || []).map((subject) => {
          const subjectContent = (contentData || []).filter(c => c.subject_id === subject.id)
          return {
            ...subject,
            content_count: subjectContent.length,
            content_breakdown: {
              notes: subjectContent.filter(c => c.type === 'notes').length,
              video: subjectContent.filter(c => c.type === 'video').length,
              youtube: subjectContent.filter(c => c.type === 'youtube').length,
              instagram: subjectContent.filter(c => c.type === 'instagram').length,
            },
          } as Subject
        })

        if (isMounted) setSubjects(subjectsWithCounts)
      } catch (err) {
        console.error('[learn] Load error:', err)
        toast.error('Failed to load subjects.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSubjects()
    return () => { isMounted = false }
  }, [demo, toast])

  const filtered = subjects.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-10 w-full max-w-md bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-52 bg-[#1a1a24] rounded-xl border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome back, {profile?.name?.split(' ')[0] || 'Student'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Browse subjects and start learning</p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search subjects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Subject cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {subjects.length === 0 ? 'No subjects available yet. Check back soon!' : 'No subjects match your search'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((subject) => {
            const breakdown = subject.content_breakdown
            const total = subject.content_count || 0

            return (
              <Link
                key={subject.id}
                href={`/learn/${subject.slug}`}
                className="group bg-[#1a1a24] rounded-xl border border-white/[0.06] p-6 hover:border-white/15 hover:shadow-xl transition-all duration-200"
              >
                {/* Subject icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${subject.color_theme}20` }}
                >
                  <BookOpen className="w-6 h-6" style={{ color: subject.color_theme }} />
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                  {subject.name}
                </h2>

                {/* Description */}
                {subject.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{subject.description}</p>
                )}

                {/* Content breakdown */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">
                    {total} {total === 1 ? 'Lesson' : 'Lessons'}
                  </p>
                  {breakdown && total > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {breakdown.notes > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                          <FileText className="w-3 h-3" /> {breakdown.notes} Notes
                        </span>
                      )}
                      {breakdown.video > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-400">
                          <Video className="w-3 h-3" /> {breakdown.video} Videos
                        </span>
                      )}
                      {breakdown.youtube > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <Youtube className="w-3 h-3" /> {breakdown.youtube} YouTube
                        </span>
                      )}
                      {breakdown.instagram > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-pink-400">
                          <Instagram className="w-3 h-3" /> {breakdown.instagram} Instagram
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="flex items-center text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  Start learning
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LearnPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-10 w-full max-w-md bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-52 bg-[#1a1a24] rounded-xl border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <LearnContent />
    </Suspense>
  )
}
