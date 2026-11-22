import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Copy,
  Gavel,
  Loader2,
  MessageCircle,
  Save,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { kitchensService, type EventJury, type EventRegistrant } from '../../services/api'
import type { Team } from '../../types'
import AdminPageHeader from '../../components/AdminPageHeader'

function buildJuryTelegramDmUrl(
  juryUsername: string,
  managerUsername: string | null,
  managerMembership: string | null,
): string {
  const lines = [
    'مرحباً، أتواصل معك بخصوص تحكيم مسابقة المطبخ.',
  ]
  if (managerUsername) {
    lines.push(`حسابي على تلغرام: @${managerUsername}`)
  }
  if (managerMembership) {
    lines.push(`رقم عضويتي: ${managerMembership}`)
  }
  if (juryUsername) {
    lines.push(`حسابك على تلغرام (إن وجد): @${juryUsername}`)
  }
  lines.push('يرجى الرد عند التمكّن.')
  return `https://t.me/${encodeURIComponent(juryUsername)}?text=${encodeURIComponent(lines.join('\n'))}`
}

export default function AdminJuries() {
  const { eventId = '' } = useParams()
  const [juries, setJuries] = useState<EventJury[]>([])
  const [managerTelegram, setManagerTelegram] = useState<string | null>(null)
  const [managerMembership, setManagerMembership] = useState<string | null>(null)
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
      const [juryPayload, registrantList, teamList] = await Promise.all([
        kitchensService.listJuries(eventId),
        kitchensService.getRegistrants(eventId),
        kitchensService.getTeams(eventId),
      ])
      setJuries(juryPayload.juries)
      setManagerTelegram(juryPayload.manager.telegram_username)
      setManagerMembership(juryPayload.manager.membership_number)
      setRegistrants(registrantList)
      setTeams(teamList)
      const drafts: Record<string, number[]> = {}
      for (const j of juryPayload.juries) {
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

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`تم نسخ ${label}`)
    } catch {
      toast.error('تعذر النسخ')
    }
  }

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

  const openTelegram = (jury: EventJury) => {
    const username = jury.telegram_username?.trim().replace(/^@+/, '') || ''
    if (!username) {
      toast.error(
        jury.has_telegram
          ? 'المحكم مربوط بتلغرام بدون اسم مستخدم عام — اطلب منه إضافة @username'
          : 'لا يوجد حساب تلغرام معروف لهذا المحكم',
      )
      return
    }
    const url = buildJuryTelegramDmUrl(username, managerTelegram, managerMembership)
    window.open(url, '_blank', 'noopener,noreferrer')
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
        icon={Gavel}
        title="المحكمون"
        description="عيّن محكمين من مسجلي الفعالية، ثم اربط كل محكم بالفرق التي يقيّمها. رقم العضوية ظاهر دائماً، ويمكن مراسلة المحكم على تلغرام إن وُجد اسم مستخدم."
        tone="cyan"
      />

      {managerTelegram ? (
        <p className="text-sm text-gray-400">
          حسابك على تلغرام للمراسلة:{' '}
          <span className="text-teknofest-cyan" dir="ltr">
            @{managerTelegram}
          </span>
        </p>
      ) : (
        <p className="text-sm text-teknofest-orange">
          لم يُعثر على @username لتلغرام لحسابك في VMS — أضفه في الملف الشخصي ليُدرج تلقائياً في رسالة المحكم.
        </p>
      )}

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-teknofest-cyan" />
          إضافة محكم
        </h2>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pr-10"
            placeholder="بحث بالاسم أو رقم العضوية أو البريد..."
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
          <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
          لا يوجد محكمون بعد
        </div>
      ) : (
        <div className="space-y-4">
          {juries.map((jury) => {
            const selected = new Set(draftTeams[jury.membership_number] ?? [])
            const username = jury.telegram_username?.trim().replace(/^@+/, '') || null
            return (
              <div key={jury.membership_number} className="card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-teknofest-cyan/15 text-teknofest-cyan flex items-center justify-center shrink-0">
                      <Gavel className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 space-y-2">
                      <h3 className="text-white font-bold truncate">
                        {jury.full_name || jury.membership_number}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">رقم العضوية</span>
                        <code
                          className="text-sm text-teknofest-cyan bg-teknofest-dark-blue/60 px-2 py-1 rounded"
                          dir="ltr"
                        >
                          {jury.membership_number}
                        </code>
                        <button
                          type="button"
                          className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                          onClick={() =>
                            void copyText(jury.membership_number, 'رقم العضوية')
                          }
                          title="نسخ رقم العضوية"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          نسخ
                        </button>
                      </div>

                      {jury.email ? (
                        <p className="text-sm text-gray-400 truncate" dir="ltr">
                          {jury.email}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {username ? (
                          <>
                            <span className="text-gray-500">تلغرام</span>
                            <a
                              href={`https://t.me/${encodeURIComponent(username)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teknofest-cyan hover:underline"
                              dir="ltr"
                            >
                              @{username}
                            </a>
                            <button
                              type="button"
                              className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                              onClick={() => void copyText(`@${username}`, 'اسم التلغرام')}
                            >
                              <Copy className="w-3.5 h-3.5" />
                              نسخ @
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {jury.has_telegram
                              ? 'تلغرام مربوط بدون @username عام'
                              : 'لا يوجد تلغرام معروف في VMS'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openTelegram(jury)}
                      className="btn-secondary text-sm py-2 flex items-center gap-1"
                      title="فتح محادثة تلغرام مع رسالة تتضمن حسابك"
                    >
                      <MessageCircle className="w-4 h-4" />
                      تلغرام
                    </button>
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
