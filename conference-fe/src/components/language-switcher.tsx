import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  className?: string
  align?: 'start' | 'end'
  onDark?: boolean
}

export function LanguageSwitcher({ className, align = 'end' }: LanguageSwitcherProps) {
  const { lang, setLang, langs } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const current = langs.find((item) => item.code === lang) ?? langs[0]

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <Globe className="size-4" aria-hidden="true" />
        <span className="uppercase">{current.code}</span>
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <ul
          id={menuId}
          role="listbox"
          aria-label="Language"
          className={cn(
            'absolute top-full z-50 mt-2 min-w-36 rounded-lg border border-border bg-card py-1 shadow-md',
            align === 'start' ? 'start-0' : 'end-0',
          )}
        >
          {langs.map((item) => (
            <li key={item.code} role="option" aria-selected={lang === item.code}>
              <button
                type="button"
                onClick={() => {
                  setLang(item.code)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center px-3 py-2 text-start text-sm transition-colors',
                  lang === item.code
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-foreground hover:bg-secondary',
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
