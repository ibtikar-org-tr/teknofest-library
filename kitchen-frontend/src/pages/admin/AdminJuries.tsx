import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2, Search, Trash2, UserPlus, Users, Save } from 'lucide-react'
import { kitchensService, type EventJury, type EventRegistrant } from '../../services/api'
import type { Team } from '../../types'

export default function AdminJuries() {
  const { eventId = '' } = useParams()
  const [juries, setJuries] = useState<EventJury[]>([])
  const [registrants, setRegistrants] = useState<EventRegistrant[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState('')
  const [adding, setAdding] = useState(false)
  const [savingMember, setSavingMember] = useState<string | null>(null)
  const [draftTeams, setDraftTeams] = useState<Record<string, number[]>>({})

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const [juryList, registrantList, teamList] = await Promise.all([
        kitchensService.listJuries(eventId),
        kitchensService.getRegistrants(eventId),
        kitchensService.getTeams(eventId),
      ])
      setJuries(juryList)
      setRegistrants(registrantList)
      setTeams(teamList)
      const drafts: Record<string, number[]> = {}
      for (const j of juryList) {
        drafts[j.membership_number] = [...j.team_ids]
      }
      setDraftTeams(drafts)
    } catch {
      toast.error('تعذر تحميل المحكمين')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  const appointed = useMemo(
    () => new Set(juries.map((j) => j.membership_number)),
    [juries],
  )

  const availableRegistrants = useMemo(() => {
    const q = search.trim().toLowerCase()
    return registrants
      .filter((r) => !appointed.has(r.membership_number))
      .filter((r) => {
        if (!q) return true
        return (
          r.full_name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.membership_number.toLowerCase().includes(q)
        )
      })
  }, [registrants, appointed, search])

  const handleAdd = async () => {
    if (!selectedMember) {
      toast.error('اختر مسجلاً لتعيينه محكماً')
      return
    }
    const reg = registrants.find((r) => r.membership_number === selectedMember)
    setAdding(true)
    try {
      await kitchensService.addJury(eventId, {
        membership_number: selectedMember,
        full_name: reg?.full_name,
        email: reg?.email,
      })
      toast.success('تم تعيين المحكم')
      setSelectedMember('')
      await load()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'تعذر تعيين المحكم')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (membershipNumber: string) => {
    if (!confirm('إزالة هذا المحكم وجميع تعيينات الفرق؟')) return
    try {
      await kitchensService.removeJury(eventId, membershipNumber)
      toast.success('تمت إزالة المحكم')
      await load()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'تعذر إزالة المحكم')
    }
  }

  const toggleTeam = (membershipNumber: string, teamId: number) => {
    setDraftTeams((prev) => {
      const current = prev[membershipNumber] ?? []
      const next = current.includes(teamId)
        ? current.filter((id) => id !== teamId)
        : [...current, teamId]
      return { ...prev, [membershipNumber]: next }
    })
  }

  const handleSaveTeams = async (membershipNumber: string) => {
    setSavingMember(membershipNumber)
    try {
      const teamIds = draftTeams[membershipNumber] ?? []
      await kitchensService.setJuryTeams(eventId, membershipNumber, teamIds)
      toast.success('تم حفظ تعيينات الفرق')
      await load()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'تعذر حفظ التعيينات')
    } finally {
      setSavingMember(null)
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
      <div>
        <h1 className="text-2xl font-bold text-white">المحكمون</h1>
        <p className="text-gray-400 mt-1">
          عيّن محكمين من مسجلي الفعالية، ثم اربط كل محكم بالفرق التي يقيّمها. التقييم النهائي =
          متوسط درجات المحكمين فقط.
        </p>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-teknofest-cyan" />
          إضافة محكم
        </h2>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pr-10"
            placeholder="بحث في المسجلين..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="input-field flex-1"
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
          >
            <option value="">اختر مسجلاً...</option>
            {availableRegistrants.map((r) => (
              <option key={r.membership_number} value={r.membership_number}>
                {r.full_name} — {r.membership_number}
                {r.email ? ` (${r.email})` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={adding || !selectedMember}
            className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            تعيين
          </button>
        </div>
        {availableRegistrants.length === 0 && (
          <p className="text-sm text-gray-500">لا يوجد مسجلون متاحون للإضافة (أو الجميع معيّنون).</p>
        )}
      </div>

      {juries.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          لا يوجد محكمون بعد
        </div>
      ) : (
        <div className="space-y-4">
          {juries.map((jury) => {
            const selected = new Set(draftTeams[jury.membership_number] ?? [])
            return (
              <div key={jury.membership_number} className="card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-white font-bold">
                      {jury.full_name || jury.membership_number}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {jury.membership_number}
                      {jury.email ? ` · ${jury.email}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveTeams(jury.membership_number)}
                      disabled={savingMember === jury.membership_number}
                      className="btn-primary text-sm py-2 flex items-center gap-1 disabled:opacity-50"
                    >
                      {savingMember === jury.membership_number ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      حفظ الفرق
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemove(jury.membership_number)}
                      className="btn-secondary text-sm py-2 text-red-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      إزالة
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">الفرق المعيّنة للتحكيم</p>
                  {teams.length === 0 ? (
                    <p className="text-sm text-gray-500">لا توجد فرق في هذا المطبخ بعد.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {teams.map((team) => {
                        const id = team.id!
                        const checked = selected.has(id)
                        return (
                          <label
                            key={id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                              checked
                                ? 'border-teknofest-orange bg-teknofest-orange/10'
                                : 'border-teknofest-light-blue/20 hover:border-teknofest-cyan/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTeam(jury.membership_number, id)}
                              className="accent-teknofest-orange"
                            />
                            <span className="text-sm text-white truncate">{team.team_name}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
