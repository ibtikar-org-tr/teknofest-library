import { cn } from '@/lib/utils'

export function SectionLabel({
  title,
  className,
}: {
  index?: string
  title: string
  className?: string
  tone?: 'dark' | 'light'
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1',
        className,
      )}
    >
      <span className="text-xs font-bold uppercase tracking-widest text-primary">{title}</span>
    </div>
  )
}
