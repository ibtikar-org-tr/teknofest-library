import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2, Save, Star, ArrowRight } from 'lucide-react'
import {
  evaluationsService,
  kitchensService,
  type JuryAssignmentItem,
} from '../services/api'
import type { ProjectSubmission } from '../types'

export default function JuryScoring() {
  const { eventId = '' } = useParams()
  const [assignments, setAssignments] = useState<JuryAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProjectSubmission | null>(null)
  const [score, setScore] = useState(50)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [myScores, setMyScores] = useState<Record<number, number>>({})

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    try {
      const data = await kitchensService.getMyJuryAssignments(eventId)
      setAssignments(data.assignments)

      const scores: Record<number, number> = {}
      for (const item of data.assignments) {
        for (const project of item.projects) {
          if (!project.id) continue
          try {
            const details = await evaluationsService.getProjectEvaluationsWithDetails(project.id)
            if (details.current_admin_evaluation) {
              scores[project.id] = details.current_admin_evaluation.score
            }
          } catch {
            /* ignore per-project */
          }
        }
      }
      setMyScores(scores)
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
    setSelected(project)
    setScore(myScores[project.id!] ?? 50)
    setNotes('')
  }

  const handleSave = async () => {
    if (!selected?.id) return
    if (score < 0 || score > 100) {
      toast.error('الدرجة يجب أن تكون بين 0 و 100')
      return
    }
    setSaving(true)
    try {
      await evaluationsService.create({
        project_id: selected.id,
        score,
        notes,
        is_ai_evaluation: false,
      })
      toast.success('تم حفظ تقييمك')
      setMyScores((prev) => ({ ...prev, [selected.id!]: score }))
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="w-7 h-7 text-teknofest-orange" />
            تحكيم المشاريع
          </h1>
          <p className="text-gray-400 mt-1">قيّم فقط الفرق المعيّنة لك. الدرجة النهائية = متوسط المحكمين.</p>
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
                <p className="text-sm text-gray-500">لا يوجد مشروع مقدّم لهذا الفريق بعد.</p>
              ) : (
                <ul className="space-y-2">
                  {item.projects.map((project) => (
                    <li
                      key={project.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-teknofest-medium-blue/40"
                    >
                      <div>
                        <p className="text-white font-medium">{project.title}</p>
                        <p className="text-xs text-gray-400">{project.field}</p>
                        {myScores[project.id!] != null && (
                          <p className="text-sm text-green-400 mt-1">
                            درجتك: {myScores[project.id!].toFixed(1)}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openScore(project)}
                        className="btn-primary text-sm py-2"
                      >
                        {myScores[project.id!] != null ? 'تعديل تقييمي' : 'تقييم'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-white">تقييم: {selected.title}</h3>
            <label className="block text-sm text-gray-300">
              الدرجة (0–100)
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
              ملاحظات (اختياري)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field mt-1 min-h-[100px]"
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
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
