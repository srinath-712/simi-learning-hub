'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Video, Youtube, Instagram, ExternalLink, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { isValidYouTubeUrl, YouTubeEmbed } from '@/components/content/YouTubeEmbed'
import { formatFileSize, validateFileSize } from '@/lib/supabase/storage'
import type { Subject, ContentType, UploadProgressState } from '@/types'
import { clsx } from 'clsx'

interface ContentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
  onSubmit: (data: UploadFormData) => Promise<void>
}

export interface UploadFormData {
  type: ContentType
  title: string
  description: string
  subjectId: string
  isPublished: boolean
  file?: File
  externalUrl?: string
}

const tabs: { type: ContentType; label: string; icon: typeof FileText }[] = [
  { type: 'notes', label: 'Notes', icon: FileText },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'youtube', label: 'YouTube', icon: Youtube },
  { type: 'instagram', label: 'Instagram', icon: Instagram },
]

const NOTES_ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp'
const VIDEO_ACCEPT = '.mp4,.mov,.webm'

function isValidInstagramUrl(url: string): boolean {
  return /instagram\.com\/(p|reel)\/[a-zA-Z0-9_-]+/.test(url)
}

export function ContentUploadModal({ isOpen, onClose, subjects, onSubmit }: ContentUploadModalProps) {
  const [activeTab, setActiveTab] = useState<ContentType>('notes')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadProgressState>({
    progress: 0,
    status: 'idle',
    error: null,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setSubjectId('')
    setIsPublished(false)
    setFile(null)
    setExternalUrl('')
    setFileError(null)
    setUrlError(null)
    setUploadState({ progress: 0, status: 'idle', error: null })
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleTabChange = useCallback((type: ContentType) => {
    setActiveTab(type)
    setFile(null)
    setExternalUrl('')
    setFileError(null)
    setUrlError(null)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    const bucket = activeTab === 'notes' ? 'notes' : 'videos'
    const sizeError = validateFileSize(bucket as 'notes' | 'videos', selected.size)
    if (sizeError) {
      setFileError(sizeError)
      setFile(null)
      return
    }

    setFileError(null)
    setFile(selected)

    // Auto-fill title from filename if empty
    if (!title) {
      const nameWithoutExt = selected.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
      setTitle(nameWithoutExt)
    }
  }, [activeTab, title])

  const handleUrlChange = useCallback((url: string) => {
    setExternalUrl(url)

    if (!url) {
      setUrlError(null)
      return
    }

    if (activeTab === 'youtube') {
      setUrlError(isValidYouTubeUrl(url) ? null : 'Please enter a valid YouTube URL')
    } else if (activeTab === 'instagram') {
      setUrlError(isValidInstagramUrl(url) ? null : 'Please enter a valid Instagram post or reel URL')
    }
  }, [activeTab])

  const isFormValid = (() => {
    if (!title.trim() || !subjectId) return false
    if (activeTab === 'notes' || activeTab === 'video') {
      return !!file && !fileError
    }
    if (activeTab === 'youtube') {
      return !!externalUrl && isValidYouTubeUrl(externalUrl)
    }
    if (activeTab === 'instagram') {
      return !!externalUrl && isValidInstagramUrl(externalUrl)
    }
    return false
  })()

  const handleSubmit = async () => {
    if (!isFormValid) return

    setUploadState({ progress: 0, status: 'uploading', error: null })

    try {
      await onSubmit({
        type: activeTab,
        title: title.trim(),
        description: description.trim(),
        subjectId,
        isPublished,
        file: file || undefined,
        externalUrl: externalUrl || undefined,
      })

      setUploadState({ progress: 100, status: 'success', error: null })
      setTimeout(() => {
        handleClose()
      }, 500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setUploadState({ progress: 0, status: 'error', error: message })
    }
  }

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }))

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Content" size="lg">
      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-6 -mx-6 px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.type
          return (
            <button
              key={tab.type}
              onClick={() => handleTabChange(tab.type)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 mr-1',
                active
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-5">
        {/* File dropzone (notes & video tabs) */}
        {(activeTab === 'notes' || activeTab === 'video') && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={activeTab === 'notes' ? NOTES_ACCEPT : VIDEO_ACCEPT}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                'w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-all duration-150',
                file
                  ? 'border-indigo-500/30 bg-indigo-500/5'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02]',
                fileError && 'border-red-500/30 bg-red-500/5'
              )}
            >
              {file ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                    <Check className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">{formatFileSize(file.size)}</p>
                  </div>
                  <p className="text-xs text-indigo-400">Click to change file</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-300">
                      Click to upload {activeTab === 'notes' ? 'document' : 'video'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {activeTab === 'notes'
                        ? 'PDF, DOC, DOCX, PNG, JPG (max 50MB)'
                        : 'MP4, MOV, WEBM (max 500MB)'}
                    </p>
                  </div>
                </>
              )}
            </button>
            {fileError && (
              <p className="mt-2 text-sm text-red-400">{fileError}</p>
            )}
          </div>
        )}

        {/* URL input (youtube & instagram tabs) */}
        {(activeTab === 'youtube' || activeTab === 'instagram') && (
          <div>
            <Input
              label={activeTab === 'youtube' ? 'YouTube URL' : 'Instagram URL'}
              placeholder={
                activeTab === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://www.instagram.com/reel/...'
              }
              value={externalUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              error={urlError || undefined}
            />

            {/* YouTube preview */}
            {activeTab === 'youtube' && externalUrl && isValidYouTubeUrl(externalUrl) && (
              <div className="mt-4">
                <YouTubeEmbed url={externalUrl} />
              </div>
            )}

            {/* Instagram preview card */}
            {activeTab === 'instagram' && externalUrl && isValidInstagramUrl(externalUrl) && (
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 flex items-center justify-center shrink-0">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{externalUrl}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-3 h-3" />
                    Opens in Instagram
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Common fields */}
        <Input
          label="Title"
          placeholder="Enter content title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Description <span className="text-gray-600">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a brief description..."
            rows={3}
            className="w-full rounded-lg bg-[#1a1a24] border border-white/10 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150 resize-none"
          />
        </div>

        <Select
          label="Subject"
          placeholder="Select a subject"
          options={subjectOptions}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        />

        {/* Publish toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-200">Publish immediately</p>
            <p className="text-xs text-gray-500">If off, content is saved as a draft</p>
          </div>
          <button
            onClick={() => setIsPublished(!isPublished)}
            className={clsx(
              'relative w-11 h-6 rounded-full transition-colors duration-150',
              isPublished ? 'bg-indigo-500' : 'bg-white/10'
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-150',
                isPublished ? 'translate-x-[22px]' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Upload progress */}
        {uploadState.status === 'uploading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Uploading...</span>
              <span>{uploadState.progress}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>
        )}

        {uploadState.error && (
          <p className="text-sm text-red-400">{uploadState.error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={uploadState.status === 'uploading'}
            disabled={!isFormValid}
            icon={<Upload className="w-4 h-4" />}
          >
            {activeTab === 'notes' || activeTab === 'video' ? 'Upload' : 'Add'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
