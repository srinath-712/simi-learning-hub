import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type BadgeVariant = 'default' | 'notes' | 'video' | 'youtube' | 'instagram' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-600 border-slate-200',
  notes: 'bg-blue-50 text-blue-700 border-blue-200',
  video: 'bg-violet-50 text-violet-700 border-violet-200',
  youtube: 'bg-red-50 text-red-700 border-red-200',
  instagram: 'bg-pink-50 text-pink-700 border-pink-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  notes: 'bg-blue-400',
  video: 'bg-purple-400',
  youtube: 'bg-red-400',
  instagram: 'bg-pink-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-indigo-400',
  purple: 'bg-purple-400',
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent',
          variantStyles[variant],
          className
        )
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />
      )}
      {children}
    </span>
  )
}

/** Maps ContentType to the correct Badge variant */
export function getContentBadgeVariant(type: string): BadgeVariant {
  switch (type) {
    case 'notes': return 'notes'
    case 'video': return 'video'
    case 'youtube': return 'youtube'
    case 'instagram': return 'instagram'
    default: return 'default'
  }
}

/** Maps PaymentStatus to the correct Badge variant */
export function getPaymentBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'paid': return 'success'
    case 'unpaid': return 'danger'
    case 'pending': return 'warning'
    default: return 'default'
  }
}
