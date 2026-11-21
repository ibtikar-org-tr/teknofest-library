import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type AdminPageHeaderProps = {
  icon: LucideIcon
  title: string
  description?: string
  children?: ReactNode
  tone?: 'orange' | 'cyan' | 'purple' | 'green'
}

const TONE = {
  orange: 'from-teknofest-orange to-teknofest-red',
  cyan: 'from-teknofest-cyan to-blue-500',
  purple: 'from-purple-500 to-pink-500',
  green: 'from-green-500 to-teal-400',
} as const

export default function AdminPageHeader({
  icon: Icon,
  title,
  description,
  children,
  tone = 'orange',
}: AdminPageHeaderProps) {
  return (
    <div className="card flex flex-col sm:flex-row sm:items-start gap-4">
      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${TONE[tone]} flex items-center justify-center shrink-0`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description ? (
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        ) : null}
        {children}
      </div>
    </div>
  )
}
