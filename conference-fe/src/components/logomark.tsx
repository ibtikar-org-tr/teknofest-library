import { Hexagon } from 'lucide-react'
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
    <span className={cn('flex items-center gap-2.5 group', className)}>
      <span
        className={cn(
          'relative flex items-center justify-center overflow-hidden bg-primary',
          compact ? 'size-10' : 'size-12',
        )}
      >
        <Hexagon className={cn('text-primary-foreground', compact ? 'size-6' : 'size-7')} aria-hidden="true" />
        <span className="absolute inset-0 bg-linear-to-tr from-black/25 to-transparent" />
      </span>
      <span className="flex min-w-0 items-baseline gap-2 leading-none">
        <span
          className={cn(
            'font-display font-bold tracking-[0.12em] text-foreground',
            compact ? 'text-xl' : 'text-2xl',
          )}
        >
          {t.siteName}
        </span>
        <span
          className={cn(
            'font-arabic font-semibold text-primary',
            compact ? 'text-sm' : 'text-base',
          )}
        >
          {t.siteNameAr}
        </span>
      </span>
      <span className="sr-only">
        {' '}
        {t.siteName} {t.siteNameAr} — {t.brand}
      </span>
    </span>
  )
}
