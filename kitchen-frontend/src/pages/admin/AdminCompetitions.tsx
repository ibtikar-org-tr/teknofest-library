import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CheckSquare,
  ExternalLink,
  Loader2,
  Save,
  Search,
  Square,
  Trophy,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Users,
  UserPlus,
} from 'lucide-react'
import { kitchensService } from '../../services/api'
import { libraryCompetitionUrl } from '../../lib/competition'
import type { ProjectFieldOption } from '../../types'
import AdminPageHeader from '../../components/AdminPageHeader'

type CatalogRow = ProjectFieldOption & { selected: boolean }

const DEFAULT_MAX_TEAM_SIZE = 8

export default function AdminCompetitions() {
  const { eventId = '' } = useParams()
  const [rows, setRows] = useState<CatalogRow[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [interestMin, setInterestMin] = useState(1)
  const [interestMax, setInterestMax] = useState(5)
  const [savedMin, setSavedMin] = useState<number | null>(null)
  const [savedMax, setSavedMax] = useState<number | null>(null)
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [allowCreateTeams, setAllowCreateTeams] = useState(false)
  const [allowJoinTeams, setAllowJoinTeams] = useState(false)
  const [maxTeamSize, setMaxTeamSize] = useState(DEFAULT_MAX_TEAM_SIZE)
  const [savedAllowCreate, setSavedAllowCreate] = useState(false)
  const [savedAllowJoin, setSavedAllowJoin] = useState(false)
  const [savedMaxTeamSize, setSavedMaxTeamSize] = useState(DEFAULT_MAX_TEAM_SIZE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTeams, setSavingTeams] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const data = await kitchensService.getCompetitionCatalog(eventId)
      setRows(data.competitions)
      setSelected(new Set(data.selected_ids))
      const min = data.interest_min ?? 1
      const max = data.interest_max ?? 5
      setInterestMin(min)
      setInterestMax(max)
      setSavedMin(data.interest_min)
      setSavedMax(data.interest_max)
      setRegistrationOpen(Boolean(data.registration_open))
      const create = Boolean(data.allow_create_teams)
      const join = Boolean(data.allow_join_teams)
      const size =
        Number.isFinite(data.max_team_size) && data.max_team_size > 0
          ? data.max_team_size
          : DEFAULT_MAX_TEAM_SIZE
      setAllowCreateTeams(create)
      setAllowJoinTeams(join)
      setMaxTeamSize(size)
      setSavedAllowCreate(create)
      setSavedAllowJoin(join)
      setSavedMaxTeamSize(size)
    } catch {
      toast.error('تعذر تحميل مسابقات المكتبة')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.labelEn.toLowerCase().includes(q) ||
        r.labelTr.toLowerCase().includes(q) ||
        String(r.id).includes(q),
    )
  }, [rows, search])

  const dirty = useMemo(() => {
    const initial = new Set(rows.filter((r) => r.selected).map((r) => r.id))
    if (interestMin !== (savedMin ?? 1) || interestMax !== (savedMax ?? 5)) return true
    if (initial.size !== selected.size) return true
    for (const id of selected) {
      if (!initial.has(id)) return true
    }
    return false
  }, [rows, selected, interestMin, interestMax, savedMin, savedMax])

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of filtered) next.add(r.id)
      return next
    })
  }

  const clearVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of filtered) next.delete(r.id)
      return next
    })
  }

  const teamSettingsDirty =
    allowCreateTeams !== savedAllowCreate ||
    allowJoinTeams !== savedAllowJoin ||
    maxTeamSize !== savedMaxTeamSize

  const handleSave = async () => {
    if (interestMin < 1 || interestMax < interestMin || interestMax > 20) {
      toast.error('الحد الأدنى/الأقصى غير صالح (1 ≤ أدنى ≤ أقصى ≤ 20)')
      return
    }
    if (selected.size < interestMin) {
      toast.error(`اختر على الأقل ${interestMin} مسابقة متاحة`)
      return
    }
    setSaving(true)
    try {
      const ids = [...selected].sort((a, b) => a - b)
      const result = await kitchensService.setKitchenCompetitions(
        eventId,
        ids,
        interestMin,
        interestMax,
      )
      toast.success(
        result.registration_open
          ? `تم الحفظ — التسجيل مفتوح (${ids.length} مسابقة، ${interestMin}–${interestMax} اهتمام)`
          : 'تم الحفظ',
      )
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر حفظ المسابقات')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTeamSettings = async () => {
    if (!Number.isFinite(maxTeamSize) || maxTeamSize < 1 || maxTeamSize > 50) {
      toast.error('الحد الأقصى لأعضاء الفريق يجب أن يكون بين 1 و 50')
      return
    }
    setSavingTeams(true)
    try {
      await kitchensService.setKitchenTeamSettings(eventId, {
        allow_create_teams: allowCreateTeams,
        allow_join_teams: allowJoinTeams,
        max_team_size: maxTeamSize,
      })
      toast.success('تم حفظ إعدادات الفرق')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر حفظ إعدادات الفرق')
    } finally {
      setSavingTeams(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Trophy}
        title="مسابقات المطبخ وقواعد الاهتمام"
        description="حدّد المسابقات المتاحة، والحد الأدنى والأقصى لما يختاره الملتحقون بالقائمة كاهتمامات. لا يمكن إنشاء فرق أو الانضمام قبل حفظ هذه القواعد."
      >
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span
            className={`inline-flex items-center gap-1.5 text-sm ${
              registrationOpen ? 'text-green-400' : 'text-teknofest-orange'
            }`}
          >
            {registrationOpen ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {registrationOpen
              ? 'التسجيل مفتوح للأعضاء'
              : 'التسجيل مغلق — احفظ مسابقات + حد أدنى/أقصى صالحين'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-teknofest-cyan">
            <CheckSquare className="w-4 h-4" />
            محدد: <strong className="text-white">{selected.size}</strong> من {rows.length}
          </span>
        </div>
      </AdminPageHeader>

      <div className="card space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-teknofest-cyan" />
          حدود الاهتمام
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm text-gray-300">
            الحد الأدنى لاهتمامات الفرد
            <input
              type="number"
              min={1}
              max={20}
              value={interestMin}
              onChange={(e) => setInterestMin(Number(e.target.value))}
              className="input-field mt-1"
            />
          </label>
          <label className="block text-sm text-gray-300">
            الحد الأقصى لاهتمامات الفرد
            <input
              type="number"
              min={1}
              max={20}
              value={interestMax}
              onChange={(e) => setInterestMax(Number(e.target.value))}
              className="input-field mt-1"
            />
          </label>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-teknofest-orange" />
              إعدادات الفرق
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              افتراضياً لا يُنشئ الأعضاء فرقاً ولا ينضمون بأنفسهم — المدير يفرز في أي وقت. بعد
              الانضمام لا يمكن المغادرة ذاتياً.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSaveTeamSettings()}
            disabled={savingTeams || !teamSettingsDirty}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
          >
            {savingTeams ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ إعدادات الفرق
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/30 cursor-pointer">
            <input
              type="checkbox"
              checked={allowCreateTeams}
              onChange={(e) => setAllowCreateTeams(e.target.checked)}
              className="mt-1 accent-teknofest-orange"
            />
            <span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teknofest-orange" />
                السماح بإنشاء الفرق
              </span>
              <span className="block text-gray-400 text-xs mt-1">
                الأعضاء يستطيعون إنشاء فرق جديدة بأنفسهم
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/30 cursor-pointer">
            <input
              type="checkbox"
              checked={allowJoinTeams}
              onChange={(e) => setAllowJoinTeams(e.target.checked)}
              className="mt-1 accent-teknofest-cyan"
            />
            <span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-teknofest-cyan" />
                السماح بالانضمام للفرق
              </span>
              <span className="block text-gray-400 text-xs mt-1">
                الأعضاء يستطيعون الانضمام لفريق موجود فيه مقاعد
              </span>
            </span>
          </label>
        </div>

        <label className="block text-sm text-gray-300 max-w-xs">
          الحد الأقصى لأعضاء الفريق
          <input
            type="number"
            min={1}
            max={50}
            value={maxTeamSize}
            onChange={(e) => setMaxTeamSize(Number(e.target.value))}
            className="input-field mt-1"
          />
          <span className="text-xs text-gray-500 mt-1 block">الافتراضي 8 إن لم يُعدَّل</span>
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرقم…"
            className="input-field pr-10"
          />
        </div>
        <button type="button" onClick={selectVisible} className="btn-secondary text-sm">
          تحديد الظاهر
        </button>
        <button type="button" onClick={clearVisible} className="btn-secondary text-sm">
          إلغاء الظاهر
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !dirty}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ القواعد
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <ul className="divide-y divide-teknofest-light-blue/10 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-10 text-center text-gray-500">لا نتائج</li>
          ) : (
            filtered.map((row) => {
              const on = selected.has(row.id)
              const href = libraryCompetitionUrl(String(row.id))
              return (
                <li key={row.id} className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className={`flex-1 flex items-start gap-3 px-4 py-3 text-right transition-colors ${
                      on ? 'bg-teknofest-orange/10' : 'hover:bg-teknofest-medium-blue/40'
                    }`}
                  >
                    {on ? (
                      <CheckSquare className="w-5 h-5 text-teknofest-orange shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{row.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        #{row.id}
                        {row.labelEn && row.labelEn !== row.label ? ` · ${row.labelEn}` : ''}
                      </p>
                    </div>
                  </button>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 flex items-center text-teknofest-cyan hover:bg-teknofest-medium-blue/40"
                      title="فتح في المكتبة"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : null}
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
