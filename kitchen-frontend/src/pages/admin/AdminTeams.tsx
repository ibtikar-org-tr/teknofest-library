import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Users,
  Search,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  UserMinus,
  ArrowLeftRight,
  CheckCircle2,
  FileText,
  Gavel,
  Star,
  Trophy,
  Hash,
} from 'lucide-react'
import {
  emailService,
  kitchensService,
  teamsService,
  type AdminStageOverview,
  type AdminTeamOverview,
} from '../../services/api'
import type { TeamMember } from '../../types'
import AdminPageHeader from '../../components/AdminPageHeader'

const STAGE_LABEL = { primary: 'المرحلة الأولية', final: 'المرحلة النهائية' } as const

export default function AdminTeams() {
  const { eventId = '' } = useParams()
  const [teams, setTeams] = useState<AdminTeamOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)
  const [telegramLink, setTelegramLink] = useState('')
  const [sendingEmail, setSendingEmail] = useState<number | null>(null)
  const [busyMemberId, setBusyMemberId] = useState<number | null>(null)
  const [acceptingProjectId, setAcceptingProjectId] = useState<number | null>(null)
  const [movingMember, setMovingMember] = useState<{
    member: TeamMember
    fromTeamId: number
  } | null>(null)
  const [moveTargetId, setMoveTargetId] = useState('')

  const reload = useCallback(async () => {
    if (!eventId) return
    const data = await kitchensService.getTeams(eventId)
    setTeams(data)
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    ;(async () => {
      try {
        await reload()
      } catch {
        if (!cancelled) toast.error('حدث خطأ في تحميل الفرق')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eventId, reload])

  const filteredTeams = useMemo(
    () =>
      teams.filter(
        (team) =>
          team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (team.field || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (team.field_label || '').toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [teams, searchTerm],
  )

  const handleSendTelegramLink = async (team: AdminTeamOverview) => {
    if (!telegramLink) {
      toast.error('يرجى إدخال رابط التلغرام')
      return
    }
    setSendingEmail(team.id!)
    try {
      const emails = (team.members ?? []).map((m) => m.email)
      await emailService.send(
        emails,
        `رابط مجموعة التلغرام - فريق ${team.team_name}`,
        `مرحباً بكم في فريق ${team.team_name}!\n\nرابط مجموعة التلغرام: ${telegramLink}`,
        telegramLink,
      )
      await teamsService.sendTelegramLink(team.id!, telegramLink)
      toast.success('تم إرسال الرابط بنجاح')
      setTelegramLink('')
      await reload()
    } catch {
      toast.error('حدث خطأ في إرسال الرابط')
    } finally {
      setSendingEmail(null)
    }
  }

  const handleRemove = async (teamId: number, member: TeamMember) => {
    if (!member.id || !eventId) return
    const ok = window.confirm(
      `إزالة ${member.full_name} من الفريق؟ لا يمكن للعضو مغادرة الفريق بنفسه.`,
    )
    if (!ok) return
    setBusyMemberId(member.id)
    try {
      await kitchensService.removeTeamMember(eventId, teamId, member.id)
      toast.success('تمت إزالة العضو')
      await reload()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر إزالة العضو')
    } finally {
      setBusyMemberId(null)
    }
  }

  const handleMove = async () => {
    if (!movingMember?.member.id || !eventId || !moveTargetId) return
    setBusyMemberId(movingMember.member.id)
    try {
      await kitchensService.moveTeamMember(
        eventId,
        movingMember.member.id,
        Number(moveTargetId),
      )
      toast.success('تم نقل العضو')
      setMovingMember(null)
      setMoveTargetId('')
      await reload()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر نقل العضو')
    } finally {
      setBusyMemberId(null)
    }
  }

  const handleAccept = async (stage: AdminStageOverview) => {
    if (!eventId || !stage.can_accept) return
    const ok = window.confirm(
      `اعتماد نتيجة ${STAGE_LABEL[stage.stage]} (متوسط ${stage.jury_average?.toFixed(1)}) ونشرها في لوحة المتصدرين؟`,
    )
    if (!ok) return
    setAcceptingProjectId(stage.project_id)
    try {
      await kitchensService.acceptStageScore(eventId, stage.project_id)
      toast.success('تم اعتماد النتيجة ونشرها')
      await reload()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر اعتماد النتيجة')
    } finally {
      setAcceptingProjectId(null)
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
        icon={Users}
        title="الفرق"
        description="الأعضاء، التقديمات، درجات المحكّمين والملاحظات، واعتماد النتيجة للنشر في لوحة المتصدرين (لكل مرحلة على حدة)."
      />

      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="بحث عن فريق أو مسابقة…"
          className="input-field pr-12"
        />
      </div>

      <div className="space-y-4">
        {filteredTeams.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            لا توجد فرق
          </div>
        ) : (
          filteredTeams.map((team) => {
            const open = expandedTeam === team.id
            const pendingAccept =
              (team.stages.primary?.can_accept ? 1 : 0) +
              (team.stages.final?.can_accept ? 1 : 0)
            return (
              <div key={team.id} className="card p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedTeam(open ? null : team.id!)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-right hover:bg-teknofest-medium-blue/30"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-teknofest-cyan/15 text-teknofest-cyan flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-white font-bold truncate flex items-center gap-2">
                        {team.team_name}
                        {pendingAccept > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-teknofest-orange/20 text-teknofest-orange font-medium">
                            <Star className="w-3 h-3" />
                            اعتماد
                          </span>
                        ) : null}
                      </p>
                      <p className="text-gray-400 text-sm truncate flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 shrink-0" />
                          {team.field_label || team.field || 'لم تُختر مسابقة بعد'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 shrink-0" />
                          {team.member_count} أعضاء
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Gavel className="w-3.5 h-3.5 shrink-0" />
                          {team.assigned_juries.length} محكّم
                        </span>
                      </p>
                    </div>
                  </div>
                  {open ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>

                {open ? (
                  <div className="border-t border-teknofest-light-blue/15 px-5 py-5 space-y-8">
                    {/* Members */}
                    <section className="space-y-3">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-teknofest-cyan" />
                        الأعضاء ({team.members?.length ?? 0})
                      </h3>
                      <ul className="space-y-2">
                        {(team.members ?? []).map((m) => (
                          <li
                            key={m.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-teknofest-dark-blue/40"
                          >
                            <div className="min-w-0 text-sm">
                              <p className="text-white font-medium">
                                {m.full_name}
                                {m.is_leader ? (
                                  <span className="text-teknofest-orange text-xs mr-2">قائد</span>
                                ) : null}
                              </p>
                              <p className="text-gray-400 truncate">
                                {m.email}
                                {m.membership_number ? ` · ${m.membership_number}` : ''}
                                {m.phone ? ` · ${m.phone}` : ''}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={busyMemberId === m.id}
                                onClick={() => {
                                  setMovingMember({ member: m, fromTeamId: team.id! })
                                  setMoveTargetId('')
                                }}
                                className="btn-secondary text-xs py-1.5 px-2 flex items-center gap-1"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                نقل
                              </button>
                              <button
                                type="button"
                                disabled={busyMemberId === m.id}
                                onClick={() => void handleRemove(team.id!, m)}
                                className="btn-secondary text-xs py-1.5 px-2 flex items-center gap-1 text-red-300"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                إزالة
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Stages + jury */}
                    <section className="space-y-4">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teknofest-orange" />
                        التقديم والتحكيم
                      </h3>
                      {(['primary', 'final'] as const).map((key) => (
                        <StageBlock
                          key={key}
                          stage={team.stages[key]}
                          label={STAGE_LABEL[key]}
                          accepting={acceptingProjectId}
                          onAccept={handleAccept}
                        />
                      ))}
                      {team.assigned_juries.length === 0 ? (
                        <p className="text-sm text-teknofest-orange">
                          لا محكّمين معيّنين لهذا الفريق — عيّن محكّمين من تبويب المحكمون قبل
                          الاعتماد.
                        </p>
                      ) : null}
                    </section>

                    {/* Telegram */}
                    <section className="space-y-3">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-teknofest-cyan" />
                        تلغرام
                      </h3>
                      {team.telegram_group_link ? (
                        <p className="text-sm text-gray-400 break-all">{team.telegram_group_link}</p>
                      ) : null}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={telegramLink}
                          onChange={(e) => setTelegramLink(e.target.value)}
                          placeholder="رابط مجموعة التلغرام"
                          className="input-field flex-1"
                        />
                        <button
                          type="button"
                          disabled={sendingEmail === team.id}
                          onClick={() => void handleSendTelegramLink(team)}
                          className="btn-primary flex items-center justify-center gap-2"
                        >
                          {sendingEmail === team.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          إرسال
                        </button>
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>

      {movingMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card max-w-md w-full space-y-4">
            <h3 className="text-white font-bold">نقل {movingMember.member.full_name}</h3>
            <select
              className="input-field"
              value={moveTargetId}
              onChange={(e) => setMoveTargetId(e.target.value)}
            >
              <option value="">اختر الفريق الهدف</option>
              {teams
                .filter((t) => t.id !== movingMember.fromTeamId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.team_name}
                  </option>
                ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMovingMember(null)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!moveTargetId}
                onClick={() => void handleMove()}
              >
                تأكيد النقل
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StageBlock({
  stage,
  label,
  accepting,
  onAccept,
}: {
  stage: AdminStageOverview | null
  label: string
  accepting: number | null
  onAccept: (stage: AdminStageOverview) => void
}) {
  if (!stage) {
    return (
      <div className="rounded-xl border border-teknofest-light-blue/15 p-4 text-sm text-gray-500">
        {label}: لم يُقدَّم بعد
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-teknofest-light-blue/20 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-white font-semibold">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {stage.files_count} ملف · محكّمون {stage.scored_jury_count}/{stage.required_jury_count}
            {stage.jury_average != null
              ? ` · متوسط ${stage.jury_average.toFixed(1)}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stage.score_accepted ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              معتمد ومنشور
            </span>
          ) : stage.can_accept ? (
            <button
              type="button"
              disabled={accepting === stage.project_id}
              onClick={() => onAccept(stage)}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              {accepting === stage.project_id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Star className="w-3.5 h-3.5" />
              )}
              اعتماد النتيجة
            </button>
          ) : (
            <span className="text-xs text-gray-500">بانتظار اكتمال تحكيم المحكّمين</span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-300 whitespace-pre-wrap">{stage.summary}</p>

      <div className="space-y-2">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Gavel className="w-3.5 h-3.5" />
          تقييمات المحكّمين
        </p>
        {stage.evaluations.length === 0 ? (
          <p className="text-xs text-gray-600">لا محكّمين معيّنين</p>
        ) : (
          <ul className="space-y-2">
            {stage.evaluations.map((ev) => (
              <li
                key={ev.membership_number}
                className="rounded-lg bg-teknofest-dark-blue/50 p-3 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="text-white">
                    {ev.full_name || ev.membership_number}
                  </span>
                  <span className={ev.evaluated ? 'text-teknofest-cyan font-medium' : 'text-gray-500'}>
                    {ev.evaluated ? ev.score : 'لم يقيّم'}
                  </span>
                </div>
                {ev.notes ? (
                  <p className="text-gray-400 text-xs mt-1 whitespace-pre-wrap">{ev.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
