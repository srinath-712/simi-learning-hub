'use client'

import { useMemo } from 'react'
import { AlertCircle, Youtube } from 'lucide-react'

interface YouTubeEmbedProps {
  url: string
  title?: string
}

/**
 * Extracts YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

/** Validate if a string is a plausible YouTube URL */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null
}

export function YouTubeEmbed({ url, title }: YouTubeEmbedProps) {
  const videoId = useMemo(() => extractYouTubeId(url), [url])

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-[#0f0f13] rounded-xl flex flex-col items-center justify-center gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-gray-400">Invalid YouTube URL</p>
        <p className="text-xs text-gray-600 font-mono max-w-xs truncate">{url}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <Youtube className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
      )}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title || 'YouTube Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  )
}
