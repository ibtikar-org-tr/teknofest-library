import { useEffect, useId, useRef } from 'react'
import { Loader2, X } from 'lucide-react'

export type JuryEvaluationView = {
  id: number
  project_id: number
  project_title: string
  stage: 'primary' | 'final'
  team_name: string
  jury_membership_number: string
  jury_full_name: string | null
  score: number
  notes: string | null
  detailed_scores: Record<string, number> | null
  created_at: string | null
  updated_at?: string | null
}

type JuryEvaluationModalProps = {
  open: boolean
  loading?: boolean
  error?: string | null
  evaluation: JuryEvaluationView | null
  onClose: () => void
}

export default function JuryEvaluationModal({
  open,
  loading = false,
  error = null,
  evaluation,
  onClose,
}: JuryEvaluationModalProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const stageLabel =
    evaluation?.stage === 'final' ? 'التقرير النهائي' : evaluation?.stage === 'primary' ? 'التقرير الأول' : ''

  const details = evaluation?.detailed_scores
    ? Object.entries(evaluation.detailed_scores)
    : []

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-2xl border border-teknofest-light-blue/30 bg-teknofest-dark-blue shadow-xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-teknofest-light-blue/15">
          <div className="min-w-0">
            <h2 id={titleId} className="text-white font-bold text-lg truncate">
              تقييم المحكم
            </h2>
            {evaluation ? (
              <p className="text-sm text-gray-400 mt-0.5 truncate">
                {evaluation.team_name}
                {stageLabel ? ` · ${stageLabel}` : ''}
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-teknofest-cyan" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-6">{error}</p>
          ) : evaluation ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-400">المحكم</span>
                <span className="text-white font-medium">
                  {evaluation.jury_full_name || evaluation.jury_membership_number}
                </span>
                <code
                  className="text-xs text-teknofest-cyan bg-black/20 px-1.5 py-0.5 rounded"
                  dir="ltr"
                >
                  {evaluation.jury_membership_number}
                </code>
              </div>

              <div className="rounded-xl border border-teknofest-cyan/30 bg-teknofest-cyan/10 px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-gray-300">الدرجة</span>
                <span className="text-2xl font-bold text-teknofest-cyan tabular-nums" dir="ltr">
                  {evaluation.score}
                </span>
              </div>

              {details.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">تفصيل الدرجات</p>
                  <ul className="space-y-1.5">
                    {details.map(([key, value]) => (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2 text-sm"
                      >
                        <span className="text-gray-300 truncate">{key}</span>
                        <span className="text-white font-semibold tabular-nums" dir="ltr">
                          {value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">الملاحظات</p>
                {evaluation.notes?.trim() ? (
                  <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed rounded-xl bg-black/20 border border-teknofest-light-blue/10 px-3 py-3">
                    {evaluation.notes}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">لا ملاحظات</p>
                )}
              </div>

              {evaluation.created_at ? (
                <p className="text-[11px] text-gray-500" dir="ltr">
                  {evaluation.updated_at && evaluation.updated_at !== evaluation.created_at
                    ? `updated ${evaluation.updated_at}`
                    : `created ${evaluation.created_at}`}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">لا يوجد تقييم</p>
          )}
        </div>
      </div>
    </div>
  )
}
