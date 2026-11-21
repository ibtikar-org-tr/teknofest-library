import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2, Save, Star, ArrowRight, FileText, X } from 'lucide-react'
import {
  evaluationsService,
  kitchensService,
  projectsService,
  type JuryAssignmentItem,
} from '../services/api'
import type { ApplicationStage, ProjectSubmission } from '../types'

const STAGE_LABEL: Record<ApplicationStage, string> = {
  primary: 'المرحلة الأولية',
  final: 'المرحلة النهائية',
}

export default function JuryScoring() {
  const { eventId = '' } = useParams()
  const [assignments, setAssignments] = useState<JuryAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProjectSubmission | null>(null)
  const [viewing, setViewing] = useState<ProjectSubmission | null>(null)
  const [score, setScore] = useState(50)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [myScores, setMyScores] = useState<Record<number, number>>({})
  const [myNotes, setMyNotes] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    try {
      const data = await kitchensService.getMyJuryAssignments(eventId)
      setAssignments(data.assignments)

      const scores: Record<number, number> = {}
      const notesByProject: Record<number, string> = {}
      for (const item of data.assignments) {
        for (const project of item.projects) {
          if (!project.id) continue
          try {
            const details = await evaluationsService.getProjectEvaluationsWithDetails(project.id)
            if (details.current_admin_evaluation) {
              scores[project.id] = details.current_admin_evaluation.score
              if (details.current_admin_evaluation.notes) {
                notesByProject[project.id] = details.current_admin_evaluation.notes
              }
            }
          } catch {
            /* ignore per-project */
          }
        }
      }
      setMyScores(scores)
      setMyNotes(notesByProject)
    } catch (err: any) {
      setError(err.response?.data?.message || 'لست محكماً معيّناً لهذه الفعالية')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  const openScore = (project: ProjectSubmission) => {
    setViewing(null)
    setSelected(project)
    setScore(myScores[project.id!] ?? 50)
    setNotes(myNotes[project.id!] ?? '')
  }

  const handleSave = async () => {
    if (!selected?.id) return
    if (score < 0 || score > 100) {
      toast.error('الدرجة يجب أن تكون بين 0 و 100')
      return
    }
    const trimmedNotes = notes.trim()
    if (!trimmedNotes) {
      toast.error('الملاحظات مطلوبة')
      return
    }
    setSaving(true)
    try {
      await evaluationsService.create({
        project_id: selected.id,
        score,
        notes: trimmedNotes,
        is_ai_evaluation: false,
      })
      toast.success('تم حفظ تقييمك')
      setMyScores((prev) => ({ ...prev, [selected.id!]: score }))
      setMyNotes((prev) => ({ ...prev, [selected.id!]: trimmedNotes }))
      setSelected(null)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر حفظ التقييم')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-red-400 mb-6">{error}</p>
        <Link to={`/events/${eventId}`} className="text-teknofest-cyan hover:underline">
          العودة للمطبخ
        </Link>
      </div>
    )
  }

  const detailProject = selected ?? viewing

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="w-7 h-7 text-teknofest-orange" />
            تحكيم المشاريع
          </h1>
          <p className="text-gray-400 mt-1">
            كل مرحلة تُحكَّم على حدة. الإجمالي = 40% أولية + 60% نهائية.
          </p>
        </div>
        <Link
          to={`/events/${eventId}`}
          className="text-teknofest-cyan hover:underline flex items-center gap-1 text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          المطبخ
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          لم تُعيَّن لك فرق بعد. تواصل مع مدير الفعالية.
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((item) => (
            <div key={item.team_id} className="card space-y-3">
              <h2 className="text-lg font-bold text-white">{item.team_name}</h2>
              {item.projects.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد تقديم لهذا الفريق بعد.</p>
              ) : (
                <ul className="space-y-3">
                  {item.projects.map((project) => {
                    const stage = project.stage ?? 'primary'
                    const summary = project.summary || project.problem_statement || ''
                    return (
                      <li
                        key={project.id}
                        className="p-4 rounded-lg bg-teknofest-medium-blue/40 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  stage === 'final'
                                    ? 'bg-teknofest-cyan/20 text-teknofest-cyan'
                                    : 'bg-teknofest-orange/20 text-teknofest-orange'
                                }`}
                              >
                                {STAGE_LABEL[stage]}
                              </span>
                              <p className="text-white font-medium">{project.title}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {project.field_label || project.field}
                            </p>
                            {summary ? (
                              <p className="text-sm text-gray-300 mt-2 line-clamp-2">{summary}</p>
                            ) : null}
                            {myScores[project.id!] != null && (
                              <p className="text-sm text-green-400 mt-2">
                                درجتك: {myScores[project.id!].toFixed(1)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setViewing(project)}
                              className="btn-secondary text-sm py-2 flex items-center justify-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              عرض
                            </button>
                            <button
                              type="button"
                              onClick={() => openScore(project)}
                              className="btn-primary text-sm py-2"
                            >
                              {myScores[project.id!] != null ? 'تعديل تقييمي' : 'تقييم'}
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {detailProject && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs mb-2 ${
                    (detailProject.stage ?? 'primary') === 'final'
                      ? 'bg-teknofest-cyan/20 text-teknofest-cyan'
                      : 'bg-teknofest-orange/20 text-teknofest-orange'
                  }`}
                >
                  {STAGE_LABEL[detailProject.stage ?? 'primary']}
                </span>
                <h3 className="text-xl font-bold text-white">{detailProject.title}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {detailProject.field_label || detailProject.field}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setViewing(null)
                }}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">الملخص</h4>
              <p className="text-gray-300 bg-teknofest-dark-blue/50 p-4 rounded-xl whitespace-pre-wrap">
                {detailProject.summary || detailProject.problem_statement || '—'}
              </p>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">الملفات</h4>
              {(detailProject.files?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-500 bg-teknofest-dark-blue/50 p-4 rounded-xl">
                  لا توجد ملفات
                </p>
              ) : (
                <ul className="space-y-2 bg-teknofest-dark-blue/50 p-4 rounded-xl">
                  {detailProject.files!.map((f) => (
                    <li
                      key={f.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-medium">{f.display_name}</p>
                        {f.description ? (
                          <p className="text-gray-400 text-xs mt-0.5">{f.description}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="btn-secondary text-xs py-1.5 shrink-0"
                        onClick={() =>
                          void projectsService
                            .downloadFile(
                              detailProject.id!,
                              f.id,
                              f.original_filename || f.display_name,
                            )
                            .catch(() => toast.error('تعذر تحميل الملف'))
                        }
                      >
                        تحميل
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selected ? (
              <div className="border-t border-teknofest-light-blue/20 pt-4 space-y-4">
                <label className="block text-sm text-gray-300">
                  الدرجة (0–100) لهذه المرحلة
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="input-field mt-1"
                  />
                </label>
                <label className="block text-sm text-gray-300">
                  ملاحظات <span className="text-teknofest-orange">*</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                    className="input-field mt-1 min-h-[100px]"
                    placeholder="اكتب ملاحظاتك عن هذا التقديم…"
                  />
                </label>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="btn-secondary"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    حفظ التقييم
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 justify-end border-t border-teknofest-light-blue/20 pt-4">
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  className="btn-secondary"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => openScore(detailProject)}
                  className="btn-primary"
                >
                  تقييم هذه المرحلة
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
