import { createClient } from './client'

const MAX_NOTES_SIZE = 50 * 1024 * 1024   // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024  // 500MB

/**
 * Generate a deterministic, bucket-relative storage path.
 * Format: {subjectId}/{contentId}/{sanitized_filename}
 */
export function generateStoragePath(
  subjectId: string,
  contentId: string,
  fileName: string
): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${subjectId}/${contentId}/${sanitized}`
}

/**
 * Validate file size before initiating upload.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateFileSize(
  bucket: 'notes' | 'videos',
  fileSize: number
): string | null {
  const limit = bucket === 'notes' ? MAX_NOTES_SIZE : MAX_VIDEO_SIZE
  const limitLabel = bucket === 'notes' ? '50MB' : '500MB'

  if (fileSize > limit) {
    return `File exceeds the ${limitLabel} size limit. Please choose a smaller file.`
  }
  return null
}

/**
 * Upload a file to Supabase Storage with progress tracking.
 * Validates size before uploading; returns either the public URL + path or an error.
 */
export async function uploadContentFile(
  bucket: 'notes' | 'videos',
  path: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<{ url: string; path: string } | { error: string }> {
  const sizeError = validateFileSize(bucket, file.size)
  if (sizeError) return { error: sizeError }

  try {
    const supabase = createClient()

    // Start progress indication
    onProgress(10)

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error(`[storage/upload] ${bucket}/${path}`, uploadError)
      return { error: `Upload failed: ${uploadError.message}` }
    }

    onProgress(90)

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

    onProgress(100)

    return { url: urlData.publicUrl, path }
  } catch (err) {
    console.error(`[storage/upload] unexpected error`, err)
    return { error: 'An unexpected error occurred during upload. Please try again.' }
  }
}

/**
 * Delete a file from Supabase Storage.
 * Called when a content record is deleted to prevent orphaned files.
 */
export async function deleteContentFile(
  bucket: 'notes' | 'videos',
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      console.error(`[storage/delete] ${bucket}/${filePath}`, error)
      return { success: false, error: `Failed to delete file: ${error.message}` }
    }

    return { success: true }
  } catch (err) {
    console.error(`[storage/delete] unexpected error`, err)
    return { success: false, error: 'An unexpected error occurred while deleting the file.' }
  }
}

/**
 * Format bytes into a human-readable string (KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}
