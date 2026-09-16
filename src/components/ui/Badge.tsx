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
  default: 'bg-white/10 text-gray-300',
  notes: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  video: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  youtube: 'bg-red-500/15 text-red-400 border-red-500/20',
  instagram: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/15 text-red-400 border-red-500/20',
  info: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
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
