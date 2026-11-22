import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Check,
  Copy,
  Gavel,
  Loader2,
  MessageCircle,
  Minus,
  Save,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react'
import {
  kitchensService,
  type EventJury,
  type EventRegistrant,
  type EventTeamStageIndex,
  type JuryTeamDuty,
} from '../../services/api'
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

/** Compact stage mark: empty = no report, cyan = report in, green check = this jury scored. */
function StageMark({
  label,
  submitted,
  scored,
  title,
}: {
  label: string
  submitted: boolean
  scored: boolean
  title: string
}) {
  const tip = (status: string) => (title ? `${title}: ${status}` : status)
  if (!submitted) {
    return (
      <span
        title={tip('لم يُسلَّم')}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-600/70 text-[10px] font-bold text-gray-500"
      >
        {label}
      </span>
    )
  }
  if (scored) {
    return (
      <span
        title={tip('سُلّم · حكّم')}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    )
  }
  return (
    <span
      title={tip('سُلّم · بانتظار التحكيم')}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-teknofest-cyan/70 bg-teknofest-cyan/15 text-[10px] font-bold text-teknofest-cyan"
    >
      {label}
    </span>
  )
}

function DutyBar({ done, required }: { done: number; required: number }) {
  if (required <= 0) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-gray-500"
        title="لا تقارير مُسلَّمة على الفرق المعيّنة بعد"
      >
        <Minus className="h-3.5 w-3.5" />
        <span>لا واجب بعد</span>
      </div>
    )
  }
  const pct = Math.min(100, Math.round((done / required) * 100))
  const complete = done >= required
  return (
    <div className="min-w-[140px] space-y-1" title={`أنجز ${done} من ${required}`}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={complete ? 'text-emerald-300 font-semibold' : 'text-gray-300'}>
          {done}/{required}
        </span>
        <span className="text-gray-500">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-teknofest-dark-blue/80 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            complete ? 'bg-emerald-400' : 'bg-teknofest-orange'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function teamDutyMap(jury: EventJury): Map<number, JuryTeamDuty> {
  const map = new Map<number, JuryTeamDuty>()
  for (const d of jury.team_duties ?? []) {
    map.set(d.team_id, d)
  }
  return map
}

export default function AdminJuries() {
  const { eventId = '' } = useParams()
  const [juries, setJuries] = useState<EventJury[]>([])
  const [teamsIndex, setTeamsIndex] = useState<EventTeamStageIndex[]>([])
  const [managerTelegram, setManagerTelegram] = useState<string | null>(null)
  const [managerMembership, setManagerMembership] = useState<string | null>(null)
  const [registrants, setRegistrants] = useState<EventRegistrant[]>([])
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
      const [juryPayload, registrantList] = await Promise.all([
        kitchensService.listJuries(eventId),
        kitchensService.getRegistrants(eventId),
      ])
      setJuries(juryPayload.juries)
      setTeamsIndex(juryPayload.teams_index ?? [])
      setManagerTelegram(juryPayload.manager.telegram_username)
      setManagerMembership(juryPayload.manager.membership_number)
      setRegistrants(registrantList)
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

  const handleAdd = async () => {
    if (!eventId || !selectedMember) return
    const reg = registrants.find((r) => r.membership_number === selectedMember)
    if (!reg) return
    setAdding(true)
    try {
      await kitchensService.addJury(eventId, {
        membership_number: reg.membership_number,
        full_name: reg.full_name,
        email: reg.email,
      })
      toast.success('تم تعيين المحكم')
      setSelectedMember('')
      await load()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'تعذر التعيين'
      toast.error(msg)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (membershipNumber: string) => {
    if (!eventId) return
    if (!window.confirm('إزالة هذا المحكم وجميع تعيينات فرقه؟')) return
    try {
      await kitchensService.removeJury(eventId, membershipNumber)
      toast.success('تمت الإزالة')
      await load()
    } catch {
      toast.error('تعذر الإزالة')
    }
  }

  const toggleTeam = (membershipNumber: string, teamId: number) => {
    setDraftTeams((prev) => {
      const current = new Set(prev[membershipNumber] ?? [])
      if (current.has(teamId)) current.delete(teamId)
      else current.add(teamId)
      return { ...prev, [membershipNumber]: [...current] }
    })
  }

  const handleSaveTeams = async (membershipNumber: string) => {
    if (!eventId) return
    setSavingMember(membershipNumber)
    try {
      await kitchensService.setJuryTeams(
        eventId,
        membershipNumber,
        draftTeams[membershipNumber] ?? [],
      )
      toast.success('تم حفظ الفرق')
      await load()
    } catch {
      toast.error('تعذر حفظ الفرق')
    } finally {
      setSavingMember(null)
    }
  }

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`تم نسخ ${label}`)
    } catch {
      toast.error('تعذر النسخ')
    }
  }

  const openTelegram = (jury: EventJury) => {
    const username = jury.telegram_username?.trim().replace(/^@+/, '')
    if (!username) {
      toast.error('لا يوجد @username لهذا المحكم')
      return
    }
    window.open(
      buildJuryTelegramDmUrl(username, managerTelegram, managerMembership),
      '_blank',
      'noopener,noreferrer',
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teknofest-cyan" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Gavel}
        title="المحكمون"
        description="عيّن محكمين من مسجلي الفعالية، اربط كل محكم بالفرق، وتابع إنجاز التحكيم عبر رموز المراحل بجانب كل فريق."
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

      <div className="card flex flex-wrap items-center gap-3 text-xs text-gray-400">
        <span className="text-gray-300 font-medium">دليل الرموز:</span>
        <span className="inline-flex items-center gap-1.5">
          <StageMark label="١" submitted={false} scored={false} title="" />
          لم يُسلَّم
        </span>
        <span className="inline-flex items-center gap-1.5">
          <StageMark label="١" submitted scored={false} title="" />
          تقرير أول بانتظار التحكيم
        </span>
        <span className="inline-flex items-center gap-1.5">
          <StageMark label="ن" submitted scored={false} title="" />
          نهائي بانتظار التحكيم
        </span>
        <span className="inline-flex items-center gap-1.5">
          <StageMark label="١" submitted scored title="" />
          حكّمه هذا المحكم
        </span>
      </div>

      <div className="card space-y-4">
        <h2 className="text-white font-bold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-teknofest-cyan" />
          إضافة محكم من المسجلين
        </h2>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو رقم العضوية…"
            className="input-field w-full pr-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="input-field flex-1 min-w-0"
          >
            <option value="">اختر مسجلاً…</option>
            {availableRegistrants.map((r) => (
              <option key={r.membership_number} value={r.membership_number}>
                {r.full_name || r.membership_number} — {r.membership_number}
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
            const duties = teamDutyMap(jury)
            const required = jury.duty_required ?? 0
            const done = jury.duty_done ?? 0

            return (
              <div key={jury.membership_number} className="card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-teknofest-cyan/15 text-teknofest-cyan flex items-center justify-center shrink-0">
                      <Gavel className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-white font-bold truncate">
                          {jury.full_name || jury.membership_number}
                        </h3>
                        <DutyBar done={done} required={required} />
                      </div>

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
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-sm text-gray-400">الفرق المعيّنة للتحكيم</p>
                    <span className="text-[11px] text-gray-500 inline-flex items-center gap-2" dir="ltr">
                      <span>١ = أول</span>
                      <span>ن = نهائي</span>
                    </span>
                  </div>
                  {teamsIndex.length === 0 ? (
                    <p className="text-sm text-gray-500">لا توجد فرق في هذا المطبخ بعد.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {teamsIndex.map((team) => {
                        const id = team.team_id
                        const checked = selected.has(id)
                        const duty = duties.get(id)
                        const primarySubmitted = duty?.primary.submitted ?? team.primary_submitted
                        const finalSubmitted = duty?.final.submitted ?? team.final_submitted
                        const primaryScored = checked ? Boolean(duty?.primary.scored) : false
                        const finalScored = checked ? Boolean(duty?.final.scored) : false

                        return (
                          <label
                            key={id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors min-w-0 ${
                              checked
                                ? 'border-teknofest-orange bg-teknofest-orange/10'
                                : 'border-teknofest-light-blue/20 hover:border-teknofest-cyan/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTeam(jury.membership_number, id)}
                              className="accent-teknofest-orange shrink-0"
                            />
                            <span className="text-sm text-white truncate flex-1 min-w-0">
                              {team.team_name}
                            </span>
                            <span className="inline-flex items-center gap-1 shrink-0" dir="ltr">
                              <StageMark
                                label="١"
                                submitted={primarySubmitted}
                                scored={primaryScored}
                                title="التقرير الأول"
                              />
                              <StageMark
                                label="ن"
                                submitted={finalSubmitted}
                                scored={finalScored}
                                title="التقرير النهائي"
                              />
                            </span>
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
