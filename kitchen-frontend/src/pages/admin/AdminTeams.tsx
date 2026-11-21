import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { teamsService, emailService, kitchensService } from '../../services/api'
import type { Team, TeamMember } from '../../types'

export default function AdminTeams() {
  const { eventId = '' } = useParams()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)
  const [telegramLink, setTelegramLink] = useState('')
  const [sendingEmail, setSendingEmail] = useState<number | null>(null)
  const [busyMemberId, setBusyMemberId] = useState<number | null>(null)
  const [movingMember, setMovingMember] = useState<{
    member: TeamMember
    fromTeamId: number
  } | null>(null)
  const [moveTargetId, setMoveTargetId] = useState('')

  const reload = async () => {
    if (!eventId) return
    const data = await teamsService.getAll(eventId)
    setTeams(data)
  }

  useEffect(() => {
    if (!eventId) return
    const fetchTeams = async () => {
      try {
        await reload()
      } catch {
        toast.error('حدث خطأ في تحميل الفرق')
      } finally {
        setLoading(false)
      }
    }

    void fetchTeams()
  }, [eventId])

  const filteredTeams = teams.filter(
    (team) =>
      team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.field || '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSendTelegramLink = async (team: Team) => {
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

      setTeams((prev) =>
        prev.map((t) =>
          t.id === team.id ? { ...t, telegram_group_link: telegramLink } : t,
        ),
      )
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
      toast.success('تم إزالة العضو من الفريق')
      await reload()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر إزالة العضو')
    } finally {
      setBusyMemberId(null)
    }
  }

  const handleMove = async () => {
    if (!movingMember?.member.id || !eventId || !moveTargetId) return
    const toTeamId = Number(moveTargetId)
    setBusyMemberId(movingMember.member.id)
    try {
      await kitchensService.moveTeamMember(eventId, movingMember.member.id, toTeamId)
      toast.success('تم نقل العضو إلى الفريق الآخر')
      setMovingMember(null)
      setMoveTargetId('')
      await reload()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر نقل العضو')
    } finally {
      setBusyMemberId(null)
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
          <h1 className="text-2xl font-bold text-white">إدارة الفرق</h1>
          <p className="text-gray-400">
            الأعضاء لا يغادرون بأنفسهم — فقط المدير يمكنه الإزالة أو النقل بين الفرق.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-teknofest-orange/20 text-teknofest-orange rounded-lg">
          <Users className="w-5 h-5" />
          <span className="font-medium">{teams.length} فريق</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="البحث عن فريق..."
          className="input-field pr-12"
        />
      </div>

      {filteredTeams.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">لا توجد فرق للعرض</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTeams.map((team) => (
            <div key={team.id} className="card">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id!)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={
                      team.gender === 'male'
                        ? 'w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center'
                        : 'w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'
                    }
                  >
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {team.team_name} - {team.gender === 'male' ? 'ذكور' : 'إناث'}
                    </h3>
                    <p className="text-gray-400 text-sm">{team.field || 'لم تُختر مسابقة بعد'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">
                    {team.members?.length ?? 0} أعضاء
                  </span>
                  {team.telegram_group_link && (
                    <MessageCircle className="w-5 h-5 text-green-400" />
                  )}
                  {expandedTeam === team.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedTeam === team.id && (
                <div className="mt-6 pt-6 border-t border-teknofest-light-blue/20 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-teknofest-dark-blue/50 rounded-xl">
                      <p className="text-gray-400 text-sm mb-1">نوع التسجيل</p>
                      <p className="text-white">
                        {team.registration_type === 'team_with_idea'
                          ? 'فريق لديه فكرة'
                          : 'فريق بدون فكرة'}
                      </p>
                    </div>
                    <div className="p-4 bg-teknofest-dark-blue/50 rounded-xl">
                      <p className="text-gray-400 text-sm mb-1">تاريخ التسجيل</p>
                      <p className="text-white">
                        {team.created_at
                          ? new Date(team.created_at).toLocaleDateString('ar-SA')
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {team.initial_idea && (
                    <div className="p-4 bg-teknofest-dark-blue/50 rounded-xl">
                      <p className="text-gray-400 text-sm mb-2">فكرة المشروع</p>
                      <p className="text-white">{team.initial_idea}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-white font-medium mb-3">أعضاء الفريق</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(team.members ?? []).map((member) => (
                        <div
                          key={member.id ?? member.email}
                          className={`p-3 rounded-xl border space-y-2 ${
                            member.is_leader
                              ? 'bg-teknofest-orange/10 border-teknofest-orange/30'
                              : 'bg-teknofest-dark-blue/50 border-teknofest-light-blue/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{member.full_name}</span>
                            {member.is_leader && (
                              <span className="text-xs px-2 py-0.5 bg-teknofest-orange text-white rounded">
                                مشرف
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{member.email}</p>
                          <p className="text-gray-400 text-sm" dir="ltr">
                            {member.phone}
                          </p>
                          {member.id ? (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                className="btn-secondary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"
                                disabled={busyMemberId === member.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setMovingMember({ member, fromTeamId: team.id! })
                                  setMoveTargetId('')
                                }}
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                نقل
                              </button>
                              <button
                                type="button"
                                className="btn-secondary text-xs py-1.5 flex-1 flex items-center justify-center gap-1 text-red-300"
                                disabled={busyMemberId === member.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void handleRemove(team.id!, member)
                                }}
                              >
                                {busyMemberId === member.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UserMinus className="w-3.5 h-3.5" />
                                )}
                                إزالة
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-teknofest-dark-blue/50 rounded-xl">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-teknofest-cyan" />
                      رابط التلغرام
                    </h4>
                    {team.telegram_group_link ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">تم الإرسال:</span>
                        <a
                          href={team.telegram_group_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teknofest-cyan hover:underline"
                        >
                          {team.telegram_group_link}
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={telegramLink}
                          onChange={(e) => setTelegramLink(e.target.value)}
                          placeholder="https://t.me/..."
                          className="input-field flex-1"
                          dir="ltr"
                        />
                        <button
                          onClick={() => handleSendTelegramLink(team)}
                          disabled={sendingEmail === team.id}
                          className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                          {sendingEmail === team.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          إرسال للأعضاء
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {movingMember && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">نقل العضو</h3>
            <p className="text-gray-400 text-sm">
              نقل <span className="text-white">{movingMember.member.full_name}</span> إلى فريق آخر
            </p>
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
                    {t.team_name} ({t.members?.length ?? 0}/6)
                  </option>
                ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMovingMember(null)
                  setMoveTargetId('')
                }}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn-primary disabled:opacity-50"
                disabled={!moveTargetId || busyMemberId === movingMember.member.id}
                onClick={() => void handleMove()}
              >
                تأكيد النقل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
