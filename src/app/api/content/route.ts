import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateStoragePath, validateFileSize } from '@/lib/supabase/storage'
import { validateContentInput } from '@/lib/validation'
import type { ContentType } from '@/types'

const CONTENT_TYPES: ContentType[] = ['notes', 'video', 'youtube', 'instagram']

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, approval_status').eq('id', user.id).single()
  if (!profile || !(profile.role === 'head' || (profile.role === 'tutor' && profile.approval_status === 'approved'))) {
    return NextResponse.json({ error: 'Only approved tutors and heads can upload content.' }, { status: 403 })
  }

  const form = await request.formData()
  const type = String(form.get('type') || '') as ContentType
  const subjectId = String(form.get('subjectId') || '')
  const title = String(form.get('title') || '')
  const description = String(form.get('description') || '')
  const externalUrl = String(form.get('externalUrl') || '') || undefined
  const isPublished = String(form.get('isPublished')) === 'true'
  const fileValue = form.get('file')
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null

  if (!CONTENT_TYPES.includes(type) || !subjectId) return NextResponse.json({ error: 'Invalid content type or subject.' }, { status: 400 })
  const inputError = validateContentInput(type, title, description, externalUrl)
  if (inputError) return NextResponse.json({ error: inputError }, { status: 400 })
  if ((type === 'notes' || type === 'video') && !file) return NextResponse.json({ error: 'A file is required.' }, { status: 400 })
  if ((type === 'youtube' || type === 'instagram') && file) return NextResponse.json({ error: 'External content cannot include a file.' }, { status: 400 })

  let bucket: 'notes' | 'videos' | null = null
  let storagePath: string | null = null
  let recordId: string | null = null
  try {
    if (file) {
      bucket = type === 'notes' ? 'notes' : 'videos'
      const sizeError = validateFileSize(bucket, file.size)
      if (sizeError) return NextResponse.json({ error: sizeError }, { status: 400 })
    }

    const { data: record, error: insertError } = await supabase.from('content').insert({
      subject_id: subjectId, type, title: title.trim(), description: description.trim() || null,
      external_url: externalUrl || null, is_published: isPublished, uploaded_by: user.id,
    }).select().single()
    if (insertError || !record) throw new Error(insertError?.message || 'Failed to create content record.')
    recordId = record.id

    let fileData: Record<string, string | number> = {}
    if (file && bucket) {
      storagePath = generateStoragePath(subjectId, record.id, file.name)
      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath)
      fileData = { file_url: urlData.publicUrl, file_name: file.name, file_path: storagePath, file_size: file.size }
      const { error: updateError } = await supabase.from('content').update(fileData).eq('id', record.id)
      if (updateError) throw new Error(updateError.message)
    }
    return NextResponse.json({ ...record, ...fileData }, { status: 201 })
  } catch (error) {
    if (bucket && storagePath) await supabase.storage.from(bucket).remove([storagePath])
    if (recordId) await supabase.from('content').delete().eq('id', recordId)
    const message = error instanceof Error ? error.message : 'Content upload failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
