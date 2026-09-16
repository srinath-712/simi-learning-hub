'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Palette, Trash2, Edit3, BookOpen, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { isDemoMode, MOCK_SUBJECTS, MOCK_CONTENT } from '@/lib/mockData'
import type { Subject } from '@/types'
import { clsx } from 'clsx'

const COLOR_PRESETS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

import { useAuth } from '@/context/AuthContext'
import { Clock } from 'lucide-react'

export default function SubjectManagerPage() {
  const { profile, canManageContent } = useAuth()
  const { toast } = useToast()
  const demo = isDemoMode()

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Subject | null>(null)

  const isPendingTutor = profile?.role === 'tutor' && profile?.approval_status === 'pending'

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [colorTheme, setColorTheme] = useState(COLOR_PRESETS[0])

  const loadData = useCallback(async () => {
    if (demo) {
      setSubjects(MOCK_SUBJECTS)
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data, error } = await supabase.from('subjects').select('*').order('order_index')
      if (error) throw error
      setSubjects((data || []) as Subject[])
    } catch (err) {
      console.error('[subjects] Load error:', err)
      toast.error('Failed to load subjects.')
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

  const resetForm = () => {
    setName('')
    setDescription('')
    setColorTheme(COLOR_PRESETS[0])
    setEditingSubject(null)
  }

  const openCreateForm = () => {
    if (!canManageContent) {
      toast.error('Your tutor account is pending Head approval.')
      return
    }
    resetForm()
    setFormOpen(true)
  }

  const openEditForm = (subject: Subject) => {
    if (!canManageContent) {
      toast.error('Your tutor account is pending Head approval.')
      return
    }
    setEditingSubject(subject)
    setName(subject.name)
    setDescription(subject.description || '')
    setColorTheme(subject.color_theme)
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!canManageContent) {
      toast.error('Your tutor account is pending Head approval.')
      return
    }

    if (!name.trim()) {
      toast.error('Subject name is required.')
      return
    }

    const slug = slugify(name)

    if (demo) {
      if (editingSubject) {
        setSubjects(prev => prev.map(s => s.id === editingSubject.id ? {
          ...s,
          name: name.trim(),
          slug,
          description: description.trim() || null,
          color_theme: colorTheme,
        } : s))
        toast.success(`"${name}" updated!`)
      } else {
        const newSubject: Subject = {
          id: `subj-${Date.now()}`,
          name: name.trim(),
          slug,
          description: description.trim() || null,
          color_theme: colorTheme,
          order_index: subjects.length,
          created_by: 'tutor-001',
          created_at: new Date().toISOString(),
          content_count: 0,
          content_breakdown: { notes: 0, video: 0, youtube: 0, instagram: 0 },
        }
        setSubjects(prev => [...prev, newSubject])
        toast.success(`"${name}" created!`)
      }
      setFormOpen(false)
      resetForm()
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      if (editingSubject) {
        const { error } = await supabase.from('subjects').update({
          name: name.trim(),
          slug,
          description: description.trim() || null,
          color_theme: colorTheme,
        }).eq('id', editingSubject.id)
        if (error) throw error
        toast.success(`"${name}" updated!`)
      } else {
        const { error } = await supabase.from('subjects').insert({
          name: name.trim(),
          slug,
          description: description.trim() || null,
          color_theme: colorTheme,
          order_index: subjects.length,
        })
        if (error) throw error
        toast.success(`"${name}" created!`)
      }

      setFormOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      console.error('[subjects] Save error:', err)
      toast.error('Failed to save subject.')
    }
  }

  const handleDelete = async (subject: Subject) => {
    if (!canManageContent) {
      toast.error('Your tutor account is pending Head approval.')
      return
    }

    if (demo) {
      setSubjects(prev => prev.filter(s => s.id !== subject.id))
      setDeleteConfirm(null)
      toast.success(`"${subject.name}" deleted.`)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.from('subjects').delete().eq('id', subject.id)
      if (error) throw error
      setSubjects(prev => prev.filter(s => s.id !== subject.id))
      setDeleteConfirm(null)
      toast.success(`"${subject.name}" deleted.`)
    } catch {
      toast.error('Failed to delete subject.')
    }
  }

  // Get content count per subject
  const getContentCount = (subjectId: string): number => {
    if (demo) return MOCK_CONTENT.filter(c => c.subject_id === subjectId).length
    return 0
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 bg-[#1a1a24] rounded-xl border border-white/[0.06] animate-pulse" />
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Subjects (Courses)</h1>
          <p className="text-sm text-gray-500 mt-1">{subjects.length} subjects</p>
        </div>
        {canManageContent && (
          <Button onClick={openCreateForm} icon={<Plus className="w-4 h-4" />}>
            New Subject
          </Button>
        )}
      </div>

      {/* Pending Approval Notice Banner */}
      {isPendingTutor && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200 text-xs sm:text-sm flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Your tutor account is pending Head approval before you can create or manage subjects.</span>
        </div>
      )}

      {/* Subject grid */}
      {subjects.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No subjects created yet</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={openCreateForm} icon={<Plus className="w-3.5 h-3.5" />}>
            Create your first subject
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const count = getContentCount(subject.id)
            return (
              <div
                key={subject.id}
                className="bg-[#1a1a24] rounded-xl border border-white/[0.06] p-5 hover:border-white/15 transition-all duration-150 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${subject.color_theme}20` }}
                    >
                      <BookOpen className="w-5 h-5" style={{ color: subject.color_theme }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{subject.name}</h3>
                      <p className="text-xs text-gray-600 font-mono">/{subject.slug}</p>
                    </div>
                  </div>
                  <GripVertical className="w-4 h-4 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                </div>

                {subject.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{subject.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color_theme }}
                    />
                    <span className="text-xs text-gray-500">{count} items</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditForm(subject)}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(subject)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); resetForm() }}
        title={editingSubject ? 'Edit Subject' : 'New Subject'}
        size="sm"
      >
        <div className="space-y-5">
          <Input
            label="Subject name"
            placeholder="e.g. Advanced Mathematics"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {name && (
            <p className="text-xs text-gray-600 font-mono -mt-3">
              Slug: /{slugify(name)}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Description <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this subject..."
              rows={2}
              className="w-full rounded-lg bg-[#1a1a24] border border-white/10 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Palette className="w-3.5 h-3.5 inline-block mr-1.5" />
              Colour theme
            </label>
            <div className="flex gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => setColorTheme(color)}
                  className={clsx(
                    'w-8 h-8 rounded-full transition-all duration-150 border-2',
                    colorTheme === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setFormOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Subject"
          size="sm"
        >
          <p className="text-sm text-gray-300 mb-1">
            Are you sure you want to delete <strong className="text-white">&quot;{deleteConfirm.name}&quot;</strong>?
          </p>
          <p className="text-xs text-amber-400 mb-4">
            All content within this subject will also be permanently deleted.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Delete Subject</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
