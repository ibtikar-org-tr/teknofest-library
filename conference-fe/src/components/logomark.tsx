import type { MouseEventHandler } from 'react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/i18n/locale-provider'
import { IBTIKAR_URL, IbtikarLogo } from '@/components/ibtikar-logo'

export function BrandLockup({
  className,
  compact,
  href = '#top',
  ariaLabel,
  onNavigate,
}: {
  className?: string
  compact?: boolean
  dark?: boolean
  href?: string
  ariaLabel?: string
  onNavigate?: MouseEventHandler<HTMLAnchorElement>
}) {
  const { t } = useLocale()

  return (
    <span className={cn('flex min-w-0 items-center gap-1.5 sm:gap-3', className)}>
      <a
        href={href}
        aria-label={ariaLabel ?? t.siteName}
        onClick={onNavigate}
        className={cn(
          'shrink-0 font-display font-extrabold leading-none tracking-tight text-foreground transition-colors hover:text-primary',
          compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg',
        )}
      >
        {t.siteName}
      </a>
      <span className="h-4 w-px shrink-0 bg-border sm:h-5" aria-hidden />
      <a
        href={IBTIKAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 transition-opacity hover:opacity-80"
        aria-label={t.brand}
      >
        <IbtikarLogo
          className={cn(
            'w-auto',
            compact
              ? 'h-8 max-[359px]:max-w-[6.5rem] sm:h-9'
              : 'h-8 max-[359px]:max-w-[6.5rem] sm:h-10 lg:h-11',
          )}
        />
      </a>
    </span>
  )
}
