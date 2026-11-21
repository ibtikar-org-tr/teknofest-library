import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'
import { kitchensService } from '../services/api'
import { useProjectFields } from '../hooks/useProjectFields'
import {
  competitionLabel,
  libraryCompetitionUrl,
} from '../lib/competition'
import type { ProjectSubmission, Team } from '../types'

export default function MyTeam() {
  const { eventId = '' } = useParams()
  const { fields: competitions, loading: competitionsLoading } = useProjectFields(eventId)
  const [team, setTeam] = useState<Team | null>(null)
  const [projects, setProjects] = useState<ProjectSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompetition, setSelectedCompetition] = useState('')
  const [savingCompetition, setSavingCompetition] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState(false)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    setLoading(true)
    kitchensService
      .getMyTeam(eventId)
      .then(async (data) => {
        if (cancelled) return
        setTeam(data)
        if (data?.field) setSelectedCompetition(data.field)
        if (data) {
          try {
            const res = await kitchensService.getMyProjects(eventId)
            if (!cancelled) setProjects(res.projects ?? [])
          } catch {
            if (!cancelled) setProjects([])
          }
        }
      })
      .catch((err) => {
        if (!cancelled && err.response?.status !== 404) {
          setError(err.response?.data?.message || 'تعذر تحميل بيانات فريقك')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  const hasCompetition = Boolean(team?.field?.trim())
  const hasPrimary = useMemo(() => projects.some((p) => p.stage === 'primary'), [projects])
  const hasFinal = useMemo(() => projects.some((p) => p.stage === 'final'), [projects])

  const saveCompetition = async () => {
    const competitionId = Number(selectedCompetition)
    if (!eventId || !Number.isFinite(competitionId) || competitionId <= 0) {
      toast.error('اختر المسابقة أولاً')
      return
    }
    setSavingCompetition(true)
    try {
      const updated = await kitchensService.setMyTeamCompetition(eventId, competitionId)
      setTeam(updated)
      setEditingCompetition(false)
      toast.success(hasCompetition ? 'تم تحديث المسابقة' : 'تم اختيار المسابقة')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر حفظ المسابقة')
    } finally {
      setSavingCompetition(false)
    }
  }

  const teamCompetitionLabel = competitionLabel(
    team?.field,
    competitions,
    team?.field_label,
  )
  const teamCompetitionHref = libraryCompetitionUrl(team?.field, competitions)

  const competitionPicker = (
    <div className="space-y-3">
      <select
        className="input-field"
        value={selectedCompetition}
        disabled={competitionsLoading || competitions.length === 0}
        onChange={(e) => setSelectedCompetition(e.target.value)}
      >
        <option value="">
          {competitionsLoading
            ? 'جاري تحميل المسابقات...'
            : competitions.length === 0
              ? 'لا مسابقات متاحة — انتظر تفعيل المدير'
              : 'اختر المسابقة'}
        </option>
        {competitions.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.label}
          </option>
        ))}
      </select>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => void saveCompetition()}
          disabled={
            savingCompetition ||
            !selectedCompetition ||
            selectedCompetition === team?.field
          }
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {savingCompetition ? 'جاري الحفظ...' : hasCompetition ? 'حفظ التغيير' : 'تأكيد المسابقة'}
        </button>
        {hasCompetition && editingCompetition ? (
          <button
            type="button"
            onClick={() => {
              setEditingCompetition(false)
              setSelectedCompetition(team?.field ?? '')
            }}
            className="btn-secondary"
            disabled={savingCompetition}
          >
            إلغاء
          </button>
        ) : null}
      </div>
    </div>
  )

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
        <Link to={`/events/${eventId}/dashboard`} className="text-teknofest-cyan hover:underline">
          لوحتي
        </Link>
      </div>
    )
  }

  if (team) {
    const members = team.members ?? []
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowRight className="w-4 h-4" />
          المطبخ
        </Link>

        <div>
          <p className="text-teknofest-cyan text-sm mb-2">لوحتي · فريقي</p>
          <h1 className="text-3xl font-bold text-white mb-2">{team.team_name}</h1>
        </div>

        <div className="card space-y-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-teknofest-orange" />
            الأعضاء ({members.length})
          </h2>
          <p className="text-gray-500 text-xs">
            بعد الانضمام لا يمكنك مغادرة الفريق أو الانتقال لفريق آخر بنفسك — تواصل مع مدير
            الفعالية إن لزم الأمر.
          </p>
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id ?? m.email}
                className="flex justify-between gap-3 text-sm py-2 border-b border-teknofest-light-blue/10 last:border-0"
              >
                <span className="text-white">
                  {m.full_name}
                  {m.is_leader ? (
                    <span className="text-teknofest-orange text-xs mr-2"> (قائد)</span>
                  ) : null}
                </span>
                <span className="text-gray-500 truncate">{m.email}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-white font-semibold">مسار التقديم</h2>
          <p className="text-gray-400 text-sm">
            ثلاث خطوات في لوحتي: اختيار المسابقة، ثم المرحلة الأولية، ثم النهائية. التحكيم على
            مرحلتين فقط (أولية 40% + نهائية 60%).
          </p>

          {/* Step 1 — competition (editable until primary is submitted) */}
          {!hasCompetition ? (
            <div className="card space-y-4 border border-teknofest-orange/40">
              <div className="flex items-center gap-4">
                <Trophy className="w-10 h-10 text-teknofest-orange shrink-0" />
                <div>
                  <p className="text-xs text-teknofest-orange mb-1">الخطوة 1</p>
                  <h3 className="text-lg font-bold text-white">اختيار المسابقة</h3>
                  <p className="text-gray-400 text-sm">يجب اختيار المسابقة قبل أي تقديم</p>
                </div>
              </div>
              {competitionPicker}
            </div>
          ) : hasPrimary ? (
            <div className="card flex items-center gap-4 border border-green-500/30">
              <Check className="w-10 h-10 text-green-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-green-400 mb-1">الخطوة 1</p>
                <h3 className="text-lg font-bold text-white">اختيار المسابقة</h3>
                {teamCompetitionHref ? (
                  <a
                    href={teamCompetitionHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teknofest-cyan text-sm hover:underline truncate inline-block max-w-full"
                    title="فتح صفحة المسابقة في المكتبة"
                  >
                    {teamCompetitionLabel}
                  </a>
                ) : (
                  <p className="text-gray-300 text-sm truncate">{teamCompetitionLabel}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  لا يمكن تغيير المسابقة بعد تقديم المرحلة الأولية
                </p>
              </div>
            </div>
          ) : (
            <div className="card space-y-4 border border-green-500/30">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <Check className="w-10 h-10 text-green-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-green-400 mb-1">الخطوة 1</p>
                    <h3 className="text-lg font-bold text-white">اختيار المسابقة</h3>
                    {teamCompetitionHref ? (
                      <a
                        href={teamCompetitionHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teknofest-cyan text-sm hover:underline truncate inline-block max-w-full"
                        title="فتح صفحة المسابقة في المكتبة"
                      >
                        {teamCompetitionLabel}
                      </a>
                    ) : (
                      <p className="text-gray-300 text-sm truncate">{teamCompetitionLabel}</p>
                    )}
                  </div>
                </div>
                {!editingCompetition ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompetition(team.field ?? '')
                      setEditingCompetition(true)
                    }}
                    className="btn-secondary text-sm py-2 shrink-0"
                  >
                    تغيير المسابقة
                  </button>
                ) : null}
              </div>
              {editingCompetition ? competitionPicker : null}
              {!editingCompetition ? (
                <p className="text-gray-500 text-xs">
                  يمكنك تغيير المسابقة حتى تقديم المرحلة الأولية
                </p>
              ) : null}
            </div>
          )}

          {/* Step 2 — primary */}
          {!hasCompetition ? (
            <div className="card opacity-50">
              <p className="text-xs text-gray-500 mb-1">الخطوة 2</p>
              <h3 className="text-lg font-bold text-white">المرحلة الأولية</h3>
              <p className="text-gray-500 text-sm">متاحة بعد اختيار المسابقة</p>
            </div>
          ) : hasPrimary ? (
            <div className="card flex items-center gap-4 border border-green-500/30">
              <Check className="w-10 h-10 text-green-400 shrink-0" />
              <div>
                <p className="text-xs text-green-400 mb-1">الخطوة 2</p>
                <h3 className="text-lg font-bold text-white">المرحلة الأولية</h3>
                <p className="text-gray-400 text-sm">تم التقديم</p>
              </div>
            </div>
          ) : (
            <Link
              to={`/events/${eventId}/project/submit?stage=primary`}
              className="card flex items-center gap-4 hover:border-teknofest-orange/40 border border-transparent transition-all"
            >
              <FileText className="w-10 h-10 text-teknofest-orange shrink-0" />
              <div>
                <p className="text-xs text-teknofest-orange mb-1">الخطوة 2</p>
                <h3 className="text-lg font-bold text-white">تقديم المرحلة الأولية</h3>
                <p className="text-gray-400 text-sm">ملخص وملفات</p>
              </div>
            </Link>
          )}

          {/* Step 3 — final */}
          {!hasCompetition || !hasPrimary ? (
            <div className="card opacity-50">
              <p className="text-xs text-gray-500 mb-1">الخطوة 3</p>
              <h3 className="text-lg font-bold text-white">المرحلة النهائية</h3>
              <p className="text-gray-500 text-sm">
                {!hasCompetition
                  ? 'متاحة بعد اختيار المسابقة والمرحلة الأولية'
                  : 'متاحة بعد تقديم المرحلة الأولية'}
              </p>
            </div>
          ) : hasFinal ? (
            <div className="card flex items-center gap-4 border border-green-500/30">
              <Check className="w-10 h-10 text-green-400 shrink-0" />
              <div>
                <p className="text-xs text-green-400 mb-1">الخطوة 3</p>
                <h3 className="text-lg font-bold text-white">المرحلة النهائية</h3>
                <p className="text-gray-400 text-sm">تم التقديم</p>
              </div>
            </div>
          ) : (
            <Link
              to={`/events/${eventId}/project/submit?stage=final`}
              className="card flex items-center gap-4 hover:border-teknofest-cyan/40 border border-transparent transition-all"
            >
              <FileText className="w-10 h-10 text-teknofest-cyan shrink-0" />
              <div>
                <p className="text-xs text-teknofest-cyan mb-1">الخطوة 3</p>
                <h3 className="text-lg font-bold text-white">تقديم المرحلة النهائية</h3>
                <p className="text-gray-400 text-sm">ملخص وملفات للمرحلة الثانية</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link
        to={`/events/${eventId}`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowRight className="w-4 h-4" />
        المطبخ
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">لوحتي</h1>
        <p className="text-gray-400">لست في فريق بعد. أنشئ فريقاً أو انضم لأحد المسارين.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Link
          to={`/events/${eventId}/register/team`}
          className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-orange/40 transition-all"
        >
          <Users className="w-8 h-8 text-teknofest-orange mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">إنشاء فريق</h2>
          <p className="text-gray-400 text-sm">أسّس فريقاً جديداً وادعُ أعضاءك</p>
        </Link>
        <Link
          to={`/events/${eventId}/join`}
          className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-orange/40 transition-all"
        >
          <UserPlus className="w-8 h-8 text-teknofest-cyan mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">الانضمام لفريق</h2>
          <p className="text-gray-400 text-sm">انضم لفريق موجود أو ادخل قائمة الانتظار</p>
        </Link>
      </div>
    </div>
  )
}
