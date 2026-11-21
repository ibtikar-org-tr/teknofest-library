import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Star, Search, Loader2, Bot, User, Eye, X } from 'lucide-react'
import {
  projectsService,
  evaluationsService,
  type ProjectEvaluationsDetails,
} from '../../services/api'
import type { ProjectSubmission } from '../../types'

type ProjectScore = {
  jury_average: number | null
  jury_count: number
  stage_score?: number | null
  overall_score?: number | null
  final_score: number | null
  ai_average: number | null
  stage?: 'primary' | 'final'
}

export default function AdminEvaluations() {
  const { eventId = '' } = useParams()
  const [projects, setProjects] = useState<ProjectSubmission[]>([])
  const [scores, setScores] = useState<Record<number, ProjectScore>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingEvaluations, setViewingEvaluations] = useState<ProjectEvaluationsDetails | null>(
    null,
  )
  const [loadingEvaluations, setLoadingEvaluations] = useState(false)

  useEffect(() => {
    if (!eventId) return
    const fetchProjects = async () => {
      try {
        const data = await projectsService.getAll(eventId)
        setProjects(data)
        const nextScores: Record<number, ProjectScore> = {}
        await Promise.all(
          data.map(async (project) => {
            if (!project.id) return
            try {
              const score = await evaluationsService.getScore(project.id)
              nextScores[project.id] = score
            } catch {
              nextScores[project.id] = {
                jury_average: null,
                jury_count: 0,
                final_score: null,
                ai_average: null,
              }
            }
          }),
        )
        setScores(nextScores)
      } catch {
        toast.error('حدث خطأ في تحميل المشاريع')
      } finally {
        setLoading(false)
      }
    }

    void fetchProjects()
  }, [eventId])

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.field.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewEvaluations = async (project: ProjectSubmission) => {
    setLoadingEvaluations(true)
    try {
      const data = await evaluationsService.getProjectEvaluationsWithDetails(project.id!)
      setViewingEvaluations(data)
    } catch {
      toast.error('حدث خطأ في تحميل التقييمات')
    } finally {
      setLoadingEvaluations(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">ملخص التقييمات</h1>
          <p className="text-gray-400">
            عرض فقط — كل مرحلة تُحكَّم على حدة. إجمالي الفريق = 40% أولية + 60% نهائية.
          </p>
          <Link
            to={`/admin/events/${eventId}/juries`}
            className="text-teknofest-cyan text-sm hover:underline inline-block mt-1"
          >
            إدارة المحكمين
          </Link>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
          <Star className="w-5 h-5" />
          <span className="font-medium">{projects.length} مشروع</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="البحث عن مشروع..."
          className="input-field pr-12"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="card text-center py-12">
          <Star className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">لا توجد مشاريع</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const score = project.id ? scores[project.id] : undefined
            return (
              <div key={project.id} className="card">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          (project.stage ?? 'primary') === 'final'
                            ? 'bg-teknofest-cyan/20 text-teknofest-cyan'
                            : 'bg-teknofest-orange/20 text-teknofest-orange'
                        }`}
                      >
                        {(project.stage ?? 'primary') === 'final'
                          ? 'المرحلة النهائية'
                          : 'المرحلة الأولية'}
                      </span>
                      <h3 className="text-lg font-bold text-white">{project.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      {project.team?.team_name || `فريق ${project.team_id}`} |{' '}
                      {project.field_label || project.field}
                    </p>
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {project.summary || project.problem_statement}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center mb-1 ${
                            score?.jury_average != null
                              ? 'bg-green-500/20'
                              : 'bg-teknofest-medium-blue'
                          }`}
                        >
                          {score?.jury_average != null ? (
                            <span className="text-lg font-bold text-green-400">
                              {score.jury_average.toFixed(1)}
                            </span>
                          ) : (
                            <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          درجة المرحلة{score?.jury_count ? ` (${score.jury_count})` : ''}
                        </p>
                      </div>

                      <div className="text-center">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center mb-1 ${
                            score?.overall_score != null
                              ? 'bg-yellow-500/20'
                              : 'bg-teknofest-medium-blue'
                          }`}
                        >
                          {score?.overall_score != null ? (
                            <span className="text-lg font-bold text-yellow-400">
                              {score.overall_score.toFixed(1)}
                            </span>
                          ) : (
                            <Star className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">إجمالي الفريق</p>
                      </div>
                    </div>

                    <button
                      onClick={() => void handleViewEvaluations(project)}
                      disabled={loadingEvaluations}
                      className="btn-secondary text-sm py-2 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      عرض
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewingEvaluations && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                تقييمات: {viewingEvaluations.project_title}
              </h2>
              <button
                onClick={() => setViewingEvaluations(null)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-500/10 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-400">
                  {viewingEvaluations.final_score != null
                    ? viewingEvaluations.final_score.toFixed(1)
                    : '—'}
                </p>
                <p className="text-sm text-gray-400">درجة هذه المرحلة (متوسط المحكمين)</p>
              </div>
              <div className="p-4 bg-teknofest-cyan/10 rounded-xl text-center">
                <p className="text-2xl font-bold text-teknofest-cyan">
                  {viewingEvaluations.total_admin_evaluations}
                </p>
                <p className="text-sm text-gray-400">عدد تقييمات المحكمين</p>
              </div>
            </div>

            <div className="space-y-4">
              {viewingEvaluations.evaluations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد تقييمات بعد</p>
                </div>
              ) : (
                viewingEvaluations.evaluations.map((evalItem) => (
                  <div
                    key={evalItem.id}
                    className={`p-4 rounded-xl border ${
                      evalItem.is_ai_evaluation
                        ? 'bg-teknofest-cyan/10 border-teknofest-cyan/30'
                        : 'bg-teknofest-dark-blue/50 border-teknofest-light-blue/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            evalItem.is_ai_evaluation
                              ? 'bg-teknofest-cyan/20'
                              : 'bg-green-500/20'
                          }`}
                        >
                          {evalItem.is_ai_evaluation ? (
                            <Bot className="w-6 h-6 text-teknofest-cyan" />
                          ) : (
                            <User className="w-6 h-6 text-green-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {evalItem.is_ai_evaluation
                              ? 'تقييم الذكاء الاصطناعي'
                              : evalItem.admin_name || 'محكم'}
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">{evalItem.score}</p>
                    </div>
                    {evalItem.notes && (
                      <div className="mt-3 p-3 bg-black/20 rounded-lg">
                        <p className="text-gray-300 text-sm">{evalItem.notes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setViewingEvaluations(null)} className="btn-secondary">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
