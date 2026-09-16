export type UserRole = 'head' | 'tutor' | 'member'
export type ApprovalStatus = 'approved' | 'pending' | 'rejected'
export type ContentType = 'notes' | 'video' | 'youtube' | 'instagram'
export type PaymentStatus = 'paid' | 'unpaid' | 'pending'

export interface Plan {
  id: string
  name: string
  price: number
  description: string | null
  is_active: boolean
}

export interface Profile {
  id: string
  email: string
  name: string | null
  role: UserRole
  approval_status: ApprovalStatus
  plan_id: string | null
  plan?: Plan
  payment_status: PaymentStatus
  avatar_url: string | null
  created_at: string
}

export interface Subject {
  id: string
  name: string
  slug: string
  description: string | null
  color_theme: string
  order_index: number
  created_by: string | null
  created_at: string
  content_count?: number
  content_breakdown?: {
    notes: number
    video: number
    youtube: number
    instagram: number
  }
}

export interface ContentItem {
  id: string
  subject_id: string
  subject?: Subject
  type: ContentType
  title: string
  description: string | null
  file_url: string | null
  file_name: string | null
  file_path: string | null
  file_size: number | null
  external_url: string | null
  is_published: boolean
  is_pinned: boolean
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_members: number
  active_subjects: number
  total_lessons: number
  storage_used_bytes: number
}

export interface UploadProgressState {
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  error: string | null
}
