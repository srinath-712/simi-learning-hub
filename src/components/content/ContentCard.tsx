'use client'

import { FileText, Video, Youtube, Instagram, Pin, Download, Play, ExternalLink } from 'lucide-react'
import { Badge, getContentBadgeVariant } from '@/components/ui/Badge'
import type { ContentItem, ContentType } from '@/types'
import { formatFileSize } from '@/lib/supabase/storage'
import { clsx } from 'clsx'

interface ContentCardProps {
  content: ContentItem
  onView: (content: ContentItem) => void
  /** Tutor-only actions */
  onEdit?: (content: ContentItem) => void
  onDelete?: (content: ContentItem) => void
  onTogglePublish?: (content: ContentItem) => void
  onTogglePin?: (content: ContentItem) => void
  isTutor?: boolean
}

const typeIcons: Record<ContentType, typeof FileText> = {
  notes: FileText,
  video: Video,
  youtube: Youtube,
  instagram: Instagram,
}

const typeLabels: Record<ContentType, string> = {
  notes: 'Notes',
  video: 'Video',
  youtube: 'YouTube',
  instagram: 'Instagram',
}

export function ContentCard({
  content,
  onView,
  onEdit,
  onDelete,
  onTogglePublish,
  onTogglePin,
  isTutor = false,
}: ContentCardProps) {
  const Icon = typeIcons[content.type]

  const actionLabel = (() => {
    switch (content.type) {
      case 'notes': return 'Download'
      case 'video': return 'Play'
      case 'youtube': return 'Watch'
      case 'instagram': return 'Open'
    }
  })()

  const ActionIcon = (() => {
    switch (content.type) {
      case 'notes': return Download
      case 'video': return Play
      case 'youtube': return Play
      case 'instagram': return ExternalLink
    }
  })()

  return (
    <div
      className={clsx(
        'group relative bg-[#1a1a24] rounded-xl border transition-all duration-150 hover:border-white/15 hover:shadow-lg',
        content.is_pinned
          ? 'border-l-2 border-l-amber-500 border-t-white/[0.06] border-r-white/[0.06] border-b-white/[0.06]'
          : 'border-white/[0.06]',
        !content.is_published && isTutor && 'opacity-70'
      )}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={clsx(
              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
              content.type === 'notes' && 'bg-blue-500/15',
              content.type === 'video' && 'bg-purple-500/15',
              content.type === 'youtube' && 'bg-red-500/15',
              content.type === 'instagram' && 'bg-pink-500/15',
            )}>
              <Icon className={clsx(
                'w-4.5 h-4.5',
                content.type === 'notes' && 'text-blue-400',
                content.type === 'video' && 'text-purple-400',
                content.type === 'youtube' && 'text-red-400',
                content.type === 'instagram' && 'text-pink-400',
              )} />
            </div>
            <Badge variant={getContentBadgeVariant(content.type)}>
              {typeLabels[content.type]}
            </Badge>
            {content.is_pinned && (
              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            )}
          </div>

          {isTutor && !content.is_published && (
            <Badge variant="warning">Draft</Badge>
          )}
        </div>

        {/* Title and description */}
        <h3 className="text-sm font-semibold text-white mb-1.5 line-clamp-2">
          {content.title}
        </h3>
        {content.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {content.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-4">
          {content.file_size && (
            <span className="font-mono">{formatFileSize(content.file_size)}</span>
          )}
          <span>{new Date(content.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(content)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
              content.type === 'notes' && 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
              content.type === 'video' && 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
              content.type === 'youtube' && 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
              content.type === 'instagram' && 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/20',
            )}
          >
            <ActionIcon className="w-3.5 h-3.5" />
            {actionLabel}
          </button>

          {isTutor && (
            <div className="flex items-center gap-1 ml-auto">
              {onTogglePin && (
                <button
                  onClick={() => onTogglePin(content)}
                  className={clsx(
                    'p-1.5 rounded-lg text-xs transition-all duration-150',
                    content.is_pinned
                      ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10'
                  )}
                  title={content.is_pinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              )}
              {onTogglePublish && (
                <button
                  onClick={() => onTogglePublish(content)}
                  className={clsx(
                    'px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150',
                    content.is_published
                      ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                      : 'text-gray-500 bg-white/5 hover:bg-white/10'
                  )}
                >
                  {content.is_published ? 'Published' : 'Draft'}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(content)}
                  className="px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-150"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(content)}
                  className="px-2 py-1 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
