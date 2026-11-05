import { Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/i18n/locale-provider'

export function BrandLockup({
  className,
  compact,
}: {
  className?: string
  compact?: boolean
  dark?: boolean
}) {
  const { t } = useLocale()

  return (
    <span className={cn('flex items-center gap-2 group', className)}>
      <span
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-lg bg-primary',
          compact ? 'size-10' : 'size-12',
        )}
      >
        <Rocket className={cn('text-white', compact ? 'size-6' : 'size-7')} aria-hidden="true" />
        <span className="absolute inset-0 bg-linear-to-tr from-black/20 to-transparent" />
      </span>
      <span
        className={cn(
          'font-display font-bold tracking-wider text-foreground',
          compact ? 'text-2xl' : 'text-3xl',
        )}
      >
        TK<span className="text-primary">Fest</span>
        <span className="sr-only"> {t.brand}</span>
      </span>
    </span>
  )
}
