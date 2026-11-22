import { useEffect, useId, useRef } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'warning' | 'default'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  tone = 'default',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  const confirmClass =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-500 text-white'
      : tone === 'warning'
        ? 'bg-teknofest-orange hover:bg-orange-500 text-white'
        : 'btn-primary'

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-teknofest-light-blue/30 bg-teknofest-dark-blue shadow-xl p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              tone === 'danger'
                ? 'bg-red-500/15 text-red-400'
                : 'bg-teknofest-orange/15 text-teknofest-orange'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 id={titleId} className="text-white font-bold text-lg leading-snug">
              {title}
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <button
            ref={cancelRef}
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold disabled:opacity-50 ${confirmClass}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
